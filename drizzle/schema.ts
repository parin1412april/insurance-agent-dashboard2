import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agent profile – extended personal info for each insurance agent.
 */
export const agentProfiles = mysqlTable("agent_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firstName: varchar("firstName", { length: 100 }).notNull().default(""),
  lastName: varchar("lastName", { length: 100 }).notNull().default(""),
  nickname: varchar("nickname", { length: 100 }).notNull().default(""),
  agentCode: varchar("agentCode", { length: 50 }).notNull().default(""),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentProfile = typeof agentProfiles.$inferSelect;
export type InsertAgentProfile = typeof agentProfiles.$inferInsert;

/**
 * Kanban card – each card represents a policy case being tracked.
 * The `column` field maps to one of the 5 Kanban columns.
 */
export const kanbanCards = mysqlTable("kanban_cards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  policyNumber: varchar("policyNumber", { length: 100 }).notNull(),
  description: text("description").notNull(),
  columnStatus: mysqlEnum("columnStatus", [
    "waiting_memo",
    "editing_memo",
    "memo_sent",
    "pending_review",
    "approved",
  ]).default("waiting_memo").notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KanbanCard = typeof kanbanCards.$inferSelect;
export type InsertKanbanCard = typeof kanbanCards.$inferInsert;

/**
 * Whitelist emails – only these emails are allowed to log in.
 */
export const whitelistEmails = mysqlTable("whitelist_emails", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull().default(""),
  note: text("note"),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhitelistEmail = typeof whitelistEmails.$inferSelect;
export type InsertWhitelistEmail = typeof whitelistEmails.$inferInsert;

/**
 * Leads table – CRM for tracking prospective customers (ผู้มุ่งหวัง).
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull().default(""),
  tags: varchar("tags", { length: 1000 }).notNull().default(""), // JSON array of strings
  expectedPremium: int("expectedPremium").notNull().default(0),
  columnStatus: mysqlEnum("columnStatus", [
    "new_lead",
    "contacted",
    "fact_finding",
    "follow_up",
    "closed_won",
    "closed_lost",
  ]).default("new_lead").notNull(),
  lastMovedAt: timestamp("lastMovedAt").defaultNow().notNull(),
  notes: text("notes"),
  profileImageUrl: text("profileImageUrl"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
