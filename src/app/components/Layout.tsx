import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { DemoBanner } from "./DemoBanner";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { ConfigError } from "./ConfigError";
import { isSupabaseConfigured } from "../utils/supabase";
import { useAuth } from "../hooks/useAuth";
import { useDemoMode } from "../hooks/useDemoMode";

export function Layout() {
  const location = useLocation();
  const hideFooter = ["/auth"].includes(location.pathname);
  const { user } = useAuth();
  const { demoMode } = useDemoMode();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      {!user && demoMode && <DemoBanner />}
      <ScrollToTop />
      <main className="flex-1">
        {isSupabaseConfigured ? <Outlet /> : <ConfigError />}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
