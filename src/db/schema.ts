
import { sql } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', (t) => ({
    id: t.uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    title: t.text().notNull(),
    done: t.boolean().default(false),
    createdAt: t.timestamp('created_at').defaultNow(),
}))