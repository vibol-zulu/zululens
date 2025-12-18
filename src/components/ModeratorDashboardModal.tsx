import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES } from '@/data/mediaData';
import { sendSubmissionEmail } from '@/lib/sendSubmissionEmail';
import { 
  Check,
  XCircle, 
  Clock, 
  Loader2,
  Newspaper,
  MessageSquare,
  Search,
  Database,
  FileText,
  Trash2,
  Flag,
  Pencil,
  ChevronDown,
  Bell,
  RefreshCw
} from 'lucide-react';
import perplexityLogo from '@/assets/perplexity-color.svg';
import NotificationsTab from '@/components/NotificationsTab';

interface ChannelEntry {
  id: string;
  name: string;
  category: string;
  value_millions: number;
  country: string;
  year: number;
  status: string;
  created_at: string;
  author_id: string | null;
  author_name?: string;
  author_email?: string;
  platform?: string;
  content_type?: string;
  political_lean?: string;
  start_date?: string;
}

interface CommentEntry {
  id: string;
  content: string;
  country: string;
  created_at: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  parent_id: string | null;
}

interface NewsEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

interface ModeratorDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

const ModeratorDashboardModal: React.FC<ModeratorDashboardModalProps> = ({
  open,
  onOpenChange,
  userName
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('suggestions');
  
  // Search states
  const [pendingSearch, setPendingSearch] = useState('');
  const [myChannelsSearch, setMyChannelsSearch] = useState('');
  const [allChannelsSearch, setAllChannelsSearch] = useState('');
  const [commentsSearch, setCommentsSearch] = useState('');
  const [newsSearch, setNewsSearch] = useState('');
  
  // Pending suggestions state
  const [pendingChannels, setPendingChannels] = useState<ChannelEntry[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [channelToReview, setChannelToReview] = useState<ChannelEntry | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  // AI Estimation state
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<{
    inputValidation?: {
      categoryCorrect: boolean;
      suggestedCategory: string | null;
      platformCorrect: boolean;
      contentTypeCorrect: boolean;
      validationNotes: string;
    } | null;
    politicalLean?: string | null;
    politicalLeanJustification?: string | null;
    crossPlatformAudience: number;
    deduplicatedAudience: number;
    reasoning: string;
    comparableChannels: string[];
    suggestedStartDate: string;
  } | null>(null);

  // Comparable channel analysis state
  const [showComparableModal, setShowComparableModal] = useState(false);
  const [comparableChannelName, setComparableChannelName] = useState('');
  const [comparableEstimating, setComparableEstimating] = useState(false);
  const [comparableEstimation, setComparableEstimation] = useState<{
    inputValidation?: {
      categoryCorrect: boolean;
      suggestedCategory: string | null;
      platformCorrect: boolean;
      contentTypeCorrect: boolean;
      validationNotes: string;
    } | null;
    politicalLean?: string | null;
    politicalLeanJustification?: string | null;
    crossPlatformAudience: number;
    deduplicatedAudience: number;
    reasoning: string;
    comparableChannels: string[];
    suggestedStartDate: string;
  } | null>(null);

  // My suggestions state
  const [myChannels, setMyChannels] = useState<ChannelEntry[]>([]);
  const [myChannelsLoading, setMyChannelsLoading] = useState(false);
  const [editingMyChannel, setEditingMyChannel] = useState<ChannelEntry | null>(null);
  const [showEditMyChannelDialog, setShowEditMyChannelDialog] = useState(false);
  const [myChannelFormData, setMyChannelFormData] = useState({
    name: '',
    value_millions: 0,
    category: '',
    platform: '',
    content_type: '',
    political_lean: '',
    start_date: ''
  });
  const [myChannelToDelete, setMyChannelToDelete] = useState<ChannelEntry | null>(null);
  const [showDeleteMyChannelDialog, setShowDeleteMyChannelDialog] = useState(false);

  // All channels state
  const [allChannels, setAllChannels] = useState<ChannelEntry[]>([]);
  const [allChannelsLoading, setAllChannelsLoading] = useState(false);
  const [allChannelsCountry, setAllChannelsCountry] = useState('all');

  // Comments state
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCountry, setCommentsCountry] = useState('all');
  const [commentToDelete, setCommentToDelete] = useState<CommentEntry | null>(null);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);

  // News state
  const [news, setNews] = useState<NewsEntry[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsEntry | null>(null);
  const [showEditNewsDialog, setShowEditNewsDialog] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<NewsEntry | null>(null);
  const [showDeleteNewsDialog, setShowDeleteNewsDialog] = useState(false);
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    category: 'update',
    is_published: true
  });

  // Flag state
  const [flagItem, setFlagItem] = useState<{ type: 'channel' | 'comment' | 'news'; id: string; name: string } | null>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    myTotal: 0,
    myApproved: 0
  });

  // Selection state for bulk actions
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [selectedNews, setSelectedNews] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectPending = (id: string) => {
    setSelectedPending(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPending = () => {
    if (selectedPending.size === pendingChannels.length) {
      setSelectedPending(new Set());
    } else {
      setSelectedPending(new Set(pendingChannels.map(c => c.id)));
    }
  };

  const toggleSelectComment = (id: string) => {
    setSelectedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllComments = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map(c => c.id)));
    }
  };

  const toggleSelectNews = (id: string) => {
    setSelectedNews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllNews = () => {
    if (selectedNews.size === news.length) {
      setSelectedNews(new Set());
    } else {
      setSelectedNews(new Set(news.map(n => n.id)));
    }
  };

  const handleBulkApprovePending = async () => {
    if (selectedPending.size === 0 || !user) return;
    setBulkActionLoading(true);
    try {
      const channelsToApprove = pendingChannels.filter(c => selectedPending.has(c.id));
      
      const { error } = await supabase
        .from('user_channels')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedPending));

      if (error) throw error;

      // Submission review notifications are sent automatically by the backend trigger.
      // Send email notifications
      channelsToApprove.filter(c => c.author_id).forEach(c => {
        sendSubmissionEmail({
          userId: c.author_id!,
          channelName: c.name,
          status: 'approved',
          country: c.country
        });
      });

      toast({ title: `${selectedPending.size} channels approved` });
      setSelectedPending(new Set());
      fetchPendingChannels();
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast({ title: 'Failed to approve channels', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRejectPending = async () => {
    if (selectedPending.size === 0 || !user) return;
    setBulkActionLoading(true);
    try {
      const channelsToReject = pendingChannels.filter(c => selectedPending.has(c.id));
      
      const { error } = await supabase
        .from('user_channels')
        .update({
          status: 'rejected'
        })
        .in('id', Array.from(selectedPending));

      if (error) throw error;

      // Submission review notifications are sent automatically by the backend trigger.
      // Send email notifications
      channelsToReject.filter(c => c.author_id).forEach(c => {
        sendSubmissionEmail({
          userId: c.author_id!,
          channelName: c.name,
          status: 'rejected',
          country: c.country
        });
      });

      toast({ title: `${selectedPending.size} channels rejected` });
      setSelectedPending(new Set());
      fetchPendingChannels();
    } catch (error) {
      console.error('Bulk reject error:', error);
      toast({ title: 'Failed to reject channels', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteComments = async () => {
    if (selectedComments.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .in('id', Array.from(selectedComments));

      if (error) throw error;

      toast({ title: `${selectedComments.size} comments deleted` });
      setSelectedComments(new Set());
      fetchComments();
    } catch (error) {
      console.error('Bulk delete comments error:', error);
      toast({ title: 'Failed to delete comments', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteNews = async () => {
    if (selectedNews.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('news_updates')
        .delete()
        .in('id', Array.from(selectedNews));

      if (error) throw error;

      toast({ title: `${selectedNews.size} news items deleted` });
      setSelectedNews(new Set());
      fetchNews();
    } catch (error) {
      console.error('Bulk delete news error:', error);
      toast({ title: 'Failed to delete news', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const fetchPendingChannels = useCallback(async () => {
    if (!user) return;
    setSuggestionsLoading(true);
    try {
      let query = supabase
        .from('user_channels')
        .select('*')
        .eq('status', 'pending')
        .neq('author_id', user.id)
        .order('created_at', { ascending: false });
      
      if (selectedCountry !== 'all') {
        query = query.eq('country', selectedCountry);
      }

      const { data, error } = await query;
      if (error) throw error;

      const authorIds = [...new Set((data || []).map(c => c.author_id).filter(Boolean))];
      let profiles: { id: string; email: string; full_name: string | null }[] = [];
      
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', authorIds);
        profiles = profilesData || [];
      }

      const channelsWithAuthors: ChannelEntry[] = (data || []).map(channel => {
        const profile = profiles.find(p => p.id === channel.author_id);
        return {
          ...channel,
          author_name: profile?.full_name || undefined,
          author_email: profile?.email || undefined
        };
      });

      setPendingChannels(channelsWithAuthors);
      setStats(prev => ({ ...prev, pending: channelsWithAuthors.length }));
    } catch (error) {
      console.error('Error fetching pending channels:', error);
      toast({ title: 'Failed to load suggestions', variant: 'destructive' });
    } finally {
      setSuggestionsLoading(false);
    }
  }, [selectedCountry, toast, user]);

  const fetchMyChannels = useCallback(async () => {
    if (!user) return;
    setMyChannelsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_channels')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMyChannels(data || []);
      const approved = (data || []).filter(c => c.status === 'approved').length;
      setStats(prev => ({ ...prev, myTotal: data?.length || 0, myApproved: approved }));
    } catch (error) {
      console.error('Error fetching my channels:', error);
      toast({ title: 'Failed to load your suggestions', variant: 'destructive' });
    } finally {
      setMyChannelsLoading(false);
    }
  }, [user, toast]);

  const fetchAllChannels = useCallback(async () => {
    setAllChannelsLoading(true);
    try {
      let query = supabase
        .from('user_channels')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (allChannelsCountry !== 'all') {
        query = query.eq('country', allChannelsCountry);
      }

      const { data, error } = await query;
      if (error) throw error;

      const authorIds = [...new Set((data || []).map(c => c.author_id).filter(Boolean))];
      let profiles: { id: string; email: string; full_name: string | null }[] = [];
      
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', authorIds);
        profiles = profilesData || [];
      }

      const channelsWithAuthors: ChannelEntry[] = (data || []).map(channel => {
        const profile = profiles.find(p => p.id === channel.author_id);
        return {
          ...channel,
          author_name: profile?.full_name || undefined,
          author_email: profile?.email || undefined
        };
      });

      setAllChannels(channelsWithAuthors);
    } catch (error) {
      console.error('Error fetching all channels:', error);
      toast({ title: 'Failed to load channels', variant: 'destructive' });
    } finally {
      setAllChannelsLoading(false);
    }
  }, [allChannelsCountry, toast]);

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      let query = supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (commentsCountry !== 'all') {
        query = query.eq('country', commentsCountry);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      let profiles: { id: string; email: string; full_name: string | null }[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      const commentsWithUsers: CommentEntry[] = (data || []).map(comment => {
        const profile = profiles.find(p => p.id === comment.user_id);
        return {
          ...comment,
          user_name: profile?.full_name || undefined,
          user_email: profile?.email || undefined
        };
      });

      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({ title: 'Failed to load comments', variant: 'destructive' });
    } finally {
      setCommentsLoading(false);
    }
  }, [commentsCountry, toast]);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({ title: 'Failed to load news', variant: 'destructive' });
    } finally {
      setNewsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      if (activeTab === 'suggestions') fetchPendingChannels();
      else if (activeTab === 'my-suggestions') fetchMyChannels();
      else if (activeTab === 'all-channels') fetchAllChannels();
      else if (activeTab === 'comments') fetchComments();
      else if (activeTab === 'news') fetchNews();
    }
  }, [open, activeTab, fetchPendingChannels, fetchMyChannels, fetchAllChannels, fetchComments, fetchNews]);

  useEffect(() => {
    if (open && activeTab === 'suggestions') fetchPendingChannels();
  }, [selectedCountry]);

  useEffect(() => {
    if (open && activeTab === 'all-channels') fetchAllChannels();
  }, [allChannelsCountry]);

  useEffect(() => {
    if (open && activeTab === 'comments') fetchComments();
  }, [commentsCountry]);

  const handleReviewChannel = (channel: ChannelEntry, action: 'approve' | 'reject') => {
    setChannelToReview(channel);
    setReviewAction(action);
    setShowReviewDialog(true);
  };

  const confirmReview = async () => {
    if (!channelToReview || !reviewAction || !user) return;

    try {
      const newStatus = reviewAction === 'approve' ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('user_channels')
        .update({
          status: newStatus,
          approved_by: reviewAction === 'approve' ? user.id : null,
          approved_at: reviewAction === 'approve' ? new Date().toISOString() : null
        })
        .eq('id', channelToReview.id);

      if (error) throw error;

      if (channelToReview.author_id) {
        // Submission review notification is sent automatically by the backend trigger.
        
        // Send email notification
        sendSubmissionEmail({
          userId: channelToReview.author_id,
          channelName: channelToReview.name,
          status: reviewAction === 'approve' ? 'approved' : 'rejected',
          country: channelToReview.country
        });
      }

      toast({ 
        title: `Channel ${reviewAction === 'approve' ? 'approved' : 'rejected'}`,
        description: `"${channelToReview.name}" has been ${newStatus}`
      });
      
      setShowReviewDialog(false);
      setChannelToReview(null);
      setReviewAction(null);
      fetchPendingChannels();
    } catch (error) {
      console.error('Error updating channel:', error);
      toast({ title: 'Failed to update channel', variant: 'destructive' });
    }
  };

  // AI Audience Estimation function
  const estimateAudience = async (channel: ChannelEntry) => {
    setIsEstimating(true);
    setEstimationResult(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          channel: {
            name: channel.name,
            platform: channel.platform || 'Unknown',
            contentType: channel.content_type || 'Unknown',
            politicalLean: channel.political_lean || 'Unknown',
            category: channel.category,
            country: channel.country
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to estimate audience');
      }

      const data = await response.json();
      
      if (data.success && data.estimate) {
        setEstimationResult(data.estimate);
        toast({ title: 'Audience estimate generated' });
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error estimating audience:', error);
      toast({ 
        title: 'Failed to estimate audience', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setIsEstimating(false);
    }
  };

  // Apply estimation to channel
  const applyEstimation = async () => {
    if (!channelToReview || !estimationResult) return;
    
    try {
      const updateData: Record<string, unknown> = { 
        value_millions: estimationResult.deduplicatedAudience,
        start_date: estimationResult.suggestedStartDate || 'TBD',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      };
      
      // Include political lean if determined by AI
      if (estimationResult.politicalLean) {
        updateData.political_lean = estimationResult.politicalLean;
      }
      
      // Apply category correction if AI suggested one
      if (estimationResult.inputValidation && !estimationResult.inputValidation.categoryCorrect && estimationResult.inputValidation.suggestedCategory) {
        updateData.category = estimationResult.inputValidation.suggestedCategory;
      }
      
      const { error } = await supabase
        .from('user_channels')
        .update(updateData)
        .eq('id', channelToReview.id);

      if (error) throw error;

      // Send notification to author
      if (channelToReview.author_id) {
        await supabase.from('notifications').insert({
          title: 'Submission Approved!',
          message: `Your channel suggestion "${channelToReview.name}" has been approved and is now live.`,
          type: 'submission_review',
          target_user_id: channelToReview.author_id,
          target_role: 'member',
          channel_id: channelToReview.id,
          created_by: user?.id
        });
        
        // Send email notification with AI analysis data
        sendSubmissionEmail({
          userId: channelToReview.author_id,
          channelName: channelToReview.name,
          status: 'approved',
          country: channelToReview.country,
          aiAnalysis: {
            estimatedAudience: estimationResult.deduplicatedAudience,
            politicalLean: estimationResult.politicalLean,
            category: estimationResult.inputValidation?.suggestedCategory || channelToReview.category,
            comparableChannels: estimationResult.comparableChannels
          }
        });
      }

      toast({ title: 'Estimation applied and submission approved' });
      setShowReviewDialog(false);
      setChannelToReview(null);
      setEstimationResult(null);
      fetchPendingChannels();
    } catch (error) {
      console.error('Error applying estimation:', error);
      toast({ title: 'Failed to apply estimation', variant: 'destructive' });
    }
  };

  // Analyze a comparable channel
  const analyzeComparableChannel = async (channelName: string) => {
    setComparableChannelName(channelName);
    setShowComparableModal(true);
    setComparableEstimating(true);
    setComparableEstimation(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          channel: {
            name: channelName,
            platform: 'Unknown',
            contentType: 'Unknown',
            politicalLean: 'Unknown',
            category: 'independent',
            country: channelToReview?.country || 'United States'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to estimate audience');
      }

      const data = await response.json();
      
      if (data.success && data.estimate) {
        setComparableEstimation(data.estimate);
        toast({ title: 'Comparable channel analysis complete' });
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error analyzing comparable channel:', error);
      toast({ 
        title: 'Failed to analyze channel', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setComparableEstimating(false);
    }
  };

  // Add comparable channel to database as approved
  const addComparableAsChannel = async () => {
    if (!comparableEstimation || !comparableChannelName) return;
    
    try {
      const { error } = await supabase
        .from('user_channels')
        .insert({
          name: comparableChannelName,
          category: comparableEstimation.inputValidation?.suggestedCategory || 'independent',
          value_millions: comparableEstimation.deduplicatedAudience,
          platform: 'Unknown',
          content_type: 'Unknown',
          political_lean: comparableEstimation.politicalLean || 'Non-partisan',
          country: channelToReview?.country || 'United States',
          year: 2025,
          start_date: comparableEstimation.suggestedStartDate || 'TBD',
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          author_id: user?.id
        });

      if (error) throw error;

      toast({ title: `${comparableChannelName} added as approved channel` });
      setShowComparableModal(false);
      setComparableChannelName('');
      setComparableEstimation(null);
    } catch (error) {
      console.error('Error adding comparable channel:', error);
      toast({ title: 'Failed to add channel', variant: 'destructive' });
    }
  };

  const handleDeleteComment = (comment: CommentEntry) => {
    setCommentToDelete(comment);
    setShowDeleteCommentDialog(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentToDelete.id);

      if (error) throw error;

      toast({ title: 'Comment deleted' });
      setShowDeleteCommentDialog(false);
      setCommentToDelete(null);
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  const handleFlagItem = (type: 'channel' | 'comment' | 'news', id: string, name: string) => {
    setFlagItem({ type, id, name });
    setFlagReason('');
    setShowFlagDialog(true);
  };

  const confirmFlagItem = async () => {
    if (!flagItem || !user || !flagReason.trim()) return;
    
    setFlagging(true);
    try {
      const typeLabels = {
        channel: 'Channel',
        comment: 'Comment', 
        news: 'News Update'
      };

      const { error } = await supabase
        .from('notifications')
        .insert({
          type: `${flagItem.type}_flag`,
          title: `${typeLabels[flagItem.type]} Flagged: ${flagItem.name}`,
          message: flagReason.trim(),
          channel_id: flagItem.type === 'channel' ? flagItem.id : null,
          created_by: user.id,
          target_role: 'admin'
        });

      if (error) throw error;

      toast({ 
        title: `${typeLabels[flagItem.type]} flagged`,
        description: 'An admin has been notified.'
      });
      setShowFlagDialog(false);
      setFlagItem(null);
      setFlagReason('');
    } catch (error) {
      console.error('Error flagging item:', error);
      toast({ title: 'Failed to flag item', variant: 'destructive' });
    } finally {
      setFlagging(false);
    }
  };

  // News edit/delete handlers
  const handleEditNews = (item: NewsEntry) => {
    setEditingNews(item);
    setNewsFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      is_published: item.is_published
    });
    setShowEditNewsDialog(true);
  };

  const saveNewsEdit = async () => {
    if (!editingNews || !newsFormData.title || !newsFormData.content) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('news_updates')
        .update({
          title: newsFormData.title,
          content: newsFormData.content,
          category: newsFormData.category,
          is_published: newsFormData.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNews.id);

      if (error) throw error;

      toast({ title: 'News updated successfully' });
      setShowEditNewsDialog(false);
      setEditingNews(null);
      fetchNews();
    } catch (error) {
      console.error('Error updating news:', error);
      toast({ title: 'Failed to update news', variant: 'destructive' });
    }
  };

  const handleDeleteNews = (item: NewsEntry) => {
    setNewsToDelete(item);
    setShowDeleteNewsDialog(true);
  };

  const confirmDeleteNews = async () => {
    if (!newsToDelete) return;

    try {
      const { error } = await supabase
        .from('news_updates')
        .delete()
        .eq('id', newsToDelete.id);

      if (error) throw error;

      toast({ title: 'News deleted' });
      setShowDeleteNewsDialog(false);
      setNewsToDelete(null);
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast({ title: 'Failed to delete news', variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Edit/Delete my channel handlers
  const handleEditMyChannel = (channel: ChannelEntry) => {
    setEditingMyChannel(channel);
    setMyChannelFormData({
      name: channel.name,
      value_millions: channel.value_millions,
      category: channel.category,
      platform: channel.platform || '',
      content_type: channel.content_type || '',
      political_lean: channel.political_lean || '',
      start_date: channel.start_date || ''
    });
    setShowEditMyChannelDialog(true);
  };

  const saveMyChannelEdit = async () => {
    if (!editingMyChannel || !myChannelFormData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_channels')
        .update({
          name: myChannelFormData.name,
          value_millions: myChannelFormData.value_millions,
          category: myChannelFormData.category,
          platform: myChannelFormData.platform,
          content_type: myChannelFormData.content_type,
          political_lean: myChannelFormData.political_lean,
          start_date: myChannelFormData.start_date
        })
        .eq('id', editingMyChannel.id);

      if (error) throw error;

      toast({ title: 'Submission updated' });
      setShowEditMyChannelDialog(false);
      setEditingMyChannel(null);
      fetchMyChannels();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({ title: 'Failed to update submission', variant: 'destructive' });
    }
  };

  const handleDeleteMyChannel = (channel: ChannelEntry) => {
    setMyChannelToDelete(channel);
    setShowDeleteMyChannelDialog(true);
  };

  const confirmDeleteMyChannel = async () => {
    if (!myChannelToDelete) return;

    try {
      const { error } = await supabase
        .from('user_channels')
        .delete()
        .eq('id', myChannelToDelete.id);

      if (error) throw error;

      toast({ title: 'Submission removed' });
      setShowDeleteMyChannelDialog(false);
      setMyChannelToDelete(null);
      fetchMyChannels();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({ title: 'Failed to remove submission', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-[80vh]">
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">{userName}'s Dashboard</h2>
              <Badge variant="secondary">Moderator</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                fetchPendingChannels();
                fetchMyChannels();
                fetchAllChannels();
                fetchComments();
                fetchNews();
                toast({ title: 'Dashboard refreshed' });
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-4 shrink-0">
              <TabsList className="h-12">
                <TabsTrigger value="suggestions" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                  {stats.pending > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {stats.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="my-suggestions" className="gap-2">
                  <FileText className="h-4 w-4" />
                  My Suggestions
                </TabsTrigger>
                <TabsTrigger value="all-channels" className="gap-2">
                  <Database className="h-4 w-4" />
                  All Channels
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-2">
                  <Newspaper className="h-4 w-4" />
                  News
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Pending Suggestions Tab */}
            <TabsContent value="suggestions" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="border-b p-4 flex items-center gap-2 shrink-0 flex-wrap">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Search channels..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="w-[180px]"
                />
                
                {selectedPending.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                        Bulk Actions ({selectedPending.size})
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleBulkApprovePending}>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Approve Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkRejectPending}>
                        <XCircle className="h-4 w-4 mr-2 text-destructive" />
                        Reject Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex-1 overflow-auto p-4">
                {suggestionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingChannels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No pending suggestions to review
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[900px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectedPending.size === pendingChannels.length && pendingChannels.length > 0}
                              onCheckedChange={toggleSelectAllPending}
                            />
                          </TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[140px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingChannels
                          .filter(channel => !pendingSearch || 
                            channel.name.toLowerCase().includes(pendingSearch.toLowerCase()) ||
                            channel.author_name?.toLowerCase().includes(pendingSearch.toLowerCase()) ||
                            channel.author_email?.toLowerCase().includes(pendingSearch.toLowerCase())
                          )
                          .map((channel) => (
                          <TableRow key={channel.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedPending.has(channel.id)}
                                onCheckedChange={() => toggleSelectPending(channel.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{channel.name}</TableCell>
                            <TableCell className="capitalize">{channel.category}</TableCell>
                            <TableCell>{channel.country}</TableCell>
                            <TableCell>{channel.year}</TableCell>
                            <TableCell className="text-sm">
                              {channel.author_name || channel.author_email?.split('@')[0] || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">pending</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(channel.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReviewChannel(channel, 'approve')}
                                  title="Review & Estimate"
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReviewChannel(channel, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleFlagItem('channel', channel.id, channel.name)}
                                >
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* My Suggestions Tab */}
            <TabsContent value="my-suggestions" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="border-b p-4 shrink-0">
                <Input
                  placeholder="Search my submissions..."
                  value={myChannelsSearch}
                  onChange={(e) => setMyChannelsSearch(e.target.value)}
                  className="w-full max-w-xs"
                />
              </div>
              <div className="flex-1 overflow-auto p-4">
                {myChannelsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : myChannels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    You haven't submitted any channels yet
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[700px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myChannels
                          .filter(channel => !myChannelsSearch || 
                            channel.name.toLowerCase().includes(myChannelsSearch.toLowerCase()) ||
                            channel.country.toLowerCase().includes(myChannelsSearch.toLowerCase())
                          )
                          .map((channel) => (
                          <TableRow key={channel.id}>
                            <TableCell className="font-medium">{channel.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{channel.category}</Badge>
                            </TableCell>
                            <TableCell>{channel.country}</TableCell>
                            <TableCell>{channel.year}</TableCell>
                            <TableCell>{getStatusBadge(channel.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(channel.created_at)}
                            </TableCell>
                            <TableCell>
                              {channel.status === 'pending' && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleEditMyChannel(channel)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteMyChannel(channel)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* All Channels Tab */}
            <TabsContent value="all-channels" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="border-b p-4 flex items-center gap-2 shrink-0">
                <Select value={allChannelsCountry} onValueChange={setAllChannelsCountry}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Search channels..."
                  value={allChannelsSearch}
                  onChange={(e) => setAllChannelsSearch(e.target.value)}
                  className="w-[180px]"
                />
              </div>

              <div className="flex-1 overflow-auto p-4">
                {allChannelsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : allChannels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No channels found
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[700px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead className="w-[60px]">Flag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allChannels
                          .filter(channel => !allChannelsSearch || 
                            channel.name.toLowerCase().includes(allChannelsSearch.toLowerCase()) ||
                            channel.author_name?.toLowerCase().includes(allChannelsSearch.toLowerCase())
                          )
                          .map((channel) => (
                          <TableRow key={channel.id}>
                            <TableCell className="font-medium">{channel.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{channel.category}</Badge>
                            </TableCell>
                            <TableCell>{channel.country}</TableCell>
                            <TableCell>{channel.year}</TableCell>
                            <TableCell>{getStatusBadge(channel.status)}</TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {channel.author_name || channel.author_email || 'System'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleFlagItem('channel', channel.id, channel.name)}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="border-b p-4 flex items-center gap-2 shrink-0 flex-wrap">
                <Select value={commentsCountry} onValueChange={setCommentsCountry}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Search comments..."
                  value={commentsSearch}
                  onChange={(e) => setCommentsSearch(e.target.value)}
                  className="w-[180px]"
                />
                
                {selectedComments.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                        Bulk Actions ({selectedComments.size})
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleBulkDeleteComments}>
                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex-1 overflow-auto p-4">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No comments found
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[700px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectedComments.size === comments.length && comments.length > 0}
                              onCheckedChange={toggleSelectAllComments}
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comments
                          .filter(comment => !commentsSearch || 
                            comment.content.toLowerCase().includes(commentsSearch.toLowerCase()) ||
                            comment.user_name?.toLowerCase().includes(commentsSearch.toLowerCase())
                          )
                          .map((comment) => (
                          <TableRow key={comment.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedComments.has(comment.id)}
                                onCheckedChange={() => toggleSelectComment(comment.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{comment.user_name || 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground">{comment.user_email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {comment.content}
                            </TableCell>
                            <TableCell>{comment.country}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {comment.parent_id ? 'Reply' : 'Comment'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteComment(comment)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleFlagItem('comment', comment.id, comment.content.slice(0, 30))}
                                >
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="border-b p-4 flex items-center gap-2 shrink-0 flex-wrap">
                <Input
                  placeholder="Search news..."
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  className="w-[180px]"
                />
                
                {selectedNews.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                        Bulk Actions ({selectedNews.size})
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleBulkDeleteNews}>
                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex-1 overflow-auto p-4">
                {newsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : news.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No news updates published
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[600px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectedNews.size === news.length && news.length > 0}
                              onCheckedChange={toggleSelectAllNews}
                            />
                          </TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {news
                          .filter(item => !newsSearch || 
                            item.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
                            item.category.toLowerCase().includes(newsSearch.toLowerCase())
                          )
                          .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedNews.has(item.id)}
                                onCheckedChange={() => toggleSelectNews(item.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.is_published ? 'default' : 'secondary'}>
                                {item.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(item.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditNews(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteNews(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleFlagItem('news', item.id, item.title)}
                                >
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="flex-1 overflow-auto p-4">
                <NotificationsTab isActive={activeTab === 'notifications'} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Review Dialog with AI Estimation */}
        <Dialog open={showReviewDialog} onOpenChange={(open) => {
          setShowReviewDialog(open);
          if (!open) {
            setEstimationResult(null);
            setChannelToReview(null);
            setReviewAction(null);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle className="text-xl">
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Channel Submission
              </DialogTitle>
            </DialogHeader>
              
            {channelToReview && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Submission Details Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">Field</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Channel Name</TableCell>
                        <TableCell className="font-semibold">{channelToReview.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Category</TableCell>
                        <TableCell className="capitalize">{channelToReview.category}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Platform</TableCell>
                        <TableCell>{channelToReview.platform || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Content Type</TableCell>
                        <TableCell>{channelToReview.content_type || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Political Lean</TableCell>
                        <TableCell>{channelToReview.political_lean || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Country</TableCell>
                        <TableCell>{channelToReview.country}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Analyse Submission Section */}
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => estimateAudience(channelToReview)}
                    disabled={isEstimating}
                    className="w-full h-12 px-5 font-semibold text-foreground border-2"
                  >
                    {isEstimating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Analysing...
                      </>
                    ) : (
                      <>
                        <img src={perplexityLogo} alt="Perplexity" className="h-5 w-5 mr-2" />
                        Analyse Submission
                      </>
                    )}
                  </Button>

                  {estimationResult && (
                    <div className="rounded-md border bg-muted/30 overflow-hidden">
                      {/* Input Validation */}
                      {estimationResult.inputValidation && (
                        <div className="p-4 border-b">
                          <h4 className="text-sm font-semibold mb-3">Input Validation</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <span className={estimationResult.inputValidation.categoryCorrect ? 'text-green-600' : 'text-amber-600'}>
                                {estimationResult.inputValidation.categoryCorrect ? '✓' : '⚠'}
                              </span>
                              <span className="text-sm">Category: {estimationResult.inputValidation.categoryCorrect ? 'Correct' : `Suggested: ${estimationResult.inputValidation.suggestedCategory}`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={estimationResult.inputValidation.platformCorrect ? 'text-green-600' : 'text-amber-600'}>
                                {estimationResult.inputValidation.platformCorrect ? '✓' : '⚠'}
                              </span>
                              <span className="text-sm">Platform: {estimationResult.inputValidation.platformCorrect ? 'Correct' : 'Review needed'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={estimationResult.inputValidation.contentTypeCorrect ? 'text-green-600' : 'text-amber-600'}>
                                {estimationResult.inputValidation.contentTypeCorrect ? '✓' : '⚠'}
                              </span>
                              <span className="text-sm">Content Type: {estimationResult.inputValidation.contentTypeCorrect ? 'Correct' : 'Review needed'}</span>
                            </div>
                          </div>
                          {estimationResult.inputValidation.validationNotes && (
                            <p className="text-sm text-muted-foreground mt-3 italic">{estimationResult.inputValidation.validationNotes}</p>
                          )}
                        </div>
                      )}

                      {/* Results */}
                      <div className="p-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Results</h4>
                      </div>
                      <Table>
                        <TableBody>
                          {estimationResult.politicalLean && (
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground w-1/3">Political Lean</TableCell>
                              <TableCell>
                                <span className="font-semibold text-primary">{estimationResult.politicalLean}</span>
                                {estimationResult.politicalLeanJustification && (
                                  <p className="text-sm text-muted-foreground mt-1">{estimationResult.politicalLeanJustification}</p>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-medium text-muted-foreground">Cross-Platform Audience</TableCell>
                            <TableCell className="text-lg font-bold">{estimationResult.crossPlatformAudience?.toFixed(2) || '0.00'}M</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium text-muted-foreground">Deduplicated Audience</TableCell>
                            <TableCell className="text-lg font-bold text-primary">{estimationResult.deduplicatedAudience?.toFixed(2) || '0.00'}M</TableCell>
                          </TableRow>
                          {estimationResult.suggestedStartDate && (
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground">Suggested Start Date</TableCell>
                              <TableCell className="font-medium">{estimationResult.suggestedStartDate}</TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-medium text-muted-foreground">Reasoning</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{estimationResult.reasoning}</TableCell>
                          </TableRow>
                          {estimationResult.comparableChannels?.length > 0 && (
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground">Comparable Channels</TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-wrap gap-2">
                                  {estimationResult.comparableChannels.map((channel, idx) => (
                                    <Badge 
                                      key={idx}
                                      variant="outline"
                                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                      onClick={() => analyzeComparableChannel(channel)}
                                    >
                                      {channel}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      
                    </div>
                  )}
                </div>

                {estimationResult && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowReviewDialog(false);
                        setEstimationResult(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => channelToReview && estimateAudience(channelToReview)}
                      disabled={isEstimating}
                      className="flex-1"
                    >
                      {isEstimating ? 'Analysing...' : 'Re-analyse'}
                    </Button>
                    {reviewAction === 'reject' ? (
                      <Button 
                        variant="destructive"
                        onClick={confirmReview}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    ) : (
                      <Button 
                        onClick={applyEstimation}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Approve ({estimationResult.deduplicatedAudience?.toFixed(2) || '0'}M)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Comment Dialog */}
        <AlertDialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteComment} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Flag Dialog */}
        <AlertDialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Flag for Admin Review</AlertDialogTitle>
              <AlertDialogDescription>
                Provide a reason for flagging "{flagItem?.name}". An admin will be notified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="flagReason">Reason</Label>
              <Textarea
                id="flagReason"
                placeholder="Explain why this item needs admin attention..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmFlagItem}
                disabled={!flagReason.trim() || flagging}
              >
                {flagging ? 'Flagging...' : 'Submit Flag'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit News Dialog */}
        <Dialog open={showEditNewsDialog} onOpenChange={setShowEditNewsDialog}>
          <DialogContent className="max-w-md">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Edit News</h3>
              <div className="space-y-2">
                <Label htmlFor="newsTitle">Title</Label>
                <Input
                  id="newsTitle"
                  value={newsFormData.title}
                  onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                  placeholder="News title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newsContent">Content</Label>
                <Textarea
                  id="newsContent"
                  value={newsFormData.content}
                  onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })}
                  placeholder="News content..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newsCategory">Category</Label>
                <Select
                  value={newsFormData.category}
                  onValueChange={(v) => setNewsFormData({ ...newsFormData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newsPublished"
                  checked={newsFormData.is_published}
                  onChange={(e) => setNewsFormData({ ...newsFormData, is_published: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="newsPublished">Published</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditNewsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveNewsEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete News Dialog */}
        <AlertDialog open={showDeleteNewsDialog} onOpenChange={setShowDeleteNewsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete News</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{newsToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteNews} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Edit My Channel Dialog */}
        <Dialog open={showEditMyChannelDialog} onOpenChange={setShowEditMyChannelDialog}>
          <DialogContent className="max-w-lg">
            <div className="space-y-4">
              <h3 className="font-semibold">Edit Submission</h3>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                <div className="col-span-2">
                  <Label>Channel Name</Label>
                  <Input
                    value={myChannelFormData.name}
                    onChange={(e) => setMyChannelFormData({ ...myChannelFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Audience (Millions)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={myChannelFormData.value_millions}
                    onChange={(e) => setMyChannelFormData({ ...myChannelFormData, value_millions: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={myChannelFormData.category} onValueChange={(v) => setMyChannelFormData({ ...myChannelFormData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="independent">Independent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Platform</Label>
                  <Input
                    value={myChannelFormData.platform}
                    onChange={(e) => setMyChannelFormData({ ...myChannelFormData, platform: e.target.value })}
                    placeholder="e.g., TV, Digital, Print"
                  />
                </div>
                <div>
                  <Label>Content Type</Label>
                  <Input
                    value={myChannelFormData.content_type}
                    onChange={(e) => setMyChannelFormData({ ...myChannelFormData, content_type: e.target.value })}
                    placeholder="e.g., News, Entertainment"
                  />
                </div>
                <div>
                  <Label>Political Lean</Label>
                  <Select value={myChannelFormData.political_lean} onValueChange={(v) => setMyChannelFormData({ ...myChannelFormData, political_lean: v })}>
                    <SelectTrigger><SelectValue placeholder="Select lean" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center-left">Center-Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="center-right">Center-Right</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    value={myChannelFormData.start_date}
                    onChange={(e) => setMyChannelFormData({ ...myChannelFormData, start_date: e.target.value })}
                    placeholder="e.g., 1980, 2010"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditMyChannelDialog(false)}>Cancel</Button>
                <Button onClick={saveMyChannelEdit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete My Channel Dialog */}
        <AlertDialog open={showDeleteMyChannelDialog} onOpenChange={setShowDeleteMyChannelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Submission</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{myChannelToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMyChannel} className="bg-destructive hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Comparable Channel Analysis Modal */}
        <Dialog open={showComparableModal} onOpenChange={(open) => {
          setShowComparableModal(open);
          if (!open) {
            setComparableChannelName('');
            setComparableEstimation(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <img src={perplexityLogo} alt="Perplexity" className="h-5 w-5" />
                Analyze: {comparableChannelName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {comparableEstimating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing {comparableChannelName}...</p>
                </div>
              ) : comparableEstimation ? (
                <div className="space-y-4">
                  {/* Input Validation Section */}
                  {comparableEstimation.inputValidation && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Input Validation</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={comparableEstimation.inputValidation.categoryCorrect ? 'text-green-600' : 'text-amber-600'}>
                            {comparableEstimation.inputValidation.categoryCorrect ? '✓' : '⚠'}
                          </span>
                          <span className="text-sm">
                            Category: {comparableEstimation.inputValidation.suggestedCategory || 'independent'}
                          </span>
                        </div>
                      </div>
                      {comparableEstimation.inputValidation.validationNotes && (
                        <p className="text-sm text-muted-foreground mt-3 italic">{comparableEstimation.inputValidation.validationNotes}</p>
                      )}
                    </div>
                  )}

                  {/* Estimation Results Table */}
                  <Table>
                    <TableBody>
                      {comparableEstimation.politicalLean && (
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground w-1/3">Political Lean</TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">{comparableEstimation.politicalLean}</span>
                            {comparableEstimation.politicalLeanJustification && (
                              <p className="text-sm text-muted-foreground mt-1">{comparableEstimation.politicalLeanJustification}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Cross-Platform Audience</TableCell>
                        <TableCell className="text-lg font-bold">{comparableEstimation.crossPlatformAudience?.toFixed(2) || '0.00'}M</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Deduplicated Audience</TableCell>
                        <TableCell className="text-lg font-bold text-primary">{comparableEstimation.deduplicatedAudience?.toFixed(2) || '0.00'}M</TableCell>
                      </TableRow>
                      {comparableEstimation.suggestedStartDate && (
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">Suggested Start Date</TableCell>
                          <TableCell className="font-medium">{comparableEstimation.suggestedStartDate}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Reasoning</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{comparableEstimation.reasoning}</TableCell>
                      </TableRow>
                      {comparableEstimation.comparableChannels?.length > 0 && (
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">Comparable Channels</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-wrap gap-2">
                              {comparableEstimation.comparableChannels.map((channel, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => analyzeComparableChannel(channel)}
                                >
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowComparableModal(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => analyzeComparableChannel(comparableChannelName)}
                      disabled={comparableEstimating}
                      className="flex-1"
                    >
                      Re-analyse
                    </Button>
                    <Button 
                      onClick={addComparableAsChannel}
                      className="flex-1"
                    >
                      Add as Channel ({comparableEstimation.deduplicatedAudience?.toFixed(2) || '0'}M)
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ModeratorDashboardModal;
