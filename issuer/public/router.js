import { renderRequests } from './views/requests.js';
import { renderRequestDetail } from './views/request-detail.js';
import { renderCredentialTypes } from './views/types.js';

export function navigate(path) {
    location.hash = '#' + path;
}

export function handleRoute() {
    const hash = location.hash.replace('#', '') || '/requests';
    const app = document.getElementById('app');
    
    // Update active state in sidebar
    document.querySelectorAll('#sidebar nav button').forEach(btn => {
        btn.classList.remove('active');
    });

    if (hash === '/requests') {
        document.getElementById('nav-requests-btn')?.classList.add('active');
        renderRequests();
    } else if (hash.startsWith('/requests/')) {
        document.getElementById('nav-requests-btn')?.classList.add('active');
        const id = hash.split('/')[2];
        renderRequestDetail(id);
    } else if (hash === '/types') {
        document.getElementById('nav-types-btn')?.classList.add('active');
        renderCredentialTypes();
    } else {
        app.innerHTML = '<h2>404 Not Found</h2>';
    }
}

window.addEventListener('hashchange', handleRoute);
