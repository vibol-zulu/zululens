import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";

const OAuthCallback = () => {
  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.has("code");
      const hasTokensInHash = Boolean(window.location.hash) &&
        (window.location.hash.includes("access_token") ||
          window.location.hash.includes("refresh_token"));

      try {
        if (hasCode) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        } else if (hasTokensInHash) {
          // supabase-js will auto-detect tokens in URL on load; give it a tick
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        // Intentionally silent: we’ll fallback to redirect below.
      }

      // If opened as a popup from the app, notify parent and close.
      if (window.opener) {
        try {
          window.opener.postMessage("oauth-success", window.location.origin);
        } catch {
          // ignore
        }
        window.close();
        return;
      }

      // Non-popup fallback
      window.location.replace("/");
    };

    run();
  }, []);

  return (
    <>
      <Helmet>
        <title>Signing you in… | Zulu Digital Microscope</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${window.location.origin}/oauth/callback`} />
      </Helmet>
      <main className="min-h-screen flex items-center justify-center bg-background">
        <section className="text-center">
          <h1 className="sr-only">OAuth Sign-in Callback</h1>
          <p className="text-muted-foreground">Signing you in…</p>
        </section>
      </main>
    </>
  );
};

export default OAuthCallback;
