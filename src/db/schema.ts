import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import * as authTables from "./auth-schema"

export * from "./auth-schema"

export const todos = pgTable("todos", (t) => ({
    id: t
        .uuid()
        .primaryKey()
        .$default(() => Bun.randomUUIDv7()),
    title: t.text().notNull(),
    done: t.boolean().default(false),
    createdAt: t.timestamp("created_at").defaultNow(),
}))

export const organizations = pgTable("organizations", {
    id: text("id")
        .primaryKey()
        .$default(() => Bun.randomUUIDv7()),
    name: text("name").notNull(),
    ownerUserId: text("owner_user_id")
        .notNull()
        .unique()
        .references(() => authTables.user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
})

export const onboardingProgress = pgTable("onboarding_progress", {
    userId: text("user_id")
        .primaryKey()
        .references(() => authTables.user.id, { onDelete: "cascade" }),
    nameCompletedAt: timestamp("name_completed_at"),
    organizationId: text("organization_id").references(() => organizations.id, {
        onDelete: "set null",
    }),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
})

export const organizationRelations = relations(organizations, ({ one }) => ({
    owner: one(authTables.user, {
        fields: [organizations.ownerUserId],
        references: [authTables.user.id],
    }),
}))

export const onboardingProgressRelations = relations(
    onboardingProgress,
    ({ one }) => ({
        user: one(authTables.user, {
            fields: [onboardingProgress.userId],
            references: [authTables.user.id],
        }),
        organization: one(organizations, {
            fields: [onboardingProgress.organizationId],
            references: [organizations.id],
        }),
    })
)
