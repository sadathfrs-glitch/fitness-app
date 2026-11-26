# FitTrack - Fitness Tracker

A comprehensive fitness tracking application built with React, TypeScript, Firebase, and deployed to GitHub Pages.

## Features

- **Workout Tracking** - Log exercises, sets, reps, and weight with rest timers
- **Exercise Library** - Browse and manage exercises by muscle group and equipment
- **Progress Dashboard** - Visualize weight trends, volume, and personal records
- **Workout Plans** - Create weekly training schedules with templates
- **Nutrition Tracking** - Log meals, track macros, and manage custom foods
- **Firebase Integration** - Real-time sync across devices with authentication

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Backend**: Firebase (Auth + Firestore)
- **Routing**: React Router v7
- **Deployment**: GitHub Pages via GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fitness-app.git
cd fitness-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Create a web app and copy the config values

4. Configure environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Firebase config values.

5. Start development server:
```bash
npm run dev
```

### Firebase Security Rules

Deploy these Firestore rules for user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{collection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Public exercises readable by all authenticated users
    match /exercises/{exerciseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }
    
    // Foods readable by all, writable by creator
    match /foods/{foodId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   └── layout/       # Layout components (Navbar, etc.)
├── context/
│   ├── AuthContext.tsx    # Firebase authentication
│   └── AppContext.tsx     # Global app state
├── hooks/            # Custom React hooks
├── pages/
│   ├── auth/         # Login/Signup pages
│   ├── Dashboard.tsx
│   ├── Workouts.tsx
│   ├── WorkoutDetail.tsx
│   ├── Exercises.tsx
│   ├── Progress.tsx
│   ├── Plans.tsx
│   └── Nutrition.tsx
├── services/
│   ├── firebase.ts   # Firebase initialization
│   └── firestore.ts  # Firestore CRUD operations
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Deployment

### GitHub Pages (Automatic)

1. Push to main branch - GitHub Actions will automatically build and deploy
2. Configure repository secrets in GitHub:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`

3. Update `vite.config.ts` base path to match your repository name:
```typescript
base: '/your-repo-name/',
```

### Manual Deployment

```bash
npm run build
npm run deploy
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter
- `npm run deploy` - Deploy to GitHub Pages manually

## License

MIT