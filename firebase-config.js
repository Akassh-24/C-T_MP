// ===================================================================
// Campus-Tutor Firebase Configuration
// ===================================================================
// To connect your live Firebase project:
// 1. Visit https://console.firebase.google.com
// 2. Create a project or select an existing one
// 3. Register a Web App (</>) and copy your credentials below
// 4. In Firebase Console:
//    - Enable Authentication -> Email/Password (and optionally Google)
//    - Enable Cloud Firestore Database (Start in test mode or deploy firestore.rules)
// ===================================================================

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "campus-tutor-mp.firebaseapp.com",
  projectId: "campus-tutor-mp",
  storageBucket: "campus-tutor-mp.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Check if actual configuration has been provided
export function getActiveFirebaseConfig() {
  try {
    const custom = localStorage.getItem("campus_tutor_firebase_config");
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed.apiKey && parsed.apiKey !== "YOUR_API_KEY" && parsed.projectId) {
        return parsed;
      }
    }
  } catch (_) {}
  return firebaseConfig;
}

export function isFirebaseConfigured() {
  const cfg = getActiveFirebaseConfig();
  return Boolean(
    cfg &&
    cfg.apiKey &&
    cfg.apiKey !== "YOUR_API_KEY" &&
    cfg.apiKey.trim().length > 10 &&
    cfg.projectId &&
    cfg.projectId !== "campus-tutor-mp"
  );
}

export function saveCustomFirebaseConfig(cfg) {
  if (!cfg || typeof cfg !== "object") throw new Error("Invalid config object");
  localStorage.setItem("campus_tutor_firebase_config", JSON.stringify(cfg));
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem("campus_tutor_firebase_config");
}
