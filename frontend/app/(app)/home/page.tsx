import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import TrendingHero from "@/components/sections/TrendingHero";
import NewFromCommunity from "@/components/sections/NewFromCommunity";
import HomeSearch from "./HomeSearch";
import type { RecipeCardData } from "@/lib/types";
import { getAllergens } from "@/lib/allergens";
import { getEngagementTrendingRecipes } from "@/lib/trending";

const DEMO_RECIPES: RecipeCardData[] = [
  { id: 1, title: "Miso butter mushrooms on toast", prepTimeMin: 15, avgRating: 4.7, photoUrl: null, saveCount: 214, creatorUsername: "hanako", isPopular: true },
  { id: 2, title: "One-pan lemon chicken orzo", prepTimeMin: 25, avgRating: 4.6, photoUrl: null, saveCount: 189, creatorUsername: "mateo", isPopular: true },
  { id: 3, title: "Feta & spinach shakshuka", prepTimeMin: 20, avgRating: 4.8, photoUrl: null, saveCount: 302, creatorUsername: "priya", isPopular: true },
  { id: 4, title: "Crispy gnocchi with peas", prepTimeMin: 18, avgRating: 4.5, photoUrl: null, saveCount: 156, creatorUsername: "luca", isPopular: true },
  { id: 5, title: "Thai basil eggplant stir-fry", prepTimeMin: 22, avgRating: 4.6, photoUrl: null, saveCount: 178, creatorUsername: "noa", isPopular: true },
  { id: 6, title: "Sheet-pan harissa salmon", prepTimeMin: 28, avgRating: 4.7, photoUrl: null, saveCount: 245, creatorUsername: "ada", isPopular: true },
];

async function getTrendingRecipes(): Promise<RecipeCardData[]> {
  try {
    const recipes = await prisma.recipe.findMany({
      take: 10,
      orderBy: { lastEngagementAt: "desc" },
      select: {
        id: true,
        title: true,
        prepTimeMin: true,
        avgRating: true,
        photoUrl: true,
        saveCount: true,
        creator: { select: { username: true } },
        hasPeanuts: true,
        hasTreeNuts: true,
        hasShellfish: true,
        hasDairy: true,
        hasGluten: true,
        hasEggs: true,
      },
    });

    return recipes.map((r) => ({
      id: r.id,
      title: r.title,
      prepTimeMin: r.prepTimeMin,
      avgRating: r.avgRating,
      photoUrl: r.photoUrl,
      saveCount: r.saveCount,
      creatorUsername: r.creator.username,
      isPopular: true,
      allergens: getAllergens(r),
    }));
  } catch {
    return DEMO_RECIPES;
  }
}

async function getNewRecipes(): Promise<RecipeCardData[]> {
  try {
    const recipes = await prisma.recipe.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        prepTimeMin: true,
        avgRating: true,
        photoUrl: true,
        saveCount: true,
        creator: { select: { username: true } },
        hasPeanuts: true,
        hasTreeNuts: true,
        hasShellfish: true,
        hasDairy: true,
        hasGluten: true,
        hasEggs: true,
      },
    });

    return recipes.map((r) => ({
      id: r.id,
      title: r.title,
      prepTimeMin: r.prepTimeMin,
      avgRating: r.avgRating,
      photoUrl: r.photoUrl,
      saveCount: r.saveCount,
      creatorUsername: r.creator.username,
      allergens: getAllergens(r),
    }));
  } catch {
    return DEMO_RECIPES.slice(0, 8);
  }
}

async function getTrendingNow(): Promise<RecipeCardData[]> {
  try {
    return await getEngagementTrendingRecipes(10);
  } catch {
    return DEMO_RECIPES;
  }
}

async function safeAuth() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "still up";
  if (h < 12) return "good morning";
  if (h < 17) return "good afternoon";
  if (h < 22) return "good evening";
  return "late night snack?";
}

export default async function HomePage() {
  const [session, trending, newest, trendingNow] = await Promise.all([
    safeAuth(),
    getTrendingRecipes(),
    getNewRecipes(),
    getTrendingNow(),
  ]);

  const name =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "friend";

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-4 pb-8 sm:px-8 sm:pt-6">
      {/* Editorial masthead — desktop only */}
      <div className="mb-6 hidden items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute md:flex">
        <span>Today&apos;s edition</span>
        <span>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <span>{trending.length + newest.length} plates on the menu</span>
      </div>
      <div className="rule mb-8 hidden md:block" />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-2">{timeGreeting()}, {name}</p>
          <h1 className="display text-[clamp(2rem,7vw,5.5rem)]">
            what&apos;s in your
            <br />
            <span className="italic text-matcha">fridge</span> today?
          </h1>

          <div className="mt-6 max-w-xl sm:mt-8">
            <HomeSearch />
          </div>

          <Link
            href="/search"
            className="mt-5 inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-ink/15 bg-matcha-soft px-5 py-4 text-left transition active:scale-[0.99] hover:border-ink/30 sm:mt-6 sm:w-auto"
          >
            <div>
              <div className="font-serif text-xl leading-tight">
                14 recipes ready to make
              </div>
              <div className="text-xs text-ink-soft">
                all using 3+ ingredients you have
              </div>
            </div>
            <span
              aria-hidden
              className="text-ink-mute transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>

        {/* Right rail: food waste widget — hidden on mobile */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="rounded-2xl border border-ink/15 bg-ink p-6 text-cream">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-cream/60">
              <span>Weekly ledger</span>
              <span>you vs. the bin</span>
            </div>
            <div className="mt-6 font-serif text-6xl leading-none">
              $<span className="italic">24</span>
              <span className="text-cream/40">.80</span>
            </div>
            <p className="mt-2 text-sm text-cream/70">
              saved this week by cooking what you already had.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-cream/15 pt-5">
              <MiniStat n="3" label="plates cooked" />
              <MiniStat n="0" label="grocery runs" />
              <MiniStat n="12" label="ingredients used" />
            </div>
            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
              <div
                className="h-full rounded-full bg-matcha-soft"
                style={{ width: "68%" }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cream/60">
              <span>weekly goal</span>
              <span>68% · $24.80 of $36</span>
            </div>
          </div>
        </aside>
      </section>

      <div className="rule my-8 md:my-14" />

      {/* Best matches strip */}
      <section className="mb-10 md:mb-14">
        <div className="mb-4 flex items-end justify-between md:mb-6">
          <div>
            <p className="eyebrow mb-2 hidden md:block">Section I</p>
            <h2 className="display text-[clamp(1.75rem,4vw,3.5rem)]">
              Best <span className="italic text-matcha">matches</span>.
            </h2>
          </div>
          <Link
            href="/search"
            className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            see all →
          </Link>
        </div>
        <TrendingHero recipes={trending} />
      </section>

      {/* Food waste explainer band — desktop only */}
      <section className="mb-14 hidden rounded-2xl border border-ink/15 bg-paper p-8 md:block sm:p-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <p className="eyebrow mb-3">The $1,300 problem</p>
            <h2 className="display text-[clamp(2rem,4.5vw,4rem)]">
              Cut waste by up to{" "}
              <span className="italic text-matcha">40%</span>.
            </h2>
            <p className="mt-4 max-w-md text-ink-soft">
              The average Canadian household bins $1,300 of edible food every year.
              Platemate ranks recipes by what&apos;s already in your fridge —
              so nothing rots at the back of the drawer.
            </p>
          </div>
          <div className="md:col-span-6 grid grid-cols-3 gap-4">
            <BigStat n="2.1M" label="meals cooked" />
            <BigStat n="340k" label="home cooks" />
            <BigStat n="8.5k+" label="recipes" />
          </div>
        </div>
      </section>

      {/* Community grid */}
      <section>
        <div className="mb-4 flex items-end justify-between md:mb-6">
          <div>
            <p className="eyebrow mb-2 hidden md:block">Section II</p>
            <h2 className="display text-[clamp(1.75rem,4vw,3.5rem)]">
              Fresh from the <span className="italic text-matcha">community</span>.
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            discover more →
          </Link>
        </div>
        <NewFromCommunity recipes={newest} />
      </section>

      <div className="rule my-8 md:my-14" />

      {/* Trending now strip */}
      <section className="mb-10 md:mb-14">
        <div className="mb-4 flex items-end justify-between md:mb-6">
          <div>
            <p className="eyebrow mb-2 hidden md:block">Section III</p>
            <h2 className="display text-[clamp(1.75rem,4vw,3.5rem)]">
              Trending <span className="italic text-matcha">now</span>.
            </h2>
          </div>
          <Link
            href="/trending"
            className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            see all →
          </Link>
        </div>
        <TrendingHero recipes={trendingNow} />
      </section>
    </div>
  );
}

function MiniStat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-2xl leading-none">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-cream/60">
        {label}
      </div>
    </div>
  );
}

function BigStat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-cream p-4">
      <div className="font-serif text-3xl leading-none text-ink">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-mute">
        {label}
      </div>
    </div>
  );
}
