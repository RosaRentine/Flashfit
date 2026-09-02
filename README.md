# Flashfit

Flashfit is a local, dependency-free Qwen3.8-Flash-Next fit configurator that helps users understand whether a selected quantization and context configuration is practical for their available memory.

## Features

- Evaluates unified-memory, discrete GPU + system RAM, and CPU-only configurations
- Includes current Qwen3.8-Flash-Next GGUF quantization sizes
- Accounts for context-dependent operating headroom and optional Vision/MTP payloads
- Distinguishes full-GPU residency from system-memory offloading
- Presents a clear fit verdict and visual memory budget
- Includes carefully attributed community benchmark references
- Copies configuration summaries and exports shareable result cards
- Supports light and dark themes with local preference persistence

## Use

Clone or download this repository, then open `index.html` directly in a modern browser. No installation or server is required.

## Reading the results

Flashfit does **not** predict exact tokens per second for arbitrary hardware. Performance depends on hardware, backend, kernel implementation, model build, context, workload, offloading, and speculative-decoding behavior.

Values in the application are labeled by evidence type:

- **Measured** — published distribution sizes or results from a specific documented benchmark configuration
- **Calculated** — transparent arithmetic based on the selected payload and available memory
- **Heuristic** — disclosed operating-headroom recommendations used to distinguish “barely fits” from a practical configuration

Community benchmark references are workload- and build-specific. They are shown for context and are never converted into generalized performance predictions.

All configuration data and calculations remain local to the browser.

## Technical constraints

- HTML, CSS, and vanilla JavaScript only
- No framework
- No npm
- No build step
- No backend
- No external runtime dependencies

## Sources and methodology

The interface includes a **Sources & methodology** section linking to the official Qwen repository, current GGUF distribution data, llama.cpp discussions, and the community measurements used by Flashfit. Review those sources before making hardware or deployment decisions, as the local-inference ecosystem changes quickly.

## License

Released under the [MIT License](LICENSE).

Created by **Rosarium & Florentine**.
