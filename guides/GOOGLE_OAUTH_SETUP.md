# Google OAuth Setup Guide

Step-by-step guide to enable Google Sign-In for PixelFlow.

---

## 🎯 **Why Enable Google OAuth?**

Benefits:
- ✅ Users can sign in with their Google account
- ✅ No password to remember
- ✅ More secure (Google handles authentication)
- ✅ Faster registration process
- ✅ Profile pictures automatically imported

---

## 📋 **Prerequisites**

- Google account
- PixelFlow backend and frontend running locally
- 15 minutes of setup time

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. **Project name**: `PixelFlow`
4. Click **"Create"**
5. Wait for project creation (30 seconds)

### **Step 2: Enable Google+ API**

1. In Google Cloud Console, select your PixelFlow project
2. Go to **"APIs & Services"** → **"Library"**
3. Search for **"Google+ API"**
4. Click on it → Click **"Enable"**
5. Wait for activation

### **Step 3: Create OAuth Credentials**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure consent screen first:
   - Click **"Configure Consent Screen"**
   - Choose **"External"** (for testing)
   - **App name**: `PixelFlow`
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **"Save and Continue"**
   - Skip "Scopes" → Click **"Save and Continue"**
   - Add test users (your email) → Click **"Save and Continue"**
   - Click **"Back to Dashboard"**

4. Now create OAuth client:
   - Go back to **"Credentials"**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - **Application type**: `Web application`
   - **Name**: `PixelFlow Web Client`

5. **Add Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   ```

6. **Add Authorized redirect URIs:**
   ```
   http://localhost:3000
   http://localhost:3000/auth
   http://localhost:8000/api/auth/google/callback
   ```

7. Click **"Create"**

8. **IMPORTANT**: Copy the credentials shown:
   - **Client ID**: `12345-abcdef.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx`

---

### **Step 4: Configure PixelFlow Backend**

Edit `backend/.env`:

```env
# Add these lines (replace with your actual credentials)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here
```

**Save the file** and **restart backend**:

```bash
# Stop backend (Ctrl+C)
python run.py
```

---

### **Step 5: Configure PixelFlow Frontend**

Edit `frontend/.env`:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

**Save the file** and **restart frontend**:

```bash
# Stop frontend (Ctrl+C)
npm start
```

---

### **Step 6: Test Google Sign-In**

1. Go to `http://localhost:3000/auth`
2. You should see **"Sign in with Google"** button
3. Click it
4. Select your Google account
5. Grant permissions
6. You should be redirected to the app, logged in!

---

## ✅ **Verification**

After signing in with Google, verify:

**In Frontend:**
- [ ] User menu shows your Google profile picture
- [ ] Username matches your Google name
- [ ] Can save and load pipelines

**In Backend Database:**
```bash
python list_users.py
```

Should show your user with:
- `oauth_provider: google`
- `oauth_id: [your Google ID]`

---

## 🔧 **Troubleshooting**

### **Problem: "Sign in with Google" button doesn't appear**

**Check:**
1. `REACT_APP_GOOGLE_CLIENT_ID` is set in `frontend/.env`
2. Frontend was restarted after adding the env variable
3. Browser console for JavaScript errors

**Fix:**
```bash
# Restart frontend
cd frontend
npm start
```

### **Problem: "Invalid client" error**

**Check:**
1. Client ID in frontend `.env` matches Google Cloud Console
2. Client ID is the full string (ends with `.apps.googleusercontent.com`)
3. No extra spaces or quotes in .env file

### **Problem: "Redirect URI mismatch"**

**Check in Google Cloud Console:**
1. Authorized JavaScript origins includes `http://localhost:3000`
2. Authorized redirect URIs includes all three:
   - `http://localhost:3000`
   - `http://localhost:3000/auth`
   - `http://localhost:8000/api/auth/google/callback`

**Fix:**
- Add missing URIs in Google Cloud Console
- Wait 5 minutes for changes to propagate
- Try again

### **Problem: "Access blocked: This app hasn't been verified"**

**For Development:**
- Click **"Advanced"** → **"Go to PixelFlow (unsafe)"**
- This is normal for apps in testing mode

**For Production:**
- Submit app for Google verification
- Or add users to "Test users" list in OAuth consent screen

---

## 🔐 **Security Best Practices**

### **Development**

✅ **DO:**
- Use localhost URLs
- Keep credentials in .env (not in code)
- Add .env to .gitignore

❌ **DON'T:**
- Commit credentials to GitHub
- Share your client secret publicly
- Use the same credentials for production

### **Production**

1. **Create separate OAuth client** for production
2. **Use production URLs** in authorized origins:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
3. **Submit for Google verification** (if public app)
4. **Rotate client secret** regularly

---

## 📊 **OAuth Flow Explained**

Here's what happens when a user clicks "Sign in with Google":

```
1. User clicks button
   ↓
2. Redirected to Google login
   ↓
3. User selects Google account
   ↓
4. User grants permissions
   ↓
5. Google redirects back to PixelFlow with auth code
   ↓
6. PixelFlow backend exchanges code for user info
   ↓
7. Backend creates/updates user in database
   ↓
8. Backend generates JWT token
   ↓
9. Frontend stores token and logs user in
   ↓
10. User is now authenticated!
```

---

## 🌐 **Production Deployment**

When deploying to production (e.g., `https://pixelflow.yourdomain.com`):

### **Step 1: Create New OAuth Client**

- **Don't reuse** development credentials
- Create new OAuth client in Google Cloud Console
- Use production URLs

### **Step 2: Update Authorized URLs**

**JavaScript origins:**
```
https://pixelflow.yourdomain.com
https://www.pixelflow.yourdomain.com
```

**Redirect URIs:**
```
https://pixelflow.yourdomain.com
https://pixelflow.yourdomain.com/auth
https://api.pixelflow.yourdomain.com/api/auth/google/callback
```

### **Step 3: Update Production Environment**

```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
CORS_ORIGINS=https://pixelflow.yourdomain.com
```

---

## 🔑 **Managing OAuth Credentials**

### **Store Securely**

**Development:**
- Keep in `.env` file (gitignored)
- Never commit to version control

**Production:**
- Use environment variables
- Use secrets management (AWS Secrets Manager, etc.)
- Rotate credentials every 90 days

### **Multiple Environments**

Create separate OAuth clients for:
- **Development**: localhost URLs
- **Staging**: staging.yourdomain.com
- **Production**: yourdomain.com

This prevents cross-contamination and improves security.

---

## 📱 **Additional OAuth Providers**

Want to add more sign-in options?

PixelFlow supports:
- Google (built-in)
- GitHub (code structure ready)
- Facebook (easy to add)
- Microsoft (easy to add)

See: [guides/ADDING_OAUTH_PROVIDERS.md](ADDING_OAUTH_PROVIDERS.md) for instructions.

---

## 📚 **Related Resources**

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Explained](https://oauth.net/2/)

---

## ✅ **Checklist**

Before going to production:

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API  
- [ ] Created OAuth client
- [ ] Added production URLs to authorized origins
- [ ] Configured backend .env with credentials
- [ ] Configured frontend .env with client ID
- [ ] Tested sign-in flow
- [ ] Verified user creation in database
- [ ] Set up credential rotation schedule
- [ ] Documented credentials location securely

---

**Google OAuth is now enabled! Users can sign in with one click! 🎉**
