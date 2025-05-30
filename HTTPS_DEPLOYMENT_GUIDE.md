# HTTPS Deployment Guide - Fix Google OAuth Issue

This guide will help you properly set up HTTPS for your Eterny 2.0 backend to resolve the Google OAuth "developer error" issue.

## 🎯 Problem Summary

Your Google OAuth is failing because:
1. Google requires HTTPS for production OAuth apps
2. Your backend currently uses HTTP (`http://eterny-app.ddns.net:3000`)
3. Google Console restricts apps with HTTP URLs to "Testing" status

## 🔧 Solution Overview

We'll implement a proper HTTPS solution using:
- **Let's Encrypt** for free SSL certificates
- **Nginx** as reverse proxy for SSL termination
- **Automatic certificate renewal**
- **Updated OAuth configuration**

## 📋 Prerequisites

- ✅ AWS EC2 server running (51.20.92.32)
- ✅ Domain pointing to server (eterny-app.ddns.net)
- ✅ Node.js backend deployed
- ✅ SSH access to server

## 🚀 Step-by-Step Implementation

### Step 1: Connect to Your Server

```bash
ssh -i your-key.pem ec2-user@51.20.92.32
```

### Step 2: Update AWS Security Group

In AWS Console, ensure your security group allows:
- **Port 80** (HTTP) - for Let's Encrypt verification
- **Port 443** (HTTPS) - for secure traffic  
- **Port 22** (SSH) - for server access
- **Port 3000** (Node.js) - for internal communication

### Step 3: Install Required Packages

```bash
# Update system
sudo yum update -y

# Install EPEL repository (required for certbot)
sudo yum install -y epel-release

# Install certbot and nginx
sudo yum install -y certbot python3-certbot-nginx nginx

# Verify installations
nginx -v
certbot --version
```

### Step 4: Configure Nginx

Create nginx configuration:

```bash
sudo nano /etc/nginx/conf.d/eterny.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name eterny-app.ddns.net;
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy all other traffic to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Step 5: Start Nginx

```bash
# Create web root directory
sudo mkdir -p /var/www/html

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 6: Obtain SSL Certificate

**Important**: Replace `YOUR_EMAIL@example.com` with your actual email address:

```bash
sudo certbot --nginx -d eterny-app.ddns.net --email YOUR_EMAIL@example.com --agree-tos --non-interactive
```

If successful, certbot will automatically update your nginx configuration for HTTPS.

### Step 7: Verify SSL Setup

```bash
# Check certificate status
sudo certbot certificates

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 8: Test HTTPS Access

```bash
# Test from server
curl -I https://eterny-app.ddns.net

# Should return 200 OK with SSL headers
```

### Step 9: Set Up Auto-Renewal

```bash
# Add cron job for automatic certificate renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Test renewal process
sudo certbot renew --dry-run
```

### Step 10: Update Server Code

Navigate to your app directory and pull the latest changes:

```bash
cd /home/ec2-user/Eterny2.0/server

# Pull latest changes (includes HTTPS support)
git pull origin main

# Install any new dependencies
npm install

# Restart the application
pm2 restart eterny-api

# Check status
pm2 status
pm2 logs eterny-api
```

### Step 11: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your **OAuth 2.0 client ID for backend**:
   - Client ID: `231231514086-1ltso6j58bnd6t8510tuf32j3jmbd0dk.apps.googleusercontent.com`

4. Update the settings:
   - **Authorized JavaScript origins**: 
     - Remove: `http://eterny-app.ddns.net`
     - Add: `https://eterny-app.ddns.net`
   
   - **Authorized redirect URIs**:
     - Remove: `http://eterny-app.ddns.net/auth/google/callback`
     - Add: `https://eterny-app.ddns.net/auth/google/callback`

5. **Save** the changes

6. **Publish the app** (if not already done):
   - Go to **OAuth consent screen**
   - Click **Publish App** (now possible with HTTPS URLs)

### Step 12: Build and Deploy Updated Mobile App

```bash
# On your local machine
cd /Users/CodeInvictus/Eterny2.0/app

# Clean previous builds
npx react-native clean

# Build new production APK with HTTPS URLs
cd android
./gradlew assembleRelease

# The APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Step 13: Test the Complete Setup

1. **Test HTTPS access**:
   ```bash
   curl https://eterny-app.ddns.net/auth/status
   ```

2. **Install updated APK** on your device

3. **Test OAuth flow**:
   - Open the app
   - Tap "Continue with Google"
   - Select your email
   - Should complete successfully without "developer error"

## 🔍 Verification Checklist

- [ ] `https://eterny-app.ddns.net` loads with green lock icon
- [ ] HTTP automatically redirects to HTTPS
- [ ] Google OAuth backend client uses only HTTPS URLs
- [ ] Mobile app uses HTTPS endpoints in production
- [ ] SSL certificate is valid and trusted
- [ ] OAuth flow completes without errors

## 🐛 Troubleshooting

### Certificate Issues

```bash
# Check certificate details
sudo certbot certificates

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/eterny-app.ddns.net/fullchain.pem -text -noout | grep "Not After"

# Force certificate renewal
sudo certbot renew --force-renewal
```

### Nginx Issues

```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Domain/DNS Issues

```bash
# Check if domain points to your server
nslookup eterny-app.ddns.net
# Should return: 51.20.92.32

# Check from external source
dig eterny-app.ddns.net
```

### OAuth Issues

```bash
# Test auth endpoint
curl https://eterny-app.ddns.net/auth/status

# Check server logs
pm2 logs eterny-api

# Test mobile endpoint
curl -X POST https://eterny-app.ddns.net/auth/google/mobile \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test"}'
```

### Firewall Issues

```bash
# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3000

# Check firewall status (if using firewalld)
sudo firewall-cmd --list-all
```

## 🎉 Success Indicators

When everything is working correctly:

1. ✅ `https://eterny-app.ddns.net` shows green lock icon
2. ✅ HTTP requests redirect to HTTPS automatically  
3. ✅ Google OAuth completes without "developer error"
4. ✅ Mobile app authenticates successfully
5. ✅ SSL certificate is valid for 90 days
6. ✅ Auto-renewal is configured

## 📝 Important Notes

- **Certificate Renewal**: Let's Encrypt certificates expire every 90 days but auto-renew
- **Domain Maintenance**: Keep your No-IP domain active to maintain DNS resolution
- **Server Uptime**: Keep your AWS EC2 instance running for continuous service
- **Monitoring**: Check certificate expiration dates periodically
- **Backup**: Consider backing up your SSL certificates and nginx configuration

## 🔄 Maintenance Commands

```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Check nginx status
sudo systemctl status nginx

# Check app status
pm2 status

# View app logs
pm2 logs eterny-api

# Restart app
pm2 restart eterny-api
```

## 🆘 Emergency Rollback

If something goes wrong, you can temporarily rollback:

```bash
# Stop nginx
sudo systemctl stop nginx

# Your Node.js app will be accessible on port 3000
# Update mobile app to use: http://eterny-app.ddns.net:3000

# But remember: OAuth will still fail without HTTPS
```

---

**Next Steps**: After completing this guide, your Google OAuth should work properly with HTTPS, and your mobile app will be able to authenticate users successfully. 