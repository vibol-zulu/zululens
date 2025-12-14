import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContributor, setIsContributor] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check contributor role after auth state changes
        if (session?.user) {
          setTimeout(() => {
            checkContributorRole(session.user.id);
          }, 0);
        } else {
          setIsContributor(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkContributorRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkContributorRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('has_role', { 
        _user_id: userId, 
        _role: 'contributor' 
      });
      
      if (!error) {
        setIsContributor(data === true);
      }
    } catch (error) {
      console.error('Error checking contributor role:', error);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setIsContributor(false);
    }
    return { error };
  }, []);

  return {
    user,
    session,
    loading,
    isContributor,
    signIn,
    signOut
  };
}
