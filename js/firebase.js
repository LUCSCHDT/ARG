
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth, signInAnonymously } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import { getDatabase, ref, onValue, set } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2FZEWJTqR6Lh_bh2GYItAYNtYZUedu_w",
  authDomain: "argprojet-64d23.firebaseapp.com",
  databaseURL: "https://argprojet-64d23-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "argprojet-64d23",
  storageBucket: "argprojet-64d23.firebasestorage.app",
  messagingSenderId: "100479247619",
  appId: "1:100479247619:web:782c76c43ab32a362ab536"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const ready = signInAnonymously(auth);

export async function watchWorld(callback) {
    await ready;

    return onValue(
        ref(db, "world/protocol47"),
        snapshot => callback(snapshot.val() === true),
        error => console.error(error)
    );
}

export async function activateProtocol() {
    await ready;
    await set(ref(db, "world/protocol47"), true);
}