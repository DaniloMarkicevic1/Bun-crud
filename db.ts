import { Database } from 'bun:sqlite';

const db = new Database('example.db')

export { db };

