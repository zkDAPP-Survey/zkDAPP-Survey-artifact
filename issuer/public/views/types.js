import { getCredentialTypes, deleteCredentialType } from "../api.js";

export async function renderCredentialTypes() {
    const app = document.getElementById("app");
    app.innerHTML = "<p>Loading...</p>";

    try {
        const types = await getCredentialTypes();

        app.innerHTML = `
            <h2><i class="fas fa-layer-group" style="color: #00a8df"></i> Credential Schemes</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Scheme Name</th>
                        <th>Claims</th>
                        <th style="text-align: right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${types.credentialTypes.map(t => `
                        <tr>
                            <td><strong>${t.typeName}</strong></td>
                            <td><span class="badge">${t.requiredClaimKeys.length} fields</span></td>
                            <td style="text-align: right">
                                <button class="btn-delete" data-type="${t.typeName}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        app.querySelectorAll(".btn-delete").forEach(btn => {
            btn.onclick = async () => {
                const typeName = btn.dataset.type;
                if (confirm(`Are you sure you want to delete scheme "${typeName}"?`)) {
                    try {
                        await deleteCredentialType(typeName);
                        renderCredentialTypes();
                    } catch (e) {
                        alert("Delete failed: " + e.message);
                    }
                }
            };
        });

    } catch (e) {
        app.innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
    }
}
