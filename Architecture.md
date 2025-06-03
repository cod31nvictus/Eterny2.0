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
`│       ├── components/       # ToDoItem.tsx, ToDoInputRow.tsx`  
`│       ├── screens/          # NowScreen.tsx, ToDoScreen.tsx`  
`│       ├── contexts/         # ToDoContext.tsx for state management`  
`│       ├── navigation/       # Stack/Tab/Drawer navigation setup`  
`│       ├── services/         # API handlers`  
`│       ├── store/            # Redux Toolkit for global state`  
`│       ├── utils/`  
`│       └── App.tsx`  
`│`  
`├── server/                   # Node.js + Express backend`  
`│   ├── controllers/          # Logic for each API endpoint`  
`│   ├── models/               # Mongoose models (ToDoItem.js)`  
`│   ├── routes/               # API routes (todo.js)`  
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

* **Screens**: `Now`, `Today`, `ToDoScreen`, `Wellness Report`, `Profile`, `Configurations` (Wellness Categories, Activity Types, Day Dimensions, Templates)

* **Navigation**:

  * Tab (Now, Today, ToDo, Wellness Report)

  * Drawer (Profile, Configs, Logout)

* **State Management**: 
  * Redux Toolkit for global app state
  * React Context for To-Do system (ToDoContext.tsx)

  * Stores: Auth, Calendar Plans, Configurations, Wellness Summary, ToDos

* **Services**:

  * API integrations via Axios

  * Google OAuth login

  * Calendar Sync APIs (to/from backend)

  * To-Do CRUD operations

* **UI Libraries**: NativeBase or React Native Paper for mobile, Material UI for web

* **✅ To-Do Components**:
  * `ToDoScreen.tsx`: Main to-do list with date navigation
  * `ToDoItem.tsx`: Individual todo item with checkbox, delete, time display
  * `ToDoInputRow.tsx`: Inline todo creation with optional time picker
  * `ToDoContext.tsx`: Global state management for todos

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

  * **✅ `ToDoItem`**: userId, text, date (YYYY-MM-DD), time (HH:MM), completed, completedAt, order

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

  * **✅ To-Do ordering and completion tracking**

* **APIs**:

  * `/auth/login`

  * `/user/profile`

  * `/categories`, `/activities`, `/dimensions`, `/templates`

  * `/calendar`

  * `/summary`

  * **✅ `/api/todo`**: GET (with date filter), POST, PATCH /:id/complete, PUT /:id, DELETE /:id

### **🗃️ Database (MongoDB)**

* Schemas defined with Mongoose

* Relationships:

  * User → DayTemplates → Blocks → ActivityTypes → WellnessTags

  * **✅ User → ToDoItems (date-based organization)**

* Indexed on userId \+ date for fast querying

* **✅ To-Do specific indexes**: compound index on (userId, date, order) for efficient queries

---

## **📊 State Management**

### **Lives In:**

* **Frontend App State (Redux)**:

  * `auth`: Login state, user profile

  * `config`: Wellness Categories, Activity Types, Day Dimensions

  * `calendar`: Planned templates and schedules

  * `summary`: Cached wellness reports

* **✅ Frontend To-Do State (React Context)**:

  * `todos`: Array of ToDoItem objects

  * `loading`: Boolean for API operations

  * `error`: Error messages from API calls

  * Methods: fetchTodos, createTodo, updateTodo, toggleComplete, deleteTodo

* **Backend DB**:

  * Source of truth for configurations and plans

  * Holds all recurrence, timestamps, baseline data

  * **✅ To-Do items with completion tracking and ordering**

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

* **✅ To-Do system**: JWT-protected endpoints, real-time CRUD operations, date-based filtering

---

## **🚀 Deployment Status**

* **Backend**: Deployed on AWS EC2 (51.20.92.32) with nginx reverse proxy
* **Domain**: `https://eterny-app.ddns.net`
* **SSL**: Let's Encrypt certificates for HTTPS
* **Database**: MongoDB Atlas cloud instance
* **Mobile App**: APK builds via Metro bundler
* **Current Build**: Build 27 (To-Do system with NowScreen integration)

---

## **✅ Completed Features**

### **Authentication System**
* Google OAuth integration with JWT tokens
* Secure token storage and validation
* User profile management

### **To-Do System** 
* Full CRUD operations with REST API
* Date-based organization and navigation
* Optional time scheduling for tasks
* Real-time completion tracking with timestamps
* Integration with NowScreen for today's tasks
* Inline editing with time picker validation
* Clean UI with animations and visual feedback

### **Core Infrastructure**
* MongoDB models with proper indexing
* Express.js API with authentication middleware
* React Native app with context-based state management
* Production deployment with HTTPS and SSL

