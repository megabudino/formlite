const schema = `
-- Users table (better-auth compatible)
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Session table (better-auth compatible)
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Account table (better-auth compatible - stores credentials/OAuth)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    idToken TEXT,
    password TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Verification table (better-auth compatible)
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,
    name TEXT NOT NULL,
    redirect_url TEXT,
    target_emails TEXT NOT NULL DEFAULT '[]',
    allowed_domains TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    meta TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Blocked requests table
CREATE TABLE IF NOT EXISTS blocked_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id TEXT NOT NULL,
    origin TEXT,
    ip TEXT,
    user_agent TEXT,
    data TEXT NOT NULL DEFAULT '{}',
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(userId);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(userId);
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_blocked_requests_form_id ON blocked_requests(form_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_form_id ON webhooks(form_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_owner_slug ON workspaces(owner_id, slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
`;

export { schema };
