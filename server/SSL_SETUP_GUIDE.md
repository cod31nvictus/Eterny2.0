# SSL Setup Guide for Eterny 2.0

This guide will help you set up HTTPS for your Eterny 2.0 backend to fix the Google OAuth issue.

## Prerequisites
- SSH access to your AWS EC2 server (51.20.92.32)
- Domain `eterny-app.ddns.net` pointing to your server
- Ports 80 and 443 open in AWS Security Group

## Step 1: Connect to Your Server
```bash
ssh -i your-key.pem ec2-user@51.20.92.32
```

## Step 2: Install Required Packages
```bash
# Update system
sudo yum update -y

# Install EPEL repository
sudo yum install -y epel-release

# Install certbot and nginx
sudo yum install -y certbot python3-certbot-nginx nginx
```

## Step 3: Configure AWS Security Group
In AWS Console, ensure your security group allows:
- Port 80 (HTTP) - for Let's Encrypt verification
- Port 443 (HTTPS) - for secure traffic
- Port 22 (SSH) - for server access

## Step 4: Create Nginx Configuration
```bash
# Create nginx config file
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
    
    # Proxy to Node.js app
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
    }
}
```

## Step 5: Start Nginx
```bash
# Create web root directory
sudo mkdir -p /var/www/html

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 6: Obtain SSL Certificate
```bash
# Replace YOUR_EMAIL with your actual email address
sudo certbot --nginx -d eterny-app.ddns.net --email YOUR_EMAIL@example.com --agree-tos --non-interactive
```

## Step 7: Update Nginx for HTTPS
After successful certificate installation, update the nginx config:
```bash
sudo nano /etc/nginx/conf.d/eterny.conf
```

Replace with this HTTPS configuration:
```nginx
server {
    listen 80;
    server_name eterny-app.ddns.net;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eterny-app.ddns.net;
    
    ssl_certificate /etc/letsencrypt/live/eterny-app.ddns.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eterny-app.ddns.net/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
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
    }
}
```

## Step 8: Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: Set Up Auto-Renewal
```bash
# Add cron job for automatic certificate renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

## Step 10: Update Environment Variables
```bash
# Navigate to your app directory
cd /home/ec2-user/Eterny2.0/server

# Update environment variables
nano .env
```

Add these lines to your `.env` file:
```
SSL_KEY_PATH=/etc/letsencrypt/live/eterny-app.ddns.net/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/eterny-app.ddns.net/fullchain.pem
HTTPS_PORT=443
```

## Step 11: Deploy Updated Server Code
```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart the application
pm2 restart eterny-api
```

## Step 12: Update Google OAuth Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 client ID for backend
4. Update the settings:
   - **Authorized JavaScript origins**: `https://eterny-app.ddns.net`
   - **Authorized redirect URIs**: `https://eterny-app.ddns.net/auth/google/callback`
5. Remove any HTTP URLs
6. Save the changes

## Step 13: Test the Setup
1. Visit `https://eterny-app.ddns.net` in your browser
2. You should see a secure connection (lock icon)
3. Test OAuth in your mobile app

## Troubleshooting

### Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

### Nginx Issues
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Domain Issues
```bash
# Check if domain points to your server
nslookup eterny-app.ddns.net

# Should return your server IP: 51.20.92.32
```

### Firewall Issues
```bash
# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## Success Indicators
- ✅ `https://eterny-app.ddns.net` loads with green lock icon
- ✅ HTTP automatically redirects to HTTPS
- ✅ Google OAuth works without "developer error"
- ✅ Mobile app can authenticate successfully

## Important Notes
- SSL certificates auto-renew every 90 days
- Keep your server and domain active to maintain certificates
- Monitor certificate expiration dates
- Always test OAuth after any SSL changes 