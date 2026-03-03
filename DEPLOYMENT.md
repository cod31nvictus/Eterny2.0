# 🚀 Eterny 2.0 Deployment Guide

## **📋 Pre-Deployment Checklist**

### **Environment Setup**
- [ ] Create production `.env` files for all components
- [ ] Set up MongoDB Atlas database
- [ ] Configure Google OAuth for production domain
- [ ] Generate secure JWT secrets
- [ ] Set up domain and SSL certificates

### **Security Verification**
- [ ] All API routes protected with authentication
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Environment variables secured

## **🏗️ Deployment Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web     │    │  React Native   │    │   Node.js API   │
│   (Frontend)    │    │    (Mobile)     │    │   (Backend)     │
│                 │    │                 │    │                 │
│ Port: 3000      │    │ Expo/RN Build   │    │ Port: 5001      │
│ Build: Static   │    │ APK/IPA         │    │ PM2 Process     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Atlas         │
                    │   (Database)    │
                    └─────────────────┘
```

## **🔧 Production Scripts**

### **1. Server Deployment Script**

Create `server/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Eterny Server Deployment..."

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file with production variables"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --only=production

# Run database migrations/seeds if needed
echo -e "${YELLOW}🗄️ Setting up database...${NC}"
# Add any migration scripts here

# Build application (if needed)
echo -e "${YELLOW}🔨 Building application...${NC}"
# Add build steps if needed

# Stop existing PM2 process
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
pm2 stop eterny-api || true

# Start with PM2
echo -e "${YELLOW}🚀 Starting server with PM2...${NC}"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Server deployment completed!${NC}"
echo -e "${GREEN}🌐 Server running on port 5001${NC}"
```

### **2. Client Deployment Script**

Create `client/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Eterny Client Deployment..."

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please create .env.production file with production variables"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Build for production
echo -e "${YELLOW}🔨 Building for production...${NC}"
npm run build

# Deploy to static hosting (example for Netlify)
echo -e "${YELLOW}🌐 Deploying to hosting...${NC}"
# netlify deploy --prod --dir=build
# Or copy to your web server:
# rsync -avz build/ user@server:/var/www/eterny/

echo -e "${GREEN}✅ Client deployment completed!${NC}"
echo -e "${GREEN}🌐 Client available at your domain${NC}"
```

### **3. Mobile App Build Script**

Create `app/build.sh`:

```bash
#!/bin/bash

echo "📱 Starting Eterny Mobile App Build..."

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please create .env.production file with production variables"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Build for Android
echo -e "${YELLOW}🤖 Building Android APK...${NC}"
npx react-native build-android --mode=release

# Build for iOS (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}🍎 Building iOS IPA...${NC}"
    npx react-native build-ios --mode=release
else
    echo -e "${YELLOW}⏭️ Skipping iOS build (not on macOS)${NC}"
fi

echo -e "${GREEN}✅ Mobile app build completed!${NC}"
echo -e "${GREEN}📱 APK/IPA files ready for distribution${NC}"
```

## **⚙️ PM2 Configuration**

Create `server/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'eterny-api',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

## **🐳 Docker Configuration**

### **Server Dockerfile**

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/ping || exit 1

# Start application
CMD ["node", "src/index.js"]
```

### **Client Dockerfile**

Create `client/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### **Docker Compose**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: ./server
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./server/.env
    depends_on:
      - mongodb
    restart: unless-stopped

  web:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

## **🌐 Nginx Configuration**

Create `client/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Handle React Router
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (if needed)
        location /api {
            proxy_pass http://api:5001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## **📊 Monitoring & Logging**

### **PM2 Monitoring**

```bash
# View logs
pm2 logs eterny-api

# Monitor processes
pm2 monit

# Restart application
pm2 restart eterny-api

# View process info
pm2 info eterny-api
```

### **Health Check Endpoint**

The `/ping` endpoint provides health status:

```bash
curl http://your-domain.com:5001/ping
```

## **🔒 Security Checklist**

- [ ] **Environment Variables**: All secrets in `.env` files
- [ ] **HTTPS**: SSL certificates configured
- [ ] **Firewall**: Only necessary ports open
- [ ] **Database**: MongoDB secured with authentication
- [ ] **Rate Limiting**: Configured for all endpoints
- [ ] **CORS**: Restricted to allowed origins
- [ ] **Headers**: Security headers enabled
- [ ] **Updates**: Dependencies regularly updated

## **🚀 Quick Deployment Commands**

```bash
# Full deployment
./deploy-all.sh

# Server only
cd server && ./deploy.sh

# Client only
cd client && ./deploy.sh

# Mobile build
cd app && ./build.sh

# Docker deployment
docker-compose up -d --build
```

## **📱 Mobile App Distribution**

### **Android (Google Play Store)**
1. Build signed APK: `cd app && ./build.sh`
2. Upload to Google Play Console
3. Configure app listing and screenshots
4. Submit for review

### **iOS (App Store)**
1. Build IPA: `cd app && ./build.sh` (macOS only)
2. Upload to App Store Connect
3. Configure app metadata
4. Submit for review

### **Direct Distribution**
- Host APK file for direct download
- Use Firebase App Distribution
- TestFlight for iOS beta testing 