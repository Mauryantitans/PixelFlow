# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PixelFlow is a visual image-processing pipeline builder: a React/TypeScript frontend and a FastAPI/Python backend. Users build pipelines from 50+ OpenCV / scikit-image / PIL operations and run them in **Live mode** (single image, real-time preview) or **Batch mode** (many images). Backed by PostgreSQL in production, SQLite in local dev.

## Commands

### Running locally (whole stack)
- `./start.sh` (Bash) or `start.bat` (Windows) — launches backend (SQLite, hot-reload, `USE_SQLITE=True DEBUG=True`) **and** frontend, writing `frontend/.env.local` pointing at `localhost:8000`. This is the fastest no-Docker path.
- `docker compose up` — full stack with real PostgreSQL (backend on :8000, frontend on :3000, db on :5432). Use `docker compose down -v` to wipe the db volume.

### Backend (from `backend/`, venv activated)
- `pip install -r requirements.txt`
- `python run.py` — start server (reads `.env`; honors `DEBUG`, `PORT`, etc.)
- `uvicorn app.main:app --reload` — equivalent direct invocation
- `python database/init_db.py` — create tables
- Database utility scripts live in `backend/database/`: `list_users.py`, `reset_password.py`, `backup_database.py`, `restore_database.py`, `cleanup_database.py`, `migrate_to_postgres.py`, `verify_business_rules.py`
- Migrations: `alembic upgrade head` / `alembic revision --autogenerate -m "..."` (config in `backend/alembic.ini`, env in `backend/alembic/env.py`). Note: `init_db()` also runs `Base.metadata.create_all` on startup, so the schema can exist without migrations.
- API docs while running: http://localhost:8000/docs ; health: `/health`

### Frontend (from `frontend/`)
- `npm install`
- `npm start` — dev server (proxies to `localhost:8000`; reads `REACT_APP_API_URL`)
- `npm run build` — production build
- `npm test` — Create React App / Jest test runner. **Note:** there is currently no real test suite (see `CURRENT_LIMITATIONS.md`); this mostly verifies the harness.

## Architecture

### The operation registry — the most important cross-file contract
An operation is defined in **two places that must agree on its display name**:
1. **Frontend config** in [frontend/src/types/index.ts](frontend/src/types/index.ts): `DEFAULT_OPERATION_CONFIGS` (basic), `OPENCV_OPERATION_CONFIGS`, `SCIKIT_OPERATION_CONFIGS`, merged into `ALL_OPERATION_CONFIGS`. This drives UI generation, parameter sliders/selects, and defaults.
2. **Backend implementation** in [backend/app/utils/image_processing.py](backend/app/utils/image_processing.py): a static `apply_*` method on `ImageProcessor`, registered in the `OPERATIONS` dict keyed by the **same display name**.

`ImageProcessor.apply_operation(image, name, params)` looks the name up in `OPERATIONS` and calls the function with `**params`. The frontend param `name` keys become the backend function's keyword args. If a name mismatches, the operation silently no-ops (logs a warning, returns the image unchanged). To add an operation, edit both files — see [guides/ADDING_OPERATIONS.md](guides/ADDING_OPERATIONS.md).

### Pipeline execution
Pipelines are ordered lists of `{name, params}` steps. `ImageProcessor.apply_pipeline_with_timing*` runs steps sequentially, captures each intermediate image, and records per-step millisecond timing into a `ProcessingResult`. Operations that fail catch internally and return the input image unchanged rather than aborting the pipeline.

### Storage mode switch (filesystem vs database)
`settings.IMAGE_STORAGE` (`"database"` default, or `"filesystem"`) **changes which router modules are mounted** in [backend/app/api/__init__.py](backend/app/api/__init__.py):
- `database` → `images_db.py` + `processing_db.py` (images stored as base64/blobs in PostgreSQL)
- `filesystem` → `images.py` + `processing.py` (images stored under `backend/uploads/` and `backend/processed/`)

When editing image upload/processing endpoints, confirm which pair is active; the two implementations are parallel and easy to confuse.

### Backend layout (`backend/app/`)
- `main.py` — app factory, lifespan (init db, auto-create first admin, start/stop cleanup task), CORS, middleware wiring, global exception handler, and legacy `/upload` `/process` shims for the old frontend.
- `core/config.py` — central `Settings` (env-driven). **Fails fast** (`sys.exit(1)`) in production if `SECRET_KEY` is still the default. Rewrites Render/Heroku `postgres://` → `postgresql://`. `USE_SQLITE=True` switches `DATABASE_URL` to a local SQLite file.
- `core/security_config.py` — constants for CORS origins, rate limits, login lockout, session/token expiry, file-upload limits. `core/business_rules.py` — quota/retention policy.
- `core/database.py` — SQLAlchemy engine, `SessionLocal`, `Base`, `get_db` dependency.
- `models/db_models.py` — all ORM tables (`User`, `RefreshToken`, `LoginAttempt`, `Session`, `UploadedImage`, `ProcessedImage`, `SavedPipeline`, `ProcessingHistory`, `APIKey`, `SharedPipeline`, `SystemSettings`). `models/schemas.py` — Pydantic request/response models.
- `api/routes/` — `auth`, `oauth` (Google), `pipelines`, `admin`, plus the storage-mode-dependent image/processing pairs.
- `middleware/` — `RateLimitMiddleware`, `SecurityHeadersMiddleware`.
- `utils/` — `image_processing.py` (the engine), `auth.py` (JWT/bcrypt), `session_manager.py` + `session_db.py` (session lifecycle), `cleanup_service.py` (background file/session expiry), `quota_manager.py`, `settings_manager.py`, `init_admin.py`.

### Frontend layout (`frontend/src/`)
- `App.tsx` — top-level orchestrator wiring together hooks and components.
- `hooks/index.ts` — all custom hooks: `useImages`, `useLiveProcessing`, `useBatchProcessing`, `usePipeline`, `useSession`/`useSessionHeartbeat`, `useUI`, `useStatus`, `useModal`, `useTheme`, `useKeyboardShortcuts`. State logic lives here, not in components.
- `contexts/` — `AuthContext` (JWT/user state), `PipelineContext` (pipeline + undo/redo history).
- `services/` — `api.ts` (`ApiService` static class: upload, process, operations, session, file validation, cleanup beacon) and `auth.ts`. Auth token is read from `localStorage['pixelflow_access_token']` and attached per-request.
- `types/index.ts` — TS interfaces **and** the operation config registry (see above).

### Sessions & heartbeat
Frontend sends periodic heartbeats (`/api/images/heartbeat`); a session is "active" if seen in the last ~5 min. The backend cleanup task (started in `main.py` lifespan) expires stale sessions and their images. On page unload the frontend fires a `sendBeacon` cleanup.

### Auth
JWT access + refresh tokens (`python-jose`, bcrypt via `passlib`). Optional Google OAuth (`authlib`) gated on `GOOGLE_CLIENT_ID`/`SECRET`. First admin is auto-created on startup from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars if no admin exists. The admin panel is additionally gated behind a client-side PIN.

## Configuration notes
- Backend env lives in `backend/.env` (template: `backend/.env.example`). Key vars: `DATABASE_URL`, `SECRET_KEY`, `USE_SQLITE`, `DEBUG`, `IMAGE_STORAGE`, `ALLOWED_ORIGINS`, `ALLOWED_ORIGINS_REGEX` (for Vercel preview URLs), `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `ADMIN_*`. Full list in [deployment/ENVIRONMENT_VARIABLES.md](deployment/ENVIRONMENT_VARIABLES.md).
- Frontend env: `REACT_APP_API_URL`, `REACT_APP_GOOGLE_CLIENT_ID`.
- CORS: defaults to localhost origins in dev; in production set `ALLOWED_ORIGINS` (comma-separated) and/or `ALLOWED_ORIGINS_REGEX`.
- Supported uploads: JPEG/PNG/BMP/TIFF, up to 50MB, max 20 files per batch (enforced both client- and server-side).

## Deployment
Frontend → Vercel, backend + PostgreSQL → Render. Config in `deployment/` (`render.yaml`, `vercel.json`) and root `render.yaml`. Dockerfiles exist in `backend/` and `frontend/` for the docker-compose stack. The live demo and its credentials are documented in [README.md](README.md).
