# 📁 Deployment Folder

This folder contains everything you need to deploy PixelFlow to production using free hosting services.

---

## 🌟 START HERE: New to Deployment?

**👉 Open `START_HERE.md`** - Complete overview and quickstart guide!

This file explains everything in this folder and tells you exactly what to do next.

---

## 📄 Files in This Folder

### 0. 🌟 **START_HERE.md** ⭐ READ THIS FIRST!
**Complete overview of deployment process**

Explains everything in this folder and provides:
- What's been prepared for you
- Step-by-step action plan
- All available guides and when to use them
- Troubleshooting tips

**Start here if**: This is your first time deploying

### 1. 🚀 **QUICK_START.md**
**The fastest way to deploy PixelFlow**

Step-by-step checklist with exact commands. Perfect for:
- First-time deployment
- Following a proven process
- Quick reference during deployment

**Time to deploy**: ~45 minutes
**Use this when**: You're ready to deploy and want clear steps

### 2. 📖 **DEPLOYMENT_GUIDE.md**
**Complete deployment documentation**

Comprehensive guide covering:
- Detailed explanations of each step
- Architecture overview
- Troubleshooting common issues
- Monitoring and maintenance
- Cost breakdown
- Security best practices

**Use this if**: You want to understand what you're doing or need help troubleshooting

### 3. ⚙️ **ENVIRONMENT_VARIABLES.md**
**All environment variables explained**

Complete reference for:
- Backend environment variables (Render)
- Frontend environment variables (Vercel)
- Local development setup
- Security best practices
- Troubleshooting env var issues

**Use this when**: Setting up environment variables or debugging configuration issues

### 4. ✅ **PRODUCTION_CHECKLIST.md**
**Production readiness verification**

Comprehensive checklist covering:
- Security requirements
- Performance optimization
- Testing procedures
- Documentation review
- Legal/compliance considerations
- Maintenance planning

**Use this before**: Going live to ensure nothing is missed

### 5. 🔧 **render.yaml**
**Render.com configuration file**

Infrastructure-as-code for Render deployment:
- Web service configuration
- Database setup
- Environment structure

**How to use**: Copy to project root when using Render's "render.yaml" deployment method (optional)

### 6. 🌐 **vercel.json**
**Vercel configuration file**

Frontend deployment configuration:
- Build settings
- Routing rules
- Security headers
- Cache policies

**How to use**: Copy to `frontend/` folder before deploying to Vercel

### 7. 🛠️ **prepare-for-deployment.ps1**
**Automated pre-deployment checks and setup**

PowerShell script that:
- Verifies all required files exist
- Checks Git repository status
- Generates production SECRET_KEY
- Copies configuration files to correct locations
- Validates project structure
- Identifies any issues before deployment

**How to run**:
```powershell
cd deployment
.\prepare-for-deployment.ps1
```

**Run this FIRST** before deploying!

### 8. 🌐 **ALTERNATIVE_HOSTING_OPTIONS.md**
**Other free hosting platforms**

Comprehensive guide to alternatives beyond Vercel + Render:
- Railway + Vercel
- Fly.io + Vercel
- Netlify + Render
- Cloudflare Pages + Render
- And more!

**Use this if**: You want to explore other free hosting options

### 9. 📊 **DEPLOYMENT_SUMMARY.md**
**High-level deployment overview**

Quick reference document explaining:
- Architecture overview
- Service breakdown
- Cost analysis
- Deployment strategy

**Use this when**: You want to understand the deployment architecture

---

## 🎯 Quick Deployment Path

### For First-Time Deployment:

1. **Run Readiness Check** (2 minutes)
   ```powershell
   cd deployment
   .\check-deployment-readiness.ps1
   ```

2. **Follow Quick Start** (45 minutes)
   - Open `QUICK_START.md`
   - Follow step-by-step checklist
   - Copy configuration files as instructed

3. **Verify with Production Checklist** (15 minutes)
   - Open `PRODUCTION_CHECKLIST.md`
   - Check critical items
   - Mark items as complete

4. **Deploy!** 🚀

### If You Encounter Issues:

1. Check `DEPLOYMENT_GUIDE.md` → Troubleshooting section
2. Review `ENVIRONMENT_VARIABLES.md` for configuration help
3. Verify all items in `PRODUCTION_CHECKLIST.md`

---

## 📋 Deployment Overview

### Services Used (All Free Tiers)

**Vercel** - Frontend Hosting
- React application
- Global CDN
- Automatic HTTPS
- Domain: `https://your-app.vercel.app`

**Render** - Backend Hosting  
- FastAPI application
- Automatic HTTPS
- Free PostgreSQL database
- Domain: `https://your-backend.onrender.com`

### Total Monthly Cost: $0

*Note: Free tiers have limitations (bandwidth, runtime hours, cold starts). See `DEPLOYMENT_GUIDE.md` for details.*

---

## 🔗 Useful Links

### Documentation
- [Render Docs](https://render.com/docs) - Backend hosting documentation
- [Vercel Docs](https://vercel.com/docs) - Frontend hosting documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/) - Backend framework
- [React Docs](https://react.dev/) - Frontend framework

### Dashboards (After Sign Up)
- [Render Dashboard](https://dashboard.render.com) - Manage backend/database
- [Vercel Dashboard](https://vercel.com/dashboard) - Manage frontend

### Sign Up
- [Render Sign Up](https://dashboard.render.com/register) - Free account
- [Vercel Sign Up](https://vercel.com/signup) - Free account

---

## ⚡ Quick Commands Reference

### Generate SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Test Backend Locally
```bash
cd backend
python run.py
# Visit: http://localhost:8000/docs
```

### Test Frontend Locally
```bash
cd frontend
npm start
# Visit: http://localhost:3000
```

### Initialize Database (After Backend Deployment)
```bash
# In Render Shell tab:
python database/init_db.py
```

### Commit and Push Changes
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## 🚨 Important Notes

### Security
- **NEVER** commit `.env` files to Git
- **ALWAYS** generate new SECRET_KEY for production
- **ALWAYS** use strong database passwords
- **VERIFY** CORS settings match your domains

### Free Tier Limitations
**Render Free Tier:**
- Spins down after 15 minutes of inactivity
- First request after spin-down: ~30 seconds (cold start)
- 750 hours/month runtime
- 512 MB RAM

**Solutions:**
- Acceptable for personal/demo projects
- Use cron job to keep warm (see guide)
- Upgrade to paid plan ($7/month) for always-on

**Vercel Free Tier:**
- Generally no issues for personal projects
- 100 GB bandwidth/month is generous
- No cold starts on frontend

---

## 📝 Deployment Checklist Summary

### Phase 1: Preparation (5 min)
- [ ] Run `check-deployment-readiness.ps1`
- [ ] Commit all changes to Git
- [ ] Create Render and Vercel accounts

### Phase 2: Database (10 min)
- [ ] Create PostgreSQL on Render
- [ ] Copy database URL

### Phase 3: Backend (15 min)
- [ ] Deploy to Render
- [ ] Configure environment variables
- [ ] Initialize database
- [ ] Test `/docs` endpoint

### Phase 4: Frontend (10 min)
- [ ] Copy `vercel.json` to `frontend/`
- [ ] Deploy to Vercel
- [ ] Configure environment variables

### Phase 5: Connect (5 min)
- [ ] Update CORS in backend
- [ ] Test full application

### Phase 6: Verify (10 min)
- [ ] Test image upload
- [ ] Test processing
- [ ] Check database persistence
- [ ] Review production checklist

**Total Time**: ~55 minutes for first deployment

---

## 💡 Tips for Success

1. **Follow the Quick Start First**
   - Don't skip steps
   - Check off items as you complete them
   - Save URLs as you get them

2. **Keep Track of URLs**
   - Backend URL from Render
   - Frontend URL from Vercel
   - Database URL from Render
   - You'll need these for configuration

3. **Save Your SECRET_KEY**
   - Generate once
   - Save securely
   - Never commit to Git
   - Use in Render environment variables only

4. **Test Thoroughly**
   - Test each service individually
   - Test integration between services
   - Test from different devices/networks
   - Check browser console for errors

5. **Monitor After Deployment**
   - Check logs regularly first day
   - Set up email alerts
   - Review error logs
   - Monitor performance metrics

---

## 🆘 Need Help?

### Troubleshooting Steps
1. Check `DEPLOYMENT_GUIDE.md` → Troubleshooting section
2. Review `ENVIRONMENT_VARIABLES.md` for config issues
3. Check Render/Vercel logs for errors
4. Verify all environment variables are correct
5. Test backend `/docs` endpoint directly
6. Check CORS configuration

### Common Issues & Solutions

**CORS Error:**
- Verify CORS_ORIGINS matches exact Vercel URL
- Include `https://` and no trailing slash
- Redeploy backend after CORS changes

**Database Connection Error:**
- Check DATABASE_URL is correct
- Use External URL (not Internal)
- Verify database is running
- Test connection with psql

**Backend 502 Error:**
- Check Render logs for Python errors
- Verify all dependencies installed
- Check environment variables set
- Wait for cold start completion

**Images Not Persisting:**
- Check DATABASE_URL configured (images are always stored in the database)
- Ensure database initialized
- Review backend logs

---

## 📚 Additional Resources

See main project guides in `/guides` folder:
- `GETTING_STARTED.md` - Local development setup
- `DATABASE_SETUP.md` - Database configuration details
- `API_REFERENCE.md` - Complete API documentation

---

## ✨ Success Criteria

You know deployment is successful when:
- ✅ Frontend loads without errors
- ✅ Backend `/docs` is accessible
- ✅ Images upload successfully
- ✅ Processing works correctly
- ✅ Results display properly
- ✅ Data persists after page refresh
- ✅ No console errors in browser

**Congratulations! Your PixelFlow application is now live! 🎉**

---

*Last updated: October 2025*
