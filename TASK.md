# Project Tasks

## Current & Upcoming
- **Migration & Verification:**
  - [ ] Finalize migration from old project (copy remaining assets, configs if any - e.g., images, fonts).
  - [ ] Verify core application features work correctly after migration (login, navigation, Supabase interaction, basic CRUD).
  - [ ] Verify previously completed frontend features work correctly (Estimate Builder basic logic, Costbook selection, item assignment, reordering).
- **Pending Features (from old plan):**
  - [ ] Implement PDF generation (Edge Function + Frontend integration).
  - [ ] Integrate native Camera.
  - [ ] Integrate native Gmail client (Linking API).
  - [ ] Integrate Google Drive (TBD).
  - [ ] Implement PDF viewing/sharing in frontend.
  - [ ] Implement database migrations (if using Supabase CLI).
  - [ ] Implement advanced search/filtering on dashboards.
  - [ ] Implement Costbook import/export functionality.
  - [ ] Implement Project Dashboard.
  - [ ] Implement User settings/preferences.
  - [ ] Integrate Google Calendar on Dashboard to create Estimates.
- **Technical Debt & Refinement:**
  - [ ] Address remaining dependency warnings (e.g., linting tools, React 19 peer dependency).
  - [ ] Write frontend unit/integration tests (Jest).
  - [ ] Configure Supabase Auth settings (Providers, Templates, Security).
  - [ ] Set `user_role` in user_metadata for users.
  - [ ] Deployment setup (Frontend app distribution).
  - [ ] Implement Responsive Layouts (Tablet/Phone).

## Completed
- **2025-04-03:** Successfully migrated core code and dependencies to a fresh RN 0.78.0 project (`QuotingAppNew`) to resolve build/runtime issues.
- **2025-04-03:** Configured new project with necessary polyfills, Babel plugins, native code adjustments (Reanimated), and Metro patch.
- **2025-04-03:** Verified base RN 0.78.0 project builds and runs.
- **2025-04-03:** Created `QuotingAppNew` project.

## Discovered During Work
*(Add any new tasks identified during development here)*
