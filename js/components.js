// HamTab UI components
window.HamTabUI = {
  escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  showToast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `toast toast-${type === "error" ? "danger" : type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  },
};
