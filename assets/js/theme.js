/* Dark-mode toggle. The initial theme is set inline in <head> (no FOUC);
   this just handles the button click and persists the choice. */
(function () {
  "use strict";
  var btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var current = document.documentElement.getAttribute("data-theme");
    var next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
  });
})();
