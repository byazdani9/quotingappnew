# Project Planning: QuotingAppNew (Frontend)

## 1. Project Goal
To create a mobile application (initially Android, potentially iOS later) for Northland Paving contractors to manage quotes, jobs, customers, and costbooks. This project replaces the previous `quoting_app/frontend` attempt which encountered persistent build issues.

## 2. Core Technologies
- **Framework:** React Native 0.78.0
- **Language:** TypeScript
- **UI/Navigation:**
    - React Navigation (v7 currently installed, may need review/downgrade if issues arise)
    - `react-native-gesture-handler`
    - `react-native-reanimated`
    - `react-native-screens`
    - `react-native-safe-area-context`
    - Planned Native Modules: `react-native-vision-camera`, `react-native-pdf`, `react-native-share`, React Native `Linking` API.
- **Backend/Auth:** Supabase (`supabase-js`)
- **State Management:** (Currently using React Context/useState, consider Zustand or Jotai if complexity increases)
- **Styling:** React Native StyleSheet (Consider Tamagui or Nativewind later if needed)
- **Linting/Formatting:** ESLint, Prettier (using `@react-native/eslint-config`)
- **Environment Variables:** `react-native-dotenv`
- **Build Tooling:** Metro, Gradle (Android)

## 3. Architecture & Structure
- **Directory Structure:**
    - `src/`: Main application code
        - `screens/`: Top-level screen components, grouped by feature (Auth, Dashboard, Estimates, Jobs, Customers, Costbooks, Settings)
        - `components/`: Reusable UI components (Buttons, Inputs, Cards, etc.)
        - `navigation/`: Navigation setup files (if separated from `App.tsx`)
        - `lib/`: Utility functions, helper modules (e.g., `supabaseClient.ts`)
        - `hooks/`: Custom React hooks
        - `contexts/`: React Context definitions
        - `types/`: Shared TypeScript types and interfaces
        - `assets/`: Static assets (images, fonts)
- **State Management:** Primarily local component state (`useState`) and potentially React Context for global state (like auth session). Evaluate need for dedicated state library later.
- **Navigation:** Drawer navigation for main app sections, Stack navigation for authentication flow. Type safety enforced using React Navigation's TypeScript integration.
- **API Interaction:** Centralized Supabase client in `src/lib/supabaseClient.ts`.
- **Backend Logic:**
    - Use DB Functions/Triggers (SQL/PLpgSQL) for data-centric logic (e.g., `update_quote_totals`, `create_job_from_quote`).
    - Use Edge Functions (Deno/TypeScript) for complex server-side logic requiring external libraries or more processing (e.g., PDF generation using `pdf-lib`).

## 4. Coding Style & Conventions
- Follow standard React/React Native best practices.
- Use TypeScript for type safety. Define clear interfaces/types.
- Use functional components and Hooks.
- Keep components small and focused.
- Follow ESLint rules defined by `@react-native/eslint-config`.
- Use Prettier for consistent code formatting.
- Add comments for complex logic.

## 5. Constraints & Considerations
- **Initial Focus:** Android platform.
- **Performance:** Monitor performance, especially with lists and complex state.
- **Testing:** Add unit/integration tests for critical logic (auth, Supabase interactions, core components).
- **Dependencies:** Keep dependencies updated, address peer dependency warnings where feasible. Be mindful of compatibility with RN 0.78.0. React Navigation v7 is currently installed; monitor for issues, consider downgrade to v6 if necessary.
- **Metro Patch:** Currently using `patch-package` to fix a Metro startup bug (`Cannot read property 'handle' of undefined`) potentially related to middleware handling in the version pulled in by dependencies (likely 0.81.4 despite RN 0.78.0). Monitor if future RN/Metro updates resolve this.
- **Testing:** Add pgTAP for DB function testing if feasible.

## 6. Next Steps (Post-Migration)
- Verify core app functionality (login, navigation).
- Copy any remaining necessary assets or configuration files from the old project.
- Address outstanding dependency warnings.
- Implement missing features according to original project goals.
- Add tests.
