# PixelFlow

## Visual Image Processing Pipeline Builder

**Version 1.2.0** | [V1.0.0 on GitHub](https://github.com/Mauryantitans/PixelFlow/tree/v1.0.0) | [Changelog](CHANGELOG.md)

---

A comprehensive web application that enables developers and researchers to build, test, and apply sophisticated image processing pipelines through an intuitive visual interface.

PixelFlow eliminates the need for manual parameter tuning by providing **real-time visual feedback** and extensive operation libraries from **OpenCV** and **Scikit-Image**.

---

## 📸 Screenshots

<table>
  <tr>
    <td><img src="images/PixelFlow (1).png" alt="Screenshot 1" width="100%"/></td>
    <td><img src="images/PixelFlow (2).png" alt="Screenshot 2" width="100%"/></td>
    <td><img src="images/PixelFlow (3).png" alt="Screenshot 3" width="100%"/></td>
    <td><img src="images/PixelFlow (4).png" alt="Screenshot 4" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="images/PixelFlow (5).png" alt="Screenshot 5" width="100%"/></td>
    <td><img src="images/PixelFlow (6).png" alt="Screenshot 6" width="100%"/></td>
    <td><img src="images/PixelFlow (7).png" alt="Screenshot 7" width="100%"/></td>
    <td><img src="images/PixelFlow (8).png" alt="Screenshot 8" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="images/PixelFlow (9).png" alt="Screenshot 9" width="100%"/></td>
    <td><img src="images/PixelFlow (10).png" alt="Screenshot 10" width="100%"/></td>
    <td><img src="images/PixelFlow (11).png" alt="Screenshot 11" width="100%"/></td>
    <td><img src="images/PixelFlow (12).png" alt="Screenshot 12" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="images/PixelFlow (13).png" alt="Screenshot 13" width="100%"/></td>
    <td><img src="images/PixelFlow (14).png" alt="Screenshot 14" width="100%"/></td>
    <td><img src="images/PixelFlow (15).png" alt="Screenshot 15" width="100%"/></td>
    <td><img src="images/PixelFlow (16).png" alt="Screenshot 16" width="100%"/></td>
  </tr>
</table>

> 💡 **Want to see it in action?** Check out our live demo deployment below!

---

## 🌐 Live Demo

Experience PixelFlow without any setup required!

**🔗 Live Demo:** [https://pixel-flow-woad.vercel.app](https://pixel-flow-woad.vercel.app)

Register a free account in the app to try the pipeline builder. To explore the
admin features locally, create your own admin account — see [Quick Start](#-quick-start)
(set `ADMIN_EMAIL` / `ADMIN_PASSWORD` and the admin sets their own panel PIN on first use).

> Admin credentials are never published here; provision your own via the
> `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables.

---

## 🆕 What's New in 1.2.0 — Dynamic Pipeline Engine

**Major Features:**
- ✅ **Schema-driven operation registry** - operations are declared once in the backend; the UI renders every control dynamically from the API (no duplicated frontend configs)
- ✅ **77 operations** - up from ~53, including fixed Watershed/Denoise Wavelet and ~22 new stylize/photo/segmentation techniques
- ✅ **Typed + interactive parameters** - scalars, enums, booleans, angles, colors, and image-coordinate inputs you pick directly on the preview (click a point, drag a region, eyedropper a color)
- ✅ **Incremental live preview** - a prefix cache recomputes only the steps after your edit; superseded requests are cancelled
- ✅ **Step-by-step comparison** - before/after wipe slider, any-two-step side-by-side, and a diff/overlay view
- ✅ **Tested codebase + CI** - pytest (~64) + GitHub Actions (ruff/mypy/pytest) + pre-commit; FastAPI bumped to 0.115
- ✅ **Docker** - full-stack `docker-compose` for local dev

See [CHANGELOG.md](CHANGELOG.md) for the complete list of changes.

> Previous (1.1.0): PostgreSQL persistence, JWT + Google OAuth authentication, admin panel, session management, and pipeline saving.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Operations Library](#-operations-library)
- [Deployment](#-deployment)
- [Limitations](#-limitations)
- [Contributing](#-contributing)
- [Contact & Support](#-contact--support)

---

## ✨ Features

### Core Functionality

- **Visual Pipeline Builder**: Real-time parameter controls with immediate visual feedback
- **Dual Processing Modes**:
  - **Live Mode**: Instant single-image processing with real-time preview
  - **Batch Mode**: Efficient multi-image processing with progress tracking
- **77 Operations**: Industry-standard algorithms from OpenCV, Scikit-Image and PIL, served from a declarative backend registry (the UI renders each operation's controls dynamically from its schema)
- **Typed & Interactive Parameters**: Scalars, enums, booleans, angles, colors, and image-coordinate inputs (click a point, drag a region, eyedropper a color) — picked directly on the preview
- **Incremental Live Preview**: A prefix cache recomputes only the steps after the one you edited
- **Step-by-Step Comparison**: Before/after wipe slider, any-two-step side-by-side, and a diff/overlay view
- **Hierarchical Organization**: Logical categorization by library and operation type

### Advanced Features

- **User Authentication**: Secure JWT-based login with Google OAuth integration
- **Admin Panel**: User management, session tracking, quota administration, and database tools
- **Database Storage**: PostgreSQL support with SQLAlchemy ORM for data persistence
- **Session Management**: Heartbeat-based tracking (active = last 5 minutes)
- **Pipeline Saving**: Save, load, and manage your processing pipelines
- **Performance Analytics**: Millisecond-precision timing for every operation
- **Undo/Redo System**: Complete operation history (Ctrl+Z/Ctrl+Y)
- **Modern Interface**: Dark/light theme support with professional design
- **Tested + CI**: pytest suite, GitHub Actions (ruff/mypy/pytest), and pre-commit hooks

### Developer Tools

- **Interactive API Docs**: FastAPI automatic documentation at `/docs`
- **Session Monitoring**: Real-time session statistics and debugging
- **Performance Profiling**: Built-in timing and resource usage tracking
- **Database Scripts**: Complete set of utilities for backup, restore, cleanup
- **Extensible Architecture**: Easy addition of new operations and features

---

## 🏗️ Architecture

```
┌─────────────────────┐    ┌────────────────────────┐    ┌─────────────────────┐
│                     │    │                        │    │                     │
│   REACT CLIENT      │    │   FASTAPI SERVER       │    │   POSTGRESQL DB     │
│                     │    │                        │    │                     │
│ • TypeScript        │◄──►│ • Python 3.11+         │◄──►│ • User data         │
│ • Tailwind CSS      │    │ • OpenCV               │    │ • Image storage     │
│ • Custom Hooks      │    │ • Scikit-Image         │    │ • Session tracking  │
│ • State Management  │    │ • SQLAlchemy           │    │ • Pipeline storage  │
│ • JWT Auth          │    │ • Google OAuth         │    │ • Audit logs        │
│                     │    │ • Heartbeat System     │    │                     │
└─────────────────────┘    └────────────────────────┘    └─────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.2+ with TypeScript
- Tailwind CSS for styling
- Axios for API communication
- React Router for navigation
- Lucide React for icons

**Backend:**
- FastAPI 0.115+ (high-performance API)
- OpenCV 4.8+ (computer vision)
- Scikit-Image 0.22+ (scientific image analysis)
- PIL/Pillow 10.4+ (image manipulation)
- SQLAlchemy 2.0+ (database ORM)
- PostgreSQL (production database)
- Alembic (database migrations)

**Quality & Tooling:**
- pytest (test suite) + GitHub Actions CI
- ruff (lint + format) and mypy (typing)
- pre-commit hooks
- Docker + docker-compose

**Authentication & Security:**
- JWT in **httpOnly cookies** (python-jose) — not readable by JS
- **CSRF protection** (double-submit cookie) + refresh-token rotation/revocation
- Google OAuth 2.0 (authlib)
- Bcrypt password hashing (passlib)
- Rate limiting middleware (per-IP on auth/upload/processing)
- Security headers (CSP, HSTS, XSS protection)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Node.js 16 or higher
- PostgreSQL (for production) or SQLite (for development)

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/MauryanTitans/pixelflow.git
   cd pixelflow
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv env
   
   # Activate virtual environment
   # Windows:
   .\env\Scripts\activate
   # macOS/Linux:
   source env/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create .env file from example
   cp .env.example .env
   # Edit .env and add your configuration
   
   # Initialize database
   python database/init_db.py
   
   # Start backend server
   python run.py
   ```

3. **Frontend Setup**
   ```bash
   # In a new terminal
   cd frontend
   
   # Install dependencies
   npm install
   
   # Create .env file
   # Add: REACT_APP_API_URL=http://localhost:8000/api
   
   # Start development server
   npm start
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

5. **Create Admin Account (Local Development)**
   
   After your backend starts, you can create an admin user in two ways:
   
   **Option A: Environment Variables (Automatic)**
   ```bash
   # Add to backend/.env file:
   ADMIN_EMAIL=your.email@example.com
   ADMIN_PASSWORD=YourStrongPassword
   ADMIN_USERNAME=admin
   ADMIN_FULL_NAME=Your Name
   
   # Restart backend - admin will be auto-created if none exists
   ```
   
   **Option B: Database Script**
   ```bash
   cd backend
   python database/list_users.py  # Find your user ID after registering
   # Then manually update is_admin=true in database
   ```

For detailed setup instructions, see [INSTALLATION.md](INSTALLATION.md)

---

## 📂 Project Structure

```
pixelflow/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes and endpoints
│   │   │   └── routes/        # Auth, admin, images, processing, OAuth
│   │   ├── core/              # Configuration and security
│   │   ├── models/            # Database models and schemas
│   │   ├── middleware/        # Rate limiting, security headers
│   │   └── utils/             # Processing, auth, cleanup utilities
│   ├── database/              # Database scripts and utilities
│   │   ├── init_db.py         # Database initialization
│   │   ├── backup_database.py # Backup utilities
│   │   ├── cleanup_database.py # Cleanup scripts
│   │   └── ... (more utilities)
│   ├── alembic/               # Database migrations framework
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment template
│   └── run.py                 # Application entry point
│
├── frontend/                  # React frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AdminPanel.tsx # Admin interface
│   │   │   ├── AuthPage.tsx   # Authentication
│   │   │   └── ... (more components)
│   │   ├── contexts/          # React contexts (Auth, Theme)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API communication
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Utility functions
│   ├── package.json           # Node dependencies
│   └── vercel.json            # Vercel deployment config
│
├── guides/                    # Development documentation
│   ├── GETTING_STARTED.md     # Local development guide
│   ├── DEVELOPMENT.md         # Development workflow
│   ├── API_REFERENCE.md       # Complete API documentation
│   ├── DATABASE_SETUP.md      # Database configuration
│   ├── ADMIN_PANEL.md         # Admin features guide
│   ├── ADDING_OPERATIONS.md   # Adding new operations
│   └── GOOGLE_OAUTH_SETUP.md  # OAuth configuration
│
├── deployment/                # Deployment resources
│   ├── QUICK_START.md         # Fast deployment guide
│   ├── DEPLOYMENT_GUIDE.md    # Complete deployment docs
│   ├── render.yaml            # Render configuration
│   └── vercel.json            # Vercel configuration
│
├── images/                    # Application screenshots
│   └── PixelFlow (1-16).png   # UI screenshots for README
│
├── README.md                  # This file
├── CHANGELOG.md               # Version history
├── CURRENT_LIMITATIONS.md     # Known issues and limitations
├── INSTALLATION.md            # Detailed installation guide
└── LICENSE                    # Project license
```

---

## 💻 Usage

### Basic Workflow

1. **Create Account / Login**
   - Register with email and password
   - Or use Google Sign-In (if configured)

2. **Upload Images**
   - Click "Upload Image(s)" or drag files (JPEG, PNG, BMP, TIFF up to 50MB)
   - Images stored in database and persist across sessions

3. **Build Pipeline**
   - Browse 77 operations
   - Add to pipeline and adjust parameters
   - Save pipeline for reuse

4. **Choose Mode**:
   - **Live Mode**: Real-time processing for single image
   - **Batch Mode**: Process multiple images efficiently

5. **Apply & Download**
   - Process images and download results
   - Results persist in database until manually deleted

### Admin Features (Admin Users Only)

- **User Management**: View, activate/deactivate, delete users
- **System Statistics**: Monitor storage, sessions, and usage
- **Database Viewer**: PIN-protected access to user data
- **Cleanup Tools**: Manual cleanup, fix orphaned images
- **Settings**: Adjust quotas, limits, and retention policies

For detailed usage instructions, see [guides/GETTING_STARTED.md](guides/GETTING_STARTED.md)

---

## 📚 API Documentation

### Core Endpoints

**Authentication:**
```http
POST /api/auth/register          # Create account
POST /api/auth/login             # Login
POST /api/auth/logout            # Logout
POST /api/auth/refresh           # Refresh token
GET  /api/auth/me                # Get user info
```

**Google OAuth:**
```http
GET  /api/auth/google/login      # Initiate Google login
POST /api/auth/google/callback   # Handle callback
GET  /api/auth/google/status     # Check OAuth config
```

**Image Management:**
```http
POST /api/images/upload          # Upload single image
POST /api/images/upload-multiple # Upload multiple images
GET  /api/images/session/{id}/images # Get session images
POST /api/images/heartbeat       # Keep session alive
```

**Processing:**
```http
POST /api/processing/process        # Batch mode
POST /api/processing/process-live   # Live mode
GET  /api/processing/operations     # Available operations
```

**Admin (Admin Users Only):**
```http
GET  /api/admin/stats/overview      # System statistics
GET  /api/admin/users               # List all users
GET  /api/admin/storage/overview    # Storage stats
GET  /api/admin/database/overview   # Database viewer
POST /api/admin/cleanup/run         # Manual cleanup
```

For complete API documentation, see:
- Interactive docs: http://localhost:8000/docs
- Full reference: [guides/API_REFERENCE.md](guides/API_REFERENCE.md)

---

## 🎨 Operations Library

PixelFlow ships **77 operations** across Basic, OpenCV and Scikit-Image libraries. The
live list is served from the backend registry (`GET /api/processing/operations`) and the UI
renders each operation's controls dynamically from its schema, so the in-app palette is
always the source of truth. Highlights:

- **Adjustments & tone**: Brightness, Contrast, Saturation, Exposure, Gamma, Hue Rotate, Temperature, Detail Enhance
- **Filters & blur**: Gaussian / Median / Box / Bilateral, Non-Local Means, Motion Blur, TV & Wavelet denoise
- **Edges & features**: Canny, Sobel, Scharr, Laplacian, Prewitt, FAST corners, ORB, Harris
- **Morphology & segmentation**: Open / Close / Dilate / Erode / Gradient / Top-Hat / Black-Hat, Skeletonize, Otsu / Adaptive / Triangle thresholding, Watershed, SLIC
- **Stylize & effects**: Sepia, Posterize, Solarize, Vignette, Grain, Emboss, Pixelate, Cartoon, Pencil / Color Sketch, Stylization, Duotone
- **Color spaces & geometry**: RGB ↔ HSV / LAB / YUV, Resize, Rotate, Flip, Crop
- **Interactive (pick on the image)**: Flood Fill (click a seed point), Crop & Inpaint Region (drag a region), eyedropper colors

Operations carry **typed parameters** — scalars, enums, booleans, angles, colors, and
image-coordinate inputs (points / regions) picked directly on the preview. Adding a new
operation is ~10 lines (register a function with its param schema; the UI adapts
automatically) — see [guides/ADDING_OPERATIONS.md](guides/ADDING_OPERATIONS.md).

---

## 🚀 Deployment

PixelFlow can be deployed to production using free hosting services:

- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier)
- **Database**: PostgreSQL on Render (free tier)

### Environment Variables

**Backend (Render):**
```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
ALLOWED_ORIGINS=https://your-frontend.vercel.app
ADMIN_EMAIL=admin@example.com      # Optional: Auto-create first admin
ADMIN_PASSWORD=YourStrongPassword   # Optional: Auto-create first admin
ADMIN_USERNAME=admin                # Optional: Default is 'admin'
ADMIN_FULL_NAME=Admin User          # Optional: Default is 'Admin User'
```

**Frontend (Vercel):**
```env
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Quick Deployment

See the [deployment/](deployment/) folder for:
- [START_HERE.md](deployment/START_HERE.md) - Deployment overview
- [QUICK_START.md](deployment/QUICK_START.md) - Fast deployment checklist
- [DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md) - Comprehensive guide
- [ALTERNATIVE_HOSTING_OPTIONS.md](deployment/ALTERNATIVE_HOSTING_OPTIONS.md) - Other platforms
- Configuration files: `render.yaml`, `vercel.json`

**Total Monthly Cost: $0** using free tiers!

**Estimated Deployment Time:** 45-60 minutes for first deployment

---

## ⚠️ Limitations

PixelFlow 1.2.0 has some known limitations:

**Critical:**
- Desktop-only interface (mobile support planned for V2.0)
- Google OAuth requires manual configuration
- No background cleanup jobs (manual trigger via admin panel)
- Free tier limitations (cold starts, 1GB database)

**Moderate:**
- No email verification or password reset
- Limited file format support (JPEG, PNG, BMP, TIFF only)
- No batch download as ZIP file
- Rate limiting is in-memory / single-instance (Redis needed for multi-instance)

For the complete list of known limitations and what was recently resolved, see [CURRENT_LIMITATIONS.md](CURRENT_LIMITATIONS.md)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

Use the [GitHub issue tracker](https://github.com/MauryanTitans/pixelflow/issues) to:
- Report bugs with detailed reproduction steps
- Request features with use cases and benefits
- Ask questions about usage or development

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Areas Needing Help

See [CURRENT_LIMITATIONS.md](CURRENT_LIMITATIONS.md) for areas where contributions would be valuable:
- httpOnly-cookie auth (move JWT out of localStorage)
- Background cleanup jobs / scheduler
- Mobile responsiveness (V2.0)
- Email verification & password reset
- More image-processing operation batches
- End-to-end (Playwright) tests in CI

### Adding New Operations

Operations are added **entirely in the backend** — write a function and register it with a
typed parameter schema; the UI picks it up automatically (no frontend changes). See
[guides/ADDING_OPERATIONS.md](guides/ADDING_OPERATIONS.md).

---

## 📧 Contact & Support

### Developer

| Platform | Link |
|----------|------|
| **GitHub** | [@MauryanTitans](https://github.com/Mauryantitans) |
| **LinkedIn** | [mourya-arnepalli](https://www.linkedin.com/in/mourya-arnepalli) |
| **Instagram** | [@mouryaarnepalli](https://www.instagram.com/mouryaarnepalli) |

### Support

- **Bug Reports**: [GitHub Issues](https://github.com/MauryanTitans/pixelflow/issues)
- **Questions**: GitHub Discussions
- **Documentation**: [guides/](guides/) folder
- **Deployment Help**: [deployment/](deployment/) folder

---

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

## 📖 Documentation

- **[INSTALLATION.md](INSTALLATION.md)** - Detailed setup instructions
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes
- **[CURRENT_LIMITATIONS.md](CURRENT_LIMITATIONS.md)** - Known issues and limitations
- **[guides/](guides/)** - Development and usage guides
- **[deployment/](deployment/)** - Deployment documentation

---

<div align="center">

### Built with ❤️ for the image processing community

**⭐ Star this repository if PixelFlow helps your projects! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/MauryanTitans/pixelflow?style=social)](https://github.com/MauryanTitans/pixelflow)
[![GitHub forks](https://img.shields.io/github/forks/MauryanTitans/pixelflow?style=social)](https://github.com/MauryanTitans/pixelflow/fork)

**Current Version: 1.2.0** | [View Previous Versions](CHANGELOG.md)

</div>
