

## NutriTrack — Dietitian & Client Management MVP

### Design System
- **Palette**: White backgrounds, gray-100/200 surfaces, muted teal (#0D9488) as primary accent, soft borders
- **Typography**: Inter font, clean hierarchy — large headings, readable body text
- **Style**: Clinical healthcare SaaS — clean cards, subtle shadows, no playful elements
- **Responsive**: Mobile-first for client views, desktop-optimized for dietitian views

### Data Model (Supabase)

**profiles** — id (FK auth.users), full_name, phone, date_of_birth, sex, height_cm, weight_kg, goal, start_date, notes, role (via user_roles), must_change_password (boolean), dietitian_id (FK profiles, nullable — null for dietitians)

**user_roles** — id, user_id (FK auth.users), role (enum: dietitian, client)

**tags** — id, name, created_by (FK auth.users)

**client_tags** — client_id (FK profiles), tag_id (FK tags)

**weekly_goals** — id, client_id, week_start (date, always Monday), goals (jsonb array of {text, checked_days: boolean[7]})

**meals** — id, client_id, photo_url, meal_type (enum: breakfast/lunch/dinner/snack), notes, created_at

**meal_comments** — id, meal_id (FK meals), author_id, content, created_at

**reflections** — id, client_id, meal_id (FK meals, nullable), hunger_rating (1-5), cravings_rating (1-5), satisfaction_rating (1-5), notes (text), created_at

**reflection_replies** — id, reflection_id (FK reflections), author_id, content, created_at

**Storage bucket**: `meal-photos` (public read, authenticated upload)

### Authentication & Security
- Dietitian self-registers via email/password signup
- Dietitian creates client accounts via Supabase Admin API (edge function) — generates a temporary password, displays it once
- Client logs in → `must_change_password` flag detected → forced to change password before proceeding
- RLS on all tables: clients see only their own data; dietitians see all their assigned clients' data
- Roles stored in `user_roles` table with `has_role()` security definer function

### Pages & Flows

1. **Login Page** — Email/password, routes to dietitian dashboard or client dashboard based on role

2. **Dietitian Signup Page** — Self-registration for new dietitian accounts

3. **Dietitian Dashboard** — Summary cards: total clients, pending meal reviews, unread reflections, goals due. Recent activity feed. Quick links.

4. **Client List Page** — Searchable, filterable table/grid of clients. Filter by tags (multi-select). Each row shows name, tags, last activity, adherence %.

5. **New Client Setup Page** — Form with: full name, email, phone, date of birth, sex, height (cm), weight (kg), goal, start date, notes. Tag picker (predefined suggestions + custom input). On submit: creates auth account, shows temporary password in a modal for the dietitian to copy/share.

6. **Client Profile Page (Dietitian view)** — Overview tab: client info, tags, adherence stats. Goals tab: current & past weekly goals. Meals tab: photo grid with comments. Reflections tab: structured ratings + replies.

7. **Weekly Goals Page (Dietitian)** — Assign text-based goals for a given week (Mon–Sun). View past weeks.

8. **Meal Review Page (Dietitian)** — Feed of recent meal uploads across clients. Click to view photo, notes, meal type. Add comments.

9. **Reflection Inbox (Dietitian)** — List of client reflections with hunger/cravings/satisfaction ratings. Reply inline.

10. **Client Dashboard** — Welcome message, current week's goals checklist, recent feedback from dietitian.

11. **Client Goals View** — Monday–Sunday checklist. Tap to check off each goal per day.

12. **Client Meal Upload Page** — Photo upload, select meal type, add notes. Mobile-optimized camera flow.

13. **Client Reflections Page** — Structured form: hunger (1-5), cravings (1-5), satisfaction (1-5), free-text notes. Optionally link to a meal entry. View dietitian replies.

14. **Force Password Change Page** — Shown on first login when `must_change_password` is true.

### Edge Functions
- **create-client**: Creates auth user with temporary password, inserts profile + role, returns credentials
- Secured with dietitian role check

### MVP Scope Boundaries
- No reminders, appointments, weight/water tracking, or exports (future features)
- Single-dietitian-per-client (no shared clients)
- No real-time updates (polling or manual refresh)

