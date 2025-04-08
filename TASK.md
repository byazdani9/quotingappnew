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
- **2025-04-07:** Implement Nested Groups in Estimate Builder:
  - [x] Refactor `EstimateBuilderContext` state to use a hierarchical tree structure.
  - [x] Implement logic to transform flat Supabase data *to* the tree structure (`buildTreeFromFlatData`).
  - [x] Create a recursive `<EstimateNodeDisplay>` component for rendering groups and items.
  - [ ] Update UI interaction logic (add, edit, move) to work with the tree (Placeholder handlers added).
  - [x] Update calculation logic to traverse the tree.
  - [ ] Implement logic to transform tree structure changes *back* to flat Supabase updates (Part of interaction logic).
  - [ ] Add unit tests for the new context logic and components.

## Completed
- **2025-04-03:** Successfully migrated core code and dependencies to a fresh RN 0.78.0 project (`QuotingAppNew`) to resolve build/runtime issues.
- **2025-04-03:** Configured new project with necessary polyfills, Babel plugins, native code adjustments (Reanimated), and Metro patch.
- **2025-04-03:** Verified base RN 0.78.0 project builds and runs.
- **2025-04-03:** Created `QuotingAppNew` project.

## Discovered During Work
- **2025-04-07:** Implement Job Setup Modal:
  - [x] Create reusable `AppModal` component.
  - [x] Create `JobSetupForm` component for modal content (Job Title, Template placeholder).
  - [x] Integrate modal into `JobsScreen` triggered by "+ Add New Estimate".
  - [x] Update `JobStackParamList` types in `App.tsx`.
  - [x] Update `CustomerSelectionScreen` to accept/pass params.
  - [x] Update `EstimateBuilderScreen` navigation call.
- **2025-04-07:** Implement Job Deletion:
  - [x] Add Delete button and confirmation logic to `JobDetailScreen`.
  - [x] Implement Supabase delete call.
  - [x] Handle navigation after deletion.
- **2025-04-07:** Implement Job Editing (Title):
  - [x] Update `JobSetupForm` to accept initial values.
  - [x] Add Edit modal state and trigger to `JobDetailScreen`.
  - [x] Implement Supabase update call in `JobDetailScreen`.
  - [x] Update local state after successful edit.
- **2025-04-07:** Add Search Bar to Jobs Dashboard:
  - [x] Add `searchTerm` state and `TextInput` to `JobsScreen`.
  - [x] Implement debouncing for search input.
  - [x] Update `fetchJobs` to filter by job name/number based on debounced term.
*(Add any new tasks identified during development here)*
