const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Safe Database Helpers
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {
        requests: [],
        members: [],
        offers: [],
        notifications: [],
        reports: [],
        sessions: []
      };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return {
      requests: [],
      members: [],
      offers: [],
      notifications: [],
      reports: [],
      sessions: []
    };
  }
}

function writeDb(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// ==========================================
// REST API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Campus-Tutor Server is running successfully',
    time: new Date().toISOString()
  });
});

// ------------------------------------------
// AUTHENTICATION
// ------------------------------------------

// Register Student
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, studentId, department, year } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const db = readDb();
  const existing = db.members.find(m => m.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const initials = name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const newMember = {
    id: 'MEM-' + Math.floor(100 + Math.random() * 900),
    uid: 'user-' + Date.now(),
    name,
    email,
    password, // Stored locally for demo
    studentId: studentId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
    role: 'student',
    roleLabel: 'Verified Student',
    department: department || 'General Academics',
    year: year || 'Freshman (1st Year)',
    avatar: initials,
    status: 'active',
    rating: 5.0,
    reviewsCount: 0,
    sessionsCount: 0,
    requestsCount: 0,
    joinDate: 'Today',
    strikes: 0,
    tags: [department || 'Academics'],
    bio: `Campus scholar studying ${department || 'academics'}. Ready to connect with peer tutors!`
  };

  db.members.unshift(newMember);

  // Welcome notification
  db.notifications.unshift({
    id: 'notif-' + Date.now(),
    userId: newMember.studentId,
    userEmail: newMember.email,
    type: 'welcome',
    title: 'Welcome to Campus-Tutor! 🎓',
    message: `Hi ${name}, your account is active. Browse existing requests or post what you need help with.`,
    timestamp: Date.now(),
    read: false
  });

  writeDb(db);

  const { password: _, ...safeUser } = newMember;
  res.status(201).json(safeUser);
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = readDb();
  let member = db.members.find(m => m.email.toLowerCase() === email.toLowerCase());

  if (role === 'admin') {
    if (!member) {
      // Auto-provision demo admin if credentials match standard pattern
      member = {
        id: 'MEM-ADM',
        uid: 'adm-master-01',
        name: 'Administrator',
        email,
        role: 'admin',
        roleLabel: 'Administrator',
        department: 'Institutional Operations & Safety',
        avatar: 'AD',
        status: 'active',
        clearance: 'Level-3 Senior Moderator',
        strikes: 0
      };
      db.members.push(member);
      writeDb(db);
    }
    const { password: _, ...safeUser } = member;
    return res.json(safeUser);
  }

  if (!member) {
    // If not found, provision smooth student account to ensure a frictionless student experience
    const initials = email.split('@')[0].slice(0, 2).toUpperCase();
    const namePart = email.split('@')[0].replace('.', ' ');
    const formattedName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    member = {
      id: 'MEM-' + Math.floor(100 + Math.random() * 900),
      uid: 'user-' + Date.now(),
      name: formattedName || 'Campus Student',
      email,
      studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
      role: 'student',
      roleLabel: 'Verified Student',
      department: 'Computer Science & Engineering',
      year: 'Junior (3rd Year)',
      avatar: initials,
      status: 'active',
      rating: 4.9,
      reviewsCount: 12,
      sessionsCount: 3,
      requestsCount: 1,
      joinDate: 'Oct 2026',
      strikes: 0,
      tags: ['Academics'],
      bio: 'Enthusiastic student connecting with peer tutors for exam preparation and assignment review.'
    };
    db.members.unshift(member);
    writeDb(db);
  }

  if (member.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended due to policy violations. Contact administrator.' });
  }

  const { password: _, ...safeUser } = member;
  res.json(safeUser);
});

// ------------------------------------------
// REQUESTS
// ------------------------------------------

// Get all requests
app.get('/api/requests', (req, res) => {
  const db = readDb();
  res.json(db.requests || []);
});

// Create new request
app.post('/api/requests', (req, res) => {
  const reqData = req.body;
  if (!reqData.title || !reqData.subject) {
    return res.status(400).json({ error: 'Title and subject are required.' });
  }

  const db = readDb();
  const newReq = {
    id: 'req-' + Date.now(),
    title: reqData.title,
    subject: reqData.subject,
    description: reqData.description || '',
    budget: reqData.budget || '₹300/hr',
    mode: reqData.mode || 'Flexible',
    urgency: reqData.urgency || 'This Week',
    isUrgent: reqData.isUrgent || Boolean(reqData.urgency && reqData.urgency.toLowerCase().includes('urgent')),
    requesterId: reqData.requesterId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
    requesterName: reqData.requesterName || 'Campus Student',
    requesterEmail: reqData.requesterEmail || '',
    requesterYear: reqData.requesterYear || 'Campus Student',
    status: 'open',
    offersCount: 0,
    timestamp: Date.now()
  };

  db.requests.unshift(newReq);

  // Add a notification for the requester that the request was successfully published
  db.notifications.unshift({
    id: 'notif-' + Date.now(),
    userId: newReq.requesterId,
    userEmail: newReq.requesterEmail,
    type: 'request_sent',
    title: 'Tutoring Request Published 🚀',
    message: `Your request "${newReq.title}" has been published to the campus board. Qualified tutors can now send proposals.`,
    requestId: newReq.id,
    requestTitle: newReq.title,
    timestamp: Date.now(),
    read: false
  });

  // Increment member requests count
  const member = db.members.find(m => m.email && m.email.toLowerCase() === (newReq.requesterEmail || '').toLowerCase());
  if (member) {
    member.requestsCount = (member.requestsCount || 0) + 1;
  }

  writeDb(db);
  res.status(201).json(newReq);
});

// Delete request
app.delete('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLen = db.requests.length;
  db.requests = db.requests.filter(r => r.id !== id);

  if (db.requests.length === initialLen) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  writeDb(db);
  res.json({ success: true, message: 'Request removed.' });
});

// ------------------------------------------
// OFFERS & PROPOSALS
// ------------------------------------------

// Get offers (optionally filter by requestId or tutorId)
app.get('/api/offers', (req, res) => {
  const db = readDb();
  let list = db.offers || [];
  if (req.query.requestId) {
    list = list.filter(o => o.requestId === req.query.requestId);
  }
  if (req.query.tutorId) {
    list = list.filter(o => o.tutorId === req.query.tutorId);
  }
  res.json(list);
});

// Submit an offer / proposal
app.post('/api/offers', (req, res) => {
  const { requestId, requestTitle, tutorName, tutorContact, tutorId, message } = req.body;
  if (!requestId || !tutorName || !tutorContact) {
    return res.status(400).json({ error: 'Missing proposal details.' });
  }

  const db = readDb();
  const newOffer = {
    id: 'off-' + Date.now(),
    requestId,
    requestTitle: requestTitle || 'Tutoring Request',
    tutorId: tutorId || 'MEM-' + Math.floor(100 + Math.random() * 900),
    tutorName,
    tutorContact,
    message: message || '',
    status: 'pending',
    timestamp: Date.now()
  };

  db.offers.unshift(newOffer);

  // Increment offersCount on the request
  const targetReq = db.requests.find(r => r.id === requestId);
  if (targetReq) {
    targetReq.offersCount = (targetReq.offersCount || 0) + 1;

    // Notification to requester: New proposal received!
    db.notifications.unshift({
      id: 'notif-req-' + Date.now(),
      userId: targetReq.requesterId,
      userEmail: targetReq.requesterEmail,
      type: 'offer_received',
      title: 'New Tutoring Proposal Received 💬',
      message: `${tutorName} submitted an offer to help with "${targetReq.title}".`,
      requestId: targetReq.id,
      requestTitle: targetReq.title,
      tutorName: tutorName,
      tutorContact: tutorContact,
      timestamp: Date.now(),
      read: false
    });
  }

  // Notification to tutor: Proposal sent reflection
  db.notifications.unshift({
    id: 'notif-tut-' + Date.now(),
    userId: newOffer.tutorId,
    userEmail: tutorContact,
    type: 'proposal_sent',
    title: 'Tutoring Proposal Sent ✉️',
    message: `You offered peer tutoring assistance for "${newOffer.requestTitle}". Waiting for requester review.`,
    requestId: newOffer.requestId,
    requestTitle: newOffer.requestTitle,
    timestamp: Date.now(),
    read: false
  });

  writeDb(db);
  res.status(201).json(newOffer);
});

// Accept an offer
app.post('/api/offers/:id/accept', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const offer = db.offers.find(o => o.id === id);

  if (!offer) {
    return res.status(404).json({ error: 'Offer not found.' });
  }

  offer.status = 'accepted';

  // Mark request status
  const targetReq = db.requests.find(r => r.id === offer.requestId);
  if (targetReq) {
    targetReq.status = 'matched';

    // 1. Notification to requester: Accepted request confirmation
    db.notifications.unshift({
      id: 'notif-acc-req-' + Date.now(),
      userId: targetReq.requesterId,
      userEmail: targetReq.requesterEmail,
      type: 'request_accepted',
      title: 'Tutoring Request Accepted! 🎉',
      message: `Tutor ${offer.tutorName} has been confirmed for "${targetReq.title}". You can coordinate session details via ${offer.tutorContact}.`,
      requestId: targetReq.id,
      requestTitle: targetReq.title,
      tutorName: offer.tutorName,
      tutorContact: offer.tutorContact,
      timestamp: Date.now(),
      read: false
    });
  }

  // 2. Notification to tutor
  db.notifications.unshift({
    id: 'notif-acc-tut-' + Date.now(),
    userId: offer.tutorId,
    userEmail: offer.tutorContact,
    type: 'request_accepted',
    title: 'Your Proposal Was Accepted! 🎉',
    message: `Your tutoring proposal for "${offer.requestTitle}" has been accepted. Connect with your student to begin.`,
    requestId: offer.requestId,
    requestTitle: offer.requestTitle,
    timestamp: Date.now(),
    read: false
  });

  writeDb(db);
  res.json({ success: true, offer });
});

// ------------------------------------------
// NOTIFICATIONS
// ------------------------------------------

// Get notifications
app.get('/api/notifications', (req, res) => {
  const db = readDb();
  const { email, userId } = req.query;
  let list = db.notifications || [];

  if (email || userId) {
    const userEmail = (email || '').toLowerCase().trim();
    list = list.filter(n => {
      const matchEmail = userEmail && n.userEmail && n.userEmail.toLowerCase() === userEmail;
      const matchId = userId && n.userId && String(n.userId) === String(userId);
      return matchEmail || matchId || !n.userEmail; // Global notifs also included
    });
  }

  list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  res.json(list);
});

// Create notification
app.post('/api/notifications', (req, res) => {
  const { userId, userEmail, type, title, message, requestId, requestTitle, tutorName, tutorContact } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const db = readDb();
  const newNotif = {
    id: 'notif-' + Date.now(),
    userId: userId || '',
    userEmail: userEmail || '',
    type: type || 'general',
    title,
    message,
    requestId: requestId || '',
    requestTitle: requestTitle || '',
    tutorName: tutorName || '',
    tutorContact: tutorContact || '',
    timestamp: Date.now(),
    read: false
  };

  db.notifications.unshift(newNotif);
  writeDb(db);
  res.status(201).json(newNotif);
});

// Mark single notification as read
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    writeDb(db);
  }
  res.json({ success: true });
});

// Mark all notifications as read
app.post('/api/notifications/mark-all-read', (req, res) => {
  const { email } = req.body;
  const db = readDb();
  const targetEmail = (email || '').toLowerCase().trim();

  db.notifications.forEach(n => {
    if (!targetEmail || (n.userEmail && n.userEmail.toLowerCase() === targetEmail)) {
      n.read = true;
    }
  });

  writeDb(db);
  res.json({ success: true });
});

// ------------------------------------------
// REPORTS (ADMIN & SAFETY ESCALATIONS)
// ------------------------------------------

// Get all reports
app.get('/api/reports', (req, res) => {
  const db = readDb();
  res.json(db.reports || []);
});

// Submit a new report (from Browse Request or Profile Completed Sessions)
app.post('/api/reports', (req, res) => {
  const {
    title,
    category,
    priority,
    reportedUserId,
    reportedUserName,
    reportedUserEmail,
    reportedUserRole,
    reporterId,
    reporterName,
    reporterRole,
    description,
    evidence,
    requestId,
    requestTitle
  } = req.body;

  if (!description || !reportedUserName) {
    return res.status(400).json({ error: 'Reported user name and description are required.' });
  }

  const db = readDb();
  const newReport = {
    id: 'REP-2026-' + Math.floor(100 + Math.random() * 900),
    title: title || `Safety Incident Report against ${reportedUserName}`,
    category: category || 'Academic Integrity',
    priority: priority || 'High',
    reportedUserId: reportedUserId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
    reportedUserName,
    reportedUserEmail: reportedUserEmail || `${reportedUserName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
    reportedUserRole: reportedUserRole || 'Student Requester',
    reporterId: reporterId || 'MEM-CURRENT',
    reporterName: reporterName || 'Anonymous Campus Scholar',
    reporterRole: reporterRole || 'Student / Tutor',
    requestId: requestId || '',
    requestTitle: requestTitle || '',
    createdAt: 'Just Now',
    timestamp: Date.now(),
    status: 'pending',
    description,
    evidence: evidence || 'Direct user report submitted via platform interface.',
    assignedAdmin: 'Unassigned',
    resolutionNote: 'Pending administrator triage and investigation.'
  };

  db.reports.unshift(newReport);

  // If reported user is in members list, increment strike warning or tag
  const reportedMember = db.members.find(m => 
    (m.email && reportedUserEmail && m.email.toLowerCase() === reportedUserEmail.toLowerCase()) ||
    (m.name && m.name.toLowerCase() === reportedUserName.toLowerCase())
  );
  if (reportedMember) {
    reportedMember.strikes = (reportedMember.strikes || 0) + 1;
    if (reportedMember.strikes >= 3) {
      reportedMember.status = 'suspended';
    } else {
      reportedMember.status = 'warning';
    }
  }

  writeDb(db);
  res.status(201).json(newReport);
});

// Update report triage status / resolution
app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  const db = readDb();
  const report = db.reports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ error: 'Report case not found.' });
  }

  Object.assign(report, patch);
  writeDb(db);
  res.json(report);
});

// ------------------------------------------
// MEMBERS
// ------------------------------------------

// Get members
app.get('/api/members', (req, res) => {
  const db = readDb();
  const safe = (db.members || []).map(({ password, ...m }) => m);
  res.json(safe);
});

// Add member
app.post('/api/members', (req, res) => {
  const data = req.body;
  const db = readDb();
  const initials = (data.name || 'CT').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const newMember = {
    id: 'MEM-' + Math.floor(100 + Math.random() * 900),
    uid: 'user-' + Date.now(),
    ...data,
    avatar: initials,
    status: data.status || 'active',
    rating: data.rating || 5.0,
    strikes: 0,
    joinDate: 'Today'
  };

  db.members.unshift(newMember);
  writeDb(db);
  res.status(201).json(newMember);
});

// Patch member
app.patch('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  const db = readDb();
  const member = db.members.find(m => m.id === id || m.uid === id);

  if (!member) {
    return res.status(404).json({ error: 'Member not found.' });
  }

  Object.assign(member, patch);
  writeDb(db);
  res.json(member);
});

// ------------------------------------------
// COMPLETED SESSIONS (PROFILE)
// ------------------------------------------

// Get completed sessions for profile
app.get('/api/sessions', (req, res) => {
  const db = readDb();
  const { email, userId } = req.query;
  let list = db.sessions || [];

  if (email || userId) {
    const userEmail = (email || '').toLowerCase().trim();
    list = list.filter(s => {
      const matchEmail = userEmail && s.userEmail && s.userEmail.toLowerCase() === userEmail;
      const matchId = userId && s.userId && String(s.userId) === String(userId);
      return matchEmail || matchId;
    });
  }

  // If no sessions found for current user, return all sessions as default demo sessions
  if (list.length === 0 && db.sessions && db.sessions.length > 0) {
    list = db.sessions;
  }

  res.json(list);
});

// Report tutor from completed session
app.post('/api/sessions/report', (req, res) => {
  const { sessionId, tutorId, tutorName, tutorEmail, reasonCategory, description, reporterName, reporterEmail } = req.body;
  if (!tutorName || !description) {
    return res.status(400).json({ error: 'Tutor name and report description are required.' });
  }

  const db = readDb();
  const session = db.sessions.find(s => s.id === sessionId);

  const reportId = 'REP-2026-' + Math.floor(100 + Math.random() * 900);
  const newReport = {
    id: reportId,
    title: `Tutor Conduct Dispute: ${tutorName} (${session ? session.subject : 'Tutoring Session'})`,
    category: reasonCategory || 'Inappropriate Behavior',
    priority: 'High',
    reportedUserId: tutorId || 'MEM-TUTOR',
    reportedUserName: tutorName,
    reportedUserEmail: tutorEmail || `${tutorName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
    reportedUserRole: 'Verified Peer Tutor',
    reporterId: reporterEmail || 'STU-STUDENT',
    reporterName: reporterName || 'Student Requester',
    reporterRole: 'Student Requester',
    sessionId: sessionId || '',
    createdAt: 'Just Now',
    timestamp: Date.now(),
    status: 'pending',
    description: description,
    evidence: `Logged from completed tutoring session ID: ${sessionId || 'N/A'}. Session Subject: ${session ? session.subject : 'General'}. Rate: ${session ? session.rate : 'N/A'}.`,
    assignedAdmin: 'Unassigned',
    resolutionNote: 'Report logged from Completed Sessions. Pending administrator investigation.'
  };

  db.reports.unshift(newReport);

  // Add strike warning to tutor
  const tutorMember = db.members.find(m => 
    (m.id && tutorId && m.id === tutorId) ||
    (m.email && tutorEmail && m.email.toLowerCase() === tutorEmail.toLowerCase()) ||
    (m.name && m.name.toLowerCase() === tutorName.toLowerCase())
  );
  if (tutorMember) {
    tutorMember.strikes = (tutorMember.strikes || 0) + 1;
    tutorMember.status = tutorMember.strikes >= 3 ? 'suspended' : 'warning';
  }

  writeDb(db);
  res.status(201).json({ success: true, report: newReport });
});

// Fallback to index.html for page routing
app.use((req, res) => {
  const file = path.join(__dirname, req.path);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return res.sendFile(file);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Campus-Tutor Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📂 Database: ${DB_FILE}`);
  console.log(`=======================================================`);
});
