import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const findUniqueMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    recipeReview: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { PATCH, DELETE } = await import("./route");

function req(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/recipes/1/reviews", {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const authedSession = { user: { id: "7" } };

beforeEach(() => {
  vi.mocked(auth).mockReset();
  findUniqueMock.mockReset();
  transactionMock.mockReset();
});

describe("PATCH /api/recipes/[id]/reviews", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(req("PATCH", { text: "great", rating: 5 }), ctx("1"));
    expect(res.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 404 when no existing review", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue(null);
    const res = await PATCH(req("PATCH", { text: "great", rating: 5 }), ctx("1"));
    expect(res.status).toBe(404);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("updates text/rating and recomputes the average", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({ id: 99 });

    const updateMock = vi.fn().mockResolvedValue({
      id: 99,
      text: "updated text",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    });
    const upsertMock = vi.fn().mockResolvedValue({});
    const aggregateMock = vi.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: 2 });
    const recipeUpdateMock = vi.fn().mockResolvedValue({});

    transactionMock.mockImplementation(async (fn) =>
      fn({
        recipeReview: { update: updateMock },
        recipeRating: { upsert: upsertMock, aggregate: aggregateMock },
        recipe: { update: recipeUpdateMock },
      })
    );

    const res = await PATCH(req("PATCH", { text: "updated text", rating: 5 }), ctx("1"));
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { recipeId_userId: { recipeId: 1, userId: 7 } },
      data: { text: "updated text" },
      select: { id: true, text: true, createdAt: true, updatedAt: true },
    });
    expect(upsertMock).toHaveBeenCalledWith({
      where: { recipeId_userId: { recipeId: 1, userId: 7 } },
      create: { recipeId: 1, userId: 7, rating: 5 },
      update: { rating: 5 },
    });
    expect(recipeUpdateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { avgRating: 4.5, ratingCount: 2, lastEngagementAt: expect.any(Date) },
    });
    const body = await res.json();
    expect(body.text).toBe("updated text");
  });

  it("returns 400 on invalid body", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    const res = await PATCH(req("PATCH", { text: "", rating: 99 }), ctx("1"));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/recipes/[id]/reviews", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await DELETE(req("DELETE"), ctx("1"));
    expect(res.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 404 when no existing review", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue(null);
    const res = await DELETE(req("DELETE"), ctx("1"));
    expect(res.status).toBe(404);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("removes the review and decrements reviewCount", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({ id: 99 });

    const deleteMock = vi.fn().mockResolvedValue({});
    const deleteManyMock = vi.fn().mockResolvedValue({ count: 1 });
    const aggregateMock = vi.fn().mockResolvedValue({ _avg: { rating: null }, _count: 0 });
    const recipeUpdateMock = vi.fn().mockResolvedValue({});
    const profileUpdateManyMock = vi.fn().mockResolvedValue({});

    transactionMock.mockImplementation(async (fn) =>
      fn({
        recipeReview: { delete: deleteMock },
        recipeRating: { deleteMany: deleteManyMock, aggregate: aggregateMock },
        recipe: { update: recipeUpdateMock },
        userProfile: { updateMany: profileUpdateManyMock },
      })
    );

    const res = await DELETE(req("DELETE"), ctx("1"));
    expect(res.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({
      where: { recipeId_userId: { recipeId: 1, userId: 7 } },
    });
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { recipeId: 1, userId: 7 } });
    expect(recipeUpdateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        avgRating: 0,
        ratingCount: 0,
        reviewCount: { decrement: 1 },
        lastEngagementAt: expect.any(Date),
      },
    });
    expect(profileUpdateManyMock).toHaveBeenCalledWith({
      where: { userId: 7 },
      data: { reviewCount: { decrement: 1 } },
    });
  });
});
