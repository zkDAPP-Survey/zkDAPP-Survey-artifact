async function authorizedFetch(url, options = {}) {
    const header = localStorage.getItem('authHeader');
    const headers = {
        ...options.headers,
        'Authorization': header
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        localStorage.removeItem('authHeader');
        window.location.reload();
        throw new Error("Unauthorized");
    }
    
    return response;
}

export async function getRequests(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await authorizedFetch(`/api/credentials/requests${queryString}`);
    let data = await response.json();

    // Client-side filtering for credentialType if not supported by backend
    if (filters.type) {
        data = data.filter(r => r.credentialType === filters.type);
    }
    
    return data;
}

export async function getRequest(id) {
    const response = await authorizedFetch(`/api/credentials/requests/${id}`);
    return response.json();
}

export async function approveRequest(id) {
    const response = await authorizedFetch(`/api/credentials/requests/${id}/approve`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Approve failed');
    return response.json();
}

export async function rejectRequest(id, reason) {
    const response = await authorizedFetch(`/api/credentials/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Reject failed');
}

export async function getCredentialTypes() {
    const response = await authorizedFetch('/api/credentials/types');
    return response.json();
}

export async function getCredentialTypesNames() {
  const response = await authorizedFetch('/api/credentials/types/names');
  return response.json();
}


export async function deleteCredentialType(typeName) {
    const response = await authorizedFetch(`/api/credentials/types/${typeName}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Delete failed');
}
