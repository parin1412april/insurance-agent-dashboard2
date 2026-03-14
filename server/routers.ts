import { COOKIE_NAME } from "@shared/const";
import { insuranceFormSchema } from "@shared/insurance";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { agentProfiles, calendarEvents, kanbanCards, leads, users, whitelistEmails } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, createInsuranceSubmission, getInsuranceSubmissions, getInsuranceSubmissionById, deleteInsuranceSubmission, getInsuranceSubmissionStats } from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ── Zod schemas ──────────────────────────────────────────────────────
const columnStatusEnum = z.enum([
  "waiting_memo",
  "editing_memo",
  "memo_sent",
  "pending_review",
  "approved",
]);

// ── Profile router ───────────────────────────────────────────────────
const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, ctx.user.id))
      .limit(1);
    return rows[0] ?? null;
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        firstName: z.string().max(100),
        lastName: z.string().max(100),
        nickname: z.string().max(100),
        agentCode: z.string().max(50),
        phone: z.string().max(20),
        status: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(agentProfiles)
        .where(eq(agentProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(agentProfiles)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            nickname: input.nickname,
            agentCode: input.agentCode,
            phone: input.phone,
            ...(input.status ? { status: input.status } : {}),
          })
          .where(eq(agentProfiles.userId, ctx.user.id));
      } else {
        await db.insert(agentProfiles).values({
          userId: ctx.user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          nickname: input.nickname,
          agentCode: input.agentCode,
          phone: input.phone,
          status: input.status ?? "active",
        });
      }
      return { success: true };
    }),
});

// ── Kanban router ────────────────────────────────────────────────────
const kanbanRouter = router({
  // Get cards for current user (with agent profile info)
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: kanbanCards.id,
        userId: kanbanCards.userId,
        policyNumber: kanbanCards.policyNumber,
        description: kanbanCards.description,
        columnStatus: kanbanCards.columnStatus,
        sortOrder: kanbanCards.sortOrder,
        createdAt: kanbanCards.createdAt,
        updatedAt: kanbanCards.updatedAt,
        agentFirstName: agentProfiles.firstName,
        agentLastName: agentProfiles.lastName,
        agentCode: agentProfiles.agentCode,
      })
      .from(kanbanCards)
      .leftJoin(agentProfiles, eq(agentProfiles.userId, kanbanCards.userId))
      .where(eq(kanbanCards.userId, ctx.user.id))
      .orderBy(kanbanCards.sortOrder);
    return rows;
  }),

  // Create a new card
  create: protectedProcedure
    .input(
      z.object({
        policyNumber: z.string().min(1).max(100),
        description: z.string().min(1),
        columnStatus: columnStatusEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get max sortOrder for this column
      const maxOrder = await db
        .select({ maxSort: sql<number>`COALESCE(MAX(${kanbanCards.sortOrder}), 0)` })
        .from(kanbanCards)
        .where(
          and(
            eq(kanbanCards.userId, ctx.user.id),
            eq(kanbanCards.columnStatus, input.columnStatus ?? "waiting_memo")
          )
        );

      const result = await db.insert(kanbanCards).values({
        userId: ctx.user.id,
        policyNumber: input.policyNumber,
        description: input.description,
        columnStatus: input.columnStatus ?? "waiting_memo",
        sortOrder: (maxOrder[0]?.maxSort ?? 0) + 1,
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  // Update card details
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        policyNumber: z.string().min(1).max(100).optional(),
        description: z.string().min(1).optional(),
        columnStatus: columnStatusEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, unknown> = {};
      if (input.policyNumber !== undefined) updateData.policyNumber = input.policyNumber;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.columnStatus !== undefined) updateData.columnStatus = input.columnStatus;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(kanbanCards)
          .set(updateData)
          .where(
            and(eq(kanbanCards.id, input.id), eq(kanbanCards.userId, ctx.user.id))
          );
      }
      return { success: true };
    }),

  // Move card to a different column (drag-and-drop)
  move: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        columnStatus: columnStatusEnum,
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(kanbanCards)
        .set({
          columnStatus: input.columnStatus,
          sortOrder: input.sortOrder ?? 0,
        })
        .where(
          and(eq(kanbanCards.id, input.id), eq(kanbanCards.userId, ctx.user.id))
        );
      return { success: true };
    }),

  // Delete a card
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(kanbanCards)
        .where(
          and(eq(kanbanCards.id, input.id), eq(kanbanCards.userId, ctx.user.id))
        );
      return { success: true };
    }),
});

// ── Admin router ─────────────────────────────────────────────────────
const adminRouter = router({
  // Get all cards from all users (with user info)
  allCards: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        card: kanbanCards,
        userName: users.name,
        userEmail: users.email,
        profileNickname: agentProfiles.nickname,
        profileFirstName: agentProfiles.firstName,
        profileLastName: agentProfiles.lastName,
        profileAgentCode: agentProfiles.agentCode,
        profileStatus: agentProfiles.status,
      })
      .from(kanbanCards)
      .leftJoin(users, eq(kanbanCards.userId, users.id))
      .leftJoin(agentProfiles, eq(kanbanCards.userId, agentProfiles.userId))
      .orderBy(kanbanCards.updatedAt);
    return rows;
  }),

  // List all users
  allUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(users).orderBy(users.createdAt);
  }),

  // Set user role (admin / user)
  setRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Set admin role by email (even if user hasn't logged in yet)
  setRoleByEmail: adminProcedure
    .input(
      z.object({
        email: z.string().email().max(320),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user exists with this email
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        // User exists, update role
        await db
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, existing[0].id));
        return { success: true, status: "updated" as const };
      } else {
        // User hasn't logged in yet - we'll store the email in whitelist with admin note
        // The role will be set when they first log in
        return { success: false, status: "not_found" as const };
      }
    }),

  // Whitelist email management
  whitelistEmails: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(whitelistEmails).orderBy(whitelistEmails.createdAt);
    }),

    add: adminProcedure
      .input(
        z.object({
          email: z.string().email().max(320),
          name: z.string().max(200).optional(),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.insert(whitelistEmails).values({
          email: input.email.toLowerCase(),
          name: input.name ?? "",
          note: input.note ?? null,
        });
        return { success: true };
      }),

    remove: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(whitelistEmails).where(eq(whitelistEmails.id, input.id));
        return { success: true };
      }),

    toggle: adminProcedure
      .input(z.object({ id: z.number(), isActive: z.number().min(0).max(1) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(whitelistEmails)
          .set({ isActive: input.isActive })
          .where(eq(whitelistEmails.id, input.id));
        return { success: true };
      }),
  }),
});

// ── Leads router ───────────────────────────────────────────────────
const leadColumnStatusEnum = z.enum([
  "new_lead",
  "contacted",
  "fact_finding",
  "follow_up",
  "closed_won",
  "closed_lost",
]);

const leadsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(leads)
      .where(eq(leads.userId, ctx.user.id))
      .orderBy(leads.sortOrder, leads.createdAt);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        phone: z.string().max(30).optional(),
        tags: z.array(z.string()).optional(),
        expectedPremium: z.number().min(0).optional(),
        columnStatus: leadColumnStatusEnum.optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const tagsJson = JSON.stringify(input.tags ?? []);
      const result = await db.insert(leads).values({
        userId: ctx.user.id,
        name: input.name,
        phone: input.phone ?? "",
        tags: tagsJson,
        expectedPremium: input.expectedPremium ?? 0,
        columnStatus: input.columnStatus ?? "new_lead",
        notes: input.notes ?? null,
        lastMovedAt: new Date(),
      });
      return { id: Number((result as any).insertId) };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        phone: z.string().max(30).optional(),
        tags: z.array(z.string()).optional(),
        expectedPremium: z.number().min(0).optional(),
        columnStatus: leadColumnStatusEnum.optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(leads).where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id))).limit(1);
      if (!existing[0]) throw new Error("Lead not found");
      const updateData: Partial<typeof leads.$inferInsert> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
      if (input.expectedPremium !== undefined) updateData.expectedPremium = input.expectedPremium;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.columnStatus !== undefined) {
        updateData.columnStatus = input.columnStatus;
        updateData.lastMovedAt = new Date();
      }
      await db.update(leads).set(updateData).where(eq(leads.id, input.id));
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), columnStatus: leadColumnStatusEnum }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(leads).where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id))).limit(1);
      if (!existing[0]) throw new Error("Lead not found");
      await db.update(leads).set({ columnStatus: input.columnStatus, lastMovedAt: new Date() }).where(eq(leads.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(leads).where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id))).limit(1);
      if (!existing[0]) throw new Error("Lead not found");
      await db.delete(leads).where(eq(leads.id, input.id));
      return { success: true };
    }),
});

// ── Insurance router ─────────────────────────────────────────────────
const insuranceRouter = router({
  // Public: submit form (no login required)
  submit: publicProcedure
    .input(insuranceFormSchema)
    .mutation(async ({ input }) => {
      const { beneficiaries: beneficiaryList, agentCode, ...formData } = input as any;
      const result = await createInsuranceSubmission(
        {
          agentCode: agentCode || "",
          prefix: formData.prefix || "",
          firstName: formData.firstName,
          lastName: formData.lastName,
          nickname: formData.nickname || null,
          phone: formData.phone,
          email: formData.email,
          occupation: formData.occupation,
          position: formData.position,
          height: String(formData.height),
          weight: String(formData.weight),
          annualIncome: String(formData.annualIncome),
          idCardStatus: formData.idCardStatus,
          idCardImageUrl: formData.idCardImageUrl || null,
          maritalStatus: formData.maritalStatus,
          spouseFirstName: formData.spouseFirstName || null,
          spouseLastName: formData.spouseLastName || null,
          spouseBirthDate: formData.spouseBirthDate || null,
          useIdCardAddress: formData.useIdCardAddress ? 1 : 0,
          addressLine: formData.addressLine || null,
          subDistrict: formData.subDistrict || null,
          district: formData.district || null,
          province: formData.province || null,
          postalCode: formData.postalCode || null,
          benefitPaymentMethod: formData.benefitPaymentMethod,
          bankName: formData.bankName || null,
          bankAccountNumber: formData.bankAccountNumber || null,
          policyDelivery: formData.policyDelivery,
          paymentMethod: formData.paymentMethod,
          hasExistingInsurance: formData.hasExistingInsurance ? 1 : 0,
          existingInsuranceCompany: formData.existingInsuranceCompany || null,
          hasLifeInsurance: formData.hasLifeInsurance ? 1 : 0,
          hasCriticalIllness: formData.hasCriticalIllness ? 1 : 0,
          hasAccidentRider: formData.hasAccidentRider ? 1 : 0,
          hasHospitalDaily: formData.hasHospitalDaily ? 1 : 0,
          existingPolicyActive: formData.existingPolicyActive || null,
          sumInsured: formData.sumInsured ?? null,
          wasPreviouslyRejected: formData.wasPreviouslyRejected ? 1 : 0,
          rejectedCompany: formData.rejectedCompany || null,
          rejectedReason: formData.rejectedReason || null,
          rejectedDate: formData.rejectedDate || null,
        },
        (beneficiaryList || []).map((b: any) => ({
          gender: b.gender,
          age: b.age,
          prefix: b.prefix,
          firstName: b.firstName,
          lastName: b.lastName,
          percentage: String(b.percentage),
          relationship: b.relationship,
        }))
      );
      try {
        await notifyOwner({
          title: `มีลูกค้ากรอกข้อมูลประกันใหม่ (รหัสตัวแทน: ${agentCode})`,
          content: `ลูกค้า: ${formData.firstName} ${formData.lastName}\nเบอร์โทร: ${formData.phone}\nรหัสอ้างอิง: ${result.submissionRef}`,
        });
      } catch (e) {
        console.warn("[Notification] Failed:", e);
      }
      return { success: true, submissionRef: result.submissionRef };
    }),

  // Public: upload ID card image
  uploadImage: publicProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `id-cards/${nanoid(12)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // Protected: list own submissions
  list: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20), search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const profile = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, ctx.user.id)).limit(1);
      const agentCode = profile[0]?.agentCode || "";
      if (!agentCode) return { items: [], total: 0, page: 1, limit: input.limit, totalPages: 0 };
      return getInsuranceSubmissions({ agentCode, ...input });
    }),

  // Protected: get detail
  detail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const profile = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, ctx.user.id)).limit(1);
      const agentCode = profile[0]?.agentCode || "";
      return getInsuranceSubmissionById(input.id, agentCode);
    }),

  // Protected: delete own submission
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const profile = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, ctx.user.id)).limit(1);
      const agentCode = profile[0]?.agentCode || "";
      const ok = await deleteInsuranceSubmission(input.id, agentCode);
      if (!ok) throw new Error("Not found or not authorized");
      return { success: true };
    }),

  // Protected: stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const profile = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, ctx.user.id)).limit(1);
    const agentCode = profile[0]?.agentCode || "";
    if (!agentCode) return { total: 0, today: 0 };
    return getInsuranceSubmissionStats(agentCode);
  }),
});

// ── Calendar router ──────────────────────────────────────────────────────────────
const calendarEventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  color: z.enum(["blue", "red", "green", "orange", "purple", "amber"]).default("blue"),
  allDay: z.number().int().min(0).max(1).default(0),
  imageUrl: z.string().url().optional(),
});

const calendarRouter = router({
  // Public: list events for a given month (year+month)
  list: protectedProcedure
    .input(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const prefix = `${input.year}-${String(input.month).padStart(2, "0")}`;
      const rows = await db
        .select()
        .from(calendarEvents)
        .where(sql`${calendarEvents.eventDate} LIKE ${prefix + "-%"}`)
        .orderBy(calendarEvents.eventDate, calendarEvents.startTime);
      return rows;
    }),

  // Admin: create event
  create: adminProcedure
    .input(calendarEventSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(calendarEvents).values({
        ...input,
        createdBy: ctx.user.id,
      });
      return { id: (result as any).insertId as number };
    }),

  // Admin: update event
  update: adminProcedure
    .input(calendarEventSchema.extend({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id));
      return { success: true };
    }),

  // Admin: upload event image
  uploadImage: adminProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const key = `calendar-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // Admin: delete event
  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(calendarEvents).where(eq(calendarEvents.id, input.id));
      return { success: true };
    }),
});

// ── App router ────────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: profileRouter,
  kanban: kanbanRouter,
  admin: adminRouter,
  leads: leadsRouter,
  insurance: insuranceRouter,
  calendar: calendarRouter,
});

export type AppRouter = typeof appRouter;
