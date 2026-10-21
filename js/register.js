import { auth, db, ready } from "./firebase.js";

import {
    ref,
    get,
    set,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const usernameInput = document.getElementById("username");
const registerButton = document.getElementById("register");
const status = document.getElementById("status");

registerButton.addEventListener("click", async () => {

    const username = usernameInput.value.trim();

    // 1. Vérifier le pseudo
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        status.textContent = "INVALID USERNAME";
        return;
    }

    registerButton.disabled = true;
    status.textContent = "REGISTERING...";

    try {
        // 2. Attendre la connexion Firebase
        await ready;

        const uid = auth.currentUser.uid;

        const playerRef = ref(db, "players/" + uid);

        // 3. Vérifier si ce navigateur possède déjà un profil
        const existing = await get(playerRef);

        if (existing.exists()) {
            status.textContent =
                "IDENTITY ALREADY REGISTERED: " +
                existing.val().username;
            return;
        }

        // 4. Normaliser le pseudo
        const normalizedUsername = username.toLowerCase();

        const usernameRef = ref(
            db,
            "usernames/" + normalizedUsername
        );

        // 5. Réserver le pseudo sans collision
        const result = await runTransaction(
            usernameRef,
            currentValue => {
                if (currentValue !== null) {
                    return;
                }

                return uid;
            },
            { applyLocally: false }
        );

        if (!result.committed) {
            status.textContent = "USERNAME ALREADY TAKEN";
            return;
        }

        // 6. Créer le profil
        try {
            await set(playerRef, {
                username: username,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            // Libérer le pseudo si la création échoue.
            // Ne pas supprimer aveuglément une réservation.
            console.error("PROFILE CREATION FAILED:", error);
            status.textContent =
                "PROFILE CREATION FAILED - CHECK FIREBASE";
            return;
        }

        // 7. Sauvegarder le pseudo localement
        localStorage.setItem("nexus_username", username);

        status.textContent =
            "IDENTITY CREATED: " + username;

        console.log("PLAYER REGISTERED:", username);

    } catch (error) {
        console.error("REGISTRATION ERROR:", error);

        status.textContent =
            "REGISTRATION FAILED: " + error.message;

    } finally {
        registerButton.disabled = false;
    }

});