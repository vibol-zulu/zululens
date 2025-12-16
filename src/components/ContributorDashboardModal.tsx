import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useContributorMetrics, LeaderboardEntry } from '@/hooks/useContributorMetrics';
import { useMySubmissions } from '@/hooks/useMySubmissions';
import { Flame, Trophy, Target, TrendingUp, Medal, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
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

  const loading = metricsLoading || submissionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Welcome, {userName}!
            <Badge variant="outline">Contributor</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submissions">My Submissions</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-auto space-y-4 mt-4">
              {/* Streak & Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Current Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics?.current_streak || 0} days</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Longest Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics?.longest_streak || 0} days</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Engagement Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics?.engagement_score || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Target className="h-4 w-4 text-blue-500" />
                      Your Rank
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {userRank ? (
                        <>
                          {getRankBadge(userRank)}
                          {userRank > 3 && <span>of {leaderboard.length}</span>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submission Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submission Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                      <div className="text-sm text-muted-foreground">Approved</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                      <div className="text-sm text-muted-foreground">Rejected</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to Moderator</span>
                      <span className="text-muted-foreground">{stats.approved}/50 approved</span>
                    </div>
                    <Progress value={(stats.approved / 50) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Get 50 suggestions approved to become eligible for Moderator promotion
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{metrics?.total_suggestions || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Suggestions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{metrics?.approved_suggestions || 0}</div>
                        <div className="text-sm text-muted-foreground">Approved</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{metrics?.total_comments || 0}</div>
                        <div className="text-sm text-muted-foreground">Comments</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {metrics?.last_activity_date 
                            ? formatDate(metrics.last_activity_date)
                            : 'No activity yet'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">Last Active</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[400px]">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No submissions yet. Start adding channels to the visualization!
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
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
              </ScrollArea>
            </TabsContent>

            <TabsContent value="leaderboard" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[400px]">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No contributors on the leaderboard yet. Be the first!
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContributorDashboardModal;
