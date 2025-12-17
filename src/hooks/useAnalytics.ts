import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const SESSION_KEY = 'zulu_session_id';
const VISITOR_KEY = 'zulu_visitor_id';

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export interface AnalyticsEvent {
  event_type: 'page_view' | 'channel_select' | 'view_mode_change' | 'year_toggle' | 'country_change' | 'channel_deselect' | 'sidebar_open' | 'modal_open';
  event_data?: Json;
}

export const useAnalytics = (userId?: string) => {
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const pageViewsRef = useRef(0);
  const interactionsRef = useRef(0);

  // Get or create session ID
  const getSessionId = useCallback(() => {
    if (sessionIdRef.current) return sessionIdRef.current;
    
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    sessionIdRef.current = sessionId;
    return sessionId;
  }, []);

  // Get visitor ID (for Tier 1 users)
  const getVisitorId = useCallback(() => {
    return localStorage.getItem(VISITOR_KEY);
  }, []);

  // Set visitor ID after signup gate
  const setVisitorId = useCallback((id: string) => {
    localStorage.setItem(VISITOR_KEY, id);
  }, []);

  // Create or update session
  const initSession = useCallback(async (country: string = 'United States') => {
    const sessionId = getSessionId();
    const visitorId = getVisitorId();

    try {
      // Try to upsert session
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          session_id: sessionId,
          visitor_id: visitorId || null,
          user_id: userId || null,
          country,
          started_at: new Date().toISOString(),
          page_views: 0,
          interactions: 0
        }, { onConflict: 'session_id' });

      if (error) {
        console.error('Error creating session:', error);
      }
    } catch (err) {
      console.error('Session init error:', err);
    }
  }, [getSessionId, getVisitorId, userId]);

  // Track event
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    const sessionId = getSessionId();
    const visitorId = getVisitorId();

    if (event.event_type === 'page_view') {
      pageViewsRef.current++;
    } else {
      interactionsRef.current++;
    }

    try {
      await supabase.from('user_analytics').insert([{
        session_id: sessionId,
        visitor_id: visitorId || null,
        user_id: userId || null,
        event_type: event.event_type,
        event_data: event.event_data || {}
      }]);
    } catch (err) {
      console.error('Event tracking error:', err);
    }
  }, [getSessionId, getVisitorId, userId]);

  // Update session on unmount or periodically
  const updateSession = useCallback(async () => {
    const sessionId = getSessionId();
    const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);

    try {
      await supabase
        .from('user_sessions')
        .update({
          duration_seconds: durationSeconds,
          page_views: pageViewsRef.current,
          interactions: interactionsRef.current,
          ended_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    } catch (err) {
      console.error('Session update error:', err);
    }
  }, [getSessionId]);

  // Track page view on mount and update session on unmount
  useEffect(() => {
    // Update session every 30 seconds
    const interval = setInterval(updateSession, 30000);

    // Update session on page unload
    const handleUnload = () => {
      updateSession();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      updateSession();
    };
  }, [updateSession]);

  return {
    trackEvent,
    initSession,
    setVisitorId,
    getVisitorId,
    getSessionId
  };
};

// Helper to register Tier 1 visitor using SECURITY DEFINER function
export const registerTier1Visitor = async (name: string, email: string, country: string = 'United States'): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .rpc('register_tier1_visitor', {
        _name: name,
        _email: email,
        _country: country
      });

    if (error) {
      console.error('Error registering visitor:', error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error('Visitor registration error:', err);
    return null;
  }
};
