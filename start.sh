#!/usr/bin/env bash
# PixelFlow — local dev launcher (no Docker, uses SQLite)
# Usage:  ./start.sh
# Stop:   Ctrl+C  (kills both backend and frontend)

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── colours ───────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${CYAN}[pixelflow]${NC} $*"; }
ok()    { echo -e "${GREEN}[pixelflow]${NC} $*"; }
warn()  { echo -e "${YELLOW}[pixelflow]${NC} $*"; }

# ── cleanup on exit ────────────────────────────────────────────────────────
PIDS=()
cleanup() {
    echo ""
    info "Shutting down..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null
    ok "All services stopped."
}
trap cleanup EXIT INT TERM

# ── backend ────────────────────────────────────────────────────────────────
info "Checking backend dependencies..."

# Locate venv — check common names at root and inside backend/
VENV_ACTIVATE=""
for candidate in \
    "$ROOT/env/bin/activate" \
    "$ROOT/.venv/bin/activate" \
    "$ROOT/venv/bin/activate" \
    "$ROOT/backend/env/bin/activate" \
    "$ROOT/backend/.venv/bin/activate"; do
    if [ -f "$candidate" ]; then
        VENV_ACTIVATE="$candidate"
        break
    fi
done

if [ -z "$VENV_ACTIVATE" ]; then
    warn "No virtual environment found — creating one at $ROOT/env ..."
    python3 -m venv "$ROOT/env"
    VENV_ACTIVATE="$ROOT/env/bin/activate"
fi

info "Using venv: $VENV_ACTIVATE"
# shellcheck disable=SC1090
source "$VENV_ACTIVATE"
pip install -q -r "$ROOT/backend/requirements.txt"

ok "Starting backend on http://localhost:8000  (SQLite, hot-reload)"
USE_SQLITE=True DEBUG=True \
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
    --app-dir "$ROOT/backend" \
    2>&1 | sed 's/^/[backend] /' &
PIDS+=($!)
deactivate

# ── frontend ───────────────────────────────────────────────────────────────
info "Checking frontend dependencies..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
    warn "node_modules missing — running npm install..."
    npm install --silent
fi

# Write a minimal .env.local so the frontend points to the local backend
if [ ! -f ".env.local" ]; then
    echo "REACT_APP_API_URL=http://localhost:8000/api" > .env.local
    info "Created frontend/.env.local"
fi

ok "Starting frontend on http://localhost:3000"
npm start 2>&1 | sed 's/^/[frontend] /' &
PIDS+=($!)

# ── done ───────────────────────────────────────────────────────────────────
echo ""
ok "PixelFlow is starting up!"
echo -e "  ${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "  ${GREEN}Backend:${NC}  http://localhost:8000"
echo -e "  ${GREEN}API docs:${NC} http://localhost:8000/docs"
echo ""
info "Press Ctrl+C to stop all services."
echo ""

wait
