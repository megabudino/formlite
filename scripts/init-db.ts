import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_PATH = process.env.DATABASE_PATH || './data/freeform.db';

mkdirSync(dirname(DATABASE_PATH), { recursive: true });

const db = new Database(DATABASE_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = join(__dirname, '../src/lib/schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

db.exec(schema);

console.log('Database initialized successfully at:', DATABASE_PATH);

db.close();
