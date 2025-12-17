import React, { useState, useEffect } from 'react';
import SignUpGate from '@/components/SignUpGate';
import MediaDashboard from '@/components/MediaDashboard';
import WelcomeModal from '@/components/WelcomeModal';
import { INITIAL_DATA, STORAGE_KEY } from '@/data/mediaData';
import { YearData } from '@/types/media';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'gate' | 'dashboard'>('gate');
  const [visitor, setVisitor] = useState<{name: string, email: string} | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);

  // Receive OAuth callback URL from popup and exchange it in this window (iframe-safe)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as any;
      if (payload?.type !== 'oauth-callback' || typeof payload.url !== 'string') return;

      setIsOAuthCallback(true);
      supabase.auth.exchangeCodeForSession(payload.url)
        .then(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No session after exchange');
          }
          window.location.reload();
        })
        .catch((e) => {
          console.error('OAuth exchange failed in main window:', e);
          setIsOAuthCallback(false);
        });
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Legacy OAuth callback handling (when provider redirects to "/" instead of "/oauth/callback")
  useEffect(() => {
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.has('code');
    const hash = window.location.hash;
    const hasTokensInHash = Boolean(hash) && (hash.includes('access_token') || hash.includes('refresh_token'));
    const isPopup = window.opener !== null;

    if (!hasCode && !hasTokensInHash) return;

    setIsOAuthCallback(true);

    const finish = () => {
      if (isPopup) {
        try {
          window.opener.postMessage(
            { type: 'oauth-callback', url: window.location.href },
            window.location.origin
          );
        } catch {
          // ignore
        }
        window.close();
        return;
      }
      window.history.replaceState(null, '', window.location.pathname);
      setIsOAuthCallback(false);
    };

    (async () => {
      try {
        // Only exchange in non-popup context; in popup we send URL to opener.
        if (hasCode && !isPopup) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }
      } catch {
        // ignore
      } finally {
        setTimeout(finish, 250);
      }
    })();
  }, []);

  // Bypass gate for authenticated users
  useEffect(() => {
    if (!loading && user) {
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const userEmail = user.email || '';
      setVisitor({ name: userName, email: userEmail });
      setView('dashboard');
    }
  }, [user, loading]);
  
  const [data] = useState<Record<number, YearData>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_DATA;
    } catch (e) {
      console.error("Failed to load data", e);
      return INITIAL_DATA;
    }
  });

  const handleJoin = (name: string, email: string) => {
    setVisitor({ name, email });
    setView('dashboard');
    setShowWelcome(true);
  };

  // Show loading while checking auth or processing OAuth callback
  if (loading || isOAuthCallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Authenticated users go straight to dashboard
  if (user) {
    const userName = visitor?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const userEmail = visitor?.email || user.email || '';
    
    return (
      <>
        <Helmet>
          <title>Zulu Digital Microscope</title>
          <meta name="description" content="Interactive visualization of US media landscape comparing corporate and independent media outlets from 2000 to 2025." />
        </Helmet>
        <MediaDashboard 
          visitorName={userName} 
          visitorEmail={userEmail}
          data={data} 
        />
        <WelcomeModal 
          open={showWelcome} 
          onOpenChange={setShowWelcome} 
          userName={userName} 
        />
      </>
    );
  }

  // Tier 1 visitors who completed sign-up gate
  if (view === 'dashboard' && visitor) {
    return (
      <>
        <Helmet>
          <title>Zulu Digital Microscope</title>
          <meta name="description" content="Interactive visualization of US media landscape comparing corporate and independent media outlets from 2000 to 2025." />
        </Helmet>
        <MediaDashboard 
          visitorName={visitor.name} 
          visitorEmail={visitor.email}
          data={data} 
        />
        <WelcomeModal 
          open={showWelcome} 
          onOpenChange={setShowWelcome} 
          userName={visitor.name} 
        />
      </>
    );
  }

  // Show sign-up gate for unauthenticated visitors
  return (
    <>
      <Helmet>
        <title>Zulu Digital Microscope | US Media Landscape 2000-2025</title>
        <meta name="description" content="Explore how the US media landscape has transformed from 2000 to 2025. Visualize corporate vs independent media audiences interactively." />
      </Helmet>
      <SignUpGate onJoin={handleJoin} />
    </>
  );
};

export default Index;
