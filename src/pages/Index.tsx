import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SignUpGate from '@/components/SignUpGate';
import MediaDashboard from '@/components/MediaDashboard';
import { INITIAL_DATA, STORAGE_KEY } from '@/data/mediaData';
import { YearData } from '@/types/media';
import { Helmet } from 'react-helmet';

const Index = () => {
  const [searchParams] = useSearchParams();
  const skipGate = searchParams.get('skip') === '1';
  
  const [view, setView] = useState<'gate' | 'dashboard'>(skipGate ? 'dashboard' : 'gate');
  const [visitor, setVisitor] = useState<{name: string, email: string} | null>(null);
  
  useEffect(() => {
    if (skipGate) {
      setView('dashboard');
    }
  }, [skipGate]);
  
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
  };

  if (view === 'gate') {
    return (
      <>
        <Helmet>
          <title>Zulu Digital Microscope | US Media Landscape 2000-2025</title>
          <meta name="description" content="Explore how the US media landscape has transformed from 2000 to 2025. Visualize corporate vs independent media audiences interactively." />
        </Helmet>
        <SignUpGate onJoin={handleJoin} />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Media Dashboard | Zulu Digital Microscope</title>
        <meta name="description" content="Interactive visualization of US media landscape comparing corporate and independent media outlets from 2000 to 2025." />
      </Helmet>
      <MediaDashboard 
        visitorName={visitor?.name || 'Guest'} 
        visitorEmail={visitor?.email || ''}
        data={data} 
      />
    </>
  );
};

export default Index;
