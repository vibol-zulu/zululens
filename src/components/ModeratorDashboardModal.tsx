import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Newspaper,
  MessageSquare,
  Database,
  FileText,
  Trash2,
  Flag
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
    setSuggestionsLoading(true);
    try {
      let query = supabase
        .from('user_channels')
        .select('*')
        .eq('status', 'pending')
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
  }, [selectedCountry, toast]);

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

      // Notify the author about the review decision
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
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Welcome, {userName}!
            <Badge variant="secondary">Moderator</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="suggestions" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">Pending</span>
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-suggestions" className="flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">My Suggestions</span>
            </TabsTrigger>
            <TabsTrigger value="all-channels" className="flex items-center gap-1 text-xs">
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">All Channels</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-1 text-xs">
              <Newspaper className="h-3 w-3" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Suggestions Tab */}
          <TabsContent value="suggestions" className="flex-1 overflow-hidden mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by country:</span>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 h-[350px]">
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingChannels.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>No pending suggestions to review!</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Audience (M)</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingChannels.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell className="font-medium">{channel.name}</TableCell>
                          <TableCell>
                            <Badge variant={channel.category === 'corporate' ? 'default' : 'secondary'}>
                              {channel.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{channel.country}</TableCell>
                          <TableCell>{channel.value_millions}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{channel.author_name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{channel.author_email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(channel.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleFlagItem('channel', channel.id, channel.name)}
                                title="Flag for admin review"
                              >
                                <Flag className="h-4 w-4 text-orange-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleReviewChannel(channel, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReviewChannel(channel, 'reject')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* My Suggestions Tab */}
          <TabsContent value="my-suggestions" className="flex-1 overflow-hidden mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.myTotal}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.myApproved}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.myTotal > 0 ? Math.round((stats.myApproved / stats.myTotal) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="flex-1 h-[300px]">
              {myChannelsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : myChannels.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't submitted any channels yet.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Audience (M)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myChannels.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell className="font-medium">{channel.name}</TableCell>
                          <TableCell>
                            <Badge variant={channel.category === 'corporate' ? 'default' : 'secondary'}>
                              {channel.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{channel.country}</TableCell>
                          <TableCell>{channel.value_millions}</TableCell>
                          <TableCell>{getStatusBadge(channel.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(channel.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* All Channels Tab */}
          <TabsContent value="all-channels" className="flex-1 overflow-hidden mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by country:</span>
              <Select value={allChannelsCountry} onValueChange={setAllChannelsCountry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-4">
                Total: {allChannels.length} channels
              </span>
            </div>

            <ScrollArea className="flex-1 h-[350px]">
              {allChannelsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : allChannels.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No channels found.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Audience (M)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allChannels.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell className="font-medium">{channel.name}</TableCell>
                          <TableCell>
                            <Badge variant={channel.category === 'corporate' ? 'default' : 'secondary'}>
                              {channel.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{channel.country}</TableCell>
                          <TableCell>{channel.year}</TableCell>
                          <TableCell>{channel.value_millions}</TableCell>
                          <TableCell>{getStatusBadge(channel.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {channel.author_name || (channel.author_id ? 'Unknown' : 'System')}
                          </TableCell>
                          <TableCell className="text-right">
                            {channel.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFlagItem('channel', channel.id, channel.name)}
                                title="Flag this channel for admin review"
                              >
                                <Flag className="h-4 w-4 text-orange-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="flex-1 overflow-hidden mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by country:</span>
              <Select value={commentsCountry} onValueChange={setCommentsCountry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-4">
                Total: {comments.length} comments
              </span>
            </div>

            <ScrollArea className="flex-1 h-[350px]">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No comments found.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="w-[300px]">Content</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell className="max-w-[300px] truncate">
                            {comment.content}
                          </TableCell>
                          <TableCell>{comment.country}</TableCell>
                          <TableCell>
                            <Badge variant={comment.parent_id ? 'outline' : 'secondary'}>
                              {comment.parent_id ? 'Reply' : 'Comment'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(comment.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleFlagItem('comment', comment.id, comment.content.slice(0, 30) + '...')}
                                title="Flag for admin review"
                              >
                                <Flag className="h-4 w-4 text-orange-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteComment(comment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px]">
              {newsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No news updates available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {news.map((item) => (
                    <Card key={item.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFlagItem('news', item.id, item.title)}
                              title="Flag for admin review"
                            >
                              <Flag className="h-4 w-4 text-orange-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(item.created_at)}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{item.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Review Confirmation Dialog */}
        <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {reviewAction === 'approve' ? 'Approve Channel' : 'Reject Channel'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {reviewAction} "{channelToReview?.name}"?
                {reviewAction === 'approve' 
                  ? ' This channel will be added to the visualization.'
                  : ' This channel will be removed from pending review.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowReviewDialog(false);
                setChannelToReview(null);
                setReviewAction(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmReview}
                className={reviewAction === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'}
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Comment Confirmation Dialog */}
        <AlertDialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteCommentDialog(false);
                setCommentToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteComment}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Flag Channel Dialog */}
        <AlertDialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-orange-500" />
                Flag {flagItem?.type === 'channel' ? 'Channel' : flagItem?.type === 'comment' ? 'Comment' : 'News Update'} for Review
              </AlertDialogTitle>
              <AlertDialogDescription>
                Flag "{flagItem?.name}" for admin review. Please provide a reason.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Describe why this content should be reviewed..."
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowFlagDialog(false);
                setFlagItem(null);
                setFlagReason('');
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmFlagItem}
                disabled={!flagReason.trim() || flagging}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {flagging ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Flagging...</>
                ) : (
                  'Flag Content'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default ModeratorDashboardModal;
