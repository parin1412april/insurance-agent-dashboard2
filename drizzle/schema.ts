import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

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

/**
 * Insurance form submissions – customers fill this via /form/:agentCode
 * agentCode links the submission to the agent who shared the link.
 */
export const insuranceSubmissions = mysqlTable("insurance_submissions", {
  id: int("id").autoincrement().primaryKey(),
  agentCode: varchar("agentCode", { length: 50 }).notNull().default(""),
  // Personal info
  prefix: varchar("prefix", { length: 20 }).notNull().default(""),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  occupation: varchar("occupation", { length: 200 }).notNull(),
  position: varchar("position", { length: 200 }).notNull(),
  height: decimal("height", { precision: 5, scale: 1 }).notNull(),
  weight: decimal("weight", { precision: 5, scale: 1 }).notNull(),
  annualIncome: decimal("annualIncome", { precision: 15, scale: 2 }).notNull(),
  // ID Card
  idCardStatus: mysqlEnum("idCardStatus", ["sent", "not_sent"]).default("not_sent").notNull(),
  idCardImageUrl: text("idCardImageUrl"),
  // Marital status
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced", "widowed"]).default("single").notNull(),
  spouseFirstName: varchar("spouseFirstName", { length: 100 }),
  spouseLastName: varchar("spouseLastName", { length: 100 }),
  spouseBirthDate: varchar("spouseBirthDate", { length: 20 }),
  // Address
  useIdCardAddress: int("useIdCardAddress").default(0).notNull(),
  addressLine: text("addressLine"),
  subDistrict: varchar("subDistrict", { length: 100 }),
  district: varchar("district", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postalCode", { length: 10 }),
  // Payment
  benefitPaymentMethod: mysqlEnum("benefitPaymentMethod", ["bank_account", "promptpay"]).notNull(),
  bankName: varchar("bankName", { length: 100 }),
  bankAccountNumber: varchar("bankAccountNumber", { length: 50 }),
  policyDelivery: mysqlEnum("policyDelivery", ["e_document", "paper_customer", "paper_agent"]).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["qr_transfer", "credit_debit"]).notNull(),
  // Existing insurance
  hasExistingInsurance: int("hasExistingInsurance").default(0).notNull(),
  existingInsuranceCompany: varchar("existingInsuranceCompany", { length: 200 }),
  hasLifeInsurance: int("hasLifeInsurance").default(0).notNull(),
  hasCriticalIllness: int("hasCriticalIllness").default(0).notNull(),
  hasAccidentRider: int("hasAccidentRider").default(0).notNull(),
  hasHospitalDaily: int("hasHospitalDaily").default(0).notNull(),
  existingPolicyActive: mysqlEnum("existingPolicyActive", ["active", "inactive"]),
  sumInsured: int("sumInsured"), // ทุนประกัน
  wasPreviouslyRejected: int("wasPreviouslyRejected").default(0).notNull(),
  rejectedCompany: varchar("rejectedCompany", { length: 200 }),
  rejectedReason: varchar("rejectedReason", { length: 500 }),
  rejectedDate: varchar("rejectedDate", { length: 20 }),
  // Metadata
  submissionRef: varchar("submissionRef", { length: 20 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsuranceSubmission = typeof insuranceSubmissions.$inferSelect;
export type InsertInsuranceSubmission = typeof insuranceSubmissions.$inferInsert;

/**
 * Beneficiaries linked to insurance submissions.
 */
export const beneficiaries = mysqlTable("beneficiaries", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  age: int("age").notNull(),
  prefix: varchar("prefix", { length: 50 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = typeof beneficiaries.$inferInsert;

/**
 * Calendar events – shared team calendar managed by admin.
 * All users can view; only admin can create/update/delete.
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  eventDate: varchar("eventDate", { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar("startTime", { length: 5 }), // HH:MM, null = all-day
  endTime: varchar("endTime", { length: 5 }), // HH:MM, null = all-day
  color: varchar("color", { length: 30 }).notNull().default("blue"), // blue | red | green | orange | purple | amber
  allDay: int("allDay").notNull().default(0),
  imageUrl: varchar("imageUrl", { length: 1000 }), // S3 URL for event image
  orgTag: varchar("orgTag", { length: 50 }), // AIA | 912 | FinAlly | Heartworker | Financiaka | MergeMingle
  courseTag: varchar("courseTag", { length: 200 }), // JSON array e.g. ["ULP","MDRT"] — multi-select
  createdBy: int("createdBy").notNull(), // userId who created it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Goal settings – stores each user's Goal Setting page preferences.
 * One row per user (upsert on save).
 */
export const goalSettings = mysqlTable("goal_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  selectedGoal: varchar("selectedGoal", { length: 50 }).notNull().default("MDRT"),
  customFYP: int("customFYP").notNull().default(2000000),
  currentFYPInput: varchar("currentFYPInput", { length: 50 }).notNull().default(""),
  avgCaseSize: int("avgCaseSize").notNull().default(80000),
  prospectToAppt: int("prospectToAppt").notNull().default(50),
  apptToPres: int("apptToPres").notNull().default(70),
  presToClose: int("presToClose").notNull().default(30),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoalSetting = typeof goalSettings.$inferSelect;
export type InsertGoalSetting = typeof goalSettings.$inferInsert;

/**
 * Event images – multiple images per calendar event.
 * Replaces the single imageUrl on calendarEvents for multi-image support.
 */
export const eventImages = mysqlTable("event_images", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(), // FK → calendarEvents.id
  url: varchar("url", { length: 1000 }).notNull(), // S3 URL
  sortOrder: int("sortOrder").notNull().default(0), // display order
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EventImage = typeof eventImages.$inferSelect;
export type InsertEventImage = typeof eventImages.$inferInsert;
