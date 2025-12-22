import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Globe, 
  Loader2, 
  Check, 
  X, 
  ExternalLink,
  Building2,
  Calendar,
  MapPin,
  Filter,
  Trash2,
  Edit,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useChannelDiscoveries, ChannelDiscovery } from '@/hooks/useChannelDiscoveries';

const COUNTRIES = [
  'United States',
  'United Kingdom', 
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Brazil',
  'Japan',
  'South Korea',
];

const CATEGORIES = [
  { value: 'all', label: 'All Types' },
  { value: 'corporate', label: 'Corporate Media' },
  { value: 'independent', label: 'Independent Media' },
];

export default function Discovery() {
  const navigate = useNavigate();
  const { user, isContributor, isModerator, isAdmin, loading: authLoading } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customQuery, setCustomQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [editingDiscovery, setEditingDiscovery] = useState<ChannelDiscovery | null>(null);
  const [rejectingDiscovery, setRejectingDiscovery] = useState<ChannelDiscovery | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const { 
    discoveries, 
    loading, 
    triggerDiscovery, 
    approveDiscovery, 
    rejectDiscovery,
    deleteDiscovery 
  } = useChannelDiscoveries();

  // Check access
  const hasAccess = isContributor || isModerator || isAdmin;
  const canTriggerDiscovery = isModerator || isAdmin;
  const canDelete = isAdmin;

  // Redirect if not authenticated or doesn't have access
  if (!authLoading && (!user || !hasAccess)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You need to be a Contributor, Moderator, or Admin to access the Channel Discovery feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTriggerDiscovery = async () => {
    if (!canTriggerDiscovery) return;
    
    setIsDiscovering(true);
    try {
      await triggerDiscovery(
        selectedCountry,
        selectedCategory === 'all' ? undefined : selectedCategory,
        customQuery || undefined
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleApprove = async (discovery: ChannelDiscovery) => {
    await approveDiscovery(discovery);
  };

  const handleReject = async () => {
    if (!rejectingDiscovery) return;
    await rejectDiscovery(rejectingDiscovery.id, rejectNotes);
    setRejectingDiscovery(null);
    setRejectNotes('');
  };

  const handleDelete = async (discovery: ChannelDiscovery) => {
    if (confirm(`Are you sure you want to permanently delete "${discovery.name}"?`)) {
      await deleteDiscovery(discovery.id);
    }
  };

  const filteredDiscoveries = discoveries.filter(d => {
    if (statusFilter === 'all') return true;
    return d.status === statusFilter;
  });

  const pendingCount = discoveries.filter(d => d.status === 'pending').length;
  const approvedCount = discoveries.filter(d => d.status === 'approved').length;
  const rejectedCount = discoveries.filter(d => d.status === 'rejected').length;

  const getPoliticalLeanColor = (lean: string | null) => {
    if (!lean) return 'bg-muted text-muted-foreground';
    const l = lean.toLowerCase();
    if (l.includes('left') && !l.includes('center')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
    if (l.includes('right') && !l.includes('center')) return 'bg-red-500/20 text-red-700 dark:text-red-300';
    return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
  };

  return (
    <>
      <Helmet>
        <title>Channel Discovery | Media Bias Tracker</title>
        <meta name="description" content="Discover and add new media channels to the database" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Channel Discovery
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Find and verify media channels using AI-powered search
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{pendingCount} pending</Badge>
                {isAdmin && (
                  <Badge variant="secondary">Admin</Badge>
                )}
                {isModerator && !isAdmin && (
                  <Badge variant="secondary">Moderator</Badge>
                )}
                {isContributor && !isModerator && !isAdmin && (
                  <Badge variant="secondary">Contributor</Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Discovery Controls - Only for Mods/Admins */}
          {canTriggerDiscovery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Discover New Channels
                </CardTitle>
                <CardDescription>
                  Search for media outlets and political commentators by country
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <Globe className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label>Custom Search (optional)</Label>
                    <Input
                      placeholder="e.g., 'tech news podcasts' or 'political YouTube channels'"
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleTriggerDiscovery} 
                  disabled={isDiscovering}
                  className="w-full sm:w-auto"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Discovery
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Discoveries List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Discovered Channels</CardTitle>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList>
                    <TabsTrigger value="pending">
                      Pending ({pendingCount})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({approvedCount})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({rejectedCount})
                    </TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDiscoveries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No discoveries found</p>
                  {canTriggerDiscovery && (
                    <p className="text-sm mt-2">Use the search above to discover new channels</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDiscoveries.map((discovery) => (
                    <div
                      key={discovery.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{discovery.name}</h3>
                            <Badge variant="outline" className="capitalize">
                              {discovery.category}
                            </Badge>
                            {discovery.political_lean && (
                              <Badge className={getPoliticalLeanColor(discovery.political_lean)}>
                                {discovery.political_lean}
                              </Badge>
                            )}
                            <Badge 
                              variant={
                                discovery.status === 'pending' ? 'secondary' :
                                discovery.status === 'approved' ? 'default' : 'destructive'
                              }
                            >
                              {discovery.status}
                            </Badge>
                          </div>
                          
                          {discovery.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {discovery.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {discovery.country}
                            </span>
                            {discovery.platform && (
                              <span>{discovery.platform}</span>
                            )}
                            {discovery.headquarters && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {discovery.headquarters}
                              </span>
                            )}
                            {discovery.founding_year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Est. {discovery.founding_year}
                              </span>
                            )}
                            {discovery.parent_company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {discovery.parent_company}
                              </span>
                            )}
                            {discovery.website_url && (
                              <a 
                                href={discovery.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {discovery.status === 'pending' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingDiscovery(discovery)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(discovery)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectingDiscovery(discovery)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {canDelete && discovery.status !== 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(discovery)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {discovery.review_notes && (
                        <p className="text-sm text-muted-foreground italic border-l-2 pl-3">
                          Note: {discovery.review_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingDiscovery} onOpenChange={() => setRejectingDiscovery(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Discovery</DialogTitle>
            <DialogDescription>
              Optionally add a note explaining why "{rejectingDiscovery?.name}" was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Rejection reason (optional)..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingDiscovery(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - TODO: Implement full edit form */}
      <Dialog open={!!editingDiscovery} onOpenChange={() => setEditingDiscovery(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit & Approve</DialogTitle>
            <DialogDescription>
              Review and edit the channel details before approving.
            </DialogDescription>
          </DialogHeader>
          {editingDiscovery && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input defaultValue={editingDiscovery.name} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select defaultValue={editingDiscovery.category}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="independent">Independent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Political Lean</Label>
                  <Select defaultValue={editingDiscovery.political_lean || 'center'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center-left">Center-Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="center-right">Center-Right</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select defaultValue={editingDiscovery.platform || 'online'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tv">TV</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="print">Print</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea defaultValue={editingDiscovery.description || ''} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDiscovery(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingDiscovery) {
                handleApprove(editingDiscovery);
                setEditingDiscovery(null);
              }
            }}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
