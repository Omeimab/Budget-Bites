import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJCyBXzmRIyYPFJ9jGzWzW4oGsfy0mKao",
  authDomain: "budget-bites-cf50b.firebaseapp.com",
  projectId: "budget-bites-cf50b",
  storageBucket: "budget-bites-cf50b.firebasestorage.app",
  messagingSenderId: "803742307254",
  appId: "1:803742307254:web:8e16c5473048d91311e7177"
};

export function initFirebase() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  return { db, auth };
}

export function signInAndSync({ db, auth, onReady, onData }) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      await signInAnonymously(auth);
      return;
    }

    const userId = user.uid;
    onReady(userId);

    const docRef = doc(db, "artifacts", "BBOM-v1", "users", userId, "data", "primary");
    onSnapshot(docRef, (snap) => {
      onData(snap.exists() ? snap.data() : {});
    });
  });
}

export async function saveData({
  db,
  userId,
  inventory,
  shoppingList,
  historicalWaste,
  monthlyBudget = 0,
  monthSpent = 0
}) {
  if (!userId) return;

  const docRef = doc(db, "artifacts", "BBOM-v1", "users", userId, "data", "primary");

  await setDoc(docRef, {
    inventory,
    shoppingList,
    historicalWaste,
    monthlyBudget,
    monthSpent,
    updated: new Date().toISOString()
  });
}
