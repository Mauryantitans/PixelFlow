# Database Setup Guide

Complete guide for setting up and managing PixelFlow's database, including both SQLite and PostgreSQL.

---

## 📋 **Table of Contents**

- [Database Options](#database-options)
- [SQLite Setup (Default)](#sqlite-setup-default)
- [PostgreSQL Setup (Production)](#postgresql-setup-production)
- [Migrating from SQLite to PostgreSQL](#migrating-from-sqlite-to-postgresql)
- [Database Management Scripts](#database-management-scripts)
- [Database Schema](#database-schema)
- [Maintenance & Troubleshooting](#maintenance--troubleshooting)

---

## 🗄️ **Database Options**

PixelFlow supports two database backends:

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Setup Complexity** | ✅ Zero configuration | ⚠️ Requires installation |
| **Performance** | Good for < 100 users | ✅ Excellent at scale |
| **Concurrent Writes** | Limited | ✅ Unlimited |
| **Best For** | Development, Testing | Production, Cloud |
| **Backup** | ✅ Simple file copy | Requires pg_dump |
| **Cost** | ✅ Free, no server needed | Free, but needs server |

**Recommendation:**
- Use **SQLite** for local development and testing
- Use **PostgreSQL** for production deployments

---

## 🚀 **SQLite Setup (Default)**

### **Advantages**
- ✅ No installation required
- ✅ Works out of the box
- ✅ Perfect for development
- ✅ Single file database
- ✅ Easy backups (just copy the .db file)
- ✅ Zero maintenance

### **Quick Setup**

SQLite is **already configured** - no action needed!

```bash
cd backend

# Activate virtual environment
env\Scripts\activate  # Windows
source env/bin/activate  # Mac/Linux

# Initialize database (creates all tables)
python database/init_db.py

# Start backend server
python run.py
```

### **What Happens**
1. Creates `pixelflow.db` file in backend directory
2. Creates all required tables
3. Creates default admin user:
   - Email: `admin@pixelflow.local`
   - Password: `admin123`
4. Initializes system settings

### **Database Location**
```
backend/
└── pixelflow.db  ← Your SQLite database
```

### **Configuration (.env)**
```env
USE_SQLITE=True
DATABASE_URL=sqlite:///./pixelflow.db
```

### **When to Use SQLite**
- ✅ Local development
- ✅ Testing and prototyping
- ✅ Small deployments (< 100 users)
- ✅ Single server deployments
- ✅ Personal projects
- ✅ Demos and tutorials

---

## 🐘 **PostgreSQL Setup (Production)**

### **Advantages**
- ✅ Better performance at scale
- ✅ Supports unlimited concurrent writes
- ✅ Better for 100+ users
- ✅ Industry standard for production
- ✅ Advanced features (full-text search, JSON operations)
- ✅ Better backup/replication tools
- ✅ Scalable to millions of records

### **Installation**

#### **Windows**

**Option 1: Official Installer**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for postgres user
4. Default port: 5432
5. Include pgAdmin and command line tools

**Option 2: Chocolatey**
```bash
choco install postgresql
```

#### **macOS**

**Option 1: Homebrew** (Recommended)
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Option 2: Postgres.app**
- Download from: https://postgresapp.com/
- Drag to Applications
- Click "Initialize" to create default database

#### **Linux (Ubuntu/Debian)**

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot

# Check status
sudo systemctl status postgresql
```

#### **Linux (CentOS/RHEL/Fedora)**

```bash
# Install PostgreSQL
sudo dnf install postgresql-server postgresql-contrib

# Initialize database cluster
sudo postgresql-setup --initdb

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

### **PostgreSQL Configuration**

#### **Step 1: Create Database and User**

```bash
# Login as postgres superuser
# Windows:
psql -U postgres

# Mac/Linux:
sudo -u postgres psql
```

In PostgreSQL prompt:

```sql
-- Create database
CREATE DATABASE pixelflow;

-- Create user
CREATE USER pixelflow_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pixelflow TO pixelflow_user;

-- Grant schema privileges (PostgreSQL 15+)
\c pixelflow
GRANT ALL ON SCHEMA public TO pixelflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pixelflow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pixelflow_user;

-- Exit
\q
```

#### **Step 2: Configure PixelFlow Backend**

Edit `backend/.env`:

```env
# Switch to PostgreSQL
USE_SQLITE=False

# PostgreSQL connection string
DATABASE_URL=postgresql://pixelflow_user:your_secure_password_here@localhost:5432/pixelflow

# Connection format:
# postgresql://username:password@host:port/database
```

**Connection String Examples:**
```env
# Local development
DATABASE_URL=postgresql://pixelflow_user:securepass123@localhost:5432/pixelflow

# Remote server
DATABASE_URL=postgresql://pixelflow_user:pass@192.168.1.100:5432/pixelflow

# Cloud (AWS RDS)
DATABASE_URL=postgresql://admin:pass@pixelflow.c9akciq32.us-east-1.rds.amazonaws.com:5432/pixelflow

# Cloud (Azure)
DATABASE_URL=postgresql://admin@server:pass@pixelflow.postgres.database.azure.com:5432/pixelflow

# Cloud (Google Cloud SQL)
DATABASE_URL=postgresql://root:pass@/pixelflow?host=/cloudsql/project:region:instance
```

#### **Step 3: Initialize Database**

```bash
cd backend

# Activate virtual environment
env\Scripts\activate  # Windows
source env/bin/activate  # Mac/Linux

# Initialize database (creates all tables in PostgreSQL)
python database/init_db.py
```

You should see:
```
✅ Database initialized successfully
✅ Admin user created: admin@pixelflow.local
✅ System settings initialized
```

#### **Step 4: Verify Setup**

```bash
# Test connection
psql -U pixelflow_user -d pixelflow

# In psql:
\dt  # List tables (should show: users, sessions, uploaded_images, etc.)
\q   # Exit
```

#### **Step 5: Start Backend**

```bash
python run.py
```

**PostgreSQL is now running!**

---

### **PostgreSQL Security Best Practices**

#### **1. Strong Passwords**
```bash
# Generate secure password
openssl rand -base64 32
```

#### **2. Limit Network Access**

Edit `postgresql.conf`:
```conf
# Only listen on localhost for local deployments
listen_addresses = 'localhost'

# For remote access (production only)
listen_addresses = '*'  # Then configure pg_hba.conf properly
```

Edit `pg_hba.conf`:
```conf
# Local connections
local   all             all                                     peer

# Allow password auth from localhost
host    pixelflow       pixelflow_user  127.0.0.1/32           md5

# For remote access (use with caution!)
host    pixelflow       pixelflow_user  0.0.0.0/0              md5
```

#### **3. Regular Backups**
```bash
# Automated daily backups
crontab -e

# Add this line (backup at 2 AM daily):
0 2 * * * cd /path/to/backend && python database/backup_database.py
```

#### **4. SSL Connections (Production)**

In `.env`:
```env
DATABASE_URL=postgresql://user:pass@host:5432/pixelflow?sslmode=require
```

---

## 🔄 **Migrating from SQLite to PostgreSQL**

Already have data in SQLite? Transfer it to PostgreSQL!

### **Prerequisites**
1. ✅ PostgreSQL installed and running
2. ✅ PostgreSQL database created (pixelflow)
3. ✅ User with permissions created (pixelflow_user)
4. ✅ `.env` configured with PostgreSQL URL

### **Migration Steps**

#### **Step 1: Backup SQLite Data**

```bash
cd backend

# Create backup
copy pixelflow.db pixelflow_backup.db  # Windows
cp pixelflow.db pixelflow_backup.db    # Mac/Linux
```

#### **Step 2: Configure PostgreSQL Connection**

Edit `backend/.env`:
```env
# Set this to False
USE_SQLITE=False

# Set your PostgreSQL connection
DATABASE_URL=postgresql://pixelflow_user:password@localhost:5432/pixelflow
```

#### **Step 3: Run Migration Script**

```bash
python database/migrate_to_postgres.py
```

**What gets migrated:**
- ✅ All users with passwords and OAuth data
- ✅ All saved pipelines
- ✅ Processing history
- ✅ API keys
- ✅ System settings
- ✅ Login attempts
- ✅ Session data
- ✅ Image metadata

**Migration Output:**
```
🔄 MIGRATING DATA: SQLite → PostgreSQL

📦 Creating PostgreSQL tables...
✅ Tables created!

👥 Migrating users...
   Found 15 users
   ✓ Migrated: admin@pixelflow.local
   ✓ Migrated: john@example.com
   ...
✅ Users migrated!

🔧 Migrating saved pipelines...
   Found 42 pipelines
   ✓ Migrated: My Favorite Pipeline
   ...
✅ Pipelines migrated!

📊 Migrating processing history...
✅ Processing history migrated! (127 records)

🔑 Migrating API keys...
✅ API keys migrated! (3 keys)

🎉 MIGRATION COMPLETE!

Summary:
   • Users: 15
   • Pipelines: 42
   • Processing History: 127
   • API Keys: 3
```

#### **Step 4: Verify Migration**

```bash
# List users in PostgreSQL
python database/list_users.py

# Test the application
python run.py
# Open http://localhost:3000 and verify everything works
```

#### **Step 5: Clean Up (After Verification)**

```bash
# Keep SQLite as backup for 30 days
# Then optionally delete:
# del pixelflow.db  # Windows
# rm pixelflow.db   # Mac/Linux
```

---

## 🛠️ **Database Management Scripts**

All database scripts are in the `backend/database/` folder. See [database/README.md](../backend/database/README.md) for complete documentation.

### **Quick Reference**

#### **Initialize Database**
```bash
python database/init_db.py
```
Creates fresh database with all tables and default admin user.

#### **List Users**
```bash
python database/list_users.py
```
Shows all registered users with details.

#### **Reset Password**
```bash
python database/reset_password.py
```
Interactive password reset for any user.

#### **Backup Database**
```bash
python database/backup_database.py
```
Creates timestamped backup in `backend/backups/`.

#### **Restore Database**
```bash
python database/restore_database.py
```
Restores from backup file.

#### **Cleanup Old Data**
```bash
python database/cleanup_database.py
```
Removes expired sessions, old images, and orphaned data.

#### **Migrate to PostgreSQL**
```bash
python database/migrate_to_postgres.py
```
Transfers all data from SQLite to PostgreSQL.

#### **Verify Data Integrity**
```bash
python database/verify_business_rules.py
```
Checks database for issues and violations.

#### **Debug Tools**
```bash
python database/debug_images.py      # Debug image storage
python database/debug_pipelines.py   # Debug pipeline data
```

**For detailed documentation of each script, see:** [database/README.md](../backend/database/README.md)

---

## 📊 **Database Schema**

### **Main Tables**

#### **users**
Stores user accounts and authentication data.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    hashed_password VARCHAR,  -- NULL for OAuth users
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    oauth_provider VARCHAR,  -- 'google', 'github', etc.
    oauth_id VARCHAR,
    profile_picture VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **sessions**
Tracks active user sessions.

```sql
CREATE TABLE sessions (
    id VARCHAR PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ip_address VARCHAR,
    user_agent VARCHAR,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### **uploaded_images**
Stores uploaded images as binary data.

```sql
CREATE TABLE uploaded_images (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR REFERENCES sessions(id),
    user_id INTEGER REFERENCES users(id),
    filename VARCHAR NOT NULL,
    image_data BYTEA,  -- Binary image data
    thumbnail_data BYTEA,
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    format VARCHAR,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **processed_images**
Stores processed results.

```sql
CREATE TABLE processed_images (
    id SERIAL PRIMARY KEY,
    original_image_id INTEGER REFERENCES uploaded_images(id),
    session_id VARCHAR REFERENCES sessions(id),
    image_data BYTEA,
    pipeline_data JSONB,  -- Pipeline configuration
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **saved_pipelines**
User's saved image processing pipelines.

```sql
CREATE TABLE saved_pipelines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR NOT NULL,
    description TEXT,
    pipeline_data JSONB,  -- Array of operations
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    category VARCHAR,
    tags VARCHAR[],
    thumbnail_data BYTEA,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **system_settings**
Admin-configurable settings.

```sql
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    guest_storage_quota_mb INTEGER DEFAULT 50,
    free_user_storage_quota_mb INTEGER DEFAULT 500,
    free_user_max_pipelines INTEGER DEFAULT 20,
    guest_max_images_per_session INTEGER DEFAULT 10,
    session_cleanup_enabled BOOLEAN DEFAULT TRUE,
    session_retention_hours INTEGER DEFAULT 24,
    image_retention_days INTEGER DEFAULT 7,
    admin_pin_hash VARCHAR,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **login_attempts**
Track failed login attempts for security.

```sql
CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL,
    ip_address VARCHAR,
    success BOOLEAN,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 **Database Maintenance**

### **Regular Tasks**

#### **Daily**
- ✅ Automated backups
```bash
# Add to cron/Task Scheduler
python database/backup_database.py
```

#### **Weekly**
- ✅ Clean old data
```bash
python database/cleanup_database.py
```

#### **Monthly**
- ✅ Verify data integrity
```bash
python database/verify_business_rules.py
```
- ✅ Test backup restoration
- ✅ Review database size and performance

---

### **Monitoring Database Size**

**SQLite:**
```bash
# Windows
dir pixelflow.db

# Mac/Linux
ls -lh pixelflow.db
```

**PostgreSQL:**
```sql
-- Connect to database
psql -U pixelflow_user -d pixelflow

-- Check database size
SELECT pg_size_pretty(pg_database_size('pixelflow'));

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

---

### **Performance Optimization**

#### **Add Indexes**

```sql
-- Frequently queried columns
CREATE INDEX idx_images_user_id ON uploaded_images(user_id);
CREATE INDEX idx_images_session_id ON uploaded_images(session_id);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);
CREATE INDEX idx_pipelines_user_id ON saved_pipelines(user_id);
CREATE INDEX idx_pipelines_public ON saved_pipelines(is_public);
```

#### **Connection Pooling (PostgreSQL)**

Edit `backend/app/core/database.py`:

```python
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,           # Max open connections
    max_overflow=10,        # Extra connections when needed
    pool_pre_ping=True,     # Verify connections before use
    pool_recycle=3600,      # Recycle connections every hour
    echo=False              # Set True for query debugging
)
```

---

## ⚠️ **Troubleshooting**

### **SQLite Issues**

**Problem: "Database is locked"**
```bash
# Another process is using the database
# Stop backend server and try again
# Or switch to PostgreSQL for better concurrency
```

**Problem: "OperationalError: unable to open database file"**
```bash
# Check file permissions
# Recreate database
python database/init_db.py
```

### **PostgreSQL Issues**

**Problem: "Connection refused"**
```bash
# Check PostgreSQL is running
# Windows: services.msc (look for postgresql)
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Start PostgreSQL if stopped:
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

**Problem: "password authentication failed"**
```bash
# Check credentials in .env match PostgreSQL
# Reset password:
sudo -u postgres psql
ALTER USER pixelflow_user WITH PASSWORD 'new_password';
\q

# Update .env with new password
```

**Problem: "database does not exist"**
```bash
# Create database:
sudo -u postgres psql
CREATE DATABASE pixelflow;
GRANT ALL PRIVILEGES ON DATABASE pixelflow TO pixelflow_user;
\q
```

**Problem: "permission denied for schema public"**
```sql
-- PostgreSQL 15+ requires explicit schema permissions
\c pixelflow
GRANT ALL ON SCHEMA public TO pixelflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pixelflow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pixelflow_user;
```

**Problem: "Could not connect to server"**
```bash
# Check PostgreSQL is listening
netstat -an | grep 5432  # Linux/Mac
netstat -an | findstr 5432  # Windows

# Edit postgresql.conf if needed:
listen_addresses = 'localhost'  # Or '*' for all interfaces
```

---

## 📚 **Related Documentation**

- **[database/README.md](../backend/database/README.md)** - Complete database scripts documentation
- **[INSTALLATION.md](../INSTALLATION.md)** - Initial setup guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment with database
- **[ADMIN_PANEL.md](ADMIN_PANEL.md)** - Manage database via UI
- **[API_REFERENCE.md](API_REFERENCE.md)** - Database API endpoints

---

## 🎓 **Best Practices**

### **Development**
- ✅ Use SQLite for local development
- ✅ Keep development database small
- ✅ Test migrations before production
- ✅ Use different databases for dev/test/prod

### **Production**
- ✅ Use PostgreSQL for production
- ✅ Enable automated backups
- ✅ Monitor database size and performance
- ✅ Set up proper retention policies
- ✅ Use SSL for database connections
- ✅ Implement proper access controls
- ✅ Regular security audits

### **Security**
- ✅ Change default admin password immediately
- ✅ Use strong passwords for database users
- ✅ Never commit .env to version control
- ✅ Limit database network access
- ✅ Enable SSL for remote connections
- ✅ Regular password rotation
- ✅ Monitor failed login attempts

---

**Your database is the heart of PixelFlow - keep it healthy! 💚**
