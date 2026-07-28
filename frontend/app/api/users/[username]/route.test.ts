import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const findUniqueMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { GET } = await import("./route");

function req() {
  return new NextRequest("http://localhost/api/users/chefjosh", { method: "GET" });
}

function ctx(username: string) {
  return { params: Promise.resolve({ username }) };
}

const publicProfile = {
  bio: "hi",
  avatarUrl: null,
  isPublic: true,
  recipeCount: 3,
  reviewCount: 2,
};
const privateProfile = { ...publicProfile, isPublic: false };

beforeEach(() => {
  vi.mocked(auth).mockReset();
  findUniqueMock.mockReset();
});

describe("GET /api/users/[username]", () => {
  it("returns 404 for an unknown user", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await GET(req(), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("returns 404 for a soft-deleted user", async () => {
    findUniqueMock.mockResolvedValue({
      id: 2,
      username: "gone",
      deletedAt: new Date(),
      createdAt: new Date(),
      profile: publicProfile,
    });
    const res = await GET(req(), ctx("gone"));
    expect(res.status).toBe(404);
  });

  it("returns the full public profile to an anonymous viewer", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    findUniqueMock.mockResolvedValue({
      id: 2,
      username: "chefjosh",
      deletedAt: null,
      createdAt: new Date(),
      profile: publicProfile,
    });
    const res = await GET(req(), ctx("chefjosh"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.recipeCount).toBe(3);
    expect(body.isPrivate).toBe(false);
    expect(body).not.toHaveProperty("deletedAt");
  });

  it("returns only the shell of a private profile to another viewer", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    findUniqueMock.mockResolvedValue({
      id: 2,
      username: "chefjayvyn",
      deletedAt: null,
      createdAt: new Date(),
      profile: privateProfile,
    });
    const res = await GET(req(), ctx("chefjayvyn"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPrivate).toBe(true);
    expect(body.profile.recipeCount).toBeUndefined();
    expect(body.profile.bio).toBe("hi");
  });

  it("returns the full profile to the owner of a private profile", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "2" } } as never);
    findUniqueMock.mockResolvedValue({
      id: 2,
      username: "chefjayvyn",
      deletedAt: null,
      createdAt: new Date(),
      profile: privateProfile,
    });
    const res = await GET(req(), ctx("chefjayvyn"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPrivate).toBe(false);
    expect(body.profile.recipeCount).toBe(3);
  });
});
