

## Plan: Fix Duplicate Start Date + Editable Dates + Next Appointment

### Problem
There's a `UNIQUE (client_id, start_date)` constraint on `weekly_goals` preventing multiple goal sets with the same start date.

### Changes

#### 1. Drop the Unique Constraint (DB Migration)
```sql
ALTER TABLE public.weekly_goals DROP CONSTRAINT weekly_goals_client_id_week_start_key;
```

#### 2. Add `next_appointment` Column to Profiles
```sql
ALTER TABLE public.profiles ADD COLUMN next_appointment date;
```
This lets the dietitian set a "Next Appointment Date" per client. The goal end date defaults to this but can be overridden.

#### 3. Dietitian UI Updates (`src/pages/dietitian/ClientProfile.tsx`)

**Overview tab**: Add a "Next Appointment" field with a date picker. Saving updates `profiles.next_appointment`.

**Goals tab — Assign form**: 
- Add a **start date** picker (defaults to today but modifiable)
- End date defaults to `profile.next_appointment` if set, but remains editable

**Goals tab — Existing goals**:
- Make start_date and end_date editable inline (date pickers) on each goal set card
- When dates change, recalculate `checked_days` array length (preserve existing checks, extend/truncate as needed)

### Files to Modify

| File | Change |
|------|--------|
| DB migration | Drop unique constraint, add `next_appointment` to profiles |
| `src/pages/dietitian/ClientProfile.tsx` | Add next appointment picker in overview, editable start/end dates on goals, default end date from appointment |

