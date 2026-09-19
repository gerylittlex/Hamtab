// HamTab navigation & auth state
window.HamTabNav = {
  async init() {
    try {
      const { user } = await window.HamTabAPI.me();
      this.applyAuthState(user);
    } catch {
      this.applyAuthState(null);
    }
  },
  applyAuthState(user) {
    document.querySelectorAll("[data-auth=guest]").forEach((el) => {
      el.style.display = user ? "none" : "";
    });
    document.querySelectorAll("[data-auth=user]").forEach((el) => {
      el.style.display = user ? "" : "none";
    });
    document.querySelectorAll("[data-auth=admin]").forEach((el) => {
      el.style.display = user && user.role === "ADMIN" ? "" : "none";
    });
  },
  async logout() {
    try {
      await window.HamTabAPI.logoutEverywhere();
    } catch {}
    window.HamTabAPI.setToken(null);
    location.href = "/pages/login.html";
  },
};
