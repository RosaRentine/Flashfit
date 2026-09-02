(() => {
  "use strict";

  const STORAGE_KEY = "flashfit-config-v1";
  const VERIFIED_DATE = "2026-09-02";

  const MODEL_DATA = Object.freeze({
    name: "Qwen3.8-Flash-Next",
    mainParameters: 125,
    ngramParameters: 51,
    activeParameters: 6,
    nativeContext: 262144,
    visionPayload: 0.904,
    mtpPayload: 2.79
  });

  const QUANT_DATA = Object.freeze([
    { id: "UD-IQ1_S", size: 72.5, note: "Extreme compression" },
    { id: "UD-IQ1_M", size: 74.5, note: "Extreme compression" },
    { id: "UD-Q2_K_XL", size: 78.9, note: "Very memory-focused" },
    { id: "UD-IQ3_XXS", size: 82.0, note: "Very memory-focused" },
    { id: "UD-Q3_K_XL", size: 90.0, note: "Memory-focused balance" },
    { id: "UD-IQ4_XS", size: 93.7, note: "Practical local-inference range" },
    { id: "UD-Q4_K_XL", size: 111.0, note: "Practical range, larger payload" },
    { id: "UD-Q5_K_XL", size: 158.0, note: "Higher fidelity, much larger" },
    { id: "UD-Q6_K_XL", size: 169.0, note: "Higher fidelity, much larger" },
    { id: "Q8_0", size: 192.0, note: "Very large" },
    { id: "BF16", size: 354.0, note: "Full precision, extreme memory" }
  ]);

  const BACKENDS = Object.freeze({
    cuda: "llama.cpp / CUDA",
    rocm: "llama.cpp / ROCm",
    metal: "llama.cpp / Metal",
    cpu: "llama.cpp / CPU",
    custom: "Other / custom"
  });

  const ARCHITECTURES = Object.freeze({
    discrete: "Discrete GPU + system RAM",
    unified: "Unified memory",
    cpu: "CPU / system RAM only"
  });

  const BENCHMARK_DATA = Object.freeze([
    {
      id: "strix-rocm",
      family: "strix",
      architecture: "unified",
      backend: "rocm",
      quant: "UD-IQ4_XS",
      maxContext: 24576,
      title: "Strix Halo · ROCm",
      hardware: "Ryzen AI Max+ 395 / Radeon 8060S · 128 GB unified",
      badge: "Patched stack",
      measures: [
        { label: "8K baseline", value: "16.8 tok/s" },
        { label: "8K MTP + ngram", value: "31.7–47.1" },
        { label: "24K baseline", value: "~15 tok/s" },
        { label: "24K MTP + ngram", value: "25.4–28.6" }
      ],
      summary: "Greedy coding workloads on a reproducible llama.cpp stack with ROCm TOP_K fixes, native MTP and ngram-mod. These are not stock-build expectations.",
      closest: "16.8 baseline · up to 47.1 tok/s in a specific speculative coding workload",
      source: "https://github.com/ggml-org/llama.cpp/discussions/27950"
    },
    {
      id: "m1-metal",
      family: "apple",
      architecture: "unified",
      backend: "metal",
      quant: "IQ4_NL custom",
      maxContext: 200000,
      title: "M1 Ultra · Metal",
      hardware: "M1 Ultra · 128 GB unified · 95.20 GiB custom IQ4-class file",
      badge: "Custom branch",
      measures: [
        { label: "PP512 · depth 0", value: "543.85 tok/s" },
        { label: "TG128 · depth 0", value: "39.48 tok/s" },
        { label: "PP512 · 10K depth", value: "465.45 tok/s" },
        { label: "TG128 · 10K depth", value: "35.28 tok/s" }
      ],
      summary: "llama-bench results from a Metal-specific optimization branch. Prefill and generation are reported separately; this is not stock llama.cpp.",
      closest: "39.48 tok/s TG128 at depth 0 on a custom Metal optimization branch",
      source: "https://huggingface.co/unsloth/Qwen3.8-Flash-Next-GGUF/discussions/3"
    },
    {
      id: "gb10-sglang",
      family: "gb10",
      architecture: "unified",
      backend: "custom",
      quant: "NVFP4 custom",
      maxContext: 200000,
      title: "GB10 · SGLang",
      hardware: "Single DGX Spark / GB10 · 128 GB unified · NVFP4 + NVMe N-gram offload",
      badge: "Custom SGLang",
      measures: [
        { label: "Decode · no MTP", value: "14–15 tok/s" },
        { label: "MTP · prose", value: "18–19 tok/s" },
        { label: "MTP · code", value: "48–51 tok/s" },
        { label: "Context mode", value: "~200K" }
      ],
      summary: "Field report using a tweaked SGLang runtime, NVFP4 weights and an N-gram table mapped from NVMe. Code/prose acceptance differs sharply.",
      closest: "14–15 baseline; workload-dependent 18–51 tok/s with MTP on tweaked SGLang",
      source: "https://forums.developer.nvidia.com/t/qwen3-8-flash-next-nvfp4-single-spark/381500"
    }
  ]);

  const DEFAULT_STATE = Object.freeze({
    theme: "dark",
    architecture: "unified",
    unifiedMemory: 128,
    unifiedReserve: 16,
    gpuVram: 24,
    systemRam: 128,
    systemReserve: 16,
    vramReserve: 2,
    cpuRam: 128,
    cpuReserve: 16,
    backend: "rocm",
    hardwareFamily: "strix",
    quant: "UD-IQ4_XS",
    context: 32768,
    contextMode: "32768",
    customContext: 32768,
    vision: false,
    mtp: false,
    advancedOpen: false,
    hasEdited: false
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const elements = {
    form: $("#config-form"),
    themeToggle: $("#theme-toggle"),
    themeLabel: $(".theme-label"),
    architectureFields: $$(".architecture-fields"),
    validation: $("#validation-message"),
    backend: $("#backend"),
    hardwareFamily: $("#hardware-family"),
    quantSelector: $("#quant-selector"),
    quantMenu: $("#quant-menu"),
    selectedQuantName: $("#selected-quant-name"),
    selectedQuantNote: $("#selected-quant-note"),
    selectedQuantSize: $("#selected-quant-size"),
    contextPresets: $("#context-presets"),
    customContextWrap: $("#custom-context-wrap"),
    customContext: $("#custom-context"),
    extendedWarning: $("#extended-warning"),
    vision: $("#vision-enabled"),
    mtp: $("#mtp-enabled"),
    advanced: $("#advanced-section"),
    reset: $("#reset-button"),
    exampleBadge: $("#example-badge"),
    verdict: $("#verdict"),
    verdictKicker: $("#verdict-kicker"),
    verdictHeading: $("#result-heading"),
    verdictCode: $("#verdict-code"),
    recommendation: $("#recommendation"),
    payloadValue: $("#payload-value"),
    availableValue: $("#available-value"),
    recommendedValue: $("#recommended-value"),
    differenceValue: $("#difference-value"),
    memorySubtitle: $("#memory-subtitle"),
    memoryScale: $("#memory-scale"),
    memoryTrack: $("#memory-track"),
    memoryAvailable: $("#memory-available"),
    memoryPayload: $("#memory-payload"),
    memoryVision: $("#memory-vision"),
    memoryMtp: $("#memory-mtp"),
    memoryOperating: $("#memory-operating"),
    memoryLimit: $("#memory-limit"),
    visionLegend: $("#vision-legend"),
    mtpLegend: $("#mtp-legend"),
    offloadLegend: $("#offload-legend"),
    resultQuant: $("#result-quant"),
    resultContext: $("#result-context"),
    resultBackend: $("#result-backend"),
    resultResidency: $("#result-residency"),
    copyButton: $("#copy-button"),
    exportButton: $("#export-button"),
    actionStatus: $("#action-status"),
    closestReference: $("#closest-reference-content"),
    benchmarkGrid: $("#benchmark-grid"),
    canvas: $("#export-canvas")
  };

  let state = loadState();
  let currentCalculation = null;
  let actionTimer = null;

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, finiteNumber(value, min)));
  }

  function validQuant(id) {
    return QUANT_DATA.some((quant) => quant.id === id);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return { ...DEFAULT_STATE };
      const merged = { ...DEFAULT_STATE, ...saved, hasEdited: true };
      if (!Object.hasOwn(ARCHITECTURES, merged.architecture)) merged.architecture = DEFAULT_STATE.architecture;
      if (!Object.hasOwn(BACKENDS, merged.backend)) merged.backend = DEFAULT_STATE.backend;
      if (!validQuant(merged.quant)) merged.quant = DEFAULT_STATE.quant;
      if (!new Set(["dark", "light"]).has(merged.theme)) merged.theme = DEFAULT_STATE.theme;
      [
        ["unifiedMemory", 0, 4096], ["unifiedReserve", 0, 2048],
        ["gpuVram", 0, 4096], ["systemRam", 0, 4096],
        ["systemReserve", 0, 2048], ["vramReserve", 0, 2048],
        ["cpuRam", 0, 4096], ["cpuReserve", 0, 2048],
        ["context", 1024, 2000000], ["customContext", 1024, 2000000]
      ].forEach(([key, min, max]) => {
        merged[key] = clamp(merged[key], min, max);
      });
      const contextModes = new Set(["8192", "16384", "32768", "65536", "131072", "262144", "custom"]);
      if (!contextModes.has(String(merged.contextMode))) merged.contextMode = "custom";
      const hardwareFamilies = new Set(["strix", "apple", "gb10", "nvidia", "amd", "general"]);
      if (!hardwareFamilies.has(merged.hardwareFamily)) merged.hardwareFamily = "general";
      merged.vision = merged.vision === true;
      merged.mtp = merged.mtp === true;
      merged.advancedOpen = merged.advancedOpen === true;
      return merged;
    } catch (error) {
      console.warn("Flashfit ignored invalid saved settings.", error);
      return { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Flashfit could not save settings.", error);
    }
  }

  function formatGb(value, digits = 1) {
    return `${finiteNumber(value).toFixed(digits)} GB`;
  }

  function formatContext(tokens) {
    const safe = finiteNumber(tokens);
    const presetLabels = {
      8192: "8K", 16384: "16K", 32768: "32K", 65536: "64K",
      131072: "128K", 262144: "262K"
    };
    if (presetLabels[safe]) return presetLabels[safe];
    if (safe >= 1000000) return `${(safe / 1000000).toFixed(safe % 1000000 === 0 ? 0 : 2)}M`;
    if (safe >= 1000) {
      const k = safe / 1000;
      return `${k >= 100 ? Math.round(k) : Number(k.toFixed(1))}K`;
    }
    return `${Math.round(safe)}`;
  }

  function readInput(id, fallback = 0) {
    const input = $(`#${id}`);
    return finiteNumber(input ? input.value : fallback, fallback);
  }

  function getHeadroom(context) {
    if (context <= 32768) return 0.10;
    if (context <= 65536) return 0.12;
    if (context <= 131072) return 0.15;
    if (context <= MODEL_DATA.nativeContext) return 0.20;
    return 0.30;
  }

  function calculate() {
    const quant = QUANT_DATA.find((item) => item.id === state.quant) || QUANT_DATA[5];
    const vision = state.vision ? MODEL_DATA.visionPayload : 0;
    const mtp = state.mtp ? MODEL_DATA.mtpPayload : 0;
    const payload = quant.size + vision + mtp;
    const headroomRate = getHeadroom(state.context);
    const recommended = payload * (1 + headroomRate);

    let effectiveVram = 0;
    let effectiveRam = 0;
    let available = 0;
    let status = "does-not-fit";
    let label = "Does not fit";
    let residency = "Insufficient memory";
    let tone = "bad";
    let code = "05";

    if (state.architecture === "discrete") {
      effectiveVram = Math.max(0, state.gpuVram - state.vramReserve);
      effectiveRam = Math.max(0, state.systemRam - state.systemReserve);
      available = effectiveVram + effectiveRam;
      if (effectiveVram >= recommended) {
        status = "full-gpu-comfortable";
        label = "Full GPU — comfortable";
        residency = "Full GPU";
        tone = "good";
        code = "01";
      } else if (effectiveVram >= payload) {
        status = "full-gpu-tight";
        label = "Full GPU — tight";
        residency = "Full GPU";
        tone = "warn";
        code = "02";
      } else if (available >= recommended) {
        status = "offload-required";
        label = "Offload required";
        residency = "GPU + host RAM";
        tone = "warn";
        code = "03";
      } else if (available >= payload) {
        status = "aggressive-offload";
        label = "Aggressive offload / tight";
        residency = "Heavy host offload";
        tone = "warn";
        code = "04";
      }
    } else {
      const total = state.architecture === "unified" ? state.unifiedMemory : state.cpuRam;
      const reserve = state.architecture === "unified" ? state.unifiedReserve : state.cpuReserve;
      available = Math.max(0, total - reserve);
      effectiveRam = available;
      residency = state.architecture === "unified" ? "Unified pool" : "CPU / system RAM";
      if (available >= recommended) {
        status = "comfortable";
        label = "Comfortable fit";
        tone = "good";
        code = "01";
      } else if (available >= payload) {
        status = "tight";
        label = "Tight fit";
        tone = "warn";
        code = "02";
      }
    }

    return {
      quant, vision, mtp, payload, headroomRate, recommended,
      effectiveVram, effectiveRam, available, status, label, residency, tone, code,
      difference: available - recommended
    };
  }

  function recommendationFor(calc) {
    const contextLabel = formatContext(state.context);
    const payloadLabel = formatGb(calc.payload);
    const availableLabel = formatGb(calc.available);
    if (calc.status === "comfortable") {
      const medium = state.architecture === "unified" ? "usable unified-memory pool" : "usable system memory";
      return `The ${payloadLabel} payload fits inside your ${availableLabel} ${medium} with the disclosed ${Math.round(calc.headroomRate * 100)}% operating allowance for ${contextLabel} context.`;
    }
    if (calc.status === "tight") {
      return `The payload fits by file size, but misses the ${Math.round(calc.headroomRate * 100)}% operating allowance for ${contextLabel}. Treat this as technically plausible, not comfortable.`;
    }
    if (calc.status === "full-gpu-comfortable") {
      return `The payload and recommended allowance fit in usable VRAM. This is the cleanest residency result, though it is still not a tokens-per-second prediction.`;
    }
    if (calc.status === "full-gpu-tight") {
      return `The payload fits in usable VRAM, but there is little room for the selected context and runtime overhead. Reduce context or choose a smaller quant for breathing room.`;
    }
    if (calc.status === "offload-required") {
      return `The payload exceeds usable VRAM but fits across VRAM plus host RAM with operating headroom. Layer or tensor offloading may run, but is not equivalent to full-GPU performance.`;
    }
    if (calc.status === "aggressive-offload") {
      return `The payload only just fits across usable VRAM and host RAM, below the operating target. Expect aggressive offloading and little resilience to additional runtime allocation.`;
    }
    return `The ${payloadLabel} payload exceeds the ${availableLabel} effective memory pool before the recommended operating allowance. Choose a smaller quant or increase usable memory.`;
  }

  function validateMemory() {
    const invalid = [];
    const activeFields = elements.architectureFields.find((group) => group.dataset.architecture === state.architecture);
    $$('input[type="number"]', elements.form).forEach((input) => input.removeAttribute("aria-invalid"));

    if (activeFields) {
      $$('input[type="number"]', activeFields).forEach((input) => {
        const value = finiteNumber(input.value, NaN);
        const min = finiteNumber(input.min, 0);
        const max = finiteNumber(input.max, 4096);
        if (!Number.isFinite(value) || value < min || value > max) {
          input.setAttribute("aria-invalid", "true");
          invalid.push(`${input.previousElementSibling.textContent.trim()} must be between ${min} and ${max}.`);
        }
      });
    }

    if (state.architecture === "unified" && state.unifiedReserve > state.unifiedMemory) {
      invalid.push("The OS/app reserve is larger than total unified memory, leaving 0 GB usable.");
      $("#unified-reserve").setAttribute("aria-invalid", "true");
    }
    if (state.architecture === "cpu" && state.cpuReserve > state.cpuRam) {
      invalid.push("The OS/app reserve is larger than total system RAM, leaving 0 GB usable.");
      $("#cpu-reserve").setAttribute("aria-invalid", "true");
    }
    if (state.architecture === "discrete") {
      if (state.systemReserve > state.systemRam) {
        invalid.push("The system reserve is larger than installed RAM; usable system RAM is 0 GB.");
        $("#system-reserve").setAttribute("aria-invalid", "true");
      }
      if (state.vramReserve > state.gpuVram) {
        invalid.push("The VRAM reserve is larger than installed VRAM; usable VRAM is 0 GB.");
        $("#vram-reserve").setAttribute("aria-invalid", "true");
      }
    }

    elements.validation.hidden = invalid.length === 0;
    elements.validation.textContent = invalid[0] || "";
  }

  function renderArchitecture() {
    elements.architectureFields.forEach((group) => {
      group.hidden = group.dataset.architecture !== state.architecture;
    });
    $$('input[name="architecture"]', elements.form).forEach((input) => {
      input.checked = input.value === state.architecture;
    });
  }

  function renderQuantMenu() {
    elements.quantMenu.replaceChildren(...QUANT_DATA.map((quant) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `quant-option${quant.id === state.quant ? " is-selected" : ""}`;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(quant.id === state.quant));
      button.dataset.quant = quant.id;
      button.innerHTML = `<strong>${quant.id}</strong><span>${quant.size.toFixed(quant.size % 1 ? 1 : 0)} GB</span><small>${quant.note}</small>`;
      return button;
    }));
  }

  function renderMemory(calc) {
    const scaleMax = Math.max(calc.available, calc.recommended, calc.payload, 1) * 1.08;
    const pct = (value) => `${Math.min(100, Math.max(0, value / scaleMax * 100)).toFixed(3)}%`;
    const quantWidth = pct(calc.quant.size);
    const visionLeft = pct(calc.quant.size);
    const mtpLeft = pct(calc.quant.size + calc.vision);
    const operatingLeft = pct(calc.payload);
    const operatingWidth = pct(Math.max(0, calc.recommended - calc.payload));

    elements.memoryAvailable.style.width = pct(calc.available);
    elements.memoryPayload.style.width = quantWidth;
    elements.memoryVision.style.left = visionLeft;
    elements.memoryVision.style.width = pct(calc.vision);
    elements.memoryMtp.style.left = mtpLeft;
    elements.memoryMtp.style.width = pct(calc.mtp);
    elements.memoryOperating.style.left = operatingLeft;
    elements.memoryOperating.style.width = operatingWidth;
    elements.memoryLimit.style.left = pct(calc.available);
    elements.memoryScale.textContent = `0 — ${Math.ceil(scaleMax)} GB`;
    elements.visionLegend.hidden = !state.vision;
    elements.mtpLegend.hidden = !state.mtp;
    elements.offloadLegend.hidden = state.architecture !== "discrete";

    if (state.architecture === "discrete" && calc.available > 0) {
      const vramRatio = Math.min(100, calc.effectiveVram / calc.available * 100);
      elements.memoryAvailable.style.background = `linear-gradient(90deg, color-mix(in srgb, var(--accent) 12%, transparent) 0 ${vramRatio}%, color-mix(in srgb, var(--host) 22%, transparent) ${vramRatio}% 100%)`;
      elements.memorySubtitle.textContent = `${calc.effectiveVram.toFixed(1)} GB usable VRAM + ${calc.effectiveRam.toFixed(1)} GB usable host RAM`;
    } else {
      elements.memoryAvailable.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)";
      elements.memorySubtitle.textContent = `${calc.available.toFixed(1)} GB usable ${state.architecture === "unified" ? "unified memory" : "system RAM"}`;
    }

    const componentText = [
      `${calc.quant.size.toFixed(1)} GB model`,
      state.vision ? `${MODEL_DATA.visionPayload.toFixed(1)} GB vision` : null,
      state.mtp ? `${MODEL_DATA.mtpPayload.toFixed(2)} GB MTP` : null,
      `${(calc.recommended - calc.payload).toFixed(1)} GB recommended headroom`,
      `${calc.available.toFixed(1)} GB available`
    ].filter(Boolean).join(", ");
    elements.memoryTrack.setAttribute("aria-label", `Memory budget: ${componentText}.`);
  }

  function findClosestReference() {
    const exact = BENCHMARK_DATA.find((benchmark) => {
      const familyMatch = benchmark.family === state.hardwareFamily;
      const architectureMatch = benchmark.architecture === state.architecture;
      const backendMatch = benchmark.backend === state.backend || (benchmark.family === "gb10" && state.backend === "cuda");
      const quantMatch = benchmark.quant === state.quant || benchmark.quant.toLowerCase().includes("iq4") && state.quant.includes("IQ4");
      const contextMatch = state.context <= benchmark.maxContext * 1.35;
      return familyMatch && architectureMatch && backendMatch && quantMatch && contextMatch;
    });
    return exact || null;
  }

  function renderClosestReference() {
    const benchmark = findClosestReference();
    if (!benchmark) {
      elements.closestReference.innerHTML = `<div class="closest-content"><div><h3>No close measured performance reference yet.</h3><p>Your selection is still evaluated for memory fit; Flashfit will not translate another machine's benchmark into a prediction.</p></div><span class="evidence evidence--calculated">No extrapolation</span></div>`;
      return;
    }
    elements.closestReference.innerHTML = `<div class="closest-content"><div><h3>${benchmark.title}</h3><p>${benchmark.hardware} · ${benchmark.quant}</p></div><div class="closest-speed">${benchmark.closest}<br><span class="evidence evidence--measured">Measured · specific build</span></div></div>`;
  }

  function renderBenchmarks() {
    elements.benchmarkGrid.replaceChildren(...BENCHMARK_DATA.map((benchmark) => {
      const article = document.createElement("article");
      article.className = "benchmark-card";
      article.innerHTML = `
        <header>
          <div><h3>${benchmark.title}</h3><div class="benchmark-hardware">${benchmark.hardware}</div></div>
          <span class="evidence evidence--experimental">${benchmark.badge}</span>
        </header>
        <div class="benchmark-measures">${benchmark.measures.map((measure) => `<div><span>${measure.label}</span><strong>${measure.value}</strong></div>`).join("")}</div>
        <p>${benchmark.summary} <a href="${benchmark.source}" target="_blank" rel="noreferrer">Source ↗</a></p>`;
      return article;
    }));
  }

  function renderResult() {
    validateMemory();
    currentCalculation = calculate();
    const calc = currentCalculation;

    elements.verdict.dataset.tone = calc.tone;
    elements.verdictKicker.textContent = ARCHITECTURES[state.architecture];
    elements.verdictHeading.textContent = calc.label;
    elements.verdictCode.textContent = calc.code;
    elements.recommendation.textContent = recommendationFor(calc);
    elements.payloadValue.textContent = formatGb(calc.payload);
    elements.availableValue.textContent = formatGb(calc.available);
    elements.recommendedValue.textContent = formatGb(calc.recommended);
    elements.differenceValue.textContent = `${calc.difference >= 0 ? "+" : "−"}${Math.abs(calc.difference).toFixed(1)} GB`;
    elements.differenceValue.style.color = calc.difference >= 0 ? "var(--good)" : "var(--bad)";

    elements.resultQuant.textContent = state.quant;
    elements.resultContext.textContent = formatContext(state.context);
    elements.resultBackend.textContent = BACKENDS[state.backend].replace("llama.cpp / ", "");
    elements.resultResidency.textContent = calc.residency;
    elements.extendedWarning.hidden = state.context <= MODEL_DATA.nativeContext;
    elements.exampleBadge.hidden = state.hasEdited;

    renderMemory(calc);
    renderClosestReference();
  }

  function syncStateToForm() {
    document.documentElement.dataset.theme = state.theme;
    elements.themeLabel.textContent = state.theme === "dark" ? "Light" : "Dark";
    elements.themeToggle.setAttribute("aria-label", `Switch to ${state.theme === "dark" ? "light" : "dark"} theme`);
    renderArchitecture();

    const inputs = {
      "unified-memory": state.unifiedMemory,
      "unified-reserve": state.unifiedReserve,
      "gpu-vram": state.gpuVram,
      "system-ram": state.systemRam,
      "system-reserve": state.systemReserve,
      "vram-reserve": state.vramReserve,
      "cpu-ram": state.cpuRam,
      "cpu-reserve": state.cpuReserve,
      "custom-context": state.customContext
    };
    Object.entries(inputs).forEach(([id, value]) => { $(`#${id}`).value = value; });
    elements.backend.value = state.backend;
    elements.hardwareFamily.value = state.hardwareFamily;
    elements.vision.checked = state.vision;
    elements.mtp.checked = state.mtp;
    elements.advanced.open = Boolean(state.advancedOpen);

    const quant = QUANT_DATA.find((item) => item.id === state.quant) || QUANT_DATA[5];
    elements.selectedQuantName.textContent = quant.id;
    elements.selectedQuantNote.textContent = quant.note;
    elements.selectedQuantSize.textContent = formatGb(quant.size);
    renderQuantMenu();

    $$('button[data-context]', elements.contextPresets).forEach((button) => {
      button.classList.toggle("is-active", button.dataset.context === String(state.contextMode));
    });
    const isCustom = state.contextMode === "custom";
    elements.customContextWrap.hidden = !isCustom;
    if (!isCustom && !$$('button[data-context]', elements.contextPresets).some((button) => button.dataset.context === String(state.contextMode))) {
      state.contextMode = "custom";
      elements.customContextWrap.hidden = false;
    }
    renderResult();
  }

  function updateStateFromForm() {
    state.unifiedMemory = clamp(readInput("unified-memory", state.unifiedMemory), 0, 4096);
    state.unifiedReserve = clamp(readInput("unified-reserve", state.unifiedReserve), 0, 2048);
    state.gpuVram = clamp(readInput("gpu-vram", state.gpuVram), 0, 4096);
    state.systemRam = clamp(readInput("system-ram", state.systemRam), 0, 4096);
    state.systemReserve = clamp(readInput("system-reserve", state.systemReserve), 0, 2048);
    state.vramReserve = clamp(readInput("vram-reserve", state.vramReserve), 0, 2048);
    state.cpuRam = clamp(readInput("cpu-ram", state.cpuRam), 0, 4096);
    state.cpuReserve = clamp(readInput("cpu-reserve", state.cpuReserve), 0, 2048);
    state.backend = Object.hasOwn(BACKENDS, elements.backend.value) ? elements.backend.value : "custom";
    state.hardwareFamily = elements.hardwareFamily.value || "general";
    state.vision = elements.vision.checked;
    state.mtp = elements.mtp.checked;
    state.advancedOpen = elements.advanced.open;
    if (state.contextMode === "custom") {
      state.customContext = clamp(readInput("custom-context", state.customContext), 1024, 2000000);
      state.context = state.customContext;
    }
  }

  function markEdited() {
    state.hasEdited = true;
    elements.exampleBadge.hidden = true;
  }

  function selectQuant(id) {
    if (!validQuant(id)) return;
    state.quant = id;
    markEdited();
    closeQuantMenu();
    syncStateToForm();
    saveState();
  }

  function openQuantMenu() {
    elements.quantMenu.hidden = false;
    elements.quantSelector.setAttribute("aria-expanded", "true");
    const selected = $(".quant-option.is-selected", elements.quantMenu) || $(".quant-option", elements.quantMenu);
    if (selected) selected.focus();
  }

  function closeQuantMenu() {
    elements.quantMenu.hidden = true;
    elements.quantSelector.setAttribute("aria-expanded", "false");
  }

  function configurationText() {
    const calc = currentCalculation || calculate();
    const hardware = state.architecture === "unified"
      ? `${state.unifiedMemory} GB unified memory (${state.unifiedReserve} GB reserved)`
      : state.architecture === "discrete"
        ? `${state.gpuVram} GB VRAM + ${state.systemRam} GB system RAM (${state.vramReserve} GB VRAM / ${state.systemReserve} GB RAM reserved)`
        : `${state.cpuRam} GB system RAM (${state.cpuReserve} GB reserved)`;
    const closest = findClosestReference();
    return [
      `Flashfit — ${MODEL_DATA.name}`,
      "",
      `Hardware: ${hardware}`,
      `Usable memory: ${calc.available.toFixed(1)} GB${state.architecture === "discrete" ? ` combined (${calc.effectiveVram.toFixed(1)} GB VRAM + ${calc.effectiveRam.toFixed(1)} GB RAM)` : ""}`,
      `Backend: ${BACKENDS[state.backend]}`,
      `Quant: ${state.quant} (~${calc.quant.size.toFixed(1)} GB)`,
      `Context: ${formatContext(state.context)} (${Math.round(state.context).toLocaleString("en-US")} tokens)`,
      `Vision: ${state.vision ? "On (~0.9 GB projector)" : "Off"}`,
      `MTP: ${state.mtp ? "On — experimental (~2.79 GB)" : "Off"}`,
      "",
      `Verdict: ${calc.label}`,
      `Model payload: ~${calc.payload.toFixed(1)} GB`,
      `Recommended operating memory: ~${calc.recommended.toFixed(1)} GB (${Math.round(calc.headroomRate * 100)}% heuristic headroom)`,
      `${calc.difference >= 0 ? "Headroom" : "Deficit"}: ~${Math.abs(calc.difference).toFixed(1)} GB`,
      "",
      "Performance: no generalized tok/s prediction",
      `Closest measured reference: ${closest ? closest.title : "none yet"}`,
      `Data verified: ${VERIFIED_DATE}`
    ].join("\n");
  }

  async function copyConfiguration() {
    const text = configurationText();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Copy command was unavailable.");
      }
      showActionStatus("Configuration copied.", "success");
    } catch (error) {
      console.warn("Clipboard copy failed.", error);
      window.prompt("Copy this Flashfit configuration:", text);
      showActionStatus("Clipboard unavailable — a manual copy box was opened.", "error");
    }
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawText(ctx, text, x, y, style = {}) {
    ctx.save();
    ctx.fillStyle = style.color || "#ece9e2";
    ctx.font = `${style.italic ? "italic " : ""}${style.weight || 400} ${style.size || 24}px ${style.family || "Arial, sans-serif"}`;
    ctx.textAlign = style.align || "left";
    ctx.textBaseline = style.baseline || "alphabetic";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function exportResultCard() {
    try {
      const calc = currentCalculation || calculate();
      const canvas = elements.canvas;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D is unavailable.");

      const light = state.theme === "light";
      const colors = light ? {
        bg: "#eeeae1", surface: "#faf7f0", text: "#24272c", soft: "#686b70", line: "#cac5bb",
        accent: "#4969c7", good: "#3e7863", warn: "#98661e", bad: "#a14545", model: "#5776d4", vision: "#8b67ac", mtp: "#b17c29"
      } : {
        bg: "#111315", surface: "#1b1f24", text: "#eeeae2", soft: "#a9a8a4", line: "#3a4048",
        accent: "#8da7ff", good: "#8dbba4", warn: "#d2a45e", bad: "#cb7777", model: "#7796fa", vision: "#b793d6", mtp: "#d5ae6b"
      };
      const toneColor = calc.tone === "good" ? colors.good : calc.tone === "warn" ? colors.warn : colors.bad;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, 1200, 675);
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1200; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 675); ctx.stroke(); }
      for (let y = 0; y <= 675; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }

      ctx.fillStyle = colors.surface;
      ctx.fillRect(42, 42, 1116, 591);
      ctx.strokeStyle = colors.line;
      ctx.strokeRect(42.5, 42.5, 1115, 590);

      drawText(ctx, "F", 76, 92, { color: colors.accent, size: 27, italic: true, family: "Georgia" });
      drawText(ctx, "FLASHFIT", 113, 89, { color: colors.text, size: 17, weight: 600, family: "Arial" });
      drawText(ctx, "QWEN3.8-FLASH-NEXT · LOCAL MEMORY DIAGNOSTIC", 1125, 88, { color: colors.soft, size: 13, align: "right", family: "monospace" });

      drawText(ctx, calc.label, 76, 205, { color: toneColor, size: calc.label.length > 22 ? 60 : 75, family: "Georgia" });
      drawText(ctx, `${ARCHITECTURES[state.architecture]} · ${BACKENDS[state.backend]}`, 80, 247, { color: colors.soft, size: 17, family: "Arial" });

      const facts = [
        ["QUANT", state.quant],
        ["CONTEXT", formatContext(state.context)],
        ["PAYLOAD", calc.payload.toFixed(1) + " GB"],
        ["AVAILABLE", calc.available.toFixed(1) + " GB"]
      ];
      facts.forEach(([label, value], index) => {
        const x = 80 + index * 267;
        drawText(ctx, label, x, 310, { color: colors.soft, size: 12, weight: 600, family: "monospace" });
        drawText(ctx, value, x, 350, { color: colors.text, size: 27, family: "Georgia" });
      });

      const barX = 80;
      const barY = 407;
      const barW = 1040;
      const barH = 62;
      const scale = Math.max(calc.available, calc.recommended, 1) * 1.06;
      ctx.fillStyle = light ? "#e6e2da" : "#252a30";
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = colors.line;
      ctx.strokeRect(barX + .5, barY + .5, barW - 1, barH - 1);
      const widthFor = (value) => Math.max(0, Math.min(barW, value / scale * barW));
      let cursor = barX;
      ctx.fillStyle = colors.model;
      ctx.fillRect(cursor, barY + 12, widthFor(calc.quant.size), barH - 24);
      cursor += widthFor(calc.quant.size);
      if (calc.vision) { ctx.fillStyle = colors.vision; ctx.fillRect(cursor, barY + 12, widthFor(calc.vision), barH - 24); cursor += widthFor(calc.vision); }
      if (calc.mtp) { ctx.fillStyle = colors.mtp; ctx.fillRect(cursor, barY + 12, widthFor(calc.mtp), barH - 24); cursor += widthFor(calc.mtp); }
      ctx.fillStyle = toneColor;
      ctx.globalAlpha = .28;
      ctx.fillRect(cursor, barY + 12, widthFor(calc.recommended - calc.payload), barH - 24);
      ctx.globalAlpha = 1;
      const limitX = barX + widthFor(calc.available);
      ctx.strokeStyle = colors.accent;
      ctx.beginPath(); ctx.moveTo(limitX, barY - 9); ctx.lineTo(limitX, barY + barH + 9); ctx.stroke();
      drawText(ctx, "AVAILABLE", Math.min(limitX - 5, barX + barW), barY - 16, { color: colors.accent, size: 11, align: "right", family: "monospace" });

      const deltaLabel = calc.difference >= 0 ? `${calc.difference.toFixed(1)} GB operating headroom` : `${Math.abs(calc.difference).toFixed(1)} GB operating deficit`;
      drawText(ctx, deltaLabel, 80, 522, { color: toneColor, size: 21, family: "Georgia" });
      drawText(ctx, `Operating target ${calc.recommended.toFixed(1)} GB · ${Math.round(calc.headroomRate * 100)}% disclosed heuristic`, 1120, 522, { color: colors.soft, size: 14, align: "right", family: "monospace" });

      const legends = [
        ["DISTRIBUTION SIZE", colors.good], ["CALCULATED MEMORY", colors.accent], ["HEURISTIC HEADROOM", colors.warn]
      ];
      legends.forEach(([label, color], index) => {
        const x = 80 + index * 220;
        ctx.fillStyle = color; ctx.fillRect(x, 574, 10, 10);
        drawText(ctx, label, x + 18, 584, { color: colors.soft, size: 10, family: "monospace" });
      });
      drawText(ctx, "No generalized tok/s prediction · data verified 02 SEP 2026", 1120, 584, { color: colors.soft, size: 11, align: "right", family: "monospace" });

      canvas.toBlob((blob) => {
        if (!blob) {
          showActionStatus("PNG export failed in this browser.", "error");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `flashfit-${state.quant.toLowerCase().replaceAll("_", "-")}-${formatContext(state.context).toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        showActionStatus("1200 × 675 result card exported.", "success");
      }, "image/png");
    } catch (error) {
      console.error("Flashfit export failed.", error);
      showActionStatus("PNG export failed in this browser.", "error");
    }
  }

  function showActionStatus(message, type) {
    window.clearTimeout(actionTimer);
    elements.actionStatus.textContent = message;
    elements.actionStatus.style.color = type === "error" ? "var(--bad)" : "var(--good)";
    actionTimer = window.setTimeout(() => { elements.actionStatus.textContent = ""; }, 5000);
  }

  function resetToExample() {
    state = { ...DEFAULT_STATE };
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.warn(error); }
    closeQuantMenu();
    syncStateToForm();
    showActionStatus("Example configuration restored.", "success");
  }

  elements.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    markEdited();
    syncStateToForm();
    saveState();
  });

  elements.form.addEventListener("input", (event) => {
    if (event.target.name === "architecture") {
      state.architecture = event.target.value;
      renderArchitecture();
    }
    markEdited();
    updateStateFromForm();
    renderResult();
    saveState();
  });

  elements.form.addEventListener("change", (event) => {
    if (event.target.name === "architecture") state.architecture = event.target.value;
    markEdited();
    updateStateFromForm();
    renderArchitecture();
    renderResult();
    saveState();
  });

  elements.advanced.addEventListener("toggle", () => {
    state.advancedOpen = elements.advanced.open;
    if (document.readyState === "complete") saveState();
  });

  elements.quantSelector.addEventListener("click", () => {
    if (elements.quantMenu.hidden) openQuantMenu(); else closeQuantMenu();
  });

  elements.quantMenu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-quant]");
    if (option) selectQuant(option.dataset.quant);
  });

  elements.quantMenu.addEventListener("keydown", (event) => {
    const options = $$(".quant-option", elements.quantMenu);
    const index = options.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      options[(index + delta + options.length) % options.length].focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (document.activeElement.dataset.quant) selectQuant(document.activeElement.dataset.quant);
    } else if (event.key === "Escape") {
      closeQuantMenu();
      elements.quantSelector.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!elements.quantSelector.contains(event.target) && !elements.quantMenu.contains(event.target)) closeQuantMenu();
  });

  elements.contextPresets.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-context]");
    if (!button) return;
    state.contextMode = button.dataset.context;
    if (button.dataset.context === "custom") {
      state.context = state.customContext;
      elements.customContextWrap.hidden = false;
      window.requestAnimationFrame(() => elements.customContext.focus());
    } else {
      state.context = finiteNumber(button.dataset.context, 32768);
      elements.customContextWrap.hidden = true;
    }
    markEdited();
    $$('button[data-context]', elements.contextPresets).forEach((item) => item.classList.toggle("is-active", item === button));
    renderResult();
    saveState();
  });

  elements.reset.addEventListener("click", resetToExample);
  elements.copyButton.addEventListener("click", copyConfiguration);
  elements.exportButton.addEventListener("click", exportResultCard);

  renderBenchmarks();
  syncStateToForm();
})();
