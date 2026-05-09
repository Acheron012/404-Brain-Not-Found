# Schedly

Schedly is a Django project located in the `schedly/` folder. The app uses SQLite for local development and starts from `schedly/manage.py`.

## Prerequisites

- Python 3.11 or newer
- `pip`

## Install

1. Open a terminal in the project root.
2. Create and activate a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install the dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

## Run the server

1. Change into the Django project folder:

   ```powershell
   cd schedly
   ```

2. Apply migrations:

   ```powershell
   python manage.py migrate
   ```

3. Start the development server:

   ```powershell
   python manage.py runserver
   ```

4. Open the app in your browser at:

   ```
   http://127.0.0.1:8000/
   ```

## Notes

- The project settings module is `amdhackathon.settings`.
- If you want to use the admin site, create a superuser with `python manage.py createsuperuser`.
- API views are implemented in [schedly/schedlyapp/views.py](schedly/schedlyapp/views.py).
- Serializers live in [schedly/schedlyapp/serializers.py](schedly/schedlyapp/serializers.py).
- The local database file is `schedly/db.sqlite3` for development.

## Frontend

The repository includes a frontend app in the `frontend/` folder (Vite + React).

Prerequisites:
- Node.js 18+ (or a compatible LTS)
- `npm`, `yarn`, or `pnpm`

Install and run locally:

```powershell
cd frontend
npm install
npm run dev
```

Build for production:

```powershell
cd frontend
npm run build
# preview the production build
npm run preview
```

Notes:
- The frontend's source lives in `frontend/src` and the package configuration is in `frontend/package.json`.
- There's a Dockerfile in `frontend/` if you prefer containerized builds and previews.

## Docker Development

You can run the frontend and backend together with Docker Compose for parallel development with live updates.

```powershell
docker compose up --build
```

Endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs/`

More detail is in [DOCKER_DEVELOPMENT.md](DOCKER_DEVELOPMENT.md).

