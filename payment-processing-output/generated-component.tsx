// Generated component scaffold for avery-pay-platform
// Framework: Svelte

export interface averypayplatformConfig {
  title: string;
  container: HTMLElement;
}

export function createaverypayplatform(config: averypayplatformConfig) {
  const el = document.createElement("div");
  el.className = "averypayplatform-container";
  el.innerHTML = `<h2>${config.title}</h2><div class="averypayplatform-content"></div>`;
  config.container.appendChild(el);
  return el;
}