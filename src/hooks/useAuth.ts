import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContributor, setIsContributor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check roles after auth state changes
        if (session?.user) {
          setTimeout(() => {
            checkRoles(session.user.id);
          }, 0);
        } else {
          setIsContributor(false);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRoles = async (userId: string) => {
    try {
      // Check contributor role
      const { data: isContrib, error: contribError } = await supabase.rpc('has_role', { 
        _user_id: userId, 
        _role: 'contributor' 
      });
      
      if (!contribError) {
        setIsContributor(isContrib === true);
      }

      // Check admin role
      const { data: isAdm, error: adminError } = await supabase.rpc('has_role', { 
        _user_id: userId, 
        _role: 'admin' 
      });
      
      if (!adminError) {
        setIsAdmin(isAdm === true);
        // Admins are also contributors
        if (isAdm === true) {
          setIsContributor(true);
        }
      }
    } catch (error) {
      console.error('Error checking roles:', error);
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
      setIsAdmin(false);
    }
    return { error };
  }, []);

  return {
    user,
    session,
    loading,
    isContributor,
    isAdmin,
    signIn,
    signOut
  };
}
