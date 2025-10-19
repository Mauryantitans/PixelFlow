# 📝 Changelog

All notable changes to PixelFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-10-18

### 🎉 Major New Features

#### **Database Integration**
- **PostgreSQL Support**: Full SQLAlchemy ORM integration with PostgreSQL
- **Database Storage**: Images can now be stored in database (in addition to filesystem)
- **Data Persistence**: All user data, images, and pipelines persist across sessions
- **Migration Framework**: Alembic integration for future schema updates

#### **User Authentication System**
- **User Registration**: Email-based account creation with secure password hashing
- **Login System**: JWT-based authentication with access and refresh tokens
- **Google OAuth**: One-click sign-in with Google (requires configuration)
- **Profile Management**: Users can update their profile information
- **Session Management**: Secure session handling with automatic cleanup

#### **Admin Panel**
- **System Statistics**: View users, sessions, storage, and pipeline stats
- **User Management**: View all users, activate/deactivate accounts, delete users
- **Storage Overview**: Monitor database storage and image counts
- **Session Tracking**: Heartbeat-based active session monitoring (5-minute window)
- **Database Viewer**: PIN-protected viewer for user data and images
- **Manual Cleanup Tools**: Trigger cleanup, fix orphaned images, manage data
- **Settings Management**: Adjust quotas, limits, and retention policies
- **Deletion Tools**: Delete individual users, images, pipelines, or bulk operations

#### **Advanced Session Management**
- **Heartbeat System**: 30-second heartbeat pings to track active sessions
- **Active vs Inactive**: Real-world session tracking (active = heartbeat in last 5 minutes)
- **Session Persistence**: Sessions stored in database, persist across browser restarts
- **IP Tracking**: Track session IP addresses for security
- **Automatic Expiration**: Sessions expire after configured time period

### ✨ Enhancements

#### **Security Improvements**
- **Login Rate Limiting**: Prevent brute force attacks (5 attempts, 15-min lockout)
- **Security Headers**: CSP, XSS protection, HSTS, and more
- **Password Hashing**: bcrypt with proper salting
- **CORS Configuration**: Flexible origin management for secure API access
- **Admin PIN Protection**: Sensitive data requires PIN verification

#### **Storage & Cleanup**
- **Quota Management**: Storage quotas with visual feedback
- **Retention Policies**: Configurable retention periods for guests and users
- **Cleanup Service**: Manual and (future) automatic cleanup of old data
- **Orphaned Image Detection**: Identify and fix mislinked images
- **Session Cleanup**: Remove expired sessions and associated data

#### **Business Rules**
- **User Limits**: Configurable pipeline limits per user type
- **Storage Quotas**: Different quotas for guests vs registered users
- **Image Limits**: Maximum images per session and per upload
- **Retention Periods**: Different policies for uploads vs processed images

### 🛠️ Technical Improvements

#### **Backend Architecture**
- **SQLAlchemy Models**: Comprehensive database models for all entities
- **Database Scripts**: Utilities for init, backup, restore, cleanup, and debugging
- **Middleware System**: Rate limiting, security headers, and CORS
- **Business Logic Layer**: Centralized rules for quotas, limits, and cleanup
- **Settings Manager**: Dynamic system settings stored in database

#### **API Enhancements**
- **Authentication Endpoints**: Register, login, logout, token refresh, user profile
- **Admin Endpoints**: Complete admin API for user and data management
- **OAuth Endpoints**: Google OAuth flow with callback handling
- **Pipeline Endpoints**: Save, load, update, delete pipelines (database-backed)
- **Session Endpoints**: Session creation, heartbeat, and cleanup

#### **Frontend Improvements**
- **Auth Context**: Global authentication state management
- **Protected Routes**: Route guards for authenticated-only pages
- **Login/Register Pages**: Professional authentication UI
- **Admin Panel Component**: Comprehensive admin interface
- **Google Sign-In Button**: One-click OAuth authentication
- **Session Heartbeat**: Automatic background session keepalive

### 📚 Documentation

#### **New Guides**
- `guides/DATABASE_SETUP.md` - Complete database configuration guide
- `guides/ADMIN_PANEL.md` - Admin panel features and usage
- `guides/GOOGLE_OAUTH_SETUP.md` - OAuth configuration instructions
- `deployment/` folder - Comprehensive deployment documentation
- `CURRENT_LIMITATIONS.md` - Known issues and limitations

#### **Deployment Resources**
- Complete Vercel + Render deployment guides
- Environment variable documentation
- Production checklist
- Alternative hosting options guide
- Automated preparation scripts

### 🔧 Infrastructure

#### **Database Schema**
- `users` - User accounts with OAuth support
- `sessions` - Active session tracking with heartbeat
- `uploaded_images` - Binary image storage with thumbnails
- `processed_images` - Processed results storage
- `saved_pipelines` - User pipeline storage
- `processing_history` - Usage analytics and logging
- `login_attempts` - Security audit trail
- `system_settings` - Dynamic configuration storage

#### **Deployment Configuration**
- `render.yaml` - Complete Render deployment config
- `vercel.json` - Vercel frontend configuration
- Automated deployment preparation scripts
- Comprehensive deployment guides

### 🐛 Bug Fixes
- Fixed session cleanup logic to follow real-world standards
- Improved error handling in image processing
- Better CORS configuration management
- Fixed image persistence across page refreshes

### ⚠️ Known Limitations (See CURRENT_LIMITATIONS.md)
- Desktop-only interface (mobile support deferred to V2.0)
- No background cleanup jobs (manual trigger required)
- Admin panel features partially implemented
- Google OAuth requires manual configuration
- Free tier limitations (cold starts, 1GB database)

### 🔄 Breaking Changes
- **Database Required**: V1.1.0 requires PostgreSQL (or SQLite for development)
- **Environment Variables**: New required vars for authentication
- **Configuration Changes**: Different .env structure from V1.0.0

### 📦 Dependencies Added
- `sqlalchemy==2.0.23` - Database ORM
- `asyncpg==0.29.0` - PostgreSQL async driver
- `alembic==1.13.0` - Database migrations
- `psycopg2-binary==2.9.9` - PostgreSQL driver
- `bcrypt==3.2.2` - Password hashing
- `passlib==1.7.4` - Password utilities
- `python-jose==3.3.0` - JWT tokens
- `authlib==1.3.0` - OAuth support
- `google-auth==2.23.4` - Google authentication
- `react-router-dom==6.30.1` - Frontend routing

---

## [1.0.0] - Initial Release

### Features
- Visual pipeline builder with 50+ operations
- Dual processing modes (Live and Batch)
- OpenCV and Scikit-Image operation libraries
- Real-time parameter controls
- Hierarchical operation organization
- Performance analytics and timing
- Undo/Redo system
- Modern React/TypeScript frontend
- FastAPI/Python backend
- Session-based file management
- Dark/light theme support (UI)

### Operations Library
- 13 Basic Operations
- 25+ OpenCV Operations
- 15+ Scikit-Image Operations

### Architecture
- React 18 + TypeScript frontend
- FastAPI backend with OpenCV and Scikit-Image
- Filesystem-based image storage
- Session isolation
- RESTful API design

---

## Version Comparison

| Feature | V1.0.0 | V1.1.0 |
|---------|--------|--------|
| **Core Processing** | ✅ | ✅ |
| **Operation Count** | 50+ | 50+ |
| **User Accounts** | ❌ | ✅ |
| **Database** | ❌ | ✅ PostgreSQL |
| **Authentication** | ❌ | ✅ JWT + OAuth |
| **Admin Panel** | ❌ | ✅ Partial |
| **Persistent Storage** | ❌ | ✅ |
| **Session Management** | Basic | ✅ Advanced |
| **Pipeline Saving** | ❌ | ✅ |
| **Google OAuth** | ❌ | ✅ |
| **Security** | Basic | ✅ Enhanced |
| **Deployment Docs** | Basic | ✅ Comprehensive |

---

## Migration Guide (1.0.0 → 1.1.0)

### Prerequisites
- PostgreSQL database (or SQLite for development)
- Updated environment variables

### Steps

1. **Update Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   cd frontend
   npm install
   ```

2. **Configure Database**
   ```bash
   # Set in backend/.env
   DATABASE_URL=postgresql://user:password@localhost:5432/pixelflow
   USE_SQLITE=False  # or True for development
   IMAGE_STORAGE=database
   ```

3. **Add Authentication Variables**
   ```bash
   SECRET_KEY=<generate-new-key>
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   ```

4. **Initialize Database**
   ```bash
   python database/init_db.py
   ```

5. **Optional: Configure Google OAuth**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   ```

6. **Update Frontend**
   - No changes required in code
   - New auth pages automatically available
   - Admin panel accessible to admin users

### Data Migration

**V1.0.0 had no persistent storage**, so no data migration needed.

If you have important session data:
- Export images manually before upgrading
- Re-upload to V1.1.0 after authentication setup

---

## Upcoming Features (V1.2.0)

### Planned Additions
- Background cleanup cron jobs
- Dark/light theme toggle UI
- Batch download as ZIP
- Email verification
- Password reset functionality
- Pipeline sharing interface
- Processing history dashboard
- Enhanced admin panel features

### Under Consideration
- Mobile responsiveness (V2.0)
- WebSocket real-time updates
- Automated testing suite
- Docker deployment option
- Additional file format support

---

## Links

- **GitHub Repository**: https://github.com/Mauryantitans/PixelFlow
- **V1.0.0 Release**: https://github.com/Mauryantitans/PixelFlow/tree/v1.0.0
- **Documentation**: See `/guides` and `/deployment` folders
- **Issue Tracker**: https://github.com/Mauryantitans/PixelFlow/issues

---

## Notes

### Versioning Scheme
- **Major.Minor.Patch** (Semantic Versioning)
- **Major**: Breaking changes, major new features
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, minor improvements

### Support
- V1.1.0: Current, actively developed
- V1.0.0: Stable, no longer maintained (use V1.1.0)

---

*For detailed limitations and known issues, see [CURRENT_LIMITATIONS.md](CURRENT_LIMITATIONS.md)*
