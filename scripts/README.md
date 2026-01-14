# 📥 CSV Import Script

This directory contains a script to import existing workout data from CSV files into the Gym Tracker Firebase Firestore database.

## 📋 Prerequisites

- Node.js 16.x or higher
- Firebase project with Firestore database configured
- Firebase environment variables (same as the main app)

## 🚀 Quick Start

### 1. Install Dependencies

From the `scripts` directory:

```bash
cd scripts
npm install
```

### 2. Configure Firebase Credentials

The script uses the same Firebase environment variables as the main app. You have two options:

#### Option A: Use Parent Directory .env File

If you have a `.env` file in the parent directory (project root), the script will automatically use those variables when run from the scripts directory:

```bash
# No additional setup needed - script reads from ../env
node import-csv.js your-workout-data.csv
```

#### Option B: Set Environment Variables Directly

Export the variables before running the script:

```bash
export VITE_FIREBASE_API_KEY=your_api_key_here
export VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
export VITE_FIREBASE_PROJECT_ID=your_project_id_here
export VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
export VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
export VITE_FIREBASE_APP_ID=your_app_id_here

node import-csv.js your-workout-data.csv
```

Or provide them inline:

```bash
VITE_FIREBASE_API_KEY=xxx \
VITE_FIREBASE_AUTH_DOMAIN=xxx \
VITE_FIREBASE_PROJECT_ID=xxx \
VITE_FIREBASE_STORAGE_BUCKET=xxx \
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx \
VITE_FIREBASE_APP_ID=xxx \
node import-csv.js your-workout-data.csv
```

### 3. Prepare Your CSV File

Your CSV file should have the following columns:

- `workout name` - Name of the machine/exercise
- `workout settings` - Machine settings (optional, can be empty)
- `date` - Date in YYYY-MM-DD format
- `weight kg` - Weight lifted in kilograms
- `sets` - Number of sets performed
- `reps` - Number of reps per set

#### Example CSV:

```csv
workout name,workout settings,date,weight kg,sets,reps
chest press,6,2024-06-09,22,2,10
seated row,"s 5, c 6",2024-06-09,34,2,10
chin asist,,2024-06-09,1000/32,2,10
leg press,5,2024-06-09,50,3,12
shoulder press,4,2024-06-15,18,2,10
```

#### Special Formats:

- **Quoted values**: Settings with commas should be in quotes (e.g., `"s 5, c 6"`)
- **Empty values**: Leave the field empty if no settings (e.g., `,,`)
- **Assisted exercises**: For assisted exercises where weight is shown as "total/actual" (e.g., `1000/32`), the script will use the second number (32 kg)

A sample CSV file is provided: `sample-workout.csv`

### 4. Run the Import

```bash
node import-csv.js path/to/your-workout-data.csv
```

Examples:

```bash
# Import from a file in the parent directory
node import-csv.js ../workout_log_converted.csv

# Import the sample file
node import-csv.js sample-workout.csv

# Import from an absolute path
node import-csv.js /path/to/your/workouts.csv
```

## 📊 What the Script Does

1. **Reads and parses** the CSV file
2. **Groups exercises** by date into workout sessions
3. **Calculates statistics** for each workout:
   - `totalWeight`: Sum of (weight × sets × reps) for all machines
   - `avgWeight`: Average weight across all machines
   - `machineCount`: Number of machines used in the workout
4. **Uploads to Firestore** as workout documents
5. **Provides progress** updates and a summary

## 🖥️ Example Output

```
🏋️ Gym Tracker CSV Import Tool

🔥 Initializing Firebase...
✅ Firebase initialized

📂 Reading CSV file: workout_log_converted.csv
📝 Found 780 exercise records
📅 Grouped into 75 workout days

📋 Preview of first workout:
{
  "date": "2024-06-09",
  "machines": [
    {
      "name": "chest press",
      "settings": "6",
      "weight": 22,
      "sets": 2,
      "reps": 10
    },
    ...
  ],
  "totalWeight": 8320,
  "avgWeight": 26.5,
  "machineCount": 16,
  "createdAt": "2026-01-14T17:30:00.000Z"
}

📤 Importing 75 workouts to Firestore...
✅ Imported workout: 2024-06-09 (16 machines, 8320 kg)
✅ Imported workout: 2024-06-15 (16 machines, 8640 kg)
...

📊 Import Summary:
   ✅ Successful: 75
   ❌ Failed: 0
   📅 Total workout days: 75

🎉 Import complete!
```

## ⚠️ Troubleshooting

### "Missing required Firebase environment variables"

Make sure you have set all required Firebase environment variables. Check that:
- Your `.env` file exists in the parent directory
- All variables start with `VITE_FIREBASE_`
- Variables are properly exported if using command-line export

### "Error reading file"

- Verify the file path is correct
- Use relative paths from the `scripts` directory (e.g., `../data.csv`)
- Check file permissions

### "CSV missing required columns"

- Ensure your CSV has the exact column names (case-insensitive)
- Required: `workout name`, `date`, `weight kg`, `sets`, `reps`
- Optional: `workout settings`

### "Skipping invalid line" or "Skipping incomplete line"

The script will skip rows that:
- Don't have all required values
- Have invalid numbers (weight, sets, reps = 0)
- Have malformed data

These warnings are normal and the script will continue with valid rows.

### Firebase Connection Errors

- Verify your Firebase credentials are correct
- Check that Firestore is enabled in your Firebase project
- Ensure your network can reach Firebase servers

## 🔒 Security Notes

- The script creates workout documents in the `workouts` collection
- Make sure your Firestore security rules allow the authenticated user to write
- The script does not add a `userId` field - workouts are imported without user association
- For multi-user setups, you may need to modify the script to add authentication and user IDs

## 🧪 Testing

Test the import with the provided sample file:

```bash
node import-csv.js sample-workout.csv
```

This will import 2 workout days with a few exercises to verify everything works.

## 📝 Data Structure

Each imported workout document will have this structure:

```javascript
{
  date: "2024-06-09",           // ISO date string (YYYY-MM-DD)
  machines: [                    // Array of machine/exercise objects
    {
      name: "chest press",       // Machine name
      settings: "6",             // Machine settings (optional)
      weight: 22,                // Weight in kg (number)
      sets: 2,                   // Number of sets (number)
      reps: 10                   // Reps per set (number)
    }
  ],
  totalWeight: 8320,             // Total kg lifted (calculated)
  avgWeight: 26.5,               // Average weight per machine (calculated)
  machineCount: 16,              // Number of machines used (calculated)
  createdAt: "2026-01-14T..."    // ISO timestamp of import
}
```

## 🤝 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your CSV format matches the expected structure
3. Test with `sample-workout.csv` first
4. Check Firebase Console for any errors in Firestore
