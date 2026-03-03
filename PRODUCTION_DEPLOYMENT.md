# 🚀 Eterny 2.0 Production Deployment Guide

This guide covers deploying Eterny 2.0 to production with optimized security and performance.

## 📋 Pre-Deployment Checklist

### ✅ Code Optimization Complete
- [x] Removed dummy login endpoint
- [x] Removed test HTML files
- [x] Removed debug buttons from UI
- [x] Made all URLs configurable via environment variables
- [x] Optimized security middleware for production
- [x] Implemented proper rate limiting
- [x] Added production-ready CORS configuration
- [x] Updated session security settings

### ✅ Environment Configuration
- [ ] Server environment variables configured
- [ ] Google OAuth credentials set up for production
- [ ] MongoDB production database ready
- [ ] SSL certificates obtained
- [ ] Domain names configured

## 🏗️ Infrastructure Setup

### 1. Server Requirements

**Minimum Requirements:**
- 2 CPU cores
- 4GB RAM
- 20GB SSD storage
- Ubuntu 20.04+ or similar Linux distribution

**Recommended for Production:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer for high availability

### 2. Domain Configuration

Set up the following subdomains:
- `api.your-domain.com` - Backend API server
- `app.your-domain.com` - Web application (if needed)
- `your-domain.com` - Main landing page

### 3. SSL Certificates

```bash
# Install Certbot for Let's Encrypt
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d api.your-domain.com
sudo certbot --nginx -d app.your-domain.com
sudo certbot --nginx -d your-domain.com
```

## 🔧 Server Deployment

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install MongoDB (or use MongoDB Atlas)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-username/eterny2.0.git
cd eterny2.0

# Install server dependencies
cd server
npm install --production

# Create environment file
cp .env.example .env
# Edit .env with your production values

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 3. Configure Nginx

Create `/etc/nginx/sites-available/eterny-api`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/eterny-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📱 React Native Production Build

### 1. Update Environment Configuration

Ensure `app/src/config/environment.ts` has correct production URLs:

```typescript
const productionConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://api.your-domain.com/api',
  SYNC_BASE_URL: 'https://api.your-domain.com/sync',
  AUTH_BASE_URL: 'https://api.your-domain.com/auth',
  GOOGLE_WEB_CLIENT_ID: 'your-production-google-client-id',
};
```

### 2. Build for Android

```bash
cd app

# Clean previous builds
npx react-native clean

# Generate release APK
cd android
./gradlew assembleRelease

# Or generate AAB for Play Store
./gradlew bundleRelease
```

### 3. Build for iOS

```bash
cd app/ios

# Install pods
pod install

# Open in Xcode and build for release
open Eterny.xcworkspace
```

## 🔐 Security Configuration

### 1. Environment Variables

Create `server/.env` with production values:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eterny

# Security
JWT_SECRET=your_64_character_production_jwt_secret_here
SESSION_SECRET=your_64_character_production_session_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GOOGLE_OAUTH_CALLBACK_URL=https://api.your-domain.com/auth/google/callback

# Server
PORT=5001
HOST=0.0.0.0
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com

# Client
CLIENT_URL=https://your-domain.com
```

### 2. MongoDB Security

```bash
# Create admin user
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Enable authentication
sudo nano /etc/mongod.conf
# Add: security.authorization: enabled

sudo systemctl restart mongod
```

### 3. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📊 Monitoring & Logging

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs eterny-api

# Monitor processes
pm2 monit

# View process info
pm2 info eterny-api
```

### 2. Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 3. Application Health Check

The API provides a health check endpoint:
```bash
curl https://api.your-domain.com/auth/status
```

## 🔄 Deployment Automation

### 1. Create Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Eterny 2.0..."

# Pull latest code
git pull origin main

# Install dependencies
cd server
npm install --production

# Restart application
pm2 restart eterny-api

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
```

### 2. Set Up GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/eterny2.0
            ./deploy.sh
```

## 🧪 Testing Production Deployment

### 1. API Health Checks

```bash
# Test API status
curl https://api.your-domain.com/auth/status

# Test CORS
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.your-domain.com/api/categories
```

### 2. Google OAuth Test

1. Visit `https://api.your-domain.com/auth/google`
2. Complete OAuth flow
3. Verify redirect to correct URL

### 3. Mobile App Testing

1. Install production APK on test device
2. Test Google Sign-In
3. Test API connectivity
4. Test Google Calendar sync

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Check `ALLOWED_ORIGINS` environment variable
2. **OAuth Redirect Mismatch**: Verify Google Console redirect URIs
3. **Database Connection**: Check MongoDB URI and network access
4. **SSL Certificate Issues**: Verify certificate installation and renewal

### Debug Commands

```bash
# Check PM2 status
pm2 status

# Check Nginx configuration
sudo nginx -t

# Check SSL certificate
openssl x509 -in /etc/letsencrypt/live/api.your-domain.com/cert.pem -text -noout

# Check MongoDB connection
mongo "mongodb+srv://cluster.mongodb.net/eterny" --username username
```

## 📈 Performance Optimization

### 1. Enable Gzip Compression

Add to Nginx configuration:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Set Up Caching

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Indexing

```javascript
// Add indexes for better performance
db.users.createIndex({ "googleId": 1 })
db.users.createIndex({ "email": 1 })
db.planneddays.createIndex({ "userId": 1, "date": 1 })
db.daytemplates.createIndex({ "userId": 1 })
```

## 🔄 Maintenance

### 1. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js dependencies
cd server && npm audit fix

# Restart application
pm2 restart eterny-api
```

### 2. SSL Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Database Backups

```bash
# Create backup script
#!/bin/bash
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/eterny" --out="/backups/$(date +%Y%m%d)"

# Set up daily backups
sudo crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

## 🎉 Deployment Complete!

Your Eterny 2.0 application is now running in production with:

- ✅ Optimized security configuration
- ✅ Production-ready rate limiting
- ✅ SSL encryption
- ✅ Google Calendar integration
- ✅ Monitoring and logging
- ✅ Automated deployment pipeline

**Next Steps:**
1. Monitor application performance
2. Set up user analytics
3. Configure automated backups
4. Plan for scaling as user base grows 