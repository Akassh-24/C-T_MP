// ===================================================================
// Campus-Tutor Firebase Backend Service Layer (Firebase v10 Modular)
// ===================================================================

import { firebaseConfig, isFirebaseConfigured, getActiveFirebaseConfig, saveCustomFirebaseConfig, clearCustomFirebaseConfig } from "./firebase-config.js";

// Firebase CDN modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const SEED_REQUESTS = [];

const SEED_MEMBERS = [
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

const SEED_REPORTS = [
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

const SEED_OFFERS = [];

class CampusBackendService {
  constructor() {
    this.isLiveFirebase = false;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.authSubscribers = [];
    this.requestSubscribers = [];
    this.currentUser = null;
    this.isReady = false;

    this.init();
  }

  init() {
    const activeConfig = getActiveFirebaseConfig();
    try {
      if (isFirebaseConfigured()) {
        this.app = initializeApp(activeConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.isLiveFirebase = true;

        onAuthStateChanged(this.auth, async (fbUser) => {
          if (fbUser) {
            const userProfile = await this.fetchUserProfile(fbUser.uid);
            this.currentUser = userProfile || {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email.split("@")[0],
              email: fbUser.email,
              role: "student",
              avatar: this.getInitials(fbUser.displayName || fbUser.email)
            };
            localStorage.setItem("campus_tutor_user", JSON.stringify(this.currentUser));
          } else {
            this.currentUser = null;
            localStorage.removeItem("campus_tutor_user");
          }
          this.notifyAuthSubscribers(this.currentUser);
        });

        this.seedFirestoreIfEmpty();
      } else {
        this.currentUser = this.getLocalCurrentUser();
      }
    } catch (err) {
      this.isLiveFirebase = false;
      this.currentUser = this.getLocalCurrentUser();
    }

    this.isReady = true;
    this.renderFirebaseStatusBadge();

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("campus-backend-ready", { detail: this }));
    }, 0);
  }

  async signUpStudent({ name, email, password, studentId, department, year }) {
    if (!name || !email || !password) {
      throw new Error("Full name, campus email, and password are required.");
    }

    const initials = this.getInitials(name);

    if (this.isLiveFirebase && this.auth) {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const userDoc = {
        uid: user.uid,
        name: name,
        email: email,
        studentId: studentId || "STU-" + Math.floor(1000 + Math.random() * 9000),
        role: "student",
        roleLabel: "Verified Student",
        department: department || "Computer Science",
        year: year || "Freshman",
        avatar: initials,
        status: "active",
        rating: 5.0,
        reviewsCount: 0,
        sessionsCount: 0,
        requestsCount: 0,
        strikes: 0,
        tags: [department || "Computer Science"],
        bio: `Campus student studying ${department || "academics"}. Looking forward to peer study sessions!`,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(this.db, "users", user.uid), userDoc);
      this.currentUser = userDoc;
      localStorage.setItem("campus_tutor_user", JSON.stringify(userDoc));
      this.notifyAuthSubscribers(userDoc);
      return userDoc;
    } else {
      const demoUser = {
        uid: "local-" + Date.now(),
        name: name,
        email: email,
        studentId: studentId || "STU-8821",
        role: "student",
        roleLabel: "Verified Student",
        department: department || "Computer Science & Engineering",
        year: year || "Sophomore (2nd Year)",
        avatar: initials,
        status: "active",
        rating: 5.0,
        reviewsCount: 0,
        sessionsCount: 0,
        requestsCount: 0,
        strikes: 0,
        bio: `Campus student studying ${department || "academics"}.`,
        loginTime: new Date().toISOString()
      };

      const members = this.getLocalMembers();
      members.unshift({
        id: "MEM-" + Math.floor(200 + Math.random() * 800),
        ...demoUser,
        joinDate: "Just Now",
        tags: [department || "Computer Science"]
      });
      this.saveLocalMembers(members);

      this.currentUser = demoUser;
      localStorage.setItem("campus_tutor_user", JSON.stringify(demoUser));
      this.notifyAuthSubscribers(demoUser);
      return demoUser;
    }
  }

  async signInStudent(email, password) {
    if (!email || !password) {
      throw new Error("Please enter your campus email and password.");
    }

    if (this.isLiveFirebase && this.auth) {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      let userProfile = await this.fetchUserProfile(user.uid);

      if (!userProfile) {
        userProfile = {
          uid: user.uid,
          name: user.displayName || email.split("@")[0],
          email: user.email,
          role: "student",
          avatar: this.getInitials(user.displayName || email)
        };
      }

      if (userProfile.status === "suspended") {
        await fbSignOut(this.auth);
        throw new Error("This account is currently suspended due to safety or integrity violations. Please contact the administrator.");
      }

      this.currentUser = userProfile;
      localStorage.setItem("campus_tutor_user", JSON.stringify(userProfile));
      this.notifyAuthSubscribers(userProfile);
      return userProfile;
    } else {
      let displayName = "Student User";
      if (email.includes("@")) {
        const local = email.split("@")[0].replace(".", " ");
        displayName = local.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }

      const demoUser = {
        uid: "local-" + Date.now(),
        name: displayName,
        email: email,
        role: "student",
        roleLabel: "Verified Student",
        department: "Computer Science & Engineering",
        year: "Sophomore • 2nd Year",
        avatar: this.getInitials(displayName),
        status: "active",
        rating: 4.9,
        reviewsCount: 14,
        sessionsCount: 22,
        requestsCount: 2,
        loginTime: new Date().toISOString()
      };

      this.currentUser = demoUser;
      localStorage.setItem("campus_tutor_user", JSON.stringify(demoUser));
      this.notifyAuthSubscribers(demoUser);
      return demoUser;
    }
  }

  async signInAdmin(email, password) {
    if (!email || !password) {
      throw new Error("Please enter administrative credentials.");
    }

    if (this.isLiveFirebase && this.auth) {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      const userProfile = await this.fetchUserProfile(user.uid);

      if (!userProfile || userProfile.role !== "admin") {
        await fbSignOut(this.auth);
        throw new Error("Access Denied: The authenticated user does not have Administrator clearance.");
      }

      this.currentUser = userProfile;
      localStorage.setItem("campus_tutor_user", JSON.stringify(userProfile));
      this.notifyAuthSubscribers(userProfile);
      return userProfile;
    } else {
      const adminUser = {
        uid: "adm-master-01",
        name: "Administrator",
        email: email,
        role: "admin",
        department: "Institutional Operations & Safety",
        avatar: "AD",
        clearance: "Level-3 Senior Moderator",
        loginTime: new Date().toISOString()
      };

      this.currentUser = adminUser;
      localStorage.setItem("campus_tutor_user", JSON.stringify(adminUser));
      this.notifyAuthSubscribers(adminUser);
      return adminUser;
    }
  }

  async signInWithGoogle() {
    if (!this.isLiveFirebase || !this.auth) {
      throw new Error("Google Sign-In requires active Firebase credentials configured in firebase-config.js.");
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;

    let userProfile = await this.fetchUserProfile(user.uid);
    if (!userProfile) {
      userProfile = {
        uid: user.uid,
        name: user.displayName || "Campus Student",
        email: user.email,
        studentId: "STU-" + Math.floor(1000 + Math.random() * 9000),
        role: "student",
        roleLabel: "Verified Student",
        department: "General Studies",
        year: "Undergraduate",
        avatar: this.getInitials(user.displayName || user.email),
        status: "active",
        rating: 5.0,
        reviewsCount: 0,
        sessionsCount: 0,
        requestsCount: 0,
        strikes: 0,
        bio: "Joined Campus-Tutor via Google Campus Sign-In.",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(this.db, "users", user.uid), userProfile);
    }

    this.currentUser = userProfile;
    localStorage.setItem("campus_tutor_user", JSON.stringify(userProfile));
    this.notifyAuthSubscribers(userProfile);
    return userProfile;
  }

  async signOut() {
    if (this.isLiveFirebase && this.auth) {
      await fbSignOut(this.auth);
    }
    this.currentUser = null;
    localStorage.removeItem("campus_tutor_user");
    this.notifyAuthSubscribers(null);
  }

  onAuthChange(callback) {
    if (typeof callback === "function") {
      this.authSubscribers.push(callback);
      callback(this.getCurrentUser());
    }
  }

  notifyAuthSubscribers(user) {
    this.authSubscribers.forEach(cb => {
      try { cb(user); } catch (e) {}
    });
  }

  getCurrentUser() {
    if (this.currentUser) return this.currentUser;
    return this.getLocalCurrentUser();
  }

  getLocalCurrentUser() {
    const data = localStorage.getItem("campus_tutor_user");
    if (!data) return null;
    try { return JSON.parse(data); } catch { return null; }
  }

  async fetchUserProfile(uid) {
    if (!this.db) return null;
    try {
      const snap = await getDoc(doc(this.db, "users", uid));
      if (snap.exists()) {
        return { uid, ...snap.data() };
      }
    } catch (e) {}
    return null;
  }

  async updateUserProfile(patch) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("No active user session.");

    const updated = { ...user, ...patch };

    if (this.isLiveFirebase && this.db && user.uid) {
      await updateDoc(doc(this.db, "users", user.uid), patch);
    }

    this.currentUser = updated;
    localStorage.setItem("campus_tutor_user", JSON.stringify(updated));
    this.notifyAuthSubscribers(updated);
    return updated;
  }

  async getRequests() {
    if (this.isLiveFirebase && this.db) {
      try {
        const q = query(collection(this.db, "requests"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        return list;
      } catch (err) {}
    }
    return this.getLocalRequests();
  }

  subscribeRequests(callback) {
    if (typeof callback !== "function") return () => {};
    this.requestSubscribers.push(callback);

    if (this.isLiveFirebase && this.db) {
      try {
        const q = query(collection(this.db, "requests"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, (snap) => {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          callback(list);
        }, (err) => {
          callback(this.getLocalRequests());
        });
        return () => {
          unsub();
          this.requestSubscribers = this.requestSubscribers.filter(cb => cb !== callback);
        };
      } catch (e) {}
    }

    callback(this.getLocalRequests());
    return () => {
      this.requestSubscribers = this.requestSubscribers.filter(cb => cb !== callback);
    };
  }

  notifyRequestSubscribers(list) {
    const data = list || this.getLocalRequests();
    this.requestSubscribers.forEach(cb => {
      try { cb(data); } catch (e) {}
    });
  }

  async createRequest(reqData) {
    const user = this.getCurrentUser();
    const payload = {
      ...reqData,
      requesterId: user ? (user.uid || user.id) : ("anon-" + Date.now()),
      requesterName: reqData.requesterName || (user ? user.name : "Campus Student"),
      requesterEmail: reqData.requesterEmail || (user ? user.email : ""),
      status: "open",
      offersCount: 0,
      timestamp: Date.now()
    };

    if (this.isLiveFirebase && this.db) {
      const docRef = await addDoc(collection(this.db, "requests"), payload);
      const created = { id: docRef.id, ...payload };
      
      if (user && user.uid) {
        try {
          await updateDoc(doc(this.db, "users", user.uid), {
            requestsCount: (user.requestsCount || 0) + 1
          });
          user.requestsCount = (user.requestsCount || 0) + 1;
          localStorage.setItem("campus_tutor_user", JSON.stringify(user));
        } catch (_) {}
      }
      return created;
    } else {
      const created = { id: "req-" + Date.now(), ...payload };
      const current = this.getLocalRequests();
      current.unshift(created);
      this.saveLocalRequests(current);

      if (user) {
        user.requestsCount = (user.requestsCount || 0) + 1;
        localStorage.setItem("campus_tutor_user", JSON.stringify(user));
        this.notifyAuthSubscribers(user);
      }
      this.notifyRequestSubscribers(current);
      return created;
    }
  }

  async submitOffer(offerData) {
    const user = this.getCurrentUser();
    const payload = {
      ...offerData,
      tutorId: user ? (user.uid || user.id) : ("tutor-" + Date.now()),
      tutorName: offerData.tutorName || (user ? user.name : "Peer Tutor"),
      tutorContact: offerData.tutorContact || (user ? user.email : ""),
      timestamp: Date.now(),
      status: "pending"
    };

    if (this.isLiveFirebase && this.db) {
      const docRef = await addDoc(collection(this.db, "offers"), payload);
      if (offerData.requestId) {
        try {
          const reqRef = doc(this.db, "requests", offerData.requestId);
          const reqSnap = await getDoc(reqRef);
          if (reqSnap.exists()) {
            await updateDoc(reqRef, {
              offersCount: (reqSnap.data().offersCount || 0) + 1
            });
          }
        } catch (e) {}
      }
      return { id: docRef.id, ...payload };
    } else {
      const allOffers = this.getLocalOffers();
      const created = { id: "off-" + Date.now(), ...payload };
      allOffers.unshift(created);
      this.saveLocalOffers(allOffers);

      const current = this.getLocalRequests();
      const target = current.find(r => r.id === offerData.requestId);
      if (target) {
        target.offersCount = (target.offersCount || 0) + 1;
        this.saveLocalRequests(current);
        this.notifyRequestSubscribers(current);
      }
      return created;
    }
  }

  async getOffers(requestId) {
    if (this.isLiveFirebase && this.db) {
      try {
        const q = query(collection(this.db, "offers"), where("requestId", "==", requestId));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return list;
      } catch (err) {}
    }
    const all = this.getLocalOffers();
    return all.filter(o => o.requestId === requestId);
  }

  async deleteRequest(requestId) {
    const user = this.getCurrentUser();
    if (this.isLiveFirebase && this.db) {
      try {
        await deleteDoc(doc(this.db, "requests", requestId));
      } catch (e) {}
      if (user && user.uid && user.requestsCount > 0) {
        try {
          await updateDoc(doc(this.db, "users", user.uid), {
            requestsCount: Math.max(0, (user.requestsCount || 1) - 1)
          });
          user.requestsCount = Math.max(0, (user.requestsCount || 1) - 1);
          localStorage.setItem("campus_tutor_user", JSON.stringify(user));
        } catch (_) {}
      }
    }
    const current = this.getLocalRequests().filter(r => r.id !== requestId);
    this.saveLocalRequests(current);

    if (user && user.requestsCount > 0) {
      user.requestsCount = Math.max(0, (user.requestsCount || 1) - 1);
      localStorage.setItem("campus_tutor_user", JSON.stringify(user));
      this.notifyAuthSubscribers(user);
    }
    this.notifyRequestSubscribers(current);
    return true;
  }

  async getMembers() {
    if (this.isLiveFirebase && this.db) {
      try {
        const snap = await getDocs(collection(this.db, "users"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) return list;
      } catch (err) {}
    }
    return this.getLocalMembers();
  }

  subscribeMembers(callback) {
    if (this.isLiveFirebase && this.db) {
      try {
        return onSnapshot(collection(this.db, "users"), (snap) => {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          callback(list.length > 0 ? list : this.getLocalMembers());
        });
      } catch (e) {}
    }
    callback(this.getLocalMembers());
    return () => {};
  }

  async updateMember(memberId, patch) {
    if (this.isLiveFirebase && this.db) {
      try {
        await updateDoc(doc(this.db, "users", memberId), patch);
      } catch (err) {}
    }
    const list = this.getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId || m.uid === memberId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch };
      this.saveLocalMembers(list);
    }
  }

  async addMember(memberData) {
    const payload = {
      ...memberData,
      avatar: this.getInitials(memberData.name),
      createdAt: new Date().toISOString()
    };
    if (this.isLiveFirebase && this.db) {
      const docRef = await addDoc(collection(this.db, "users"), payload);
      return { id: docRef.id, ...payload };
    } else {
      const created = { id: "MEM-" + Math.floor(200 + Math.random() * 800), ...payload };
      const current = this.getLocalMembers();
      current.unshift(created);
      this.saveLocalMembers(current);
      return created;
    }
  }

  async getReports() {
    if (this.isLiveFirebase && this.db) {
      try {
        const snap = await getDocs(collection(this.db, "reports"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) return list;
      } catch (err) {}
    }
    return this.getLocalReports();
  }

  subscribeReports(callback) {
    if (this.isLiveFirebase && this.db) {
      try {
        return onSnapshot(collection(this.db, "reports"), (snap) => {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          callback(list.length > 0 ? list : this.getLocalReports());
        });
      } catch (e) {}
    }
    callback(this.getLocalReports());
    return () => {};
  }

  async updateReport(reportId, patch) {
    if (this.isLiveFirebase && this.db) {
      try {
        await updateDoc(doc(this.db, "reports", reportId), patch);
      } catch (err) {}
    }
    const list = this.getLocalReports();
    const idx = list.findIndex(r => r.id === reportId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch };
      this.saveLocalReports(list);
    }
  }

  async addReport(reportData) {
    const payload = {
      ...reportData,
      status: "pending",
      timestamp: Date.now()
    };
    if (this.isLiveFirebase && this.db) {
      const docRef = await addDoc(collection(this.db, "reports"), payload);
      return { id: docRef.id, ...payload };
    } else {
      const created = { id: "REP-2026-" + Math.floor(100 + Math.random() * 900), ...payload };
      const current = this.getLocalReports();
      current.unshift(created);
      this.saveLocalReports(current);
      return created;
    }
  }

  async seedFirestoreIfEmpty() {
    if (!this.isLiveFirebase || !this.db) return;

    try {
      const reqSnap = await getDocs(collection(this.db, "requests"));
      if (reqSnap.empty) {
        for (const req of SEED_REQUESTS) {
          await addDoc(collection(this.db, "requests"), req);
        }
      }
    } catch (e) {}

    try {
      const userSnap = await getDocs(collection(this.db, "users"));
      if (userSnap.empty) {
        for (const member of SEED_MEMBERS) {
          await setDoc(doc(this.db, "users", member.id), member);
        }
      }
    } catch (_) {}

    try {
      const repSnap = await getDocs(collection(this.db, "reports"));
      if (repSnap.empty) {
        for (const rep of SEED_REPORTS) {
          await setDoc(doc(this.db, "reports", rep.id), rep);
        }
      }
    } catch (_) {}
  }

  getLocalRequests() {
    const data = localStorage.getItem("campus_tutor_requests");
    if (!data) {
      this.saveLocalRequests(SEED_REQUESTS);
      return SEED_REQUESTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return SEED_REQUESTS;
    }
  }

  saveLocalRequests(list) {
    localStorage.setItem("campus_tutor_requests", JSON.stringify(list));
  }

  getLocalOffers() {
    const data = localStorage.getItem("campus_tutor_offers");
    if (!data) {
      this.saveLocalOffers(SEED_OFFERS);
      return SEED_OFFERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return SEED_OFFERS;
    }
  }

  saveLocalOffers(list) {
    localStorage.setItem("campus_tutor_offers", JSON.stringify(list));
  }

  getLocalMembers() {
    const data = localStorage.getItem("campus_tutor_members");
    if (!data) {
      this.saveLocalMembers(SEED_MEMBERS);
      return SEED_MEMBERS;
    }
    try {
      const parsed = JSON.parse(data);
      const hasOldDemos = parsed.some(m => m.name === "Priya Sharma" || m.name === "Jordan Lee" || m.name === "Samantha Ray" || m.name === "Marcus Vance");
      if (hasOldDemos) {
        this.saveLocalMembers(SEED_MEMBERS);
        return SEED_MEMBERS;
      }
      return parsed;
    } catch {
      return SEED_MEMBERS;
    }
  }

  saveLocalMembers(list) {
    localStorage.setItem("campus_tutor_members", JSON.stringify(list));
  }

  getLocalReports() {
    const data = localStorage.getItem("campus_tutor_reports");
    if (!data) {
      this.saveLocalReports(SEED_REPORTS);
      return SEED_REPORTS;
    }
    try {
      const parsed = JSON.parse(data);
      const hasOldDemos = parsed.some(r => r.id === "REP-2026-081" || r.id === "REP-2026-075" || r.id === "REP-2026-068");
      if (hasOldDemos) {
        this.saveLocalReports(SEED_REPORTS);
        return SEED_REPORTS;
      }
      return parsed;
    } catch {
      return SEED_REPORTS;
    }
  }

  saveLocalReports(list) {
    localStorage.setItem("campus_tutor_reports", JSON.stringify(list));
  }

  getInitials(name) {
    if (!name) return "CT";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  renderFirebaseStatusBadge() {
    let badge = document.getElementById("backend-status-pill");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "backend-status-pill";
      badge.className = "backend-status-pill";
      document.body.appendChild(badge);
    }

    const activeConfig = getActiveFirebaseConfig();

    if (this.isLiveFirebase) {
      badge.innerHTML = `
        <span class="status-dot live"></span>
        <span>Firebase: <strong>Connected (Live)</strong></span>
        <button type="button" class="setup-badge-btn" onclick="CampusBackend.openFirebaseSetupModal()">⚙️</button>
      `;
      badge.title = `Connected to Firebase Project: ${activeConfig.projectId}. Real-time synchronization active.`;
    } else {
      badge.innerHTML = `
        <span class="status-dot demo"></span>
        <span>Backend: <strong>Demo Mode</strong></span>
        <button type="button" class="setup-badge-btn" onclick="CampusBackend.openFirebaseSetupModal()">Configure ⚙️</button>
      `;
      badge.title = "Operating in local simulation mode. Click Configure to connect live Firebase credentials.";
    }
  }

  openFirebaseSetupModal() {
    let modal = document.getElementById("firebase-setup-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "firebase-setup-modal";
      modal.className = "admin-modal-overlay open";
      document.body.appendChild(modal);
    } else {
      modal.classList.add("open");
    }

    const currentCfg = getActiveFirebaseConfig();
    const isCustom = Boolean(localStorage.getItem("campus_tutor_firebase_config"));

    modal.innerHTML = `
      <div class="admin-modal-card" style="max-width: 620px;">
        <div class="admin-modal-header">
          <h3 style="display: flex; align-items: center; gap: 8px;">
            <span>🔥 Firebase Backend Configuration</span>
          </h3>
          <button type="button" class="admin-modal-close-btn" onclick="document.getElementById('firebase-setup-modal').remove()">&times;</button>
        </div>
        <div class="admin-modal-body">
          <p style="font-size: 13.5px; color: #475569; margin-top: 0;">
            Connect this app to your live <strong>Firebase Authentication</strong> &amp; <strong>Cloud Firestore</strong> database:
          </p>
          <ol style="font-size: 13px; color: #334155; line-height: 1.6; padding-left: 20px; margin-bottom: 12px;">
            <li>Go to <a href="https://console.firebase.google.com" target="_blank" style="color: #2563EB; font-weight: 600;">console.firebase.google.com</a> and create or select your project.</li>
            <li>Enable <strong>Authentication</strong> (Email/Password &amp; Google) and <strong>Cloud Firestore</strong>.</li>
            <li>Paste your Web App config credentials below OR edit <code>firebase-config.js</code> directly.</li>
          </ol>

          <label style="display: block; font-size: 12.5px; font-weight: 600; color: #1E293B; margin-bottom: 6px;">
            Firebase Config JSON / JS Object:
          </label>
          <textarea 
            id="firebase-config-input" 
            rows="6" 
            style="width: 100%; font-family: monospace; font-size: 12px; padding: 10px; border-radius: 8px; border: 1.5px solid #CBD5E1; background: #F8FAFC; color: #1E293B; resize: vertical;"
            placeholder='{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-project-id",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'
          >${JSON.stringify(currentCfg, null, 2)}</textarea>

          <div id="firebase-config-alert" style="display: none; margin-top: 10px; padding: 8px 12px; border-radius: 6px; font-size: 12.5px;"></div>
        </div>
        <div class="admin-modal-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            ${isCustom ? `
              <button type="button" class="btn-action-icon btn-action-danger" onclick="CampusBackend.resetFirebaseConfig()">
                Reset to Default
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="admin-btn-secondary" onclick="document.getElementById('firebase-setup-modal').remove()">Cancel</button>
            <button type="button" class="admin-btn-primary" onclick="CampusBackend.saveAndApplyFirebaseConfig()">Save &amp; Connect</button>
          </div>
        </div>
      </div>
    `;
  }

  saveAndApplyFirebaseConfig() {
    const raw = document.getElementById("firebase-config-input").value.trim();
    const alertBox = document.getElementById("firebase-config-alert");
    try {
      let cfg;
      if (raw.startsWith("{")) {
        cfg = JSON.parse(raw);
      } else {
        const cleaned = raw
          .replace(/^(const|export const|let|var)\s+\w+\s*=\s*/, "")
          .replace(/;\s*$/, "")
          .replace(/(\w+)\s*:/g, '"$1":');
        cfg = JSON.parse(cleaned);
      }

      if (!cfg.apiKey || !cfg.projectId) {
        throw new Error("Config must contain at least 'apiKey' and 'projectId'.");
      }

      saveCustomFirebaseConfig(cfg);
      alertBox.style.display = "block";
      alertBox.style.background = "#ECFDF5";
      alertBox.style.color = "#065F46";
      alertBox.textContent = "✓ Configuration saved! Reloading application...";
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      alertBox.style.display = "block";
      alertBox.style.background = "#FEF2F2";
      alertBox.style.color = "#991B1B";
      alertBox.textContent = "Invalid format: " + err.message;
    }
  }

  resetFirebaseConfig() {
    clearCustomFirebaseConfig();
    window.location.reload();
  }
}

export const CampusBackend = new CampusBackendService();
window.CampusBackend = CampusBackend;

window.dispatchEvent(new CustomEvent("campus-backend-ready", { detail: CampusBackend }));