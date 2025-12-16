import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES } from '@/data/mediaData';
import { 
  Check,
  XCircle, 
  Clock, 
  Loader2,
  Newspaper,
  MessageSquare,
  Database,
  FileText,
  Trash2,
  Flag,
  Pencil
} from 'lucide-react';

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
  
  // Pending suggestions state
  const [pendingChannels, setPendingChannels] = useState<ChannelEntry[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [channelToReview, setChannelToReview] = useState<ChannelEntry | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // My suggestions state
  const [myChannels, setMyChannels] = useState<ChannelEntry[]>([]);
  const [myChannelsLoading, setMyChannelsLoading] = useState(false);

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
        await supabase
          .from('notifications')
          .insert({
            title: reviewAction === 'approve' ? 'Submission Approved!' : 'Submission Rejected',
            message: reviewAction === 'approve' 
              ? `Your channel suggestion "${channelToReview.name}" has been approved and is now live in the visualization.`
              : `Your channel suggestion "${channelToReview.name}" was not approved. Please review our guidelines and try again.`,
            type: 'submission_review',
            target_role: 'member',
            target_user_id: channelToReview.author_id,
            channel_id: channelToReview.id,
            created_by: user.id
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
              </TabsList>
            </div>

            {/* Pending Suggestions Tab */}
            <TabsContent value="suggestions" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="border-b p-4 flex items-center gap-2 shrink-0">
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
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
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
                        {pendingChannels.map((channel) => (
                          <TableRow key={channel.id}>
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
                                >
                                  <Check className="h-4 w-4 text-green-600" />
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
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myChannels.map((channel) => (
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
                    <Table className="min-w-[700px]">
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
                        {allChannels.map((channel) => (
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
              <div className="border-b p-4 flex items-center gap-2 shrink-0">
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
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comments.map((comment) => (
                          <TableRow key={comment.id}>
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
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {news.map((item) => (
                          <TableRow key={item.id}>
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
          </Tabs>
        </div>

        {/* Review Dialog */}
        <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Channel
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {reviewAction} "{channelToReview?.name}"?
                {reviewAction === 'approve' 
                  ? ' This will make it visible in the visualization.'
                  : ' The submitter will be notified.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmReview}
                className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
      </DialogContent>
    </Dialog>
  );
};

export default ModeratorDashboardModal;
