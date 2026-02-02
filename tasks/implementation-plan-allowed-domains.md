# Implementation Plan: Allowed Domains for Cross-Origin Submissions

## Feature Summary

- Add per-form configuration for allowed origin domains
- Validate incoming submission requests against the allowed domains list
- Support both CORS preflight and CSRF origin validation
- Accept full origins (`https://example.com`) or domain-only (`example.com`)
- Support wildcard subdomains (`*.example.com`)
- Empty list = accept all origins (backward compatible)

## Goals and Success Criteria

- Users can configure allowed domains in form settings
- Cross-origin submissions are rejected if origin doesn't match allowed list
- CORS headers dynamically reflect allowed origins
- Existing forms continue working (empty list = allow all)

## Assumptions

- Validation uses the `Origin` or `Referer` header from incoming requests
- Wildcard only supported as prefix (`*.example.com`), not arbitrary patterns
- Domain matching is case-insensitive

## Out of Scope

- IP-based allowlisting
- Rate limiting per domain
- Analytics on blocked requests

## User Stories

### IP-001: Create database migrations system

**Description:** As a developer, I want a migrations system so schema changes can be applied consistently across all instances.

**Acceptance Criteria:**
- [ ] Create `src/lib/migrations/` directory
- [ ] Create `src/lib/migrations/index.ts` with `runMigrations(db: Database)` function
- [ ] Create migrations table: `CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`
- [ ] Migrations are applied in order and tracked to prevent re-running
- [ ] Call `runMigrations()` from `src/lib/db.ts` after database initialization
- [ ] Typecheck/lint passes

### IP-002: Add allowed_domains column and blocked_requests table via migration

**Description:** As a developer, I want to store allowed domains per form and log blocked requests.

**Acceptance Criteria:**
- [ ] Create `src/lib/migrations/001_add_allowed_domains.ts` migration file
- [ ] Migration adds `allowed_domains TEXT NOT NULL DEFAULT '[]'` column to `forms` table using `ALTER TABLE`
- [ ] Migration creates `blocked_requests` table with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `form_id TEXT NOT NULL`, `origin TEXT`, `ip TEXT`, `user_agent TEXT`, `data TEXT NOT NULL DEFAULT '{}'`, `reason TEXT NOT NULL`, `created_at TEXT NOT NULL DEFAULT (datetime('now'))`, `FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE`
- [ ] Add index on `blocked_requests(form_id)`
- [ ] Update `src/lib/schema.sql` to include both `allowed_domains` column and `blocked_requests` table for fresh installs
- [ ] Typecheck/lint passes

### IP-003: Create origin validation utility

**Description:** As a developer, I want a utility function to validate request origins against allowed domains.

**Acceptance Criteria:**
- [ ] Create `src/lib/server/origin.ts` with `isOriginAllowed(origin: string | null, allowedDomains: string[]): boolean`
- [ ] Empty `allowedDomains` array returns `true` (allow all)
- [ ] Supports full origins (`https://example.com`) - exact match
- [ ] Supports domain-only (`example.com`) - matches any protocol
- [ ] Supports wildcards (`*.example.com`) - matches subdomains
- [ ] Matching is case-insensitive
- [ ] Unit tests cover all cases
- [ ] Typecheck/lint passes

### IP-004: Validate origin on form submission endpoint and log blocked requests

**Description:** As a form owner, I want submissions rejected if they come from non-allowed origins, and blocked requests logged to the database.

**Acceptance Criteria:**
- [ ] Update `src/routes/s/[form_id]/+server.ts` to check `Origin` header (fallback to `Referer`)
- [ ] Load `allowed_domains` from form record
- [ ] If origin not allowed, log to `blocked_requests` table with reason "origin_not_allowed", origin, IP, user agent, and submitted data
- [ ] If origin not allowed, return 403 with `{ ok: false, error: 'Origin not allowed' }`
- [ ] If `allowed_domains` is empty, allow all origins (current behavior)
- [ ] CORS `Access-Control-Allow-Origin` header reflects the validated origin (not `*`) when domains are configured
- [ ] OPTIONS preflight also validates origin
- [ ] Typecheck/lint passes

### IP-005: Add allowed domains UI to form settings

**Description:** As a user, I want to manage allowed domains in the form settings page.

**Acceptance Criteria:**
- [ ] Add "Allowed Domains" section in Settings tab of `src/routes/app/forms/[id]/+page.svelte`
- [ ] Display current allowed domains as a list with remove buttons
- [ ] Input field to add new domain with validation feedback
- [ ] Help text explains: empty = allow all, supports wildcards
- [ ] Shows examples: `example.com`, `https://example.com`, `*.example.com`
- [ ] Typecheck/lint passes
- [ ] Verify in browser

### IP-008: Add Spam tab to view blocked requests

**Description:** As a user, I want to see blocked requests in a "Spam" tab so I can monitor rejected submissions.

**Acceptance Criteria:**
- [ ] Add "Spam" tab to the form detail page navigation (after Submissions tab)
- [ ] Load blocked requests in `+page.server.ts` with pagination (similar to submissions)
- [ ] Display blocked requests list showing: date, origin, reason, and expandable data
- [ ] Show empty state when no blocked requests exist
- [ ] Add "Clear All" button to delete all blocked requests for the form
- [ ] Add `clearBlockedRequests` server action
- [ ] Typecheck/lint passes
- [ ] Verify in browser

### IP-006: Add server actions for allowed domains management

**Description:** As a developer, I want server actions to add/remove allowed domains.

**Acceptance Criteria:**
- [ ] Add `addAllowedDomain` action in `src/routes/app/forms/[id]/+page.server.ts`
- [ ] Add `removeAllowedDomain` action
- [ ] Validate domain format (reject invalid patterns)
- [ ] Normalize domains (trim, lowercase)
- [ ] Prevent duplicates
- [ ] Return form data in load function (`allowedDomains: string[]`)
- [ ] Typecheck/lint passes

### IP-007: Update Form interface and types

**Description:** As a developer, I want consistent typing for allowed_domains across the codebase.

**Acceptance Criteria:**
- [ ] Update `Form` interface in `+page.server.ts` to include `allowed_domains: string`
- [ ] Update `Form` interface in `+server.ts` to include `allowed_domains: string`
- [ ] Update load function return type to include `allowedDomains: string[]`
- [ ] Typecheck/lint passes

## Functional Requirements Mapping

- FR-1 (PRD §Key Features - Form management): Extends form configuration with domain restrictions
- FR-2 (PRD §Goals - Self-hosted alternative): Provides security control for cross-origin submissions

## Technical Plan and Sequencing

1. **Migrations system** (IP-001)
   - Create reusable migrations infrastructure
   - Foundation for all future schema changes

2. **Database migration** (IP-002)
   - Add allowed_domains column and blocked_requests table via migration
   - Update schema.sql for fresh installs

3. **Origin validation utility** (IP-003)
   - Pure function, easy to test
   - No dependencies on other changes

4. **Type updates** (IP-007)
   - Update interfaces before using them

5. **Submission endpoint validation** (IP-004)
   - Depends on IP-002, IP-003, IP-007
   - Core security logic + blocked request logging

6. **Server actions** (IP-006)
   - Depends on IP-002, IP-007
   - CRUD operations for domains

7. **Allowed domains UI** (IP-005)
   - Depends on IP-006
   - Settings page for domain management

8. **Spam tab UI** (IP-008)
   - Depends on IP-002, IP-004
   - View blocked requests

## Data & Migration Notes

- New column with `DEFAULT '[]'` ensures backward compatibility
- No data migration needed - existing forms get empty array
- SQLite handles the default on existing rows

## Testing Plan

- **Unit tests**: `src/lib/server/origin.test.ts` for `isOriginAllowed` function
  - Empty array allows all
  - Exact origin match
  - Domain-only match (any protocol)
  - Wildcard subdomain match
  - Case insensitivity
  - Invalid/null origin handling
- **Integration tests**: Manual testing of submission endpoint with various origins
- **E2E/UI**: Verify domain management in settings page

## Rollout Plan

- No feature flag needed - backward compatible by default
- Empty allowed_domains = current behavior (allow all)
- Users opt-in by adding domains

## Risks and Open Questions

- **Risk**: Users might accidentally lock themselves out by misconfiguring domains
  - Mitigation: Clear help text, show current origin in UI
- **Open**: Should we log blocked requests for debugging?
