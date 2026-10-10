/**
 * LostLink - Item Management (Posting, Details, User Items CRUD)
 */

document.addEventListener("DOMContentLoaded", () => {
  setupPostItemForm();
  setupItemDetailsPage();
  setupMyPostsPage();
  setupImageUploadPreview();
});

/**
 * Image upload preview helper (converts to base64 DataURL for mockup/submission)
 */
function setupImageUploadPreview() {
  const uploadInput = document.getElementById("itemImageInput");
  const previewBox = document.getElementById("imagePreviewBox");
  const previewImg = document.getElementById("previewImg");
  const removeBtn = document.getElementById("removeImageBtn");
  const uploadPrompt = document.getElementById("uploadPrompt");

  if (!uploadInput || !previewBox || !previewImg) return;

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileCheck = validation.validateImageFile(file);
    if (!fileCheck.valid) {
      showToast(fileCheck.message, "error");
      uploadInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      previewImg.src = event.target.result;
      previewBox.style.display = "block";
      if (uploadPrompt) uploadPrompt.style.display = "none";
    };
    reader.readAsDataURL(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      uploadInput.value = "";
      previewImg.src = "";
      previewBox.style.display = "none";
      if (uploadPrompt) uploadPrompt.style.display = "block";
    });
  }
}

/**
 * Handle Post Lost or Post Found item submission
 */
function setupPostItemForm() {
  const form = document.getElementById("postItemForm");
  if (!form) return;

  // Protect route
  const user = requireAuth();
  if (!user) return;

  // Default date to today
  const dateInput = form.querySelector("input[name='date']");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    validation.clearValidation(form);

    if (!validation.validateItemForm(form)) {
      showToast("Please correct highlighted fields before submitting.", "warning");
      return;
    }

    const itemType = form.dataset.itemType || "LOST"; // Set via data-item-type in HTML
    const previewImg = document.getElementById("previewImg");
    const imageUrl = (previewImg && previewImg.src.startsWith("data:")) 
      ? previewImg.src 
      : (form.imageUrl && form.imageUrl.value.trim() ? form.imageUrl.value.trim() : null);

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" style="width:16px;height:16px;margin:0 8px 0 0;display:inline-block;vertical-align:middle;border-width:2px;"></span> Submitting...`;
    }

    const payload = {
      title: form.title.value.trim(),
      category: form.category.value,
      type: itemType,
      date: form.date.value,
      location: form.location.value.trim(),
      description: form.description.value.trim(),
      imageUrl: imageUrl,
      verificationQuestion: form.verificationQuestion.value.trim(),
      verificationAnswer: form.verificationAnswer.value.trim()
    };

    try {
      const createdItem = await api.request("/items", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showToast(`Your ${itemType.toLowerCase()} item was posted successfully!`, "success");
      setTimeout(() => {
        window.location.href = `item-details.html?id=${createdItem.id}`;
      }, 700);
    } catch (err) {
      showToast(err.message || "Failed to post item.", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Report";
      }
    }
  });
}

/**
 * Handle Item Details Page (item-details.html?id=...)
 */
async function setupItemDetailsPage() {
  const container = document.getElementById("itemDetailsContainer");
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get("id");

  if (!itemId) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No Item Specified</h3>
        <p class="empty-state-text">Please select an item from the search catalog to view its details.</p>
        <a href="search.html" class="btn btn-primary">Browse All Items</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="spinner"></div>`;

  try {
    const item = await api.request(`/items/${itemId}`);
    const currentUser = getCurrentUser();
    const isOwner = currentUser && item.userId === currentUser.id;
    const isClaimable = item.status === "ACTIVE" && !isOwner;

    container.innerHTML = `
      <div class="card" style="box-shadow: var(--shadow-md); border-radius: var(--radius-lg); overflow: hidden;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
          <!-- Item Image Preview -->
          <div style="background: #f1f5f9; min-height: 340px; display: flex; align-items: center; justify-content: center; position: relative;">
            <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'}" 
                 alt="${escapeHtml(item.title)}" 
                 style="width: 100%; height: 100%; object-fit: cover; max-height: 440px;"
                 onerror="this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'">
            <div style="position: absolute; top: 1rem; left: 1rem;">
              <span class="badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;">
                ${escapeHtml(item.type)} ITEM
              </span>
            </div>
            <div style="position: absolute; top: 1rem; right: 1rem;">
              <span class="badge ${item.status === 'ACTIVE' ? 'badge-active' : (item.status === 'RESOLVED' ? 'badge-resolved' : 'badge-pending')}">
                ${escapeHtml(item.status)}
              </span>
            </div>
          </div>

          <!-- Item Metadata & Actions -->
          <div style="padding: 2rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                <span class="badge badge-category">${escapeHtml(item.category)}</span>
              </div>

              <h1 style="font-size: 1.85rem; margin-bottom: 1rem;">${escapeHtml(item.title)}</h1>

              <div class="item-meta-list" style="margin-bottom: 1.5rem; font-size: 0.95rem; gap: 0.6rem;">
                <div class="item-meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span><strong>Date ${item.type === 'LOST' ? 'Lost' : 'Found'}:</strong> ${formatDate(item.date)}</span>
                </div>
                <div class="item-meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span><strong>Location:</strong> ${escapeHtml(item.location)}</span>
                </div>
                <div class="item-meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span><strong>Reported By:</strong> ${escapeHtml(item.postedByName || "Verified Campus Member")}</span>
                </div>
              </div>

              <div style="margin-bottom: 1.5rem;">
                <h4 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 0.5rem;">Description</h4>
                <p style="color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${escapeHtml(item.description)}</p>
              </div>

              ${item.verificationQuestion ? `
                <div class="notice-box notice-info" style="margin-bottom: 1.5rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <div>
                    <strong style="display:block; margin-bottom: 0.2rem;">Ownership Verification Challenge:</strong>
                    <span>"${escapeHtml(item.verificationQuestion)}"</span>
                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">
                      🔒 True owners will answer this challenge during the claim process. The answer is never displayed publicly.
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; pt-2; border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
              ${isClaimable ? `
                <a href="claim.html?id=${item.id}" class="btn btn-primary btn-lg" style="flex: 1;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Submit Ownership Claim
                </a>
              ` : (isOwner ? `
                <div class="badge badge-category" style="padding: 0.75rem 1rem; width: 100%; text-align: center; justify-content: center; font-size: 0.9rem;">
                  ℹ️ You posted this item. You can manage it in your <a href="my-posts.html" style="margin-left: 5px; text-decoration: underline;">My Posts</a> section.
                </div>
              ` : `
                <div class="badge badge-resolved" style="padding: 0.75rem 1rem; width: 100%; text-align: center; justify-content: center; font-size: 0.9rem;">
                  This item is currently marked as ${escapeHtml(item.status)}.
                </div>
              `)}

              <button class="btn btn-secondary" onclick="openModal('reportItemModal')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                Report Listing
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggested Matching Items Section -->
      <div style="margin-top: 3rem;">
        <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          Smart Match Suggestions
        </h3>
        <div id="matchingItemsContainer" class="items-grid">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    loadRelatedMatches(item);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Item Unavailable</h3>
        <p class="empty-state-text">${escapeHtml(err.message || "We could not find the requested item.")}</p>
        <a href="search.html" class="btn btn-primary">Return to Search</a>
      </div>
    `;
  }
}

/**
 * Load smart suggestions for item details page
 */
async function loadRelatedMatches(currentItem) {
  const container = document.getElementById("matchingItemsContainer");
  if (!container) return;

  try {
    const allMatches = await api.request("/matches");
    // Find matches where either lost or found is currentItem
    const relevant = allMatches.filter(m => 
      m.lostItem.id === currentItem.id || m.foundItem.id === currentItem.id
    );

    if (relevant.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; background: white; border-radius: var(--radius-md); border: 1px solid var(--border-color); color: var(--text-muted);">
          No exact matches found yet. We'll automatically suggest candidates as new items are reported.
        </div>
      `;
      return;
    }

    container.innerHTML = relevant.map(m => {
      const candidate = m.lostItem.id === currentItem.id ? m.foundItem : m.lostItem;
      const candidateType = m.lostItem.id === currentItem.id ? "FOUND" : "LOST";
      return renderItemCardHtml({ ...candidate, type: candidateType }, m.similarityScore);
    }).join("");
  } catch (e) {
    container.innerHTML = `<div style="grid-column: 1 / -1; color: var(--text-muted);">Matches could not be loaded at this time.</div>`;
  }
}

/**
 * Render standard Item Card HTML
 */
function renderItemCardHtml(item, matchScore = null) {
  return `
    <div class="item-card">
      <div class="item-card-media">
        <img class="item-card-img" src="${item.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'}" 
             alt="${escapeHtml(item.title)}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'">
        
        <div class="item-card-badge-pos">
          <span class="badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}">
            ${escapeHtml(item.type)}
          </span>
          ${matchScore ? `<span class="badge badge-approved" style="margin-left: 4px;">${matchScore}% Match</span>` : ''}
        </div>

        <div class="item-card-date-badge">
          ${formatDate(item.date)}
        </div>
      </div>

      <div class="item-card-body">
        <div style="font-size: 0.78rem; font-weight: 600; color: var(--accent); text-transform: uppercase;">
          ${escapeHtml(item.category || "General")}
        </div>
        <h4 class="item-card-title">${escapeHtml(item.title)}</h4>
        <p class="item-card-desc">${escapeHtml(item.description || "No description provided.")}</p>

        <div class="item-meta-list">
          <div class="item-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.location || "Campus")}</span>
          </div>
        </div>
      </div>

      <div class="item-card-footer">
        <span class="badge ${item.status === 'ACTIVE' ? 'badge-active' : (item.status === 'RESOLVED' ? 'badge-resolved' : 'badge-pending')}">
          ${escapeHtml(item.status || "ACTIVE")}
        </span>
        <a href="item-details.html?id=${item.id}" class="btn btn-outline btn-sm">
          View Details &rarr;
        </a>
      </div>
    </div>
  `;
}

/**
 * Handle My Posts Management Page (my-posts.html)
 */
async function setupMyPostsPage() {
  const container = document.getElementById("myPostsContainer");
  if (!container) return;

  const user = requireAuth();
  if (!user) return;

  const filterTabs = document.querySelectorAll(".nav-tab-btn[data-post-filter]");
  let activeFilter = "ALL";

  filterTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      filterTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.postFilter;
      renderUserPosts();
    });
  });

  async function renderUserPosts() {
    container.innerHTML = `<div class="spinner"></div>`;
    try {
      const allItems = await api.request("/items");
      let myItems = allItems.filter(i => i.userId === user.id);

      if (activeFilter === "LOST") myItems = myItems.filter(i => i.type === "LOST");
      if (activeFilter === "FOUND") myItems = myItems.filter(i => i.type === "FOUND");
      if (activeFilter === "ACTIVE") myItems = myItems.filter(i => i.status === "ACTIVE");
      if (activeFilter === "RESOLVED") myItems = myItems.filter(i => i.status === "RESOLVED");

      if (myItems.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h3 class="empty-state-title">No items found</h3>
            <p class="empty-state-text">You have not posted any items in this category yet.</p>
            <div style="display: flex; gap: 0.75rem;">
              <a href="post-lost.html" class="btn btn-warning btn-sm">+ Report Lost</a>
              <a href="post-found.html" class="btn btn-success btn-sm">+ Report Found</a>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Category</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${myItems.map(item => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'}" 
                           style="width: 44px; height: 44px; border-radius: var(--radius-md); object-fit: cover;" 
                           onerror="this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'">
                      <div>
                        <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(item.title)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">ID: #${item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}">${escapeHtml(item.type)}</span></td>
                  <td>${escapeHtml(item.category)}</td>
                  <td>${formatDate(item.date)}</td>
                  <td>${escapeHtml(item.location)}</td>
                  <td><span class="badge ${item.status === 'ACTIVE' ? 'badge-active' : 'badge-resolved'}">${escapeHtml(item.status)}</span></td>
                  <td style="text-align: right; white-space: nowrap;">
                    <a href="item-details.html?id=${item.id}" class="btn btn-secondary btn-sm" title="View details">View</a>
                    <button class="btn btn-outline btn-sm" onclick="promptEditItem(${item.id})">Edit</button>
                    ${item.status === 'ACTIVE' ? `
                      <button class="btn btn-success btn-sm" onclick="markItemResolved(${item.id})">Mark Resolved</button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteItem(${item.id})">Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message || "Failed to load posts.")}</p></div>`;
    }
  }

  // Global actions for user post management
  window.markItemResolved = async function(id) {
    if (!confirm("Are you sure you want to mark this item as resolved / reunited?")) return;
    try {
      await api.request(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "RESOLVED" })
      });
      showToast("Item marked as resolved!", "success");
      renderUserPosts();
    } catch (e) {
      showToast(e.message || "Failed to update status", "error");
    }
  };

  window.confirmDeleteItem = async function(id) {
    if (!confirm("Are you sure you want to permanently delete this item listing? This cannot be undone.")) return;
    try {
      await api.request(`/items/${id}`, { method: "DELETE" });
      showToast("Item listing deleted.", "info");
      renderUserPosts();
    } catch (e) {
      showToast(e.message || "Failed to delete item", "error");
    }
  };

  window.promptEditItem = async function(id) {
    const item = await api.request(`/items/${id}`);
    const modal = document.getElementById("editItemModal");
    const editForm = document.getElementById("editItemForm");
    if (!modal || !editForm) {
      showToast("Editing item #" + id, "info");
      return;
    }
    editForm.itemId.value = item.id;
    editForm.title.value = item.title;
    editForm.location.value = item.location;
    editForm.description.value = item.description;
    openModal("editItemModal");
  };

  renderUserPosts();
}
