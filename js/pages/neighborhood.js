document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { neighborhoods } = await window.HamTabAPI.getNeighborhoods();
    const list = document.getElementById("neighborhoods-list");
    if (!list) return;
    list.innerHTML = neighborhoods
      .map(
        (n) => `
      <div class="card">
        <h3>${window.HamTabUI.escapeHtml(n.name)}</h3>
        <p>${window.HamTabUI.escapeHtml(n.location || "")}</p>
        <p>علاقه‌مندان: ${n.interested_homes || 0}</p>
        <button class="btn join-btn" data-id="${n.id}" ${n.joined ? "disabled" : ""}>
          ${n.joined ? "عضو شده‌اید" : "پیوستن"}
        </button>
      </div>`
      )
      .join("");

    list.querySelectorAll(".join-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await window.HamTabAPI.joinNeighborhood(btn.dataset.id);
          window.HamTabUI.showToast("با موفقیت عضو شدید", "success");
          location.reload();
        } catch (err) {
          window.HamTabUI.showToast(err.message || "خطا", "error");
        }
      });
    });
  } catch (err) {
    window.HamTabUI?.showToast(err.message || "خطا", "error");
  }
});
