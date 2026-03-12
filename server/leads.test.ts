import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock getDb to avoid real DB calls in unit tests
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(userId = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("leads router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns empty array when db is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.leads.list();
    expect(result).toEqual([]);
  });

  it("create throws when db is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.create({ name: "Test Lead" })
    ).rejects.toThrow("Database not available");
  });

  it("create inserts lead with correct userId and returns id", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ insertId: 42 });
    const mockDb = {
      insert: vi.fn().mockReturnValue({ values: mockInsert }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const ctx = createUserContext(5);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.leads.create({
      name: "สมชาย ใจดี",
      phone: "081-234-5678",
      tags: ["VIP", "สนใจสุขภาพ"],
      expectedPremium: 25000,
      columnStatus: "new_lead",
      notes: "ลูกค้าจากแอด",
    });

    expect(result).toEqual({ id: 42 });
    expect(mockDb.insert).toHaveBeenCalledOnce();
    const insertedValues = mockInsert.mock.calls[0][0];
    expect(insertedValues.userId).toBe(5);
    expect(insertedValues.name).toBe("สมชาย ใจดี");
    expect(insertedValues.expectedPremium).toBe(25000);
    expect(JSON.parse(insertedValues.tags)).toEqual(["VIP", "สนใจสุขภาพ"]);
  });

  it("delete throws when lead not found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.leads.delete({ id: 999 })).rejects.toThrow("Lead not found");
  });

  it("updateStatus throws when lead not found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.updateStatus({ id: 999, columnStatus: "closed_won" })
    ).rejects.toThrow("Lead not found");
  });

  it("updateStatus updates columnStatus and lastMovedAt", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({});
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, userId: 1, columnStatus: "new_lead" }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.leads.updateStatus({ id: 1, columnStatus: "closed_won" });
    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalledOnce();
  });
});
