#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required Firebase environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables or use a .env file.');
    console.error('See scripts/README.md for more information.');
    process.exit(1);
  }
}

// Parse CSV with proper quote handling
function parseCSV(csvContent) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char; // Keep the quote character
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else if (char !== '\r') {
      currentLine += char;
    }
  }
  
  // Add the last line if there's any content
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Parse a CSV line handling quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      // Don't include the quote character itself
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse weight field (handle formats like "1000/32")
function parseWeight(weightStr) {
  if (!weightStr || weightStr.trim() === '') {
    return 0;
  }
  
  // Handle "1000/32" format - use the second number
  if (weightStr.includes('/')) {
    const parts = weightStr.split('/');
    return parseFloat(parts[1]) || 0;
  }
  
  return parseFloat(weightStr) || 0;
}

// Parse CSV file and group by date
function parseWorkoutCSV(csvContent) {
  const lines = parseCSV(csvContent);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  const nameIndex = header.findIndex(h => h.toLowerCase().includes('workout name') || h.toLowerCase().includes('name'));
  const settingsIndex = header.findIndex(h => h.toLowerCase().includes('settings'));
  const dateIndex = header.findIndex(h => h.toLowerCase().includes('date'));
  const weightIndex = header.findIndex(h => h.toLowerCase().includes('weight'));
  const setsIndex = header.findIndex(h => h.toLowerCase().includes('sets'));
  const repsIndex = header.findIndex(h => h.toLowerCase().includes('reps'));
  
  if (nameIndex === -1 || dateIndex === -1 || weightIndex === -1 || setsIndex === -1 || repsIndex === -1) {
    throw new Error('CSV missing required columns. Expected: workout name, date, weight kg, sets, reps');
  }
  
  // Parse data rows
  const exercises = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < Math.max(nameIndex, dateIndex, weightIndex, setsIndex, repsIndex) + 1) {
      console.warn(`⚠️  Skipping invalid line ${i + 1}: insufficient columns`);
      continue;
    }
    
    const name = values[nameIndex];
    const date = values[dateIndex];
    const weight = parseWeight(values[weightIndex]);
    const sets = parseInt(values[setsIndex]) || 0;
    const reps = parseInt(values[repsIndex]) || 0;
    
    if (!name || !date || weight === 0 || sets === 0 || reps === 0) {
      console.warn(`⚠️  Skipping incomplete line ${i + 1}`);
      continue;
    }
    
    exercises.push({
      name,
      settings: settingsIndex !== -1 ? values[settingsIndex] : '',
      date,
      weight,
      sets,
      reps
    });
  }
  
  // Group by date
  const workoutsByDate = {};
  for (const exercise of exercises) {
    if (!workoutsByDate[exercise.date]) {
      workoutsByDate[exercise.date] = [];
    }
    workoutsByDate[exercise.date].push(exercise);
  }
  
  // Create workout documents
  const workouts = [];
  for (const [date, machines] of Object.entries(workoutsByDate)) {
    // Calculate statistics
    const totalWeight = machines.reduce((sum, m) => sum + (m.weight * m.sets * m.reps), 0);
    const avgWeight = machines.reduce((sum, m) => sum + m.weight, 0) / machines.length;
    const machineCount = machines.length;
    
    workouts.push({
      date,
      machines: machines.map(m => ({
        name: m.name,
        settings: m.settings,
        weight: m.weight,
        sets: m.sets,
        reps: m.reps
      })),
      totalWeight: Math.round(totalWeight),
      avgWeight: Math.round(avgWeight * 10) / 10, // Round to 1 decimal
      machineCount,
      createdAt: new Date().toISOString()
    });
  }
  
  // Sort by date
  workouts.sort((a, b) => a.date.localeCompare(b.date));
  
  return { exercises, workouts };
}

// Upload workouts to Firestore
async function uploadWorkouts(db, workouts) {
  console.log(`\n📤 Importing ${workouts.length} workouts to Firestore...`);
  
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (const workout of workouts) {
    try {
      await addDoc(collection(db, 'workouts'), {
        date: workout.date,
        machines: workout.machines,
        totalWeight: workout.totalWeight,
        avgWeight: workout.avgWeight,
        machineCount: workout.machineCount,
        createdAt: workout.createdAt
      });
      
      console.log(`✅ Imported workout: ${workout.date} (${workout.machineCount} machines, ${workout.totalWeight} kg)`);
      results.successful++;
    } catch (error) {
      console.error(`❌ Failed to import workout ${workout.date}:`, error.message);
      results.failed++;
      results.errors.push({ date: workout.date, error: error.message });
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log('🏋️  Gym Tracker CSV Import Tool\n');
  
  // Get CSV file path from command line
  const csvFilePath = process.argv[2];
  
  if (!csvFilePath) {
    console.error('❌ Error: Please provide a CSV file path');
    console.error('\nUsage:');
    console.error('  node import-csv.js <path-to-csv-file>');
    console.error('\nExample:');
    console.error('  node import-csv.js ../workout_log.csv');
    console.error('  node import-csv.js sample-workout.csv');
    process.exit(1);
  }
  
  // Validate Firebase configuration
  validateFirebaseConfig();
  
  // Initialize Firebase
  console.log('🔥 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  console.log('✅ Firebase initialized\n');
  
  // Read CSV file
  let csvContent;
  try {
    const fullPath = resolve(csvFilePath);
    console.log(`📂 Reading CSV file: ${csvFilePath}`);
    csvContent = readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
  }
  
  // Parse CSV
  let parseResult;
  try {
    parseResult = parseWorkoutCSV(csvContent);
  } catch (error) {
    console.error(`❌ Error parsing CSV: ${error.message}`);
    process.exit(1);
  }
  
  const { exercises, workouts } = parseResult;
  
  console.log(`📝 Found ${exercises.length} exercise records`);
  console.log(`📅 Grouped into ${workouts.length} workout days\n`);
  
  // Preview first workout
  if (workouts.length > 0) {
    console.log('📋 Preview of first workout:');
    console.log(JSON.stringify(workouts[0], null, 2));
    console.log('');
  }
  
  // Upload to Firestore
  const results = await uploadWorkouts(db, workouts);
  
  // Print summary
  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Successful: ${results.successful}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📅 Total workout days: ${workouts.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(({ date, error }) => {
      console.log(`   - ${date}: ${error}`);
    });
  }
  
  console.log('\n🎉 Import complete!');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run main function
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
