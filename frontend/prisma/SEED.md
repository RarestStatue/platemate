# Seeding the Database

## Prerequisites

- Docker running with `docker compose up -d`
- Dependencies installed: `npm install`

## Run

```bash
npx prisma db push
npx prisma db seed
```

## Reset and reseed

```bash
npx prisma db push --force-reset
npx prisma db seed
```
