import { useCallback, useEffect, useState } from "react";
import { getDemoModeChangeEventName, isDemoMode, setDemoMode } from "../utils/demoMode";

export function useDemoMode() {
  const [demoMode, setDemoModeState] = useState(false);

  useEffect(() => {
    const sync = () => setDemoModeState(isDemoMode());
    sync();

    // Same-tab changes (we dispatch a custom event).
    const eventName = getDemoModeChangeEventName();
    window.addEventListener(eventName, sync);

    // Cross-tab changes.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "skillseed_demo_mode") sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const enable = useCallback(() => {
    setDemoMode(true);
    setDemoModeState(true);
  }, []);

  const disable = useCallback(() => {
    setDemoMode(false);
    setDemoModeState(false);
  }, []);

  return { demoMode, enableDemoMode: enable, disableDemoMode: disable };
}

