

## Plan: Fix Build Error + Role-Gated Login + Goal Edit/Delete + Image Compression

### 1. Fix Build Error (ClientProfile.tsx)

Line 163 is missing `const addComment = async (mealId: string) => {` — the function declaration was lost during a previous edit. Re-add it.

### 2. Role-Gated Login

After successful `signInWithPassword`, check the user's role from `user_roles` table. If the user selected "Dietitian" but their role is `client` (or vice versa), sign them out and show an error toast: "This account is not registered as a dietitian/client."

**File**: `src/pages/Login.tsx` — add role validation in `handleLogin` between auth and navigation.

### 3. Goal Edit/Delete (already partially done)

The edit/delete functions (`deleteGoalSet`, `deleteGoalItem`, `saveEditGoalSet`) already exist in `ClientProfile.tsx`. Just need to verify the UI renders the edit/delete buttons properly — this was part of the previous approved work that introduced the build error. The fix in step 1 should restore this.

### 4. Client-Side Image Compression

Before uploading meal photos, compress them on the device using an HTML Canvas approach:
- Create a utility function `compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File>` in `src/lib/imageUtils.ts`
- It loads the image into a canvas, resizes if wider than `maxWidth`, and exports as JPEG at the given quality
- Call this in `MealUploadFlow.tsx` before the storage upload

**Files to modify:**
| File | Change |
|------|--------|
| `src/pages/dietitian/ClientProfile.tsx` | Fix missing `addComment` function declaration (line 163) |
| `src/pages/Login.tsx` | Add role check after login — reject mismatched role |
| `src/lib/imageUtils.ts` | New: `compressImage()` utility |
| `src/components/MealUploadFlow.tsx` | Call `compressImage()` before upload |

