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
