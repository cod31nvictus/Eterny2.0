# Environment Configuration Template

This file contains all the environment variables needed to run Eterny 2.0 in production.

## Server Environment Variables (.env)

Create a `.env` file in the `server/` directory with the following variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/eterny
# For production, use MongoDB Atlas or your hosted MongoDB instance:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eterny

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_change_this_in_production_minimum_32_characters

# Session Configuration  
SESSION_SECRET=your_super_secure_session_secret_here_change_this_in_production_minimum_32_characters

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_OAUTH_CALLBACK_URL=https://your-domain.com/auth/google/callback

# Server Configuration
PORT=5001
HOST=0.0.0.0
NODE_ENV=production

# CORS Configuration (comma-separated list of allowed origins)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com,https://app.your-domain.com

# Client URL for OAuth redirects
CLIENT_URL=https://your-domain.com
```

## React Native Environment Variables

For React Native production builds, set these environment variables:

```bash
# API Configuration
REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Security Notes

1. **JWT_SECRET**: Must be at least 32 characters long and cryptographically secure
2. **SESSION_SECRET**: Must be at least 32 characters long and different from JWT_SECRET
3. **Google OAuth**: Ensure your Google Console project has the correct redirect URIs configured
4. **CORS**: Only include the domains that need access to your API
5. **HTTPS**: Always use HTTPS in production for all URLs

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-domain.com/auth/google/callback`
6. Add authorized JavaScript origins:
   - `https://your-domain.com`
7. Copy the Client ID and Client Secret to your environment variables

## MongoDB Setup

### Local Development
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Production (MongoDB Atlas)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user
4. Whitelist your server IP addresses
5. Get connection string and add to MONGODB_URI

## Deployment Checklist

- [ ] All environment variables set
- [ ] Google OAuth configured with production URLs
- [ ] MongoDB accessible from production server
- [ ] HTTPS certificates configured
- [ ] CORS origins restricted to production domains
- [ ] JWT and session secrets are secure and unique
- [ ] NODE_ENV set to 'production'
- [ ] Rate limiting configured appropriately
- [ ] Error logging configured

## Example Production URLs

Replace `your-domain.com` with your actual domain:

- **API Server**: `https://api.your-domain.com`
- **Web App**: `https://app.your-domain.com` 
- **OAuth Callback**: `https://api.your-domain.com/auth/google/callback`
- **Google Calendar Sync**: `https://api.your-domain.com/sync/*` 