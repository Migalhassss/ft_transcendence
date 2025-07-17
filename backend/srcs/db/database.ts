import Database from 'better-sqlite3'
import path from 'path'

// Create or connect to the database file
const db = new Database(path.join(__dirname, '../data/database.db'))

export default db
