// firebase.js - מעודכן: מזהה חדר תקני + createdAt נפרד
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

function generateUniqueId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// פונקציה מעודכנת: יצירת roomId תקני + שמירת createdAt נפרד
async function createRoom() {
  const now = new Date();
  const createdAt = now.toLocaleString("he-IL", {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
  const roomId = `${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}  -  ${now.getHours()}:${now.getMinutes()}`;
  const ownerId = generateUniqueId();
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

async function isRoomOwner(roomId) {
  const currentUserId = localStorage.getItem("ownerId");
  const roomSnapshot = await get(ref(database, `rooms/${roomId}`));
  if (!roomSnapshot.exists()) return false;
  const roomData = roomSnapshot.val();
  return roomData.ownerId === currentUserId;
}

async function deleteRoom(roomId) {
  await remove(ref(database, `rooms/${roomId}`));
}

async function clearRoomPlayers(roomId) {
  await set(ref(database, `rooms/${roomId}/players`), []);
}

export {
  database,
  ref,
  set,
  onValue,
  update,
  remove,
  get,
  createRoom,
  isRoomOwner,
  deleteRoom,
  clearRoomPlayers,
  generateUniqueId
};