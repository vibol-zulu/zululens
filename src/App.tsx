import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAppSettings } from "@/hooks/useAppSettings";
import Index from "./pages/Index";
import OAuthCallback from "./pages/OAuthCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Discovery from "./pages/Discovery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to apply design style based on settings
const DesignStyleProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings, loading } = useAppSettings();

  useEffect(() => {
    if (!loading) {
      if (settings.useUtilitarianStyle) {
        document.documentElement.classList.remove('classic-style');
        document.documentElement.classList.add('utilitarian-style');
      } else {
        document.documentElement.classList.remove('utilitarian-style');
        document.documentElement.classList.add('classic-style');
      }
    }
  }, [settings.useUtilitarianStyle, loading]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <DesignStyleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/discovery" element={<Discovery />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DesignStyleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
