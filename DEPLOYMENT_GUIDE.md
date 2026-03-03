# Eterny 2.0 Deployment Guide

## Overview
This guide will help you deploy your React Native app using free tools and services. We'll cover both backend deployment (AWS) and mobile app distribution.

## Prerequisites
- ✅ React Native app (Eterny 2.0) - **COMPLETED**
- ✅ Node.js backend - **COMPLETED**
- ✅ Git repository on GitHub - **COMPLETED**

---

## Phase 1: Backend Deployment (AWS Free Tier)

### Step 1: AWS Account Setup
**Goal**: Create AWS account and set up basic security

**Tasks**:
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Fill in email, password, and account name
4. Provide payment method (required but won't be charged on free tier)
5. Verify phone number
6. Choose "Basic Support - Free"

**What you'll get**:
- 12 months free tier access
- EC2 t2.micro instance (750 hours/month)
- RDS free tier
- S3 free storage

**⚠️ STOP HERE** - Complete this step and confirm you can log into AWS Console before proceeding.

---

### Step 2: EC2 Instance Setup
**Goal**: Create a virtual server to run your Node.js backend

**Tasks**:
1. In AWS Console, go to EC2 service
2. Click "Launch Instance"
3. Choose "Amazon Linux 2023 AMI" (free tier eligible)
4. Select "t2.micro" instance type
5. Create new key pair (download .pem file - KEEP IT SAFE!)
6. Configure security group:
   - SSH (port 22) - Your IP only
   - HTTP (port 80) - Anywhere
   - HTTPS (port 443) - Anywhere
   - Custom TCP (port 3000) - Anywhere (for Node.js)
7. Launch instance

**⚠️ STOP HERE** - Wait for instance to be "running" and note down the public IP address.

---

### Step 3: Connect to Your Server
**Goal**: Access your server via SSH

**Tasks**:
1. Open Terminal
2. Navigate to where you downloaded the .pem file
3. Run: `chmod 400 your-key-name.pem`
4. Connect: `ssh -i your-key-name.pem ec2-user@YOUR-PUBLIC-IP`

**⚠️ STOP HERE** - Confirm you can successfully SSH into your server.

---

### Step 4: Server Environment Setup
**Goal**: Install Node.js, Git, and PM2 on your server

**Tasks** (run these commands on your EC2 instance):
```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 globally (process manager)
sudo npm install -g pm2

# Verify installations
node --version
npm --version
git --version
pm2 --version
```

**⚠️ STOP HERE** - Confirm all installations are successful.

---

### Step 5: Deploy Backend Code
**Goal**: Clone and run your Node.js backend

**Tasks** (on EC2 instance):
```bash
# Clone your repository
git clone https://github.com/cod31nvictus/Eterny2.0.git
cd Eterny2.0/backend

# Install dependencies
npm install

# Create production environment file
sudo nano .env.production
```

**Environment Variables to add**:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**⚠️ STOP HERE** - We need to set up MongoDB first before proceeding.

---

### Step 6: MongoDB Setup (MongoDB Atlas - Free)
**Goal**: Set up free cloud database

**Tasks**:
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create new project "Eterny2.0"
4. Build a cluster (choose FREE M0 tier)
5. Choose AWS as cloud provider
6. Select region closest to your EC2 instance
7. Create cluster (takes 3-5 minutes)
8. Create database user with username/password
9. Add IP address: 0.0.0.0/0 (allow from anywhere)
10. Get connection string

**⚠️ STOP HERE** - Get your MongoDB connection string and update the .env.production file.

---

### Step 7: Start Backend Service
**Goal**: Run your backend with PM2

**Tasks** (on EC2 instance):
```bash
# Navigate to backend directory
cd ~/Eterny2.0/backend

# Start with PM2
pm2 start npm --name "eterny-backend" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it gives you (copy and run the sudo command)

# Check status
pm2 status
```

**⚠️ STOP HERE** - Confirm your backend is running by visiting `http://YOUR-EC2-IP:3000` in browser.

---

## Phase 2: Mobile App Build (APK Creation)

### Step 8: Prepare App for Production
**Goal**: Update app configuration for production

**Tasks**:
1. Update API endpoints in your React Native app
2. Update app version and build number
3. Generate signed APK

**⚠️ STOP HERE** - We'll configure this step by step.

---

### Step 9: Generate Signed APK
**Goal**: Create production-ready APK

**Tasks**:
1. Generate signing key
2. Configure Gradle
3. Build release APK

**⚠️ STOP HERE** - This requires several sub-steps we'll do together.

---

### Step 10: App Distribution
**Goal**: Distribute your APK

**Options**:
- Google Play Store (requires $25 one-time fee)
- Direct APK distribution
- Firebase App Distribution (free)

---

## Phase 3: Domain Setup for Google OAuth

### Step 10: Get a Free Domain (Required for Google OAuth)

**Problem**: Google OAuth doesn't accept IP addresses in JavaScript origins
**Solution**: Get a free domain name

#### Option A: Freenom (Free .tk, .ml, .ga domains)
1. Go to [freenom.com](https://freenom.com)
2. Search for available domain (e.g., `eterny-app.tk`)
3. Register for free (12 months)
4. Point domain to your server IP: `51.20.92.32`

#### Option B: No-IP Dynamic DNS (Free subdomain)
1. Go to [noip.com](https://noip.com)
2. Create free account
3. Create hostname like `eterny-app.ddns.net`
4. Point to IP: `51.20.92.32`

#### Option C: Use Ngrok (Temporary for testing)
```bash
# Install ngrok
npm install -g ngrok

# Tunnel to your server
ngrok http 51.20.92.32:3000
```

### Step 11: Update Google OAuth Settings
Once you have a domain:

**JavaScript Origins**:
- `https://your-domain.com`
- `http://your-domain.com` (for development)

**Authorized Redirect URIs**:
- `https://your-domain.com/auth/google/callback`
- `http://your-domain.com/auth/google/callback`

### Step 12: Update Your App Configuration
Update `environment.ts` with your new domain:
```typescript
const productionConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://your-domain.com/api',
  SYNC_BASE_URL: 'https://your-domain.com/sync',
  AUTH_BASE_URL: 'https://your-domain.com/auth',
  GOOGLE_WEB_CLIENT_ID: 'your-client-id',
};
```

---

## Cost Breakdown (All Free Tier)

| Service | Cost | Duration |
|---------|------|----------|
| AWS EC2 t2.micro | Free | 12 months |
| MongoDB Atlas M0 | Free | Forever |
| AWS data transfer | Free | 15GB/month |
| Domain (optional) | Free | 1 year (.tk/.ml) |
| SSL Certificate | Free | Forever |

**Total Monthly Cost**: $0 (within free tier limits)

---

## Next Steps

Let's start with **Step 1: AWS Account Setup**. 

Please complete this step and let me know when you have:
1. ✅ Created AWS account
2. ✅ Can log into AWS Console
3. ✅ Have access to EC2 service

Then we'll move to Step 2! 