

## Plan: Goal Tracking Full Duration + Meal History + Reflection Upload Flow

### Current Issues
1. **Goals only track 7 days** — `checked_days` is a fixed 7-element array. Need to expand to cover the full start_date-to-end_date duration, split into 7-day blocks with per-block and overall % counters.
2. **Client can't browse past meals** — The Meals page exists but needs clearer navigation.
3. **Reflections aren't accessible from the FAB** — User wants reflection submission to work similarly to meal photo uploads (quick action from goals page).

### Changes

#### 1. Expand Goal Tracking to Full Duration

**Data model change**: The `checked_days` array in each `WeeklyGoalItem` currently has 7 booleans. It needs to grow to match the total number of days from `start_date` to `end_date`. When the dietitian assigns goals, `checked_days` should be initialized with `N` booleans (where N = days between start and end date).

**Goals page rework** (`src/pages/client/Goals.tsx`):
- Calculate total days from `start_date` to `end_date`
- Split into 7-day blocks (last block may be shorter)
- Show each block as a collapsible or stacked section with its own day checkboxes and `X/7 (Y%)` counter
- Highlight the current block/week
- Add an **overall progress bar** at the top showing total checked / total days across the entire duration with percentage
- Keep the >80% "Goal Accomplished!" banner using the overall percentage

**Dietitian goal assignment** (`src/pages/dietitian/ClientProfile.tsx`):
- When creating goals, compute total days and initialize `checked_days` with that many `false` values instead of always 7

#### 2. Client Meal History

The Meals page already exists and works. Ensure it's properly linked in the nav (it is). No major changes needed — it already has week-by-week navigation with the chevron arrows.

#### 3. Reflection Quick-Add from Goals Page

Add a second FAB (or expand the existing one) on the Goals page for reflections — a small "MessageSquare" button next to the Camera FAB. Tapping it opens a dialog with the reflection form (hunger/cravings/satisfaction sliders + notes), same as the current Reflections page form but in a dialog. Past reflections remain viewable on the dedicated Reflections page.

### Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | No structural change needed — `checked_days: boolean[]` already supports variable length |
| `src/pages/client/Goals.tsx` | Split goals into 7-day blocks with per-block and overall % counters; add reflection FAB |
| `src/pages/dietitian/ClientProfile.tsx` | Initialize `checked_days` with correct length based on date range |
| `src/components/ReflectionDialog.tsx` | New: extracted reflection form as a dialog component |

### Technical Details

- Block calculation: `totalDays = daysBetween(start_date, end_date)`, `numBlocks = ceil(totalDays / 7)`. Block `i` covers days `[i*7, min((i+1)*7, totalDays))`.
- Day labels within each block are derived from actual dates (e.g., "Mon 14/4", "Tue 15/4").
- `toggleDay(goalIndex, absoluteDayIndex)` updates the correct position in the full `checked_days` array.
- Overall % = sum of all checked across all goals / (goals.length * totalDays) * 100.
- Per-block % = checked in that block's range / block size * 100.

