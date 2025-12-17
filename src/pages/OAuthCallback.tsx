import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";

const OAuthCallback = () => {
  const [status, setStatus] = useState<'loading' | 'redirecting'>('loading');

  useEffect(() => {
    const run = async () => {
      // If opened as a popup, send the callback URL back to the opener
      // so it can exchange the code (the opener has the PKCE code_verifier).
      // IMPORTANT: We do NOT import the Supabase client here to avoid
      // auto-detection consuming the code before we can send it to the opener.
      if (window.opener) {
        try {
          // Use "*" here because the opener may be on a different allowed origin
          // (e.g. custom domain vs lovable.app). The opener will validate origin.
          window.opener.postMessage(
            { type: "oauth-callback", url: window.location.href },
            "*"
          );
        } catch {
          // ignore
        }
        // Give the message a tick to flush before closing the popup.
        setTimeout(() => window.close(), 150);
        return;
      }

      // Non-popup flow: dynamically import Supabase and exchange
      setStatus('redirecting');
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        
        const url = new URL(window.location.href);
        const hasCode = url.searchParams.has("code");
        const hasTokensInHash = Boolean(window.location.hash) &&
          (window.location.hash.includes("access_token") ||
            window.location.hash.includes("refresh_token"));

        if (hasCode) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        } else if (hasTokensInHash) {
          // supabase-js will auto-detect tokens in URL on load; give it a tick
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        // Intentionally silent: we'll fallback to redirect below.
      }

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
          <p className="text-muted-foreground">
            {status === 'loading' ? 'Signing you in…' : 'Redirecting…'}
          </p>
        </section>
      </main>
    </>
  );
};

export default OAuthCallback;
