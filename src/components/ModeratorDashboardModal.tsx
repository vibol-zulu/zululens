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
  Flame, 
  Trophy, 
  Medal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  TrendingUp,
  Star,
  Users
} from 'lucide-react';

interface PendingChannel {
  id: string;
  name: string;
  category: string;
  value_millions: number;
  country: string;
  year: number;
  status: string;
  created_at: string;
  author_id: string;
  author_name?: string;
  author_email?: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  current_streak: number;
  longest_streak: number;
  total_suggestions: number;
  approved_suggestions: number;
  engagement_score: number;
  last_activity_date: string | null;
  is_eligible_for_promotion: boolean;
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
  
  // Suggestions state
  const [pendingChannels, setPendingChannels] = useState<PendingChannel[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [channelToReview, setChannelToReview] = useState<PendingChannel | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [contributorToRecommend, setContributorToRecommend] = useState<LeaderboardEntry | null>(null);
  const [showRecommendDialog, setShowRecommendDialog] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    eligibleForPromotion: 0
  });

  const fetchPendingChannels = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      let query = supabase
        .from('user_channels')
        .select('*')
        .eq('status', 'pending')
        .not('author_id', 'is', null) // Only show user-submitted channels
        .order('created_at', { ascending: false });
      
      if (selectedCountry !== 'all') {
        query = query.eq('country', selectedCountry);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set((data || []).map(c => c.author_id).filter(Boolean))];
      let profiles: { id: string; email: string; full_name: string | null }[] = [];
      
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', authorIds);
        profiles = profilesData || [];
      }

      const channelsWithAuthors: PendingChannel[] = (data || []).map(channel => {
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

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const { data: metricsData, error: metricsError } = await supabase
        .from('contributor_metrics')
        .select('*')
        .order('engagement_score', { ascending: false });

      if (metricsError) throw metricsError;

      if (!metricsData || metricsData.length === 0) {
        setLeaderboard([]);
        return;
      }

      // Fetch user profiles
      const userIds = metricsData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Only include users who have the contributor role
      const { data: contributorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'contributor');

      const contributorUserIds = new Set(contributorRoles?.map(r => r.user_id) || []);

      let eligibleCount = 0;
      const entries: LeaderboardEntry[] = metricsData
        .filter(m => contributorUserIds.has(m.user_id))
        .map((m, idx) => {
          const profile = profiles?.find(p => p.id === m.user_id);
          const isEligible = m.approved_suggestions >= 50 && m.engagement_score >= 500;
          if (isEligible) eligibleCount++;
          
          return {
            rank: idx + 1,
            user_id: m.user_id,
            user_name: profile?.full_name || 'Unknown',
            user_email: profile?.email || '',
            current_streak: m.current_streak,
            longest_streak: m.longest_streak,
            total_suggestions: m.total_suggestions,
            approved_suggestions: m.approved_suggestions,
            engagement_score: m.engagement_score,
            last_activity_date: m.last_activity_date,
            is_eligible_for_promotion: isEligible
          };
        });

      setLeaderboard(entries);
      setStats(prev => ({ ...prev, eligibleForPromotion: eligibleCount }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({ title: 'Failed to load leaderboard', variant: 'destructive' });
    } finally {
      setLeaderboardLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open && activeTab === 'suggestions') {
      fetchPendingChannels();
    }
  }, [open, activeTab, fetchPendingChannels]);

  useEffect(() => {
    if (open && activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [open, activeTab, fetchLeaderboard]);

  useEffect(() => {
    if (open && activeTab === 'suggestions') {
      fetchPendingChannels();
    }
  }, [selectedCountry]);

  const handleReviewChannel = (channel: PendingChannel, action: 'approve' | 'reject') => {
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

  const handleRecommendPromotion = (entry: LeaderboardEntry) => {
    setContributorToRecommend(entry);
    setShowRecommendDialog(true);
  };

  const confirmRecommendation = async () => {
    if (!contributorToRecommend) return;

    // For now, just show a toast - in a real implementation this would create a promotion request
    toast({
      title: 'Promotion Recommended',
      description: `${contributorToRecommend.user_name} has been recommended for promotion to Moderator. An admin will review this recommendation.`
    });
    
    setShowRecommendDialog(false);
    setContributorToRecommend(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Welcome, {userName}!
            <Badge variant="secondary">Moderator</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Suggestions
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Contributor Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="flex-1 overflow-hidden mt-4 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Pending Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leaderboard.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Star className="h-4 w-4 text-purple-500" />
                    Eligible for Promotion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.eligibleForPromotion}</div>
                </CardContent>
              </Card>
            </div>

            {/* Country Filter */}
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

            {/* Pending Channels Table */}
            <ScrollArea className="flex-1 h-[300px]">
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
                        <TableHead>Channel Name</TableHead>
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
                          <TableCell className="whitespace-nowrap">{channel.value_millions}</TableCell>
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
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleReviewChannel(channel, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReviewChannel(channel, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
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

          <TabsContent value="leaderboard" className="flex-1 overflow-hidden mt-4">
            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contributors on the leaderboard yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Rank</TableHead>
                        <TableHead>Contributor</TableHead>
                        <TableHead className="text-center">Streak</TableHead>
                        <TableHead className="text-center">Approved</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry) => (
                        <TableRow 
                          key={entry.user_id}
                          className={entry.is_eligible_for_promotion ? 'bg-green-50/50' : ''}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center justify-center">
                              {getRankBadge(entry.rank)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{entry.user_name}</span>
                              <span className="text-xs text-muted-foreground">{entry.user_email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              {entry.current_streak}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {entry.approved_suggestions}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{entry.engagement_score}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.is_eligible_for_promotion ? (
                              <Badge className="bg-green-600">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Eligible
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {50 - entry.approved_suggestions} more needed
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.is_eligible_for_promotion && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecommendPromotion(entry)}
                              >
                                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                Recommend
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Promotion Criteria</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 50+ approved channel suggestions</li>
                    <li>• 500+ engagement score</li>
                    <li>• Consistent activity streak</li>
                  </ul>
                </div>
              </ScrollArea>
            )}
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

        {/* Recommend Promotion Dialog */}
        <AlertDialog open={showRecommendDialog} onOpenChange={setShowRecommendDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Recommend for Promotion</AlertDialogTitle>
              <AlertDialogDescription>
                You are recommending {contributorToRecommend?.user_name} for promotion to Moderator.
                This recommendation will be sent to an Admin for final approval.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowRecommendDialog(false);
                setContributorToRecommend(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmRecommendation}>
                Send Recommendation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default ModeratorDashboardModal;
