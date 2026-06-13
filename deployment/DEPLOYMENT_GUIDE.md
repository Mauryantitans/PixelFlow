# 🚀 PixelFlow Deployment Guide

Complete guide for deploying PixelFlow to production using free hosting services.

---

## 📋 Overview

This guide will help you deploy PixelFlow using:
- **Vercel** - Frontend hosting (React app)
- **Render** - Backend hosting (FastAPI) + PostgreSQL database
- **Total Cost**: $0/month (using free tiers)

### Architecture Overview
```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   Vercel    │ ───► │    Render    │ ───► │   PostgreSQL   │
│  (Frontend) │      │  (Backend)   │      │   (Database)   │
└─────────────┘      └──────────────┘      └────────────────┘
```

---

## 🎯 Pre-Deployment Checklist

Before deploying, ensure you have:
- [x] GitHub account
- [x] Vercel account (sign up at vercel.com)
- [x] Render account (sign up at render.com)
- [x] Your code pushed to GitHub repository
- [x] All sensitive data in `.env` (not committed to Git)

---

## Part 1: Database Deployment (Render PostgreSQL)

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Navigate to https://dashboard.render.com
   - Click **"New +"** → **"PostgreSQL"**

2. **Configure Database**
   ```
   Name: pixelflow-db
   Database: pixelflow
   User: pixelflow_user
   Region: Choose closest to your location
   PostgreSQL Version: 16 (latest)
   Plan: Free
   ```

3. **Create Database**
   - Click **"Create Database"**
   - Wait 2-3 minutes for provisioning

4. **Get Connection Details**
   After creation, you'll see:
   ```
   Internal Database URL: postgresql://...
   External Database URL: postgresql://...
   PSQL Command: psql -h ...
   ```
   
   **📋 IMPORTANT**: Copy the **External Database URL** - you'll need it!
   
   Format: `postgresql://username:password@host:port/database`

5. **Test Connection (Optional)**
   ```bash
   # Install PostgreSQL client if needed
   # Then test connection
   psql <External_Database_URL>
   ```

---

## Part 2: Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

1. **Create `render.yaml` in project root**
   This file is already created in the `deployment/` folder. Copy it to root:
   ```bash
   # From project root
   copy deployment\render.yaml .
   ```

2. **Verify `requirements.txt`**
   Ensure your `backend/requirements.txt` includes all dependencies.
   ✅ Already configured correctly!

3. **Create Production Settings**
   Update `backend/.env.example` with production values (keep secret!)

### Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Select **"Build and deploy from a Git repository"**
   - Click **"Connect account"** → Choose GitHub
   - Find and select your **PixelFlow** repository

3. **Configure Web Service**
   ```
   Name: pixelflow-backend
   Region: Same as database (important!)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. **Select Plan**
   - Choose **"Free"** plan
   - Free tier: 512 MB RAM, shared CPU

5. **Add Environment Variables**
   Click **"Advanced"** → **"Add Environment Variable"**
   
   Add these variables:
   ```
   DEBUG=False
   APP_NAME=PixelFlow
   VERSION=1.2.0
   
   # Database (paste your External Database URL from Step 1.4)
   DATABASE_URL=postgresql://pixelflow_user:password@host:port/pixelflow
   USE_SQLITE=False
   
   # Security (generate new secret key!)
   SECRET_KEY=<generate-new-secret-key>
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   
   # Server
   HOST=0.0.0.0
   PORT=10000
   
   # CORS (add your Vercel URL after frontend deployment)
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```

   **🔐 Generate SECRET_KEY:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Copy the output and use it as SECRET_KEY!

6. **Create Web Service**
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for first build
   - You'll get a URL like: `https://pixelflow-backend.onrender.com`

7. **Initialize Database**
   After deployment succeeds:
   - Go to **"Shell"** tab in Render dashboard
   - Run:
   ```bash
   python database/init_db.py
   ```
   This creates all database tables.

8. **Verify Backend**
   - Open: `https://pixelflow-backend.onrender.com/docs`
   - You should see FastAPI documentation
   - Test `/health` endpoint

**⚠️ Free Tier Limitations:**
- Service spins down after 15 min of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month free usage

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Create `vercel.json` in frontend folder**
   Already created in `deployment/` folder!
   ```bash
   # Copy to frontend folder
   copy deployment\vercel.json frontend\
   ```

2. **Update API URL**
   Edit `frontend/src/services/api.ts`:
   ```typescript
   const api = axios.create({
     baseURL: process.env.REACT_APP_API_URL || 'https://pixelflow-backend.onrender.com/api',
     // ... rest of config
   });
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**

2. **Import Repository**
   - Click **"Import Git Repository"**
   - Select your **PixelFlow** repository
   - Click **"Import"**

3. **Configure Project**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build (auto-detected)
   Output Directory: build (auto-detected)
   Install Command: npm install (auto-detected)
   ```

4. **Add Environment Variables**
   Click **"Environment Variables"** tab:
   ```
   Name: REACT_APP_API_URL
   Value: https://pixelflow-backend.onrender.com/api
   ```
   (Use your actual Render backend URL)

5. **Deploy**
   - Click **"Deploy"**
   - Wait 3-5 minutes for build
   - You'll get a URL like: `https://pixelflow.vercel.app`

6. **Update CORS in Backend**
   Go back to Render → Backend → Environment Variables
   Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://pixelflow.vercel.app,http://localhost:3000
   ```
   
   **Important**: After updating, Render will automatically redeploy!

### Step 3: Configure Custom Domain (Optional)

1. **In Vercel Dashboard**
   - Go to your project → **"Settings"** → **"Domains"**
   - Add your custom domain
   - Follow DNS configuration instructions

---

## Part 4: Post-Deployment Configuration

### 1. Update Backend CORS

Ensure backend allows your frontend domain:
```
CORS_ORIGINS=https://pixelflow.vercel.app
```

### 2. Test Full Application

1. **Test Frontend**
   - Visit your Vercel URL
   - Should load without errors

2. **Test Backend Connection**
   - Upload an image
   - Apply operations
   - Check browser console for errors

3. **Test Database**
   - Create a user account
   - Save a pipeline
   - Check data persists after browser refresh

### 3. Monitor Performance

**Render Monitoring:**
- Dashboard shows CPU, memory usage
- View logs in real-time
- Set up email alerts (Settings → Notifications)

**Vercel Analytics:**
- Built-in Web Vitals tracking
- Real-time visitor analytics
- Performance insights

---

## 🔍 Troubleshooting

### Backend Issues

**Problem**: 502 Bad Gateway
```
Solution: 
- Check Render logs for errors
- Verify environment variables
- Ensure database is running
- Check DATABASE_URL format
```

**Problem**: Database connection fails
```
Solution:
- Verify DATABASE_URL is correct
- Check External URL (not Internal)
- Ensure database is in same region
- Try manual psql connection
```

**Problem**: Cold starts too slow
```
Solution:
- Free tier limitation
- Consider paid plan ($7/month for always-on)
- Or use cron job to ping every 14 minutes
```

### Frontend Issues

**Problem**: API calls fail (CORS errors)
```
Solution:
- Check CORS_ORIGINS in backend
- Verify exact URL (https, no trailing slash)
- Check browser console for exact error
- Redeploy backend after CORS changes
```

**Problem**: Build fails
```
Solution:
- Check build logs in Vercel
- Verify all dependencies in package.json
- Test build locally: npm run build
- Check TypeScript errors
```

**Problem**: Environment variable not working
```
Solution:
- Must start with REACT_APP_
- Redeploy after adding env vars
- Check exact variable name
- Verify in build logs
```

---

## 🔄 Redeployment

### Update Backend
```bash
# 1. Make changes
# 2. Commit and push
git add .
git commit -m "Update backend"
git push origin main

# Render auto-deploys from main branch!
```

### Update Frontend
```bash
# 1. Make changes
# 2. Commit and push
git add .
git commit -m "Update frontend"
git push origin main

# Vercel auto-deploys from main branch!
```

### Manual Redeploy
- Render: Dashboard → Service → **"Manual Deploy"** → **"Deploy latest commit"**
- Vercel: Dashboard → Project → **"Deployments"** → **"Redeploy"**

---

## 💰 Cost Breakdown

### Free Tier Limits

**Render (Backend + Database):**
- Web Service: 750 hours/month
- PostgreSQL: 1GB storage, 90 days retention
- Limitations: Spins down after 15min inactivity

**Vercel (Frontend):**
- 100GB bandwidth/month
- Unlimited deployments
- 100 builds/day
- Custom domains included

**Total**: $0/month for small-medium usage!

### Paid Upgrades (if needed)

**Render:**
- Starter ($7/month): Always-on, 512MB RAM
- Standard ($25/month): 2GB RAM, better performance

**Vercel:**
- Pro ($20/month): 1TB bandwidth, priority support
- Usually not needed for personal projects

---

## 🔐 Security Checklist

Before going live:

- [x] Change SECRET_KEY to unique value
- [x] Set DEBUG=False
- [x] Verify CORS_ORIGINS is restrictive
- [x] Database uses strong password
- [x] Environment variables not in Git
- [x] HTTPS enabled (automatic on Vercel/Render)
- [ ] Enable rate limiting (add later)
- [ ] Set up monitoring/alerts
- [ ] Regular database backups

---

## 📚 Additional Resources

**Render Documentation:**
- https://render.com/docs
- https://render.com/docs/deploy-fastapi

**Vercel Documentation:**
- https://vercel.com/docs
- https://vercel.com/docs/frameworks/create-react-app

**PixelFlow Guides:**
- See `/guides` folder for detailed setup instructions
- `DATABASE_SETUP.md` - Database configuration
- `DEPLOYMENT.md` - General deployment info

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Logs**
   - Render: Dashboard → Logs tab
   - Vercel: Dashboard → Deployments → View Function Logs

2. **Common Issues**
   - Review troubleshooting section above
   - Check Render/Vercel status pages

3. **Community Support**
   - Render Discord: https://discord.gg/render
   - Vercel Discord: https://vercel.com/discord

---

## ✅ Deployment Checklist

Follow this checklist for successful deployment:

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] `.env` files not committed
- [ ] All dependencies listed
- [ ] Test locally works

### Database
- [ ] PostgreSQL created on Render
- [ ] Connection URL copied
- [ ] Tables initialized

### Backend
- [ ] Deployed to Render
- [ ] Environment variables set
- [ ] SECRET_KEY generated
- [ ] DATABASE_URL configured
- [ ] `/docs` endpoint accessible

### Frontend
- [ ] Deployed to Vercel
- [ ] REACT_APP_API_URL set
- [ ] CORS configured in backend
- [ ] Application loads correctly

### Testing
- [ ] Upload image works
- [ ] Processing works
- [ ] Results display correctly
- [ ] No console errors

### Post-Deployment
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backup strategy planned

---

## 🎉 Success!

Your PixelFlow application is now live and accessible worldwide!

**Next Steps:**
1. Share your app URL
2. Monitor usage and performance
3. Collect user feedback
4. Plan feature updates

Happy deploying! 🚀
