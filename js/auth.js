const Auth = {
    login(username, password) {
        const accounts = {
            guest: "1234",
            admin: "1999"
        };

        const role = username.toLowerCase();

        if (accounts[role] !== password) {
            return false;
        }

        sessionStorage.setItem("role", role);
        window.location.href = role + ".html";
        return true;
    },

    getRole() {
        return sessionStorage.getItem("role");
    },

    requireRole(role) {
        if (this.getRole() !== role) {
            window.location.replace("index.html");
        }
    },

    logout() {
        sessionStorage.removeItem("role");
        window.location.replace("index.html");
    }
};