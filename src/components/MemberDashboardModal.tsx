import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMySubmissions } from '@/hooks/useMySubmissions';
import { Clock, CheckCircle, XCircle, TrendingUp, Sparkles, FileText, BarChart3 } from 'lucide-react';
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
  const progressPercent = (stats.progressToContributor / 20) * 100;
  const [activeTab, setActiveTab] = React.useState('overview');

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
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel Name</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
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
      </DialogContent>
    </Dialog>
  );
};

export default MemberDashboardModal;
