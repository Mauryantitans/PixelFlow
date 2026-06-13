# Environment Variables Configuration

## Backend Environment Variables (Render)

Copy these to Render Dashboard → Web Service → Environment Variables

```bash
# Application Settings
DEBUG=False
APP_NAME=PixelFlow
VERSION=1.0.0

# Server Settings
HOST=0.0.0.0
PORT=10000

# Image Storage
IMAGE_STORAGE=database

# Database Settings
USE_SQLITE=False
DATABASE_URL=<YOUR_POSTGRES_URL_FROM_RENDER>
# Format: postgresql://username:password@host:port/database

# Security - IMPORTANT: Generate new values!
SECRET_KEY=<GENERATE_NEW_SECRET_KEY>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Origins - Update after frontend deployment
# NOTE: the env var is ALLOWED_ORIGINS (not CORS_ORIGINS)
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# Vercel preview-deployment regex (update prefix to match your project name)
ALLOWED_ORIGINS_REGEX=https://your-app(-[a-z0-9]+)*\.vercel\.app

# Google OAuth (Optional - if using OAuth)
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-client-secret
# GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/google/callback
```

### Generate SECRET_KEY

Run this command locally:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste as SECRET_KEY value.

---

## Frontend Environment Variables (Vercel)

Add these in Vercel Dashboard → Project → Settings → Environment Variables

```bash
# API URL - Update with your Render backend URL
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

**Important Notes:**
- Variable MUST start with `REACT_APP_` for Create React App
- Use your actual Render backend URL
- Don't include trailing slash
- Must redeploy after adding/changing variables

---

## Local Development Environment Variables

### Backend (.env file in backend/)

```bash
# Application Settings
DEBUG=True
APP_NAME=PixelFlow
VERSION=1.0.0

# Server Settings
HOST=0.0.0.0
PORT=8000

# Image Storage (use filesystem for local dev)
IMAGE_STORAGE=filesystem

# Database Settings (use SQLite for local dev)
USE_SQLITE=True

# Security
SECRET_KEY=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Origins
ALLOWED_ORIGINS=http://localhost:3000

# Google OAuth (Optional)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Frontend (.env file in frontend/)

```bash
# API URL for local development
REACT_APP_API_URL=http://localhost:8000/api
```

---

## Environment Variable Checklist

### Before Backend Deployment
- [ ] DEBUG set to False
- [ ] NEW SECRET_KEY generated (never use dev key!)
- [ ] DATABASE_URL from Render PostgreSQL
- [ ] USE_SQLITE set to False
- [ ] IMAGE_STORAGE set to database
- [ ] ALLOWED_ORIGINS includes localhost for testing

### After Frontend Deployment
- [ ] Update CORS_ORIGINS with Vercel URL
- [ ] Redeploy backend to apply CORS changes

### Optional OAuth Setup
- [ ] GOOGLE_CLIENT_ID configured
- [ ] GOOGLE_CLIENT_SECRET configured
- [ ] GOOGLE_REDIRECT_URI points to production URL
- [ ] OAuth consent screen configured in Google Cloud Console

---

## Security Best Practices

1. **Never commit .env files to Git**
   - Already in .gitignore ✓
   - Use .env.example as template

2. **Use different keys for dev/production**
   - Development: Simple keys for testing
   - Production: Strong randomly generated keys

3. **Rotate secrets regularly**
   - Change SECRET_KEY every 3-6 months
   - Update DATABASE_URL if password changes

4. **Restrict CORS origins**
   - Production: Only your domain
   - Development: Include localhost
   - Never use `*` (allow all)

5. **Monitor environment variables**
   - Render/Vercel dashboards show masked values
   - Download backup of variables for disaster recovery

---

## Troubleshooting

### Environment variable not working

**Backend (Render):**
- Check variable name matches exactly (case-sensitive)
- Verify value has no extra spaces
- Redeploy service after changes
- Check logs for "Environment variable XYZ not set"

**Frontend (Vercel):**
- Must start with `REACT_APP_`
- Redeploy after adding variables
- Check build logs for correct values
- Variables are compiled at build time (not runtime)

### Database connection fails

1. Check DATABASE_URL format:
   ```
   postgresql://username:password@host:port/database
   ```

2. Use External URL (not Internal):
   - Internal: Only works within Render network
   - External: Required for web services

3. Verify database is in same region as backend

4. Test connection manually:
   ```bash
   psql <DATABASE_URL>
   ```

### CORS errors

1. Check exact URL in CORS_ORIGINS:
   - Include https://
   - No trailing slash
   - Exact subdomain

2. Multiple origins separated by comma:
   ```
   https://app.vercel.app,https://www.app.com,http://localhost:3000
   ```

3. Redeploy backend after CORS changes

4. Clear browser cache and try again

---

## Quick Reference

### Render Environment Variables Location
```
Dashboard → Your Service → Environment → Add Environment Variable
```

### Vercel Environment Variables Location
```
Dashboard → Your Project → Settings → Environment Variables
```

### Update Variables
```
Render: Environment tab → Edit → Save → Auto-redeploys
Vercel: Settings → Environment Variables → Edit → Redeploy
```
