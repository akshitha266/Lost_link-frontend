/**
 * LostLink - Authentication Logic & Route Guards
 */

document.addEventListener("DOMContentLoaded", () => {
  setupLoginForm();
  setupRegisterForm();
  setupProfilePage();
  setupDemoFillButtons();
});

/**
 * Route protection: requires user to be logged in
 */
function requireAuth(redirectPath = "login.html") {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = redirectPath + "?redirect=" + encodeURIComponent(window.location.pathname);
    return false;
  }
  return user;
}

/**
 * Route protection: requires user to be ADMIN
 */
function requireAdmin(redirectPath = "../login.html") {
  const user = getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    alert("Unauthorized access. Admin privileges required.");
    window.location.href = redirectPath;
    return false;
  }
  return user;
}

/**
 * Setup Login Form Handler
 */
function setupLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // If already logged in, redirect to dashboard
  if (getCurrentUser()) {
    window.location.href = "dashboard.html";
    return;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    validation.clearValidation(loginForm);

    if (!validation.validateLogin(loginForm)) {
      return;
    }

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const submitBtn = loginForm.querySelector("button[type='submit']");
    const errorAlert = document.getElementById("loginErrorAlert");

    if (errorAlert) errorAlert.style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" style="width:16px;height:16px;margin:0 8px 0 0;display:inline-block;vertical-align:middle;border-width:2px;"></span> Authenticating...`;
    }

    try {
      const res = await api.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (res && res.token && res.user) {
        setSession(res.user, res.token);
      }

      showToast("Login successful! Welcome back, " + res.user.name.split(" ")[0], "success");

      // Check redirect param
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect") || (res.user.role === "ADMIN" ? "admin/admin-dashboard.html" : "dashboard.html");

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 700);
    } catch (err) {
      if (errorAlert) {
        errorAlert.textContent = err.message || "Failed to sign in. Please verify your credentials.";
        errorAlert.style.display = "block";
      } else {
        showToast(err.message || "Login failed.", "error");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In";
      }
    }
  });
}

/**
 * Setup Register Form Handler
 */
function setupRegisterForm() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    validation.clearValidation(registerForm);

    if (!validation.validateRegister(registerForm)) {
      return;
    }

    const name = registerForm.name.value.trim();
    const email = registerForm.email.value.trim();
    const password = registerForm.password.value;
    const submitBtn = registerForm.querySelector("button[type='submit']");
    const errorAlert = document.getElementById("registerErrorAlert");

    if (errorAlert) errorAlert.style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" style="width:16px;height:16px;margin:0 8px 0 0;display:inline-block;vertical-align:middle;border-width:2px;"></span> Creating Account...`;
    }

    try {
      const res = await api.request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });

      if (res && res.token && res.user) {
        setSession(res.user, res.token);
      }

      showToast("Account created successfully! Welcome to LostLink.", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } catch (err) {
      if (errorAlert) {
        errorAlert.textContent = err.message || "Registration failed. Please try again.";
        errorAlert.style.display = "block";
      } else {
        showToast(err.message || "Registration failed.", "error");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    }
  });
}

/**
 * Setup Profile Management Page (profile.html)
 */
async function setupProfilePage() {
  const profileContainer = document.getElementById("profileSection");
  if (!profileContainer) return;

  const user = requireAuth();
  if (!user) return;

  // Populate profile fields
  const nameField = document.getElementById("profileName");
  const emailField = document.getElementById("profileEmail");
  const roleField = document.getElementById("profileRole");
  const joinedField = document.getElementById("profileJoined");

  try {
    const profile = await api.request("/profile");
    if (nameField) nameField.value = profile.name || user.name;
    if (emailField) emailField.value = profile.email || user.email;
    if (roleField) roleField.textContent = profile.role || user.role;
    if (joinedField) joinedField.textContent = formatDate(profile.createdAt || "2026-09-10");
  } catch (err) {
    console.error("Could not fetch profile details", err);
  }

  // Update Profile Form
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updatedName = nameField.value.trim();
      if (!updatedName || updatedName.length < 2) {
        showToast("Full name must be at least 2 characters.", "warning");
        return;
      }

      try {
        await api.request("/profile", {
          method: "PUT",
          body: JSON.stringify({ name: updatedName })
        });
        showToast("Profile details updated successfully!", "success");
        renderNavbar();
      } catch (err) {
        showToast(err.message || "Failed to update profile.", "error");
      }
    });
  }

  // Change Password Form
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPass = passwordForm.currentPassword.value;
      const newPass = passwordForm.newPassword.value;
      const confirmPass = passwordForm.confirmNewPassword.value;

      if (!currentPass || !newPass) {
        showToast("Please fill out all password fields.", "warning");
        return;
      }
      if (newPass.length < 6) {
        showToast("New password must be at least 6 characters.", "warning");
        return;
      }
      if (newPass !== confirmPass) {
        showToast("New passwords do not match.", "warning");
        return;
      }

      try {
        await api.request("/profile/password", {
          method: "PUT",
          body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
        });
        showToast("Password changed successfully.", "success");
        passwordForm.reset();
      } catch (err) {
        showToast(err.message || "Could not update password.", "error");
      }
    });
  }

  // Profile Logout Button
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");
  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener("click", () => {
      clearSession();
      showToast("Logged out successfully.", "info");
      setTimeout(() => window.location.href = "login.html", 500);
    });
  }
}

/**
 * Convenient demo quick-fill helper for college grading/demonstration
 */
function setupDemoFillButtons() {
  const fillUserBtn = document.getElementById("fillDemoUser");
  const fillAdminBtn = document.getElementById("fillDemoAdmin");
  const loginForm = document.getElementById("loginForm");

  if (fillUserBtn && loginForm) {
    fillUserBtn.addEventListener("click", () => {
      loginForm.email.value = "alex@college.edu";
      loginForm.password.value = "password123";
      validation.setValid(loginForm.email);
      validation.setValid(loginForm.password);
    });
  }

  if (fillAdminBtn && loginForm) {
    fillAdminBtn.addEventListener("click", () => {
      loginForm.email.value = "admin@lostlink.edu";
      loginForm.password.value = "admin123";
      validation.setValid(loginForm.email);
      validation.setValid(loginForm.password);
    });
  }
}
