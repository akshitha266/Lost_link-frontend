/**
 * LostLink - Core Frontend Application Framework & UI Utilities
 */

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  renderFooter();
  setupGlobalEvents();
});

/**
 * Render standard responsive Navigation Bar
 */
function renderNavbar() {
  const navContainer = document.getElementById("navbar-placeholder");
  if (!navContainer) return;

  const user = getCurrentUser();
  const isAdmin = user && user.role === "ADMIN";
  const currentPath = window.location.pathname.toLowerCase();

  // Determine root relative prefix (if current page is in /admin/ subfolder)
  const isInsideAdminDir = currentPath.includes("/admin/");
  const root = isInsideAdminDir ? "../" : "./";

  let userSectionHtml = "";
  if (user) {
    userSectionHtml = `
      <div class="user-menu" id="userMenuDropdown">
        <button class="user-btn" id="userMenuBtn" aria-label="User profile menu">
          <div class="user-avatar-initials">${escapeHtml(user.name.charAt(0).toUpperCase())}</div>
          <span>${escapeHtml(user.name.split(" ")[0])}</span>
          ${isAdmin ? '<span class="badge badge-lost" style="font-size: 0.65rem; padding: 2px 6px;">Admin</span>' : ''}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="user-dropdown" id="userDropdownContent">
          <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(user.name)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(user.email)}</div>
          </div>
          ${isAdmin ? `
            <a href="${root}admin/admin-dashboard.html">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Admin Portal
            </a>
          ` : ''}
          <a href="${root}dashboard.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            My Dashboard
          </a>
          <a href="${root}my-posts.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            My Posts
          </a>
          <a href="${root}my-claims.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            My Claims
          </a>
          <a href="${root}profile.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Profile Settings
          </a>
          <div class="user-dropdown-divider"></div>
          <button id="logoutBtn" style="color: var(--danger);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out
          </button>
        </div>
      </div>
    `;
  } else {
    userSectionHtml = `
      <a href="${root}login.html" class="btn btn-secondary btn-sm">Log In</a>
      <a href="${root}register.html" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="${root}index.html" class="brand-logo">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <span>LostLink</span>
        </a>

        <ul class="nav-links" id="navLinksMenu">
          <li><a href="${root}index.html" class="nav-link ${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">Home</a></li>
          <li><a href="${root}search.html" class="nav-link ${currentPath.endsWith('search.html') ? 'active' : ''}">Browse Items</a></li>
          <li><a href="${root}post-lost.html" class="nav-link ${currentPath.endsWith('post-lost.html') ? 'active' : ''}">Report Lost</a></li>
          <li><a href="${root}post-found.html" class="nav-link ${currentPath.endsWith('post-found.html') ? 'active' : ''}">Report Found</a></li>
          ${isAdmin ? `<li><a href="${root}admin/admin-dashboard.html" class="nav-link ${isInsideAdminDir ? 'active' : ''}" style="color: var(--primary); font-weight:700;">Admin Panel</a></li>` : ''}
        </ul>

        <div class="nav-actions">
          ${userSectionHtml}
          <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </nav>
  `;

  // Attach dropdown and menu handlers
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdownContent");
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });
    document.addEventListener("click", () => userDropdown.classList.remove("show"));
  }

  const mobileBtn = document.getElementById("mobileMenuBtn");
  const navLinksMenu = document.getElementById("navLinksMenu");
  if (mobileBtn && navLinksMenu) {
    mobileBtn.addEventListener("click", () => {
      navLinksMenu.classList.toggle("open");
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      showToast("You have been signed out safely.", "info");
      setTimeout(() => {
        window.location.href = root + "login.html";
      }, 500);
    });
  }
}

/**
 * Render standard Footer
 */
function renderFooter() {
  const footerContainer = document.getElementById("footer-placeholder");
  if (!footerContainer) return;

  const currentPath = window.location.pathname.toLowerCase();
  const root = currentPath.includes("/admin/") ? "../" : "./";

  footerContainer.innerHTML = `
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="brand-icon" style="width: 32px; height: 32px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <span>LostLink</span>
          </div>
          <p style="font-size: 0.9rem; line-height: 1.6;">
            A secure digital lost-and-found repository designed for university campuses. 
            Protecting personal belongings with cryptographic verification questions and matching algorithms.
          </p>
        </div>

        <div>
          <h5>Explore</h5>
          <ul class="footer-links">
            <li><a href="${root}search.html">Search Catalog</a></li>
            <li><a href="${root}post-lost.html">Report Lost Item</a></li>
            <li><a href="${root}post-found.html">Report Found Item</a></li>
            <li><a href="${root}index.html#how-it-works">How It Works</a></li>
          </ul>
        </div>

        <div>
          <h5>User Hub</h5>
          <ul class="footer-links">
            <li><a href="${root}login.html">Sign In</a></li>
            <li><a href="${root}register.html">Student Register</a></li>
            <li><a href="${root}dashboard.html">Member Dashboard</a></li>
            <li><a href="${root}my-claims.html">Track Claims</a></li>
          </ul>
        </div>

        <div>
          <h5>Support & Trust</h5>
          <ul class="footer-links">
            <li><span style="color: #64748b;">Campus Security Office</span></li>
            <li><span style="color: #64748b;">Bldg 4, Ground Floor</span></li>
            <li><span style="color: #64748b;">security@college.edu</span></li>
            <li><span style="color: #64748b;">Helpline: Ext 4040</span></li>
          </ul>
        </div>
      </div>

      <div class="container footer-bottom">
        <div>&copy; ${new Date().getFullYear()} LostLink College Project. Designed with pure HTML5, CSS3, & Vanilla JS.</div>
        <div style="display: flex; gap: 1.25rem;">
          <span class="badge badge-active" style="text-transform: none;">Backend Ready: Spring Boot 3.x</span>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Toast Notification system
 */
function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--danger);"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === "warning") {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--warning);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--info);"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div style="flex: 1; word-break: break-word;">${escapeHtml(message)}</div>
    <button style="background: none; border: none; cursor: pointer; color: #94a3b8; padding: 2px;" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}

/**
 * Modal dialog helpers
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format relative / standard date
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return dateString;
  }
}

/**
 * Global event hooks
 */
function setupGlobalEvents() {
  // Modal backdrop click to close
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal(e.target.id);
    }
  });

  // ESC key closes any open modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModalEl = document.querySelector(".modal-overlay.open");
      if (openModalEl) closeModal(openModalEl.id);
    }
  });
}
