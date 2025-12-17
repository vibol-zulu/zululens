import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, X, LogOut, Check, XCircle, Shield, User, Users, MessageSquare, Database, MoreVertical, MessageCircle, BarChart3, Trophy, Flame, TrendingUp, Newspaper, ChevronDown, Bell } from 'lucide-react';
import NotificationsTab from '@/components/NotificationsTab';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  role: 'admin' | 'contributor' | 'moderator' | null;
}

interface Submission {
  id: string;
  name: string;
  category: string;
  value_millions: number;
  platform: string;
  content_type: string;
  political_lean: string;
  country: string;
  year: number;
  status: string;
  author_id: string | null;
  created_at: string;
  author_email?: string;
  author_name?: string;
}

interface AdminComment {
  id: string;
  content: string;
  country: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user_email?: string;
  user_name?: string;
}

interface Tier1Visitor {
  id: string;
  name: string;
  email: string;
  country: string;
  created_at: string;
  last_visit_at: string;
  total_visits: number;
  total_time_seconds: number;
}

interface UserSessionSummary {
  user_type: 'tier1' | 'tier2' | 'contributor' | 'moderator';
  user_name: string;
  user_email: string;
  total_sessions: number;
  total_duration_seconds: number;
  total_page_views: number;
  total_interactions: number;
  last_active: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  current_streak: number;
  longest_streak: number;
  total_suggestions: number;
  approved_suggestions: number;
  engagement_score: number;
  last_activity_date: string | null;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
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

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [submissionsStatusFilter, setSubmissionsStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Comments state
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCountry, setCommentsCountry] = useState('United States');
  const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(null);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);

  // Password confirmation state for delete actions
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oAuthHasPassword, setOAuthHasPassword] = useState(false);
  const [showCreatePasswordDialog, setShowCreatePasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [createPasswordError, setCreatePasswordError] = useState('');
  const [pendingDeleteAction, setPendingDeleteAction] = useState<'channel' | 'user' | 'comment' | null>(null);

  // Check if current user signed up with OAuth
  useEffect(() => {
    const checkAuthMethod = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        // Check identities to determine sign-in method
        const hasEmailIdentity = currentUser.identities?.some(i => i.provider === 'email');
        const hasOAuthIdentity = currentUser.identities?.some(i => i.provider === 'google' || i.provider === 'github' || i.provider === 'facebook');
        
        // User is OAuth if they have OAuth identity but NO email identity (meaning they never set a password)
        if (hasOAuthIdentity && !hasEmailIdentity) {
          setIsOAuthUser(true);
          setOAuthHasPassword(false);
        } else {
          // User signed up with email/password OR has added a password to their OAuth account
          setIsOAuthUser(false);
          setOAuthHasPassword(true);
        }
      }
    };
    if (user) {
      checkAuthMethod();
    }
  }, [user]);


  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<UserSessionSummary[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsUserType, setAnalyticsUserType] = useState<'all' | 'tier1' | 'tier2' | 'contributor' | 'moderator'>('all');

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // News state
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showNewsDialog, setShowNewsDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);
  const [showDeleteNewsDialog, setShowDeleteNewsDialog] = useState(false);
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    category: 'update',
    is_published: true
  });

  // Create contributor state
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: '', password: '', fullName: '', role: 'member' as 'member' | 'admin' | 'contributor' | 'moderator' });

  // Selection state for bulk actions
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [selectedNews, setSelectedNews] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const isAuthenticated = user && isAdmin;

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

  // Fetch submissions (channel suggestions)
  const fetchSubmissions = async () => {
    if (!isAdmin) return;
    
    setSubmissionsLoading(true);
    try {
      let query = supabase
        .from('user_channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsStatusFilter !== 'all') {
        query = query.eq('status', submissionsStatusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set((data || []).map(s => s.author_id).filter(Boolean))];
      let profiles: { id: string; email: string; full_name: string | null }[] = [];
      
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', authorIds as string[]);
        profiles = profilesData || [];
      }

      const submissionsWithAuthors: Submission[] = (data || []).map(sub => {
        const profile = profiles.find(p => p.id === sub.author_id);
        return {
          ...sub,
          author_email: profile?.email,
          author_name: profile?.full_name || undefined
        };
      });

      setSubmissions(submissionsWithAuthors);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({ title: 'Failed to load submissions', variant: 'destructive' });
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Fetch comments for admin
  const fetchComments = async () => {
    if (!isAdmin) return;
    
    setCommentsLoading(true);
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('country', commentsCountry)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Fetch user profiles for comments
      const userIds = [...new Set((commentsData || []).map(c => c.user_id))];
      let profiles: { id: string; email: string; full_name: string | null }[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      const commentsWithUsers: AdminComment[] = (commentsData || []).map(comment => {
        const profile = profiles.find(p => p.id === comment.user_id);
        return {
          ...comment,
          user_email: profile?.email,
          user_name: profile?.full_name || undefined
        };
      });

      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({ title: 'Failed to load comments', variant: 'destructive' });
    } finally {
      setCommentsLoading(false);
    }
  };

  // Password verification helper
  const verifyPassword = async (): Promise<boolean> => {
    // For OAuth users without password, they need to create one first
    if (isOAuthUser && !oAuthHasPassword) {
      setDeletePasswordError('You need to create a password first');
      return false;
    }
    
    if (!user?.email || !deletePassword) {
      setDeletePasswordError('Password is required');
      return false;
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });
      
      if (error) {
        setDeletePasswordError('Incorrect password');
        return false;
      }
      
      setDeletePasswordError('');
      return true;
    } catch {
      setDeletePasswordError('Failed to verify password');
      return false;
    }
  };

  // Create password for OAuth users
  const handleCreatePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setCreatePasswordError('Both fields are required');
      return;
    }
    
    if (newPassword.length < 6) {
      setCreatePasswordError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setCreatePasswordError('Passwords do not match');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        setCreatePasswordError(error.message);
        return;
      }
      
      setOAuthHasPassword(true);
      setShowCreatePasswordDialog(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setCreatePasswordError('');
      toast({ title: 'Password created successfully. You can now confirm delete actions.' });
      
      // Re-open the appropriate delete dialog
      if (pendingDeleteAction === 'channel') setShowDeleteDialog(true);
      if (pendingDeleteAction === 'user') setShowDeleteUserDialog(true);
      if (pendingDeleteAction === 'comment') setShowDeleteCommentDialog(true);
      setPendingDeleteAction(null);
    } catch {
      setCreatePasswordError('Failed to create password');
    }
  };

  // Handle delete button click for OAuth users
  const handleDeleteClick = (type: 'channel' | 'user' | 'comment', item: Channel | UserProfile | AdminComment) => {
    if (isOAuthUser && !oAuthHasPassword) {
      setPendingDeleteAction(type);
      if (type === 'channel') setChannelToDelete(item as Channel);
      if (type === 'user') setUserToDelete(item as UserProfile);
      if (type === 'comment') setCommentToDelete(item as AdminComment);
      setShowCreatePasswordDialog(true);
    } else {
      if (type === 'channel') {
        setChannelToDelete(item as Channel);
        setShowDeleteDialog(true);
      }
      if (type === 'user') {
        setUserToDelete(item as UserProfile);
        setShowDeleteUserDialog(true);
      }
      if (type === 'comment') {
        setCommentToDelete(item as AdminComment);
        setShowDeleteCommentDialog(true);
      }
    }
  };

  const resetDeleteState = () => {
    setDeletePassword('');
    setDeletePasswordError('');
  };

  // Delete comment
  const deleteComment = async () => {
    if (!commentToDelete) return;
    
    const isValid = await verifyPassword();
    if (!isValid) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentToDelete.id);

      if (error) throw error;
      
      toast({ title: 'Comment deleted' });
      setShowDeleteCommentDialog(false);
      setCommentToDelete(null);
      resetDeleteState();
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!isAdmin) return;
    
    setAnalyticsLoading(true);
    try {
      // Fetch Tier 1 visitors
      const { data: tier1Data, error: tier1Error } = await supabase
        .from('tier1_visitors')
        .select('*')
        .order('last_visit_at', { ascending: false });

      if (tier1Error) throw tier1Error;

      // Fetch sessions for Tier 1 visitors
      const { data: visitorSessions } = await supabase
        .from('user_sessions')
        .select('visitor_id, duration_seconds, page_views, interactions, ended_at')
        .not('visitor_id', 'is', null);

      // Fetch Tier 2+ users with roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Fetch sessions for authenticated users
      const { data: userSessions } = await supabase
        .from('user_sessions')
        .select('user_id, duration_seconds, page_views, interactions, ended_at')
        .not('user_id', 'is', null);

      const summaries: UserSessionSummary[] = [];

      // Process Tier 1 visitors
      (tier1Data || []).forEach(visitor => {
        const sessions = (visitorSessions || []).filter(s => s.visitor_id === visitor.id);
        summaries.push({
          user_type: 'tier1',
          user_name: visitor.name,
          user_email: visitor.email,
          total_sessions: visitor.total_visits,
          total_duration_seconds: sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0),
          total_page_views: sessions.reduce((acc, s) => acc + (s.page_views || 0), 0),
          total_interactions: sessions.reduce((acc, s) => acc + (s.interactions || 0), 0),
          last_active: visitor.last_visit_at
        });
      });

      // Process Tier 2+ users (exclude admins)
      (profiles || []).forEach(profile => {
        const userRole = (roles || []).find(r => r.user_id === profile.id);
        if (userRole?.role === 'admin') return; // Exclude admins

        const sessions = (userSessions || []).filter(s => s.user_id === profile.id);
        const lastSession = sessions.sort((a, b) => 
          new Date(b.ended_at || 0).getTime() - new Date(a.ended_at || 0).getTime()
        )[0];

        let userType: 'tier2' | 'contributor' | 'moderator' = 'tier2';
        if (userRole?.role === 'contributor') userType = 'contributor';
        if (userRole?.role === 'moderator') userType = 'moderator';

        summaries.push({
          user_type: userType,
          user_name: profile.full_name || 'Unknown',
          user_email: profile.email,
          total_sessions: sessions.length || 1,
          total_duration_seconds: sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0),
          total_page_views: sessions.reduce((acc, s) => acc + (s.page_views || 0), 0),
          total_interactions: sessions.reduce((acc, s) => acc + (s.interactions || 0), 0),
          last_active: lastSession?.ended_at || profile.created_at
        });
      });

      setAnalyticsData(summaries);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({ title: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    if (!isAdmin) return;
    
    setLeaderboardLoading(true);
    try {
      // Fetch all contributor metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('contributor_metrics')
        .select('*')
        .order('engagement_score', { ascending: false });

      if (metricsError) throw metricsError;

      if (!metricsData || metricsData.length === 0) {
        setLeaderboardData([]);
        return;
      }

      // Fetch user profiles for names
      const userIds = metricsData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Only include users who have the contributor role
      const { data: contributorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'contributor');

      const contributorUserIds = new Set(contributorRoles?.map(r => r.user_id) || []);

      const entries: LeaderboardEntry[] = metricsData
        .filter(m => contributorUserIds.has(m.user_id))
        .map((m, idx) => {
          const profile = profiles?.find(p => p.id === m.user_id);
          return {
            rank: idx + 1,
            user_id: m.user_id,
            user_name: profile?.full_name || 'Unknown',
            user_email: profile?.email || '',
            current_streak: m.current_streak,
            longest_streak: m.longest_streak,
            total_suggestions: m.total_suggestions,
            approved_suggestions: m.approved_suggestions,
            engagement_score: m.engagement_score,
            last_activity_date: m.last_activity_date
          };
        });

      setLeaderboardData(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({ title: 'Failed to load leaderboard', variant: 'destructive' });
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Fetch news items
  const fetchNews = async () => {
    if (!isAdmin) return;
    
    setNewsLoading(true);
    try {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsItems(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({ title: 'Failed to load news', variant: 'destructive' });
    } finally {
      setNewsLoading(false);
    }
  };

  // Save news item
  const saveNews = async () => {
    if (!newsFormData.title || !newsFormData.content) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }

    try {
      if (editingNews) {
        const { error } = await supabase
          .from('news_updates')
          .update({
            title: newsFormData.title,
            content: newsFormData.content,
            category: newsFormData.category,
            is_published: newsFormData.is_published
          })
          .eq('id', editingNews.id);

        if (error) throw error;
        toast({ title: 'News updated' });
      } else {
        const { error } = await supabase
          .from('news_updates')
          .insert({
            title: newsFormData.title,
            content: newsFormData.content,
            category: newsFormData.category,
            is_published: newsFormData.is_published,
            created_by: user?.id
          });

        if (error) throw error;
        toast({ title: 'News added' });
      }

      setShowNewsDialog(false);
      setEditingNews(null);
      setNewsFormData({ title: '', content: '', category: 'update', is_published: true });
      fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
      toast({ title: 'Failed to save news', variant: 'destructive' });
    }
  };

  // Delete news item
  const deleteNews = async () => {
    if (!newsToDelete) return;

    try {
      const { error } = await supabase
        .from('news_updates')
        .delete()
        .eq('id', newsToDelete.id);

      if (error) throw error;
      toast({ title: 'News deleted' });
      setShowDeleteNewsDialog(false);
      setNewsToDelete(null);
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast({ title: 'Failed to delete news', variant: 'destructive' });
    }
  };

  // Handle edit news
  const handleEditNews = (item: NewsItem) => {
    setEditingNews(item);
    setNewsFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      is_published: item.is_published
    });
    setShowNewsDialog(true);
  };

  // Handle add news
  const handleAddNews = () => {
    setEditingNews(null);
    setNewsFormData({ title: '', content: '', category: 'update', is_published: true });
    setShowNewsDialog(true);
  };

  useEffect(() => {
    if (isAuthenticated && open) {
      fetchChannels();
      if (isAdmin) {
        fetchUsers();
        fetchSubmissions();
      }
    }
  }, [isAuthenticated, isAdmin, selectedCountry, selectedYear, selectedCategory, open]);

  useEffect(() => {
    if (isAuthenticated && open && activeTab === 'users' && isAdmin) {
      fetchUsers();
    } else if (isAuthenticated && open && activeTab === 'submissions' && isAdmin) {
      fetchSubmissions();
    } else if (isAuthenticated && open && activeTab === 'comments' && isAdmin) {
      fetchComments();
    } else if (isAuthenticated && open && activeTab === 'analytics' && isAdmin) {
      fetchAnalytics();
    } else if (isAuthenticated && open && activeTab === 'leaderboard' && isAdmin) {
      fetchLeaderboard();
    } else if (isAuthenticated && open && activeTab === 'news' && isAdmin) {
      fetchNews();
    }
  }, [activeTab, isAuthenticated, open, isAdmin]);

  // Refetch submissions when filter changes
  useEffect(() => {
    if (isAuthenticated && open && activeTab === 'submissions' && isAdmin) {
      fetchSubmissions();
    }
  }, [submissionsStatusFilter]);

  useEffect(() => {
    if (isAuthenticated && open && activeTab === 'comments' && isAdmin) {
      fetchComments();
    }
  }, [commentsCountry]);

  useEffect(() => {
    if (isAuthenticated && open && activeTab === 'analytics' && isAdmin) {
      fetchAnalytics();
    }
  }, [analyticsUserType]);

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
    
    const isValid = await verifyPassword();
    if (!isValid) return;

    try {
      const { error } = await supabase
        .from('user_channels')
        .delete()
        .eq('id', channelToDelete.id);

      if (error) throw error;
      
      toast({ title: 'Channel deleted' });
      setShowDeleteDialog(false);
      setChannelToDelete(null);
      resetDeleteState();
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({ title: 'Failed to delete channel', variant: 'destructive' });
    }
  };

  // User management functions
  const updateUserRole = async (userId: string, newRole: 'admin' | 'contributor' | 'moderator' | null) => {
    const roleDisplayNames: Record<string, string> = {
      admin: 'Admin',
      moderator: 'Moderator', 
      contributor: 'Contributor',
    };
    
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

      toast({ title: `User role updated to ${newRole ? roleDisplayNames[newRole] : 'Member'}` });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Failed to update role', variant: 'destructive' });
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    const isValid = await verifyPassword();
    if (!isValid) return;

    try {
      // Call edge function to delete user (needs service role)
      const { error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', userId: userToDelete.id }
      });

      if (error) throw error;
      
      toast({ title: 'User deleted' });
      setShowDeleteUserDialog(false);
      setUserToDelete(null);
      resetDeleteState();
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
          ...(newUserData.role === 'member' ? {} : { role: newUserData.role })
        }
      });

      if (error) throw error;
      
      toast({ title: 'User created successfully' });
      setShowCreateUserDialog(false);
      setNewUserData({ email: '', password: '', fullName: '', role: 'member' as 'member' | 'admin' | 'contributor' | 'moderator' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ title: 'Failed to create user', variant: 'destructive' });
    }
  };

  // Submission management functions
  const updateSubmissionStatus = async (submissionId: string, status: 'approved' | 'rejected', authorId: string | null) => {
    try {
      const { error } = await supabase
        .from('user_channels')
        .update({ 
          status, 
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          approved_by: status === 'approved' ? user?.id : null
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Notification is now handled by database trigger
      toast({ title: `Submission ${status}` });
      setShowSubmissionDialog(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({ title: 'Failed to update submission', variant: 'destructive' });
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('user_channels')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;
      
      toast({ title: 'Submission deleted' });
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({ title: 'Failed to delete submission', variant: 'destructive' });
    }
  };

  // Bulk action toggle functions
  const toggleSelectChannel = (id: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllChannels = () => {
    if (selectedChannels.size === channels.length) {
      setSelectedChannels(new Set());
    } else {
      setSelectedChannels(new Set(channels.map(c => c.id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllUsers = () => {
    const selectableUsers = users.filter(u => u.id !== user?.id);
    if (selectedUsers.size === selectableUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(selectableUsers.map(u => u.id)));
    }
  };

  const toggleSelectSubmission = (id: string) => {
    setSelectedSubmissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllSubmissions = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map(s => s.id)));
    }
  };

  const toggleSelectComment = (id: string) => {
    setSelectedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllComments = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map(c => c.id)));
    }
  };

  const toggleSelectNews = (id: string) => {
    setSelectedNews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllNews = () => {
    if (selectedNews.size === newsItems.length) {
      setSelectedNews(new Set());
    } else {
      setSelectedNews(new Set(newsItems.map(n => n.id)));
    }
  };

  // Bulk action handlers
  const handleBulkDeleteChannels = async () => {
    if (selectedChannels.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_channels')
        .delete()
        .in('id', Array.from(selectedChannels));

      if (error) throw error;

      toast({ title: `${selectedChannels.size} channels deleted` });
      setSelectedChannels(new Set());
      fetchChannels();
    } catch (error) {
      console.error('Bulk delete channels error:', error);
      toast({ title: 'Failed to delete channels', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.size === 0) return;
    setBulkActionLoading(true);
    try {
      // Delete users via edge function
      for (const userId of selectedUsers) {
        await supabase.functions.invoke('manage-users', {
          body: { action: 'delete', userId }
        });
      }

      toast({ title: `${selectedUsers.size} users deleted` });
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Bulk delete users error:', error);
      toast({ title: 'Failed to delete users', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkApproveSubmissions = async () => {
    if (selectedSubmissions.size === 0 || !user) return;
    setBulkActionLoading(true);
    try {
      const subsToApprove = submissions.filter(s => selectedSubmissions.has(s.id) && s.status === 'pending');
      
      const { error } = await supabase
        .from('user_channels')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedSubmissions));

      if (error) throw error;

      // Send notifications to authors
      const notifications = subsToApprove
        .filter(s => s.author_id)
        .map(s => ({
          title: 'Submission Approved!',
          message: `Your channel submission "${s.name}" has been approved.`,
          type: 'submission_review',
          target_role: 'member',
          target_user_id: s.author_id,
          created_by: user.id
        }));

      if (notifications.length > 0) {
        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) {
          console.error('Failed to send bulk notifications:', notifError);
        }
      }

      toast({ title: `${selectedSubmissions.size} submissions approved` });
      setSelectedSubmissions(new Set());
      fetchSubmissions();
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast({ title: 'Failed to approve submissions', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRejectSubmissions = async () => {
    if (selectedSubmissions.size === 0 || !user) return;
    setBulkActionLoading(true);
    try {
      const subsToReject = submissions.filter(s => selectedSubmissions.has(s.id) && s.status === 'pending');
      
      const { error } = await supabase
        .from('user_channels')
        .update({ status: 'rejected' })
        .in('id', Array.from(selectedSubmissions));

      if (error) throw error;

      // Send notifications to authors
      const notifications = subsToReject
        .filter(s => s.author_id)
        .map(s => ({
          title: 'Submission Rejected',
          message: `Your channel submission "${s.name}" was not approved.`,
          type: 'submission_review',
          target_role: 'member',
          target_user_id: s.author_id,
          created_by: user.id
        }));

      if (notifications.length > 0) {
        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) {
          console.error('Failed to send bulk rejection notifications:', notifError);
        }
      }

      toast({ title: `${selectedSubmissions.size} submissions rejected` });
      setSelectedSubmissions(new Set());
      fetchSubmissions();
    } catch (error) {
      console.error('Bulk reject error:', error);
      toast({ title: 'Failed to reject submissions', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteSubmissions = async () => {
    if (selectedSubmissions.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_channels')
        .delete()
        .in('id', Array.from(selectedSubmissions));

      if (error) throw error;

      toast({ title: `${selectedSubmissions.size} submissions deleted` });
      setSelectedSubmissions(new Set());
      fetchSubmissions();
    } catch (error) {
      console.error('Bulk delete submissions error:', error);
      toast({ title: 'Failed to delete submissions', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteComments = async () => {
    if (selectedComments.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .in('id', Array.from(selectedComments));

      if (error) throw error;

      toast({ title: `${selectedComments.size} comments deleted` });
      setSelectedComments(new Set());
      fetchComments();
    } catch (error) {
      console.error('Bulk delete comments error:', error);
      toast({ title: 'Failed to delete comments', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteNews = async () => {
    if (selectedNews.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('news_updates')
        .delete()
        .in('id', Array.from(selectedNews));

      if (error) throw error;

      toast({ title: `${selectedNews.size} news items deleted` });
      setSelectedNews(new Set());
      fetchNews();
    } catch (error) {
      console.error('Bulk delete news error:', error);
      toast({ title: 'Failed to delete news', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;

  // Close modal if user is not admin
  useEffect(() => {
    if (!authLoading && open && !isAuthenticated) {
      onClose();
    }
  }, [authLoading, open, isAuthenticated, onClose]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
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
                      <TabsTrigger value="submissions" className="gap-2 relative">
                        <MessageSquare className="h-4 w-4" />
                        Submissions
                        {pendingSubmissionsCount > 0 && (
                          <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {pendingSubmissionsCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="comments" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Comments
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger value="leaderboard" className="gap-2">
                        <Trophy className="h-4 w-4" />
                        Leaderboard
                      </TabsTrigger>
                      <TabsTrigger value="news" className="gap-2">
                        <Newspaper className="h-4 w-4" />
                        News
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </div>

              {/* Channels Tab */}
              <TabsContent value="channels" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center gap-2 flex-wrap">
                  {selectedChannels.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                          Bulk Actions ({selectedChannels.size})
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleBulkDeleteChannels}>
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
                  
                  <Button size="sm" onClick={handleAdd} className="ml-auto">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[650px] text-xs">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={selectedChannels.size === channels.length && channels.length > 0}
                                onCheckedChange={toggleSelectAllChannels}
                              />
                            </TableHead>
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
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : channels.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No channels found for {selectedCountry} ({selectedYear})
                              </TableCell>
                            </TableRow>
                          ) : (
                            channels.map(channel => (
                              <TableRow key={channel.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedChannels.has(channel.id)}
                                    onCheckedChange={() => toggleSelectChannel(channel.id)}
                                  />
                                </TableCell>
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
                                      onClick={() => handleDeleteClick('channel', channel)}
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
                <div className="border-b p-4 flex items-center gap-2 flex-wrap">
                  {selectedUsers.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                          Bulk Actions ({selectedUsers.size})
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleBulkDeleteUsers}>
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <span className="text-sm text-muted-foreground">{users.length} users</span>
                  <Button size="sm" onClick={() => setShowCreateUserDialog(true)} className="ml-auto">
                    <Plus className="h-4 w-4 mr-1" /> Create User
                  </Button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[600px] text-xs">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={selectedUsers.size === users.filter(u => u.id !== user?.id).length && users.length > 1}
                                onCheckedChange={toggleSelectAllUsers}
                              />
                            </TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map(u => (
                              <TableRow key={u.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedUsers.has(u.id)}
                                    onCheckedChange={() => toggleSelectUser(u.id)}
                                    disabled={u.id === user?.id}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{u.email}</TableCell>
                                <TableCell>{u.full_name || '-'}</TableCell>
                                <TableCell>
                                  <Select 
                                    value={u.role || 'none'} 
                                    onValueChange={(v) => updateUserRole(u.id, v === 'none' ? null : v as 'admin' | 'contributor' | 'moderator')}
                                  >
                                    <SelectTrigger className="w-[120px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Member</SelectItem>
                                      <SelectItem value="contributor">Contributor</SelectItem>
                                      <SelectItem value="moderator">Moderator</SelectItem>
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
                                    onClick={() => handleDeleteClick('user', u)}
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

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center gap-2 flex-wrap">
                  <Select value={submissionsStatusFilter} onValueChange={(v) => setSubmissionsStatusFilter(v as 'all' | 'pending' | 'approved' | 'rejected')}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {pendingSubmissionsCount} pending submission{pendingSubmissionsCount !== 1 ? 's' : ''}
                  </span>
                  
                  {selectedSubmissions.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                          Bulk Actions ({selectedSubmissions.size})
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleBulkApproveSubmissions}>
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                          Approve Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkRejectSubmissions}>
                          <XCircle className="h-4 w-4 mr-2 text-destructive" />
                          Reject Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkDeleteSubmissions}>
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[700px] text-xs">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={selectedSubmissions.size === submissions.length && submissions.length > 0}
                                onCheckedChange={toggleSelectAllSubmissions}
                              />
                            </TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissionsLoading ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : submissions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                No submissions found
                              </TableCell>
                            </TableRow>
                          ) : (
                            submissions.map(sub => (
                              <TableRow key={sub.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedSubmissions.has(sub.id)}
                                    onCheckedChange={() => toggleSelectSubmission(sub.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{sub.name}</TableCell>
                                <TableCell className="capitalize">{sub.category}</TableCell>
                                <TableCell>{sub.country}</TableCell>
                                <TableCell>{sub.year}</TableCell>
                                <TableCell className="text-sm">
                                  {sub.author_name || sub.author_email?.split('@')[0] || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    sub.status === 'pending' ? 'secondary' : 
                                    sub.status === 'approved' ? 'default' : 'destructive'
                                  }>
                                    {sub.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(sub.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => { setSelectedSubmission(sub); setShowSubmissionDialog(true); }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    {sub.status === 'pending' && (
                                      <>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => updateSubmissionStatus(sub.id, 'approved', sub.author_id)}
                                        >
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => updateSubmissionStatus(sub.id, 'rejected', sub.author_id)}
                                        >
                                          <XCircle className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => deleteSubmission(sub.id)}
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

              {/* Comments Tab */}
              <TabsContent value="comments" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center gap-2 flex-wrap">
                  <Select value={commentsCountry} onValueChange={setCommentsCountry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground ml-2">{comments.length} comments</span>
                  
                  {selectedComments.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={bulkActionLoading} className="ml-auto">
                          Bulk Actions ({selectedComments.size})
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleBulkDeleteComments}>
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[700px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectedComments.size === comments.length && comments.length > 0}
                              onCheckedChange={toggleSelectAllComments}
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="w-[40%]">Content</TableHead>
                          <TableHead>Reply To</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commentsLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : comments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No comments found for {commentsCountry}
                            </TableCell>
                          </TableRow>
                        ) : (
                          comments.map(comment => (
                            <TableRow key={comment.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedComments.has(comment.id)}
                                  onCheckedChange={() => toggleSelectComment(comment.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{comment.user_name || 'Unknown'}</span>
                                  <span className="text-xs text-muted-foreground">{comment.user_email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm line-clamp-2">{comment.content}</p>
                                {comment.is_edited && (
                                  <span className="text-xs text-muted-foreground">(edited)</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {comment.parent_id ? 'Reply' : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteClick('comment', comment)}
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

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center gap-4 flex-wrap">
                  <Select value={analyticsUserType} onValueChange={(v) => setAnalyticsUserType(v as typeof analyticsUserType)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="tier1">Tier 1 (Visitors)</SelectItem>
                      <SelectItem value="tier2">Tier 2 (Members)</SelectItem>
                      <SelectItem value="contributor">Contributors</SelectItem>
                      <SelectItem value="moderator">Moderators</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-4 ml-auto text-sm text-muted-foreground">
                    <span>Total Users: {analyticsData.filter(d => analyticsUserType === 'all' || d.user_type === analyticsUserType).length}</span>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b">
                  {(() => {
                    const filtered = analyticsData.filter(d => analyticsUserType === 'all' || d.user_type === analyticsUserType);
                    const totalSessions = filtered.reduce((acc, d) => acc + d.total_sessions, 0);
                    const totalDuration = filtered.reduce((acc, d) => acc + d.total_duration_seconds, 0);
                    const totalPageViews = filtered.reduce((acc, d) => acc + d.total_page_views, 0);
                    const totalInteractions = filtered.reduce((acc, d) => acc + d.total_interactions, 0);
                    const avgDuration = filtered.length > 0 ? Math.round(totalDuration / filtered.length) : 0;
                    
                    const formatDuration = (seconds: number) => {
                      if (seconds < 60) return `${seconds}s`;
                      const mins = Math.floor(seconds / 60);
                      const secs = seconds % 60;
                      return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m ${secs}s`;
                    };
                    
                    return (
                      <>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{totalSessions}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time on Site</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{totalPageViews}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Interactions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{totalInteractions}</div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[700px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Sessions</TableHead>
                          <TableHead>Time on Site</TableHead>
                          <TableHead>Page Views</TableHead>
                          <TableHead>Interactions</TableHead>
                          <TableHead>Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : analyticsData.filter(d => analyticsUserType === 'all' || d.user_type === analyticsUserType).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No analytics data found
                            </TableCell>
                          </TableRow>
                        ) : (
                          analyticsData
                            .filter(d => analyticsUserType === 'all' || d.user_type === analyticsUserType)
                            .sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime())
                            .map((data, idx) => {
                              const formatDuration = (seconds: number) => {
                                if (seconds < 60) return `${seconds}s`;
                                const mins = Math.floor(seconds / 60);
                                return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
                              };
                              
                              const typeLabels = {
                                tier1: 'Visitor',
                                tier2: 'Member',
                                contributor: 'Contributor',
                                moderator: 'Moderator'
                              };
                              
                              const typeBadgeColors = {
                                tier1: 'bg-slate-100 text-slate-800',
                                tier2: 'bg-blue-100 text-blue-800',
                                contributor: 'bg-green-100 text-green-800',
                                moderator: 'bg-purple-100 text-purple-800'
                              };
                              
                              return (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm">{data.user_name}</span>
                                      <span className="text-xs text-muted-foreground">{data.user_email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={typeBadgeColors[data.user_type]}>
                                      {typeLabels[data.user_type]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{data.total_sessions}</TableCell>
                                  <TableCell>{formatDuration(data.total_duration_seconds)}</TableCell>
                                  <TableCell>{data.total_page_views}</TableCell>
                                  <TableCell>{data.total_interactions}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(data.last_active).toLocaleDateString()}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center justify-between flex-wrap">
                  <div>
                    <h3 className="font-medium">Contributor Promotion Leaderboard</h3>
                    <p className="text-sm text-muted-foreground">Top contributors ranked by engagement for potential promotion to Moderator</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{leaderboardData.length} contributors</span>
                </div>

                {/* Summary Cards */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b">
                  {(() => {
                    const topContributor = leaderboardData[0];
                    const avgScore = leaderboardData.length > 0 
                      ? Math.round(leaderboardData.reduce((acc, d) => acc + d.engagement_score, 0) / leaderboardData.length)
                      : 0;
                    const totalApproved = leaderboardData.reduce((acc, d) => acc + d.approved_suggestions, 0);
                    const activeContributors = leaderboardData.filter(d => {
                      if (!d.last_activity_date) return false;
                      const lastActive = new Date(d.last_activity_date);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return lastActive >= weekAgo;
                    }).length;
                    
                    return (
                      <>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Top Contributor</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-lg font-bold truncate">{topContributor?.user_name || '-'}</div>
                            <div className="text-xs text-muted-foreground">Score: {topContributor?.engagement_score || 0}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Engagement</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{avgScore}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Approved</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{totalApproved}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active This Week</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{activeContributors}</div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[800px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Rank</TableHead>
                          <TableHead>Contributor</TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              Streak
                            </div>
                          </TableHead>
                          <TableHead className="text-center">Best Streak</TableHead>
                          <TableHead className="text-center">Suggestions</TableHead>
                          <TableHead className="text-center">Approved</TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Score
                            </div>
                          </TableHead>
                          <TableHead>Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboardLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : leaderboardData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No contributors found. Promote members to contributors to see them here.
                            </TableCell>
                          </TableRow>
                        ) : (
                          leaderboardData.map((entry) => {
                            const getRankDisplay = (rank: number) => {
                              if (rank === 1) return <span className="text-yellow-500 font-bold">🥇</span>;
                              if (rank === 2) return <span className="text-gray-400 font-bold">🥈</span>;
                              if (rank === 3) return <span className="text-amber-600 font-bold">🥉</span>;
                              return <span className="text-muted-foreground">#{rank}</span>;
                            };
                            
                            const isEligibleForPromotion = entry.approved_suggestions >= 50;
                            
                            return (
                              <TableRow key={entry.user_id} className={isEligibleForPromotion ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                                <TableCell className="font-medium text-center">
                                  {getRankDisplay(entry.rank)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{entry.user_name}</span>
                                      {isEligibleForPromotion && (
                                        <Badge variant="default" className="bg-green-600 text-xs">
                                          Promotion Ready
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{entry.user_email}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">{entry.current_streak}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{entry.longest_streak}</TableCell>
                                <TableCell className="text-center">{entry.total_suggestions}</TableCell>
                                <TableCell className="text-center">
                                  <span className="font-medium text-green-600">{entry.approved_suggestions}</span>
                                  <span className="text-muted-foreground">/50</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="font-bold">
                                    {entry.engagement_score}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {entry.last_activity_date 
                                    ? new Date(entry.last_activity_date).toLocaleDateString()
                                    : 'Never'
                                  }
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* News Tab */}
              <TabsContent value="news" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center gap-2 flex-wrap">
                  {selectedNews.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                          Bulk Actions ({selectedNews.size})
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleBulkDeleteNews}>
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <span className="text-sm text-muted-foreground">{newsItems.length} news items</span>
                  <Button onClick={handleAddNews} size="sm" className="gap-2 ml-auto">
                    <Plus className="h-4 w-4" />
                    Add News
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[600px] text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectedNews.size === newsItems.length && newsItems.length > 0}
                              onCheckedChange={toggleSelectAllNews}
                            />
                          </TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newsLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : newsItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No news items yet. Add one to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          newsItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedNews.has(item.id)}
                                  onCheckedChange={() => toggleSelectNews(item.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[300px]">
                                  <span className="font-medium">{item.title}</span>
                                  <p className="text-xs text-muted-foreground truncate">{item.content}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{item.category}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.is_published ? 'default' : 'secondary'}>
                                  {item.is_published ? 'Published' : 'Draft'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditNews(item)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => { setNewsToDelete(item); setShowDeleteNewsDialog(true); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
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

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="flex-1 overflow-auto p-4">
                  <NotificationsTab isActive={activeTab === 'notifications'} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* News Dialog */}
        <Dialog open={showNewsDialog} onOpenChange={(open) => {
          if (!open) {
            setShowNewsDialog(false);
            setEditingNews(null);
            setNewsFormData({ title: '', content: '', category: 'update', is_published: true });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNews ? 'Edit News' : 'Add News'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newsFormData.title}
                  onChange={(e) => setNewsFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="News title"
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newsFormData.content}
                  onChange={(e) => setNewsFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="News content"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newsFormData.category} 
                  onValueChange={(v) => setNewsFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">New Feature</SelectItem>
                    <SelectItem value="update">Data Update</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={newsFormData.is_published}
                  onChange={(e) => setNewsFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNewsDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveNews} className="flex-1">
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete News Confirmation */}
        <AlertDialog open={showDeleteNewsDialog} onOpenChange={setShowDeleteNewsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete News</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{newsToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteNews} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
        <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) resetDeleteState(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Channel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{channelToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="delete-channel-password">Enter your password to confirm</Label>
              <Input
                id="delete-channel-password"
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(''); }}
                placeholder="Your password"
                className="mt-2"
              />
              {deletePasswordError && (
                <p className="text-sm text-destructive mt-1">{deletePasswordError}</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetDeleteState}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteChannel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={showDeleteUserDialog} onOpenChange={(open) => { setShowDeleteUserDialog(open); if (!open) resetDeleteState(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{userToDelete?.email}"? This will permanently remove their account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="delete-user-password">Enter your password to confirm</Label>
              <Input
                id="delete-user-password"
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(''); }}
                placeholder="Your password"
                className="mt-2"
              />
              {deletePasswordError && (
                <p className="text-sm text-destructive mt-1">{deletePasswordError}</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetDeleteState}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Comment Confirmation */}
        <AlertDialog open={showDeleteCommentDialog} onOpenChange={(open) => { setShowDeleteCommentDialog(open); if (!open) resetDeleteState(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="delete-comment-password">Enter your password to confirm</Label>
              <Input
                id="delete-comment-password"
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(''); }}
                placeholder="Your password"
                className="mt-2"
              />
              {deletePasswordError && (
                <p className="text-sm text-destructive mt-1">{deletePasswordError}</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetDeleteState}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                <Select value={newUserData.role} onValueChange={(v) => setNewUserData(prev => ({ ...prev, role: v as 'member' | 'admin' | 'contributor' | 'moderator' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
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

        {/* View Submission Dialog */}
        <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            
            {selectedSubmission && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Channel Name</Label>
                    <p className="font-medium">{selectedSubmission.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium capitalize">{selectedSubmission.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Country</Label>
                    <p className="font-medium">{selectedSubmission.country}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Year</Label>
                    <p className="font-medium">{selectedSubmission.year}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Platform</Label>
                    <p className="font-medium">{selectedSubmission.platform}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Content Type</Label>
                    <p className="font-medium">{selectedSubmission.content_type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Audience (Millions)</Label>
                    <p className="font-medium">{selectedSubmission.value_millions}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Political Lean</Label>
                    <p className="font-medium">{selectedSubmission.political_lean}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Submitted By</Label>
                  <p className="font-medium">
                    {selectedSubmission.author_name || selectedSubmission.author_email || 'Unknown'}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={
                    selectedSubmission.status === 'pending' ? 'secondary' : 
                    selectedSubmission.status === 'approved' ? 'default' : 'destructive'
                  } className="ml-2">
                    {selectedSubmission.status}
                  </Badge>
                </div>

                {selectedSubmission.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'rejected', selectedSubmission.author_id)} 
                      className="flex-1"
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'approved', selectedSubmission.author_id)} 
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

        {/* Create Password Dialog for OAuth users */}
        <Dialog open={showCreatePasswordDialog} onOpenChange={(open) => { 
          setShowCreatePasswordDialog(open); 
          if (!open) {
            setNewPassword('');
            setConfirmNewPassword('');
            setCreatePasswordError('');
            setPendingDeleteAction(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Password</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Since you signed in with Google, you need to create a password to confirm sensitive actions like deletions.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setCreatePasswordError(''); }}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => { setConfirmNewPassword(e.target.value); setCreatePasswordError(''); }}
                  placeholder="Confirm your password"
                />
              </div>

              {createPasswordError && (
                <p className="text-sm text-destructive">{createPasswordError}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreatePasswordDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreatePassword} className="flex-1">
                  Create Password
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default AdminModal;