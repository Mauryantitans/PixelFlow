# Database Management Scripts

This folder contains all database-related utilities for PixelFlow. Each script serves a specific purpose in database setup, maintenance, and administration.

---

## 📋 **Quick Reference**

| Script | Purpose | When to Use | Required |
|--------|---------|-------------|----------|
| `init_db.py` | Initialize fresh database | First time setup | ✅ Essential |
| `migrate_to_postgres.py` | SQLite → PostgreSQL migration | Moving to production | Optional |
| `backup_database.py` | Create database backup | Before major changes | Recommended |
| `restore_database.py` | Restore from backup | After data loss | As needed |
| `cleanup_database.py` | Remove old/orphaned data | Maintenance | Optional |
| `list_users.py` | View all users | User management | Utility |
| `reset_password.py` | Reset user password | Forgot password | Utility |
| `verify_business_rules.py` | Check data integrity | Debugging | Utility |

---

## 🚀 **Getting Started**

### **First Time Setup**

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
env\Scripts\activate
# Mac/Linux:
source env/bin/activate

# Initialize database (creates all tables)
python database/init_db.py
```

This creates a fresh database with:
- ✅ All required tables
- ✅ Default admin user
- ✅ System settings
- ✅ Proper indexes and constraints

---

## 📖 **Script Documentation**

### **1. init_db.py** - Initialize Database
**Purpose:** Create a fresh database with complete schema and default data

**What it does:**
- Creates all database tables from SQLAlchemy models
- Adds default admin user (email: admin@pixelflow.local, password: admin123)
- Initializes system settings with default values
- Sets up indexes and constraints

**When to use:**
- ✅ First time setup
- ✅ After deleting database file
- ✅ Setting up development environment
- ✅ Creating test databases

**Usage:**
```bash
python database/init_db.py
```

**Database Support:**
- ✅ SQLite (default) - File-based database
- ✅ PostgreSQL - Production-ready database

**Important Notes:**
- ⚠️ Will create tables if they don't exist
- ⚠️ Won't overwrite existing data
- ⚠️ Change default admin password immediately after first login!

---

### **2. migrate_to_postgres.py** - Migrate to PostgreSQL
**Purpose:** Transfer all data from SQLite to PostgreSQL

**What it does:**
- Reads all data from SQLite database
- Creates tables in PostgreSQL
- Copies all users, pipelines, and history
- Preserves relationships and IDs
- Maintains data integrity

**When to use:**
- ✅ Moving from development to production
- ✅ Scaling beyond SQLite capabilities
- ✅ Need better concurrency support
- ✅ Deploying to cloud services

**Prerequisites:**
1. PostgreSQL server installed and running
2. PostgreSQL database created
3. `.env` configured with PostgreSQL connection string

**Configuration (in .env):**
```env
# Set this to False
USE_SQLITE=False

# Set your PostgreSQL connection
DATABASE_URL=postgresql://user:password@localhost:5432/pixelflow
```

**Usage:**
```bash
# Configure .env first!
python database/migrate_to_postgres.py
```

**What gets migrated:**
- ✅ All users with authentication data
- ✅ All saved pipelines
- ✅ Processing history
- ✅ API keys
- ✅ System settings
- ✅ Login attempts
- ✅ Image metadata (if using database storage)

**Safety:**
- ✅ Original SQLite file remains untouched
- ✅ Can be used as backup after migration
- ✅ Prompts for confirmation before starting
- ✅ Shows progress during migration

**After Migration:**
1. Test the application with PostgreSQL
2. Verify all data is present
3. Keep SQLite file as backup for 30 days
4. Update deployment configuration

---

### **3. backup_database.py** - Create Backup
**Purpose:** Create timestamped backup of database

**What it does:**
- Creates complete backup of current database
- Saves with timestamp: `pixelflow_backup_YYYYMMDD_HHMMSS.db`
- Stores in `backups/` directory
- Works with both SQLite and PostgreSQL

**When to use:**
- ✅ Before major updates
- ✅ Before schema changes
- ✅ Before bulk data operations
- ✅ Regular scheduled backups (daily/weekly)

**Usage:**
```bash
# Create backup
python database/backup_database.py
```

**Backup Location:**
```
backend/backups/
└── pixelflow_backup_20250110_143022.db
```

**PostgreSQL Backups:**
For PostgreSQL, this script uses `pg_dump`:
```bash
# Ensure pg_dump is in your PATH
# Script will create: pixelflow_backup_YYYYMMDD_HHMMSS.sql
```

**Best Practices:**
- 📅 Create backups before major changes
- 📅 Schedule daily backups for production
- 📅 Keep backups for at least 30 days
- 📅 Test restore process regularly
- 📅 Store backups off-server for production

**Automation (Linux/Mac):**
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * cd /path/to/backend && python database/backup_database.py
```

**Automation (Windows):**
Use Task Scheduler to run the script daily.

---

### **4. restore_database.py** - Restore Backup
**Purpose:** Restore database from backup file

**What it does:**
- Lists available backup files
- Restores selected backup
- Creates safety backup of current database first
- Verifies restored data integrity

**When to use:**
- ✅ After accidental data deletion
- ✅ After failed migration
- ✅ After corruption
- ✅ Rolling back to previous state

**Usage:**
```bash
python database/restore_database.py
```

**Interactive Process:**
```
Available backups:
1. pixelflow_backup_20250110_143022.db (2 hours ago)
2. pixelflow_backup_20250109_143022.db (1 day ago)
3. pixelflow_backup_20250108_143022.db (2 days ago)

Select backup to restore [1-3]: 1

⚠️  Current database will be backed up first
✅ Backup created: pixelflow_current_backup.db
✅ Restoring from: pixelflow_backup_20250110_143022.db
✅ Restore complete!
```

**Safety Features:**
- ✅ Creates backup of current database before restore
- ✅ Verifies backup file exists and is valid
- ✅ Shows backup creation date and size
- ✅ Prompts for confirmation

**After Restore:**
1. Restart the backend server
2. Verify application works correctly
3. Check critical data is present
4. Test user login and features

---

### **5. cleanup_database.py** - Clean Old Data
**Purpose:** Remove old, orphaned, or temporary data

**What it does:**
- Deletes expired sessions
- Removes orphaned images (no associated sessions)
- Cleans up old processing history (>90 days)
- Removes failed login attempts (>30 days)
- Optimizes database (VACUUM for SQLite)

**When to use:**
- ✅ Regular maintenance (weekly/monthly)
- ✅ Database size growing too large
- ✅ Performance optimization
- ✅ Before backups

**Usage:**
```bash
python database/cleanup_database.py
```

**What gets cleaned:**
- 🗑️ Sessions older than 24 hours
- 🗑️ Uploaded images from expired sessions
- 🗑️ Processing history older than 90 days
- 🗑️ Login attempts older than 30 days
- 🗑️ Orphaned image records
- 🗑️ Unused temporary files

**Configurable Options:**
Edit the script to adjust:
- Session retention period (default: 24 hours)
- History retention period (default: 90 days)
- Login attempts retention (default: 30 days)

**Dry Run Mode:**
```bash
# Preview what will be deleted without actually deleting
python database/cleanup_database.py --dry-run
```

**Safety:**
- ✅ Never deletes user accounts
- ✅ Never deletes saved pipelines
- ✅ Never deletes active sessions
- ✅ Logs all deletions
- ✅ Can be run safely anytime

**Automation:**
```bash
# Weekly cleanup (Linux/Mac crontab)
0 3 * * 0 cd /path/to/backend && python database/cleanup_database.py
```

---

### **6. list_users.py** - List All Users
**Purpose:** View all registered users with details

**What it does:**
- Lists all users in database
- Shows user details (ID, email, username, role)
- Displays account status (active/inactive)
- Shows OAuth provider if applicable
- Counts saved pipelines per user

**When to use:**
- ✅ Verify user creation
- ✅ Check admin accounts
- ✅ Audit user list
- ✅ Debug authentication issues
- ✅ Find user IDs for other operations

**Usage:**
```bash
python database/list_users.py
```

**Example Output:**
```
=== PixelFlow Users ===

ID: 1
Email: admin@pixelflow.local
Username: admin
Full Name: Admin User
Role: Admin
Status: Active
Created: 2025-01-10 14:30:22
Pipelines: 5

ID: 2
Email: john@example.com
Username: john_doe
Full Name: John Doe
Role: User
Status: Active
OAuth: Google (1234567890)
Created: 2025-01-10 15:45:10
Pipelines: 12

Total Users: 2
```

**Options:**
```bash
# Show only admins
python database/list_users.py --admins-only

# Show only active users
python database/list_users.py --active-only

# Export to CSV
python database/list_users.py --export users.csv
```

---

### **7. reset_password.py** - Reset User Password
**Purpose:** Reset password for any user account

**What it does:**
- Prompts for user email
- Prompts for new password
- Updates password hash in database
- Logs password reset event

**When to use:**
- ✅ User forgot password
- ✅ Admin needs to reset user password
- ✅ Security incident requiring password reset
- ✅ Testing authentication

**Usage:**
```bash
python database/reset_password.py
```

**Interactive Process:**
```
Enter user email: john@example.com
✅ Found user: john_doe

Enter new password: ********
Confirm password: ********

✅ Password updated successfully!
User can now login with the new password.
```

**Security:**
- ✅ Password is hashed before storage
- ✅ Requires confirmation
- ✅ Logs reset event
- ✅ Old password becomes invalid immediately

**Password Requirements:**
- Minimum 8 characters
- Mix of letters and numbers recommended
- Special characters allowed

**Alternative - Reset Admin Password:**
```bash
# Quick reset for admin account
python database/reset_password.py --user admin@pixelflow.local --password newpass123
```

---

### **8. verify_business_rules.py** - Verify Data Integrity
**Purpose:** Check database for business rule violations

**What it does:**
- Verifies user quotas are not exceeded
- Checks pipeline limits
- Validates orphaned records
- Ensures data consistency
- Reports any issues found

**When to use:**
- ✅ After manual database edits
- ✅ Debugging quota issues
- ✅ After data migration
- ✅ Regular data integrity checks

**Usage:**
```bash
python database/verify_business_rules.py
```

**What it checks:**
- ✅ Users within storage quota
- ✅ Users within pipeline limits
- ✅ All pipelines have valid owners
- ✅ All images belong to valid sessions
- ✅ System settings are valid
- ✅ No orphaned foreign keys

**Example Output:**
```
=== Business Rules Verification ===

✅ User Quotas: All users within limits
✅ Pipeline Limits: All users within limits
⚠️  Orphaned Images: 3 images have no session
✅ Pipeline Ownership: All pipelines have valid owners
✅ System Settings: Valid

Issues Found: 1
Warnings: 1

Recommendation: Run cleanup_database.py to remove orphaned images
```

**Fix Issues:**
```bash
# After verification, fix issues with:
python database/cleanup_database.py
```

---

## 🗄️ **Database Configuration**

### **SQLite (Default)**

**Pros:**
- ✅ No installation needed
- ✅ Perfect for development
- ✅ Single file database
- ✅ Easy to backup (just copy file)
- ✅ Zero configuration

**Cons:**
- ❌ Not ideal for production
- ❌ Limited concurrent users
- ❌ File-based locking

**Configuration (.env):**
```env
USE_SQLITE=True
DATABASE_URL=sqlite:///./pixelflow.db
```

**Best for:**
- Local development
- Testing
- Small personal projects
- Single user applications

---

### **PostgreSQL (Production)**

**Pros:**
- ✅ Production-ready
- ✅ Excellent concurrent access
- ✅ Advanced features
- ✅ Better performance at scale
- ✅ Robust backup/restore

**Cons:**
- ❌ Requires installation
- ❌ More complex setup
- ❌ Needs running server

**Setup Steps:**

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

2. **Create Database and User**
   ```bash
   # Login as postgres user
   sudo -u postgres psql
   
   # Create database
   CREATE DATABASE pixelflow;
   
   # Create user
   CREATE USER pixelflow_user WITH PASSWORD 'your_secure_password';
   
   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE pixelflow TO pixelflow_user;
   
   # Exit
   \q
   ```

3. **Configure PixelFlow (.env)**
   ```env
   USE_SQLITE=False
   DATABASE_URL=postgresql://pixelflow_user:your_secure_password@localhost:5432/pixelflow
   ```

4. **Initialize Database**
   ```bash
   python database/init_db.py
   ```

**Connection String Format:**
```
postgresql://username:password@host:port/database

Examples:
- Local: postgresql://pixelflow_user:pass123@localhost:5432/pixelflow
- Remote: postgresql://user:pass@db.example.com:5432/pixelflow
- Cloud: postgresql://user:pass@aws-rds-endpoint:5432/pixelflow
```

**Best for:**
- Production deployments
- Multi-user applications
- Cloud deployments
- Applications needing high availability

**Migration from SQLite:**
See `migrate_to_postgres.py` documentation above.

---

## 🔧 **Maintenance Schedule**

### **Daily** (Automated)
- ✅ Database backup (via backup_database.py)

### **Weekly**
- ✅ Cleanup old data (via cleanup_database.py)
- ✅ Verify business rules (via verify_business_rules.py)

### **Monthly**
- ✅ Review user list (via list_users.py)
- ✅ Test backup restoration
- ✅ Check database size and performance

### **As Needed**
- Password resets (via reset_password.py)
- Data migration (via migrate_to_postgres.py)
- Emergency restoration (via restore_database.py)

---

## 🚨 **Troubleshooting**

### **Problem: "ModuleNotFoundError"**
```bash
# Make sure you're in backend directory with venv activated
cd backend
env\Scripts\activate  # Windows
source env/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

### **Problem: "Database is locked" (SQLite)**
```bash
# Another process is using the database
# Stop the backend server and try again
# Or switch to PostgreSQL for better concurrency
```

### **Problem: "Could not connect to PostgreSQL"**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # Mac

# Verify connection string in .env
# Test connection:
psql -h localhost -U pixelflow_user -d pixelflow
```

### **Problem: "Migration failed"**
```bash
# Your PostgreSQL database might already have tables
# Either drop the database and recreate:
DROP DATABASE pixelflow;
CREATE DATABASE pixelflow;

# Or clear existing tables carefully
```

### **Problem: "Permission denied"**
```bash
# PostgreSQL user needs proper permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE pixelflow TO pixelflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pixelflow_user;
```

---

## 📚 **Related Documentation**

- **[DATABASE_SETUP.md](../../guides/DATABASE_SETUP.md)** - Complete database setup guide
- **[INSTALLATION.md](../../INSTALLATION.md)** - Initial installation
- **[DEPLOYMENT.md](../../guides/DEPLOYMENT.md)** - Production deployment
- **[ADMIN_PANEL.md](../../guides/ADMIN_PANEL.md)** - Admin features

---

## 🔐 **Security Notes**

### **Passwords**
- ✅ Always change default admin password
- ✅ Use strong passwords (min 12 chars, mixed case, numbers, symbols)
- ✅ Never commit .env file with passwords to Git
- ✅ Rotate database passwords regularly

### **Backups**
- ✅ Store backups securely
- ✅ Encrypt sensitive backup files
- ✅ Keep backups off-server for production
- ✅ Test restore process regularly

### **Database Access**
- ✅ Use dedicated database users (not root/postgres)
- ✅ Limit database user privileges
- ✅ Use SSL for remote connections
- ✅ Firewall database ports (except from app server)

---

## 📞 **Getting Help**

If you encounter issues with these scripts:

1. Check the troubleshooting section above
2. Review the relevant guide in `guides/` folder
3. Check GitHub Issues: [PixelFlow Issues](https://github.com/Mauryantitans/PixelFlow/issues)
4. Join discussions: [PixelFlow Discussions](https://github.com/Mauryantitans/PixelFlow/discussions)

---

**Last Updated:** January 2025  
**Database Scripts Version:** 1.0.0
