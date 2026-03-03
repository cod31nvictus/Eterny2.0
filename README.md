# 🌟 Eterny 2.0 - Wellness Time Management Platform

> **Transform your daily routine into a wellness journey with intelligent time blocking and comprehensive analytics.**

![Eterny 2.0](https://img.shields.io/badge/Version-2.0-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.72-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📱 Applications](#-applications)
- [🔧 Development](#-development)
- [🔐 Security](#-security)
- [🚀 Deployment](#-deployment)
- [📊 Analytics](#-analytics)
- [🤝 Contributing](#-contributing)

## 🎯 Overview

Eterny 2.0 is a comprehensive wellness time management platform that helps users organize their daily activities through intelligent time blocking, wellness categorization, and detailed analytics. The platform consists of three main applications:

- **📱 Mobile App** (React Native) - Real-time activity tracking and quick access
- **💻 Web App** (React) - Comprehensive planning and analytics dashboard  
- **🔧 API Server** (Node.js/Express) - Centralized data management and authentication

## ✨ Features

### 🎯 **Core Functionality**
- **Time Blocking**: Create and manage time blocks for daily activities
- **Wellness Categories**: Organize activities by wellness dimensions (Physical, Mental, Social, etc.)
- **Day Templates**: Create reusable daily schedules
- **Calendar Integration**: Plan and visualize your wellness journey
- **Real-time Tracking**: Live countdown and activity monitoring

### 📊 **Analytics & Insights**
- **Wellness Summaries**: Track time spent in each wellness category
- **Trend Analysis**: Visualize wellness patterns over time
- **Quick Stats**: Instant overview of daily/weekly progress
- **Category Breakdown**: Detailed analysis of activity distribution

### 🔐 **Security & Authentication**
- **Google OAuth**: Secure authentication with Google accounts
- **JWT Tokens**: Stateless authentication for API access
- **Rate Limiting**: Protection against abuse and spam
- **CORS Protection**: Secure cross-origin resource sharing

### 📱 **Mobile Experience**
- **Tab + Drawer Navigation**: Intuitive mobile navigation architecture
- **Real-time Updates**: Live activity tracking with countdown timers
- **Offline Support**: Continue planning even without internet
- **Push Notifications**: Stay on track with activity reminders

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ETERNY 2.0 ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   React Web     │    │  React Native   │    │  Node.js    │  │
│  │   Frontend      │    │   Mobile App    │    │   API       │  │
│  │                 │    │                 │    │             │  │
│  │ • Dashboard     │    │ • Now View      │    │ • Auth      │  │
│  │ • Analytics     │    │ • Today View    │    │ • CRUD      │  │
│  │ • Planning      │    │ • Reports       │    │ • Security  │  │
│  │ • Configuration │    │ • Settings      │    │ • Analytics │  │
│  │                 │    │                 │    │             │  │
│  │ Port: 3000      │    │ Expo/RN Build   │    │ Port: 5001  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                       │     │
│           └───────────────────────┼───────────────────────┘     │
│                                   │                             │
│                      ┌─────────────────┐                        │
│                      │   MongoDB       │                        │
│                      │   Database      │                        │
│                      │                 │                        │
│                      │ • Users         │                        │
│                      │ • Categories    │                        │
│                      │ • Activities    │                        │
│                      │ • Templates     │                        │
│                      │ • Calendar      │                        │
│                      └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 🗂️ **Project Structure**

```
Eterny2.0/
├── 📱 app/                    # React Native Mobile App
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── screens/          # App screens (Now, Today, Reports)
│   │   ├── navigation/       # Tab + Drawer navigation
│   │   ├── services/         # API integration
│   │   └── types/           # TypeScript definitions
│   ├── package.json
│   └── webpack.config.js     # Web build configuration
│
├── 💻 client/                 # React Web Application
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API services
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── 🔧 server/                 # Node.js API Server
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth & security
│   │   ├── services/        # Business logic
│   │   └── config/         # Database & auth config
│   ├── package.json
│   └── ecosystem.config.js   # PM2 configuration
│
├── 📚 shared/                 # Shared types and utilities
├── 📋 Tasks.md               # Development tasks
├── 🏗️ Architecture.md        # Technical architecture
├── 🔐 ENV_TEMPLATE.md        # Environment setup guide
├── 🚀 DEPLOYMENT.md          # Deployment instructions
└── 📖 README.md              # This file
```

## 🚀 Quick Start

### 📋 **Prerequisites**

- **Node.js** 18.x or higher
- **MongoDB** 6.x (local or Atlas)
- **Google OAuth** credentials
- **Git** for version control

### ⚡ **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Eterny2.0.git
   cd Eterny2.0
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   
   # Install mobile app dependencies
   cd ../app && npm install
   ```

3. **Environment setup**
   ```bash
   # Follow the ENV_TEMPLATE.md guide to create:
   # - server/.env
   # - client/.env
   # - app/.env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start API server
   cd server && npm run dev
   
   # Terminal 2: Start web client
   cd client && npm start
   
   # Terminal 3: Start mobile app
   cd app && npm start
   ```

5. **Access applications**
   - **API Server**: http://localhost:5001
   - **Web App**: http://localhost:3000
   - **Mobile App**: http://localhost:3001 (web) or Expo app

## 📱 Applications

### 🌐 **Web Application** (`client/`)

**Features:**
- 📊 Comprehensive analytics dashboard
- 📅 Calendar planning and visualization
- ⚙️ Configuration management
- 📈 Wellness trend analysis
- 🎯 Goal setting and tracking

**Tech Stack:**
- React 18 with TypeScript
- Material-UI for components
- React Router for navigation
- Axios for API communication
- Chart.js for analytics

### 📱 **Mobile Application** (`app/`)

**Features:**
- ⏰ Real-time "Now" view with countdown
- 📅 "Today" timeline with Gantt-style layout
- 📊 Quick wellness reports
- 🔄 Pull-to-refresh functionality
- 🎨 Modern tab + drawer navigation

**Tech Stack:**
- React Native with TypeScript
- React Navigation 6
- AsyncStorage for local data
- React Native Vector Icons
- Custom UI components

### 🔧 **API Server** (`server/`)

**Features:**
- 🔐 JWT-based authentication
- 🛡️ Rate limiting and security headers
- 📊 Comprehensive analytics endpoints
- 🗄️ MongoDB data management
- 🔄 Real-time data synchronization

**Tech Stack:**
- Node.js with Express
- MongoDB with Mongoose
- Passport.js for OAuth
- JWT for authentication
- Helmet for security

## 🔧 Development

### 🛠️ **Development Commands**

```bash
# Server development
cd server
npm run dev          # Start with nodemon
npm start           # Production start
npm test            # Run tests

# Client development  
cd client
npm start           # Development server
npm run build       # Production build
npm test            # Run tests

# Mobile development
cd app
npm start           # Start Expo/Metro
npm run web         # Web development
npm run build       # Production build
```

### 🧪 **Testing**

```bash
# Run all tests
npm run test:all

# Component tests
npm run test:components

# API tests
npm run test:api

# E2E tests
npm run test:e2e
```

### 🔍 **Code Quality**

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## 🔐 Security

### 🛡️ **Security Features**

- **Authentication**: Google OAuth 2.0 with JWT tokens
- **Authorization**: Route-level protection with middleware
- **Rate Limiting**: Configurable limits for API endpoints
- **CORS Protection**: Restricted cross-origin access
- **Security Headers**: Helmet.js for HTTP security
- **Input Validation**: Mongoose schema validation
- **Error Handling**: Secure error responses

### 🔑 **Environment Variables**

Critical security configurations:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
MONGODB_URI=mongodb://localhost:27017/eterny
```

## 🚀 Deployment

### 🌐 **Production Deployment**

1. **Environment Setup**
   - Create production `.env` files
   - Set up MongoDB Atlas
   - Configure domain and SSL

2. **Server Deployment**
   ```bash
   cd server
   npm ci --only=production
   pm2 start ecosystem.config.js --env production
   ```

3. **Client Deployment**
   ```bash
   cd client
   npm ci && npm run build
   # Deploy build/ to static hosting
   ```

4. **Mobile App Build**
   ```bash
   cd app
   npm ci
   npx react-native build-android --mode=release
   ```

### 🐳 **Docker Deployment**

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 Analytics

### 📈 **Wellness Metrics**

- **Time Distribution**: Track time across wellness categories
- **Daily Patterns**: Identify optimal activity scheduling
- **Weekly Trends**: Monitor wellness consistency
- **Goal Progress**: Track achievement of wellness goals

### 🎯 **Key Performance Indicators**

- **Wellness Balance**: Even distribution across categories
- **Consistency Score**: Regular activity completion
- **Productivity Index**: Efficient time utilization
- **Satisfaction Rating**: User-reported wellness levels

## 🤝 Contributing

### 🔄 **Development Workflow**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📝 **Coding Standards**

- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code formatting
- **Prettier**: Automated code formatting
- **Conventional Commits**: Standardized commit messages

### 🐛 **Bug Reports**

Please use the GitHub issue tracker to report bugs. Include:
- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **MongoDB** for the flexible database
- **Google** for OAuth authentication
- **Open Source Community** for countless libraries

---

<div align="center">

**Built with ❤️ for wellness and productivity**

[🌐 Website](https://eterny.com) • [📧 Contact](mailto:contact@eterny.com) • [🐦 Twitter](https://twitter.com/eterny)

</div> 