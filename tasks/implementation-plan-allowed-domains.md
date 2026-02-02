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

### IP-001: Add allowed_domains column to forms table

**Description:** As a developer, I want to store allowed domains per form so they persist across sessions.

**Acceptance Criteria:**
- [ ] Add `allowed_domains TEXT NOT NULL DEFAULT '[]'` column to `forms` table in `src/lib/db.ts` and `src/lib/schema.sql`
- [ ] Column stores JSON array of domain strings
- [ ] Existing forms get empty array (allow all behavior)
- [ ] Typecheck/lint passes

### IP-002: Create origin validation utility

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

### IP-003: Validate origin on form submission endpoint

**Description:** As a form owner, I want submissions rejected if they come from non-allowed origins.

**Acceptance Criteria:**
- [ ] Update `src/routes/s/[form_id]/+server.ts` to check `Origin` header (fallback to `Referer`)
- [ ] Load `allowed_domains` from form record
- [ ] If origin not allowed, return 403 with `{ ok: false, error: 'Origin not allowed' }`
- [ ] If `allowed_domains` is empty, allow all origins (current behavior)
- [ ] CORS `Access-Control-Allow-Origin` header reflects the validated origin (not `*`) when domains are configured
- [ ] OPTIONS preflight also validates origin
- [ ] Typecheck/lint passes

### IP-004: Add allowed domains UI to form settings

**Description:** As a user, I want to manage allowed domains in the form settings page.

**Acceptance Criteria:**
- [ ] Add "Allowed Domains" section in Settings tab of `src/routes/app/forms/[id]/+page.svelte`
- [ ] Display current allowed domains as a list with remove buttons
- [ ] Input field to add new domain with validation feedback
- [ ] Help text explains: empty = allow all, supports wildcards
- [ ] Shows examples: `example.com`, `https://example.com`, `*.example.com`
- [ ] Typecheck/lint passes
- [ ] Verify in browser

### IP-005: Add server actions for allowed domains management

**Description:** As a developer, I want server actions to add/remove allowed domains.

**Acceptance Criteria:**
- [ ] Add `addAllowedDomain` action in `src/routes/app/forms/[id]/+page.server.ts`
- [ ] Add `removeAllowedDomain` action
- [ ] Validate domain format (reject invalid patterns)
- [ ] Normalize domains (trim, lowercase)
- [ ] Prevent duplicates
- [ ] Return form data in load function (`allowedDomains: string[]`)
- [ ] Typecheck/lint passes

### IP-006: Update Form interface and types

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

1. **Database migration** (IP-001)
   - Add column to schema files
   - Handles backward compatibility with default empty array

2. **Origin validation utility** (IP-002)
   - Pure function, easy to test
   - No dependencies on other changes

3. **Type updates** (IP-006)
   - Update interfaces before using them

4. **Submission endpoint validation** (IP-003)
   - Depends on IP-001, IP-002, IP-006
   - Core security logic

5. **Server actions** (IP-005)
   - Depends on IP-001, IP-006
   - CRUD operations for domains

6. **UI implementation** (IP-004)
   - Depends on IP-005
   - Final user-facing piece

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
