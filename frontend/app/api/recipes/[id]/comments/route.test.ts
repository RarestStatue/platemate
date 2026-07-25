import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const findUniqueMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    recipeComment: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { DELETE } = await import("./route");

function req(commentId?: string) {
  const url =
    commentId === undefined
      ? "http://localhost/api/recipes/1/comments"
      : `http://localhost/api/recipes/1/comments?commentId=${commentId}`;
  return new NextRequest(url, { method: "DELETE" });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const authedSession = { user: { id: "7" } };

function mockTx() {
  const deleteMock = vi.fn().mockResolvedValue({});
  const recipeUpdateMock = vi.fn().mockResolvedValue({});
  transactionMock.mockImplementation(async (fn) =>
    fn({
      recipeComment: { delete: deleteMock },
      recipe: { update: recipeUpdateMock },
    })
  );
  return { deleteMock, recipeUpdateMock };
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  findUniqueMock.mockReset();
  transactionMock.mockReset();
});

describe("DELETE /api/recipes/[id]/comments", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await DELETE(req("5"), ctx("1"));
    expect(res.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 when commentId is missing or not a number", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    expect((await DELETE(req(), ctx("1"))).status).toBe(400);
    expect((await DELETE(req("abc"), ctx("1"))).status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the comment does not exist", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue(null);
    const res = await DELETE(req("5"), ctx("1"));
    expect(res.status).toBe(404);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the comment belongs to another recipe", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({
      id: 5,
      userId: 7,
      recipeId: 2,
      _count: { replies: 0 },
    });
    const res = await DELETE(req("5"), ctx("1"));
    expect(res.status).toBe(404);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not the author", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({
      id: 5,
      userId: 99,
      recipeId: 1,
      _count: { replies: 0 },
    });
    const res = await DELETE(req("5"), ctx("1"));
    expect(res.status).toBe(403);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("deletes the caller's comment and decrements commentCount", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({
      id: 5,
      userId: 7,
      recipeId: 1,
      _count: { replies: 0 },
    });
    const { deleteMock, recipeUpdateMock } = mockTx();

    const res = await DELETE(req("5"), ctx("1"));
    expect(res.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(recipeUpdateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        commentCount: { decrement: 1 },
        lastEngagementAt: expect.any(Date),
      },
    });
  });

  it("decrements commentCount by the comment plus its cascaded replies", async () => {
    vi.mocked(auth).mockResolvedValue(authedSession as never);
    findUniqueMock.mockResolvedValue({
      id: 5,
      userId: 7,
      recipeId: 1,
      _count: { replies: 3 },
    });
    const { recipeUpdateMock } = mockTx();

    const res = await DELETE(req("5"), ctx("1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ removed: 4 });
    expect(recipeUpdateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        commentCount: { decrement: 4 },
        lastEngagementAt: expect.any(Date),
      },
    });
  });
});
