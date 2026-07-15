(() => {
  // Artificial Analysis / published list pricing — July 2026 launch window
  const MODELS = [
    {
      id: "fable",
      name: "Fable 5",
      short: "Fable",
      color: "#6b7280",
      intel: 60,
      speed: 60,
      costTask: 3.25,
      coding: 77,
      codingCost: 11.8,
      codingTokens: 7.2,
      outPrice: 50,
      tokensII: null, // not published in the Grok 4.5 AA write-up
    },
    {
      id: "opus",
      name: "Opus 4.8",
      short: "Opus",
      color: "#4b5563",
      intel: 56,
      speed: 54,
      costTask: 1.78,
      coding: null,
      codingCost: null,
      codingTokens: null,
      outPrice: 25,
      tokensII: 35, // AA: Grok ~14k is >60% lower than Opus → Opus ≈ 35k
    },
    {
      id: "gpt55",
      name: "GPT-5.5",
      short: "GPT-5.5",
      color: "#374151",
      intel: 55,
      speed: 73,
      costTask: 0.99,
      coding: 76,
      codingCost: 5.07,
      codingTokens: 6.2,
      outPrice: 30,
      tokensII: 16,
    },
    {
      id: "grok",
      name: "Grok 4.5",
      short: "Grok 4.5",
      color: "#0b6e4f",
      highlight: true,
      intel: 54,
      speed: 118,
      costTask: 0.31,
      coding: 76,
      codingCost: 2.49,
      codingTokens: 1.9,
      outPrice: 6,
      tokensII: 14,
    },
    {
      id: "sonnet",
      name: "Sonnet 5",
      short: "Sonnet",
      color: "#9ca3af",
      intel: 51, // below Grok per AA prose; approximate for matrix context
      speed: null,
      costTask: 1.55, // ≈5× Grok $0.31
      coding: null,
      codingCost: null,
      codingTokens: null,
      outPrice: 15,
      tokensII: null,
      approximate: true,
    },
    {
      id: "gemini",
      name: "Gemini 3.1 Pro",
      short: "Gemini",
      color: "#9ca3af",
      intel: 46, // AA Index v4.1 commentary
      speed: null,
      costTask: null,
      coding: null,
      codingCost: null,
      codingTokens: null,
      outPrice: 12,
      tokensII: null,
    },
  ];

  const NS = "http://www.w3.org/2000/svg";

  function el(name, attrs = {}, text) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
    if (text != null) node.textContent = text;
    return node;
  }

  function extent(values, padRatio = 0.08) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return [min - span * padRatio, max + span * padRatio];
  }

  function scale(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  }

  /**
   * @param {object} opts
   * golden: 'ul' upper-left (high Y, low X) | 'ur' upper-right (high Y, high X)
   */
  function drawScatter(containerId, {
    xKey,
    yKey,
    xLabel,
    yLabel,
    golden,
    xFormat = (v) => String(v),
    filter = () => true,
  }) {
    const host = document.getElementById(containerId);
    if (!host) return;

    const data = MODELS.filter((m) => m[xKey] != null && m[yKey] != null && filter(m));
    if (!data.length) return;

    const W = 520;
    const H = 416;
    const m = { top: 18, right: 18, bottom: 44, left: 48 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;

    const xDom = extent(data.map((d) => d[xKey]));
    const yDom = extent(data.map((d) => d[yKey]));
    // Intelligence-like Y often wants a tighter floor near ~40
    if (yKey === "intel" || yKey === "coding") {
      yDom[0] = Math.min(yDom[0], Math.min(...data.map((d) => d[yKey])) - 2);
    }

    const x = scale(xDom, [0, iw]);
    const y = scale(yDom, [ih, 0]);

    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      role: "img",
    });

    const g = el("g", { transform: `translate(${m.left},${m.top})` });
    svg.appendChild(g);

    // Golden zone
    const midX = iw * 0.5;
    const midY = ih * 0.5;
    let zone;
    if (golden === "ul") {
      zone = el("rect", { class: "golden-zone", x: 0, y: 0, width: midX, height: midY });
    } else if (golden === "ur") {
      zone = el("rect", { class: "golden-zone", x: midX, y: 0, width: midX, height: midY });
    }
    if (zone) {
      g.appendChild(zone);
      const zoneLabel = el(
        "text",
        {
          class: "axis-label",
          x: golden === "ul" ? 8 : midX + 8,
          y: 14,
          "font-size": 9,
          opacity: 0.7,
        },
        "golden zone"
      );
      g.appendChild(zoneLabel);
    }

    // Grid
    for (let i = 0; i <= 4; i++) {
      const yy = (ih / 4) * i;
      g.appendChild(el("line", { class: "grid-line", x1: 0, x2: iw, y1: yy, y2: yy }));
      const xx = (iw / 4) * i;
      g.appendChild(el("line", { class: "grid-line", x1: xx, x2: xx, y1: 0, y2: ih }));
    }

    // Axes
    g.appendChild(el("line", { x1: 0, y1: ih, x2: iw, y2: ih, stroke: "#9ca3af", "stroke-width": 1.2 }));
    g.appendChild(el("line", { x1: 0, y1: 0, x2: 0, y2: ih, stroke: "#9ca3af", "stroke-width": 1.2 }));

    // Axis labels
    g.appendChild(
      el(
        "text",
        { class: "axis-label", x: iw / 2, y: ih + 36, "text-anchor": "middle" },
        xLabel
      )
    );
    g.appendChild(
      el(
        "text",
        {
          class: "axis-label",
          x: -ih / 2,
          y: -34,
          transform: "rotate(-90)",
          "text-anchor": "middle",
        },
        yLabel
      )
    );

    // Tick labels
    for (let i = 0; i <= 4; i++) {
      const xv = xDom[0] + ((xDom[1] - xDom[0]) * i) / 4;
      const yv = yDom[0] + ((yDom[1] - yDom[0]) * i) / 4;
      g.appendChild(
        el(
          "text",
          {
            class: "tick-label",
            x: x(xv),
            y: ih + 14,
            "text-anchor": "middle",
          },
          xFormat(xv)
        )
      );
      g.appendChild(
        el(
          "text",
          {
            class: "tick-label",
            x: -8,
            y: y(yv) + 3,
            "text-anchor": "end",
          },
          String(Math.round(yv * 10) / 10)
        )
      );
    }

    // Points — draw non-Grok first, Grok on top
    const ordered = [...data].sort((a, b) => (a.highlight ? 1 : 0) - (b.highlight ? 1 : 0));
    ordered.forEach((d) => {
      const cx = x(d[xKey]);
      const cy = y(d[yKey]);
      const r = d.highlight ? 7 : 5;

      if (d.highlight) {
        g.appendChild(
          el("circle", {
            cx,
            cy,
            r: 14,
            fill: "rgba(11,110,79,0.12)",
            stroke: "none",
          })
        );
      }

      g.appendChild(
        el("circle", {
          cx,
          cy,
          r,
          fill: d.color,
          stroke: d.highlight ? "#0b6e4f" : "#fff",
          "stroke-width": d.highlight ? 2 : 1.2,
        })
      );

      const labelSide = cx > iw * 0.72 ? -8 : 8;
      g.appendChild(
        el(
          "text",
          {
            class: `point-label${d.highlight ? " grok" : ""}`,
            x: cx + labelSide,
            y: cy - 8,
            "text-anchor": labelSide < 0 ? "end" : "start",
          },
          d.short + (d.approximate ? "*" : "")
        )
      );
    });

    host.innerHTML = "";
    host.appendChild(svg);
  }

  // Legend
  const legend = document.getElementById("plot-legend");
  if (legend) {
    legend.innerHTML = MODELS.map(
      (m) =>
        `<span class="legend-item${m.highlight ? " is-grok" : ""}">
          <span class="legend-dot" style="background:${m.color}"></span>
          ${m.name}${m.approximate ? " *" : ""}
        </span>`
    ).join("");
    legend.innerHTML +=
      '<span class="legend-item" style="color:var(--muted)">* approximate / derived from AA prose</span>';
  }

  const money = (v) => `$${v < 1 ? v.toFixed(2) : v.toFixed(v >= 10 ? 0 : 1)}`;

  drawScatter("plot-cost", {
    xKey: "costTask",
    yKey: "intel",
    xLabel: "Cost per Intelligence Index task (USD) →",
    yLabel: "← Intelligence Index",
    golden: "ul",
    xFormat: money,
  });

  drawScatter("plot-speed", {
    xKey: "speed",
    yKey: "intel",
    xLabel: "Output speed (tokens / sec) →",
    yLabel: "← Intelligence Index",
    golden: "ur",
    xFormat: (v) => `${Math.round(v)}`,
  });

  drawScatter("plot-coding-cost", {
    xKey: "codingCost",
    yKey: "coding",
    xLabel: "Cost per coding-agent task (USD) →",
    yLabel: "← Coding Agent Index",
    golden: "ul",
    xFormat: money,
  });

  drawScatter("plot-coding-tokens", {
    xKey: "codingTokens",
    yKey: "coding",
    xLabel: "Tokens per coding-agent task (millions) →",
    yLabel: "← Coding Agent Index",
    golden: "ul",
    xFormat: (v) => `${v.toFixed(1)}M`,
  });

  drawScatter("plot-price", {
    xKey: "outPrice",
    yKey: "intel",
    xLabel: "List output price ($ / 1M tokens) →",
    yLabel: "← Intelligence Index",
    golden: "ul",
    xFormat: money,
  });

  drawScatter("plot-tokens", {
    xKey: "tokensII",
    yKey: "intel",
    xLabel: "Output tokens per II task (thousands) →",
    yLabel: "← Intelligence Index",
    golden: "ul",
    xFormat: (v) => `${Math.round(v)}k`,
    filter: (m) => m.tokensII != null,
  });
})();
