# **✅ MVP Build Plan – Eterny (Phase 1\)**

---

## **🔐 Auth \+ Backend Bootstrapping**

### **1\. Setup Backend Project**

* **Start**: Empty `server/` folder

* **End**: Initialized Node.js project with Express and project scaffolding

* **Test**: `GET /ping` returns “pong”

---

### **2\. Connect to MongoDB**

* **Start**: Initialized backend project

* **End**: `.env` file \+ working MongoDB connection via Mongoose

* **Test**: Console logs successful DB connection

---

### **3\. Implement Google OAuth Login**

* **Start**: User model and passport.js setup

* **End**: Google login route authenticates and returns JWT

* **Test**: Visiting `/auth/google` initiates and completes Google sign-in

---

### **4\. Create `User` Schema and Registration**

* **Start**: Auth working

* **End**: User info (name, email, profile) stored in DB after login

* **Test**: Inspect MongoDB for new user entry post login

---

## **⚙️ Config: Wellness Categories & Activity Types**

### **5\. Create `WellnessCategory` Model**

* **Start**: Mongoose setup

* **End**: Model with `name`, `type` (wellness/drain), `isDefault`, `userId`

* **Test**: Manually insert and fetch from DB

---

### **6\. Add API: Get & Create Wellness Categories**

* **Start**: Category model in place

* **End**: Routes: `GET /categories`, `POST /categories`

* **Test**: Create & fetch via Postman

---

### **7\. On User Creation → Seed Default Wellness Categories**

* **Start**: User model \+ wellness model

* **End**: Default categories (and drain counterparts) inserted on new user registration

* **Test**: New user has 10 categories created

---

### **8\. Create `ActivityType` Model**

* **Start**: Mongoose setup

* **End**: Model with `name`, `wellnessTagIds[]`, `userId`, `isDefault`

* **Test**: Add manually and validate in DB

---

### **9\. Add API: Get & Create Activity Types**

* **Start**: Activity model

* **End**: Routes: `GET /activities`, `POST /activities`

* **Test**: Create & fetch via Postman

---

### **10\. On User Creation → Seed Default Activity Types**

* **Start**: Activity model \+ user creation hook

* **End**: 25 default activities seeded with correct wellness tags

* **Test**: New user \= 25 activity types with expected tags

---

## **🧩 Day Dimensions & Templates**

### **11\. Create `DayDimension` and `DayValue` Models**

* **Start**: Mongoose base

* **End**: Dimensions like MealDay with values Normal, Refeed, etc.

* **Test**: Manual creation \+ linkage

---

### **12\. Add API: Get, Create, Edit Day Dimensions**

* **Start**: Dimension model

* **End**: Routes: `GET /dimensions`, `POST /dimensions`

* **Test**: Create and retrieve via Postman

---

### **13\. Seed Default Dimensions \+ Values on User Creation**

* **Start**: Dimension model ready

* **End**: 4 dimensions with predefined values created for new user

* **Test**: Confirm in DB after login

---

### **14\. Create `DayTemplate` Model**

* **Start**: All config models in place

* **End**: Model with dimension values \+ time blocks (activity, tags, start/end, notes)

* **Test**: Create sample document in DB

---

### **15\. Add API: Create & Fetch Day Templates**

* **Start**: Template model complete

* **End**: Routes: `POST /templates`, `GET /templates`

* **Test**: Create full template via Postman, including time blocks

---

## **📅 Planning Calendar**

### **16\. Create `PlannedDay` Model**

* **Start**: Template model ready

* **End**: Stores scheduled day templates and recurrence (start, end, frequency)

* **Test**: Manual insert \+ query

---

### **17\. Add API: Assign Template to Calendar**

* **Start**: PlannedDay model complete

* **End**: Route `POST /calendar/assign-template`

* **Test**: Hit endpoint, view calendar plan entry

---

### **18\. Add API: Get Planned Days for a Date Range**

* **Start**: Calendar data present

* **End**: Route `GET /calendar?start=YYYY-MM-DD&end=YYYY-MM-DD`

* **Test**: Returns matched templates and blocks

---

## **📊 Summary Report**

### **19\. Implement Wellness Summary Aggregation Service**

* **Start**: Data in PlannedDay \+ DayTemplates

* **End**: Backend logic to summarize hours per wellness category or activity type

* **Test**: Run function for a week; validate totals

---

### **20\. Add API: Get Wellness Summary (Daily/Weekly)**

* **Start**: Summary logic done

* **End**: Route `GET /summary?start=YYYY-MM-DD&end=YYYY-MM-DD`

* **Test**: Inspect output by category/activity

---

## **🖥️ Frontend – React Web**

### **21\. Setup React Project & Routing**

* **Start**: `client/` folder

* **End**: React project with React Router

* **Test**: Home route loads

---

### **22\. Implement Google Login Flow**

* **Start**: Firebase SDK or Google API

* **End**: Login button logs in, saves JWT to localStorage

* **Test**: Console JWT \+ redirect

---

### **23\. Build Profile Config UI (Categories \+ Activities)**

* **Start**: Authenticated user view

* **End**: Create/edit categories and activities

* **Test**: Add/edit via forms

---

### **24\. Build Day Template Creator UI**

* **Start**: Categories, Activities, Dimensions fetched

* **End**: Visual drag-and-drop or block entry builder

* **Test**: Save creates new template via API

---

### **25\. Build Wellness Summary UI**

* **Start**: Summary API done

* **End**: Show pie/bar charts for category/activity breakdown

* **Test**: Toggle drain on/off, validate data

---

## **📱 Mobile App – React Native**

### **26\. Setup React Native Project \+ Navigation**

* **Start**: Fresh RN project

* **End**: Bottom Tab (Now, Today, Report) \+ Drawer (Profile, Config, Logout)

* **Test**: Navigate between tabs

---

### **27\. Implement Mobile Google Login Flow**

* **Start**: Firebase Auth for React Native

* **End**: Login and JWT saved securely

* **Test**: Auth state in Redux

---

### **28\. Build “Now” View**

* **Start**: Planned calendar API working

* **End**: Show current block \+ countdown \+ ends in `x mins`

* **Test**: Time-based rendering

---

### **29\. Build “Today” Calendar View**

* **Start**: Fetch blocks for today

* **End**: List or Gantt-style layout

* **Test**: Matches saved blocks

---

### **30\. Build “Wellness Report” View**

* **Start**: Summary API connected

* **End**: Bar chart or list view of wellness/activity time

* **Test**: Verify toggles and visuals

---

## **🧪 Final QA & Setup**

### **31\. Protect All API Routes via Auth Middleware**

* **Start**: Auth implemented

* **End**: All `/api/*` endpoints validate JWT

* **Test**: Invalid JWT blocked

---

### **32\. Add `.env` Config & Deployment Scripts**

* **Start**: Working app

* **End**: `.env` with secrets, `start`/`build` scripts

* **Test**: Deploy to Vercel (web) and Expo (mobile)

