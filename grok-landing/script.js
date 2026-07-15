(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Animate ranking bars when they enter view
  const bars = document.querySelectorAll(".rank-bar");
  if (bars.length && !reduceMotion) {
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const bar = entry.target;
          const width = bar.getAttribute("data-width");
          if (width) bar.style.width = width;
          barObserver.unobserve(bar);
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach((bar) => barObserver.observe(bar));
  } else {
    bars.forEach((bar) => {
      const width = bar.getAttribute("data-width");
      if (width) bar.style.width = width;
    });
  }

  // Scroll reveals for major blocks
  const revealTargets = document.querySelectorAll(
    ".thesis-grid, .rank-chart, .compare-table-wrap, .callout-strip, .vertex-card, .use-list li, .caveat, .closing-line"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if (!reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  // Stagger vertex cards slightly
  document.querySelectorAll(".vertex-card").forEach((card, i) => {
    card.style.transitionDelay = `${i * 60}ms`;
  });
})();
