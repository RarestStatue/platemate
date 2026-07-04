import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import TrendingHero from "@/components/sections/TrendingHero";
import NewFromCommunity from "@/components/sections/NewFromCommunity";
import HomeSearch from "./HomeSearch";
import type { RecipeCardData } from "@/lib/types";

async function getTrendingRecipes(): Promise<RecipeCardData[]> {
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
  }));
}

async function getNewRecipes(): Promise<RecipeCardData[]> {
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
  }));
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
  const [session, trending, newest] = await Promise.all([
    auth(),
    getTrendingRecipes(),
    getNewRecipes(),
  ]);

  const name =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "friend";

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-6 pb-16 sm:px-8">
      {/* Editorial masthead */}
      <div className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ink-mute">
        <span>Today's edition</span>
        <span className="hidden sm:inline">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <span>{trending.length + newest.length} plates on the menu</span>
      </div>
      <div className="rule mb-8" />

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-3">{timeGreeting()}, {name}</p>
          <h1 className="display text-[clamp(2.75rem,7vw,5.5rem)]">
            what's in your
            <br />
            <span className="italic text-matcha">fridge</span> today?
          </h1>

          <div className="mt-8 max-w-xl">
            <HomeSearch />
          </div>

          <Link
            href="/search"
            className="mt-6 inline-flex items-center justify-between gap-4 rounded-2xl border border-ink/15 bg-matcha-soft px-5 py-4 text-left hover:border-ink/30"
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

        {/* Right rail: food waste widget */}
        <aside className="lg:col-span-5">
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

      <div className="rule my-14" />

      {/* Best matches strip */}
      <section className="mb-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">Section I</p>
            <h2 className="display text-[clamp(2rem,4vw,3.5rem)]">
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

      {/* Food waste explainer band */}
      <section className="mb-14 rounded-2xl border border-ink/15 bg-paper p-8 sm:p-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <p className="eyebrow mb-3">The $1,300 problem</p>
            <h2 className="display text-[clamp(2rem,4.5vw,4rem)]">
              Cut waste by up to{" "}
              <span className="italic text-matcha">40%</span>.
            </h2>
            <p className="mt-4 max-w-md text-ink-soft">
              The average Canadian household bins $1,300 of edible food every year.
              Platemate ranks recipes by what's already in your fridge —
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
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">Section II</p>
            <h2 className="display text-[clamp(2rem,4vw,3.5rem)]">
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
