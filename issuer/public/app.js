import { handleRoute, navigate } from './router.js';
import { getRequests } from './api.js';

async function checkAuth() {
    const authHeader = localStorage.getItem('authHeader');
    const loginScreen = document.getElementById('login-screen');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (!authHeader) {
        showLogin();
        return;
    }

    try {
        // Test auth by fetching requests
        await getRequests();
        
        loginScreen.classList.add('hidden');
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('hidden');
        handleRoute();
    } catch (e) {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('main-content').classList.add('hidden');
}

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    const authHeader = 'Basic ' + btoa(user + ':' + pass);
    
    try {
        const response = await fetch('/api/credentials/requests', {
            headers: { 'Authorization': authHeader }
        });

        if (response.ok) {
            localStorage.setItem('authHeader', authHeader);
            errorDiv.style.display = 'none';
            checkAuth();
        } else {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = 'Server connection failed';
        errorDiv.style.display = 'block';
    }
};

document.getElementById('logout-button').onclick = () => {
    localStorage.removeItem('authHeader');
    location.reload();
};

document.getElementById('nav-requests-btn').onclick = () => {
    navigate('/requests');
};

document.getElementById('nav-types-btn').onclick = () => {
    navigate('/types');
};

window.onload = checkAuth;
window.onhashchange = handleRoute;
