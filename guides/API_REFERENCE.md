# API Reference

Complete reference for PixelFlow's REST API endpoints.

---

## 🌐 **Base URL**

**Development:** `http://localhost:8000`  
**Production:** `https://api.yourdomain.com`

**API Prefix:** `/api`

---

## 🔐 **Authentication**

Most endpoints require authentication via JWT token.

### **Get Token**

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "is_admin": false
  }
}
```

### **Using Token**

Include token in Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/api/endpoint
```

---

## 📁 **API Endpoints**

## **Authentication Endpoints**

### **Register New User**

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "secure_password",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {...}
}
```

### **Login**

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### **Get Current User**

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "John Doe",
  "is_admin": false,
  "oauth_provider": null,
  "profile_picture": null,
  "created_at": "2025-10-10T12:00:00Z"
}
```

### **Google OAuth Login**

```http
POST /api/auth/google
```

**Request Body:**
```json
{
  "credential": "google_jwt_token_here"
}
```

---

## 🖼️ **Image Endpoints**

### **Upload Image**

```http
POST /api/images/upload
```

**Headers:** 
- `Authorization: Bearer <token>` (optional - works for guests too)
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: Image file
- `session_id`: Session identifier

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "uuid-here",
    "filename": "photo.jpg",
    "width": 1920,
    "height": 1080,
    "format": "JPEG",
    "size_bytes": 245678
  },
  "thumbnail": "data:image/jpeg;base64,..."
}
```

### **Get Session Images**

```http
GET /api/images/session/{session_id}/images?include_data=true
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "images": [
    {
      "id": "uuid",
      "filename": "photo.jpg",
      "width": 1920,
      "height": 1080,
      "thumbnail": "data:image/jpeg;base64,...",
      "image": "data:image/jpeg;base64,..."
    }
  ]
}
```

### **Delete Image**

```http
DELETE /api/images/image/{image_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### **Session Heartbeat**

```http
POST /api/images/heartbeat
```

**Request Body:**
```json
{
  "session_id": "session_id_here"
}
```

Keeps session alive. Call every 30 seconds.

---

## 🔧 **Processing Endpoints**

### **Live Processing (Single Image)**

```http
POST /api/processing/live
```

**Headers:** `Authorization: Bearer <token>` (optional)

**Request Body:**
```json
{
  "image_id": "uuid-here",
  "pipeline": [
    {
      "name": "Brightness",
      "params": {"amount": 20}
    },
    {
      "name": "Contrast",
      "params": {"amount": 15}
    }
  ],
  "session_id": "session_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    "data:image/jpeg;base64,...",  // After step 1
    "data:image/jpeg;base64,..."   // After step 2 (final)
  ],
  "total_time": 0.156,
  "step_timings": [
    {"step_index": 0, "step_name": "Brightness", "duration": 45},
    {"step_index": 1, "step_name": "Contrast", "duration": 111}
  ]
}
```

### **Batch Processing (Multiple Images)**

Process multiple images with the same pipeline by calling live endpoint multiple times.

---

## 💾 **Pipeline Endpoints**

### **Save Pipeline**

```http
POST /api/pipelines/save
```

**Headers:** `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "name": "My Awesome Pipeline",
  "description": "Vintage photo effect",
  "pipeline_data": [
    {"name": "Brightness", "params": {"amount": 10}},
    {"name": "Sepia", "params": {}}
  ],
  "is_public": false
}
```

**Response:**
```json
{
  "success": true,
  "pipeline": {
    "id": 1,
    "name": "My Awesome Pipeline",
    "user_id": 1,
    "created_at": "2025-10-10T12:00:00Z"
  }
}
```

### **Load User's Pipelines**

```http
GET /api/pipelines/user
```

**Headers:** `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "pipelines": [
    {
      "id": 1,
      "name": "My Awesome Pipeline",
      "description": "Vintage photo effect",
      "pipeline_data": [...],
      "is_public": false,
      "created_at": "2025-10-10T12:00:00Z",
      "updated_at": "2025-10-10T13:00:00Z"
    }
  ]
}
```

### **Delete Pipeline**

```http
DELETE /api/pipelines/{pipeline_id}
```

**Headers:** `Authorization: Bearer <token>` (required)

---

## 🛠️ **Admin Endpoints**

All admin endpoints require admin privileges (`is_admin = true`).

### **Get Storage Overview**

```http
GET /api/admin/storage/overview
```

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "images": {
    "total_uploaded": 150,
    "total_processed": 450,
    "guest_images": 10,
    "user_images": 140
  },
  "storage": {
    "uploaded_size_mb": 125.5,
    "estimated_processed_mb": 150.6
  },
  "sessions": {
    "total": 25,
    "active": 3,
    "expired": 22
  }
}
```

### **Get All Users**

```http
GET /api/admin/database/users?skip=0&limit=50
```

**Response:**
```json
{
  "total": 100,
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "is_active": true,
      "is_admin": false,
      "image_count": 5,
      "pipeline_count": 3
    }
  ]
}
```

### **Get User's Images**

```http
GET /api/admin/database/users/{user_id}/images
```

**Response:**
```json
{
  "total": 5,
  "images": [
    {
      "id": "uuid",
      "filename": "photo.jpg",
      "size_mb": 2.5,
      "dimensions": "1920x1080",
      "format": "JPEG",
      "uploaded_at": "2025-10-10T12:00:00Z",
      "thumbnail_url": "data:image/jpeg;base64,..."
    }
  ]
}
```

### **Get User's Pipelines**

```http
GET /api/admin/database/users/{user_id}/pipelines
```

**Response:**
```json
{
  "total": 3,
  "pipelines": [
    {
      "id": 1,
      "name": "Vintage Effect",
      "description": "My custom pipeline",
      "operation_count": 5,
      "created_at": "2025-10-10T12:00:00Z",
      "updated_at": "2025-10-10T13:00:00Z"
    }
  ]
}
```

### **Delete User**

```http
DELETE /api/admin/database/users/{user_id}?confirm=DELETE_USER
```

Deletes user and all their data.

### **Delete Image**

```http
DELETE /api/admin/database/images/{image_id}
```

### **Delete Pipeline**

```http
DELETE /api/admin/database/pipelines/{pipeline_id}
```

### **Run Cleanup**

```http
POST /api/admin/cleanup/run
```

Runs manual cleanup of expired sessions and orphaned images.

### **Update System Settings**

```http
PUT /api/admin/settings
```

**Request Body:**
```json
{
  "guest_storage_quota_mb": 100,
  "free_user_storage_quota_mb": 1000,
  "warn_at_percentage": 80
}
```

---

## 📊 **Rate Limiting**

API endpoints are rate-limited to prevent abuse:

| Endpoint Type | Rate Limit |
|--------------|-----------|
| Authentication | 10 req/min |
| Upload | 30 req/min |
| Processing | 50 req/min |
| Admin | 30 req/min |
| Default | 100 req/min |

**Response when rate limited:**
```json
{
  "detail": "Too many requests. Please slow down and try again later."
}
```

---

## ❌ **Error Responses**

### **Standard Error Format**

```json
{
  "detail": "Error message here"
}
```

### **Common HTTP Status Codes**

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not admin/not allowed |
| 404 | Not Found | Resource doesn't exist |
| 413 | Payload Too Large | File too big |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Server error |
| 507 | Insufficient Storage | Quota exceeded |

### **Quota Exceeded Error (507)**

```json
{
  "error": "Storage quota exceeded",
  "message": "Upload would exceed your storage quota...",
  "current_mb": 45,
  "quota_mb": 50,
  "file_size_mb": 10,
  "percentage_used": 90
}
```

---

## 🔍 **API Examples**

### **Complete Upload & Process Workflow**

```python
import requests

API_BASE = "http://localhost:8000/api"
SESSION_ID = "my-session-123"

# 1. Upload image
with open("photo.jpg", "rb") as f:
    response = requests.post(
        f"{API_BASE}/images/upload",
        files={"file": f},
        data={"session_id": SESSION_ID}
    )

image_id = response.json()["image"]["id"]

# 2. Process with pipeline
pipeline = [
    {"name": "Brightness", "params": {"amount": 20}},
    {"name": "Contrast", "params": {"amount": 15}},
    {"name": "Sharpen", "params": {"amount": 1.5}}
]

response = requests.post(
    f"{API_BASE}/processing/live",
    json={
        "image_id": image_id,
        "pipeline": pipeline,
        "session_id": SESSION_ID
    }
)

# 3. Get result (base64 encoded)
result_image_base64 = response.json()["results"][-1]

# 4. Save to file
import base64
img_data = base64.b64decode(result_image_base64.split(',')[1])
with open("result.jpg", "wb") as f:
    f.write(img_data)
```

### **Authenticated Workflow**

```python
# 1. Login
response = requests.post(
    f"{API_BASE}/auth/login",
    json={
        "email": "user@example.com",
        "password": "password"
    }
)

token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Save pipeline
requests.post(
    f"{API_BASE}/pipelines/save",
    headers=headers,
    json={
        "name": "My Pipeline",
        "pipeline_data": pipeline,
        "is_public": False
    }
)

# 3. Load saved pipelines
response = requests.get(
    f"{API_BASE}/pipelines/user",
    headers=headers
)

pipelines = response.json()["pipelines"]
```

---

## 📚 **Interactive API Documentation**

PixelFlow includes auto-generated API docs:

**Swagger UI:** `http://localhost:8000/docs`
- Interactive API explorer
- Try endpoints directly
- See request/response schemas

**ReDoc:** `http://localhost:8000/redoc`
- Beautiful documentation
- Better for reading
- Includes examples

---

## 🔒 **API Security**

### **Required Headers**

```http
Content-Type: application/json
Authorization: Bearer <token>  # For authenticated endpoints
```

### **CORS**

Allowed origins configured in `backend/.env`:
```env
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### **Rate Limiting**

See rate limits section above. Headers included in response:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696867200
```

---

## 🧪 **Testing the API**

### **Using cURL**

```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Upload image
curl -X POST http://localhost:8000/api/images/upload \
  -F "file=@photo.jpg" \
  -F "session_id=test-session-123"
```

### **Using Postman**

1. Import OpenAPI spec from: `http://localhost:8000/openapi.json`
2. Create environment with `API_BASE=http://localhost:8000`
3. Test endpoints interactively

### **Using Python**

```python
import requests

# Test health
response = requests.get("http://localhost:8000/health")
print(response.json())

# Test authenticated endpoint
token = "your_token_here"
headers = {"Authorization": f"Bearer {token}"}
response = requests.get("http://localhost:8000/api/auth/me", headers=headers)
print(response.json())
```

---

## 📊 **API Response Patterns**

### **Success Response**

```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### **Error Response**

```json
{
  "detail": "Error message explaining what went wrong"
}
```

### **Validation Error**

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 🚀 **Performance Tips**

### **Optimize Uploads**

- Resize images client-side before uploading
- Use appropriate image formats (JPEG for photos, PNG for graphics)
- Compress images before upload

### **Batch Processing**

For multiple images:
- Upload all images first
- Process in parallel (multiple API calls)
- Use connection pooling

### **Caching**

- Cache user data client-side
- Cache processed results
- Use ETags for conditional requests

---

## 📚 **SDK Examples**

### **JavaScript/TypeScript**

```typescript
class PixelFlowAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    this.token = data.access_token;
    return data;
  }

  async uploadImage(file: File, sessionId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    const response = await fetch(`${this.baseUrl}/api/images/upload`, {
      method: 'POST',
      body: formData,
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
    });
    return response.json();
  }

  async processLive(imageId: string, pipeline: any[], sessionId: string) {
    const response = await fetch(`${this.baseUrl}/api/processing/live`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify({ image_id: imageId, pipeline, session_id: sessionId })
    });
    return response.json();
  }
}

// Usage
const api = new PixelFlowAPI();
await api.login('user@example.com', 'password');
const uploaded = await api.uploadImage(file, 'session-123');
const processed = await api.processLive(uploaded.image.id, pipeline, 'session-123');
```

---

## 🆘 **Common API Issues**

### **CORS Errors**

**Problem:** `No 'Access-Control-Allow-Origin' header`

**Fix:**
```env
# In backend/.env, add your frontend URL
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### **Authentication Errors**

**Problem:** `401 Unauthorized`

**Fix:**
- Check token is valid and not expired
- Include `Authorization: Bearer <token>` header
- Token expires after 30 minutes - re-login

### **File Upload Errors**

**Problem:** `413 Payload Too Large`

**Fix:**
- Image exceeds 50MB limit
- Resize image before upload
- Or increase `MAX_FILE_SIZE` in backend config

---

## 📖 **Complete Endpoint List**

### **Public Endpoints (No Auth Required)**
- `GET /` - API root
- `GET /health` - Health check
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `POST /api/images/upload` - Upload (guests allowed)
- `POST /api/processing/live` - Process (guests allowed)
- `POST /api/images/heartbeat` - Keep session alive

### **Authenticated Endpoints**
- `GET /api/auth/me` - Get current user
- `POST /api/pipelines/save` - Save pipeline
- `GET /api/pipelines/user` - Load pipelines
- `DELETE /api/pipelines/{id}` - Delete pipeline

### **Admin Endpoints**
- `GET /api/admin/storage/overview` - Storage stats
- `GET /api/admin/cleanup/stats` - Cleanup stats
- `POST /api/admin/cleanup/run` - Run cleanup
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/database/users` - List users
- `GET /api/admin/database/users/{id}/images` - User images
- `GET /api/admin/database/users/{id}/pipelines` - User pipelines
- `DELETE /api/admin/database/users/{id}` - Delete user
- `DELETE /api/admin/database/images/{id}` - Delete image
- `DELETE /api/admin/database/pipelines/{id}` - Delete pipeline

---

**Build powerful integrations with PixelFlow's API! 🚀**
