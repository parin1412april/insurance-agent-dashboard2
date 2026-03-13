import { eq, like, or, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, insuranceSubmissions, beneficiaries, InsertInsuranceSubmission, InsertBeneficiary } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Insurance Submissions =====
function generateSubmissionRef(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = nanoid(6).toUpperCase();
  return `INS${y}${m}${d}-${rand}`;
}

export async function createInsuranceSubmission(
  data: Omit<InsertInsuranceSubmission, "id" | "createdAt" | "submissionRef">,
  beneficiaryList: Omit<InsertBeneficiary, "id" | "createdAt" | "submissionId">[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const submissionRef = generateSubmissionRef();
  const [insertResult] = await db.insert(insuranceSubmissions).values({
    ...data,
    submissionRef,
  });
  const submissionId = (insertResult as any).insertId;
  if (beneficiaryList.length > 0) {
    await db.insert(beneficiaries).values(
      beneficiaryList.map((b) => ({ ...b, submissionId }))
    );
  }
  return { submissionId, submissionRef };
}

export async function getInsuranceSubmissions(params: {
  agentCode: string;
  page: number;
  limit: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { agentCode, page, limit, search } = params;
  const offset = (page - 1) * limit;
  const conditions = [eq(insuranceSubmissions.agentCode, agentCode)];
  if (search && search.trim() !== "") {
    const s = `%${search.trim()}%`;
    conditions.push(
      or(
        like(insuranceSubmissions.firstName, s),
        like(insuranceSubmissions.lastName, s),
        like(insuranceSubmissions.email, s),
        like(insuranceSubmissions.phone, s),
        like(insuranceSubmissions.submissionRef, s)
      ) as any
    );
  }
  const whereClause = conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`;
  const [items, countResult] = await Promise.all([
    db.select().from(insuranceSubmissions).where(whereClause)
      .orderBy(desc(insuranceSubmissions.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(insuranceSubmissions).where(whereClause),
  ]);
  const total = countResult[0]?.count ?? 0;
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getInsuranceSubmissionById(id: number, agentCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [submission] = await db.select().from(insuranceSubmissions)
    .where(sql`${insuranceSubmissions.id} = ${id} AND ${insuranceSubmissions.agentCode} = ${agentCode}`)
    .limit(1);
  if (!submission) return null;
  const beneficiaryList = await db.select().from(beneficiaries)
    .where(eq(beneficiaries.submissionId, id));
  return { ...submission, beneficiaries: beneficiaryList };
}

export async function deleteInsuranceSubmission(id: number, agentCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verify ownership before delete
  const [submission] = await db.select({ id: insuranceSubmissions.id })
    .from(insuranceSubmissions)
    .where(sql`${insuranceSubmissions.id} = ${id} AND ${insuranceSubmissions.agentCode} = ${agentCode}`)
    .limit(1);
  if (!submission) return false;
  await db.delete(beneficiaries).where(eq(beneficiaries.submissionId, id));
  const [result] = await db.delete(insuranceSubmissions).where(eq(insuranceSubmissions.id, id));
  return (result as any).affectedRows > 0;
}

export async function getInsuranceSubmissionStats(agentCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [totalResult] = await db.select({ count: sql<number>`count(*)` })
    .from(insuranceSubmissions).where(eq(insuranceSubmissions.agentCode, agentCode));
  const [todayResult] = await db.select({ count: sql<number>`count(*)` })
    .from(insuranceSubmissions)
    .where(sql`${insuranceSubmissions.agentCode} = ${agentCode} AND DATE(${insuranceSubmissions.createdAt}) = CURDATE()`);
  return { total: totalResult?.count ?? 0, today: todayResult?.count ?? 0 };
}
