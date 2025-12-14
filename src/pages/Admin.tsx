import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { COUNTRIES } from '@/data/mediaData';
import { Helmet } from 'react-helmet';

interface Channel {
  id: string;
  name: string;
  category: string;
  value_millions: number;
  start_date: string;
  platform: string;
  content_type: string;
  political_lean: string;
  country: string;
  year: number;
}

const PLATFORMS = ['YouTube', 'Cable TV', 'Broadcast TV', 'Print/Digital', 'Podcast', 'X (Twitter)', 'TikTok', 'Instagram', 'Rumble', 'Substack', 'Radio', 'Web', 'Other'];
const CONTENT_TYPES = ['24h News', 'Daily News Show', 'Long-form Podcast', 'Political Commentary', 'Investigative', 'Documentary', 'Comedy/Political', 'News Clips', 'Newsletter', 'Interview Show', 'Other'];
const POLITICAL_LEANS = ['Far Left', 'Progressive/Left', 'Center-Left', 'Center', 'Center-Right', 'Right', 'Far Right', 'Libertarian', 'Independent', 'Non-partisan'];

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'corporate' | 'independent'>('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'corporate',
    value_millions: '',
    start_date: '',
    platform: '',
    content_type: '',
    political_lean: ''
  });

  const verifyPassword = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password }
      });
      
      if (error) throw error;
      
      if (data.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        toast({ title: 'Access granted' });
      } else {
        toast({ title: 'Invalid password', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({ title: 'Verification failed', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchChannels = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_channels')
        .select('*')
        .eq('country', selectedCountry)
        .eq('year', selectedYear);
      
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query.order('value_millions', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({ title: 'Failed to load channels', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = sessionStorage.getItem('admin_authenticated');
    if (cached === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChannels();
    }
  }, [isAuthenticated, selectedCountry, selectedYear, selectedCategory]);

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      category: channel.category,
      value_millions: String(channel.value_millions),
      start_date: channel.start_date,
      platform: channel.platform,
      content_type: channel.content_type,
      political_lean: channel.political_lean
    });
    setShowEditDialog(true);
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      category: 'corporate',
      value_millions: '',
      start_date: '',
      platform: '',
      content_type: '',
      political_lean: ''
    });
    setShowAddDialog(true);
  };

  const saveChannel = async () => {
    if (!formData.name || !formData.value_millions) {
      toast({ title: 'Name and audience are required', variant: 'destructive' });
      return;
    }

    try {
      if (editingChannel) {
        const { error } = await supabase
          .from('user_channels')
          .update({
            name: formData.name,
            category: formData.category,
            value_millions: parseFloat(formData.value_millions),
            start_date: formData.start_date,
            platform: formData.platform,
            content_type: formData.content_type,
            political_lean: formData.political_lean
          })
          .eq('id', editingChannel.id);

        if (error) throw error;
        toast({ title: 'Channel updated' });
      } else {
        const { error } = await supabase
          .from('user_channels')
          .insert({
            name: formData.name,
            category: formData.category,
            value_millions: parseFloat(formData.value_millions),
            start_date: formData.start_date,
            platform: formData.platform,
            content_type: formData.content_type,
            political_lean: formData.political_lean,
            country: selectedCountry,
            year: selectedYear
          });

        if (error) throw error;
        toast({ title: 'Channel added' });
      }

      setShowEditDialog(false);
      setShowAddDialog(false);
      setEditingChannel(null);
      fetchChannels();
    } catch (error) {
      console.error('Error saving channel:', error);
      toast({ title: 'Failed to save channel', variant: 'destructive' });
    }
  };

  const deleteChannel = async () => {
    if (!channelToDelete) return;

    try {
      const { error } = await supabase
        .from('user_channels')
        .delete()
        .eq('id', channelToDelete.id);

      if (error) throw error;
      
      toast({ title: 'Channel deleted' });
      setShowDeleteDialog(false);
      setChannelToDelete(null);
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({ title: 'Failed to delete channel', variant: 'destructive' });
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Admin Login | Zulu Digital Microscope</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Admin Access</h1>
              <p className="text-muted-foreground mt-2">Enter password to continue</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                />
              </div>
              
              <Button onClick={verifyPassword} disabled={isVerifying} className="w-full">
                {isVerifying ? 'Verifying...' : 'Enter'}
              </Button>
              
              <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Panel | Zulu Digital Microscope</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b bg-card flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Admin Panel</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2000">2000</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as 'all' | 'corporate' | 'independent')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="independent">Independent</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Channel
            </Button>
          </div>
        </header>

        <main className="p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Audience (M)</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Political Lean</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : channels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No channels found for {selectedCountry} ({selectedYear})
                    </TableCell>
                  </TableRow>
                ) : (
                  channels.map(channel => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell className="capitalize">{channel.category}</TableCell>
                      <TableCell>{channel.value_millions}</TableCell>
                      <TableCell>{channel.platform}</TableCell>
                      <TableCell>{channel.political_lean}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(channel)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setChannelToDelete(channel); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>

        {/* Edit/Add Dialog */}
        <Dialog open={showEditDialog || showAddDialog} onOpenChange={(open) => {
          if (!open) {
            setShowEditDialog(false);
            setShowAddDialog(false);
            setEditingChannel(null);
          }
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingChannel ? 'Edit Channel' : 'Add Channel'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="independent">Independent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Monthly Audience (Millions) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value_millions}
                  onChange={(e) => setFormData(prev => ({ ...prev, value_millions: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  placeholder="MM/DD/YYYY"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={formData.platform} onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={formData.content_type} onValueChange={(v) => setFormData(prev => ({ ...prev, content_type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Political Lean</Label>
                <Select value={formData.political_lean} onValueChange={(v) => setFormData(prev => ({ ...prev, political_lean: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select political lean" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLITICAL_LEANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => { setShowEditDialog(false); setShowAddDialog(false); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveChannel} className="flex-1">
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Channel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{channelToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteChannel} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Admin;
