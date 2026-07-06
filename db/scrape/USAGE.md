# Scraper Usage

CLI tool: scrape Reddit recipe posts → parse via LLM → store in PlateMate Postgres DB.

## Setup

```bash
cd db/scrape
pip install -e ".[dev]"     # installs deps + pytest/respx
cp .env.example .env        # fill in credentials
```

Required `.env` values:

- `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`: from https://www.reddit.com/prefs/apps (script app)
- `REDDIT_USERNAME`: appended to default user agent (Reddit API rule); or set `REDDIT_USER_AGENT` to override fully
- `DATABASE_URL`: Postgres connection string
- LLM key: `LLM_API_KEY` (generic) or provider-specific (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)

## Run

```bash
python -m scraper --subreddit <name> [options]
```

or, if installed as script: `platemate-scrape --subreddit <name> [options]`

### Options

| Flag | Required | Default | Notes |
|---|---|---|---|
| `--subreddit` | yes | : | no `r/` prefix |
| `--until-date` | no | none | ISO 8601; only scrape posts before this date |
| `--llm-provider` | no | `openai` | `openai`, `anthropic`, `ollama`, `huggingface`, `openai-compatible` |
| `--llm-model` | no | `gpt-4o` | model id |
| `--api-key` | no | env fallback | `LLM_API_KEY` or provider-specific env var |
| `--api-base` | no | provider default | required for `openai-compatible`; e.g. `http://localhost:11434` for ollama |
| `--batch-size` | no | `5` | posts per DB commit |
| `--dry-run` | no | off | parse + print JSON, no DB writes |
| `--log-level` | no | `info` | `debug`, `info`, `warning`, `error` |

### Examples

```bash
# Dry run, local Ollama, no API key needed
python -m scraper --subreddit budgetfood --llm-provider ollama \
  --llm-model mistral --api-base http://localhost:11434 --dry-run

# OpenAI, cutoff date, bigger batches
LLM_API_KEY=sk-... python -m scraper --subreddit recipes \
  --llm-provider openai --llm-model gpt-4o \
  --until-date 2026-01-01T00:00:00Z --batch-size 20

# Anthropic
python -m scraper --subreddit EatCheapAndHealthy \
  --llm-provider anthropic --llm-model claude-sonnet-5 \
  --api-key "$ANTHROPIC_API_KEY" --log-level debug

# Self-hosted OpenAI-compatible endpoint (vLLM, LM Studio, etc.)
python -m scraper --subreddit veganrecipes \
  --llm-provider openai-compatible --api-base http://gpu-box:8000 \
  --llm-model meta-llama/Llama-3-8B-Instruct
```

## Behavior notes

- **Resume**: progress checkpointed per-subreddit (`checkpoint.py`) after each batch commit. Re-run same `--subreddit` continues where it left off; also does a "pickup pass" for posts newer than last-seen top-of-listing.
- **Prefilter**: cheap heuristics score post recipe-likelihood before spending LLM tokens (`heuristics.py`). Non-recipe posts skipped for free.
- **Dedup**: same creator + similar title → skipped. Different creator + similar title → inserted, flagged in `recipe_duplicate_flags` for moderator review.
- **Failure handling**: LLM provider failure aborts the run (checkpoint intact, safe to re-run). Reddit 429 honors `retry-after` and continues. One bad recipe rolls back via savepoint, rest of batch unaffected.
- End-of-run prints summary: fetched / prefilter_skipped / not_recipe / parsed / inserted / duplicates / failed.

## Tests

```bash
pytest
```

## Supported LLM providers

| `--llm-provider` | Implementation | Default `--api-base` | API key |
|---|---|---|---|
| `openai` | `llm/openai_compat.py` | `https://api.openai.com` | `LLM_API_KEY` or `OPENAI_API_KEY` |
| `anthropic` | `llm/anthropic.py` (Messages API) | `https://api.anthropic.com` | `LLM_API_KEY` or `ANTHROPIC_API_KEY` |
| `ollama` | `llm/openai_compat.py` | `http://localhost:11434` | none required |
| `huggingface` | `llm/huggingface.py` (Inference API) | `https://router.huggingface.co` | `LLM_API_KEY` |
| `openai-compatible` | `llm/openai_compat.py` | none: `--api-base` required | provider-dependent |


