# Campus-Tutor - Peer Academic Help Marketplace

Campus-Tutor is a comprehensive peer tutoring marketplace where university students connect to seek and offer academic coaching, browse subject requests, manage profiles, track completed sessions, and report conduct or academic integrity violations to administrators.

---

## 🚀 Key Features Implemented

### 1. 🔔 Navigation Notifications Section
- **Notification Bell in Navbar**: Present in the header across all pages with a live unread counter badge.
- **Accepted Request Updates**: Instantly notifies students when a peer tutor accepts their posted request (with tutor contact info to coordinate sessions).
- **Requests & Proposals Sent**: Automatically reflects whenever a student publishes a request or sends a tutoring proposal.
- **Filter Tabs**: Quickly toggle between **All**, **🎉 Accepted**, and **✉️ Requests Sent**.
- **Mark All Read**: Instant clear and read state syncing with the server and local storage.

### 2. 🚩 Request Reporting (Browse Requests)
- **Report Button on Every Card**: Every tutoring request card on `browse.html` features a distinct **🚩 Report** button.
- **Detailed Incident Modal**: Opens a modal where students can specify:
  - Violation Category (Academic Integrity / Exam Cheating, Payment Dispute, No-Show & Spam, Inappropriate Conduct).
  - Urgency / Priority (Critical, High, Medium, Low).
  - Detailed incident description box.
- **Instant Admin Reflection**: Submissions are immediately reflected under the **🚩 Reports** tab on the Admin Operations Console (`admin.html`) against the reported requester.

### 3. 🎓 Completed Sessions & Tutor Reporting (Profile Page)
- **Completed Sessions Section**: Dedicated history on `profile.html` showing verified peer tutoring sessions with topic, tutor name, avatar, date, duration, rate, and completion badge.
- **🚩 Report Tutor Button**: Attached to each completed session card.
- **Tutor Incident Modal**: Allows reporting any conduct, honor code, or payment issues directly against that specific tutor.
- **Moderation Impact**: Logged cases automatically update the tutor's record and appear in `admin.html` for moderator triage and disciplinary strikes.

### 4. 🔐 Authentication Gate & Access Protection
- **Restricted Access**: Unauthenticated visitors are barred from accessing **Browse Requests** (`browse.html`), **Post a Request** (`postrequest.html`), and **My Profile** (`profile.html`).
- **Interactive Auth Gate Modal**: Clicking any protected section triggers a welcoming modal prompting the user to **Sign In** or **Create an Account**.
- **Return Redirection**: After authenticating, users are automatically directed to their originally intended destination.

### 5. ⚡ Full Backend Server (Node.js & Express)
- **Integrated Server**: `server.js` serves the frontend and provides a complete REST API:
  - `POST /api/auth/login` & `POST /api/auth/register`
  - `GET /api/requests`, `POST /api/requests`, `DELETE /api/requests/:id`
  - `GET /api/offers`, `POST /api/offers`, `POST /api/offers/:id/accept`
  - `GET /api/notifications`, `POST /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/mark-all-read`
  - `GET /api/reports`, `POST /api/reports`, `PATCH /api/reports/:id`
  - `GET /api/members`, `POST /api/members`, `PATCH /api/members/:id`
  - `GET /api/sessions`, `POST /api/sessions/report`
- **File Database**: Stored in `data/db.json` with safe atomic reads and writes.

---

## 🛠️ How to Run Backend and Frontend

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or higher; verified on Node v24).

### Step 1: Install Dependencies
Open your terminal (PowerShell or Bash) in the project directory:
```bash
npm install
```

### Step 2: Start the Backend Server
Run:
```bash
npm start
```
*(Or for development: `node server.js`)*

The server will output:
```
=======================================================
🚀 Campus-Tutor Server is running!
📡 URL: http://localhost:3000
📂 Database: ...\Campus-Tutor-MP\data\db.json
=======================================================
```

### Step 3: Open the Frontend
Open your web browser and navigate to:
```
http://localhost:3000
```
*(Both frontend and backend are hosted simultaneously by Express on port `3000`)*.

---

## 🔑 Demo Accounts for Testing

| Role | Email | Password | Access |
|---|---|---|---|
| **Student / Tutor** | `aditya.s@campus.edu` | `password123` | Browse, Post Requests, Profile, Sessions, Notifications |
| **Administrator** | `admin@campus.edu` | `adminMaster#2026` | Admin Operations Console (`admin.html`), Reports Triage, Member Management |

---

## 🧪 Testing Checklist

1. **Auth Gate**:
   - Open `http://localhost:3000` without signing in.
   - Click **Browse Requests** or **Post Requests**. Notice the **Authentication Required** gate dialog.
2. **Sign In**:
   - Click **Sign In** and enter `aditya.s@campus.edu` / `password123`.
3. **Notifications**:
   - Click the 🔔 bell icon in the top navigation.
   - Check the **Accepted Requests** notification and **Requests Sent** tabs.
4. **Report from Browse Requests**:
   - Go to `browse.html`.
   - Click **🚩 Report** on any card, enter a description, and submit.
5. **Completed Sessions & Tutor Reporting**:
   - Go to `profile.html`.
   - Scroll to **Completed Sessions**, click **🚩 Report Tutor**, and submit.
6. **Verify in Admin Portal**:
   - Go to `admin.html` (or click 🛡️ Admin Portal).
   - Switch to the **🚩 Reports** tab to see your submitted reports with Case IDs, timestamps, and full descriptions.
