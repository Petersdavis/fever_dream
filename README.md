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

Build for production (with static prerendering for SEO):
```powershell
npm run build
firebase deploy --only hosting
```

---

## Automated GitHub Actions (Weekly Rebuild & Prerender)

The repository includes [`.github/workflows/rebuild-deploy.yml`](.github/workflows/rebuild-deploy.yml) which runs automatically every Monday (and can be triggered manually) to pull fresh Eventbrite events, prerender static HTML with updated shows/stats, and deploy to Firebase Hosting.

### Required GitHub Repository Secrets:
Go to **Settings → Secrets and variables → Actions** in your GitHub repository and add:

1. `EVENTBRITE_PRIVATE_TOKEN`: Your Eventbrite private token.
2. `FIREBASE_SERVICE_ACCOUNT_FEVERDREAM_3BAFE`: The JSON key of a Firebase Service Account with Hosting Admin permissions (generated via Google Cloud Console under IAM & Admin → Service Accounts, or running `firebase init hosting:github`).


