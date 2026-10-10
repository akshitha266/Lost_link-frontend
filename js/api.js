/**
 * LostLink - Secure Digital Lost-and-Found System
 * API Client & Data Layer
 * Handles REST communication with Spring Boot backend & fallback local storage mock data.
 */

const API_BASE_URL = "http://localhost:8088/api";

// Seed Initial Mock Data if not present
const INITIAL_MOCK_DATA = {
  users: [
    {
      id: 1,
      name: "Admin Officer",
      email: "admin@lostlink.edu",
      role: "ADMIN",
      active: true,
      createdAt: "2026-09-01T10:00:00Z"
    },
    {
      id: 2,
      name: "Alex Johnson",
      email: "alex@college.edu",
      role: "USER",
      active: true,
      createdAt: "2026-09-10T14:30:00Z"
    },
    {
      id: 3,
      name: "Sophia Martinez",
      email: "sophia@college.edu",
      role: "USER",
      active: true,
      createdAt: "2026-09-15T09:15:00Z"
    }
  ],
  items: [
    {
      id: 1,
      title: "Silver Apple MacBook Pro 14\"",
      description: "Space gray MacBook Pro 14-inch with M2 chip, found in the Computer Science Lab room 302. Has a NASA sticker on the back casing.",
      category: "Electronics",
      type: "FOUND",
      date: "2026-10-01",
      location: "CS Lab 302, Engineering Block",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60",
      status: "ACTIVE",
      verificationQuestion: "What distinctive sticker is located near the Apple logo, and what color is the keyboard silicone cover?",
      verificationAnswer: "NASA sticker and light blue keyboard cover",
      createdAt: "2026-10-01T16:20:00Z",
      userId: 1,
      postedByName: "Campus Security Office"
    },
    {
      id: 2,
      title: "Brown Leather Fossil Wallet",
      description: "Brown bifold leather wallet lost near the Student Center Cafeteria. Contains college student ID card and bus transit pass.",
      category: "Wallets & IDs",
      type: "LOST",
      date: "2026-10-02",
      location: "Student Center Cafeteria",
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=60",
      status: "ACTIVE",
      verificationQuestion: "What is the student ID number and the expiration year printed inside the card slot?",
      verificationAnswer: "ID 984521 expiry 2027",
      createdAt: "2026-10-02T11:10:00Z",
      userId: 2,
      postedByName: "Alex Johnson"
    },
    {
      id: 3,
      title: "Black Sony WH-1000XM4 Noise Canceling Headphones",
      description: "Left on the 2nd floor library study desk near the window. In a black zip case with aux adapter.",
      category: "Electronics",
      type: "FOUND",
      date: "2026-10-02",
      location: "Central Library 2nd Floor",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
      status: "ACTIVE",
      verificationQuestion: "What is written on the small keychain tag attached to the headphone case zipper?",
      verificationAnswer: "AJ 2024",
      createdAt: "2026-10-02T18:45:00Z",
      userId: 3,
      postedByName: "Sophia Martinez"
    },
    {
      id: 4,
      title: "Set of Car & Dorm Keys with Red Lanyard",
      description: "A ring with 3 brass keys and one Honda electronic key fob on a red university alumni lanyard.",
      category: "Keys",
      type: "LOST",
      date: "2026-09-28",
      location: "North Parking Lot near Gate 4",
      imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=60",
      status: "ACTIVE",
      verificationQuestion: "What miniature souvenir metal charm is attached alongside the Honda key fob?",
      verificationAnswer: "Eiffel tower miniature charm",
      createdAt: "2026-09-28T09:00:00Z",
      userId: 2,
      postedByName: "Alex Johnson"
    },
    {
      id: 5,
      title: "Calculus: Early Transcendentals Textbook (9th Ed)",
      description: "Hardcover calculus textbook by Stewart. Left on bench outside Lecture Hall B.",
      category: "Books & Stationery",
      type: "FOUND",
      date: "2026-10-03",
      location: "Science Complex - Hall B",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60",
      status: "RESOLVED",
      verificationQuestion: "What handwritten note or formula is written on the inside front cover?",
      verificationAnswer: "Integration by parts formula with blue ink",
      createdAt: "2026-10-03T08:15:00Z",
      userId: 1,
      postedByName: "Campus Security Office"
    }
  ],
  claims: [
    {
      id: 1,
      itemId: 1,
      itemTitle: "Silver Apple MacBook Pro 14\"",
      claimantId: 2,
      claimantName: "Alex Johnson",
      claimantEmail: "alex@college.edu",
      answer: "NASA sticker and light blue keyboard cover",
      status: "PENDING",
      createdAt: "2026-10-02T12:00:00Z"
    }
  ]
};

// Initialize Mock Storage if first visit
function initMockStorage() {
  if (!localStorage.getItem("lostlink_mock_items")) {
    localStorage.setItem("lostlink_mock_items", JSON.stringify(INITIAL_MOCK_DATA.items));
  }
  if (!localStorage.getItem("lostlink_mock_users")) {
    localStorage.setItem("lostlink_mock_users", JSON.stringify(INITIAL_MOCK_DATA.users));
  }
  if (!localStorage.getItem("lostlink_mock_claims")) {
    localStorage.setItem("lostlink_mock_claims", JSON.stringify(INITIAL_MOCK_DATA.claims));
  }
}
initMockStorage();

// Storage Helpers
function getStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function setStored(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Token and Session helpers
function getAuthToken() {
  return localStorage.getItem("lostlink_token");
}

function getCurrentUser() {
  const userJson = localStorage.getItem("lostlink_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

function setSession(user, token = "mock_jwt_token_" + Date.now()) {
  localStorage.setItem("lostlink_user", JSON.stringify(user));
  localStorage.setItem("lostlink_token", token);
}

function clearSession() {
  localStorage.removeItem("lostlink_user");
  localStorage.removeItem("lostlink_token");
}

/**
 * Robust API Client with automatic fallback to mock data
 * Allows frontend to function seamlessly standalone AND connect to Spring Boot
 */
const api = {
  // Config
  baseUrl: API_BASE_URL,
  useBackend: true, // will attempt real backend first; falls back if connection fails

  async request(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}`;
        try {
          const errData = await response.json();
          errMessage = errData.message || errData.error || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
      }

      // Handle 204 No Content
      if (response.status === 204) return null;
      return await response.json();
    } catch (networkError) {
      // If server unreachable or error, console debug and use fallback mock handlers
      console.warn(`[LostLink API] Backend unreachable at ${this.baseUrl}${endpoint}, using mock data provider.`, networkError);
      return await this.mockRouteHandler(endpoint, options);
    }
  },

  // Mock Route Dispatcher for Standalone Local Demo
  async mockRouteHandler(endpoint, options) {
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.parse(options.body) : null;
    const currentUser = getCurrentUser();

    // Small delay to simulate realistic network latency
    await new Promise(r => setTimeout(r, 120));

    // Auth routes
    if (endpoint === "/auth/login" && method === "POST") {
      const users = getStored("lostlink_mock_users");
      const user = users.find(u => u.email.toLowerCase() === body.email.toLowerCase());
      if (!user) throw new Error("Invalid email or password");
      if (!user.active) throw new Error("Account has been deactivated. Please contact campus security.");
      
      const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
      setSession(sessionUser);
      return { token: "mock_jwt_token_" + user.id, user: sessionUser };
    }

    if (endpoint === "/auth/register" && method === "POST") {
      const users = getStored("lostlink_mock_users");
      if (users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) {
        throw new Error("An account with this email address already exists.");
      }
      const newUser = {
        id: Date.now(),
        name: body.name,
        email: body.email,
        role: "USER",
        active: true,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      setStored("lostlink_mock_users", users);
      const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
      setSession(sessionUser);
      return { token: "mock_jwt_token_" + newUser.id, user: sessionUser };
    }

    // Items routes
    if (endpoint.startsWith("/items") && method === "GET") {
      const items = getStored("lostlink_mock_items");
      // Single Item by ID
      const singleMatch = endpoint.match(/\/items\/(\d+)$/);
      if (singleMatch) {
        const id = parseInt(singleMatch[1], 10);
        const item = items.find(i => i.id === id);
        if (!item) throw new Error("Item not found");
        // Safe item copy (don't expose verification answer in normal read)
        const safeItem = { ...item };
        delete safeItem.verificationAnswer;
        return safeItem;
      }

      // Search / Filter endpoint /items or /items/search?...
      let filtered = [...items];
      if (endpoint.includes("?")) {
        const urlParams = new URLSearchParams(endpoint.split("?")[1]);
        const q = (urlParams.get("keyword") || urlParams.get("query") || "").toLowerCase();
        const type = urlParams.get("type");
        const category = urlParams.get("category");
        const location = (urlParams.get("location") || "").toLowerCase();
        const status = urlParams.get("status");

        if (q) {
          filtered = filtered.filter(i => 
            i.title.toLowerCase().includes(q) || 
            i.description.toLowerCase().includes(q) ||
            i.location.toLowerCase().includes(q)
          );
        }
        if (type && type !== "ALL") {
          filtered = filtered.filter(i => i.type === type);
        }
        if (category && category !== "ALL") {
          filtered = filtered.filter(i => i.category === category);
        }
        if (location) {
          filtered = filtered.filter(i => i.location.toLowerCase().includes(location));
        }
        if (status && status !== "ALL") {
          filtered = filtered.filter(i => i.status === status);
        }
      }

      // Safe items copy
      return filtered.map(i => {
        const copy = { ...i };
        delete copy.verificationAnswer;
        return copy;
      });
    }

    if (endpoint === "/items" && method === "POST") {
      if (!currentUser) throw new Error("Authentication required to post an item.");
      const items = getStored("lostlink_mock_items");
      const newItem = {
        id: Date.now(),
        title: body.title,
        description: body.description,
        category: body.category,
        type: body.type, // LOST or FOUND
        date: body.date,
        location: body.location,
        imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60",
        status: "ACTIVE",
        verificationQuestion: body.verificationQuestion,
        verificationAnswer: body.verificationAnswer, // Stored safely
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        postedByName: currentUser.name
      };
      items.unshift(newItem);
      setStored("lostlink_mock_items", items);
      
      const safeNew = { ...newItem };
      delete safeNew.verificationAnswer;
      return safeNew;
    }

    if (endpoint.match(/\/items\/(\d+)$/) && method === "PUT") {
      const id = parseInt(endpoint.match(/\/items\/(\d+)$/)[1], 10);
      const items = getStored("lostlink_mock_items");
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error("Item not found");
      
      items[idx] = { ...items[idx], ...body, updatedAt: new Date().toISOString() };
      setStored("lostlink_mock_items", items);
      const safe = { ...items[idx] };
      delete safe.verificationAnswer;
      return safe;
    }

    if (endpoint.match(/\/items\/(\d+)$/) && method === "DELETE") {
      const id = parseInt(endpoint.match(/\/items\/(\d+)$/)[1], 10);
      let items = getStored("lostlink_mock_items");
      items = items.filter(i => i.id !== id);
      setStored("lostlink_mock_items", items);
      return { success: true };
    }

    // Claims routes
    if (endpoint === "/claims" && method === "POST") {
      if (!currentUser) throw new Error("You must be logged in to claim an item.");
      const items = getStored("lostlink_mock_items");
      const claims = getStored("lostlink_mock_claims");
      const item = items.find(i => i.id === parseInt(body.itemId, 10));
      if (!item) throw new Error("Item to claim does not exist.");
      if (item.userId === currentUser.id) throw new Error("You cannot claim an item you posted yourself.");

      // Check duplicate claim
      const alreadyClaimed = claims.some(c => c.itemId === item.id && c.claimantId === currentUser.id && c.status === "PENDING");
      if (alreadyClaimed) throw new Error("You already have a pending claim for this item.");

      const newClaim = {
        id: Date.now(),
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        claimantId: currentUser.id,
        claimantName: currentUser.name,
        claimantEmail: currentUser.email,
        answer: body.answer,
        status: "PENDING",
        createdAt: new Date().toISOString()
      };
      claims.unshift(newClaim);
      setStored("lostlink_mock_claims", claims);
      return newClaim;
    }

    if (endpoint === "/claims/my" && method === "GET") {
      if (!currentUser) return [];
      const claims = getStored("lostlink_mock_claims");
      return claims.filter(c => c.claimantId === currentUser.id);
    }

    // Matches endpoint
    if (endpoint === "/matches" && method === "GET") {
      const items = getStored("lostlink_mock_items");
      const lost = items.filter(i => i.type === "LOST" && i.status === "ACTIVE");
      const found = items.filter(i => i.type === "FOUND" && i.status === "ACTIVE");
      const matches = [];

      lost.forEach(l => {
        found.forEach(f => {
          let score = 0;
          if (l.category === f.category) score += 30;

          // Simple token matching
          const lWords = l.title.toLowerCase().split(/\s+/);
          const fWords = f.title.toLowerCase().split(/\s+/);
          const commonTitle = lWords.filter(w => fWords.includes(w) && w.length > 2);
          if (commonTitle.length > 0) score += 25;

          const lDesc = l.description.toLowerCase().split(/\s+/);
          const fDesc = f.description.toLowerCase().split(/\s+/);
          const commonDesc = lDesc.filter(w => fDesc.includes(w) && w.length > 3);
          if (commonDesc.length > 0) score += 25;

          if (l.location && f.location) {
            const lLoc = l.location.toLowerCase().split(/\s+/);
            const fLoc = f.location.toLowerCase().split(/\s+/);
            if (lLoc.some(loc => fLoc.includes(loc) && loc.length > 3)) score += 20;
          }

          if (score >= 30) {
            matches.push({
              lostItem: { id: l.id, title: l.title, category: l.category, location: l.location, date: l.date, imageUrl: l.imageUrl },
              foundItem: { id: f.id, title: f.title, category: f.category, location: f.location, date: f.date, imageUrl: f.imageUrl },
              similarityScore: score
            });
          }
        });
      });

      return matches;
    }

    // Profile
    if (endpoint === "/profile" && method === "GET") {
      if (!currentUser) throw new Error("Unauthorized");
      const users = getStored("lostlink_mock_users");
      const user = users.find(u => u.id === currentUser.id);
      return user || currentUser;
    }

    if (endpoint === "/profile" && method === "PUT") {
      if (!currentUser) throw new Error("Unauthorized");
      const users = getStored("lostlink_mock_users");
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], name: body.name || users[idx].name };
        setStored("lostlink_mock_users", users);
        setSession({ ...currentUser, name: users[idx].name });
        return users[idx];
      }
      return currentUser;
    }

    // Admin endpoints
    if (endpoint === "/admin/dashboard" && method === "GET") {
      const users = getStored("lostlink_mock_users");
      const items = getStored("lostlink_mock_items");
      const claims = getStored("lostlink_mock_claims");
      return {
        totalUsers: users.length,
        totalLostItems: items.filter(i => i.type === "LOST").length,
        totalFoundItems: items.filter(i => i.type === "FOUND").length,
        pendingClaims: claims.filter(c => c.status === "PENDING").length,
        resolvedItems: items.filter(i => i.status === "RESOLVED").length
      };
    }

    if (endpoint === "/admin/users" && method === "GET") {
      return getStored("lostlink_mock_users");
    }

    if (endpoint.match(/\/admin\/users\/(\d+)\/status/) && method === "PUT") {
      const id = parseInt(endpoint.match(/\/admin\/users\/(\d+)\/status/)[1], 10);
      const users = getStored("lostlink_mock_users");
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx].active = body.active;
        setStored("lostlink_mock_users", users);
        return users[idx];
      }
      throw new Error("User not found");
    }

    if (endpoint === "/admin/claims" && method === "GET") {
      return getStored("lostlink_mock_claims");
    }

    if (endpoint.match(/\/admin\/claims\/(\d+)\/(approve|reject)/) && method === "PUT") {
      const match = endpoint.match(/\/admin\/claims\/(\d+)\/(approve|reject)/);
      const claimId = parseInt(match[1], 10);
      const action = match[2].toUpperCase(); // APPROVE or REJECT
      const claims = getStored("lostlink_mock_claims");
      const claimIdx = claims.findIndex(c => c.id === claimId);
      if (claimIdx === -1) throw new Error("Claim not found");

      claims[claimIdx].status = action === "APPROVE" ? "APPROVED" : "REJECTED";
      setStored("lostlink_mock_claims", claims);

      if (action === "APPROVE") {
        const items = getStored("lostlink_mock_items");
        const itemIdx = items.findIndex(i => i.id === claims[claimIdx].itemId);
        if (itemIdx !== -1) {
          items[itemIdx].status = "RESOLVED";
          setStored("lostlink_mock_items", items);
        }
      }
      return claims[claimIdx];
    }

    return { message: "Mock operation completed successfully." };
  }
};
