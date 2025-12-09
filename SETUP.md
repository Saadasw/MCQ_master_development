# MCQ Vision Splitter - Project Setup Guide

Complete installation and setup guide for the **MCQ Vision Splitter** application.

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Clone & Install](#-clone--install)
3. [Environment Variables Setup](#-environment-variables-setup)
4. [Firebase Configuration](#-firebase-configuration)
5. [Running the Application](#-running-the-application)
6. [Firebase Deployment](#-firebase-deployment)
7. [Troubleshooting](#-troubleshooting)

---

## 🛠 Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Required Software

| Software | Minimum Version | Download Link |
|----------|-----------------|---------------|
| **Node.js** | v18.0.0+ | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0+ | Comes with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Verify Installation

Open your terminal and run:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

### Required Accounts

You will need the following accounts (free tiers available):

1. **Google Cloud Platform** - For Gemini API access
   - [Google AI Studio](https://aistudio.google.com/) - Get your Gemini API Key
   
2. **Firebase** - For database, storage, and authentication
   - [Firebase Console](https://console.firebase.google.com/)

---

## 📦 Clone & Install

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd mcq-vision-splitter
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install the following key dependencies:
- **React 19** - Frontend framework
- **Firebase 12** - Backend services (Auth, Firestore, Storage)
- **@google/genai** - Gemini AI SDK
- **Vite 6** - Build tool and development server
- **TypeScript 5.8** - Type safety
- **Lucide React** - Icon library

---

## 🔐 Environment Variables Setup

### Step 1: Create Environment File

Create a `.env` file in the project root:

```bash
# Windows (PowerShell)
New-Item -Path ".env" -ItemType File

# macOS/Linux
touch .env
```

### Step 2: Add Environment Variables

Copy the following template into your `.env` file and fill in your values:

```env
# ============================================
# GEMINI API CONFIGURATION
# ============================================
# Get your API key from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# FIREBASE CONFIGURATION
# ============================================
# Get these values from Firebase Console:
# Project Settings > General > Your Apps > Web App > Config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> ⚠️ **Important**: Never commit your `.env` file to version control. It should be listed in `.gitignore`.

---

## 🔥 Firebase Configuration

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter a project name (e.g., `mcq-vision-splitter`)
4. Enable/Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Firebase Services

#### Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Enable **Anonymous** authentication (required for student portal)
5. Optionally enable **Email/Password** for admin login

#### Enable Firestore Database

1. Go to **Build > Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose your preferred region (e.g., `asia-southeast1`)
5. Click **"Enable"**

#### Enable Storage

1. Go to **Build > Storage**
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Choose the same region as Firestore
5. Click **"Done"**

### Step 3: Register a Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click the web icon (`</>`) to add a web app
4. Enter an app nickname (e.g., `mcq-web`)
5. Copy the configuration values to your `.env` file

### Step 4: Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init
```

---

## 🚀 Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Production Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## ☁️ Firebase Deployment

### Deploy Firestore & Storage Rules

Deploy your security rules to Firebase:

```bash
firebase deploy --only firestore:rules,storage
```

### Deploy CORS Configuration (Required for Image Uploads)

CORS must be configured for Firebase Storage to allow uploads from your web app.

#### Option 1: Using Google Cloud Shell (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Click **Activate Cloud Shell** (terminal icon in top right)
4. Run these commands:

```bash
# Create cors.json
echo '[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]' > cors.json

# Apply CORS configuration
gsutil cors set cors.json gs://YOUR_PROJECT_ID.firebasestorage.app
```

#### Option 2: Using Local gsutil

If you have Google Cloud SDK installed locally:

```bash
gsutil cors set cors.json gs://YOUR_PROJECT_ID.firebasestorage.app
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. "Module not found" Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Firebase Auth Errors (`auth/admin-restricted-operation`)

**Solution**: Enable Anonymous Authentication in Firebase Console:
1. Go to **Authentication > Sign-in method**
2. Enable **Anonymous** provider

#### 3. Firestore Permission Denied

**Solution**: Ensure your Firestore security rules are deployed:
```bash
firebase deploy --only firestore:rules
```

#### 4. Storage Upload Fails (CORS Error)

**Solution**: Deploy CORS configuration as described in [Firebase Deployment](#-firebase-deployment).

#### 5. Gemini API Errors

- Verify your `GEMINI_API_KEY` is correct in `.env`
- Ensure the API key has access to `gemini-3-pro-preview` model
- Check your API quota at [Google AI Studio](https://aistudio.google.com/)

#### 6. Port 3000 Already in Use

```bash
# Find process using port 3000 (Windows)
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or start the dev server on a different port
npm run dev -- --port 3001
```

---

## 📁 Project Structure

```
mcq-vision-splitter/
├── components/          # React components
│   ├── AdminLogin.tsx   # Admin authentication
│   ├── ResultViewer.tsx # Question results display
│   └── StudentExam.tsx  # Student exam portal
├── hooks/               # Custom React hooks
│   └── useExamSession.ts
├── services/            # Backend services
│   ├── firebase.ts      # Firebase configuration
│   ├── geminiService.ts # Gemini AI integration
│   └── questionService.ts
├── utils/               # Utility functions
├── .env                 # Environment variables (create this)
├── .env.local           # Local overrides (optional)
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
├── cors.json            # CORS configuration
├── package.json         # Project dependencies
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the [existing issues](https://github.com/your-repo/issues)
2. Create a new issue with detailed error logs
3. Include your Node.js and npm versions

---

## 📄 License

This project is private and proprietary.

---

**Happy Coding! 🎉**
