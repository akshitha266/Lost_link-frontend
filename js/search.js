/**
 * LostLink - Catalog Search & Filtering Engine
 */

document.addEventListener("DOMContentLoaded", () => {
  setupSearchPage();
});

function setupSearchPage() {
  const searchResultsGrid = document.getElementById("searchResultsGrid");
  if (!searchResultsGrid) return;

  const searchForm = document.getElementById("searchFilterForm");
  const keywordInput = document.getElementById("searchKeyword");
  const typeFilter = document.getElementById("searchType");
  const categoryFilter = document.getElementById("searchCategory");
  const locationFilter = document.getElementById("searchLocation");
  const statusFilter = document.getElementById("searchStatus");
  const resultsCountEl = document.getElementById("resultsCount");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const paginationContainer = document.getElementById("paginationContainer");

  // Read URL query params on page load
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("query") && keywordInput) keywordInput.value = urlParams.get("query");
  if (urlParams.get("type") && typeFilter) typeFilter.value = urlParams.get("type");
  if (urlParams.get("category") && categoryFilter) categoryFilter.value = urlParams.get("category");

  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 6;
  let allFilteredResults = [];

  // Filter Pills (Quick filter for type or category)
  const filterPills = document.querySelectorAll(".filter-pill[data-filter-val]");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const type = pill.dataset.filterType;
      const val = pill.dataset.filterVal;
      
      if (type === "type" && typeFilter) {
        typeFilter.value = val;
      } else if (type === "category" && categoryFilter) {
        categoryFilter.value = val;
      }
      
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentPage = 1;
      fetchAndFilterItems();
    });
  });

  async function fetchAndFilterItems() {
    searchResultsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <div class="spinner"></div>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Filtering catalog items...</p>
      </div>
    `;

    const keyword = (keywordInput ? keywordInput.value.trim() : "").toLowerCase();
    const type = typeFilter ? typeFilter.value : "ALL";
    const category = categoryFilter ? categoryFilter.value : "ALL";
    const location = (locationFilter ? locationFilter.value.trim() : "").toLowerCase();
    const status = statusFilter ? statusFilter.value : "ALL";

    try {
      // Build query string for API
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (type !== "ALL") params.append("type", type);
      if (category !== "ALL") params.append("category", category);
      if (location) params.append("location", location);
      if (status !== "ALL") params.append("status", status);

      const items = await api.request(`/items?${params.toString()}`);

      // Client-side additional precision filtering
      allFilteredResults = items.filter(item => {
        const matchesKeyword = !keyword || 
          item.title.toLowerCase().includes(keyword) || 
          item.description.toLowerCase().includes(keyword);
        const matchesType = type === "ALL" || item.type === type;
        const matchesCat = category === "ALL" || item.category === category;
        const matchesLoc = !location || item.location.toLowerCase().includes(location);
        const matchesStatus = status === "ALL" || item.status === status;

        return matchesKeyword && matchesType && matchesCat && matchesLoc && matchesStatus;
      });

      renderPaginatedItems();
    } catch (err) {
      searchResultsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">⚠️</div>
          <h3 class="empty-state-title">Error Loading Items</h3>
          <p class="empty-state-text">${escapeHtml(err.message || "Could not retrieve catalog listings.")}</p>
        </div>
      `;
      if (resultsCountEl) resultsCountEl.textContent = "0 items";
    }
  }

  function renderPaginatedItems() {
    const total = allFilteredResults.length;
    if (resultsCountEl) {
      resultsCountEl.textContent = `${total} ${total === 1 ? 'item' : 'items'} found`;
    }

    if (total === 0) {
      searchResultsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔎</div>
          <h3 class="empty-state-title">No Items Match Your Criteria</h3>
          <p class="empty-state-text">Try adjusting your search keywords, clearing selected filters, or check back soon.</p>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('resetFiltersBtn').click()">Reset All Filters</button>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    // Slice for pagination
    const totalPages = Math.ceil(total / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = allFilteredResults.slice(startIndex, startIndex + itemsPerPage);

    searchResultsGrid.innerHTML = paginatedItems.map(item => renderItemCardHtml(item)).join("");

    renderPaginationControls(totalPages);
  }

  function renderPaginationControls(totalPages) {
    if (!paginationContainer) return;
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let buttonsHtml = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} id="prevPageBtn">
        &larr; Prev
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      buttonsHtml += `
        <button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    buttonsHtml += `
      <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} id="nextPageBtn">
        Next &rarr;
      </button>
    `;

    paginationContainer.innerHTML = buttonsHtml;

    // Attach pagination listeners
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    if (prevBtn) prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPaginatedItems();
        window.scrollTo({ top: 200, behavior: 'smooth' });
      }
    });
    if (nextBtn) nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPaginatedItems();
        window.scrollTo({ top: 200, behavior: 'smooth' });
      }
    });

    paginationContainer.querySelectorAll(".page-btn[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentPage = parseInt(btn.dataset.page, 10);
        renderPaginatedItems();
        window.scrollTo({ top: 200, behavior: 'smooth' });
      });
    });
  }

  // Trigger filtering on input change or form submit
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      currentPage = 1;
      fetchAndFilterItems();
    });
  }

  [typeFilter, categoryFilter, statusFilter].forEach(el => {
    if (el) el.addEventListener("change", () => {
      currentPage = 1;
      fetchAndFilterItems();
    });
  });

  if (keywordInput) {
    let debounceTimer;
    keywordInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentPage = 1;
        fetchAndFilterItems();
      }, 350);
    });
  }

  if (locationFilter) {
    let debounceTimer;
    locationFilter.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentPage = 1;
        fetchAndFilterItems();
      }, 400);
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      if (keywordInput) keywordInput.value = "";
      if (typeFilter) typeFilter.value = "ALL";
      if (categoryFilter) categoryFilter.value = "ALL";
      if (locationFilter) locationFilter.value = "";
      if (statusFilter) statusFilter.value = "ALL";
      filterPills.forEach(p => p.classList.remove("active"));
      currentPage = 1;
      fetchAndFilterItems();
    });
  }

  // Initial load
  fetchAndFilterItems();
}
