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
import { Clock, CheckCircle, XCircle, TrendingUp, Sparkles } from 'lucide-react';

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <span>{userName}'s Dashboard</span>
            <Badge className="bg-primary/10 text-primary border-0 text-xs font-medium">
              Member
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Progress Section */}
          <div className="px-6 py-5 border-b border-border/50">
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
          <div className="px-6 py-4 border-b border-border/50">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
              </div>
              <div className="text-center border-x border-border/50">
                <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-500">{stats.rejected}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Rejected</div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Submissions ({stats.total})
            </h3>
            
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
              <ScrollArea className="flex-1 -mx-2">
                <div className="space-y-1.5 px-2">
                  {submissions.map((submission) => (
                    <div 
                      key={submission.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {getStatusIcon(submission.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{submission.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {submission.country} · {submission.year}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {formatDate(submission.created_at)}
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
