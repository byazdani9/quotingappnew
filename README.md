# Quoting App (QuotingAppNew Frontend)

This project is a React Native frontend for a quoting application, using Supabase for the backend. This project (`QuotingAppNew`) was created to resolve build issues encountered in a previous attempt (`quoting_app/frontend`).

## Project Goal

To build a functional quoting application for Android (and potentially iOS later) similar to provided screenshots, allowing users to manage costbooks, customers, estimates, and jobs, generate PDF proposals, and integrate with native features. Supabase serves as the central database and API provider.

## Tech Stack

*   **Backend:** Supabase (Managed PostgreSQL, PostgREST API, Auth, Edge Functions)
*   **Frontend:** React Native 0.78.0 (TypeScript)
*   **UI/Navigation:** React Navigation, `react-native-gesture-handler`, `react-native-reanimated`, etc.
*   **API Client:** `supabase-js`
*   **Testing:** Jest
*   **Formatting:** Prettier

*(See `PLANNING.md` for more details)*

## Setup (Supabase Backend)

1.  Ensure you have a Supabase project created ([supabase.com](https://supabase.com)).
2.  Define the necessary database schema (Tables, Functions, RLS). See `PLANNING.md` for details.
3.  Obtain the Project URL and `anon` key from Supabase project settings (API section).
4.  Create a `.env` file in the `QuotingAppNew` root directory with your Supabase credentials:
    ```
    SUPABASE_URL=YOUR_SUPABASE_URL
    SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

## Setup & Running (Frontend - React Native)

1.  **Navigate to Project Directory:**
    ```sh
    cd path/to/QuotingAppNew
    ```
2.  **Install Dependencies:**
    ```sh
    yarn install
    ```
    *(This will also apply necessary patches via `patch-package`)*
3.  **Start Metro Bundler:** (Keep this running in a separate terminal)
    ```sh
    yarn start
    ```
    *(Or `npx react-native start`)*
4.  **Run on Android:** (Make sure an emulator is running or a device is connected)
    ```sh
    yarn android
    ```
    *(Or `npx react-native run-android`)*

## Building & Distributing for Testing (Android APK via Firebase)

This section describes how to create a release APK and distribute it to testers using Firebase App Distribution.

**Prerequisites:**

1.  **Firebase Project:** Ensure you have a Firebase project set up ([console.firebase.google.com](https://console.firebase.google.com/)).
2.  **Android App Added:** Add an Android app to your Firebase project, providing the package name (`com.quotingappnew`).
3.  **`google-services.json`:** Download the `google-services.json` file from your Firebase project settings and place it in the `android/app/` directory.
4.  **Firebase CLI:** Install the Firebase CLI (`npm install -g firebase-tools`) and log in (`firebase login`).
5.  **App Distribution Enabled:** In the Firebase console, navigate to "App Distribution" (under Release & Monitor), select your Android app, and click "Get started".
6.  **Gradle Configuration:**
    *   Add the App Distribution plugin classpath to `android/build.gradle` (within `buildscript { dependencies { ... } }`):
        ```gradle
        classpath("com.google.firebase:firebase-appdistribution-gradle:4.2.0")
        ```
    *   Apply the App Distribution plugin in `android/app/build.gradle` (near the top):
        ```gradle
        apply plugin: "com.google.firebase.appdistribution"
        ```

**Steps:**

1.  **Build Release APK:** Open your terminal (e.g., Command Prompt on Windows) in the project root directory (`QuotingAppNew`) and run:
    ```bash
    cd android && gradlew.bat assembleRelease
    ```
    *(On macOS/Linux or Git Bash, use `./gradlew assembleRelease`)*
    Wait for the "BUILD SUCCESSFUL" message. The APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.

2.  **Distribute via Firebase CLI:** Run the following command in your terminal (replace placeholders):
    ```bash
    firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk --app YOUR_FIREBASE_APP_ID --testers "tester1@example.com,tester2@example.com" --groups "your-tester-group-alias"
    ```
    *   `YOUR_FIREBASE_APP_ID`: Find this in Firebase Project Settings > General > Your apps > Android app (e.g., `1:1234567890:android:abcdef1234567890`).
    *   `--testers`: (Optional) Comma-separated list of tester emails.
    *   `--groups`: (Optional) Comma-separated list of tester group aliases defined in Firebase App Distribution.
    *(You must provide either `--testers` or `--groups` or both)*

Testers will receive an email invitation to download the build.

## Project Structure

```
QuotingAppNew/
├── android/                # Android native project
├── ios/                    # iOS native project (not configured yet)
├── src/                    # Main application source code (TypeScript)
├── patches/                # Patches applied via patch-package
├── .env                    # Environment variables (Supabase keys - **DO NOT COMMIT**)
├── .gitignore              # Git ignore file
├── babel.config.js         # Babel configuration
├── index.js                # App entry point
├── metro.config.js         # Metro bundler configuration
├── package.json            # Project dependencies and scripts
├── PLANNING.md             # Project planning, architecture, decisions
├── README.md               # This file
├── TASK.md                 # Task tracking
└── tsconfig.json           # TypeScript configuration
```

*(See `PLANNING.md` for more detailed structure)*
