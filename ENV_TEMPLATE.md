# 🔐 Environment Configuration Template

## **Required Environment Variables**

### **📁 Server Environment (`server/.env`)**

Create a `.env` file in the `server/` directory with the following variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/eterny

# JWT Configuration (CRITICAL - Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Frontend URL (for OAuth redirects)
CLIENT_URL=http://localhost:3000

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration (optional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### **📁 Client Environment (`client/.env`)**

Create a `.env` file in the `client/` directory with:

```bash
# API Base URL
REACT_APP_API_URL=http://localhost:5001

# Google OAuth Client ID (for frontend)
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### **📁 Mobile App Environment (`app/.env`)**

Create a `.env` file in the `app/` directory with:

```bash
# API Base URL for mobile
API_BASE_URL=http://localhost:5001

# Google OAuth Configuration for mobile
GOOGLE_CLIENT_ID_MOBILE=your-google-oauth-client-id.apps.googleusercontent.com
```

## **🔑 How to Generate Secure Secrets**

### **JWT_SECRET & SESSION_SECRET**

Use one of these methods to generate secure secrets:

```bash
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 64

# Method 3: Using online generator (for development only)
# Visit: https://generate-secret.vercel.app/64
```

### **Google OAuth Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5001/auth/google/callback` (development)
   - `https://your-domain.com/auth/google/callback` (production)

## **🚀 Production Environment Variables**

### **Server Production (`server/.env.production`)**

```bash
# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eterny

# Security (Strong secrets)
JWT_SECRET=production-jwt-secret-64-chars-minimum
SESSION_SECRET=production-session-secret-64-chars-minimum

# Google OAuth (Production credentials)
GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-google-client-secret

# URLs (Production domains)
CLIENT_URL=https://eterny.your-domain.com

# Server
PORT=5001
NODE_ENV=production
```

### **Client Production (`client/.env.production`)**

```bash
REACT_APP_API_URL=https://api.eterny.your-domain.com
REACT_APP_GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
```

### **Mobile Production (`app/.env.production`)**

```bash
API_BASE_URL=https://api.eterny.your-domain.com
GOOGLE_CLIENT_ID_MOBILE=prod-google-client-id.apps.googleusercontent.com
```

## **⚠️ Security Notes**

1. **Never commit `.env` files to version control**
2. **Use different secrets for development and production**
3. **JWT secrets should be at least 32 characters long**
4. **Rotate secrets regularly in production**
5. **Use environment-specific Google OAuth credentials**

## **📋 Setup Checklist**

- [ ] Create `server/.env` with all required variables
- [ ] Create `client/.env` with API URL and Google Client ID
- [ ] Create `app/.env` with mobile-specific configuration
- [ ] Generate secure JWT_SECRET and SESSION_SECRET
- [ ] Set up Google OAuth credentials
- [ ] Test authentication flow
- [ ] Verify all API routes are protected
- [ ] Configure production environment variables 