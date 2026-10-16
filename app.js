const INITIAL_REQUESTS = [];

function getStoredRequests() {
  const data = localStorage.getItem("campus_tutor_requests");
  if (!data) {
    localStorage.setItem("campus_tutor_requests", JSON.stringify(INITIAL_REQUESTS));
    return INITIAL_REQUESTS;
  }
  try {
    const parsed = JSON.parse(data);
    return parsed.map(r => {
      if (r.budget && r.budget.includes('$')) {
        r.budget = r.budget.replace('$', '₹');
      }
      return r;
    });
  } catch (e) {
    return INITIAL_REQUESTS;
  }
}

function saveRequest(newReq) {
  const current = getStoredRequests();
  current.unshift(newReq);
  localStorage.setItem("campus_tutor_requests", JSON.stringify(current));
  return newReq;
}

function showToast(message, icon = "✓") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span style="color: #e2a03f; font-weight: bold; font-size: 16px;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function getInitials(name) {
  if (!name) return "CT";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function getCurrentUser() {
  const userStr = localStorage.getItem("campus_tutor_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function logoutUser(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  if (window.CampusBackend && typeof window.CampusBackend.signOut === "function") {
    window.CampusBackend.signOut();
  }
  localStorage.removeItem("campus_tutor_user");
  showToast("You have been signed out.", "👋");
  
  // Re-render auth nav state across all headers
  initAuthNav();

  // If on profile page, redirect to login
  if (window.location.pathname.endsWith("profile.html") || window.location.pathname.endsWith("admin.html")) {
    setTimeout(() => {
      window.location.href = "login.html";
    }, 600);
  } else if (window.location.pathname.endsWith("login.html")) {
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

const INITIAL_MEMBERS = [
  {
    id: "MEM-101",
    name: "Aditya Sarudkar",
    email: "aditya.s@campus.edu",
    studentId: "STU-8821",
    role: "tutor",
    roleLabel: "Verified Peer Tutor",
    department: "Computer Science & Engineering",
    year: "Junior (3rd Year)",
    avatar: "AS",
    status: "active",
    rating: 4.9,
    reviewsCount: 24,
    sessionsCount: 38,
    requestsCount: 2,
    joinDate: "Aug 2025",
    strikes: 0,
    tags: ["Data Structures", "Algorithms", "Python", "C++"],
    bio: "CS Teaching Assistant & passionate peer tutor for core algorithmic concepts and midterm prep."
  }
];

const INITIAL_REPORTS = [
  {
    id: "REP-2026-079",
    title: "Requesting Direct Exam Solutions During Live Test",
    category: "Academic Integrity",
    priority: "Critical",
    reportedUserId: "STU-3199",
    reportedUserName: "Student Requester",
    reportedUserEmail: "student@campus.edu",
    reportedUserRole: "Student Requester",
    reporterId: "MEM-101",
    reporterName: "Aditya Sarudkar",
    reporterRole: "Verified Peer Tutor",
    createdAt: "Yesterday",
    timestamp: Date.now() - 86400000,
    status: "investigating",
    description: "User posted a tutoring request labeled 'Urgent CS Quiz Help' and when connecting on Google Meet, shared an active timed exam screen demanding the tutor write the answers directly in violation of the campus Honor Code.",
    evidence: "Screen recording timestamped at 14:15 during CS201 Midterm window.",
    assignedAdmin: "Administrator",
    resolutionNote: "User placed on immediate temporary suspension pending Honor Board review."
  }
];

function getStoredMembers() {
  const data = localStorage.getItem("campus_tutor_members");
  if (!data) {
    localStorage.setItem("campus_tutor_members", JSON.stringify(INITIAL_MEMBERS));
    return INITIAL_MEMBERS;
  }
  try {
    const parsed = JSON.parse(data);
    const hasOldDemos = parsed.some(m => m.name === "Priya Sharma" || m.name === "Jordan Lee" || m.name === "Samantha Ray" || m.name === "Marcus Vance");
    if (hasOldDemos) {
      localStorage.setItem("campus_tutor_members", JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    return parsed;
  } catch (e) {
    return INITIAL_MEMBERS;
  }
}

function saveMembers(members) {
  localStorage.setItem("campus_tutor_members", JSON.stringify(members));
}

function getStoredReports() {
  const data = localStorage.getItem("campus_tutor_reports");
  if (!data) {
    localStorage.setItem("campus_tutor_reports", JSON.stringify(INITIAL_REPORTS));
    return INITIAL_REPORTS;
  }
  try {
    const parsed = JSON.parse(data);
    const hasOldDemos = parsed.some(r => r.id === "REP-2026-081" || r.id === "REP-2026-075" || r.id === "REP-2026-068");
    if (hasOldDemos) {
      localStorage.setItem("campus_tutor_reports", JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return parsed;
  } catch (e) {
    return INITIAL_REPORTS;
  }
}

function saveReports(reports) {
  localStorage.setItem("campus_tutor_reports", JSON.stringify(reports));
}

// ----------------------------------------------------
// NOTIFICATION STORE & API LAYER
// ----------------------------------------------------
const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    userId: "STU-8821",
    userEmail: "aditya.s@campus.edu",
    type: "request_accepted",
    title: "Tutoring Request Accepted! 🎉",
    message: "Verified Tutor Maya Chen accepted your request for 'CS201: Binary Trees & AVL Tree Rotations'. Contact: maya.c@campus.edu",
    requestId: "req-101",
    requestTitle: "CS201: Binary Trees & AVL Tree Rotations",
    tutorName: "Maya Chen",
    tutorContact: "maya.c@campus.edu",
    timestamp: Date.now() - 3600000,
    read: false
  },
  {
    id: "notif-2",
    userId: "STU-8821",
    userEmail: "aditya.s@campus.edu",
    type: "request_sent",
    title: "Tutoring Request Published 🚀",
    message: "Your request 'CS201: Binary Trees & AVL Tree Rotations' was published to the campus browse board.",
    requestId: "req-101",
    requestTitle: "CS201: Binary Trees & AVL Tree Rotations",
    timestamp: Date.now() - 7200000,
    read: true
  },
  {
    id: "notif-3",
    userId: "STU-8821",
    userEmail: "aditya.s@campus.edu",
    type: "proposal_sent",
    title: "Tutoring Proposal Sent ✉️",
    message: "You submitted a tutoring proposal for 'MATH102: Multivariable Calculus Double Integrals' to Priya Sharma.",
    requestId: "req-102",
    requestTitle: "MATH102: Multivariable Calculus Double Integrals",
    timestamp: Date.now() - 14400000,
    read: false
  }
];

function getStoredNotifications() {
  const data = localStorage.getItem("campus_tutor_notifications");
  if (!data) {
    localStorage.setItem("campus_tutor_notifications", JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

function saveNotifications(notifications) {
  localStorage.setItem("campus_tutor_notifications", JSON.stringify(notifications));
}

async function fetchNotificationsForUser() {
  const user = getCurrentUser();
  try {
    const url = user 
      ? `/api/notifications?email=${encodeURIComponent(user.email || '')}&userId=${encodeURIComponent(user.studentId || user.uid || '')}`
      : '/api/notifications';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveNotifications(data);
        return data;
      }
    }
  } catch (err) {
    // Server offline or running file://, fallback to localStorage
  }
  return getStoredNotifications();
}

async function addNotification(notif) {
  const fullNotif = {
    id: notif.id || 'notif-' + Date.now(),
    timestamp: notif.timestamp || Date.now(),
    read: false,
    ...notif
  };

  // Try API
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullNotif)
    });
  } catch (_) {}

  // Update local storage
  const current = getStoredNotifications();
  current.unshift(fullNotif);
  saveNotifications(current);

  // Trigger UI re-render
  renderNotificationUI();
  return fullNotif;
}

// ----------------------------------------------------
// NAVIGATION & NOTIFICATION MENU INITIALIZATION
// ----------------------------------------------------
let activeNotifFilter = 'all';

function initAuthNav() {
  const user = getCurrentUser();
  const navLoginBtns = document.querySelectorAll(".nav-login-btn");
  const navElements = document.querySelectorAll("header nav");
  
  navElements.forEach(nav => {
    // 1. Admin link if user is admin
    let adminLink = nav.querySelector(".nav-admin-link");
    if (user && user.role === "admin") {
      if (!adminLink) {
        adminLink = document.createElement("a");
        adminLink.href = "admin.html";
        adminLink.className = "nav-admin-link";
        adminLink.innerHTML = `<span style="background: rgba(226, 160, 63, 0.2); color: #e2a03f; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12.5px; border: 1px solid rgba(226, 160, 63, 0.4); display: inline-flex; align-items: center; gap: 4px;">🛡️ Admin Portal</span>`;
        const lastBtn = nav.querySelector(".nav-login-btn");
        if (lastBtn) {
          nav.insertBefore(adminLink, lastBtn);
        } else {
          nav.appendChild(adminLink);
        }
      }
      if (window.location.pathname.endsWith("admin.html")) {
        adminLink.classList.add("active");
      }
    } else if (adminLink) {
      adminLink.remove();
    }

    // 2. Notification Bell Menu
    let notifWrapper = nav.querySelector(".nav-notif-wrapper");
    if (!notifWrapper) {
      notifWrapper = document.createElement("div");
      notifWrapper.className = "nav-notif-wrapper";
      notifWrapper.innerHTML = `
        <button type="button" class="nav-notif-btn" id="nav-notif-btn" aria-label="Notifications" title="View Notifications">
          🔔
          <span class="notif-badge-pill" id="notif-badge-pill" style="display: none;">0</span>
        </button>
        <div class="notif-dropdown" id="notif-dropdown">
          <div class="notif-dropdown-header">
            <h4 class="notif-header-title">
              🔔 Notifications 
              <span class="notif-unread-count-tag" id="notif-unread-count-tag">0 New</span>
            </h4>
            <button type="button" class="notif-btn-clear-all" onclick="markAllNotificationsAsRead()">Mark all read</button>
          </div>
          <div class="notif-tabs-bar">
            <button type="button" class="notif-tab-chip active" onclick="switchNotifFilter('all', this)">All</button>
            <button type="button" class="notif-tab-chip" onclick="switchNotifFilter('accepted', this)">🎉 Accepted</button>
            <button type="button" class="notif-tab-chip" onclick="switchNotifFilter('sent', this)">✉️ Requests Sent</button>
          </div>
          <div class="notif-list-container" id="notif-list-container">
            <!-- Dynamic notifications injected here -->
          </div>
        </div>
      `;

      // Insert before login / profile or at end
      const lastBtn = nav.querySelector(".nav-login-btn");
      if (lastBtn) {
        nav.insertBefore(notifWrapper, lastBtn);
      } else {
        nav.appendChild(notifWrapper);
      }

      // Add click toggles
      const notifBtn = notifWrapper.querySelector("#nav-notif-btn");
      const notifDropdown = notifWrapper.querySelector("#notif-dropdown");
      notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle("open");
        notifBtn.classList.toggle("active");
      });

      document.addEventListener("click", (e) => {
        if (!notifWrapper.contains(e.target)) {
          notifDropdown.classList.remove("open");
          notifBtn.classList.remove("active");
        }
      });
    }
  });

  // Render current notifications
  renderNotificationUI();

  // Login / Logout buttons
  if (!navLoginBtns.length) return;
  const isLoginPage = window.location.pathname.endsWith("login.html");

  navLoginBtns.forEach(btn => {
    if (user) {
      btn.innerHTML = `<span style="font-size: 13.5px; font-weight: 700;">🚪 Sign Out</span>`;
      btn.href = "javascript:void(0)";
      btn.onclick = (e) => logoutUser(e);
      btn.classList.add("nav-signout-btn");
      btn.classList.remove("active");
      btn.title = `Signed in as ${user.name} (${user.role}). Click to Sign Out.`;
    } else {
      btn.innerHTML = `<span>Sign In</span>`;
      btn.href = "login.html";
      btn.onclick = null;
      btn.classList.remove("nav-signout-btn");
      if (isLoginPage) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
      btn.title = "Click to Sign In";
    }
  });
}

function timeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

async function renderNotificationUI() {
  const notifs = await fetchNotificationsForUser();
  const unreadCount = notifs.filter(n => !n.read).length;

  // Update badge in all notification buttons
  document.querySelectorAll(".notif-badge-pill").forEach(badge => {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });

  document.querySelectorAll(".notif-unread-count-tag").forEach(tag => {
    tag.textContent = unreadCount > 0 ? `${unreadCount} New` : '0 New';
  });

  // Filter list
  let filtered = [...notifs];
  if (activeNotifFilter === 'accepted') {
    filtered = notifs.filter(n => n.type === 'request_accepted' || (n.title && n.title.toLowerCase().includes('accepted')));
  } else if (activeNotifFilter === 'sent') {
    filtered = notifs.filter(n => n.type === 'request_sent' || n.type === 'proposal_sent' || (n.title && (n.title.toLowerCase().includes('sent') || n.title.toLowerCase().includes('published'))));
  }

  const listContainer = document.getElementById("notif-list-container");
  if (!listContainer) return;

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="notif-empty-state">
        <div class="notif-empty-icon">📭</div>
        <h5>No Notifications Here</h5>
        <p>Tutoring updates, accepted requests, and proposals will appear in this menu.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(item => {
    const isAccepted = item.type === 'request_accepted' || (item.title && item.title.includes('Accepted'));
    const isSent = item.type === 'request_sent' || item.type === 'proposal_sent';
    
    let iconClass = 'notif-icon-offer';
    let iconSymbol = '💬';
    let badgeHtml = `<span class="notif-meta-badge notif-badge-pending">Update</span>`;

    if (isAccepted) {
      iconClass = 'notif-icon-accepted';
      iconSymbol = '🎉';
      badgeHtml = `<span class="notif-meta-badge notif-badge-accepted">✓ Accepted Request</span>`;
    } else if (isSent) {
      iconClass = 'notif-icon-sent';
      iconSymbol = item.type === 'proposal_sent' ? '✉️' : '🚀';
      badgeHtml = `<span class="notif-meta-badge notif-badge-sent">Sent Request</span>`;
    }

    return `
      <div class="notif-item ${item.read ? '' : 'unread'}" onclick="handleNotifClick('${item.id}')">
        <div class="notif-icon-circle ${iconClass}">${iconSymbol}</div>
        <div class="notif-content-block">
          <div class="notif-title-row">
            <h5 class="notif-title">${item.title}</h5>
            <span class="notif-time-ago">${timeAgo(item.timestamp)}</span>
          </div>
          <p class="notif-text">${item.message}</p>
          <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
            ${badgeHtml}
            ${item.tutorContact ? `<span style="font-size: 11px; color: #4338CA; font-weight: 600;">📧 ${item.tutorContact}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.switchNotifFilter = function(filter, btn) {
  activeNotifFilter = filter;
  const chips = document.querySelectorAll(".notif-tab-chip");
  chips.forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderNotificationUI();
};

window.handleNotifClick = async function(id) {
  const notifs = getStoredNotifications();
  const target = notifs.find(n => n.id === id);
  if (target) {
    target.read = true;
    saveNotifications(notifs);
  }
  try {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  } catch (_) {}
  renderNotificationUI();
};

window.markAllNotificationsAsRead = async function() {
  const notifs = getStoredNotifications();
  notifs.forEach(n => n.read = true);
  saveNotifications(notifs);

  const user = getCurrentUser();
  try {
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user ? user.email : '' })
    });
  } catch (_) {}

  renderNotificationUI();
  showToast("All notifications marked as read.", "✓");
};

// ----------------------------------------------------
// AUTHENTICATION GATE & ACCESS PROTECTION
// ----------------------------------------------------
// Protected pages: browse.html, postrequest.html, profile.html
const PROTECTED_PAGES = ["browse.html", "postrequest.html", "profile.html"];

function isUserLoggedIn() {
  const user = getCurrentUser();
  return Boolean(user && (user.email || user.name || user.uid));
}

function openAuthGateModal(targetUrl = "browse.html", reasonText = "Sign in or create an account to access peer tutoring requests, proposals, and your student profile.") {
  let modal = document.getElementById("auth-gate-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "auth-gate-modal";
    modal.className = "app-modal-overlay";
    modal.innerHTML = `
      <div class="app-modal-card auth-gate-modal-card">
        <div class="auth-gate-icon-circle">🔐</div>
        <h3 id="auth-gate-title">Authentication Required</h3>
        <p id="auth-gate-desc">${reasonText}</p>
        <div class="auth-gate-actions">
          <a href="login.html?redirect=${encodeURIComponent(targetUrl)}&mode=signin" class="butt butt-browse" id="auth-gate-signin-btn">
            Sign In to Your Account
          </a>
          <a href="login.html?redirect=${encodeURIComponent(targetUrl)}&mode=signup" class="butt butt-post" id="auth-gate-signup-btn" style="color: var(--primary-navy); border-color: var(--border-color); background: #F8FAFC;">
            Create New Student Account
          </a>
          <button type="button" class="butt" style="background: transparent; color: #64748B; padding: 8px;" onclick="closeAuthGateModal()">
            Return to Home
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeAuthGateModal();
      }
    });
  } else {
    document.getElementById("auth-gate-desc").textContent = reasonText;
    document.getElementById("auth-gate-signin-btn").href = `login.html?redirect=${encodeURIComponent(targetUrl)}&mode=signin`;
    document.getElementById("auth-gate-signup-btn").href = `login.html?redirect=${encodeURIComponent(targetUrl)}&mode=signup`;
  }

  modal.classList.add("open");
}

function closeAuthGateModal() {
  const modal = document.getElementById("auth-gate-modal");
  if (modal) modal.classList.remove("open");
  const currentPath = (window.location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (PROTECTED_PAGES.includes(currentPath) && !isUserLoggedIn()) {
    window.location.href = "index.html";
  }
}

function enforceAuthGate() {
  const currentPath = (window.location.pathname.split("/").pop() || "index.html").split("?")[0];
  const loggedIn = isUserLoggedIn();

  // If on a protected page and not logged in, enforce the gate
  if (PROTECTED_PAGES.includes(currentPath) && !loggedIn) {
    let friendlyName = "Browse Requests";
    if (currentPath === "postrequest.html") friendlyName = "Post a Tutoring Request";
    if (currentPath === "profile.html") friendlyName = "My Profile & Sessions";

    // Show locked banner in main container
    const mainContainer = document.querySelector(".main-container");
    if (mainContainer) {
      mainContainer.innerHTML = `
        <div class="auth-gate-lock-overlay">
          <div class="auth-gate-icon-circle">🔒</div>
          <h2 style="font-family: 'Outfit', sans-serif; color: var(--primary-navy); margin: 0 0 10px;">
            Access to ${friendlyName} is Restricted
          </h2>
          <p style="color: #64748B; max-width: 500px; margin: 0 auto 24px; font-size: 15px;">
            To maintain campus safety, academic integrity, and verified peer communication, you must sign in or register before accessing this section.
          </p>
          <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
            <a href="login.html?redirect=${encodeURIComponent(currentPath)}&mode=signin" class="butt butt-browse">Sign In</a>
            <a href="login.html?redirect=${encodeURIComponent(currentPath)}&mode=signup" class="butt butt-post" style="color: var(--primary-navy); border-color: var(--border-color);">Create Account</a>
          </div>
        </div>
      `;
    }

    openAuthGateModal(currentPath, `You must sign in or create an account to access ${friendlyName}.`);
  }

  // Intercept links on all pages (e.g. index.html) when clicking protected targets
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const targetFile = (href.split("/").pop() || "").split("?")[0].split("#")[0];
    if (PROTECTED_PAGES.includes(targetFile) && !isUserLoggedIn()) {
      e.preventDefault();
      e.stopPropagation();
      openAuthGateModal(targetFile, `Please sign in or create an account to access ${link.textContent.trim() || 'this section'}.`);
    }
  }, true);
}

// ----------------------------------------------------
// UNIVERSAL REPORTING SYSTEM (MODAL & DISPATCH)
// ----------------------------------------------------
let currentReportContext = null;

function openReportModal({
  reportedUserId,
  reportedUserName,
  reportedUserEmail,
  reportedUserRole,
  requestId,
  requestTitle,
  sessionId,
  contextType // 'request' or 'tutor'
}) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    openAuthGateModal("browse.html", "Please sign in before submitting an incident report.");
    return;
  }

  currentReportContext = {
    reportedUserId,
    reportedUserName,
    reportedUserEmail,
    reportedUserRole: reportedUserRole || (contextType === 'tutor' ? 'Verified Peer Tutor' : 'Student Requester'),
    requestId: requestId || '',
    requestTitle: requestTitle || '',
    sessionId: sessionId || '',
    contextType: contextType || 'request'
  };

  let modal = document.getElementById("universal-report-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "universal-report-modal";
    modal.className = "app-modal-overlay";
    modal.innerHTML = `
      <div class="app-modal-card">
        <div class="app-modal-header">
          <h3 class="app-modal-title">🚩 Report Safety or Conduct Violation</h3>
          <button type="button" class="app-modal-close" onclick="closeUniversalReportModal()">&times;</button>
        </div>
        <form id="universal-report-form" onsubmit="handleUniversalReportSubmit(event)">
          <div class="app-modal-body">
            <div class="reported-target-card">
              <strong id="report-target-heading">Reporting User</strong>
              <span id="report-target-details">Details</span>
            </div>

            <div class="form-group" style="margin-bottom: 15px;">
              <label for="report-category" style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Violation Category *</label>
              <select id="report-category" class="admin-select" style="width: 100%; height: 42px;" required>
                <option value="Academic Integrity">Academic Integrity / Exam Cheating</option>
                <option value="Payment Dispute">Payment Dispute / Off-Platform Scam</option>
                <option value="No-Show & Spam">No-Show / False Advertising / Spam</option>
                <option value="Inappropriate Behavior">Inappropriate Conduct / Harassment</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 15px;">
              <label for="report-priority" style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Incident Urgency *</label>
              <select id="report-priority" class="admin-select" style="width: 100%; height: 42px;" required>
                <option value="High" selected>High Priority</option>
                <option value="Critical">Critical (Immediate Honor Code / Safety Risk)</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low / General Dispute</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 8px;">
              <label for="report-description" style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Description of Incident *</label>
              <textarea 
                id="report-description" 
                class="report-textarea" 
                placeholder="Explain what happened in detail. Provide times, messages exchanged, or honor code violations..." 
                required
              ></textarea>
            </div>
            <span style="font-size: 12px; color: #64748B;">This report is transmitted directly to the Admin Portal for immediate disciplinary investigation.</span>
          </div>

          <div class="app-modal-footer">
            <button type="button" class="butt butt-post butt-sm" style="color: var(--primary-navy); border-color: var(--border-color);" onclick="closeUniversalReportModal()">Cancel</button>
            <button type="submit" class="btn-submit-danger" id="report-submit-btn">
              <span>Submit Formal Report</span>
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUniversalReportModal();
    });
  }

  // Populate info
  const heading = document.getElementById("report-target-heading");
  const details = document.getElementById("report-target-details");
  const targetLabel = contextType === 'tutor' ? 'Reported Tutor' : 'Reported Requester';

  heading.textContent = `${targetLabel}: ${reportedUserName}`;
  details.textContent = requestTitle 
    ? `Associated Listing: "${requestTitle}" • Role: ${currentReportContext.reportedUserRole}`
    : `Session Incident • Role: ${currentReportContext.reportedUserRole}`;

  document.getElementById("report-description").value = "";
  modal.classList.add("open");
}

function closeUniversalReportModal() {
  const modal = document.getElementById("universal-report-modal");
  if (modal) modal.classList.remove("open");
  currentReportContext = null;
}

async function handleUniversalReportSubmit(e) {
  e.preventDefault();
  if (!currentReportContext) return;

  const category = document.getElementById("report-category").value;
  const priority = document.getElementById("report-priority").value;
  const description = document.getElementById("report-description").value.trim();
  const submitBtn = document.getElementById("report-submit-btn");

  if (!description) {
    showToast("Please provide incident details in the description box.", "⚠️");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>Submitting...</span>`;

  const currentUser = getCurrentUser() || { name: "Campus Scholar", email: "student@campus.edu", studentId: "STU-USER" };
  const reportPayload = {
    title: `${category} Incident involving ${currentReportContext.reportedUserName}`,
    category,
    priority,
    reportedUserId: currentReportContext.reportedUserId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
    reportedUserName: currentReportContext.reportedUserName,
    reportedUserEmail: currentReportContext.reportedUserEmail || `${currentReportContext.reportedUserName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
    reportedUserRole: currentReportContext.reportedUserRole,
    reporterId: currentUser.studentId || currentUser.uid || 'STU-REPORTER',
    reporterName: currentUser.name || 'Anonymous Student',
    reporterRole: currentUser.role === 'tutor' ? 'Verified Peer Tutor' : 'Student Requester',
    description,
    evidence: `Submitted via Platform Interface on ${new Date().toLocaleDateString()}. Listing: ${currentReportContext.requestTitle || currentReportContext.sessionId || 'Direct'}`,
    requestId: currentReportContext.requestId || '',
    requestTitle: currentReportContext.requestTitle || ''
  };

  // 1. Try sending to backend server API
  try {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });
  } catch (err) {
    console.warn("Backend API not reachable, saving to localStorage:", err);
  }

  // 2. Also persist in local storage so admin.html reflects immediately even offline
  const localReports = getStoredReports();
  const newLocalReport = {
    id: "REP-2026-" + Math.floor(100 + Math.random() * 900),
    ...reportPayload,
    createdAt: "Just Now",
    timestamp: Date.now(),
    status: "pending",
    assignedAdmin: "Unassigned",
    resolutionNote: "Pending triage."
  };
  localReports.unshift(newLocalReport);
  saveReports(localReports);

  // 3. Close modal & show confirmation
  closeUniversalReportModal();
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span>Submit Formal Report</span>`;

  showToast(`Report filed against ${currentReportContext.reportedUserName}. Reflected in Admin Console.`, "🛡️");
}

window.openReportModal = openReportModal;
window.closeUniversalReportModal = closeUniversalReportModal;

// ----------------------------------------------------
// PAGE TRANSITIONS & DOM READY
// ----------------------------------------------------
function initPageTransitions() {
  window.addEventListener("pageshow", () => {
    document.body.classList.remove("page-fading-out");
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      link.target === "_blank" ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.defaultPrevented
    ) {
      return;
    }

    const currentPath = (window.location.pathname.split("/").pop() || "index.html").split("?")[0].split("#")[0];
    const targetPath = (href.split("/").pop() || "index.html").split("?")[0].split("#")[0];

    if (currentPath === targetPath) {
      return;
    }

    e.preventDefault();
    document.body.classList.add("page-fading-out");

    setTimeout(() => {
      window.location.href = href;
    }, 240);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthNav();
  enforceAuthGate();
  initPageTransitions();
});