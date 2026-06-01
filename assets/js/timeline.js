/* Timeline renderer — ordering toggle + scroll-reveal. Zero dependencies. */
(function () {
  "use strict";

  var CATS = {
    education:   { label: "Education",   color: "var(--cat-education)" },
    research:    { label: "Research",    color: "var(--cat-research)" },
    engineering: { label: "Engineering", color: "var(--cat-engineering)" },
    internship:  { label: "Internship",  color: "var(--cat-internship)" },
    opensource:  { label: "Open Source", color: "var(--cat-opensource)" },
    speaking:    { label: "Speaking",    color: "var(--cat-speaking)" }
  };

  var listEl = document.getElementById("timeline");
  var filtersEl = document.getElementById("filters");
  var toggle = document.getElementById("orderToggle");
  var data = (window.TIMELINE || []).slice();
  var newestFirst = true;   // default view: most recent at the top
  var activeFilter = "all"; // default: show every category

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function buildEntry(item, index) {
    var cat = CATS[item.category] || { label: item.category, color: "var(--accent)" };

    var li = el("li", "entry" + (index % 2 ? " right" : ""));
    li.style.setProperty("--cat", cat.color);

    li.appendChild(el("span", "entry-date", escapeHtml(item.date)));

    var card = el("div", "card");

    var top = el("div", "card-top");
    top.appendChild(el("span", "badge", escapeHtml(cat.label)));
    card.appendChild(top);

    card.appendChild(el(
      "h3", null,
      escapeHtml(item.title) +
      (item.org ? ' <span class="org">— ' + escapeHtml(item.org) + "</span>" : "")
    ));

    if (item.body) card.appendChild(el("p", null, escapeHtml(item.body)));

    if (item.sources && item.sources.length) {
      var src = el("div", "sources");
      item.sources.forEach(function (s) {
        var a = el("a", "source-link", escapeHtml(s.label));
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener";
        src.appendChild(a);
      });
      card.appendChild(src);
    }

    li.appendChild(card);
    return li;
  }

  function render() {
    var ordered = data
      .filter(function (item) {
        return activeFilter === "all" || item.category === activeFilter;
      })
      .sort(function (a, b) {
        var d = (a.start - b.start) || (a.end - b.end);
        return newestFirst ? -d : d;
      });

    listEl.innerHTML = "";
    ordered.forEach(function (item, i) {
      listEl.appendChild(buildEntry(item, i));
    });
    observeEntries();
  }

  /* Build filter chips: "All" plus every category present in the data,
     ordered to match CATS. */
  function buildFilters() {
    if (!filtersEl) return;
    var present = Object.keys(CATS).filter(function (key) {
      return data.some(function (item) { return item.category === key; });
    });

    var defs = [{ key: "all", label: "All" }].concat(
      present.map(function (key) { return { key: key, label: CATS[key].label }; })
    );

    filtersEl.innerHTML = "";
    defs.forEach(function (def) {
      var chip = el("button", "filter-chip", escapeHtml(def.label));
      chip.type = "button";
      chip.dataset.filter = def.key;
      if (def.key !== "all") chip.style.setProperty("--cat", CATS[def.key].color);
      if (def.key === activeFilter) chip.classList.add("is-active");
      chip.setAttribute("aria-pressed", String(def.key === activeFilter));

      chip.addEventListener("click", function () {
        activeFilter = def.key;
        filtersEl.querySelectorAll(".filter-chip").forEach(function (c) {
          var on = c.dataset.filter === activeFilter;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", String(on));
        });
        render();
      });

      filtersEl.appendChild(chip);
    });
  }

  /* Scroll-reveal */
  var observer = null;
  function observeEntries() {
    var entries = listEl.querySelectorAll(".entry");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      entries.forEach(function (e) { e.classList.add("is-visible"); });
      return;
    }

    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function (obs) {
      obs.forEach(function (o) {
        if (o.isIntersecting) {
          o.target.classList.add("is-visible");
          observer.unobserve(o.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    entries.forEach(function (e) { observer.observe(e); });
  }

  function updateToggle() {
    toggle.setAttribute("aria-pressed", String(newestFirst));
    toggle.querySelector(".label").textContent = newestFirst ? "Newest first" : "Oldest first";
  }

  toggle.addEventListener("click", function () {
    newestFirst = !newestFirst;
    updateToggle();
    render();
  });

  updateToggle();
  buildFilters();
  render();
})();
