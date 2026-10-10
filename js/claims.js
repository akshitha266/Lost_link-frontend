/**
 * LostLink - Ownership Claims & Verification Submission
 */

document.addEventListener("DOMContentLoaded", () => {
  setupClaimSubmissionPage();
  setupMyClaimsPage();
});

/**
 * Handle Claim Submission Page (claim.html?id=...)
 */
async function setupClaimSubmissionPage() {
  const claimContainer = document.getElementById("claimPageContainer");
  if (!claimContainer) return;

  const user = requireAuth();
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get("id");

  if (!itemId) {
    claimContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">No Item Specified</h3>
        <p class="empty-state-text">Please select an item first before attempting to submit a claim.</p>
        <a href="search.html" class="btn btn-primary">Browse Catalog</a>
      </div>
    `;
    return;
  }

  claimContainer.innerHTML = `<div class="spinner"></div>`;

  try {
    const item = await api.request(`/items/${itemId}`);

    if (item.userId === user.id) {
      claimContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🛡️</div>
          <h3 class="empty-state-title">Item Ownership Notice</h3>
          <p class="empty-state-text">You are registered as the reporter of this item. You cannot submit an ownership claim on your own listing.</p>
          <a href="my-posts.html" class="btn btn-primary">Manage My Posts</a>
        </div>
      `;
      return;
    }

    if (item.status !== "ACTIVE") {
      claimContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔒</div>
          <h3 class="empty-state-title">Item No Longer Available</h3>
          <p class="empty-state-text">This item is currently marked as <strong>${escapeHtml(item.status)}</strong> and is not open for new claims.</p>
          <a href="search.html" class="btn btn-primary">Back to Catalog</a>
        </div>
      `;
      return;
    }

    claimContainer.innerHTML = `
      <div class="container container-narrow">
        <div class="card" style="box-shadow: var(--shadow-md);">
          <div class="card-header">
            <div>
              <span class="badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}" style="margin-bottom: 0.35rem;">
                ${escapeHtml(item.type)} ITEM
              </span>
              <h2 style="font-size: 1.5rem;">Ownership Claim Form</h2>
            </div>
            <a href="item-details.html?id=${item.id}" class="btn btn-secondary btn-sm">&larr; Back</a>
          </div>

          <div class="card-body">
            <!-- Item Brief -->
            <div style="display: flex; gap: 1rem; align-items: center; padding: 1rem; background: var(--bg-body); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
              <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'}" 
                   style="width: 60px; height: 60px; border-radius: var(--radius-sm); object-fit: cover;"
                   onerror="this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60'">
              <div>
                <h4 style="margin-bottom: 0.2rem;">${escapeHtml(item.title)}</h4>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  ${escapeHtml(item.category)} &bull; ${escapeHtml(item.location)} &bull; Reported ${formatDate(item.date)}
                </div>
              </div>
            </div>

            <!-- Caution Banner -->
            <div class="notice-box notice-warning">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div>
                <strong>Campus Policy Warning:</strong>
                <p style="margin-top: 0.2rem; font-size: 0.825rem; color: #78350f;">
                  Submitting false, deceptive, or malicious claims on lost/found items is a violation of University Student Conduct regulations and can result in account suspension and referral to campus security.
                </p>
              </div>
            </div>

            <!-- Verification Question Form -->
            <form id="submitClaimForm" novalidate>
              <input type="hidden" name="itemId" value="${item.id}">

              <div class="form-group">
                <label class="form-label" style="font-size: 0.95rem;">
                  Ownership Verification Challenge:
                </label>
                <div style="background: var(--bg-subtle); padding: 1rem 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--primary); font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                  "${escapeHtml(item.verificationQuestion || "Please describe unique identifiable markings, stickers, or serial numbers.")}"
                </div>
                <span class="form-help">Answer this question with specific details known only to the genuine owner.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="claimAnswer">
                  Your Verification Answer <span class="required">*</span>
                </label>
                <textarea class="form-textarea" id="claimAnswer" name="answer" placeholder="Provide accurate, detailed proof to answer the challenge..." rows="4" required></textarea>
                <div class="invalid-feedback">Please enter your answer to the verification question.</div>
              </div>

              <div class="form-group">
                <label class="form-label" for="claimNotes">
                  Additional Proof / Contact Information (Optional)
                </label>
                <input type="text" class="form-control" id="claimNotes" name="notes" placeholder="e.g., student ID, best contact phone number, receipt available">
                <span class="form-help">Optional additional note visible to the administrator/finder reviewing your request.</span>
              </div>

              <div class="form-check" style="margin-bottom: 1.5rem; margin-top: 1rem;">
                <input class="form-check-input" type="checkbox" id="affirmTruth" required>
                <label for="affirmTruth" style="font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;">
                  I solemnly affirm that this item belongs to me and all details submitted above are accurate and truthful.
                </label>
              </div>

              <button type="submit" class="btn btn-primary btn-lg btn-block" id="claimSubmitBtn">
                Submit Claim for Verification
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    // Attach form submit handler
    const form = document.getElementById("submitClaimForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      validation.clearValidation(form);

      const affirmBox = document.getElementById("affirmTruth");
      if (!affirmBox.checked) {
        showToast("You must affirm that you are the rightful owner before submitting.", "warning");
        affirmBox.focus();
        return;
      }

      if (!validation.validateClaimForm(form)) {
        return;
      }

      const submitBtn = document.getElementById("claimSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" style="width:16px;height:16px;margin:0 8px 0 0;display:inline-block;vertical-align:middle;border-width:2px;"></span> Submitting Claim...`;

      try {
        await api.request("/claims", {
          method: "POST",
          body: JSON.stringify({
            itemId: item.id,
            answer: form.answer.value.trim(),
            notes: form.notes ? form.notes.value.trim() : ""
          })
        });

        showToast("Claim submitted successfully! The post owner / administrator will review your verification answer.", "success");
        setTimeout(() => {
          window.location.href = "my-claims.html";
        }, 1200);
      } catch (err) {
        showToast(err.message || "Could not submit claim.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Claim for Verification";
      }
    });

  } catch (err) {
    claimContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Error</h3>
        <p class="empty-state-text">${escapeHtml(err.message || "Failed to load item.")}</p>
        <a href="search.html" class="btn btn-secondary">Return to Catalog</a>
      </div>
    `;
  }
}

/**
 * Handle My Claims Tracking Page (my-claims.html)
 */
async function setupMyClaimsPage() {
  const container = document.getElementById("myClaimsList");
  if (!container) return;

  const user = requireAuth();
  if (!user) return;

  container.innerHTML = `<div class="spinner"></div>`;

  try {
    const claims = await api.request("/claims/my");

    if (claims.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">No Claims Submitted Yet</h3>
          <p class="empty-state-text">You have not submitted ownership claims on any lost or found items.</p>
          <a href="search.html" class="btn btn-primary">Search Catalog For Your Belongings</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Item</th>
              <th>Submitted Answer</th>
              <th>Date Filed</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${claims.map(claim => {
              let statusBadgeClass = "badge-pending";
              if (claim.status === "APPROVED") statusBadgeClass = "badge-approved";
              if (claim.status === "REJECTED") statusBadgeClass = "badge-rejected";

              return `
                <tr>
                  <td><strong>#CLM-${claim.id}</strong></td>
                  <td>
                    <div style="font-weight: 600; color: var(--text-primary);">
                      ${escapeHtml(claim.itemTitle || ("Item #" + claim.itemId))}
                    </div>
                  </td>
                  <td>
                    <span style="font-size: 0.85rem; font-family: var(--font-mono); color: var(--text-secondary);">
                      "${escapeHtml(claim.answer || "Answer provided")}"
                    </span>
                  </td>
                  <td>${formatDate(claim.createdAt)}</td>
                  <td>
                    <span class="badge ${statusBadgeClass}">${escapeHtml(claim.status)}</span>
                  </td>
                  <td style="text-align: right;">
                    <a href="item-details.html?id=${claim.itemId}" class="btn btn-secondary btn-sm">
                      View Item
                    </a>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message || "Failed to load claims.")}</p></div>`;
  }
}
