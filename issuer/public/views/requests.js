import {
  getRequests,
  getCredentialTypes,
  getCredentialTypesNames,
} from '../api.js';
import { navigate } from "../router.js";

let currentFilters = {
    status: "",
    type: ""
};

export async function renderRequests() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Loading...</p>";
    
    try {
        const types = await getCredentialTypesNames();
        const requests = await getRequests(currentFilters);

        app.innerHTML = `
            <h2><i class="fas fa-file-invoice" style="color: #00a8df"></i> Credential Requests</h2>

            <div class="filters-container">
                <div class="filter-group">
                    <label>Status</label>
                    <select id="filter-status">
                        <option value="">All Statuses</option>
                        <option value="PENDING" ${currentFilters.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                        <option value="APPROVED" ${currentFilters.status === 'APPROVED' ? 'selected' : ''}>Approved</option>
                        <option value="REJECTED" ${currentFilters.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Type</label>
                    <select id="filter-type">
                        <option value="">All Types</option>
                        ${types.credentialTypes.map(t => `<option value="${t}" ${currentFilters.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <button id="reset-filters" class="btn-secondary">Reset</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Credential Type</th>
                        <th>Created At</th>
                        <th>Status</th>
                        <th style="text-align: right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.length === 0 ? '<tr><td colspan="5" style="text-align:center">No requests found</td></tr>' : 
                      requests.map(r => `
                        <tr>
                            <td>#${r.id}</td>
                            <td><strong>${r.credentialType}</strong></td>
                            <td>${new Date(r.requestedAt).toLocaleDateString()}</td>
                            <td><span class="status-badge status-${r.status.toLowerCase()}">${r.status}</span></td>
                            <td style="text-align: right">
                                <button class="btn-primary" data-id="${r.id}">
                                    <i class="fas fa-external-link-alt"></i> Open
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        // Event listeners for filters
        document.getElementById("filter-status").onchange = (e) => {
            currentFilters.status = e.target.value;
            renderRequests();
        };

        document.getElementById("filter-type").onchange = (e) => {
            currentFilters.type = e.target.value;
            renderRequests();
        };

        document.getElementById("reset-filters").onclick = () => {
            currentFilters = { status: "", type: "" };
            renderRequests();
        };

        app.querySelectorAll("button[data-id]").forEach(btn => {
            btn.onclick = () => navigate(`/requests/${btn.dataset.id}`);
        });
    } catch (e) {
        app.innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
    }
}
