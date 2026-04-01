import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { ConfigError } from "./ConfigError";
import { isSupabaseConfigured } from "../utils/supabase";

export function Layout() {
  const location = useLocation();
  const hideFooter = ["/auth"].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1">
        {isSupabaseConfigured ? <Outlet /> : <ConfigError />}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
