BEGIN;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'moderator', 'admin');

-- Trigger function: auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "user_role" "UserRole" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_users_email" CHECK ("email" LIKE '%_@_%.__%'),
    CONSTRAINT "chk_users_username" CHECK (length("username") >= 1 AND "username" ~ '^[a-zA-Z0-9_.-]+$'),
    CONSTRAINT "chk_users_password_hash" CHECK (length("password_hash") >= 20)
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "recipe_count" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dietary_restrictions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "vegan" BOOLEAN NOT NULL DEFAULT false,
    "gluten_free" BOOLEAN NOT NULL DEFAULT false,
    "halal" BOOLEAN NOT NULL DEFAULT false,
    "peanut_free" BOOLEAN NOT NULL DEFAULT false,
    "dairy_free" BOOLEAN NOT NULL DEFAULT false,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_dietary_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "calories_per_100g" DOUBLE PRECISION,
    "protein_per_100g" DOUBLE PRECISION,
    "carbs_per_100g" DOUBLE PRECISION,
    "fat_per_100g" DOUBLE PRECISION,
    "default_unit" TEXT,
    "is_pantry_staple" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" SERIAL NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prep_time_min" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "save_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_engagement_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "has_peanuts" BOOLEAN NOT NULL DEFAULT false,
    "has_tree_nuts" BOOLEAN NOT NULL DEFAULT false,
    "has_shellfish" BOOLEAN NOT NULL DEFAULT false,
    "has_dairy" BOOLEAN NOT NULL DEFAULT false,
    "has_gluten" BOOLEAN NOT NULL DEFAULT false,
    "has_eggs" BOOLEAN NOT NULL DEFAULT false,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_halal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_recipes_prep_time_min" CHECK ("prep_time_min" >= 0),
    CONSTRAINT "chk_recipes_servings" CHECK ("servings" >= 1)
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_recipe_ingredients_quantity" CHECK ("quantity" > 0)
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "step_number" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "duration_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_substitutions" (
    "id" SERIAL NOT NULL,
    "original_ingredient_id" INTEGER NOT NULL,
    "substitute_ingredient_id" INTEGER NOT NULL,
    "flavor_impact" TEXT NOT NULL,
    "vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "vegan" BOOLEAN NOT NULL DEFAULT false,
    "gluten_free" BOOLEAN NOT NULL DEFAULT false,
    "dairy_free" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pantry" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pantry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_user_pantry_quantity" CHECK ("quantity" > 0)
);

-- CreateTable
CREATE TABLE "recipe_ratings" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_ratings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_recipe_ratings_rating" CHECK ("rating" BETWEEN 1 AND 5)
);

-- CreateTable
CREATE TABLE "recipe_reviews" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_comments" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "parent_comment_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_view_daily" (
    "recipe_id" INTEGER NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_view_daily_pkey" PRIMARY KEY ("recipe_id","day")
);

-- CreateTable
CREATE TABLE "user_recipe_saves" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_recipe_saves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" SERIAL NOT NULL,
    "follower_id" INTEGER NOT NULL,
    "following_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_no_self_follow" CHECK ("follower_id" != "following_id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER,
    "from_recipe_id" INTEGER,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_at" TIMESTAMP(3),

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_tags" (
    "recipe_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "recipe_tags_pkey" PRIMARY KEY ("recipe_id","tag_id")
);

-- CreateTable
CREATE TABLE "recipe_duplicate_flags" (
    "id" SERIAL NOT NULL,
    "original_recipe_id" INTEGER NOT NULL,
    "candidate_recipe_id" INTEGER NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "flagged_reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_duplicate_flags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_recipe_duplicate_flags_similarity_score" CHECK ("similarity_score" BETWEEN 0 AND 1)
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_dietary_restrictions_user_id_key" ON "user_dietary_restrictions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipe_id_ingredient_id_key" ON "recipe_ingredients"("recipe_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_steps_recipe_id_step_number_key" ON "recipe_steps"("recipe_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_substitutions_original_ingredient_id_substitute__key" ON "ingredient_substitutions"("original_ingredient_id", "substitute_ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_pantry_user_id_ingredient_id_key" ON "user_pantry"("user_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ratings_recipe_id_user_id_key" ON "recipe_ratings"("recipe_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_reviews_recipe_id_user_id_key" ON "recipe_reviews"("recipe_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_recipe_saves_user_id_recipe_id_key" ON "user_recipe_saves"("user_id", "recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_follower_id_following_id_key" ON "user_follows"("follower_id", "following_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "recipe_tags_tag_id_idx" ON "recipe_tags"("tag_id");

-- CreateIndex
CREATE INDEX "recipes_fts_idx" ON "recipes"
    USING GIN (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", '')));

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
CREATE INDEX "recipes_view_count_idx" ON "recipes"("view_count" DESC);

-- CreateIndex
CREATE INDEX "recipes_prep_time_min_idx" ON "recipes"("prep_time_min");

-- CreateIndex
CREATE INDEX "recipes_last_engagement_at_idx" ON "recipes"("last_engagement_at" DESC);

-- CreateIndex
CREATE INDEX "recipe_view_daily_day_idx" ON "recipe_view_daily"("day");

-- CreateIndex
CREATE INDEX "shopping_list_items_user_id_idx" ON "shopping_list_items"("user_id");

-- CreateIndex
CREATE INDEX "user_follows_following_id_idx" ON "user_follows"("following_id");

-- CreateIndex
CREATE INDEX "user_recipe_saves_recipe_id_idx" ON "user_recipe_saves"("recipe_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dietary_restrictions" ADD CONSTRAINT "user_dietary_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_substitutions" ADD CONSTRAINT "ingredient_substitutions_original_ingredient_id_fkey" FOREIGN KEY ("original_ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_substitutions" ADD CONSTRAINT "ingredient_substitutions_substitute_ingredient_id_fkey" FOREIGN KEY ("substitute_ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pantry" ADD CONSTRAINT "user_pantry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pantry" ADD CONSTRAINT "user_pantry_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ratings" ADD CONSTRAINT "recipe_ratings_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ratings" ADD CONSTRAINT "recipe_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_reviews" ADD CONSTRAINT "recipe_reviews_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_reviews" ADD CONSTRAINT "recipe_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_comments" ADD CONSTRAINT "recipe_comments_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_comments" ADD CONSTRAINT "recipe_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_comments" ADD CONSTRAINT "recipe_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "recipe_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_view_daily" ADD CONSTRAINT "recipe_view_daily_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recipe_saves" ADD CONSTRAINT "user_recipe_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recipe_saves" ADD CONSTRAINT "user_recipe_saves_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_from_recipe_id_fkey" FOREIGN KEY ("from_recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_duplicate_flags" ADD CONSTRAINT "recipe_duplicate_flags_original_recipe_id_fkey" FOREIGN KEY ("original_recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_duplicate_flags" ADD CONSTRAINT "recipe_duplicate_flags_candidate_recipe_id_fkey" FOREIGN KEY ("candidate_recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTrigger: auto-update updated_at on modification
CREATE TRIGGER "trg_users_updated_at"
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER "trg_user_profiles_updated_at"
    BEFORE UPDATE ON "user_profiles"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER "trg_user_dietary_updated_at"
    BEFORE UPDATE ON "user_dietary_restrictions"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER "trg_recipes_updated_at"
    BEFORE UPDATE ON "recipes"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER "trg_recipe_ratings_updated_at"
    BEFORE UPDATE ON "recipe_ratings"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER "trg_recipe_reviews_updated_at"
    BEFORE UPDATE ON "recipe_reviews"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER "trg_recipe_comments_updated_at"
    BEFORE UPDATE ON "recipe_comments"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
