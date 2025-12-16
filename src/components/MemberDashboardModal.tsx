import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useMySubmissions, ChannelSubmission } from '@/hooks/useMySubmissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, XCircle, TrendingUp, Sparkles, FileText, BarChart3, Pencil, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MemberDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}


const MemberDashboardModal: React.FC<MemberDashboardModalProps> = ({
  open,
  onOpenChange,
  userName
}) => {
  const { submissions, stats, loading, refetch } = useMySubmissions();
  const { toast } = useToast();
  const progressPercent = (stats.progressToContributor / 20) * 100;
  const [activeTab, setActiveTab] = React.useState('overview');

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

  // Refetch when modal opens
  React.useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-600 gap-1"><CheckCircle className="w-3 h-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      refetch();
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
      refetch();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({ title: 'Failed to remove submission', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-[70vh]">
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">{userName}'s Dashboard</h2>
              <Badge className="bg-primary/10 text-primary border-0">Member</Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-4 shrink-0">
              <TabsList className="h-12">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="submissions" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Submissions
                  {stats.total > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {stats.total}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Progress Section */}
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span>Progress to Contributor</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{stats.approved}/20</span>
                  </div>
                  <Progress value={progressPercent} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {20 - stats.approved} more approved suggestions needed
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="rounded-md border p-4">
                  <h3 className="text-sm font-medium mb-4">Submission Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                      <div className="text-xs text-muted-foreground mt-1">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
                      <div className="text-xs text-muted-foreground mt-1">Approved</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-rose-500">{stats.rejected}</div>
                      <div className="text-xs text-muted-foreground mt-1">Rejected</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                    Loading...
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No submissions yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Start suggesting channels to track your progress
                    </p>
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
                        {submissions.map((submission) => (
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
          </Tabs>
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
      </DialogContent>
    </Dialog>
  );
};

export default MemberDashboardModal;
