# PixelFlow

## Visual Image Processing Pipeline Builder

**Version 1.1.0** | [V1.0.0 on GitHub](https://github.com/Mauryantitans/PixelFlow/tree/v1.0.0) | [Changelog](CHANGELOG.md)

---

A comprehensive web application that enables developers and researchers to build, test, and apply sophisticated image processing pipelines through an intuitive visual interface.

PixelFlow eliminates the need for manual parameter tuning by providing **real-time visual feedback** and extensive operation libraries from **OpenCV** and **Scikit-Image**.

![PixelFlow Demo](PixelFlow.png)

---

## 🆕 What's New in V1.1.0

**Major Features:**
- ✅ **PostgreSQL Database** - Full data persistence with SQLAlchemy
- ✅ **User Authentication** - JWT-based login with Google OAuth support
- ✅ **Admin Panel** - User management, statistics, and database tools
- ✅ **Session Management** - Heartbeat-based tracking and auto-cleanup
- ✅ **Pipeline Saving** - Save and load your processing pipelines
- ✅ **Enhanced Security** - Rate limiting, security headers, and PIN protection

See [CHANGELOG.md](CHANGELOG.md) for complete list of changes.

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
- **50+ Operations**: Industry-standard algorithms from OpenCV and Scikit-Image
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
│ • TypeScript        │◄──►│ • Python 3.8+          │◄──►│ • User data         │
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
- FastAPI 0.104+ (high-performance API)
- OpenCV 4.8+ (computer vision)
- Scikit-Image 0.22+ (scientific image analysis)
- PIL/Pillow 10.1+ (image manipulation)
- SQLAlchemy 2.0+ (database ORM)
- PostgreSQL (production database)
- Alembic (database migrations)

**Authentication & Security:**
- JWT tokens (python-jose)
- Google OAuth 2.0 (authlib)
- Bcrypt password hashing (passlib)
- Rate limiting middleware
- Security headers (CSP, HSTS, XSS protection)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
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
   
   # Start development server
   npm start
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

5. **Create Admin Account**
   - Register a new account via frontend
   - Use database script to promote to admin:
   ```bash
   cd backend
   python database/list_users.py  # Find your user ID
   # Manually update is_admin in database or use admin panel
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
   - Browse 50+ operations
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
GET  /api/oauth/google/login     # Initiate Google login
POST /api/oauth/google/callback  # Handle callback
GET  /api/oauth/google/status    # Check OAuth config
```

**Image Management:**
```http
POST /api/images/upload          # Upload single image
POST /api/images/upload-multiple # Upload multiple images
GET  /api/images/session/{id}/images # Get session images
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

PixelFlow provides **50+ professional-grade operations** organized into three libraries:

### Basic Operations (13 operations)
- **Adjustments**: Brightness, Contrast, Saturation, Exposure
- **Filters**: Grayscale, Sepia, Invert, Solarize, Posterize
- **Blur & Sharpen**: Gaussian Blur, Sharpen
- **Effects**: Vignette, Grain

### OpenCV Operations (25+ operations)
- **Filtering**: Bilateral, Median, Box, Non-Local Means
- **Morphological**: Opening, Closing, Dilation, Erosion, Gradient, Top Hat, Black Hat
- **Edge Detection**: Canny, Sobel, Scharr, Laplacian
- **Color Spaces**: HSV, LAB, YUV conversions
- **Geometric**: Resize, Rotation, Flip
- **Feature Detection**: FAST Corners, ORB Features

### Scikit-Image Operations (15+ operations)
- **Enhancement**: Histogram Equalization, CLAHE, Gamma Correction, Contrast Stretching
- **Filters**: Gaussian, Frangi, Hessian, Farid
- **Restoration**: Wavelet Denoising, Unsharp Mask
- **Segmentation**: Otsu, Adaptive Thresholding, Watershed, SLIC Superpixels

For operation details and parameters, see [guides/ADDING_OPERATIONS.md](guides/ADDING_OPERATIONS.md)

---

## 🚀 Deployment

PixelFlow can be deployed to production using free hosting services:

- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier)
- **Database**: PostgreSQL on Render (free tier)

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

PixelFlow V1.1.0 has some known limitations:

**Critical:**
- Desktop-only interface (mobile support planned for V2.0)
- Google OAuth requires manual configuration
- No background cleanup jobs (manual trigger via admin panel)
- Free tier limitations (cold starts, 1GB database)

**Moderate:**
- Admin panel features partially implemented
- No email verification or password reset
- Limited file format support (JPEG, PNG, BMP, TIFF only)
- No batch download as ZIP file

For complete list of 47 known limitations and workarounds, see [CURRENT_LIMITATIONS.md](CURRENT_LIMITATIONS.md)

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
- Background cleanup jobs implementation
- Mobile responsiveness (V2.0)
- Email verification system
- Password reset functionality
- Enhanced admin panel features
- Automated testing suite

### Adding New Operations

See [guides/ADDING_OPERATIONS.md](guides/ADDING_OPERATIONS.md) for detailed instructions on:
- Backend implementation
- Frontend configuration
- Testing and documentation

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

**Current Version: 1.1.0** | [View Previous Versions](CHANGELOG.md)

</div>
