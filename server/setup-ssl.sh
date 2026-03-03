#!/bin/bash

# Eterny 2.0 SSL Setup Script
# This script sets up SSL certificates using Let's Encrypt for eterny-app.ddns.net

echo "🔐 Setting up SSL certificates for Eterny 2.0..."
echo "📍 Domain: eterny-app.ddns.net"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
yum update -y

# Install EPEL repository (required for certbot on Amazon Linux)
echo "📦 Installing EPEL repository..."
yum install -y epel-release

# Install certbot and nginx
echo "📦 Installing certbot and nginx..."
yum install -y certbot python3-certbot-nginx nginx

# Create nginx configuration for eterny-app.ddns.net
echo "⚙️  Creating nginx configuration..."
cat > /etc/nginx/conf.d/eterny.conf << 'EOF'
server {
    listen 80;
    server_name eterny-app.ddns.net;
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS (will be added after SSL setup)
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
EOF

# Create web root directory
mkdir -p /var/www/html

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Start and enable nginx
echo "🚀 Starting nginx..."
systemctl start nginx
systemctl enable nginx

# Open firewall ports
echo "🔥 Configuring firewall..."
# Check if firewalld is running
if systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "✅ Firewall configured (firewalld)"
elif command -v ufw &> /dev/null; then
    ufw allow 80
    ufw allow 443
    echo "✅ Firewall configured (ufw)"
else
    echo "⚠️  No firewall detected. Make sure ports 80 and 443 are open in AWS Security Group"
fi

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
echo "📧 You'll need to provide an email address for certificate notifications"
echo ""

certbot --nginx -d eterny-app.ddns.net --non-interactive --agree-tos --email your-email@example.com --redirect

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Update nginx config to proxy to Node.js app on HTTPS
    cat > /etc/nginx/conf.d/eterny.conf << 'EOF'
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
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
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
        
        # Increase timeouts for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    
    # Set up automatic renewal
    echo "⏰ Setting up automatic certificate renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    echo ""
    echo "🎉 SSL setup completed successfully!"
    echo "🌐 Your app is now available at: https://eterny-app.ddns.net"
    echo "🔄 HTTP traffic will automatically redirect to HTTPS"
    echo "⏰ Certificates will auto-renew every 12 hours"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your Google OAuth settings to use HTTPS URLs"
    echo "2. Restart your Node.js application: pm2 restart eterny-api"
    echo "3. Test OAuth functionality with the mobile app"
    
else
    echo "❌ Failed to obtain SSL certificate"
    echo "📝 Common issues:"
    echo "   - Domain not pointing to this server"
    echo "   - Firewall blocking port 80"
    echo "   - DNS propagation not complete"
    echo ""
    echo "🔍 Check domain resolution: nslookup eterny-app.ddns.net"
    echo "🔍 Check if port 80 is accessible from outside"
    exit 1
fi

echo ""
echo "🔧 SSL setup script completed!" 