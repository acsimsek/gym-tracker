# 💪 Gym Tracker

A modern, responsive web application for tracking your weight lifting workouts, machines used, and visualizing your progress over time. Built with React, Firebase, and Tailwind CSS.

## ✨ Features

- **🔐 User Authentication**: Secure login with Email/Password (no sign-up - admin managed users)
- **Add Workouts**: Log your workouts with date, multiple machines, settings, weight, sets, and reps
- **View History**: Browse all past workouts with detailed breakdowns and the ability to delete entries
- **Progress Charts**: Visualize your progress with:
  - Total weight lifted over time (line chart)
  - Average weight per machine (bar chart)
  - Most frequently used machines (horizontal bar chart)
  - Summary statistics (total workouts, total kg lifted, avg kg/session, unique machines)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Beautiful UI**: Dark gradient theme with glass-morphism effects

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication (Email/Password)
- **Database**: Firebase Firestore
- **Charts**: Chart.js with react-chartjs-2
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn
- A Firebase account (free tier is sufficient)

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/acsimsek/gym-tracker.git
cd gym-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Firestore Database:
   - Go to "Build" > "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" for development (remember to update security rules for production)
   - Select a location and click "Enable"
4. Enable Email/Password Authentication:
   - Go to "Build" > "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Click on "Email/Password"
   - Enable the "Email/Password" provider (NOT "Email link")
   - Click "Save"
5. Get your Firebase configuration:
   - Go to Project Settings (⚙️ icon)
   - Scroll down to "Your apps" section
   - Click the web icon (</>) to add a web app
   - Register your app and copy the configuration object

### 4. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 5. Create User Accounts

The app uses Firebase Authentication with **Email/Password** sign-in. Users cannot sign up themselves - accounts must be created manually by an administrator.

**To create a user account:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Build" > "Authentication" > "Users" tab
4. Click "Add user"
5. Enter the user's email and password
6. Click "Add user"

**Notes:**
- There is no sign-up functionality in the app for security reasons
- All users are created and managed through the Firebase Console
- Each user's workouts are automatically associated with their user ID
- Users can only see and manage their own workouts

### 6. Run Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

## 📦 Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## 🌐 Deploying to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all `VITE_FIREBASE_*` variables

### Option 2: Deploy via GitHub Integration

1. Go to [Vercel](https://vercel.com)
2. Sign up/login with your GitHub account
3. Click "New Project"
4. Import your `gym-tracker` repository
5. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   - Click "Environment Variables"
   - Add all `VITE_FIREBASE_*` variables from your `.env` file
7. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`

### Automatic Deployments

Once connected to GitHub, Vercel will automatically deploy:
- **Production**: Every push to the `main` branch
- **Preview**: Every push to other branches and pull requests

## 🗄️ Database Structure

The app uses a single Firestore collection:

**Collection: `workouts`**

```javascript
{
  date: "2024-01-15",           // ISO date string
  machines: [                    // Array of machine objects
    {
      name: "Bench Press",       // Machine name
      settings: "Seat 5",        // Optional settings
      weight: 40,                // Weight in kg
      sets: 3,                   // Number of sets
      reps: 10                   // Number of reps per set
    }
  ],
  totalWeight: 1200,             // Total kg lifted (auto-calculated)
  createdAt: Timestamp           // Firestore server timestamp
}
```

## 💰 Cost Summary

This app uses Firebase's free tier, which includes:

- **Firestore**: 
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GB storage

- **Vercel**:
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Automatic SSL

For typical personal use (logging 1-2 workouts per day), this app will remain **completely free**.

## 🔒 Security Notes

### Authentication

This app uses Firebase Authentication with Email/Password sign-in:
- **No sign-up functionality** - Users must be created manually in Firebase Console
- Login screen protects all workout features
- Users are automatically logged out when closing the browser (session-based)

### Firestore Security Rules

**Important**: Update your Firestore security rules to require authentication. Replace the default test mode rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workouts/{workout} {
      // Only authenticated users can read/write their own workouts
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      // Allow creating new workouts with the user's own userId
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**To update security rules:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Build" > "Firestore Database"
4. Click on "Rules" tab
5. Replace the rules with the above configuration
6. Click "Publish"

### Best Practices

- Create strong passwords for user accounts
- Regularly review user access in Firebase Console
- Keep your `.env` file secure and never commit it to version control
- Consider enabling 2FA for your Firebase account

## 📱 Screenshots

The app features:
- Tab-based navigation (Add Workout, History, Progress)
- Responsive design that adapts to mobile and desktop
- Dark gradient background with glass-morphism effects
- Interactive charts and statistics

## 🤝 Contributing

Feel free to open issues or submit pull requests for improvements!

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.
