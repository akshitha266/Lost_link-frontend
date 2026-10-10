/**
 * LostLink - Admin Management (Users, Items, Claims Moderation)
 */

document.addEventListener("DOMContentLoaded", () => {
  setupAdminDashboard();
  setupAdminUsersPage();
  setupAdminItemsPage();
  setupAdminClaimsPage();
});

/**
 * Admin Dashboard Page
 */
async function setupAdminDashboard() {
  const adminDashContainer = document.getElementById("adminDashRoot");
  if (!adminDashContainer) return;

  const adminUser = requireAdmin();
  if (!adminUser) return;

  try {
    const stats = await api.request("/admin/dashboard");

    const totalUsersEl = document.getElementById("adminTotalUsers");
    const totalLostEl = document.getElementById("adminTotalLost");
    const totalFoundEl = document.getElementById("adminTotalFound");
    const pendingClaimsEl = document.getElementById("adminPendingClaims");
    const resolvedItemsEl = document.getElementById("adminResolvedItems");

    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
    if (totalLostEl) totalLostEl.textContent = stats.totalLostItems || 0;
    if (totalFoundEl) totalFoundEl.textContent = stats.totalFoundItems || 0;
    if (pendingClaimsEl) pendingClaimsEl.textContent = stats.pendingClaims || 0;
    if (resolvedItemsEl) resolvedItemsEl.textContent = stats.resolvedItems || 0;

    // Load recent activity feed
    const activityFeed = document.getElementById("adminActivityFeed");
    if (activityFeed) {
      activityFeed.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.75rem; background: var(--bg-body); border-radius: var(--radius-sm);">
            <span class="badge badge-found" style="margin-top: 2px;">NEW</span>
            <div>
              <div style="font-size: 0.875rem; font-weight: 600;">Item reported: "Silver Apple MacBook Pro 14\""</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">CS Lab 302 &bull; Oct 1, 2026</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.75rem; background: var(--bg-body); border-radius: var(--radius-sm);">
            <span class="badge badge-pending" style="margin-top: 2px;">CLAIM</span>
            <div>
              <div style="font-size: 0.875rem; font-weight: 600;">Alex Johnson filed claim on MacBook Pro</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Verification answer awaiting review &bull; Oct 2, 2026</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.75rem; background: var(--bg-body); border-radius: var(--radius-sm);">
            <span class="badge badge-resolved" style="margin-top: 2px;">RESOLVED</span>
            <div>
              <div style="font-size: 0.875rem; font-weight: 600;">Textbook "Calculus Early Transcendentals" reunited</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Reclaimed and verified &bull; Oct 3, 2026</div>
            </div>
          </div>
        </div>
      `;
    }
  } catch (err) {
    showToast("Could not load admin metrics: " + err.message, "error");
  }
}

/**
 * Admin Users Management (admin-users.html)
 */
async function setupAdminUsersPage() {
  const container = document.getElementById("adminUsersTableBody");
  if (!container) return;

  const adminUser = requireAdmin();
  if (!adminUser) return;

  const searchInput = document.getElementById("adminUserSearch");

  async function loadUsers() {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center;"><div class="spinner"></div></td></tr>`;
    try {
      const users = await api.request("/admin/users");
      const query = (searchInput ? searchInput.value.trim() : "").toLowerCase();

      const filtered = users.filter(u => 
        !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No users matching query.</td></tr>`;
        return;
      }

      container.innerHTML = filtered.map(u => `
        <tr>
          <td>#${u.id}</td>
          <td><strong>${escapeHtml(u.name)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td>
            <span class="badge ${u.role === 'ADMIN' ? 'badge-lost' : 'badge-category'}">
              ${escapeHtml(u.role)}
            </span>
          </td>
          <td>
            <span class="badge ${u.active ? 'badge-approved' : 'badge-rejected'}">
              ${u.active ? 'ACTIVE' : 'DEACTIVATED'}
            </span>
          </td>
          <td style="text-align: right;">
            ${u.role !== 'ADMIN' ? `
              <button class="btn ${u.active ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggleUserStatus(${u.id}, ${!u.active})">
                ${u.active ? 'Deactivate' : 'Activate'}
              </button>
            ` : '<span style="font-size: 0.8rem; color: var(--text-muted);">System Admin</span>'}
          </td>
        </tr>
      `).join("");
    } catch (err) {
      container.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  window.toggleUserStatus = async function(userId, newActiveStatus) {
    const actionText = newActiveStatus ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${actionText} user #${userId}?`)) return;

    try {
      await api.request(`/admin/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ active: newActiveStatus })
      });
      showToast(`User status updated to ${newActiveStatus ? 'Active' : 'Deactivated'}`, "success");
      loadUsers();
    } catch (e) {
      showToast(e.message || "Failed to update user status", "error");
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", () => loadUsers());
  }

  loadUsers();
}

/**
 * Admin Items Moderation (admin-items.html)
 */
async function setupAdminItemsPage() {
  const container = document.getElementById("adminItemsTableBody");
  if (!container) return;

  const adminUser = requireAdmin();
  if (!adminUser) return;

  const searchInput = document.getElementById("adminItemSearch");
  const filterType = document.getElementById("adminItemType");

  async function loadItems() {
    container.innerHTML = `<tr><td colspan="7" style="text-align:center;"><div class="spinner"></div></td></tr>`;
    try {
      const items = await api.request("/items");
      const query = (searchInput ? searchInput.value.trim() : "").toLowerCase();
      const type = filterType ? filterType.value : "ALL";

      const filtered = items.filter(i => {
        const matchesQuery = !query || i.title.toLowerCase().includes(query) || i.location.toLowerCase().includes(query);
        const matchesType = type === "ALL" || i.type === type;
        return matchesQuery && matchesType;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No items found.</td></tr>`;
        return;
      }

      container.innerHTML = filtered.map(item => `
        <tr>
          <td>#${item.id}</td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(item.title)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(item.category)}</div>
          </td>
          <td><span class="badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}">${escapeHtml(item.type)}</span></td>
          <td>${formatDate(item.date)}</td>
          <td>${escapeHtml(item.location)}</td>
          <td><span class="badge ${item.status === 'ACTIVE' ? 'badge-active' : (item.status === 'REMOVED' ? 'badge-rejected' : 'badge-resolved')}">${escapeHtml(item.status)}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            <a href="../item-details.html?id=${item.id}" class="btn btn-secondary btn-sm" target="_blank">View</a>
            ${item.status !== 'REMOVED' ? `
              <button class="btn btn-danger btn-sm" onclick="adminRemoveItem(${item.id})">Remove Post</button>
            ` : `
              <button class="btn btn-success btn-sm" onclick="adminRestoreItem(${item.id})">Restore</button>
            `}
          </td>
        </tr>
      `).join("");
    } catch (err) {
      container.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  window.adminRemoveItem = async function(id) {
    if (!confirm("Are you sure you want to remove this inappropriate post from public view?")) return;
    try {
      await api.request(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "REMOVED" })
      });
      showToast("Post removed from public search catalog.", "warning");
      loadItems();
    } catch (e) {
      showToast(e.message || "Failed to remove post", "error");
    }
  };

  window.adminRestoreItem = async function(id) {
    try {
      await api.request(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "ACTIVE" })
      });
      showToast("Post restored to active status.", "success");
      loadItems();
    } catch (e) {
      showToast(e.message || "Failed to restore post", "error");
    }
  };

  if (searchInput) searchInput.addEventListener("input", () => loadItems());
  if (filterType) filterType.addEventListener("change", () => loadItems());

  loadItems();
}

/**
 * Admin Claims Review & Approval/Rejection (admin-claims.html)
 */
async function setupAdminClaimsPage() {
  const container = document.getElementById("adminClaimsTableBody");
  if (!container) return;

  const adminUser = requireAdmin();
  if (!adminUser) return;

  async function loadClaims() {
    container.innerHTML = `<tr><td colspan="7" style="text-align:center;"><div class="spinner"></div></td></tr>`;
    try {
      const claims = await api.request("/admin/claims");

      if (claims.length === 0) {
        container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No claim requests pending review.</td></tr>`;
        return;
      }

      container.innerHTML = claims.map(c => `
        <tr>
          <td><strong>#CLM-${c.id}</strong></td>
          <td>
            <div style="font-weight:600;">${escapeHtml(c.claimantName || "Student")}</div>
            <div style="font-size:0.75rem; color: var(--text-muted);">${escapeHtml(c.claimantEmail || "")}</div>
          </td>
          <td>
            <div style="font-weight:600;">${escapeHtml(c.itemTitle || "Item #" + c.itemId)}</div>
            <span class="badge ${c.itemType === 'LOST' ? 'badge-lost' : 'badge-found'}" style="font-size:0.7rem;">${escapeHtml(c.itemType || "ITEM")}</span>
          </td>
          <td style="max-width: 250px;">
            <div style="font-size:0.85rem; background: var(--bg-body); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-family: var(--font-mono);">
              "${escapeHtml(c.answer)}"
            </div>
          </td>
          <td>${formatDate(c.createdAt)}</td>
          <td>
            <span class="badge ${c.status === 'APPROVED' ? 'badge-approved' : (c.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending')}">
              ${escapeHtml(c.status)}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${c.status === 'PENDING' ? `
              <button class="btn btn-success btn-sm" onclick="adminProcessClaim(${c.id}, 'approve')">Approve</button>
              <button class="btn btn-danger btn-sm" onclick="adminProcessClaim(${c.id}, 'reject')">Reject</button>
            ` : `
              <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(c.status)}</span>
            `}
          </td>
        </tr>
      `).join("");
    } catch (err) {
      container.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  window.adminProcessClaim = async function(claimId, decision) {
    const actionText = decision === "approve" ? "APPROVE this claim and mark the item as RESOLVED" : "REJECT this claim";
    if (!confirm(`Are you sure you want to ${actionText}?`)) return;

    try {
      await api.request(`/admin/claims/${claimId}/${decision}`, { method: "PUT" });
      showToast(`Claim has been ${decision === 'approve' ? 'approved' : 'rejected'}.`, "success");
      loadClaims();
    } catch (e) {
      showToast(e.message || "Failed to process claim", "error");
    }
  };

  loadClaims();
}
