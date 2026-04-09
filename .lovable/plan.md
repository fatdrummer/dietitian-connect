

## Plan: Rework Goals, Meals, and Login

This is a significant rework touching the database schema, several pages, and the login flow. Here's what changes:

### 1. Database Changes

**Update `meal_type` enum** — Add `snack_1`, `snack_2`, `other` values. Remove `snack`.

**Add `meal_date` column to `meals`** — A `date` field so clients pick which day the meal belongs to (not just `created_at`).

**Rework `weekly_goals` table** — Replace `week_start` with two fields:
- `start_date` (date) — when the goal period begins
- `end_date` (date) — dietitian-chosen end date
- Goals are auto-split into 7-day periods on the frontend for display/tracking

### 2. Login Page — Two Distinct Paths

Replace the single login form with two clearly separated options:
- "I'm a Dietitian" button → shows dietitian login form (with signup link)
- "I'm a Client" button → shows client login form (no signup link, since clients are created by dietitians)

Both use the same `signInWithPassword` under the hood; the role check after login still determines routing.

### 3. Client Home = Goal Tracker

When a client logs in, they land directly on the goal tracker (merge current Dashboard into Goals page):
- Shows active goals with their current 7-day period
- Each goal row: text + 7 day checkboxes (Mon–Sun labels based on the period start day)
- Checked boxes turn **green**
- Below each goal: **"Total for week: X/7 (Y%)"** counter showing checked days and percentage
- Bottom-right: floating action button (FAB) with camera icon → opens meal upload flow

### 4. Meal Upload Flow (Step-by-step)

Triggered by the FAB on the goals page:
1. **Step 1**: Pick the day (Monday through Sunday of current period)
2. **Step 2**: Pick meal type (Breakfast, Snack 1, Snack 2, Lunch, Dinner, Other)
3. **Step 3**: Camera opens automatically (`capture="environment"`)
4. **Step 4**: After photo taken, show preview + text area for comments → Submit

### 5. Meal Grid View (Both Dietitian and Client)

Replace the current list-based meal view with a **grid/table**:
- **Rows** = Days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
- **Columns** = Meal types (Breakfast, Snack 1, Lunch, Snack 2, Dinner, Other)
- Each cell shows a thumbnail of the meal photo (if uploaded), clickable to expand with comments
- This view is used on both the client meals page and the dietitian's client profile meals tab

### 6. Dietitian Goal Assignment

Update the ClientProfile goals tab:
- Instead of picking a week, the dietitian enters goal texts + picks an **end date** (start date defaults to today)
- The system auto-creates the `weekly_goals` row with `start_date` and `end_date`
- Display splits the period into 7-day chunks for tracking

### Technical Details

**Migration SQL:**
- `ALTER TYPE meal_type ADD VALUE 'snack_1'; ALTER TYPE meal_type ADD VALUE 'snack_2'; ALTER TYPE meal_type ADD VALUE 'other';`
- Drop old `snack` value (or keep for backward compat — safer to keep and just not show it in UI)
- `ALTER TABLE meals ADD COLUMN meal_date date;`
- `ALTER TABLE weekly_goals ADD COLUMN end_date date;` then rename `week_start` → `start_date`

**Files to create/modify:**
- `src/pages/Login.tsx` — Two-path login UI
- `src/pages/client/Goals.tsx` — Becomes the main client landing page with goal tracker + FAB
- `src/pages/client/Meals.tsx` — Grid view replacing list
- `src/components/MealGrid.tsx` — Shared grid component (days × meal types)
- `src/components/MealUploadFlow.tsx` — Multi-step upload dialog
- `src/pages/dietitian/ClientProfile.tsx` — Updated goals tab with end-date picker
- `src/pages/client/Dashboard.tsx` — Redirect to /client/goals or merge content
- `src/components/ClientLayout.tsx` — Remove separate Goals nav, add FAB
- `src/App.tsx` — Update routing so `/client` renders goals page
- `src/types/index.ts` — Update types for new schema

