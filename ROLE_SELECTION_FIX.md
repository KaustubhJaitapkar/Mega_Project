# Role Selection and Routing Fixes

## Overview
Fixed routing issues and implemented proper role-based navigation for the Hackmate platform. Users can now select their role during signup and switch roles at any time from the dashboard.

## Changes Made

### 1. **Signup Page Enhancement** (`src/app/(auth)/signup/page.tsx`)
- Added role selection dropdown to signup form
- Users can choose from 5 roles: PARTICIPANT, ORGANISER, JUDGE, MENTOR, SPONSOR
- Redirects to `/dashboard` instead of `/profile` after signup
- Form now includes role field in signup request

### 2. **Validation Schema Update** (`src/lib/validation.ts`)
- Updated `userSignupSchema` to include optional `role` field
- Default role is PARTICIPANT if not specified
- Supports all 5 role types: PARTICIPANT, ORGANISER, JUDGE, MENTOR, SPONSOR

### 3. **Signup API Enhancement** (`src/app/api/auth/signup/route.ts`)
- Now accepts and stores the user's role from the request
- Creates user with the specified role instead of defaulting to PARTICIPANT
- Role is persisted in the database

### 4. **Role Switching API** (`src/app/api/users/role/route.ts`) - NEW FILE
- New POST endpoint at `/api/users/role`
- Allows authenticated users to change their role
- Updates the role in the database
- Returns updated user object with new role

### 5. **NextAuth Configuration Fix** (`src/lib/auth.ts`)
- Updated CredentialsProvider to include `role` in the returned user object
- JWT callback already includes role in token
- Session callback properly adds role to session.user
- Role is now available in all session objects

### 6. **Header Component Enhancement** (`src/components/Header.tsx`)
- Added role switcher dropdown in the header
- Shows current user's role
- Allows users to switch roles from any dashboard page
- Uses NextAuth's `session.update()` to update the session after role change
- Calls `router.refresh()` to reload the layout based on new role

### 7. **Minor Fix** (`src/app/(organiser)/create/page.tsx`)
- Removed unused `useState` import to fix TypeScript warning

## Route Structure

### Authentication Routes (in `(auth)` layout)
- `/login` - Login page
- `/signup` - Signup with role selection
- Redirects authenticated users to `/dashboard`

### Dashboard
- `/dashboard` - Unified dashboard with role-based rendering
  - PARTICIPANT/MENTOR: Shows available hackathons to join
  - ORGANISER: Shows create button and organizer dashboard
  - JUDGE: Shows judge scoring interface
  - SPONSOR: Shows sponsor dashboard (coming soon)

### Role-Specific Routes
- `/hackathons/[hackathonId]` - (participant layout)
- `/profile` - User profile (participant layout)
- `/create` - Create hackathon (organiser layout, ORGANISER role only)
- `/command-center/[hackathonId]` - Organizer management (ORGANISER role only)
- `/judging/[hackathonId]` - Judge scoring (JUDGE or MENTOR role only)

## User Flow

### Signup Flow
1. User navigates to `/signup`
2. Fills in name, email, password, and selects a role
3. Account is created with selected role
4. User is automatically signed in
5. Redirected to `/dashboard` with their role's dashboard view

### Role Switching Flow
1. User clicks role dropdown in header
2. Selects a new role
3. API updates the role in database
4. Session is updated with new role
5. Page refreshes to show new role's layout
6. Dashboard content changes based on new role

### Route Access
- Unauthenticated users can only access `/`, `/login`, `/signup`
- Authenticated users can always access `/dashboard`
- Organiser users can access `/create` and `/command-center/[id]`
- Judge users can access `/judging/[id]`
- Participant users can access `/hackathons/[id]` and `/profile`
- All routes redirect based on authentication/authorization

## Testing
The dev server is running at `http://localhost:3004`

To test:
1. Go to `/signup`
2. Create an account and select a role
3. You'll be taken to the dashboard with role-specific content
4. Use the role switcher in the header to switch roles
5. Dashboard content will update based on the new role
6. Try accessing role-specific routes like `/create` or `/judging`

## Session Management
- Role is stored in both JWT token and database
- Session is automatically updated when role changes
- Role persists across page refreshes and browser sessions
- NextAuth handles session invalidation and refresh

## Notes
- All routes are properly protected with authentication checks
- Role-based access control is enforced at both layout and page levels
- The unified dashboard handles all role types with appropriate UI
- Users can switch roles freely without signing out
- Role selection happens during signup for optimal UX
