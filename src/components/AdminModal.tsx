import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, X, LogOut, Check, XCircle, Shield, User, Users, MessageSquare, Database, MoreVertical } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { COUNTRIES } from '@/data/mediaData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

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

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'contributor' | null;
}

interface ContributorRequest {
  id: string;
  name: string;
  email: string;
  message: string;
  country: string;
  status: string;
  created_at: string;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
}

const PLATFORMS = ['YouTube', 'Cable TV', 'Broadcast TV', 'Print/Digital', 'Podcast', 'X (Twitter)', 'TikTok', 'Instagram', 'Rumble', 'Substack', 'Radio', 'Web', 'Other'];
const CONTENT_TYPES = ['24h News', 'Daily News Show', 'Long-form Podcast', 'Political Commentary', 'Investigative', 'Documentary', 'Comedy/Political', 'News Clips', 'Newsletter', 'Interview Show', 'Other'];
const POLITICAL_LEANS = ['Far Left', 'Progressive/Left', 'Center-Left', 'Center', 'Center-Right', 'Right', 'Far Right', 'Libertarian', 'Independent', 'Non-partisan'];

const AdminModal: React.FC<AdminModalProps> = ({ open, onClose }) => {
  const { toast } = useToast();
  const { user, isAdmin, isContributor, signIn, signOut, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const [activeTab, setActiveTab] = useState('channels');
  
  // Channels state
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

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<ContributorRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ContributorRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Create contributor state
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: '', password: '', fullName: '', role: 'contributor' as 'admin' | 'contributor' });

  const isAuthenticated = user && isContributor;

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ title: 'Please enter email and password', variant: 'destructive' });
      return;
    }
    
    setIsSigningIn(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({ title: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Signed in successfully' });
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({ title: 'Sign in failed', variant: 'destructive' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out' });
  };

  // Fetch channels
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

  // Fetch users with roles
  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setUsersLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserProfile[] = (profiles || []).map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || null
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch contributor requests
  const fetchRequests = async () => {
    if (!isAdmin) return;
    
    setRequestsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contributor_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({ title: 'Failed to load requests', variant: 'destructive' });
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && open) {
      fetchChannels();
      if (isAdmin) {
        fetchUsers();
        fetchRequests();
      }
    }
  }, [isAuthenticated, isAdmin, selectedCountry, selectedYear, selectedCategory, open]);

  useEffect(() => {
    if (isAuthenticated && open && activeTab === 'users' && isAdmin) {
      fetchUsers();
    } else if (isAuthenticated && open && activeTab === 'requests' && isAdmin) {
      fetchRequests();
    }
  }, [activeTab, isAuthenticated, open, isAdmin]);

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

  // User management functions
  const updateUserRole = async (userId: string, newRole: 'admin' | 'contributor' | null) => {
    try {
      // First, delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Then add new role if not null
      if (newRole) {
        const { error } = await supabase.from('user_roles').insert({
          user_id: userId,
          role: newRole
        });
        if (error) throw error;
      }

      toast({ title: `User role updated to ${newRole || 'none'}` });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Failed to update role', variant: 'destructive' });
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Call edge function to delete user (needs service role)
      const { error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', userId: userToDelete.id }
      });

      if (error) throw error;
      
      toast({ title: 'User deleted' });
      setShowDeleteUserDialog(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const createUser = async () => {
    if (!newUserData.email || !newUserData.password) {
      toast({ title: 'Email and password are required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: { 
          action: 'create', 
          email: newUserData.email,
          password: newUserData.password,
          fullName: newUserData.fullName,
          role: newUserData.role
        }
      });

      if (error) throw error;
      
      toast({ title: 'User created successfully' });
      setShowCreateUserDialog(false);
      setNewUserData({ email: '', password: '', fullName: '', role: 'contributor' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ title: 'Failed to create user', variant: 'destructive' });
    }
  };

  // Request management functions
  const updateRequestStatus = async (requestId: string, status: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('contributor_requests')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({ title: `Request ${status}` });
      setShowRequestDialog(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({ title: 'Failed to update request', variant: 'destructive' });
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('contributor_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      
      toast({ title: 'Request deleted' });
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({ title: 'Failed to delete request', variant: 'destructive' });
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={`${isAuthenticated ? 'max-w-5xl' : 'max-w-sm'} max-h-[90vh] p-0 overflow-hidden`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {authLoading ? (
          <div className="p-6 flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="p-6 pr-12 flex justify-center">
            <div className="w-full max-w-[250px]">
              <DialogHeader>
                <DialogTitle>Contributor Login</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSignIn} disabled={isSigningIn} className="flex-1">
                    {isSigningIn ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>

                {user && !isContributor && (
                  <p className="text-sm text-destructive text-center mt-2">
                    Your account does not have contributor access.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[80vh]">
            <div className="border-b p-4 flex items-center justify-between shrink-0 pr-12">
              <h2 className="font-semibold text-lg">Admin Panel</h2>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b px-4 shrink-0">
                <TabsList className="h-12">
                  <TabsTrigger value="channels" className="gap-2">
                    <Database className="h-4 w-4" />
                    Channels
                  </TabsTrigger>
                  {isAdmin && (
                    <>
                      <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4" />
                        Users
                      </TabsTrigger>
                      <TabsTrigger value="requests" className="gap-2 relative">
                        <MessageSquare className="h-4 w-4" />
                        Requests
                        {pendingRequestsCount > 0 && (
                          <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {pendingRequestsCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </div>

              {/* Channels Tab */}
              <TabsContent value="channels" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center gap-2 flex-wrap">
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger className="w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2000">2000</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as 'all' | 'corporate' | 'independent')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="independent">Independent</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button size="sm" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="whitespace-nowrap">Audience (M)</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Political Lean</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
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
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{users.length} users</span>
                  <Button size="sm" onClick={() => setShowCreateUserDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Create User
                  </Button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[550px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[120px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map(u => (
                              <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.email}</TableCell>
                                <TableCell>{u.full_name || '-'}</TableCell>
                                <TableCell>
                                  <Select 
                                    value={u.role || 'none'} 
                                    onValueChange={(v) => updateUserRole(u.id, v === 'none' ? null : v as 'admin' | 'contributor')}
                                  >
                                    <SelectTrigger className="w-[120px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No role</SelectItem>
                                      <SelectItem value="contributor">Contributor</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => { setUserToDelete(u); setShowDeleteUserDialog(true); }}
                                    disabled={u.id === user?.id}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4">
                  <span className="text-sm text-muted-foreground">
                    {pendingRequestsCount} pending request{pendingRequestsCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[140px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requestsLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : requests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No requests yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            requests.map(req => (
                              <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.name}</TableCell>
                                <TableCell>{req.email}</TableCell>
                                <TableCell>{req.country}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    req.status === 'pending' ? 'secondary' : 
                                    req.status === 'approved' ? 'default' : 'destructive'
                                  }>
                                    {req.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(req.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => { setSelectedRequest(req); setShowRequestDialog(true); }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    {req.status === 'pending' && (
                                      <>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => updateRequestStatus(req.id, 'approved')}
                                        >
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => updateRequestStatus(req.id, 'denied')}
                                        >
                                          <XCircle className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => deleteRequest(req.id)}
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Edit/Add Channel Dialog */}
        <Dialog open={showEditDialog || showAddDialog} onOpenChange={(openState) => {
          if (!openState) {
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

        {/* Delete Channel Confirmation */}
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
              <AlertDialogAction onClick={deleteChannel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{userToDelete?.email}"? This will permanently remove their account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create User Dialog */}
        <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUserData.role} onValueChange={(v) => setNewUserData(prev => ({ ...prev, role: v as 'admin' | 'contributor' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateUserDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={createUser} className="flex-1">
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Request Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contributor Request</DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedRequest.name}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{selectedRequest.country}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Message</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{selectedRequest.message}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={
                    selectedRequest.status === 'pending' ? 'secondary' : 
                    selectedRequest.status === 'approved' ? 'default' : 'destructive'
                  } className="ml-2">
                    {selectedRequest.status}
                  </Badge>
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => updateRequestStatus(selectedRequest.id, 'denied')} 
                      className="flex-1"
                    >
                      Deny
                    </Button>
                    <Button 
                      onClick={() => updateRequestStatus(selectedRequest.id, 'approved')} 
                      className="flex-1"
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default AdminModal;