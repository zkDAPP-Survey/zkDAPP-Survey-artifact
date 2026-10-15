import { setCredentials, navigate } from "../api.js"; // Note: actually imported from router/api

export function renderLogin() {
    const app = document.getElementById("app");
    const sidebar = document.getElementById("sidebar");
    
    sidebar.classList.add("hidden");
    
    app.innerHTML = `
        <div class="login-wrapper">
            <div class="login-card">
                <h1>ZkIssuer Login</h1>
                <form id="login-form">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="username" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit" class="login-btn">Sign In</button>
                </form>
                <p id="login-error" style="color:red; margin-top:15px; text-align:center;" class="hidden">
                    Invalid credentials
                </p>
            </div>
        </div>
    `;

    document.getElementById("login-form").onsubmit = async (e) => {
        e.preventDefault();
        const u = document.getElementById("username").value;
        const p = document.getElementById("password").value;
        
        // Try to fetch requests to verify credentials
        const auth = 'Basic ' + btoa(u + ':' + p);
        try {
            const res = await fetch('/api/credentials/requests', {
                headers: { 'Authorization': auth }
            });
            
            if (res.ok) {
                import("../api.js").then(api => {
                    api.setCredentials(u, p);
                    import("../router.js").then(router => router.navigate("/requests"));
                });
            } else {
                document.getElementById("login-error").classList.remove("hidden");
            }
        } catch (err) {
            document.getElementById("login-error").classList.remove("hidden");
        }
    };
}
