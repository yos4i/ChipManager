import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  update,
  remove,
  get,
  push
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

//
// 🔤 יצירת מזהה חדר רנדומלי (4 תווים מ־a-z ו־0-9)
//
function generateRoomId(length = 4) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

//
// 🆕 יצירת חדר חדש עם מזהה קצר ותאריך יצירה
//
async function createRoom() {
  let roomId = generateRoomId();
  const ownerId = auth.currentUser?.uid;
  const now = new Date();
  const createdAt = now.toLocaleString("he-IL", {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  // ודא שהמזהה לא תפוס כבר
  const existing = await get(ref(database, `rooms/${roomId}`));
  if (existing.exists()) {
    return createRoom(); // אם קיים – צור חדש
  }

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

//
// 🎯 יצירת טורניר חדש
//
async function createTournament() {
  let tournamentId = generateRoomId();
  const ownerId = auth.currentUser?.uid;
  const now = new Date();
  const createdAt = now.toLocaleString("he-IL", {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  // ודא שהמזהה לא תפוס כבר
  const existing = await get(ref(database, `tournaments/${tournamentId}`));
  if (existing.exists()) {
    return createTournament(); // אם קיים – צור חדש
  }

  localStorage.setItem("ownerId", ownerId);

  await set(ref(database, `tournaments/${tournamentId}`), {
    ownerId,
    players: [],
    stages: [],
    currentStageIndex: 0,
    createdAt,
    locked: false
  });

  return tournamentId;
}

//
// ✅ בדיקה אם המשתמש הוא בעל החדר
//
async function isRoomOwner(roomId) {
  const currentUserId = auth.currentUser?.uid;
  const roomSnapshot = await get(ref(database, `rooms/${roomId}`));
  if (!roomSnapshot.exists()) return false;
  const roomData = roomSnapshot.val();
  return roomData.ownerId === currentUserId;
}

//
// ❓ בדיקה אם חדר קיים לפי מזהה (לצורך כניסת אורח)
//
async function doesRoomExist(roomId) {
  const roomSnapshot = await get(ref(database, `rooms/${roomId}`));
  return roomSnapshot.exists();
}

//
// 🧹 ניקוי שחקנים מחדר
//
async function clearRoomPlayers(roomId) {
  await set(ref(database, `rooms/${roomId}/players`), []);
}

//
// ❌ מחיקת חדר
//
async function deleteRoom(roomId) {
  await remove(ref(database, `rooms/${roomId}`));
}

//
// 👤 הרשמה עם אימייל + סיסמה
//
async function register(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;

  await set(ref(database, `users/${user.uid}`), {
    name: displayName,
    email: user.email
  });

  return user;
}

//
// 🔐 התחברות עם אימייל + סיסמה
//
async function login(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

//
// 🔗 גישה ישירה למשתמש
//
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
  createTournament,
  isRoomOwner,
  doesRoomExist,
  deleteRoom,
  clearRoomPlayers,
  generateRoomId,
  register,
  login,
  getUserRef
};
