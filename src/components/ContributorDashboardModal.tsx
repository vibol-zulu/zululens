import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useContributorMetrics, LeaderboardEntry } from '@/hooks/useContributorMetrics';
import { useMySubmissions, ChannelSubmission } from '@/hooks/useMySubmissions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, TrendingUp, Clock, CheckCircle, XCircle, Loader2, BarChart3, FileText, Users, Pencil, Trash2, Bell, Settings, Shield } from 'lucide-react';
import NotificationsTab from '@/components/NotificationsTab';
import AccountSettingsTab from '@/components/AccountSettingsTab';

interface ContributorDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

const ContributorDashboardModal: React.FC<ContributorDashboardModalProps> = ({
  open,
  onOpenChange,
  userName
}) => {
  const { metrics, leaderboard, userRank, loading: metricsLoading, fetchLeaderboard } = useContributorMetrics();
  const { submissions, stats, loading: submissionsLoading, refetch: refetchSubmissions } = useMySubmissions();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [submissionsSearch, setSubmissionsSearch] = useState('');
  const [leaderboardSearch, setLeaderboardSearch] = useState('');

  // Moderator application state
  const [showModeratorApplicationDialog, setShowModeratorApplicationDialog] = useState(false);
  const [moderatorApplicationMessage, setModeratorApplicationMessage] = useState('');
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [existingApplication, setExistingApplication] = useState<{ status: string; created_at: string } | null>(null);

  // Edit state
  const [editingSubmission, setEditingSubmission] = useState<ChannelSubmission | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    value_millions: 0,
    category: '',
    platform: '',
    content_type: '',
    political_lean: '',
    start_date: ''
  });

  // Delete state
  const [submissionToDelete, setSubmissionToDelete] = useState<ChannelSubmission | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch existing moderator application
  useEffect(() => {
    const fetchExistingApplication = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('moderator_requests')
        .select('status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setExistingApplication(data);
      }
    };
    
    if (open) {
      fetchLeaderboard();
      refetchSubmissions();
      fetchExistingApplication();
    }
  }, [open, fetchLeaderboard, refetchSubmissions, user]);

  const handleModeratorApplication = async () => {
    if (!user || !moderatorApplicationMessage.trim()) {
      toast({ title: 'Please enter a message', variant: 'destructive' });
      return;
    }

    setSubmittingApplication(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('moderator_requests')
        .insert({
          user_id: user.id,
          name: profile?.full_name || 'Unknown',
          email: profile?.email || user.email || '',
          message: moderatorApplicationMessage.trim(),
          country: 'United States'
        });

      if (error) throw error;

      toast({ title: 'Application submitted successfully!' });
      setShowModeratorApplicationDialog(false);
      setModeratorApplicationMessage('');
      setExistingApplication({ status: 'pending', created_at: new Date().toISOString() });
    } catch (error: any) {
      console.error('Error submitting moderator application:', error);
      toast({ 
        title: 'Failed to submit application', 
        description: error.message || 'Please try again later',
        variant: 'destructive' 
      });
    } finally {
      setSubmittingApplication(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600 gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRankDisplay = (rank: number) => {
    return <span className="text-sm font-semibold">#{rank}</span>;
  };

  const handleEdit = (submission: ChannelSubmission) => {
    setEditingSubmission(submission);
    setEditFormData({
      name: submission.name,
      value_millions: submission.value_millions,
      category: submission.category,
      platform: submission.platform,
      content_type: submission.content_type,
      political_lean: submission.political_lean,
      start_date: submission.start_date
    });
    setShowEditDialog(true);
  };

  const saveEdit = async () => {
    if (!editingSubmission || !editFormData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_channels')
        .update({
          name: editFormData.name,
          value_millions: editFormData.value_millions,
          category: editFormData.category,
          platform: editFormData.platform,
          content_type: editFormData.content_type,
          political_lean: editFormData.political_lean,
          start_date: editFormData.start_date
        })
        .eq('id', editingSubmission.id);

      if (error) throw error;

      toast({ title: 'Submission updated' });
      setShowEditDialog(false);
      setEditingSubmission(null);
      refetchSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({ title: 'Failed to update submission', variant: 'destructive' });
    }
  };

  const handleDelete = (submission: ChannelSubmission) => {
    setSubmissionToDelete(submission);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!submissionToDelete) return;

    try {
      const { error } = await supabase
        .from('user_channels')
        .delete()
        .eq('id', submissionToDelete.id);

      if (error) throw error;

      toast({ title: 'Submission removed' });
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
      refetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({ title: 'Failed to remove submission', variant: 'destructive' });
    }
  };

  const loading = metricsLoading || submissionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-[80vh]">
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">{userName}'s Dashboard</h2>
              <Badge variant="outline">Contributor</Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b px-4 shrink-0">
                <TabsList className="h-12">
                  <TabsTrigger value="overview" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="submissions" className="gap-2">
                    <FileText className="h-4 w-4" />
                    My Submissions
                    {stats.total > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {stats.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="gap-2">
                    <Users className="h-4 w-4" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* Welcome & Explanation Section */}
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                    <h3 className="text-sm font-semibold mb-2 text-primary">Welcome, Contributor!</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      As a Contributor, you have enhanced privileges and are recognized for your valuable contributions to the platform.
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span><strong>Submit Channels:</strong> Continue adding new media channels to grow the database</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                        <span><strong>Leaderboard:</strong> Compete with other contributors based on your engagement score</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <span><strong>Become a Moderator:</strong> Apply to become a Moderator and help review channel submissions</span>
                      </div>
                    </div>
                  </div>


                  {/* Submission Stats */}
                  <div className="rounded-md border p-4">
                    <h3 className="text-sm font-medium mb-4">Submissions</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
                        <div className="text-xs text-muted-foreground">Approved</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-rose-500">{stats.rejected}</div>
                        <div className="text-xs text-muted-foreground">Rejected</div>
                      </div>
                    </div>
                  </div>

                  {/* Moderator Application Section */}
                  <div className="rounded-md border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-medium">Become a Moderator</h3>
                    </div>
                    
                    {existingApplication ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Application Status:</span>
                          <Badge 
                            variant={existingApplication.status === 'approved' ? 'default' : existingApplication.status === 'rejected' ? 'destructive' : 'secondary'}
                            className={existingApplication.status === 'approved' ? 'bg-emerald-600' : ''}
                          >
                            {existingApplication.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {existingApplication.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {existingApplication.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Submitted on {formatDate(existingApplication.created_at)}
                        </p>
                        {existingApplication.status === 'rejected' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowModeratorApplicationDialog(true)}
                            className="mt-2"
                          >
                            Submit New Application
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Ready to take on more responsibility? As a Moderator, you'll help review and approve channel submissions from other users.
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => setShowModeratorApplicationDialog(true)}
                          className="gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Apply to Become a Moderator
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 shrink-0">
                  <Input
                    placeholder="Search submissions..."
                    value={submissionsSearch}
                    onChange={(e) => setSubmissionsSearch(e.target.value)}
                    className="w-full max-w-xs"
                  />
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {submissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No submissions yet. Start adding channels to the visualization!
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-[600px] text-xs">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Channel Name</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions
                            .filter(s => !submissionsSearch || 
                              s.name.toLowerCase().includes(submissionsSearch.toLowerCase()) ||
                              s.country.toLowerCase().includes(submissionsSearch.toLowerCase()) ||
                              s.status.toLowerCase().includes(submissionsSearch.toLowerCase())
                            )
                            .map((submission) => (
                            <TableRow key={submission.id}>
                              <TableCell className="font-medium">{submission.name}</TableCell>
                              <TableCell>{submission.country}</TableCell>
                              <TableCell>{submission.year}</TableCell>
                              <TableCell>{getStatusBadge(submission.status)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(submission.created_at)}
                              </TableCell>
                              <TableCell>
                                {submission.status === 'pending' && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleEdit(submission)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                      onClick={() => handleDelete(submission)}
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

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 shrink-0">
                  <Input
                    placeholder="Search contributors..."
                    value={leaderboardSearch}
                    onChange={(e) => setLeaderboardSearch(e.target.value)}
                    className="w-full max-w-xs"
                  />
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No contributors on the leaderboard yet. Be the first!
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-[500px] text-xs">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Rank</TableHead>
                            <TableHead>Contributor</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead className="text-center">Approved</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboard
                            .filter(entry => !leaderboardSearch ||
                              entry.user_name?.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
                              entry.user_email?.toLowerCase().includes(leaderboardSearch.toLowerCase())
                            )
                            .map((entry) => (
                            <TableRow 
                              key={entry.user_id}
                              className={entry.user_id === userRank?.toString() ? 'bg-primary/5' : ''}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center justify-center">
                                  {getRankDisplay(entry.rank)}
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
                                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                                  {entry.engagement_score}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  {entry.approved_suggestions}
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

              {/* Settings Tab */}
              <TabsContent value="settings" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="flex-1 overflow-auto p-4">
                  <AccountSettingsTab isActive={activeTab === 'settings'} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg">
            <div className="space-y-4">
              <h3 className="font-semibold">Edit Submission</h3>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                <div className="col-span-2">
                  <Label>Channel Name</Label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Audience (Millions)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editFormData.value_millions}
                    onChange={(e) => setEditFormData({ ...editFormData, value_millions: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={editFormData.category} onValueChange={(v) => setEditFormData({ ...editFormData, category: v })}>
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
                    value={editFormData.platform}
                    onChange={(e) => setEditFormData({ ...editFormData, platform: e.target.value })}
                    placeholder="e.g., TV, Digital, Print"
                  />
                </div>
                <div>
                  <Label>Content Type</Label>
                  <Input
                    value={editFormData.content_type}
                    onChange={(e) => setEditFormData({ ...editFormData, content_type: e.target.value })}
                    placeholder="e.g., News, Entertainment"
                  />
                </div>
                <div>
                  <Label>Political Lean</Label>
                  <Select value={editFormData.political_lean} onValueChange={(v) => setEditFormData({ ...editFormData, political_lean: v })}>
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
                    value={editFormData.start_date}
                    onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                    placeholder="e.g., 1980, 2010"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Submission</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{submissionToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Moderator Application Dialog */}
        <Dialog open={showModeratorApplicationDialog} onOpenChange={setShowModeratorApplicationDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Apply to Become a Moderator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                As a Moderator, you'll help review and approve channel submissions from other users. 
                Please tell us why you'd like to become a moderator and how you can contribute.
              </p>
              <div className="space-y-2">
                <Label htmlFor="moderator-message">Your Application</Label>
                <Textarea
                  id="moderator-message"
                  value={moderatorApplicationMessage}
                  onChange={(e) => setModeratorApplicationMessage(e.target.value)}
                  placeholder="Tell us about your experience and why you'd like to help moderate..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {moderatorApplicationMessage.length}/1000
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowModeratorApplicationDialog(false)}
                disabled={submittingApplication}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleModeratorApplication}
                disabled={submittingApplication || !moderatorApplicationMessage.trim()}
              >
                {submittingApplication ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ContributorDashboardModal;
