/*
  Warnings:

  - The `user_role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'moderator', 'admin');

-- AlterTable
ALTER TABLE "recipe_comments" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recipe_ratings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recipe_reviews" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_dietary_restrictions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "user_role",
ADD COLUMN     "user_role" "UserRole" NOT NULL DEFAULT 'user',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "recipe_comments_recipe_id_idx" ON "recipe_comments"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_comments_parent_comment_id_idx" ON "recipe_comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "recipes_creator_id_idx" ON "recipes"("creator_id");

-- CreateIndex
CREATE INDEX "recipes_created_at_idx" ON "recipes"("created_at" DESC);

-- CreateIndex
CREATE INDEX "recipes_avg_rating_idx" ON "recipes"("avg_rating" DESC);

-- CreateIndex
CREATE INDEX "recipes_save_count_idx" ON "recipes"("save_count" DESC);

-- CreateIndex
CREATE INDEX "recipes_prep_time_min_idx" ON "recipes"("prep_time_min");

-- CreateIndex
CREATE INDEX "recipes_last_engagement_at_idx" ON "recipes"("last_engagement_at" DESC);

-- CreateIndex
CREATE INDEX "shopping_list_items_user_id_idx" ON "shopping_list_items"("user_id");

-- CreateIndex
CREATE INDEX "user_follows_following_id_idx" ON "user_follows"("following_id");

-- CreateIndex
CREATE INDEX "user_recipe_saves_recipe_id_idx" ON "user_recipe_saves"("recipe_id");
