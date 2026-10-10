/**
 * LostLink - User Dashboard Logic & Metrics Overview
 */

document.addEventListener("DOMContentLoaded", () => {
  setupDashboardPage();
});

async function setupDashboardPage() {
  const dashboardRoot = document.getElementById("userDashboardRoot");
  if (!dashboardRoot) return;

  const user = requireAuth();
  if (!user) return;

  // Set greeting
  const welcomeName = document.getElementById("welcomeUserName");
  if (welcomeName) welcomeName.textContent = user.name;

  try {
    // Fetch user items, claims, and potential matches in parallel
    const [allItems, myClaims, allMatches] = await Promise.all([
      api.request("/items"),
      api.request("/claims/my"),
      api.request("/matches")
    ]);

    const myLostItems = allItems.filter(i => i.userId === user.id && i.type === "LOST");
    const myFoundItems = allItems.filter(i => i.userId === user.id && i.type === "FOUND");
    const pendingClaims = myClaims.filter(c => c.status === "PENDING");

    // Filter matches relevant to user's posted lost items
    const myLostIds = new Set(myLostItems.map(i => i.id));
    const myMatches = allMatches.filter(m => myLostIds.has(m.lostItem.id));

    // Update Metric Counters
    const lostCountEl = document.getElementById("dashLostCount");
    const foundCountEl = document.getElementById("dashFoundCount");
    const claimsCountEl = document.getElementById("dashClaimsCount");
    const matchesCountEl = document.getElementById("dashMatchesCount");

    if (lostCountEl) lostCountEl.textContent = myLostItems.length;
    if (foundCountEl) foundCountEl.textContent = myFoundItems.length;
    if (claimsCountEl) claimsCountEl.textContent = pendingClaims.length;
    if (matchesCountEl) matchesCountEl.textContent = myMatches.length;

    // Render Recent Lost Items Preview
    const lostContainer = document.getElementById("dashRecentLost");
    if (lostContainer) {
      if (myLostItems.length === 0) {
        lostContainer.innerHTML = `
          <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-body); border-radius: var(--radius-md);">
            No lost items reported yet. 
            <div style="margin-top: 0.5rem;"><a href="post-lost.html" class="btn btn-warning btn-sm">+ Report a Lost Item</a></div>
          </div>
        `;
      } else {
        lostContainer.innerHTML = myLostItems.slice(0, 3).map(item => renderItemCardHtml(item)).join("");
      }
    }

    // Render Recent Found Items Preview
    const foundContainer = document.getElementById("dashRecentFound");
    if (foundContainer) {
      if (myFoundItems.length === 0) {
        foundContainer.innerHTML = `
          <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-body); border-radius: var(--radius-md);">
            No found items reported yet.
            <div style="margin-top: 0.5rem;"><a href="post-found.html" class="btn btn-success btn-sm">+ Report a Found Item</a></div>
          </div>
        `;
      } else {
        foundContainer.innerHTML = myFoundItems.slice(0, 3).map(item => renderItemCardHtml(item)).join("");
      }
    }

    // Render Potential Matches
    const matchesContainer = document.getElementById("dashMatchesList");
    if (matchesContainer) {
      if (myMatches.length === 0) {
        matchesContainer.innerHTML = `
          <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-body); border-radius: var(--radius-md);">
            No direct matches for your lost items yet. Our automated matching engine runs periodically against new found item submissions.
          </div>
        `;
      } else {
        matchesContainer.innerHTML = myMatches.map(m => `
          <div class="card" style="padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid var(--success);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
                  <span class="badge badge-approved">${m.similarityScore}% Match Confidence</span>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">&bull; Category: ${escapeHtml(m.lostItem.category)}</span>
                </div>
                <h4 style="margin-bottom: 0.25rem;">
                  Your Lost: <em>${escapeHtml(m.lostItem.title)}</em> &harr; Found Match: <strong>${escapeHtml(m.foundItem.title)}</strong>
                </h4>
                <div style="font-size: 0.825rem; color: var(--text-secondary);">
                  Found at: ${escapeHtml(m.foundItem.location)} &bull; Date: ${formatDate(m.foundItem.date)}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <a href="item-details.html?id=${m.foundItem.id}" class="btn btn-secondary btn-sm">Inspect Item</a>
                <a href="claim.html?id=${m.foundItem.id}" class="btn btn-primary btn-sm">Claim This Item</a>
              </div>
            </div>
          </div>
        `).join("");
      }
    }

  } catch (err) {
    showToast("Dashboard metrics could not be loaded: " + err.message, "error");
  }
}
