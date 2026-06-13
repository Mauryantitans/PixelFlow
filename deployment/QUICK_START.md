# 🚀 Quick Deployment Checklist

Follow these steps in order for successful deployment.

---

## ☑️ Phase 1: Preparation (5 minutes)

### 1. Check Repository
```bash
# Verify all code is committed
git status

# Push to GitHub if needed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Verify Files Exist
- [ ] `backend/requirements.txt` - All dependencies listed
- [ ] `frontend/package.json` - All dependencies listed
- [ ] `.gitignore` - Sensitive files excluded
- [ ] `backend/.env.example` - Template for environment variables

### 3. Create Accounts
- [ ] GitHub account (required)
- [ ] Render account → https://dashboard.render.com/register
- [ ] Vercel account → https://vercel.com/signup

---

## ☑️ Phase 2: Database Setup (10 minutes)

### 1. Create PostgreSQL Database on Render

**Steps:**
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   ```
   Name: pixelflow-db
   Database: pixelflow
   User: pixelflow_user
   Region: Oregon (Free)
   PostgreSQL Version: 16
   Plan: Free
   ```
4. Click **"Create Database"**
5. **Wait 2-3 minutes** for provisioning

### 2. Copy Database URL

After database is created:
- [ ] Find **"External Database URL"** on database dashboard
- [ ] Copy the full URL (starts with `postgresql://`)
- [ ] **Save it securely** - you'll need it for backend!

Format looks like:
```
postgresql://pixelflow_user:abc123xyz@dpg-xxxx.oregon-postgres.render.com:5432/pixelflow
```

---

## ☑️ Phase 3: Backend Deployment (15 minutes)

### 1. Create Web Service on Render

**Steps:**
1. Go to Render Dashboard
2. Click **"New +"** → **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Connect GitHub and select **PixelFlow** repository

### 2. Configure Service

```
Name: pixelflow-backend
Region: Oregon (same as database!)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Plan: Free
```

### 3. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

**Required Variables:**
```
DEBUG = False
APP_NAME = PixelFlow
VERSION = 1.2.0
HOST = 0.0.0.0
PORT = 10000
USE_SQLITE = False
DATABASE_URL = <PASTE_YOUR_DATABASE_URL_HERE>
SECRET_KEY = <GENERATE_NEW_KEY>
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALLOWED_ORIGINS = http://localhost:3000
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy output and paste as SECRET_KEY value!

### 4. Deploy Backend
- [ ] Click **"Create Web Service"**
- [ ] **Wait 5-10 minutes** for build and deployment
- [ ] Check logs for any errors
- [ ] Note your backend URL: `https://pixelflow-backend-xxxx.onrender.com`

### 5. Initialize Database

In Render dashboard:
1. Go to your backend service
2. Click **"Shell"** tab
3. Run:
   ```bash
   python database/init_db.py
   ```
4. Verify tables created successfully

### 6. Test Backend
- [ ] Open: `https://pixelflow-backend-xxxx.onrender.com/docs`
- [ ] Should see FastAPI documentation
- [ ] Test `/health` endpoint → Should return success

---

## ☑️ Phase 4: Frontend Deployment (10 minutes)

### 1. Copy Configuration Files

```bash
# From project root
copy deployment\vercel.json frontend\
```

### 2. Update API URL in Code

Edit `frontend/src/services/api.ts`:

Change line 10:
```typescript
baseURL: process.env.REACT_APP_API_URL || 'https://pixelflow-backend-xxxx.onrender.com/api',
```
Replace with your actual Render backend URL!

### 3. Commit Changes

```bash
git add frontend/vercel.json frontend/src/services/api.ts
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 4. Deploy to Vercel

**Steps:**
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Select your **PixelFlow** repository
4. Click **"Import"**

### 5. Configure Project

Vercel should auto-detect settings. Verify:
```
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build (auto-detected)
Output Directory: build (auto-detected)
```

### 6. Add Environment Variable

Click **"Environment Variables"**:
```
Name: REACT_APP_API_URL
Value: https://pixelflow-backend-xxxx.onrender.com/api
```
Replace with your actual Render backend URL!

### 7. Deploy Frontend
- [ ] Click **"Deploy"**
- [ ] **Wait 3-5 minutes** for build
- [ ] Note your frontend URL: `https://pixelflow-xxxx.vercel.app`

---

## ☑️ Phase 5: Connect Frontend & Backend (5 minutes)

### 1. Update CORS in Backend

Go to Render → Backend Service → Environment:
1. Find `CORS_ORIGINS` variable
2. Click **Edit**
3. Update value:
   ```
   https://pixelflow-xxxx.vercel.app,http://localhost:3000
   ```
   Use your actual Vercel URL!
4. Save → Backend will auto-redeploy

### 2. Wait for Backend Redeploy
- [ ] Check Render logs for successful deployment
- [ ] Usually takes 3-5 minutes

---

## ☑️ Phase 6: Testing (10 minutes)

### 1. Test Frontend
- [ ] Visit your Vercel URL
- [ ] Page loads without errors
- [ ] No console errors (F12)

### 2. Test Image Upload
- [ ] Click "Upload Image(s)"
- [ ] Select an image
- [ ] Verify image appears in gallery

### 3. Test Processing
- [ ] Select an image
- [ ] Add operation (e.g., Brightness)
- [ ] Adjust parameters
- [ ] Enable Live Mode or Apply Pipeline
- [ ] Verify processed result appears

### 4. Test Database Persistence
- [ ] Upload another image
- [ ] Refresh page (Ctrl+R)
- [ ] Verify images are still there (database storage working!)

### 5. Check Backend Health
- [ ] Visit: `https://your-backend.onrender.com/docs`
- [ ] Should see API documentation
- [ ] Test a few endpoints

---

## ☑️ Phase 7: Optional Enhancements

### Custom Domain (Vercel)
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Keep Backend Warm (Prevent Cold Starts)
Create a free cron job service:
1. Sign up at https://cron-job.org
2. Create job to ping: `https://your-backend.onrender.com/health`
3. Schedule: Every 14 minutes

### Enable Analytics
- **Vercel**: Auto-enabled, view in Dashboard → Analytics
- **Render**: View logs and metrics in Dashboard

---

## ✅ Deployment Complete!

Your PixelFlow application is now live! 🎉

### Your URLs:
- **Frontend**: `https://pixelflow-xxxx.vercel.app`
- **Backend**: `https://pixelflow-backend-xxxx.onrender.com`
- **API Docs**: `https://pixelflow-backend-xxxx.onrender.com/docs`
- **Database**: PostgreSQL on Render (connected)

---

## 🐛 Troubleshooting

### Issue: CORS Error
**Solution**: Verify CORS_ORIGINS in backend matches exact Vercel URL (with https, no trailing slash)

### Issue: Backend 502 Error
**Solution**: Check Render logs for errors, verify DATABASE_URL is correct

### Issue: Images Not Persisting
**Solution**: Verify DATABASE_URL is set and the database is initialized (images are always stored in the database)

### Issue: Slow First Load
**Solution**: Free tier spins down after 15min. First request takes ~30s (normal)

---

## 📚 Next Steps

1. **Monitor Usage**
   - Render: Check logs and metrics daily
   - Vercel: Review analytics and performance

2. **Set Up Alerts**
   - Render: Settings → Notifications → Email alerts
   - Vercel: Automatic deployment notifications

3. **Plan Updates**
   - Test changes locally first
   - Push to GitHub → Auto-deploys!

4. **Share Your App**
   - Update README with live URL
   - Share with users
   - Collect feedback

---

## 🆘 Need Help?

- **Deployment Guide**: `deployment/DEPLOYMENT_GUIDE.md` (detailed instructions)
- **Environment Variables**: `deployment/ENVIRONMENT_VARIABLES.md`
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Congratulations on deploying PixelFlow! 🚀**
