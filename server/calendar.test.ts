import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeMockRes() {
  return {
    clearCookie: () => {},
    cookie: () => {},
    setHeader: () => {},
  } as unknown as TrpcContext["res"];
}

function makeMockReq() {
  return {
    protocol: "https",
    headers: {},
  } as unknown as TrpcContext["req"];
}

function createUserCtx(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: role === "admin" ? 999 : 1,
    openId: role === "admin" ? "admin-open-id" : "user-open-id",
    email: role === "admin" ? "admin@test.com" : "user@test.com",
    name: role === "admin" ? "Admin User" : "Regular User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: makeMockReq(), res: makeMockRes() };
}

describe("calendar router", () => {
  it("list: returns array for valid year/month input", async () => {
    const ctx = createUserCtx("user");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendar.list({ year: 2026, month: 3 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list: rejects month out of range", async () => {
    const ctx = createUserCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.calendar.list({ year: 2026, month: 13 })).rejects.toThrow();
  });

  it("create: admin can create an event", async () => {
    const ctx = createUserCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendar.create({
      title: "Test Event",
      eventDate: "2026-03-20",
      color: "blue",
      allDay: 1,
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("create: non-admin is forbidden", async () => {
    const ctx = createUserCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calendar.create({
        title: "Unauthorized Event",
        eventDate: "2026-03-20",
        color: "red",
        allDay: 0,
      })
    ).rejects.toThrow();
  });

  it("delete: non-admin is forbidden", async () => {
    const ctx = createUserCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.calendar.delete({ id: 9999 })).rejects.toThrow();
  });

  it("update: non-admin is forbidden", async () => {
    const ctx = createUserCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calendar.update({
        id: 9999,
        title: "Hacked",
        eventDate: "2026-03-20",
        color: "green",
        allDay: 0,
      })
    ).rejects.toThrow();
  });

  it("create: validates eventDate format", async () => {
    const ctx = createUserCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calendar.create({
        title: "Bad Date",
        eventDate: "20-03-2026", // wrong format
        color: "blue",
        allDay: 0,
      })
    ).rejects.toThrow();
  });
});
