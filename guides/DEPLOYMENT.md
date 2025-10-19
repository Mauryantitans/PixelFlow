# Deployment Guide

Deploy PixelFlow to production environments.

---

## 🎯 **Deployment Options**

PixelFlow can be deployed to:

1. **VPS/Cloud Server** (DigitalOcean, AWS EC2, Google Cloud, Azure)
2. **Platform as a Service** (Render, Railway, Fly.io)
3. **Container Platform** (Docker, Kubernetes)
4. **Serverless** (AWS Lambda + S3)

---

## 🚀 **Quick Deploy: Render.com (Easiest)**

Render offers free tier and easy deployment.

### **Step 1: Prepare Repository**

Ensure you have:
- ✅ `render.yaml` (already included)
- ✅ `requirements.txt` (already included)
- ✅ `.env.example` files

### **Step 2: Create Render Account**

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### **Step 3: Deploy**

1. Click **"New +"** → **"Blueprint"**
2. Select your PixelFlow repository
3. Render reads `render.yaml` automatically
4. It creates:
   - PostgreSQL database
   - Backend web service
   - Frontend static site

5. **Set environment variables** in Render dashboard:
   ```
   SECRET_KEY=<generate with command>
   GOOGLE_CLIENT_ID=<your production client id>
   GOOGLE_CLIENT_SECRET=<your production secret>
   ```

6. Click **"Apply"**
7. Wait 5-10 minutes for deployment

### **Step 4: Configure OAuth**

Update Google OAuth settings with production URLs:
```
https://pixelflow.onrender.com
https://api-pixelflow.onrender.com/api/auth/google/callback
```

**Done!** Your app is live at `https://pixelflow.onrender.com`

---

## 🐳 **Deploy with Docker**

### **Step 1: Build Images**

```bash
# Build backend
cd backend
docker build -t pixelflow-backend .

# Build frontend
cd ../frontend
docker build -t pixelflow-frontend .
```

### **Step 2: Run with Docker Compose**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pixelflow
      POSTGRES_USER: pixelflow_user
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    image: pixelflow-backend
    environment:
      DATABASE_URL: postgresql://pixelflow_user:secure_password_here@postgres:5432/pixelflow
      SECRET_KEY: your_secret_key_here
      USE_SQLITE: "False"
    depends_on:
      - postgres
    ports:
      - "8000:8000"

  frontend:
    image: pixelflow-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Start everything:
```bash
docker-compose up -d
```

---

## ☁️ **Deploy to AWS**

### **Architecture**

```
Route53 → CloudFront → S3 (Frontend)
              ↓
         ALB → ECS (Backend) → RDS PostgreSQL
```

### **Quick Setup**

1. **Frontend**: Deploy to S3 + CloudFront
2. **Backend**: Deploy to Elastic Beanstalk or ECS
3. **Database**: Use RDS PostgreSQL
4. **Storage**: Use S3 for image storage (optional)

**Detailed AWS guide**: See AWS deployment documentation.

---

## 🔐 **Production Checklist**

### **Security**

- [ ] Generate new SECRET_KEY (not the dev one!)
- [ ] Set `DEBUG=False` in .env
- [ ] Use PostgreSQL (not SQLite)
- [ ] Enable HTTPS/SSL
- [ ] Set up CORS for production domain only
- [ ] Rotate credentials regularly
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerts

### **Performance**

- [ ] Enable database connection pooling
- [ ] Set up Redis for caching (optional)
- [ ] Use CDN for static files
- [ ] Optimize image storage
- [ ] Set up database backups
- [ ] Configure auto-scaling

### **Monitoring**

- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Database performance monitoring
- [ ] Set up alerts for quota usage

---

## 🔧 **Environment Variables for Production**

### **Backend (.env)**

```env
# Application
APP_NAME=PixelFlow
VERSION=1.0.0
DEBUG=False  # CRITICAL!
HOST=0.0.0.0
PORT=8000

# Security
SECRET_KEY=GENERATE_NEW_PRODUCTION_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database (Production PostgreSQL)
USE_SQLITE=False
DATABASE_URL=postgresql://user:password@host:5432/pixelflow

# CORS (Your production domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# OAuth (Production credentials)
GOOGLE_CLIENT_ID=production_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-production_secret

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=app_password_here
```

### **Frontend (.env.production)**

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_CLIENT_ID=production_client_id.apps.googleusercontent.com
```

---

## 📊 **Scaling Guidelines**

### **Small Scale (< 100 users)**
- **Database**: SQLite or small PostgreSQL instance
- **Backend**: Single server (1-2 CPU, 2GB RAM)
- **Frontend**: Static hosting (S3, Netlify)
- **Cost**: ~$10-20/month

### **Medium Scale (100-1000 users)**
- **Database**: PostgreSQL with backups
- **Backend**: 2-4 servers behind load balancer
- **Frontend**: CDN + static hosting
- **Storage**: Separate file storage (S3)
- **Cost**: ~$50-100/month

### **Large Scale (1000+ users)**
- **Database**: PostgreSQL with read replicas
- **Backend**: Auto-scaling cluster (4+ servers)
- **Frontend**: Global CDN
- **Storage**: S3 with CloudFront
- **Caching**: Redis for sessions
- **Cost**: ~$200-500/month

---

## 🔧 **Optimization Tips**

### **Database Optimization**

```sql
-- Add indexes
CREATE INDEX idx_images_user_id ON uploaded_images(user_id);
CREATE INDEX idx_images_session_id ON uploaded_images(session_id);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);

-- Analyze tables
ANALYZE;
```

### **Backend Optimization**

```python
# Use connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

# Enable gzip compression
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### **Frontend Optimization**

```bash
# Build optimized production bundle
npm run build

# Serve with compression
# Use nginx or CDN with gzip enabled
```

---

## 🗄️ **Production Database Setup**

### **PostgreSQL for Production**

Always use PostgreSQL for production (not SQLite).

**Setup Steps:**

1. **Install PostgreSQL** on your server:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Start service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Create database and user**:
   ```bash
   sudo -u postgres psql
   
   CREATE DATABASE pixelflow;
   CREATE USER pixelflow_user WITH PASSWORD 'secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE pixelflow TO pixelflow_user;
   
   \c pixelflow
   GRANT ALL ON SCHEMA public TO pixelflow_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pixelflow_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pixelflow_user;
   \q
   ```

3. **Configure backend .env**:
   ```env
   USE_SQLITE=False
   DATABASE_URL=postgresql://pixelflow_user:secure_password_here@localhost:5432/pixelflow
   ```

4. **Initialize database**:
   ```bash
   cd backend
   python database/init_db.py
   ```

5. **Verify setup**:
   ```bash
   python database/list_users.py
   # Should show default admin user
   ```

### **Automated Backups**

Set up daily automated backups:

```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/backend && python database/backup_database.py

# Keep backups organized
0 3 * * 0 cd /path/to/backend/backups && find . -name "*.db" -mtime +30 -delete
```

### **Database Maintenance**

Schedule regular maintenance:

```bash
# Weekly cleanup (Sunday 3 AM)
0 3 * * 0 cd /path/to/backend && python database/cleanup_database.py

# Monthly verification (1st of month, 4 AM)
0 4 1 * * cd /path/to/backend && python database/verify_business_rules.py
```

**See [DATABASE_SETUP.md](DATABASE_SETUP.md) for complete PostgreSQL documentation.**

---

## 🔒 **SSL/HTTPS Setup**

### **Option 1: Cloudflare (Free)**

1. Point domain to Cloudflare
2. Enable "Full (strict)" SSL
3. Cloudflare handles SSL automatically

### **Option 2: Let's Encrypt (Free)**

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### **Option 3: Load Balancer SSL**

Most cloud platforms (AWS ALB, GCP Load Balancer) handle SSL automatically.

---

## 💾 **Backup Strategy**

### **Database Backups**

**Daily backups:**
```bash
# Cron job (runs at 2 AM daily)
0 2 * * * /usr/bin/python /path/to/backend/backup_database.py
```

**Keep:**
- Daily backups: Last 7 days
- Weekly backups: Last 4 weeks
- Monthly backups: Last 12 months

### **Image Storage Backups**

If using S3:
- Enable versioning
- Set up lifecycle policies
- Use S3 replication for critical data

---

## 📈 **Post-Deployment**

### **Health Checks**

Monitor these endpoints:
```bash
# Backend health
curl https://api.yourdomain.com/health

# Should return:
{"status":"healthy",...}
```

### **Set Up Monitoring**

**Option 1: UptimeRobot (Free)**
- Monitor `/health` endpoint
- Get alerts if site goes down

**Option 2: Better Uptime**
- More detailed monitoring
- Performance metrics

**Option 3: Sentry**
- Error tracking
- Performance monitoring
- User feedback

---

## 🆘 **Rollback Procedure**

If deployment breaks:

### **Quick Rollback**

**Render/Railway:**
1. Go to deployment dashboard
2. Click "Rollback" to previous version
3. Confirm

**Docker:**
```bash
docker-compose down
docker pull pixelflow-backend:previous-version
docker-compose up -d
```

**Manual:**
```bash
git checkout previous-working-commit
# Rebuild and redeploy
```

---

## ✅ **Go-Live Checklist**

### **Before Launch**

- [ ] All tests passing
- [ ] Security audit complete
- [ ] Database backed up
- [ ] SSL certificate installed
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Domain DNS configured
- [ ] Email notifications working
- [ ] Admin accounts created
- [ ] Documentation updated

### **Launch Day**

- [ ] Deploy during low-traffic time
- [ ] Monitor error logs closely
- [ ] Test all critical features
- [ ] Have rollback plan ready
- [ ] Announce to users

### **Post-Launch (First Week)**

- [ ] Monitor daily
- [ ] Fix any critical bugs immediately
- [ ] Collect user feedback
- [ ] Optimize based on real usage
- [ ] Scale resources if needed

---

## 📚 **Additional Resources**

- [Render Deployment Docs](https://render.com/docs)
- [AWS Deployment Best Practices](https://aws.amazon.com/blogs/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Deploy with confidence! PixelFlow is production-ready! 🚀**
