import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const findManyMock = vi.fn();
const queryRawMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    recipe: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Imported after the mocks above so the route picks up the mocked prisma client.
const { GET } = await import("./route");

function req(qs: string) {
  return new NextRequest(`http://localhost/api/recipes${qs}`);
}

beforeEach(() => {
  findManyMock.mockReset();
  findManyMock.mockResolvedValue([]);
  queryRawMock.mockReset();
  queryRawMock.mockResolvedValue([]);
});

describe("GET /api/recipes", () => {
  it("returns 400 for a non-numeric cursor instead of throwing", async () => {
    const res = await GET(req("?cursor=abc"));
    expect(res.status).toBe(400);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("accepts a numeric cursor and passes it through to Prisma", async () => {
    const res = await GET(req("?cursor=42"));
    expect(res.status).toBe(200);
    const call = findManyMock.mock.calls[0][0];
    expect(call.cursor).toEqual({ id: 42 });
    expect(call.skip).toBe(1);
  });

  it("omits cursor/skip when no cursor is given", async () => {
    await GET(req(""));
    const call = findManyMock.mock.calls[0][0];
    expect(call.cursor).toBeUndefined();
    expect(call.skip).toBeUndefined();
  });

  it("ignores a non-numeric maxPrepTime rather than erroring", async () => {
    const res = await GET(req("?maxPrepTime=abc"));
    expect(res.status).toBe(200);
    const call = findManyMock.mock.calls[0][0];
    expect(call.where.prepTimeMin).toBeUndefined();
  });

  it("applies a valid maxPrepTime filter", async () => {
    await GET(req("?maxPrepTime=30"));
    const call = findManyMock.mock.calls[0][0];
    expect(call.where.prepTimeMin).toEqual({ lte: 30 });
  });

  it("builds a case-insensitive ILIKE search on title/description via raw SQL", async () => {
    const res = await GET(req("?q=pasta"));
    expect(res.status).toBe(200);
    expect(findManyMock).not.toHaveBeenCalled();
    const call = queryRawMock.mock.calls[0][0];
    expect(call.text).toContain("ILIKE");
    expect(call.text).toContain("r.title");
    expect(call.text).toContain("r.description");
    expect(call.values).toContain("%pasta%");
  });

  it("always includes a secondary id sort for stable pagination", async () => {
    await GET(req("?sort=popular"));
    const call = findManyMock.mock.calls[0][0];
    expect(call.orderBy).toEqual([{ saveCount: "desc" }, { id: "desc" }]);
  });
});
