import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Comment {
  id: string;
  user_id: string;
  country: string;
  content: string;
  parent_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  replies?: Comment[];
}

export function useComments(country: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!user) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('country', country)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user display names using secure function (no email exposure)
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .rpc('get_profiles_by_ids', { _user_ids: userIds });

      const profileMap = new Map(profiles?.map((p: { id: string; full_name: string }) => [p.id, p]) || []);

      // Build comment tree with user info (names only, no emails)
      const commentsWithUsers = (data || []).map(comment => ({
        ...comment,
        user_name: profileMap.get(comment.user_id)?.full_name || 'Anonymous'
      }));

      // Organize into tree structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      commentsWithUsers.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      commentsWithUsers.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [country, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `country=eq.${country}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [country, user, fetchComments]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        country,
        content: content.trim(),
        parent_id: parentId || null
      });

    if (!error) {
      await fetchComments();
    }

    return { error };
  };

  const updateComment = async (id: string, content: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('comments')
      .update({ content: content.trim(), is_edited: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await fetchComments();
    }

    return { error };
  };

  const deleteComment = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchComments();
    }

    return { error };
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    refetch: fetchComments
  };
}
