document.addEventListener("DOMContentLoaded", () => {
  // simple counter animation if elements exist
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count) || 0;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current.toLocaleString("fa-IR");
    }, 30);
  });
});
