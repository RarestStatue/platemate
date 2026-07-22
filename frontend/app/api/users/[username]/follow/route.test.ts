import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const findUniqueMock = vi.fn();
const createMock = vi.fn();
const deleteManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
    userFollow: {
      create: (...args: unknown[]) => createMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { POST, DELETE } = await import("./route");

function req(method: string) {
  return new NextRequest("http://localhost/api/users/chefjosh/follow", { method });
}

function ctx(username: string) {
  return { params: Promise.resolve({ username }) };
}

const authedSession = { user: { id: "7" } };

beforeEach(() => {
  vi.mocked(auth).mockReset();
  findUniqueMock.mockReset();
  createMock.mockReset();
  deleteManyMock.mockReset();
});

describe("POST /api/users/[username]/follow", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(req("POST"), ctx("chefjosh"));
    expect(res.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown user", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue(null);
    const res = await POST(req("POST"), ctx("nope"));
    expect(res.status).toBe(404);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a soft-deleted user", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({ id: 2, deletedAt: new Date() });
    const res = await POST(req("POST"), ctx("gone"));
    expect(res.status).toBe(404);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 on self-follow", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({ id: 7, deletedAt: null });
    const res = await POST(req("POST"), ctx("chefdrew"));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a follow row", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({ id: 2, deletedAt: null });
    createMock.mockResolvedValue({});
    const res = await POST(req("POST"), ctx("chefjosh"));
    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      data: { followerId: 7, followingId: 2 },
    });
    const body = await res.json();
    expect(body.following).toBe(true);
  });

  it("treats a duplicate follow as idempotent success, not a 500", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({ id: 2, deletedAt: null });
    createMock.mockRejectedValue(new Error("Unique constraint failed on the fields"));
    const res = await POST(req("POST"), ctx("chefjosh"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.following).toBe(true);
  });
});

describe("DELETE /api/users/[username]/follow", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await DELETE(req("DELETE"), ctx("chefjosh"));
    expect(res.status).toBe(401);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown user", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue(null);
    const res = await DELETE(req("DELETE"), ctx("nope"));
    expect(res.status).toBe(404);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("removes the follow row", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({ id: 2, deletedAt: null });
    deleteManyMock.mockResolvedValue({ count: 1 });
    const res = await DELETE(req("DELETE"), ctx("chefjosh"));
    expect(res.status).toBe(200);
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { followerId: 7, followingId: 2 },
    });
    const body = await res.json();
    expect(body.following).toBe(false);
  });
});
