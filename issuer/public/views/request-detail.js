import { getRequest, approveRequest, rejectRequest } from "../api.js";
import { navigate } from "../router.js";

function claimsArrayToObject(claims) {
  const obj = {};
  claims.forEach(c => {
    obj[c.key] = c.value;
  });
  return obj;
}

function renderClaimsTable(claims, title = "Claims Information") {
  if (!claims || Object.keys(claims).length === 0) {
    return `<p>No claims available for this credential type.</p>`;
  }

  const rows = Object.entries(claims).map(([key, value]) => `
    <tr>
      <td>${key.replace(/_/g, ' ')}</td>
      <td>${value}</td>
    </tr>
  `).join("");

  return `
    <h3><i class="fas fa-info-circle"></i> ${title}</h3>
    <table border="0" cellpadding="0" cellspacing="0">
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export async function renderRequestDetail(id) {
  const app = document.getElementById("app");
  app.innerHTML = "<p>Loading...</p>";

  try {
    const data = await getRequest(id);
    const claims = claimsArrayToObject(data.claims);

    let claimsSection = "";
    let claimsTitle = "Claims Information";

    if (data.credentialType === "UniversityDegree") {
      claimsTitle = "University Degree Information";
    } else if (data.credentialType === "Passport") {
      claimsTitle = "Passport Information";
    }
    // Fallback for other types or if no specific title is needed
    claimsSection = renderClaimsTable(claims, claimsTitle);


    const isPending = data.status === "PENDING";
    const rejectionReasonDisplay = data.rejectionReason ? `<p><b>Rejection Reason:</b> ${data.rejectionReason}</p>` : '';

    app.innerHTML = `
      <h2><i class="fas fa-info-circle" style="color: #00a8df"></i> Credential Request Detail</h2>

      <div class="detail-info">
        <p><b>Request ID:</b> #${data.id}</p>
        <p><b>Transaction ID:</b> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${data.transactionId}</code></p>
        <p><b>Credential Type:</b> <span class="badge">${data.credentialType}</span></p>
        <p><b>Status:</b> <span class="status-badge status-${data.status.toLowerCase()}">${data.status}</span></p>
        <p><b>Requested at:</b> ${new Date(data.requestedAt).toLocaleString()}</p>
        ${data.approvedAt ? `<p><b>Approved at:</b> ${new Date(data.approvedAt).toLocaleString()}</p>` : ''}
        ${data.rejectedAt ? `<p><b>Rejected at:</b> ${new Date(data.rejectedAt).toLocaleString()}</p>` : ''}
        ${rejectionReasonDisplay}
      </div>

      ${claimsSection}

      <div class="detail-actions">
        ${isPending ? `<button id="approve" class="btn-success"><i class="fas fa-check"></i> Approve</button>` : ''}
        ${isPending ? `<button id="reject" class="btn-danger"><i class="fas fa-times"></i> Reject</button>` : ''}
        <button id="back" class="btn-secondary"><i class="fas fa-arrow-left"></i> Back to List</button>
      </div>
    `;

    if (isPending) {
      document.getElementById("approve").onclick = async () => {
        if (!confirm("Are you sure you want to approve this request?")) return;
        try {
          await approveRequest(id);
          alert("Credential request approved!");
          navigate("/requests");
        } catch (e) {
          alert(`Approve failed: ${e.message}`);
        }
      };

      document.getElementById("reject").onclick = async () => {
        const reason = prompt("Enter rejection reason:");
        if (!reason || reason.trim() === "") return;

        try {
            await rejectRequest(id, reason);
            alert("Credential request rejected!");
            navigate("/requests");
        } catch (e) {
            alert(`Reject failed: ${e.message}`);
        }
      };
    }

    document.getElementById("back").onclick = () => navigate("/requests");
  } catch (e) {
    app.innerHTML = `<p style="color:red">Error loading request detail: ${e.message}</p>`;
  }
}
