import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const upsertMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    userProfile: {
      upsert: (...args: unknown[]) => upsertMock(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { PATCH } = await import("./route");

function req(body: unknown) {
  return new NextRequest("http://localhost/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const authedSession = { user: { id: "7" } };

beforeEach(() => {
  vi.mocked(auth).mockReset();
  upsertMock.mockReset();
});

describe("PATCH /api/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await PATCH(req({ isPublic: false }));
    expect(res.status).toBe(401);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("returns 400 when isPublic is missing", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    const res = await PATCH(req({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("returns 400 when isPublic is not a boolean", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    const res = await PATCH(req({ isPublic: "yes" }));
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("makes the caller's own profile private", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    upsertMock.mockResolvedValue({ isPublic: false });
    const res = await PATCH(req({ isPublic: false }));
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledWith({
      where: { userId: 7 },
      update: { isPublic: false },
      create: { userId: 7, isPublic: false },
      select: { isPublic: true },
    });
    const body = await res.json();
    expect(body).toEqual({ isPublic: false });
  });

  it("makes the caller's own profile public again", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    upsertMock.mockResolvedValue({ isPublic: true });
    const res = await PATCH(req({ isPublic: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ isPublic: true });
  });

  it("returns 500 when the write fails", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    upsertMock.mockRejectedValue(new Error("db down"));
    const res = await PATCH(req({ isPublic: false }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Failed to update profile" });
  });
});
