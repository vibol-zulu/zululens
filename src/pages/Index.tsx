import React, { useState, useEffect } from 'react';
import SignUpGate from '@/components/SignUpGate';
import MediaDashboard from '@/components/MediaDashboard';
import WelcomeModal from '@/components/WelcomeModal';
import { INITIAL_DATA, STORAGE_KEY } from '@/data/mediaData';
import { YearData } from '@/types/media';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'gate' | 'dashboard'>('gate');
  const [visitor, setVisitor] = useState<{name: string, email: string} | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

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

  // Show loading while checking auth
  if (loading) {
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
          <title>Media Dashboard | Zulu Digital Microscope</title>
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
          <title>Media Dashboard | Zulu Digital Microscope</title>
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
