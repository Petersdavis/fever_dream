# Fever Dream Comedy

Website and backend synchronization services for Fever Dream Comedy. Built with React (Vite), Firebase Hosting, Cloud Functions, and Firestore.

## Prerequisites & Tooling Setup

### 1. Google Cloud CLI (`gcloud`)
To install the Google Cloud SDK on Windows via `winget`:

```powershell
winget install Google.CloudSDK
```

> **Note:** After installation completes, restart your PowerShell terminal for `gcloud` to be available in your PATH.

Authenticate and set the active project:
```powershell
gcloud auth login
gcloud config set project feverdream-3bafe
```

### 2. Firebase CLI
Firebase CLI is used for hosting, rules, and Cloud Functions management:

```powershell
npm install -g firebase-tools
firebase login
firebase use feverdream-3bafe
```

---

## Eventbrite Synchronization & Cloud Functions

The backend pulls upcoming shows and posters from Eventbrite into Firestore on a daily schedule.

### 1. Store the Eventbrite Secret
Set your Eventbrite private token in Cloud Secret Manager:

```powershell
firebase functions:secrets:set EVENTBRITE_PRIVATE_TOKEN
```
*(Paste the private token when prompted)*

### 2. Deploy Firestore Rules and Functions
```powershell
firebase deploy --only firestore:rules,functions
```

### 3. Trigger Manual Sync (Optional)
To test or populate Firestore immediately after deploy:
```powershell
# Replace with the deployed function URL displayed in deployment output:
Invoke-RestMethod "https://us-central1-feverdream-3bafe.cloudfunctions.net/syncEventsNow?key=<YOUR_EVENTBRITE_PRIVATE_TOKEN>"
```

---

## Local Frontend Development

Install frontend dependencies and start Vite dev server:

```powershell
npm install
npm run dev
```

Build for production:
```powershell
npm run build
firebase deploy --only hosting
```

