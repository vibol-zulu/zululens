import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMySubmissions } from '@/hooks/useMySubmissions';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

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

  // Refetch when modal opens
  React.useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {userName}'s Dashboard
            <Badge variant="outline" className="text-xs">Member</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          {/* Progress to Contributor */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Progress to Contributor</span>
              </div>
              <span className="text-sm font-bold">{stats.approved}/20</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Get 20 channel suggestions approved to become a Contributor and unlock additional features.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="font-medium text-sm mb-2">Your Submissions ({stats.total})</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">No submissions yet</p>
                <p className="text-xs mt-1">Start suggesting channels to track your progress!</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {submissions.map((submission) => (
                    <div 
                      key={submission.id} 
                      className="flex items-center justify-between p-3 bg-card border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{submission.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {submission.country} • {submission.year} • {formatDate(submission.created_at)}
                        </div>
                      </div>
                      <div className="ml-3">
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDashboardModal;
