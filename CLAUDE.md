# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PixelFlow is a visual image-processing pipeline builder: a React/TypeScript frontend and a FastAPI/Python backend. Users build pipelines from **77** OpenCV / scikit-image / PIL operations and run them in **Live mode** (single image, real-time incremental preview) or **Batch mode** (many images). The operation library is **schema-driven**: the backend registry is the single source of truth and the UI renders each operation's controls dynamically — including interactive inputs (click a point, drag a region, pick a color). Backed by PostgreSQL in production, SQLite in local dev.

## Commands

### Running locally (whole stack)
- `./start.sh` (Bash) or `start.bat` (Windows) — launches backend (SQLite, hot-reload, `USE_SQLITE=True DEBUG=True`) **and** frontend, writing `frontend/.env.local` pointing at `localhost:8000`. This is the fastest no-Docker path.
- `docker compose up` — full stack with real PostgreSQL (backend on :8000, frontend on :3000, db on :5432). Use `docker compose down -v` to wipe the db volume.

### Backend (from `backend/`, venv activated)
- `pip install -r requirements.txt` (runtime) and `pip install -r requirements-dev.txt` (pytest, ruff, mypy)
- `python run.py` — start server (reads `.env`; honors `DEBUG`, `PORT`, etc.)
- `uvicorn app.main:app --reload` — equivalent direct invocation
- `python database/init_db.py` — create tables
- **Quality gate** (matches CI — see `.github/workflows/ci.yml`):
  - `ruff check .` and `ruff format --check .`
  - `mypy app` (scoped via `pyproject.toml` to `app/processing` + `app/utils/datetime_utils.py`)
  - `pytest` — full suite; `pytest tests/test_executor.py -k coerce` runs a single test/expr; `pytest -q` for quiet
- Database utility scripts live in `backend/database/`: `list_users.py`, `reset_password.py`, `backup_database.py`, `restore_database.py`, `cleanup_database.py`, `migrate_to_postgres.py`, `verify_business_rules.py`
- Migrations: `alembic upgrade head` / `alembic revision --autogenerate -m "..."` (config in `backend/alembic.ini`, env in `backend/alembic/env.py`). Note: `init_db()` also runs `Base.metadata.create_all` on startup, so the schema can exist without migrations.
- API docs while running: http://localhost:8000/docs ; health: `/health`

### Frontend (from `frontend/`)
- `npm install`
- `npm start` — dev server (proxies to `localhost:8000`; reads `REACT_APP_API_URL`)
- `npm run build` — production build
- `npm test` — Create React App / Jest test runner (smoke tests). `npx tsc --noEmit` for the strict type-check that CI runs.

## Architecture

### The operation registry — the single source of truth (most important contract)
Operations are declared **once, in the backend**, in the `backend/app/processing/` package. There are **no frontend operation config files** — the frontend renders entirely from the schema served by the API.

- `processing/param_specs.py` — the `ParamSpec` types: `int`, `float`, `odd_kernel`, `angle`, `enum`, `bool`, `color`, and image-coordinate `point` / `points` / `rect`. Each spec knows its constraints, `.coerce()` (validate+normalize a raw value), `.schema()` (the DTO sent to the UI), and (for coords) `.to_pixels()`.
- `processing/registry.py` — `OperationSpec` (stable snake_case `id`, `label`, `category`/`subcategory`, `description`, ordered `params`, the `fn` callable, and `aliases` = legacy display names) and the `OperationRegistry` singleton. `ensure_registered()` lazily imports the operation modules. **`id` is the stable identity; never reuse/rename an id, and never remove an alias** — saved pipelines (`SavedPipeline.pipeline_data`) reference operations by display-name string and resolve through the alias map with zero migration.
- `processing/coords.py` — the ONE place for coordinate↔pixel mapping (normalized [0..1] → pixels), odd-kernel enforcement, and color parsing.
- `processing/executor.py` — `execute_step(image, step)`: resolve id/alias → validate+coerce params → map normalized coords against the *current* image size → run the callable. Returns a structured `StepError` per step instead of a silent no-op; one bad step never 500s the batch.
- `processing/preview_cache.py` — per-session LRU of intermediate images keyed by cumulative prefix hashes (powers incremental live preview).
- `processing/operations/` — the actual functions, registered declaratively: `_builtins.py` (the original ~53 ops), `interactive.py` (Flood Fill, Crop, Inpaint Region — point/ROI/color), `extras.py` and `extras2.py` (the +22 stylize/photo/segmentation/morphology batches). Operation bodies are plain `fn(image, **params) -> PIL.Image`.

**Coordinates are normalized [0..1] everywhere** in transport/storage and converted to pixels once in `coords.py` at execution. This survives preview downscaling and upstream geometry changes (e.g. an upstream Resize auto-rescales a seed point/ROI for free).

To add an operation: write the function, register an `OperationSpec` with typed params, and import its module in `registry.ensure_registered()`. The UI needs **no changes**. See [guides/ADDING_OPERATIONS.md](guides/ADDING_OPERATIONS.md).

### Pipeline execution
Pipelines are ordered lists of `{name, params}` steps. `ImageProcessor.apply_operation` delegates to `executor.execute_step`. `apply_pipeline_with_timing_from_image(image, pipeline, source_key=...)` runs steps sequentially through the executor, captures each intermediate, records per-step millisecond timing and per-step `StepError`s into a `ProcessingResult`, and uses the **prefix cache** to recompute only the steps from the first change onward (`cached_prefix_len` reports reuse). `source_key = "{session}|{image_id}"` is threaded from the processing routes.

### The `/operations` schema endpoint
`GET /api/processing/operations` returns the grouped schema (`version`, `categories[] → subcategories[] → operations[]` with typed `params`) plus a legacy flat `operations` list + `total_count` for backward compat. The frontend fetches it once at startup.

### Backend layout (`backend/app/`)
- `main.py` — app factory, lifespan (init db, auto-create first admin, start/stop cleanup task), CORS, middleware wiring, global exception handler. (The legacy `/upload` `/process` shims were removed; the DB routers are always mounted.)
- `processing/` — the operation engine (see above). `utils/image_processing.py` is now a thin `ImageProcessor` façade over the executor + prefix cache.
- `core/config.py` — central `Settings` (env-driven). **Fails fast** (`sys.exit(1)`) in production if `SECRET_KEY` is still the default. Rewrites Render/Heroku `postgres://` → `postgresql://`. `USE_SQLITE=True` switches `DATABASE_URL` to a local SQLite file.
- `core/security_config.py` — constants for CORS origins, rate limits (incl. per-IP upload/processing limits), login lockout, session/token expiry, file-upload limits. `core/business_rules.py` — quota/retention **seed defaults only**; the live policy is read from the DB `SystemSettings` row (admin-editable).
- `core/database.py` — SQLAlchemy engine, `SessionLocal`, `Base`, `get_db` dependency.
- `models/db_models.py` — all ORM tables (`User`, `RefreshToken`, `LoginAttempt`, `Session`, `UploadedImage`, `ProcessedImage`, `SavedPipeline`, `ProcessingHistory`, `APIKey`, `SharedPipeline`, `SystemSettings`). `models/schemas.py` — Pydantic request/response models. `models/__init__.py` — `PipelineStep` (its `params` value type is widened to allow nested list/dict for coord params) and `StepError`.
- `api/routes/` — `auth`, `oauth` (Google), `pipelines`, `admin`, `images_db` (upload incl. `/upload-multiple`), `processing_db` (`load_image_from_db`, the `/operations` schema, live/batch processing). Images are always stored in the database (the old filesystem router pair was removed).
- `middleware/` — `RateLimitMiddleware`, `SecurityHeadersMiddleware`.
- `utils/` — `auth.py` (JWT/bcrypt), `session_manager.py` + `session_db.py` (session lifecycle), `cleanup_service.py` (background session/image expiry, reads `SystemSettings`), `quota_manager.py`, `settings_manager.py`, `datetime_utils.py` (`ensure_aware`), `init_admin.py`.

### Frontend layout (`frontend/src/`)
- `App.tsx` — top-level orchestrator; the palette/search/add-op all read the operation schema (with a loading/error state when the schema is unavailable).
- `contexts/` — `AuthContext` (JWT/user state), `PipelineContext` (pipeline + undo/redo history), `OperationSchemaContext` (fetches `/operations` once; exposes `palette`/`getOp`/`getDefaults`), `PickerContext` (which step/param is currently capturing an interactive pick).
- `components/params/ParamControl.tsx` — renders the correct control per param `type` (sliders, enum, bool, color, and coordinate placeholders). `components/PreviewCanvas.tsx` — the interactive overlay (click=point, drag=ROI, eyedropper=color), object-contain-aware coordinate mapping. `components/CompareSlider.tsx`, `DiffView.tsx`, `Inspector.tsx` — comparison views. `components/PipelineStep.tsx` — a step's controls + per-step error banner.
- `hooks/index.ts` — custom hooks: `useImages`, `useLiveProcessing` (debounced, prefix-cache aware, request cancellation, surfaces `stepErrors`), `useBatchProcessing`, `usePipeline`, `useSession`/`useSessionHeartbeat`, `useUI`, `useStatus`, `useModal`, `useTheme`, `useKeyboardShortcuts`.
- `services/` — `api.ts` (`ApiService`: upload, process, `getOperationsSchema`, `processLive` with an abort signal, session, file validation, cleanup beacon) and `auth.ts`. Auth token is read from `localStorage['pixelflow_access_token']` and attached per-request.
- `types/index.ts` — TS interfaces and the schema DTOs (`ParamSpecDTO`, `OperationSpecDTO`, `OperationSchema`, `StepErrorDTO`). The old static `*_OPERATION_CONFIGS` were removed.

### Sessions & heartbeat
Frontend sends periodic heartbeats (`/api/images/heartbeat`); a session is "active" if seen in the last ~5 min. The backend cleanup task (started in `main.py` lifespan) expires stale sessions and their images using the retention/lifetime values from the DB `SystemSettings` row. On page unload the frontend fires a `sendBeacon` cleanup.

### Auth
JWT access + refresh tokens (`python-jose`, bcrypt via `passlib`), currently stored in `localStorage` (moving to httpOnly cookies is planned — see `CURRENT_LIMITATIONS.md`). Optional Google OAuth (`authlib`) gated on `GOOGLE_CLIENT_ID`/`SECRET`. First admin is auto-created on startup from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars if no admin exists. The admin panel is additionally gated behind a client-side PIN.

## Configuration notes
- Backend env lives in `backend/.env` (template: `backend/.env.example`). Key vars: `DATABASE_URL`, `SECRET_KEY`, `USE_SQLITE`, `DEBUG`, `ALLOWED_ORIGINS`, `ALLOWED_ORIGINS_REGEX` (for Vercel preview URLs), `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `ADMIN_*`. Full list in [deployment/ENVIRONMENT_VARIABLES.md](deployment/ENVIRONMENT_VARIABLES.md). (Note: the old `IMAGE_STORAGE` switch was removed — images are always stored in the database.)
- Frontend env: `REACT_APP_API_URL`, `REACT_APP_GOOGLE_CLIENT_ID`.
- CORS: defaults to localhost origins in dev; in production set `ALLOWED_ORIGINS` (comma-separated) and/or `ALLOWED_ORIGINS_REGEX`.
- Supported uploads: JPEG/PNG/BMP/TIFF, up to 50MB, max 20 files per batch (enforced both client- and server-side); PNG alpha is preserved.

## Deployment
Frontend → Vercel, backend + PostgreSQL → Render. Config in `deployment/` (`render.yaml`, `vercel.json`) and root `render.yaml`. Dockerfiles exist in `backend/` and `frontend/` plus a root `docker-compose.yml`. Do **not** put real credentials in docs — provision the first admin via `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
