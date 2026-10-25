document.querySelectorAll("[data-board]").forEach((b) =>
  b.addEventListener("click", () => {
    const id = b.dataset.board;
    document
      .querySelectorAll("[data-board]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    window.recorderDesign.setView("inside");
    window.recorderDesign.product.selectBoard(id);
    window.recorderDesign.setExplode(100);
    document.getElementById("board-hint").textContent =
      `已選取 ${id} ${["G","H","I"].includes(id)?"固定件（尺寸為估算）":"板件"}，3D 中以紫色標示。`;
    document
      .getElementById("stage")
      .scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
  }),
);
