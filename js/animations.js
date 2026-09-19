window.HamTabAnimations = {
  init() {
    document.querySelectorAll(".fade-in").forEach((el, i) => {
      el.style.animationDelay = `${i * 0.05}s`;
    });
  },
};
