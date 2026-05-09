# Docker Development Setup

## What This Setup Does

This repository now supports a two-container development workflow:

- `backend`: Django dev server on `http://localhost:8000`
- `frontend`: Vite dev server on `http://localhost:5173`

Both services run together through Docker Compose, and both use bind mounts so local file changes are reflected inside the containers immediately.

## Hot Reload Behavior

- Frontend changes in `frontend/` are reflected by the Vite dev server
- Backend Python changes in `schedly/` are picked up by Django's development autoreloader
- The frontend proxies `/api`, `/docs`, and `/schema` requests to the backend container over the Compose network

This means you can keep editing locally while both apps stay containerized.

## Start The Stack

From the repository root:

```powershell
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend API root/docs:
  - `http://localhost:8000/`
  - `http://localhost:8000/docs/`
  - `http://localhost:8000/schema/`

## Stop The Stack

```powershell
docker compose down
```

## Rebuild After Dependency Changes

Rebuild if you change:

- `requirements.txt`
- `frontend/package.json`
- `frontend/package-lock.json`

Command:

```powershell
docker compose up --build
```

## Notes

- The backend runs `python manage.py migrate` automatically before starting the dev server.
- The frontend talks to the backend using the Compose service name `backend`, so it stays fully self-contained inside Docker.
- If you want the planning agents to work, provide `HUGGINGFACEHUB_API_TOKEN` in your shell before running Compose.

Example PowerShell session:

```powershell
$env:HUGGINGFACEHUB_API_TOKEN="your-token-here"
docker compose up --build
```

## Typical Dev Loop

1. Start the stack with `docker compose up --build`
2. Edit frontend files in `frontend/`
3. Edit backend files in `schedly/`
4. Refresh the browser if needed after backend API changes

## Troubleshooting

- If the frontend cannot reach the backend, confirm both containers are running with `docker compose ps`
- If Python or Node dependencies changed, rebuild the images
- If the backend fails on startup, check container logs with `docker compose logs backend`
- If the frontend fails on startup, check container logs with `docker compose logs frontend`
