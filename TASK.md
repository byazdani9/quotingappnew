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
- **Paving Specific Tools (New - 2025-04-08):**
  - **Phase 1:**
    - [ ] **Material Cost Settings:**
      - [ ] Design Supabase table for organizational material costs (e.g., `organization_material_costs`).
      - [ ] Create Settings screen UI section for managing materials (Asphalt, Gravel, Trucking - name, cost, unit).
      - [ ] Implement Supabase CRUD operations for material costs.
    - [ ] **Paving Calculator Item Type:**
      - [ ] Define the calculation logic (formulas, assumptions for depths, compaction, etc.).
      - [ ] Add "Paving Calculator" as a new node type in `EstimateBuilderContext`.
      - [ ] Create UI form/modal for Paving Calculator inputs (Area, Asphalt Depth, Gravel Depth, etc.).
      - [ ] Implement automatic calculation logic using Material Cost Settings.
      - [ ] Integrate display of Paving Calculator item into `EstimateNodeDisplay`.
      - [ ] Ensure calculated cost rolls up to estimate total.
  - **Phase 2:**
    - [ ] **Map Measuring Tool:**
      - [ ] Add `react-native-maps` dependency.
      - [ ] Add `@turf/turf` dependency.
      - [ ] Implement map display component.
      - [ ] Implement UI for drawing polygons on the map.
      - [ ] Implement area calculation using Turf.js.
      - [ ] Integrate measured area into relevant inputs (e.g., Paving Calculator).
  - **Phase 3 (Future):**
    - [ ] **Advanced Logic (Plant Locations & Trucking Optimization):**
      - [ ] Design DB schema for Plant Locations & Supplier Pricing.
      - [ ] Implement Settings UI for managing plants.
      - [ ] Integrate Geocoding API.
      - [ ] Implement distance/trucking cost calculation logic.
      - [ ] Integrate logic into pricing/estimator.
- **Technical Debt & Refinement:**
  - [x] **(2025-04-16)** Set up Sequential Thinking MCP Server (from https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking).
  - [ ] Address remaining dependency warnings (e.g., linting tools, React 19 peer dependency).
  - [ ] Write frontend unit/integration tests (Jest).
  - [ ] Configure Supabase Auth settings (Providers, Templates, Security).
  - [ ] Set `user_role` in user_metadata for users.
  - [ ] Deployment setup (Frontend app distribution).
  - [ ] Implement Responsive Layouts (Tablet/Phone).
- **2025-04-07:** Implement Nested Groups in Estimate Builder:
  - [x] Refactor `EstimateBuilderContext` state to use hierarchical tree structure.
  - [x] Implement logic to transform flat Supabase data *to* the tree structure (`buildTreeFromFlatData`).
  - [x] Create a recursive `<EstimateNodeDisplay>` component for rendering groups and items.
  - [x] Implement `addNode` logic in context (local state).
  - [x] Implement `updateNode` logic in context (local state).
  - [x] Implement `deleteNode` logic in context (local state, includes re-indexing).
  - [x] Update calculation logic to traverse the tree.
  - [x] Add `title` field to item form and save logic.
  - [x] Change `unit` field to Picker in item form.
  - [x] Remove `unit_price` field from item form, display calculated cost.
  - [x] Adjust `editable` props in item form.
  - [x] Fix `quote_id` null error when saving new items.
  - [x] Fix provider scope issues causing errors/state loss.
  - [x] **BUG:** Fix `Text strings must be rendered within a <Text>` error after adding item. (Fixed 2025-04-15)
    - **Problem:** Text rendering errors occurred in CustomerDetailScreen when viewing customers with related jobs/estimates. The issue was in the FlatList's renderItem function where text strings weren't properly nested within <Text> components, especially in conditional rendering and complex expressions.
    - **Solution:** Ensured all text strings were properly wrapped in nested <Text> components, particularly in the renderItem function of the FlatList. Fixed the name/ID display, status display, and date display with proper nesting. Also fixed the ListEmptyComponent to avoid duplicate content when there are no related quotes.
  - [ ] **BUG:** Fix Total Cost calculation not updating UI correctly.
  - [ ] **BUG:** Fix `handleAddGroup` prompt/logic.
  - [x] **BUG:** Decimal input not working in cost fields. (Fixed 2025-04-09 with separate string state)
  - [x] **BUG:** Fix navigation back from EstimateBuilder when accessed from CustomerDetailScreen. (Fixed 2025-04-15)
    - **Problem:** When navigating from CustomerDetailScreen to EstimateBuilderScreen (cross-stack navigation), the back button was not appearing or not working correctly, preventing users from returning to the customer details.
    - **Solution:** 
      1. Modified CustomerDetailScreen to navigate directly to EstimateBuilder with the estimateId parameter
      2. Updated EstimateBuilderScreen to use the default back button (arrow) for consistent navigation
      3. Added logic to handle different navigation scenarios based on the navigation state
  - [x] **FEATURE:** Add ability to navigate to JobDetail from CustomerDetailScreen for job deletion. (Added 2025-04-15)
    - **Implementation:**
      1. Modified CustomerDetailScreen to fetch job_id for each estimate
      2. Added conditional navigation to either JobDetail or EstimateBuilder based on whether the item is a job
      3. Added visual indicators (🔨/📝) to distinguish between jobs and estimates
      4. Added a legend to explain the icons and which items can be deleted
  - [x] **FEATURE:** Add ability to delete estimates from EstimateBuilderScreen. (Added 2025-04-15)
    - **Implementation:**
      1. Added a "Delete Estimate" button to the EstimateBuilderScreen
      2. Implemented deletion logic with confirmation dialog
      3. Added cascading deletion to remove all related quote items and groups before deleting the quote itself
      4. Added navigation back to previous screen after successful deletion
  - [x] **BUG:** Fix navigation and refresh issues after deleting jobs/estimates. (Fixed 2025-04-15)
    - **Problem:** After deleting a job or estimate, the app would navigate to the wrong screen or not refresh the customer detail screen to show the updated list of jobs/estimates.
    - **Solution:**
      1. Fixed navigation in JobDetailScreen to return to CustomerDetailScreen after deleting a job
      2. Fixed navigation in EstimateBuilderScreen to return to CustomerDetailScreen after deleting an estimate
      3. Added useFocusEffect hook to CustomerDetailScreen to refresh related quotes when the screen comes into focus
      4. Fixed infinite loop issues in EstimateBuilderScreen by removing selectedCustomer from dependency arrays
      5. Added useFocusEffect hook to JobsScreen and EstimatesScreen to refresh data when navigating back to these screens
  - [ ] **FEATURE:** Add ability to delete multiple jobs/estimates at once. (Requested 2025-04-15)
    - **Implementation Plan:**
      1. Add multi-select mode to CustomerDetailScreen with long press to activate
      2. Add checkbox selection for each job/estimate item
      3. Add delete button that appears when items are selected
      4. Implement batch deletion logic with confirmation dialog
      5. Add toggle in settings to enable/disable this feature for testing
  - [ ] Implement `handleEditItem` trigger in `EstimateNodeDisplay`.
  - [ ] Implement `handleEditGroup` handler and UI trigger.
  - [x] Implement `handleDeleteNode` handler and UI trigger (with confirmation). (Added confirmation alert 2025-04-09)
  - [ ] Implement `moveNode` logic (re-parenting & re-ordering).
  - [ ] Implement `handleMoveNode` handler and UI trigger.
  - [ ] Implement logic to save tree changes back to Supabase.
  - [ ] Add unit tests.
  - [ ] Refine button styling.

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
