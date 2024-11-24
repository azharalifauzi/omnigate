import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import * as schema from '~/schemas'
import pg from 'pg'

export const client = new pg.Client(process.env.DATABASE_URL)
console.log('Connect to DB')
await client.connect()
export const db = drizzle(client, { schema })
console.log('Start migration')
await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migration end')
await client.end()
console.log('Connection closed')
