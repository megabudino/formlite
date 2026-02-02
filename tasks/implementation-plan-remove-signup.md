# Implementation Plan: Remove Public Signup

## Feature Summary

Remove the ability for users to sign up publicly. Instead, when no users exist in the database, display a "Setup" page that prompts the admin to create the initial seed user. This makes Freeform suitable for private/single-tenant deployments.

- Remove `/auth/signup` route and related UI links
- Detect empty user table on startup/first access
- Create a one-time setup flow for initial user creation
- Block signup API endpoint at the `better-auth` level

Reference: PRD → "Target Users" (self-hosting for privacy/control)

## Goals and Success Criteria

- Public signup is completely disabled (no route, no API)
- First-time setup creates the initial admin user
- Setup flow is only available when no users exist (security)
- Existing login flow remains unchanged
- Definition of done: Fresh install prompts for setup; after setup, only login is available

## Assumptions

- Only one admin user is needed for MVP (no invite system)
- The setup flow uses the same password requirements (min 8 chars)
- `better-auth` can be configured to disable signup after initial user creation

## Out of Scope (Non-Goals)

- User invitation system
- Password reset functionality
- Multiple admin users
- Role-based access control

## User Stories

### IP-001: Disable signup in better-auth configuration

**Description:** As a developer, I want to disable the signup API endpoint so that unauthorized users cannot create accounts.

**Acceptance Criteria:**
- [ ] `better-auth` configuration in `src/lib/auth.ts` disables email signup for regular requests
- [ ] POST to `/api/auth/sign-up/email` returns 403 or similar error
- [ ] Typecheck/lint passes (`npm run check`)

### IP-002: Remove signup route and page

**Description:** As a developer, I want to remove the signup page so that users cannot access the registration form.

**Acceptance Criteria:**
- [ ] Delete `src/routes/auth/signup/+page.svelte`
- [ ] Navigating to `/auth/signup` returns 404
- [ ] Typecheck/lint passes

### IP-003: Remove signup links from login page

**Description:** As a user, I should not see "Sign up" links on the login page since registration is disabled.

**Acceptance Criteria:**
- [ ] Remove "Don't have an account? Sign up" link from `src/routes/auth/login/+page.svelte`
- [ ] Login page renders without references to signup
- [ ] Typecheck/lint passes
- [ ] Verify in browser: login page has no signup link

### IP-004: Create helper to check if users exist

**Description:** As a developer, I want a server-side helper to check if any users exist in the database.

**Acceptance Criteria:**
- [ ] Create `src/lib/server/users.ts` with `hasUsers(): boolean` function
- [ ] Function queries `SELECT COUNT(*) FROM user` and returns true if count > 0
- [ ] Uses existing database connection pattern from `src/lib/auth.ts`
- [ ] Typecheck/lint passes

### IP-005: Create setup page UI

**Description:** As an admin, I want to see a setup page on first visit so I can create my account.

**Acceptance Criteria:**
- [ ] Create `src/routes/setup/+page.svelte` with form: name, email, password, confirm password
- [ ] Form matches existing auth styling (reuse `.auth-container`, `.auth-card` patterns)
- [ ] Client-side validation: name required, valid email, password min 8 chars, passwords match
- [ ] Submit button shows loading state
- [ ] Typecheck/lint passes
- [ ] Verify in browser: setup form renders correctly

### IP-006: Create setup page server logic

**Description:** As a developer, I want server-side logic to handle initial user creation securely.

**Acceptance Criteria:**
- [ ] Create `src/routes/setup/+page.server.ts` with `load` and `actions`
- [ ] `load`: Check if users exist; if yes, redirect to `/auth/login`
- [ ] `actions.default`: Create user via `better-auth` internal API or direct DB insert
- [ ] After successful creation, auto-login and redirect to `/app`
- [ ] If users already exist, return error (prevent race condition)
- [ ] Typecheck/lint passes

### IP-007: Redirect to setup when no users exist

**Description:** As a user visiting the app for the first time, I should be redirected to setup if no users exist.

**Acceptance Criteria:**
- [ ] Modify `src/hooks.server.ts` to check for users on unauthenticated routes
- [ ] If no users exist and path is `/auth/login`, redirect to `/setup`
- [ ] If no users exist and path is `/setup`, allow access
- [ ] If users exist and path is `/setup`, redirect to `/auth/login`
- [ ] Typecheck/lint passes
- [ ] Verify in browser: fresh DB redirects to setup; after setup, redirects to login

### IP-008: Update documentation

**Description:** As a user reading the README, I should understand the new setup flow.

**Acceptance Criteria:**
- [ ] Update README.md to document the initial setup process
- [ ] Remove any references to "signup" in user-facing docs
- [ ] Add note that first visit prompts for admin account creation

## Functional Requirements Mapping

- `FR-1 (PRD §Goals - self-hosted)`: Removing public signup ensures private deployment
- `FR-2 (PRD §Key Features - User authentication)`: Login remains; signup replaced with setup
- `FR-3 (PRD §Constraints)`: Single-node, single-admin simplifies security

## Technical Plan and Sequencing

1. **Database helper (IP-004)**: Create `hasUsers()` function - no dependencies
2. **Disable signup API (IP-001)**: Configure `better-auth` - no dependencies
3. **Remove signup route (IP-002)**: Delete files - depends on IP-001
4. **Remove signup links (IP-003)**: Update login page - depends on IP-002
5. **Setup page UI (IP-005)**: Create form component - depends on IP-004
6. **Setup server logic (IP-006)**: Handle user creation - depends on IP-004, IP-005
7. **Redirect logic (IP-007)**: Update hooks - depends on IP-004, IP-006
8. **Documentation (IP-008)**: Update README - depends on all above

### Impacted Modules

- `src/lib/auth.ts` - better-auth configuration
- `src/lib/server/users.ts` - new file
- `src/hooks.server.ts` - redirect logic
- `src/routes/auth/signup/` - delete
- `src/routes/auth/login/+page.svelte` - remove link
- `src/routes/setup/` - new route
- `README.md` - documentation

### Risks and Mitigations

- **Risk**: `better-auth` may not easily support conditional signup disable
  - **Mitigation**: If needed, use middleware in hooks to block signup endpoint
- **Risk**: Race condition during setup (two people creating account simultaneously)
  - **Mitigation**: Check user count inside transaction before insert

## Data & Migration Notes

- No schema changes required
- No data migration needed
- Existing users unaffected (setup only triggers on empty user table)

## Testing Plan

### Manual Testing
1. Fresh database: verify redirect to `/setup`
2. Complete setup: verify user created, redirected to `/app`
3. After setup: verify `/setup` redirects to `/auth/login`
4. After setup: verify `/auth/signup` returns 404
5. Verify login works normally after setup

### Edge Cases
- Attempt to POST to `/api/auth/sign-up/email` - should fail
- Access `/setup` when users exist - should redirect
- Submit setup form with invalid data - should show validation errors

## Rollout Plan

- No feature flags needed (breaking change, applies immediately)
- Big-bang rollout (private app, no gradual rollout needed)
- Monitoring: check server logs for 404s on `/auth/signup`
- Fallback: if issues, can restore signup route from git

## Risks and Open Questions

### Risks
- Users may bookmark old signup URL (minor - just shows 404)
- `better-auth` API for user creation may differ from signup flow

### Open Questions
- Should we add a way to create additional users later (admin panel)?
- Should setup require a "setup token" for additional security on public networks?
