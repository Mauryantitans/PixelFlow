# Development Guide

Guide for developers contributing to or modifying PixelFlow.

---

## 🏗️ **Project Structure**

```
PixelFlow/
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   │   └── routes/     # Organized by feature
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models & schemas
│   │   ├── utils/          # Utility functions
│   │   └── middleware/     # Custom middleware
│   ├── alembic/            # Database migrations
│   ├── .env                # Environment config (gitignored)
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Application entry point
│
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth, Pipeline)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript types & configs
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main application component
│   │   └── AppRoutes.tsx  # Routing configuration
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
│
└── guides/                # Documentation
    ├── GETTING_STARTED.md
    ├── ADDING_OPERATIONS.md
    ├── DATABASE_SETUP.md
    ├── GOOGLE_OAUTH_SETUP.md
    ├── ADMIN_PANEL.md
    ├── DEPLOYMENT.md
    └── API_REFERENCE.md
```

---

## 🛠️ **Development Setup**

### **Prerequisites**

- Python 3.10+ with pip
- Node.js 18+ with npm
- Git
- Code editor (VS Code recommended)

### **First Time Setup**

```bash
# Clone repo
git clone https://github.com/Mauryantitans/PixelFlow.git
cd PixelFlow

# Backend setup
cd backend
python -m venv env
env\Scripts\activate  # Windows
pip install -r requirements.txt
copy .env.example .env
# Edit .env and generate SECRET_KEY
python init_db.py

# Frontend setup
cd ../frontend
npm install
copy .env.example .env

# Start development
# Terminal 1:
cd backend && python run.py

# Terminal 2:
cd frontend && npm start
```

---

## 📝 **Code Style & Conventions**

### **Python (Backend)**

**Follow PEP 8:**
```python
# Good
def process_image(image: PILImage.Image, params: dict) -> PILImage.Image:
    """Process an image with given parameters."""
    strength = params.get('strength', 50)
    return processed_image

# Bad
def processImage(image,params):
    strength=params.get('strength',50)
    return processed_image
```

**Type hints:**
```python
# Always use type hints
def calculate_size(width: int, height: int) -> int:
    return width * height

# For optional values
from typing import Optional
def get_user(user_id: Optional[int] = None) -> Optional[User]:
    ...
```

**Docstrings:**
```python
def process_image(image: PILImage.Image, params: dict) -> PILImage.Image:
    """
    Apply processing operation to image.
    
    Args:
        image: PIL Image object
        params: Dictionary of operation parameters
        
    Returns:
        Processed PIL Image
        
    Raises:
        ValueError: If parameters are invalid
    """
    ...
```

### **TypeScript (Frontend)**

**Use functional components:**
```typescript
// Good
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
};

// Avoid class components
```

**Type everything:**
```typescript
// Good
interface User {
  id: number;
  email: string;
  username: string;
}

const getUser = (id: number): User => { ... };

// Bad - no types
const getUser = (id) => { ... };
```

**Use const for immutable:**
```typescript
// Good
const API_BASE = 'http://localhost:8000';
const MAX_IMAGES = 100;

// Bad
let API_BASE = 'http://localhost:8000';
```

---

## 🔄 **Development Workflow**

### **Making Changes**

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make changes**
   - Write code
   - Test locally
   - Add console.logs for debugging

3. **Test thoroughly**
   - Test in both light and dark mode
   - Test with different image sizes
   - Test error cases

4. **Commit**
   ```bash
   git add .
   git commit -m "Add: Description of feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/my-new-feature
   ```

### **Commit Message Format**

```
Type: Short description (50 chars max)

Longer description if needed.
- Bullet points for details
- What changed and why

Fixes #123
```

**Types:**
- `Add:` - New feature
- `Fix:` - Bug fix
- `Update:` - Modify existing feature
- `Remove:` - Delete code/files
- `Refactor:` - Code restructuring
- `Docs:` - Documentation only
- `Style:` - Formatting, no code change

---

## 🧪 **Testing**

### **Backend Testing**

```bash
cd backend

# Test imports
python test_imports.py

# Test database
python debug_images.py
python debug_pipelines.py

# Test specific operation
python -c "
from app.utils.image_processing import ImageProcessor
from PIL import Image
img = Image.open('test.jpg')
# apply_operation is a classmethod: (image, operation_name, params)
result = ImageProcessor.apply_operation(img, 'Brightness', {'amount': 20})
result.save('output.jpg')
print('Success!')
"
```

### **Frontend Testing**

```bash
cd frontend

# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Build test
npm run build
```

### **Manual Testing Checklist**

- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Apply simple operation (Brightness)
- [ ] Apply complex operation (Canny)
- [ ] Live processing mode
- [ ] Batch processing mode
- [ ] Save pipeline (authenticated)
- [ ] Load pipeline
- [ ] Delete images
- [ ] Undo/redo pipeline
- [ ] Gallery modal
- [ ] Inspector view
- [ ] Admin panel (if admin)
- [ ] Google OAuth login
- [ ] Logout

---

## 🐛 **Debugging**

### **Backend Debugging**

**Enable detailed logging:**

Edit `backend/app/main.py`:
```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
```

**Add debug prints:**
```python
logger.info(f"Processing image {image_id} with {len(pipeline)} operations")
logger.debug(f"Parameters: {params}")
```

**Check logs:**
- Terminal output shows all logs
- Look for ERROR and WARNING levels

### **Frontend Debugging**

**React DevTools:**
- Install React DevTools browser extension
- Inspect component state and props
- Track re-renders

**Console logging:**
```typescript
console.log('Debug info:', { variable1, variable2 });
console.error('Error occurred:', error);
console.table(arrayOfObjects);  // Nice table format
```

**Network inspection:**
- F12 → Network tab
- See all API calls
- Check request/response payloads

---

## 📦 **Adding Dependencies**

### **Backend (Python)**

```bash
cd backend

# Install package
pip install package-name

# Add to requirements.txt
pip freeze | grep package-name >> requirements.txt

# Or manually add to requirements.txt:
echo "package-name==1.2.3" >> requirements.txt
```

### **Frontend (Node)**

```bash
cd frontend

# Install package
npm install package-name

# Automatically added to package.json
```

---

## 🗄️ **Database Migrations**

Using Alembic for schema changes:

### **Create Migration**

```bash
cd backend

# After changing models in app/models/db_models.py
alembic revision --autogenerate -m "Add new column to users"
```

### **Apply Migration**

```bash
alembic upgrade head
```

### **Rollback Migration**

```bash
alembic downgrade -1  # Go back one version
```

---

## 🎨 **UI/UX Guidelines**

### **Component Organization**

```typescript
// 1. Imports
import React, { useState } from 'react';
import { Icon } from 'lucide-react';

// 2. Types/Interfaces
interface Props {
  prop1: string;
  prop2: number;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Functions
  const handleClick = () => { ... };
  
  // 6. Effects
  useEffect(() => { ... }, []);
  
  // 7. Render
  return ( ... );
};
```

### **Styling Guidelines**

- Use Tailwind utility classes
- Follow dark mode pattern: `dark:` prefix
- Maintain consistent spacing
- Use existing color palette

**Example:**
```tsx
<div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-slate-300 dark:border-zinc-800">
  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Title</h3>
  <p className="text-sm text-slate-600 dark:text-slate-400">Description</p>
</div>
```

---

## 🔧 **Architecture Patterns**

### **Backend: Route → Service → Database**

```python
# Route (app/api/routes/images.py)
@router.post("/upload")
async def upload_image(file: UploadFile, db: Session = Depends(get_db)):
    return await ImageService.handle_upload(file, db)

# Service (app/services/image_service.py)
class ImageService:
    @staticmethod
    async def handle_upload(file: UploadFile, db: Session):
        # Business logic
        image = DatabaseService.save_image(data, db)
        return image

# Database (app/utils/database_service.py)
class DatabaseService:
    @staticmethod
    def save_image(data: dict, db: Session):
        # Database operations
        db.add(image)
        db.commit()
        return image
```

### **Frontend: Component → Hook → Service**

```typescript
// Component (components/MyComponent.tsx)
const MyComponent = () => {
  const { data, loading } = useMyData();
  return <div>{data}</div>;
};

// Hook (hooks/useMyData.ts)
const useMyData = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    ApiService.getData().then(setData);
  }, []);
  
  return { data, loading };
};

// Service (services/api.ts)
export const ApiService = {
  getData: async () => {
    const response = await fetch('/api/data');
    return response.json();
  }
};
```

---

## 🚀 **Performance Best Practices**

### **Backend**

```python
# Use async for I/O operations
async def upload_image(...):
    await async_database_operation()

# Cache expensive operations
from functools import lru_cache

@lru_cache(maxsize=128)
def get_operation_config(operation_name: str):
    return load_config(operation_name)

# Use database indexes
class User(Base):
    email = Column(String, unique=True, index=True)  # Indexed!
```

### **Frontend**

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(dependency);
}, [dependency]);

// Debounce rapid changes
const debouncedSearch = useMemo(
  () => debounce(search, 300),
  [search]
);

// Lazy load images
<img src={thumbnail} loading="lazy" />
```

---

## 📚 **Useful Commands**

### **Backend**

```bash
# List users
python list_users.py

# Reset admin password
python reset_password.py

# Clean database
python cleanup_database.py

# Backup database
python backup_database.py

# Initialize fresh database
python init_db.py
```

### **Frontend**

```bash
# Type check
npx tsc --noEmit

# Build production
npm run build

# Analyze bundle size
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

---

## 🔍 **Common Development Tasks**

### **Add New Route**

1. Create route file: `backend/app/api/routes/my_feature.py`
2. Define endpoints with FastAPI
3. Register in `backend/app/api/__init__.py`
4. Restart backend

### **Add New Component**

1. Create component: `frontend/src/components/MyComponent.tsx`
2. Export from component
3. Import where needed
4. Frontend hot-reloads automatically

### **Modify Database Schema**

1. Edit models: `backend/app/models/db_models.py`
2. Create migration: `alembic revision --autogenerate -m "description"`
3. Apply migration: `alembic upgrade head`
4. Restart backend

---

## 🆘 **Troubleshooting Development Issues**

### **Backend won't start**

Check:
- Virtual environment activated?
- All dependencies installed? (`pip install -r requirements.txt`)
- Port 8000 free? (`netstat -ano | findstr :8000`)
- .env file exists and has SECRET_KEY?

### **Frontend won't compile**

Check:
- Node modules installed? (`npm install`)
- No TypeScript errors? (`npx tsc --noEmit`)
- Port 3000 free?
- Check console for errors

### **Changes not reflecting**

Backend:
- Restart server (auto-reload only works with DEBUG=True)
- Check you edited correct file
- Check imports are correct

Frontend:
- Hard refresh browser (`Ctrl+Shift+R`)
- Check console for errors
- Restart dev server if needed

---

## 📖 **Learning Resources**

### **Backend Technologies**

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Pydantic Models](https://docs.pydantic.dev/)
- [OpenCV Python](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)
- [Scikit-Image](https://scikit-image.org/docs/stable/)

### **Frontend Technologies**

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)

---

**Happy coding! Build amazing features for PixelFlow! 🚀**
