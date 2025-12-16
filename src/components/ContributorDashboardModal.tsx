import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useContributorMetrics, LeaderboardEntry } from '@/hooks/useContributorMetrics';
import { useMySubmissions } from '@/hooks/useMySubmissions';
import { Flame, Trophy, Target, TrendingUp, Clock, CheckCircle, XCircle, Loader2, BarChart3, FileText, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
      refetchSubmissions();
    }
  }, [open, fetchLeaderboard, refetchSubmissions]);

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
            <ThemeToggle />
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
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-md border p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Streak</span>
                      </div>
                      <div className="text-2xl font-bold">{metrics?.current_streak || 0}</div>
                      <div className="text-[10px] text-muted-foreground">days</div>
                    </div>

                    <div className="rounded-md border p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">Best</span>
                      </div>
                      <div className="text-2xl font-bold">{metrics?.longest_streak || 0}</div>
                      <div className="text-[10px] text-muted-foreground">days</div>
                    </div>

                    <div className="rounded-md border p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-muted-foreground">Score</span>
                      </div>
                      <div className="text-2xl font-bold">{metrics?.engagement_score || 0}</div>
                      <div className="text-[10px] text-muted-foreground">points</div>
                    </div>

                    <div className="rounded-md border p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Rank</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {userRank ? `#${userRank}` : '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {leaderboard.length > 0 ? `of ${leaderboard.length}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Submission Stats */}
                  <div className="rounded-md border p-4">
                    <h3 className="text-sm font-medium mb-4">Submissions</h3>
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
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

                    <div className="pt-4 border-t border-border/50">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress to Moderator</span>
                        <span className="font-medium">{stats.approved}/50</span>
                      </div>
                      <Progress value={(stats.approved / 50) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {50 - stats.approved} more approved suggestions needed
                      </p>
                    </div>
                  </div>

                  {/* Activity Summary */}
                  <div className="rounded-md border p-4">
                    <h3 className="text-sm font-medium mb-4">Activity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{metrics?.total_suggestions || 0}</div>
                          <div className="text-xs text-muted-foreground">Total Suggestions</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{metrics?.approved_suggestions || 0}</div>
                          <div className="text-xs text-muted-foreground">Approved</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{metrics?.total_comments || 0}</div>
                          <div className="text-xs text-muted-foreground">Comments</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            {metrics?.last_activity_date 
                              ? formatDate(metrics.last_activity_date)
                              : 'No activity'
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">Last Active</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="flex-1 overflow-auto p-4">
                  {submissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No submissions yet. Start adding channels to the visualization!
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

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="flex-1 overflow-auto p-4">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No contributors on the leaderboard yet. Be the first!
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-[500px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">Rank</TableHead>
                            <TableHead>Contributor</TableHead>
                            <TableHead className="text-center">Streak</TableHead>
                            <TableHead className="text-center">Approved</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboard.map((entry) => (
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContributorDashboardModal;
