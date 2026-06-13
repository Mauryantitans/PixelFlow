# ⚠️ Current Limitations & Known Issues

## Overview

This document outlines known limitations, incomplete features, and bugs in PixelFlow.
Documented for transparency and to guide future development priorities.

**Last Updated:** June 2026  
**Version:** 1.2.0 (dynamic pipeline engine)  
**Previous Versions:** 1.1.0 · [1.0.0](https://github.com/Mauryantitans/PixelFlow) on GitHub

---

## ✅ Recently shipped (1.2.0 — dynamic pipeline engine)

A substantial architecture upgrade landed since 1.1.0. Several items previously listed
below are now resolved (marked ✅ inline).

**Engine & operations**
- **Backend operation registry is the single source of truth.** Each operation declares a
  stable id, category, description, a **typed parameter schema**, and the callable. The
  frontend renders controls dynamically from `GET /api/processing/operations`; the
  duplicated frontend `*_OPERATION_CONFIGS` were removed.
- **77 operations** (up from ~53): fixed Watershed & Denoise Wavelet, plus ~22 new
  techniques (stylize, photo enhancement, segmentation, morphology, noise, …).
- **Typed parameters**: int, float, odd-kernel, angle, enum, **bool**, **color**, and
  image-coordinate **point / points / rect** — with server-side validation/coercion and
  structured per-step errors (replacing silent no-ops).
- **Interactive inputs**: click a seed **point**, drag a **region (ROI)**, or use an
  **eyedropper** directly on the preview (Flood Fill, Crop, Inpaint Region).
- **Incremental live preview**: a per-step prefix cache recomputes only steps from the
  point of change (editing the last step ≈ 1 op); superseded live requests are cancelled.

**Comparison & UX** — resolves **#30**
- Before/after **wipe slider**, **side-by-side of any two pipeline steps**, and a
  **diff/overlay** view.

**Quality & infrastructure** — resolves **#31**, **#37**
- **Automated tests** (pytest, 64 passing) + **GitHub Actions CI** + ruff/mypy + pre-commit.
- **HTTP-level API tests** unlocked by a FastAPI 0.115 / Starlette 0.41 bump.
- Removed the dual filesystem/database storage path (database-only) and the legacy
  `main.py` shims; **Docker** + `docker-compose` already present.

**Bug fixes (June 2026)**
- Admin settings now actually drive enforcement — DB `SystemSettings` is the single source
  of truth (`cleanup_service`, `session_db`, `auth` logout, admin stats all read it).
- SQLite naive/aware datetime crash in the admin *Database → Sessions* view fixed
  (`datetime_utils.ensure_aware`).
- Storage-quota-of-0 divide-by-zero guarded; zero-byte uploads rejected with a clean 400.
- PNG transparency preserved on upload; DB-mode batch upload (`/images/upload-multiple`) added.

**httpOnly-cookie auth + CSRF** shipped after the initial 1.2.0 cut (see #23).

**Reserved / not yet enforced** (deliberate follow-ups): `delete_oldest_on_quota`,
`cleanup_on_tab_close`, server-side `max_images_per_upload`, downscale-on-drag preview,
and **Redis** multi-instance rate limiting.

---

## 🚨 Critical Limitations

### 1. **Desktop-Only Interface**

**Status:** ❌ Not Mobile Responsive

**Description:**
- PixelFlow is designed and optimized **exclusively for desktop browsers**
- Mobile/tablet support was attempted but reverted due to quality issues
- The application requires minimum screen width of ~1280px for optimal use

**Impact:**
- Users cannot use PixelFlow on mobile devices
- Tablets may have poor experience
- Responsive layouts were attempted but compromised functionality

**Workaround:**
- Use desktop or laptop computers only
- Minimum recommended resolution: 1366x768

**Future Plan:**
- Mobile support deferred to V2.0
- Would require significant UI redesign to maintain quality
- Preference is desktop-only over compromised mobile experience

---

### 2. **Google OAuth Requires Manual Setup**

**Status:** ⚠️ Implemented But Not Configured by Default

**Description:**
- Google OAuth authentication is fully implemented in code
- Requires external Google Cloud Console configuration
- Environment variables must be manually set

**Required Steps:**
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Set authorized redirect URIs
5. Copy Client ID and Secret to environment variables

**Missing:**
- No automatic OAuth setup
- No fallback if OAuth fails
- Requires manual configuration in both local and production

**Environment Variables Needed:**
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

**Documentation:** See `guides/GOOGLE_OAUTH_SETUP.md`

---

### 3. **Admin Panel - Limited User Management**

**Status:** ⚠️ Partially Implemented

**Description:**
Admin panel has basic functionality but lacks advanced features.

**What Works:**
- ✅ View system statistics
- ✅ View active sessions count
- ✅ View storage usage
- ✅ Adjust quotas and limits
- ✅ Manual cleanup trigger
- ✅ PIN-protected database viewer
- ✅ View user list with image counts
- ✅ View individual user's images and pipelines
- ✅ Delete individual users
- ✅ Delete individual images
- ✅ Delete individual pipelines
- ✅ Fix orphaned images
- ✅ Delete all images (danger zone)

**What's Missing/Limited:**
- ❌ **No batch user operations** (can't select multiple users to delete)
- ❌ **No user role management** (can't promote users to admin from UI)
- ❌ **No user search/filter** functionality
- ❌ **No usage analytics** (who's using what operations)
- ❌ **No activity timeline** (recent user actions)
- ❌ **No email notifications** to users
- ❌ **No password reset** for users (admin can't reset user passwords from UI)
- ❌ **Limited session management** (can't force-logout specific users)
- ❌ **No export functionality** (can't export user data as CSV/JSON)
- ❌ **No audit log** (who did what, when)

**Known Issues:**
- Settings changes require manual "Save Changes" button
- No real-time updates (must click refresh button)
- Database viewer requires PIN on every panel open (doesn't remember PIN in session)

> ✅ **Fixed (June 2026):** saved settings (retention, session lifetime, cleanup
> toggles) now actually drive enforcement — see *Recently Fixed* above. They were
> previously written to the DB but ignored.

---

### 4. **No Background Cleanup Jobs**

**Status:** ❌ Not Implemented

**Description:**
While cleanup logic exists, there's no automated background job to run it.

**Current Behavior:**
- Cleanup service code exists (`CleanupService`) and now respects the editable
  retention/session settings (see *Recently Fixed*)
- A background task *is* started in `main.py` lifespan
  (`session_manager.periodic_cleanup`), **but it only cleans filesystem-mode session
  files** — it does **not** run the database `CleanupService`
- Manual DB cleanup works via the admin panel ("Run Cleanup Now")
- **BUT:** in database mode (production default) there is still no automatic
  scheduled DB cleanup

**Missing:**
- ❌ No scheduled task that runs `CleanupService.run_full_cleanup` for the DB
- ❌ No automatic cleanup of expired sessions / old images in database mode
- ❌ Database grows until an admin manually triggers cleanup

**Impact:**
- Admin must manually run cleanup via admin panel
- Old data accumulates over time
- Database size increases without bounds

**Workaround:**
- Admin should manually trigger cleanup weekly
- Monitor database size regularly
- Use admin panel "Run Cleanup Now" button

**Future Plan:**
- Implement with Celery (task queue)
- Or use Render cron jobs (paid feature)
- Or use external cron service to call cleanup endpoint

---

## ⚠️ Moderate Limitations

### 5. **Image Storage Limitations**

**Status:** ⚠️ Design Decision

**Description:**
Images are stored as binary data in PostgreSQL database.

**Limitations:**
- Database size grows quickly with many/large images
- Free tier PostgreSQL limit: 1GB total storage
- Backup/restore is slower with large binary data
- Cannot serve images via CDN

**Advantages:**
- Simple deployment (no separate storage service)
- Images persist with database
- No additional configuration needed
- Works perfectly for free tier deployment

**Limitations:**
```
Free Tier (1GB database):
- ~100-200 images (5-10MB each)
- ~20-40 users with moderate usage
- Sufficient for demo/portfolio projects
```

**Alternative (Not Implemented):**
- Could use S3/Cloudinary for image storage
- Would require additional configuration
- Would increase deployment complexity

---

### 6. **No Email Verification**

**Status:** ❌ Not Implemented

**Description:**
User registration doesn't verify email addresses.

**Current Behavior:**
- Users can register with any email
- No confirmation email sent
- Email address not verified

**Security Implications:**
- Users could register with fake emails
- No password reset via email (not implemented)
- Cannot verify user identity

**Workaround:**
- Google OAuth provides verified emails
- Manual moderation via admin panel

---

### 7. **No Password Reset Functionality**

**Status:** ❌ Not Implemented

**Description:**
If users forget their password, they cannot reset it.

**Missing Features:**
- ❌ No "Forgot Password" link
- ❌ No password reset emails
- ❌ No password reset tokens
- ❌ Admin cannot reset user passwords from panel

**Current Workaround:**
- Users must create new account
- Or contact admin to delete account
- OAuth users unaffected (no password)

**Future Implementation Requires:**
- Email service (SendGrid, Mailgun, etc.)
- Password reset token system
- Email templates
- Additional environment configuration

---

### 8. **Limited File Format Support**

**Status:** ⚠️ Design Decision

**Supported Formats:**
- ✅ JPEG/JPG
- ✅ PNG
- ✅ BMP
- ✅ TIFF

**Not Supported:**
- ❌ GIF (no animation support)
- ❌ WebP
- ❌ HEIC/HEIF
- ❌ RAW formats (CR2, NEF, ARW, etc.)
- ❌ SVG
- ❌ PDF

**Reason:**
- OpenCV and PIL limitations
- Focus on common web formats
- RAW support would require additional heavy libraries

**Impact:**
- Users must convert images to supported formats first
- No support for modern formats like WebP
- Photographers cannot use RAW files directly

---

### 9. **Free Tier Cold Start Delay**

**Status:** ⚠️ Platform Limitation (Render Free Tier)

**Description:**
Backend spins down after 15 minutes of inactivity on Render free tier.

**User Experience:**
- First request after inactivity: **~30 seconds wait time**
- Subsequent requests: Normal speed
- Happens on Render free tier deployments

**Cannot Be Fixed Without:**
- Upgrading to Render paid plan ($7/month)
- OR using external ping service to keep warm
- OR accepting the cold start delay

**Workaround:**
- Use cron-job.org to ping `/health` every 14 minutes
- Educate users about initial load time
- Consider paid tier for production use

---

## 🔧 Minor Limitations

### 10. **No Batch Download**

**Status:** ❌ Not Implemented

**Description:**
Users can download individual processed images but not as a batch ZIP file.

**Current Behavior:**
- Must download images one by one
- Tedious for large batches

**Workaround:**
- Manual download of each image
- Use browser's "Save All Images" extension

**Future Implementation:**
- JSZip library (already in package.json!)
- Frontend could create ZIP client-side
- Relatively easy to implement

---

### 11. **No Pipeline Sharing**

**Status:** ⚠️ Partially Implemented

**Description:**
Pipelines have `is_public` flag but no sharing UI.

**Database Support:**
- ✅ SavedPipeline.is_public field exists
- ✅ Backend can query public pipelines

**Missing UI:**
- ❌ No "Browse Public Pipelines" page
- ❌ No pipeline gallery
- ❌ Cannot make pipelines public from UI (always saved as private)
- ❌ No search/filter for public pipelines
- ❌ No pipeline rating system

**Future Plan:**
- Community pipeline gallery
- Pipeline marketplace
- User can share/discover pipelines

---

### 12. **No Processing History Dashboard**

**Status:** ⚠️ Database Exists, UI Missing

**Description:**
Processing history is logged to database but not visible to users.

**Backend:**
- ✅ ProcessingHistory model exists
- ✅ Data is being logged
- ✅ Admin can see stats

**Missing:**
- ❌ User cannot see their own processing history
- ❌ No timeline of past operations
- ❌ Cannot re-run previous pipelines from history
- ❌ No usage statistics for users

**Potential Use:**
- Show "Recent Pipelines" for quick re-use
- Analytics on most-used operations
- Usage tracking for optimization

---

### 13. **No Image Metadata Preservation**

**Status:** ❌ Not Implemented

**Description:**
EXIF data is stripped from processed images.

**Current Behavior:**
- Original EXIF data (camera settings, GPS, etc.) is lost
- Processed images have minimal metadata

**Impact:**
- Photographers lose important metadata
- Cannot preserve copyright information
- GPS location data is removed

**Technical Reason:**
- PIL/OpenCV processing strips EXIF
- Would require additional library (piexif)
- Complex to preserve across all operations

---

### 14. **No Undo for Processed Images**

**Status:** ⚠️ Pipeline Undo Only

**Description:**
Users can undo pipeline steps but not actual processed results.

**What Works:**
- ✅ Undo/Redo for pipeline builder (Ctrl+Z/Ctrl+Y)
- ✅ Can remove operations from pipeline

**What Doesn't Work:**
- ❌ Cannot undo after "Apply Pipeline" in batch mode
- ❌ Processed images are final (cannot revert)
- ❌ No processing history to go back to

**Workaround:**
- Use Live Mode for experimentation
- Keep original images
- Re-upload and reprocess if needed

---

### 15. **Limited Image Format Conversion**

**Status:** ❌ Not Implemented

**Description:**
No built-in format conversion (JPEG to PNG, etc.)

**Current Behavior:**
- Processed images saved in same format as original
- No option to change output format

**Missing:**
- ❌ Cannot convert JPEG to PNG
- ❌ Cannot change compression quality
- ❌ No format selection in download

**Workaround:**
- Use external tools for format conversion
- Re-upload in desired format

---

## 🐛 Known Bugs

### 16. **Admin Panel PIN Not Persisted in Session**

**Severity:** Minor Annoyance

**Description:**
Admin must re-enter PIN every time they open admin panel.

**Expected Behavior:**
- PIN should be remembered for current session
- Should not ask for PIN again until logout/close

**Current Behavior:**
- PIN verification resets when admin panel is closed
- Must re-enter PIN every time
- Frustrating for frequent admin panel use

**Technical Cause:**
- `pinVerified` state resets when `AdminPanel` component unmounts
- No session storage of PIN verification

**Fix Required:**
- Store PIN verification in sessionStorage
- Or keep AdminPanel mounted but hidden
- Or verify PIN once per session

---

### 17. **Session Heartbeat May Lag on Slow Connections**

**Severity:** Minor

**Description:**
Session heartbeat sends every 30 seconds, but on slow connections may be delayed.

**Potential Issues:**
- Session might be marked inactive if heartbeat delayed
- Could cause unexpected "session expired" errors
- Very rare on normal connections

**Mitigation:**
- 5-minute active window provides buffer
- Most connections can handle 30s heartbeat
- Only affects very slow/unstable networks

---

### 18. **Orphaned Guest Images Issue**

**Severity:** Minor (Has Fix)

**Description:**
Guest images may be linked to sessions but not to users after user logs in.

**Cause:**
- Images uploaded before login remain as "guest" images
- Not automatically reassigned when user logs in

**Current Solution:**
- ✅ Admin panel has "Fix Orphaned Images" button
- Automatically links guest images to correct users
- Works retroactively

**Prevention:**
- Recent code improvements prevent this for new images
- Existing orphaned images need manual fix

---

### 18b. **Batch Upload 404s in Database Mode**

**Severity:** High (newly identified, June 2026 — not yet fixed)

**Description:**
The frontend's multi-file upload (`ApiService.uploadMultipleImages`) POSTs to
`/api/images/upload-multiple`, but that endpoint only exists in the **filesystem**
router (`backend/app/api/routes/images.py`). The **database** router
(`images_db.py`) — which is what runs in production (`IMAGE_STORAGE=database`) —
has no `upload-multiple` route, so the call returns 404.

**Impact:**
- Selecting multiple files at once fails in the deployed (database-mode) app,
  unless the frontend falls back to looping single uploads.

**Fix Required:**
- Add an `upload-multiple` endpoint to `images_db.py` mirroring the single-upload
  logic (including the new zero-byte and transparency handling), or have the
  frontend always upload files individually.

---

## 📉 Performance Limitations

### 19. **Large Image Processing Can Be Slow**

**Severity:** Expected Limitation

**Description:**
Processing very large images (>10MP) can take several seconds.

**Performance Benchmarks:**
| Image Size | Basic Operations | Complex Operations |
|------------|------------------|-------------------|
| 2MP | < 50ms | 100-300ms |
| 5MP | 100-200ms | 300-500ms |
| 10MP | 200-400ms | 500-1000ms |
| 20MP+ | 500-1000ms | 1-3 seconds |

**Limitations:**
- Python/PIL performance constraints
- No GPU acceleration
- Single-threaded processing

**Workaround:**
- Resize large images before processing
- Use batch mode for multiple images
- Consider server with more CPU for production

**Not Implemented:**
- ❌ GPU acceleration (OpenCV CUDA)
- ❌ Multi-threaded processing
- ❌ Automatic image downscaling suggestion

---

### 20. **Batch Processing Blocks UI**

**Severity:** Minor

**Description:**
During batch processing, UI may feel less responsive.

**Current Behavior:**
- Progress bar shows status
- Cannot start new operations during processing
- Frontend waits for backend response

**Not Implemented:**
- ❌ WebSocket for real-time progress
- ❌ Background processing with notifications
- ❌ Ability to queue multiple batch jobs

**Impact:**
- Minor UX issue for large batches
- Acceptable for most use cases

---

## 🔐 Security Limitations

### 21. **Rate Limiting — Single-Instance Only**

**Status:** ⚠️ Implemented per-IP, in-memory (not multi-instance)

**What's Implemented:**
- ✅ Login attempt rate limiting (5 attempts, 15 min lockout)
- ✅ **Per-IP rate limiting on upload (~30/min) and processing (~50/min)** via the
  rate-limit middleware (`middleware/rate_limit.py` + `security_config`)
- ✅ Auth endpoints rate-limited

**What's Missing:**
- ❌ Limiter state is **in-memory**, so limits are per-instance — they don't coordinate
  across multiple backend instances (would need **Redis**; deferred until horizontal scaling)
- ❌ No per-user (vs per-IP) quotas
- ❌ No edge DDoS protection

**Mitigation:**
- App runs as a single instance today, so in-memory limiting is effective
- Add Cloudflare / a Redis-backed limiter when scaling horizontally

---

### 22. **No HTTPS in Local Development**

**Severity:** Minor

**Description:**
Local development runs on HTTP (localhost).

**Impact:**
- Google OAuth requires HTTPS in production
- Some browser features require HTTPS
- Testing OAuth locally requires workarounds

**Workaround:**
- Use production deployment for OAuth testing
- Or set up local HTTPS with self-signed certificates
- HTTP is fine for local non-OAuth development

---

### 23. **Auth Tokens** — ✅ RESOLVED (1.2.0): httpOnly cookies

**Status:** ✅ Implemented

JWTs are now delivered as **httpOnly cookies** (set by the backend), never readable by
JavaScript — so an XSS bug can't exfiltrate the session.

**Implemented:**
- ✅ `pf_access` (httpOnly, Path=/) and `pf_refresh` (httpOnly, Path=/api/auth) cookies;
  tokens are no longer returned in response bodies or stored in `localStorage`
- ✅ **CSRF protection** — double-submit cookie: a non-httpOnly `pf_csrf` cookie is echoed
  back in the `X-CSRF-Token` header on state-changing requests and verified server-side
  (`middleware/csrf.py`)
- ✅ **Refresh-token rotation** + DB revocation on logout (now also for Google OAuth logins)
- ✅ Cookie attributes are env-driven (`COOKIE_SECURE`/`COOKIE_SAMESITE`/`COOKIE_DOMAIN`)
- ✅ Guest `session_id` is now a `crypto.randomUUID()` (was a guessable timestamp+random)

**Deployment note:** because the demo is split across Vercel (frontend) and Render
(backend), the API is served **same-origin** via a Vercel rewrite (`/api/*` → backend) so
cookies are first-party (`SameSite=Lax`, works in every browser). See
[deployment/DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md).

---

## 💾 Database Limitations

### 24. **Free Tier Database Constraints**

**Status:** ⚠️ Platform Limitation

**Render Free Tier PostgreSQL:**
- Storage: 1GB total
- Retention: 90 days (database deleted after)
- No continuous backups
- Limited to 1 database

**Impact:**
```
Approximate Capacity:
- ~100-200 users with moderate usage
- ~500-1000 total images (depending on size)
- ~1000-2000 saved pipelines
- Sufficient for demo/portfolio projects
```

**Workaround:**
- Regular manual backups using `database/backup_database.py`
- Monitor storage via admin panel
- Upgrade to paid tier if needed ($7/month for 10GB)

---

### 25. **No Database Migrations After Deployment**

**Status:** ⚠️ Alembic Configured But Not Used

**Description:**
Alembic is set up but database migrations not actively used.

**Current State:**
- ✅ Alembic installed and configured
- ✅ Migration framework in place (`backend/alembic/`)
- ❌ No migration files in `versions/` folder
- ❌ Schema changes require manual database recreation

**Impact:**
- Schema changes destroy existing data
- Cannot update database structure safely in production
- Would need to manually migrate data

**Workaround:**
- Currently: Drop and recreate database
- Backup data before schema changes
- Restore data after recreation

**Future Plan:**
- Generate migration files for schema changes
- Use `alembic upgrade head` for updates
- Maintain migration history

---

### 26. **No Database Replication**

**Status:** ❌ Not Available on Free Tier

**Description:**
Single database instance with no backups or replication.

**Risks:**
- Database failure = data loss
- No point-in-time recovery
- Single point of failure

**Mitigation:**
- Manual backups using scripts
- Export critical data regularly
- Free tier limitation, not fixable without paid plan

---

## 🎨 UI/UX Limitations

### 27. **No Dark/Light Theme Switcher**

**Status:** ❌ Not Implemented

**Description:**
Dark mode styles exist in Tailwind classes but no toggle.

**Current State:**
- ✅ All components have dark mode classes
- ✅ Theme is technically supported
- ✅ A `useTheme` hook exists (`frontend/src/hooks/index.ts`) for persisting/toggling theme
- ⚠️ Verify a visible toggle is wired into the header UI

**Missing:**
- Theme toggle button in header
- Theme preference persistence
- Smooth theme transition

**Easy to Implement:**
- Just needs toggle button and context
- ~30 minutes of work

---

### 28. **No Keyboard Shortcuts for Common Actions**

**Status:** ⚠️ Partially Implemented

**What Works:**
- ✅ Ctrl+Z: Undo pipeline step
- ✅ Ctrl+Y: Redo pipeline step
- ✅ Ctrl+K: Focus operation search
- ✅ Escape: Close modals

**What's Missing:**
- ❌ Ctrl+U: Upload images
- ❌ Ctrl+S: Save pipeline
- ❌ Ctrl+L: Toggle live mode
- ❌ Ctrl+Enter: Apply pipeline
- ❌ Delete: Remove selected images

**Impact:**
- Power users can't use keyboard for all actions
- Slightly less efficient workflow

---

### 29. **No Drag-and-Drop for Images**

**Status:** ❌ Not Implemented

**Description:**
Users must click "Upload" button - cannot drag images to browser.

**Missing:**
- No drag-and-drop zone
- No visual feedback when dragging over window
- Must use file picker dialog

**Workaround:**
- Click upload button
- Standard file picker works fine

---

### 30. **Image Comparison Tools** — ✅ RESOLVED (1.2.0)

**Status:** ✅ Implemented

**Description:**
The Inspector now offers rich step-by-step comparison.

**Implemented:**
- ✅ Before/after **wipe slider** (`components/CompareSlider.tsx`)
- ✅ **Side-by-side of any two pipeline steps** (A/B stage selectors in `Inspector`)
- ✅ **Difference / overlay heatmap** (`components/DiffView.tsx`)
- ✅ Per-step intermediate results are retained so any stage can be inspected

---

## 🧪 Testing Limitations

### 31. **Automated Tests** — ✅ RESOLVED (1.2.0)

**Status:** ✅ Implemented (backend); frontend smoke tests present

**Implemented:**
- ✅ Backend: **pytest** suite (~64 tests) covering the registry, executor, param specs,
  coords, pipeline, preview cache, the interactive/extras op batches, and **HTTP-level
  API tests** (via Starlette `TestClient` after the FastAPI 0.115 bump)
- ✅ Frontend: Jest/RTL smoke tests + strict `tsc --noEmit`
- ✅ **CI/CD pipeline**: `.github/workflows/ci.yml` runs ruff + mypy + pytest and the
  frontend type-check/tests on push/PR
- ✅ **pre-commit** hooks (`.pre-commit-config.yaml`)

**Still nice-to-have:**
- ⬜ End-to-end (Playwright) tests in CI
- ⬜ Broader frontend component coverage

---

### 32. **No Performance Monitoring**

**Status:** ⚠️ Basic Timing Only

**What Exists:**
- ✅ Processing time logged for each operation
- ✅ Total pipeline time displayed
- ✅ Admin can see average times

**What's Missing:**
- ❌ No APM (Application Performance Monitoring)
- ❌ No error tracking service (Sentry, etc.)
- ❌ No performance trends over time
- ❌ No slow query detection

**Impact:**
- Harder to identify performance regressions
- Cannot track errors in production
- No analytics on what's slow

---

## 📱 Feature Gaps

### 33. **No Favorites/Bookmarks**

**Status:** ❌ Not Implemented

**Description:**
Users cannot bookmark favorite operations or pipelines.

**Missing:**
- ❌ No "favorite" operations feature
- ❌ Cannot star frequently-used operations
- ❌ No custom operation order
- ❌ No "recent operations" list

---

### 34. **No Collaboration Features**

**Status:** ❌ Not Implemented

**Description:**
No multi-user collaboration features.

**Missing:**
- ❌ Cannot share sessions with other users
- ❌ No team workspaces
- ❌ Cannot comment on pipelines
- ❌ No pipeline versioning

**Out of Scope:**
- Designed as single-user tool
- Would require significant architecture changes

---

### 35. **No API Key System**

**Status:** ❌ Not Implemented

**Description:**
No programmatic API access for developers.

**Missing:**
- ❌ No API keys for developers
- ❌ Cannot use PixelFlow as a service
- ❌ No API rate limits per key
- ❌ No API documentation for external use

**Current API:**
- Designed for frontend only
- Requires user authentication (JWT)
- Not designed for external consumption

---

### 36. **No Webhooks or Callbacks**

**Status:** ❌ Not Implemented

**Description:**
No notification system for processing completion.

**Missing:**
- ❌ No webhooks when processing complete
- ❌ No email notifications
- ❌ No browser push notifications

**Impact:**
- User must wait for batch processing
- No async processing with callback

---

## 🌐 Deployment Limitations

### 37. **Docker Support**

**Status:** ✅ Implemented (June 2026)

**Description:**
Docker configuration now exists for containerized deployment and local dev.

**Available:**
- ✅ `backend/Dockerfile` and `frontend/Dockerfile`
- ✅ Root `docker-compose.yml` (PostgreSQL + backend + frontend, hot-reload)
- ✅ `start.sh` / `start.bat` no-Docker launchers (SQLite)

**Notes:**
- Render (native Python) and Vercel (native Node.js) deployment still work as before
- The compose stack is primarily for local development / self-hosting

---

### 38. **No Environment-Specific Configs**

**Status:** ⚠️ Single .env File

**Description:**
No separate configs for dev/staging/production.

**Current:**
- One `.env.example` template
- Manual changes for different environments
- No `.env.development`, `.env.production`

**Risk:**
- Accidentally use dev config in production
- Manual process error-prone

---

### 39. **No Health Check Monitoring**

**Status:** ⚠️ Endpoint Exists, No Monitoring

**Description:**
`/health` endpoint exists but no active monitoring.

**Missing:**
- ❌ No uptime monitoring service
- ❌ No alert system for downtime
- ❌ No status page for users

**Workaround:**
- Use UptimeRobot (free) for monitoring
- Render has basic monitoring
- Set up manual checks

---

### 40. **No Logging Service Integration**

**Status:** ⚠️ Logs to Console Only

**Description:**
Application logs to console/Render logs only.

**Missing:**
- ❌ No centralized logging (Papertrail, Loggly)
- ❌ No log aggregation
- ❌ No log search
- ❌ Logs lost after 7 days on Render free tier

**Impact:**
- Debugging production issues harder
- Cannot analyze historical issues
- Limited log retention

---

## 📊 Data & Analytics Limitations

### 41. **No User Analytics**

**Status:** ❌ Not Implemented

**Description:**
No analytics on how users use the application.

**Missing:**
- ❌ No Google Analytics integration
- ❌ No event tracking (which operations used most)
- ❌ No user flow analysis
- ❌ No feature usage statistics

**Impact:**
- Cannot understand user behavior
- Don't know which features to prioritize
- Cannot optimize for common workflows

---

### 42. **No Error Reporting**

**Status:** ❌ Not Implemented

**Description:**
Client-side errors not reported to developers.

**Missing:**
- ❌ No Sentry or error tracking service
- ❌ Users experience errors silently
- ❌ Cannot proactively fix issues

**Current:**
- Errors only visible in user's browser console
- Developers unaware of production issues

---

## 🔄 Integration Limitations

### 43. **No Third-Party Integrations**

**Status:** ❌ Not Implemented

**Description:**
Cannot integrate with other services.

**Missing:**
- ❌ No Dropbox/Google Drive import
- ❌ No Slack/Discord notifications
- ❌ No Zapier integration
- ❌ No export to external services

**Out of Scope:**
- V1.0 is standalone application
- Future versions may add integrations

---

## 💰 Business Limitations

### 44. **No Premium Features**

**Status:** ❌ Not Implemented

**Description:**
No paid tier or premium features.

**Current:**
- All users have same features
- No monetization system
- No payment processing

**Missing:**
- ❌ No Stripe integration
- ❌ No premium quotas
- ❌ No priority processing
- ❌ No advanced features for paid users

**Impact:**
- Cannot generate revenue
- Cannot offer enhanced plans
- All users on free tier

---

### 45. **No Usage Quotas Enforcement**

**Status:** ⚠️ Quotas Defined, Limited Enforcement

**Description:**
Storage quotas exist but processing limits not enforced.

**Enforced:**
- ✅ Storage quotas (popup at 80%)
- ✅ Max images per session
- ✅ Max images per upload

**Not Enforced:**
- ❌ No daily processing limit
- ❌ No monthly operation count limit
- ❌ No bandwidth throttling

**Risk:**
- User could process unlimited images
- Potential cost issues on paid tiers

---

## 🚀 Scalability Limitations

### 46. **Single Server Architecture**

**Status:** ⚠️ Design Limitation

**Description:**
Backend designed for single server deployment.

**Limitations:**
- No horizontal scaling
- No load balancer support
- Session state in memory
- All processing on one server

**Impact:**
- Limited to single server capacity
- Cannot handle very high traffic
- Render free tier sufficient for <100 concurrent users

**Not Needed Until:**
- Thousands of daily active users
- V1.0 scale is appropriate for target audience

---

### 47. **No CDN for Images**

**Status:** ❌ Not Implemented

**Description:**
Images served directly from backend, not via CDN.

**Impact:**
- Slower image loading for distant users
- More bandwidth usage on backend
- Cannot leverage edge caching

**Current:**
- Acceptable for small scale
- Free tier includes reasonable bandwidth

**Future:**
- Use Cloudflare R2 or S3 + CloudFront
- Requires architecture changes

---

## 🎯 Priority for Future Versions

### **✅ Delivered in 1.2.0**
- Automated testing suite + CI (#31)
- Image comparison tools — slider / side-by-side / diff (#30)
- Docker + docker-compose (#37)
- Backend operation registry + schema-driven UI + interactive (point/ROI/color) inputs
- Incremental live-preview engine (prefix cache + request cancellation)
- Rate limiting on upload/processing (per-IP)
- **httpOnly-cookie auth + CSRF protection + token rotation/revocation (#23)**

### **High Priority (next)**
1. Background cleanup jobs / scheduler (#4)
2. Batch download as ZIP (#10)
3. Admin panel PIN persistence (#16)
5. Mobile warning message / responsiveness (#1)

### **Medium Priority**
6. Email verification (#6)
7. Password reset (#7)
8. Pipeline sharing UI (#11)
9. Processing history dashboard (#12)
10. Image metadata preservation — EXIF (#13)

### **Low Priority / Scale**
11. Full mobile responsiveness
12. WebSocket real-time updates
13. Redis-backed rate limiting (multi-instance) (#21)
14. CDN / external object storage for images (#5, #47)
15. Third-party integrations / premium features

---

## ✅ Conclusion

Despite these limitations, PixelFlow 1.2.0 is a **fully functional, production-ready image processing platform** suitable for:

- ✅ Personal image processing projects
- ✅ Portfolio demonstrations
- ✅ Educational use
- ✅ Research and experimentation
- ✅ Small team usage (<50 users)
- ✅ Desktop/laptop users

**Most limitations are:**
- Documented and understood
- Have reasonable workarounds
- Planned for future versions
- Acceptable for target use cases

**The application excels at:**
- ✅ Core image processing functionality
- ✅ Real-time, incremental visual feedback
- ✅ Extensible, schema-driven operation library (**77 operations**)
- ✅ Interactive inputs (click a point, drag a region, pick a color)
- ✅ Step-by-step comparison (slider / side-by-side / diff)
- ✅ Professional desktop UX
- ✅ Secure authentication
- ✅ Database persistence
- ✅ Tested codebase with CI
- ✅ Free deployment ($0/month)

---

**For questions about any limitation or to contribute fixes, see [CONTRIBUTING.md](CONTRIBUTING.md) or open an issue on GitHub.**

---

*This document will be updated as limitations are addressed and new ones are discovered.*
