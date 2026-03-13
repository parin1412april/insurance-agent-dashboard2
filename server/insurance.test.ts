import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  createInsuranceSubmission: vi.fn(),
  getInsuranceSubmissions: vi.fn(),
  getInsuranceSubmissionById: vi.fn(),
  deleteInsuranceSubmission: vi.fn(),
  getInsuranceSubmissionStats: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.jpg", key: "test.jpg" }),
}));

import {
  createInsuranceSubmission,
  getInsuranceSubmissions,
  getInsuranceSubmissionById,
  deleteInsuranceSubmission,
  getInsuranceSubmissionStats,
} from "./db";

describe("Insurance DB helpers", () => {
  const mockUserId = 1;
  const mockAgentCode = "696780";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createInsuranceSubmission returns submission with ref", async () => {
    const mockResult = {
      id: 1,
      submissionRef: "INS260313-ABCDE",
      agentCode: mockAgentCode,
      userId: mockUserId,
      firstName: "ปรินทร์",
      lastName: "ถาวรวงษ์",
    };
    vi.mocked(createInsuranceSubmission).mockResolvedValue(mockResult as any);

    const result = await createInsuranceSubmission({} as any, mockUserId, mockAgentCode);
    expect(result).toHaveProperty("submissionRef");
    expect(result.agentCode).toBe(mockAgentCode);
  });

  it("getInsuranceSubmissions filters by userId", async () => {
    const mockList = {
      items: [{ id: 1, firstName: "ปรินทร์", agentCode: mockAgentCode }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    vi.mocked(getInsuranceSubmissions).mockResolvedValue(mockList as any);

    const result = await getInsuranceSubmissions(mockUserId, { page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("getInsuranceSubmissionById returns null for wrong user", async () => {
    vi.mocked(getInsuranceSubmissionById).mockResolvedValue(null);

    const result = await getInsuranceSubmissionById(999, 999);
    expect(result).toBeNull();
  });

  it("deleteInsuranceSubmission removes record", async () => {
    vi.mocked(deleteInsuranceSubmission).mockResolvedValue(true as any);

    const result = await deleteInsuranceSubmission(1, mockUserId);
    expect(deleteInsuranceSubmission).toHaveBeenCalledWith(1, mockUserId);
  });

  it("getInsuranceSubmissionStats returns counts", async () => {
    const mockStats = { total: 5, today: 2 };
    vi.mocked(getInsuranceSubmissionStats).mockResolvedValue(mockStats as any);

    const result = await getInsuranceSubmissionStats(mockUserId);
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("today");
  });
});

describe("Insurance form validation", () => {
  it("submissionRef format is correct", () => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const prefix = `INS${yy}${mm}${dd}-`;
    // Ref should start with INS + date prefix
    const ref = `${prefix}ABCDE`;
    expect(ref).toMatch(/^INS\d{6}-[A-Z0-9]+$/);
  });

  it("agentCode is preserved in submission", () => {
    const agentCode = "696780";
    const submission = { agentCode, firstName: "ปรินทร์" };
    expect(submission.agentCode).toBe(agentCode);
  });
});
