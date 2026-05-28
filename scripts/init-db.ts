import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { runMigrations } from '../src/lib/migrations/index.ts';
import { schema } from '../src/lib/schema.ts';
const DATABASE_PATH = process.env.DATABASE_PATH || './data/freeform.db';

mkdirSync(dirname(DATABASE_PATH), { recursive: true });

const db = new Database(DATABASE_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(schema);
runMigrations(db);

console.log('Database initialized successfully at:', DATABASE_PATH);

db.close();
