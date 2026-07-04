# Task feat-2: Seed Data / Demo Mode

## Agent: seed-data-builder

## Task
Add a Seed Data / Demo Mode feature to StudySpark: POST /api/seed endpoint + Demo Data section in Settings page.

## Work Log
1. Read worklog.md and prisma schema to understand project architecture
2. Read settings.tsx to understand existing UI patterns (SettingsSection, GlassCard, AlertDialog, etc.)
3. Read api.ts to understand apiFetch and handleError utilities
4. Created `/home/z/my-project/src/app/api/seed/route.ts`:
   - POST endpoint with auth verification
   - Deletes all existing user data in correct dependency order
   - Seeds rich demo data: 5 subjects, 10 todos, 5 events, 4 exams, 14 focus sessions, profile
   - Uses date-fns for realistic date calculations
   - Returns 201 with success message
5. Updated `/home/z/my-project/src/components/dashboard/pages/settings.tsx`:
   - Added LoadDemoDataDialog component with confirmation AlertDialog
   - Added Demo Data section between Account and About
   - Gradient button with loading states, error handling, navigation to dashboard on success
6. Lint: clean
7. Updated worklog.md with task record

## Files Modified
- Created: `src/app/api/seed/route.ts`
- Modified: `src/components/dashboard/pages/settings.tsx`
- Modified: `worklog.md`

## Stage Summary
Seed data feature is fully implemented. Users can click "Load Demo Data" in Settings to populate their dashboard with realistic sample data that makes all charts and pages look rich and impressive.
