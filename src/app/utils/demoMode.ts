const KEY = "skillseed_demo_mode";
const EVENT = "skillseed-demo-mode-change";

export function isDemoMode(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemoMode(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
    // Let all components in this tab update immediately.
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore
  }
}

export function getDemoModeChangeEventName() {
  return EVENT;
}

