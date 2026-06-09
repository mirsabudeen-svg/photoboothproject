# Local Development Setup

For the full agent-assisted guide (env vars, Android, troubleshooting), see **[AGENT_LOCAL_SETUP_GUIDE.md](./AGENT_LOCAL_SETUP_GUIDE.md)**.

## Quick start

```bash
docker compose up -d postgres redis

cd backend
cp .env.example .env   # set DATABASE_URL=postgresql://dev:dev@localhost:5432/photobooth
npm install
npm run migration:run
npm run start:dev

cd ../admin-dashboard
cp .env.example .env.local
npm install
npm run dev -- -p 3001
```

## Stop

```bash
docker compose down
```
