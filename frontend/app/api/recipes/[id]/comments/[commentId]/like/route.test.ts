import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const commentFindUniqueMock = vi.fn();
const likeFindUniqueMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    recipeComment: {
      findUnique: (...args: unknown[]) => commentFindUniqueMock(...args),
    },
    recipeCommentLike: {
      findUnique: (...args: unknown[]) => likeFindUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { POST, DELETE } = await import("./route");

function req(method: string) {
  return new NextRequest(
    "http://localhost/api/recipes/1/comments/5/like",
    { method }
  );
}

function ctx(id: string, commentId: string) {
  return { params: Promise.resolve({ id, commentId }) };
}

const authedSession = { user: { id: "7" } };

function mockLikeTx(likeCount: number) {
  const createMock = vi.fn().mockResolvedValue({});
  const commentUpdateMock = vi.fn().mockResolvedValue({ likeCount });
  const recipeUpdateMock = vi.fn().mockResolvedValue({});
  transactionMock.mockImplementation(async (fn) =>
    fn({
      recipeCommentLike: { create: createMock },
      recipeComment: { update: commentUpdateMock },
      recipe: { update: recipeUpdateMock },
    })
  );
  return { createMock, commentUpdateMock, recipeUpdateMock };
}

function mockUnlikeTx(count: number, likeCount: number) {
  const deleteManyMock = vi.fn().mockResolvedValue({ count });
  const commentUpdateMock = vi.fn().mockResolvedValue({ likeCount });
  transactionMock.mockImplementation(async (fn) =>
    fn({
      recipeCommentLike: { deleteMany: deleteManyMock },
      recipeComment: { update: commentUpdateMock },
    })
  );
  return { deleteManyMock, commentUpdateMock };
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  commentFindUniqueMock.mockReset();
  likeFindUniqueMock.mockReset();
  transactionMock.mockReset();
});

describe("POST /api/recipes/[id]/comments/[commentId]/like", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(req("POST"), ctx("1", "5"));
    expect(res.status).toBe(401);
    expect(commentFindUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the comment id is not a number", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    const res = await POST(req("POST"), ctx("1", "abc"));
    expect(res.status).toBe(400);
    expect(commentFindUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the comment does not exist", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    commentFindUniqueMock.mockResolvedValue(null);
    const res = await POST(req("POST"), ctx("1", "5"));
    expect(res.status).toBe(404);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the comment belongs to another recipe", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    commentFindUniqueMock.mockResolvedValue({
      id: 5,
      recipeId: 2,
      likeCount: 0,
    });
    const res = await POST(req("POST"), ctx("1", "5"));
    expect(res.status).toBe(404);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("creates the like and increments the count", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    commentFindUniqueMock.mockResolvedValue({
      id: 5,
      recipeId: 1,
      likeCount: 0,
    });
    likeFindUniqueMock.mockResolvedValue(null);
    const { createMock, commentUpdateMock } = mockLikeTx(1);

    const res = await POST(req("POST"), ctx("1", "5"));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ liked: true, likeCount: 1 });
    expect(createMock).toHaveBeenCalledWith({
      data: { commentId: 5, userId: 7 },
    });
    expect(commentUpdateMock).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
  });

  it("stays idempotent when a concurrent like wins the primary-key race", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    commentFindUniqueMock
      .mockResolvedValueOnce({ id: 5, recipeId: 1, likeCount: 0 })
      .mockResolvedValueOnce({ likeCount: 1 });
    likeFindUniqueMock.mockResolvedValue(null);
    transactionMock.mockRejectedValue(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
    );

    const res = await POST(req("POST"), ctx("1", "5"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ liked: true, likeCount: 1 });
  });

  it("is idempotent when the caller already liked the comment", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    commentFindUniqueMock.mockResolvedValue({
      id: 5,
      recipeId: 1,
      likeCount: 1,
    });
    likeFindUniqueMock.mockResolvedValue({ commentId: 5 });

    const res = await POST(req("POST"), ctx("1", "5"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ liked: true, likeCount: 1 });
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/recipes/[id]/comments/[commentId]/like", () => {
  it("removes the like and decrements the count", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    commentFindUniqueMock.mockResolvedValue({
      id: 5,
      recipeId: 1,
      likeCount: 1,
    });
    const { deleteManyMock, commentUpdateMock } = mockUnlikeTx(1, 0);

    const res = await DELETE(req("DELETE"), ctx("1", "5"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ liked: false, likeCount: 0 });
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { commentId: 5, userId: 7 },
    });
    expect(commentUpdateMock).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { likeCount: { decrement: 1 } },
      select: { likeCount: true },
    });
  });
});
