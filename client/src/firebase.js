// firebase.js - כולל יצירת חדר + משתמשים בסיסיים
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  update,
  remove,
  get
} from "firebase/database";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCE8meJjumBFoXc_MBJkfCtnMC-JsAT9k4",
  authDomain: "chipmanager-a36dc.firebaseapp.com",
  databaseURL: "https://chipmanager-a36dc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chipmanager-a36dc",
  storageBucket: "chipmanager-a36dc.appspot.com",
  messagingSenderId: "987680548755",
  appId: "1:987680548755:web:f9212c6c15c4d9f3af6a66",
  measurementId: "G-K5W39L27DX"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// פונקציה ליצירת מזהה ייחודי
function generateUniqueId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// יצירת חדר חדש עם createdAt
async function createRoom() {
  const now = new Date();
  const createdAt = now.toLocaleString("he-IL", {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
  const roomId = `${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}  -  ${now.getHours()}:${now.getMinutes()}`;
  const ownerId = auth.currentUser?.uid;
  localStorage.setItem("ownerId", ownerId);

  await set(ref(database, `rooms/${roomId}`), {
    ownerId,
    players: [],
    history: [],
    locked: false,
    summaryLines: [],
    createdAt
  });

  return roomId;
}

// בדיקה האם המשתמש הנוכחי הוא בעל החדר
async function isRoomOwner(roomId) {
  const currentUserId = localStorage.getItem("ownerId");
  const roomSnapshot = await get(ref(database, `rooms/${roomId}`));
  if (!roomSnapshot.exists()) return false;
  const roomData = roomSnapshot.val();
  return roomData.ownerId === currentUserId;
}

// מחיקת חדר
async function deleteRoom(roomId) {
  await remove(ref(database, `rooms/${roomId}`));
}

// ניקוי שחקנים
async function clearRoomPlayers(roomId) {
  await set(ref(database, `rooms/${roomId}/players`), []);
}

// הרשמה עם אימייל + סיסמה
async function register(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;

  await set(ref(database, `users/${user.uid}`), {
    name: displayName,
    email: user.email
  });

  return user;
}

// התחברות עם אימייל + סיסמה
async function login(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// הפניה ישירה לנתיב משתמש
function getUserRef(uid) {
  return ref(database, `users/${uid}`);
}

export {
  database,
  ref,
  set,
  onValue,
  update,
  remove,
  get,
  auth,
  createRoom,
  isRoomOwner,
  deleteRoom,
  clearRoomPlayers,
  generateUniqueId,
  register,
  login,
  getUserRef
};
