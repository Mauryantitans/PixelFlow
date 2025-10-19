# PixelFlow Installation Guide

Complete step-by-step installation guide for PixelFlow - Visual Image Processing Pipeline Builder.

---

## 📋 **Prerequisites**

Before installing PixelFlow, ensure you have:

- **Python 3.8+** (recommended: Python 3.10 or 3.11)
- **Node.js 16+** and npm (recommended: Node.js 18 LTS)
- **Git** (for cloning the repository)
- **PostgreSQL 13+** (optional - SQLite works out of the box)
- **Windows/Mac/Linux** operating system

---

## 🚀 **Quick Start (5 Minutes)**

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/Mauryantitans/PixelFlow.git
cd PixelFlow
```

### **Step 2: Backend Setup**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv env

# Activate virtual environment
# Windows:
env\Scripts\activate
# Mac/Linux:
source env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env

# Generate secure SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy the output and paste it as SECRET_KEY in .env file

# Initialize database (SQLite by default)
python database/init_db.py

# Start backend server
python run.py
```

Backend should now be running at `http://localhost:8000`

### **Step 3: Frontend Setup**

Open a **new terminal** window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend should open automatically at `http://localhost:3000`

### **Step 4: Access the Application**

1. Open browser to `http://localhost:3000`
2. Click **"App"** in navigation to start using PixelFlow
3. Upload images and build your first pipeline!

---

## 🗄️ **Database Configuration**

### **Default: SQLite (No Setup Required)**

PixelFlow uses SQLite by default - perfect for development and testing.

**Location:** `backend/pixelflow.db`

**No additional setup needed!**

### **Optional: PostgreSQL for Production**

For production deployments, PostgreSQL is recommended.

See: [guides/DATABASE_SETUP.md](guides/DATABASE_SETUP.md) for detailed PostgreSQL setup instructions.

---

## 🔐 **Authentication Setup**

### **Basic Authentication (Built-in)**

PixelFlow includes email/password authentication out of the box.

**Create your first admin user:**

```bash
cd backend
python database/init_db.py  # Creates default admin user
```

**Default Admin Credentials:**
- Email: `admin@pixelflow.local`
- Password: `admin123`

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

### **Optional: Google OAuth**

To enable Google Sign-In:

See: [guides/GOOGLE_OAUTH_SETUP.md](guides/GOOGLE_OAUTH_SETUP.md) for detailed OAuth setup instructions.

---

## ⚙️ **Environment Configuration**

### **Backend (.env)**

Edit `backend/.env`:

```env
# Application Settings
APP_NAME=PixelFlow
VERSION=1.0.0
DEBUG=False
HOST=0.0.0.0
PORT=8000

# Security (CRITICAL - Generate new key!)
SECRET_KEY=your_secret_key_here_generate_with_command_above
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
USE_SQLITE=True
DATABASE_URL=sqlite:///./pixelflow.db

# CORS (adjust for production)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Upload
MAX_FILE_SIZE=52428800
ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.bmp,.tiff,.webp

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### **Frontend (.env)**

Frontend `.env` is optional - defaults work fine for local development.

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
```

---

## 🧪 **Verify Installation**

### **Test Backend**

```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status":"healthy","app":"PixelFlow","version":"1.0.0",...}
```

### **Test Frontend**

1. Open `http://localhost:3000/app`
2. Upload a test image
3. Add an operation (e.g., "Grayscale")
4. Click "Apply Pipeline"
5. Should show processed result!

---

## 🔧 **Troubleshooting**

### **Backend Issues**

**Problem:** `ModuleNotFoundError`
```bash
pip install -r requirements.txt
```

**Problem:** Port 8000 already in use
```bash
# Kill process on Windows
netstat -ano | findstr :8000
taskkill /F /PID <process_id>

# Or change port in .env
PORT=8001
```

**Problem:** Database errors
```bash
# Reset database
del pixelflow.db
python database/init_db.py
```

### **Frontend Issues**

**Problem:** `npm install` fails
```bash
# Clear npm cache
npm cache clean --force
npm install
```

**Problem:** Port 3000 already in use
```bash
# Will prompt to use different port
npm start
# Press 'Y' to use port 3001
```

**Problem:** Styles not loading
```bash
# Hard refresh browser
Ctrl + Shift + R

# Or rebuild
npm run build
npm start
```

---

## 📚 **Next Steps**

After installation, explore these guides:

- **[Getting Started](guides/GETTING_STARTED.md)** - First steps and basic usage
- **[Adding Operations](guides/ADDING_OPERATIONS.md)** - How to add new image processing methods
- **[Database Management](guides/DATABASE_SETUP.md)** - Database configuration and management
- **[Google OAuth](guides/GOOGLE_OAUTH_SETUP.md)** - Setting up Google Sign-In
- **[Admin Panel](guides/ADMIN_PANEL.md)** - Managing users, quotas, and settings
- **[Deployment](guides/DEPLOYMENT.md)** - Deploy to production
- **[API Documentation](guides/API_REFERENCE.md)** - Backend API endpoints

---

## 🆘 **Getting Help**

- **Issues:** [GitHub Issues](https://github.com/Mauryantitans/PixelFlow/issues)
- **Documentation:** [Project Wiki](https://github.com/Mauryantitans/PixelFlow/wiki)
- **Email:** support@pixelflow.example.com

---

## 📜 **License**

PixelFlow is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

**Installation complete! 🎉 Start building amazing image processing pipelines!**
