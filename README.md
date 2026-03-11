# Simple Web App

## Run in development

Install dependencies once and copy the environment file, then start the app.

```bash
bun install
cp .env.example .env
bun run pglite:dev
```

If you only need the Vite dev server without pglite, use `bun run dev` instead.

## Deploy

Build once, then start the generated server build.

```bash
bun run build
bun run start
```

Set required variables from `.env` on your host before running the deployment command.
