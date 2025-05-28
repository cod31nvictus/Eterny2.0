# **🧠 Eterny App Architecture**

**Tech Stack**

* **Frontend (Web)**: React.js

* **Mobile App (Android)**: React Native

* **Backend**: Node.js (Express.js)

* **Database**: MongoDB

* **Authentication**: Google OAuth (via Firebase or Passport.js)

---

## **📁 File & Folder Structure**

plaintext  
CopyEdit  
`eterny/`  
`├── client/                   # Web frontend (React.js)`  
`│   ├── public/`  
`│   └── src/`  
`│       ├── assets/           # Images, icons, logos`  
`│       ├── components/       # Reusable UI components`  
`│       ├── screens/          # Page-level components (Now, Today, Report, Configs)`  
`│       ├── routes/           # React Router setup`  
`│       ├── services/         # API handlers`  
`│       ├── store/            # Redux store & slices`  
`│       ├── utils/            # Date utils, formatters, helpers`  
`│       └── App.js`  
`│`  
`├── app/                      # React Native App`  
`│   ├── android/              # Native Android configs`  
`│   ├── ios/                  # (for future iOS support)`  
`│   ├── assets/`  
`│   └── src/`  
`│       ├── components/`  
`│       ├── screens/`  
`│       ├── navigation/       # Stack/Tab/Drawer navigation setup`  
`│       ├── services/         # API handlers`  
`│       ├── store/            # Redux Toolkit for global state`  
`│       ├── utils/`  
`│       └── App.tsx`  
`│`  
`├── server/                   # Node.js + Express backend`  
`│   ├── controllers/          # Logic for each API endpoint`  
`│   ├── models/               # Mongoose models`  
`│   ├── routes/               # API routes`  
`│   ├── middleware/           # Auth checks, error handling`  
`│   ├── services/             # Business logic services`  
`│   ├── utils/                # JWT handlers, validators`  
`│   ├── config/               # DB config, constants`  
`│   └── index.js              # Main Express app`  
`│`  
`├── shared/                   # Shared constants and types`  
`│   ├── types/`  
`│   └── constants/`  
`│`  
`├── .env`  
`├── README.md`  
`└── package.json`

---

## **🧩 Component & Service Responsibilities**

### **📱 Frontend (Web and App)**

* **Screens**: `Now`, `Today`, `Wellness Report`, `Profile`, `Configurations` (Wellness Categories, Activity Types, Day Dimensions, Templates)

* **Navigation**:

  * Tab (Now, Today, Wellness Report)

  * Drawer (Profile, Configs, Logout)

* **State Management**: Redux Toolkit

  * Stores: Auth, Calendar Plans, Configurations, Wellness Summary

* **Services**:

  * API integrations via Axios

  * Google OAuth login

  * Calendar Sync APIs (to/from backend)

* **UI Libraries**: NativeBase or React Native Paper for mobile, Material UI for web

### **🧠 Backend (Node.js \+ Express)**

* **Auth**:

  * Google OAuth (Passport.js / Firebase Admin SDK)

  * JWT for session management

* **Models (MongoDB)**:

  * `User`: profile, OAuth ID

  * `WellnessCategory`: name, type (drain/positive), default?

  * `ActivityType`: name, associated wellness tags

  * `DayDimension`: MealDay, WorkDay, etc.

  * `DayTemplate`: dimension values, blocks

  * `Block`: activity type, wellness tags, start/end time

  * `PlannedDay`: template \+ recurrence

* **Controllers**:

  * `authController.js`

  * `configController.js`

  * `templateController.js`

  * `calendarController.js`

  * `summaryController.js`

* **Business Logic Services**:

  * Baseline calculations

  * Time overlap conflict checks

  * Wellness category roll-ups

* **APIs**:

  * `/auth/login`

  * `/user/profile`

  * `/categories`, `/activities`, `/dimensions`, `/templates`

  * `/calendar`

  * `/summary`

### **🗃️ Database (MongoDB)**

* Schemas defined with Mongoose

* Relationships:

  * User → DayTemplates → Blocks → ActivityTypes → WellnessTags

* Indexed on userId \+ date for fast querying

---

## **📊 State Management**

### **Lives In:**

* **Frontend App State (Redux)**:

  * `auth`: Login state, user profile

  * `config`: Wellness Categories, Activity Types, Day Dimensions

  * `calendar`: Planned templates and schedules

  * `summary`: Cached wellness reports

* **Backend DB**:

  * Source of truth for configurations and plans

  * Holds all recurrence, timestamps, baseline data

---

## **🔗 Service Connectivity**

plaintext  
CopyEdit  
`[React / React Native UI]`  
      `↓ API calls`  
`[Node.js Express API Layer]`  
      `↓`  
`[MongoDB Atlas or Local]`

* Authenticated users only access their own configs/data

* Google Calendar sync handled via Google API access token stored securely

* Daily and weekly summaries computed on backend with caching for performance

