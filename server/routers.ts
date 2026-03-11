import { COOKIE_NAME } from "@shared/const";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { agentProfiles, kanbanCards, users, whitelistEmails } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

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
  // Get cards for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(kanbanCards)
      .where(eq(kanbanCards.userId, ctx.user.id))
      .orderBy(kanbanCards.sortOrder);
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, unknown> = {};
      if (input.policyNumber !== undefined) updateData.policyNumber = input.policyNumber;
      if (input.description !== undefined) updateData.description = input.description;

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

// ── App router ───────────────────────────────────────────────────────
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
});

export type AppRouter = typeof appRouter;
