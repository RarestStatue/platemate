import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import {
  shoppingListAddSchema,
  shoppingListDeleteSchema,
} from "@/lib/validators";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const items = await prisma.shoppingListItem.findMany({
      where: { userId },
      include: { ingredient: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      items: items.map((i) => ({
        id: i.id,
        ingredientId: i.ingredientId,
        ingredientName: i.ingredient?.displayName ?? null,
        quantity: i.quantity,
        unit: i.unit,
        isChecked: i.isChecked,
        fromRecipeId: i.fromRecipeId,
      })),
    });
  } catch (error) {
    console.error("Shopping list fetch error:", error);
    return Response.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = shoppingListAddSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ingredientId, fromRecipeId, quantity, unit } = parsed.data;
    const userId = parseInt(session.user.id, 10);

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { id: true },
    });
    if (!ingredient) {
      return Response.json({ error: "Ingredient not found" }, { status: 404 });
    }

    // No unique constraint on (user, ingredient); reuse an un-checked item
    // instead of duplicating.
    const existing = await prisma.shoppingListItem.findFirst({
      where: { userId, ingredientId, isChecked: false },
    });
    if (existing) {
      return Response.json({ item: existing });
    }

    const item = await prisma.shoppingListItem.create({
      data: {
        userId,
        ingredientId,
        fromRecipeId: fromRecipeId ?? null,
        quantity: quantity ?? null,
        unit: unit ?? null,
      },
    });

    return Response.json({ item }, { status: 201 });
  } catch (error) {
    // Unknown fromRecipeId trips the FK constraint.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return Response.json({ error: "Invalid recipe ID" }, { status: 400 });
    }
    console.error("Shopping list add error:", error);
    return Response.json(
      { error: "Failed to add shopping list item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = shoppingListDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);
    const deleted = await prisma.shoppingListItem.deleteMany({
      where: { id: parsed.data.id, userId },
    });
    if (deleted.count === 0) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    return Response.json({ deleted: true });
  } catch (error) {
    console.error("Shopping list delete error:", error);
    return Response.json(
      { error: "Failed to delete shopping list item" },
      { status: 500 }
    );
  }
}
