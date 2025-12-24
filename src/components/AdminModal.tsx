import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, X, LogOut, Check, XCircle, Shield, User, Users, MessageSquare, Search, Database, MoreVertical, MessageCircle, BarChart3, Trophy, Flame, TrendingUp, Newspaper, ChevronDown, Bell, Loader2, Settings, Save, RefreshCw, Sparkles } from 'lucide-react';
import perplexityLogo from '@/assets/perplexity-color.svg';
import { sendSubmissionEmail } from '@/lib/sendSubmissionEmail';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import NotificationsTab from '@/components/NotificationsTab';
import AccountSettingsTab from '@/components/AccountSettingsTab';
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
import { Textarea } from '@/components/ui/textarea';
import ContributorCelebration from '@/components/ContributorCelebration';
import { Eye, PartyPopper, BellRing } from 'lucide-react';

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
  source_url?: string;
  image_url?: string;
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
  
  const [activeTab, setActiveTab] = useState('submissions');
  
  // Channels state
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'corporate' | 'independent'>('all');
  const [channelSearch, setChannelSearch] = useState('');
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
  const [userSearch, setUserSearch] = useState('');

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [submissionsStatusFilter, setSubmissionsStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [submissionSearch, setSubmissionSearch] = useState('');

  // Moderator applications state
  const [moderatorApplications, setModeratorApplications] = useState<{
    id: string;
    user_id: string;
    name: string;
    email: string;
    message: string;
    country: string;
    status: string;
    created_at: string;
    reviewed_at: string | null;
  }[]>([]);
  const [moderatorApplicationsLoading, setModeratorApplicationsLoading] = useState(false);
  const [selectedModeratorApplication, setSelectedModeratorApplication] = useState<{
    id: string;
    user_id: string;
    name: string;
    email: string;
    message: string;
    country: string;
    status: string;
    created_at: string;
  } | null>(null);
  const [showModeratorApplicationDialog, setShowModeratorApplicationDialog] = useState(false);
  // AI Estimation state
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationProgress, setEstimationProgress] = useState<{
    currentRun: number;
    totalRuns: number;
    runResults: Array<{
      crossPlatformAudience: number;
      deduplicatedAudience: number;
    }>;
  } | null>(null);
  const [estimationResult, setEstimationResult] = useState<{
    inputValidation?: {
      categoryCorrect: boolean;
      suggestedCategory: string | null;
      platformCorrect: boolean;
      contentTypeCorrect: boolean;
      validationNotes: string;
    } | null;
    politicalLean?: string | null;
    politicalLeanJustification?: string | null;
    crossPlatformAudience: number;
    deduplicatedAudience: number;
    reasoning: string;
    comparableChannels: string[];
    suggestedStartDate: string;
    // Multi-run data
    runDetails?: Array<{
      crossPlatformAudience: number;
      deduplicatedAudience: number;
    }>;
    crossPlatformRange?: { min: number; max: number };
    deduplicatedRange?: { min: number; max: number };
  } | null>(null);

  // Comparable channel analysis state
  const [showComparableModal, setShowComparableModal] = useState(false);
  const [comparableChannelName, setComparableChannelName] = useState('');
  const [comparableEstimating, setComparableEstimating] = useState(false);
  const [comparableEstimation, setComparableEstimation] = useState<{
    inputValidation?: {
      categoryCorrect: boolean;
      suggestedCategory: string | null;
      platformCorrect: boolean;
      contentTypeCorrect: boolean;
      validationNotes: string;
    } | null;
    politicalLean?: string | null;
    politicalLeanJustification?: string | null;
    crossPlatformAudience: number;
    deduplicatedAudience: number;
    reasoning: string;
    comparableChannels: string[];
    suggestedStartDate: string;
  } | null>(null);

  // Comments state
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCountry, setCommentsCountry] = useState('United States');
  const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(null);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [commentSearch, setCommentSearch] = useState('');

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

  // Position Analytics state
  const [positionAnalyses, setPositionAnalyses] = useState<Array<{
    id: string;
    user_id: string | null;
    visitor_name: string | null;
    country: string;
    position_label: string;
    numeric_value: number;
    diversity_score: string;
    diversity_note: string | null;
    selected_channels: any;
    suggested_channels: any;
    created_at: string;
    user_email?: string;
  }>>([]);
  const [positionAnalysesLoading, setPositionAnalysesLoading] = useState(false);
  const [positionAnalysisSearch, setPositionAnalysisSearch] = useState('');
  const [positionAnalysisToDelete, setPositionAnalysisToDelete] = useState<{ id: string; user_email?: string; visitor_name?: string | null } | null>(null);
  const [showDeletePositionAnalysisDialog, setShowDeletePositionAnalysisDialog] = useState(false);

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
    is_published: true,
    source_url: '',
    image_url: ''
  });
  const [fetchingArticle, setFetchingArticle] = useState(false);
  const [autoFetchingNews, setAutoFetchingNews] = useState(false);
  // Create contributor state
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: '', password: '', fullName: '', role: 'member' as 'member' | 'admin' | 'contributor' | 'moderator' });

  // Selection state for bulk actions
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [selectedNews, setSelectedNews] = useState<Set<string>>(new Set());
  const [selectedPositionAnalyses, setSelectedPositionAnalyses] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Feature preview state
  const [showCelebrationPreview, setShowCelebrationPreview] = useState(false);
  const [showApprovalNotificationPreview, setShowApprovalNotificationPreview] = useState(false);
  const [approvalNotificationDuration, setApprovalNotificationDuration] = useState('15');

  // Settings state
  const DEFAULT_SYSTEM_PROMPT = `You are an expert media analyst specializing in audience measurement, cross-platform reach estimation, and political media classification. Your task is to:
1. Validate and cross-check user-submitted information about media channels
2. Estimate monthly audience figures based on platform, content type, and market positioning
3. Determine the political lean/bias of the channel based on your knowledge

You have deep knowledge of:
- Platform-specific audience benchmarks (YouTube, Twitter/X, TikTok, Facebook, Instagram, podcasts, cable TV, print/digital)
- Cross-platform audience overlap patterns
- Content type performance benchmarks (news, commentary, podcasts, etc.)
- Political media landscape, bias indicators, and audience segmentation
- Deduplication methodologies for cross-platform reach
- Media ownership structures and corporate vs independent classification

Use industry-standard audience measurement approaches and historical comparables to provide realistic estimates. Be critical in validating user inputs.`;

  const DEFAULT_USER_PROMPT = `Analyze this media channel submission, validate the user's inputs, and estimate metrics:

**Channel Name:** {channel.name}
**Main Platform:** {channel.platform}
**Content Type:** {channel.contentType}
**Category (user selected):** {channel.category}
**Country:** {channel.country}

Based on this information, provide:

1. **Input Validation** - Cross-check the user's inputs:
   - Is the **Category** (corporate vs independent) correctly classified? Consider ownership structure, funding sources, and corporate affiliations.
   - Is the **Platform** selection accurate for this channel's primary presence?
   - Is the **Content Type** appropriate for what this channel produces?
   - Flag any discrepancies or corrections needed.

2. **Political Lean Analysis** - Based on the channel's content, hosts, editorial stance, and audience:
   - Determine the political lean from: Far Left, Progressive/Left, Center-Left, Center, Center-Right, Right, Far Right, Libertarian, Independent, Non-partisan
   - Provide brief justification for your assessment.

3. **Estimated Cross-Platform Monthly Audience (in millions)** - The total unique audience reach across major platforms.

4. **Estimated Deduplicated Monthly Audience (in millions)** - Adjusted to remove estimated audience overlap.

5. **Reasoning** (2-4 sentences) - Explain your estimation methodology.

6. **Comparable Channels** - List 2-4 similar channels used as benchmarks.

7. **Suggested Start Date** - Estimate when this channel was founded (format: MM/YYYY or "Founded YYYY").

Format your response as JSON with this structure:
{
  "inputValidation": {
    "categoryCorrect": boolean,
    "suggestedCategory": "corporate" or "independent" or null,
    "platformCorrect": boolean,
    "contentTypeCorrect": boolean,
    "validationNotes": "string explaining any issues found"
  },
  "politicalLean": "string from the options above",
  "politicalLeanJustification": "brief explanation",
  "crossPlatformAudience": number,
  "deduplicatedAudience": number,
  "reasoning": "string",
  "comparableChannels": ["channel1", "channel2"],
  "suggestedStartDate": "string"
}`;

  const [mailchimpUrl, setMailchimpUrl] = useState('');
  const [guidedTourEnabled, setGuidedTourEnabled] = useState(false);
  const [defaultViewMode, setDefaultViewMode] = useState<'default' | 'compass'>('compass');
  const [pxFactorGlobal, setPxFactorGlobal] = useState('1.0');
  const [pxFactorAllCountries, setPxFactorAllCountries] = useState('2.24');
  const [audienceSystemPrompt, setAudienceSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [audienceUserPrompt, setAudienceUserPrompt] = useState(DEFAULT_USER_PROMPT);
  
  // Political Position Analysis Prompts
  const DEFAULT_POLITICAL_SYSTEM_PROMPT = `You are an expert media analyst specializing in political media classification and audience analysis. Your task is to analyze a list of news sources/channels that a user consumes and determine their likely position on the political spectrum.

You have deep knowledge of:
- Political positioning of major and independent media outlets worldwide
- Media bias indicators and classifications from organizations like AllSides, Ad Fontes Media, Media Bias/Fact Check
- The political landscape of news media including podcasts, YouTube channels, cable news, print media, and digital outlets

Use your search capabilities to look up any channels you're not familiar with to determine their political lean.`;

  const DEFAULT_POLITICAL_USER_PROMPT = `A user has indicated they regularly consume news from the following sources:

{channels}

Please analyze these news sources and determine:

1. **Individual Channel Analysis** - For each channel, identify:
   - The channel's political lean (Far Left, Progressive/Left, Center-Left, Center, Center-Right, Right, Far Right, Libertarian, or Non-partisan)
   - Brief reasoning for the classification

2. **Overall Political Position** - Based on the combination of sources, determine where this user likely sits on the political spectrum. Consider:
   - The weighted average of their news diet
   - Whether they consume diverse perspectives or stay in one ideological lane
   - The frequency-weight (assume equal consumption across listed sources)

3. **Position on Spectrum** - Return a numeric value from -100 to +100 where:
   - -100 = Far Left
   - -60 = Progressive/Left
   - -30 = Center-Left
   - 0 = Center
   - +30 = Center-Right
   - +60 = Right
   - +100 = Far Right

Return your analysis as JSON with this structure:
{
  "channels": [
    {
      "name": "Channel Name",
      "politicalLean": "Center-Left",
      "reasoning": "Brief explanation"
    }
  ],
  "overallPosition": {
    "label": "Center-Left",
    "numericValue": -30,
    "description": "Based on your news diet, you consume primarily center-left perspectives with some mainstream sources."
  },
  "diversityScore": "low/medium/high",
  "diversityNote": "Brief note about ideological diversity in their media consumption"
}`;

  const [politicalSystemPrompt, setPoliticalSystemPrompt] = useState(DEFAULT_POLITICAL_SYSTEM_PROMPT);
  const [politicalUserPrompt, setPoliticalUserPrompt] = useState(DEFAULT_POLITICAL_USER_PROMPT);
  
  // Questionnaire Prompt
  const DEFAULT_QUESTIONNAIRE_PROMPT = `You are a political analyst expert. Generate exactly 8 politically relevant questions for someone in {country}.

IMPORTANT: Generate UNIQUE and VARIED questions each time. Do not repeat common generic questions. Focus on specific, nuanced policy topics.

The questions should:
1. Be relevant to current political topics and debates in that specific region
2. Cover economic, social, and governance categories (aim for variety)
3. Be phrased as statements that someone can agree or disagree with
4. Be balanced - some should lean left when agreed with, some should lean right
5. Avoid extremely polarizing or offensive topics
6. Be neutral in tone
7. Be DIFFERENT from typical generic political questions - get creative and specific!

Return ONLY a valid JSON array with this exact structure, no other text:
[
  {
    "id": "q1",
    "text": "The statement text here",
    "explanation": "A brief 1-2 sentence explanation helping the user understand what this question is really asking about and why it matters politically.",
    "category": "economic|social|governance",
    "weight": 1 or -1
  }
]

weight: 1 means agreeing leans left, -1 means agreeing leans right.
explanation: Should clarify the political context or implications without being biased.

Make sure questions are specific to {country}'s current political landscape and are UNIQUE to this session.`;

  const [questionnairePrompt, setQuestionnairePrompt] = useState(DEFAULT_QUESTIONNAIRE_PROMPT);
  
  // Question preview state
  const [previewQuestions, setPreviewQuestions] = useState<Array<{
    id: string;
    text: string;
    domain?: string;
    domainName?: string;
    explanation: { summary: string; agreement: string; disagreement: string } | string;
    category: string;
    weight: number;
  }>>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewCountry, setPreviewCountry] = useState('United States');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingCanvasSettings, setSavingCanvasSettings] = useState(false);

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

  // Fetch settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error) throw error;
      
      const settingsMap: Record<string, string> = {};
      data?.forEach(item => {
        settingsMap[item.key] = item.value;
      });
      
      if (settingsMap['mailchimp_url']) {
        setMailchimpUrl(settingsMap['mailchimp_url']);
      }
      if (settingsMap['guided_tour_enabled'] !== undefined) {
        setGuidedTourEnabled(settingsMap['guided_tour_enabled'] === 'true');
      }
      if (settingsMap['audience_system_prompt']) {
        setAudienceSystemPrompt(settingsMap['audience_system_prompt']);
      }
      if (settingsMap['audience_user_prompt']) {
        setAudienceUserPrompt(settingsMap['audience_user_prompt']);
      }
      if (settingsMap['political_system_prompt']) {
        setPoliticalSystemPrompt(settingsMap['political_system_prompt']);
      }
      if (settingsMap['political_user_prompt']) {
        setPoliticalUserPrompt(settingsMap['political_user_prompt']);
      }
      if (settingsMap['questionnaire_prompt']) {
        setQuestionnairePrompt(settingsMap['questionnaire_prompt']);
      }
      if (settingsMap['px_factor_global']) {
        setPxFactorGlobal(settingsMap['px_factor_global']);
      }
      if (settingsMap['px_factor_all_countries']) {
        setPxFactorAllCountries(settingsMap['px_factor_all_countries']);
      }
      if (settingsMap['default_view_mode']) {
        setDefaultViewMode(settingsMap['default_view_mode'] as 'default' | 'compass');
      }
      if (settingsMap['approval_notification_duration']) {
        setApprovalNotificationDuration(settingsMap['approval_notification_duration']);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const settingsToSave = [
        { key: 'mailchimp_url', value: mailchimpUrl },
        { key: 'guided_tour_enabled', value: guidedTourEnabled.toString() },
        { key: 'default_view_mode', value: defaultViewMode },
        { key: 'px_factor_global', value: pxFactorGlobal },
        { key: 'px_factor_all_countries', value: pxFactorAllCountries },
        { key: 'approval_notification_duration', value: approvalNotificationDuration },
      ];
      
      // Only save prompts if they have content
      if (audienceSystemPrompt.trim()) {
        settingsToSave.push({ key: 'audience_system_prompt', value: audienceSystemPrompt });
      }
      if (audienceUserPrompt.trim()) {
        settingsToSave.push({ key: 'audience_user_prompt', value: audienceUserPrompt });
      }
      if (politicalSystemPrompt.trim()) {
        settingsToSave.push({ key: 'political_system_prompt', value: politicalSystemPrompt });
      }
      if (politicalUserPrompt.trim()) {
        settingsToSave.push({ key: 'political_user_prompt', value: politicalUserPrompt });
      }
      if (questionnairePrompt.trim()) {
        settingsToSave.push({ key: 'questionnaire_prompt', value: questionnairePrompt });
      }
      
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id 
          }, { onConflict: 'key' });

        if (error) throw error;
      }
      
      toast({ title: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Save canvas display settings only
  const handleSaveCanvasSettings = async () => {
    setSavingCanvasSettings(true);
    try {
      const settingsToSave = [
        { key: 'px_factor_global', value: pxFactorGlobal },
        { key: 'px_factor_all_countries', value: pxFactorAllCountries },
      ];
      
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id 
          }, { onConflict: 'key' });

        if (error) throw error;
      }
      
      toast({ title: 'Canvas settings updated. Refresh the page to see changes on the canvas.' });
    } catch (error) {
      console.error('Error saving canvas settings:', error);
      toast({ title: 'Failed to save canvas settings', variant: 'destructive' });
    } finally {
      setSavingCanvasSettings(false);
    }
  };

  // Fetch channels
  const fetchChannels = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_channels')
        .select('*')
        .eq('country', selectedCountry)
        .eq('year', selectedYear)
        .eq('status', 'approved');
      
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

  // Fetch moderator applications
  const fetchModeratorApplications = async () => {
    if (!isAdmin) return;
    
    setModeratorApplicationsLoading(true);
    try {
      let query = supabase
        .from('moderator_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsStatusFilter !== 'all') {
        query = query.eq('status', submissionsStatusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setModeratorApplications(data || []);
    } catch (error) {
      console.error('Error fetching moderator applications:', error);
      toast({ title: 'Failed to load moderator applications', variant: 'destructive' });
    } finally {
      setModeratorApplicationsLoading(false);
    }
  };

  // Update moderator application status
  const updateModeratorApplicationStatus = async (applicationId: string, newStatus: 'approved' | 'rejected', userId: string) => {
    try {
      const { error } = await supabase
        .from('moderator_requests')
        .update({ 
          status: newStatus, 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', applicationId);

      if (error) throw error;

      // If approved, add the moderator role to the user
      if (newStatus === 'approved') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'moderator' });

        if (roleError && !roleError.message.includes('duplicate')) {
          console.error('Error adding moderator role:', roleError);
        }
      }

      toast({ title: `Application ${newStatus}` });
      fetchModeratorApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({ title: 'Failed to update application', variant: 'destructive' });
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

  // Fetch position analyses for admin
  const fetchPositionAnalyses = async () => {
    if (!isAdmin) return;
    
    setPositionAnalysesLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_position_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user emails for analyses
      const userIds = [...new Set((data || []).filter(d => d.user_id).map(d => d.user_id))];
      let profiles: { id: string; email: string }[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      const analysesWithEmails = (data || []).map(analysis => {
        const profile = profiles.find(p => p.id === analysis.user_id);
        return {
          ...analysis,
          user_email: profile?.email
        };
      });

      setPositionAnalyses(analysesWithEmails);
    } catch (error) {
      console.error('Error fetching position analyses:', error);
      toast({ title: 'Failed to load position analyses', variant: 'destructive' });
    } finally {
      setPositionAnalysesLoading(false);
    }
  };

  // Delete position analysis
  const deletePositionAnalysis = async () => {
    if (!positionAnalysisToDelete) return;
    
    const verified = await verifyPassword();
    if (!verified) return;
    
    try {
      const { error } = await supabase
        .from('user_position_analyses')
        .delete()
        .eq('id', positionAnalysisToDelete.id);

      if (error) throw error;

      setPositionAnalyses(prev => prev.filter(a => a.id !== positionAnalysisToDelete.id));
      toast({ title: 'Position analysis deleted successfully' });
      setShowDeletePositionAnalysisDialog(false);
      resetDeleteState();
    } catch (error) {
      console.error('Error deleting position analysis:', error);
      toast({ title: 'Failed to delete position analysis', variant: 'destructive' });
    }
  };


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

  // Generate preview questions for quality review
  const generatePreviewQuestions = async () => {
    setIsGeneratingPreview(true);
    setPreviewQuestions([]);
    setExpandedQuestionId(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-political-questions', {
        body: { country: previewCountry }
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        setPreviewQuestions(data.questions);
        toast({ title: `Generated ${data.questions.length} questions for review` });
      } else if (data?.fallback) {
        toast({ title: 'AI generation failed, using fallback questions', variant: 'destructive' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating preview questions:', error);
      toast({ title: 'Failed to generate questions', variant: 'destructive' });
    } finally {
      setIsGeneratingPreview(false);
    }
  };
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

  // Fetch article content from URL
  const fetchArticle = async () => {
    if (!newsFormData.source_url) {
      toast({ title: 'Please enter a URL', variant: 'destructive' });
      return;
    }

    setFetchingArticle(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-article', {
        body: { url: newsFormData.source_url }
      });

      if (error) throw error;

      if (data.success && data.data) {
        setNewsFormData(prev => ({
          ...prev,
          title: data.data.title || prev.title,
          content: data.data.content || data.data.description || prev.content,
          image_url: data.data.image_url || prev.image_url,
          source_url: data.data.source_url || prev.source_url
        }));
        toast({ title: 'Article fetched successfully' });
      } else {
        toast({ title: data.error || 'Failed to fetch article', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({ title: 'Failed to fetch article', variant: 'destructive' });
    } finally {
      setFetchingArticle(false);
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
            is_published: newsFormData.is_published,
            source_url: newsFormData.source_url || null,
            image_url: newsFormData.image_url || null
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
            source_url: newsFormData.source_url || null,
            image_url: newsFormData.image_url || null,
            created_by: user?.id
          });

        if (error) throw error;
        toast({ title: 'News added' });
      }

      setShowNewsDialog(false);
      setEditingNews(null);
      setNewsFormData({ title: '', content: '', category: 'update', is_published: true, source_url: '', image_url: '' });
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
      is_published: item.is_published,
      source_url: item.source_url || '',
      image_url: item.image_url || ''
    });
    setShowNewsDialog(true);
  };

  // Handle add news
  const handleAddNews = () => {
    setEditingNews(null);
    setNewsFormData({ title: '', content: '', category: 'update', is_published: true, source_url: '', image_url: '' });
    setShowNewsDialog(true);
  };

  // Auto-fetch news articles
  const autoFetchNews = async () => {
    setAutoFetchingNews(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-fetch-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        toast({ 
          title: 'Articles fetched', 
          description: `${data.articlesAdded} new articles added as drafts` 
        });
        fetchNews();
      } else {
        throw new Error(data.error || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error auto-fetching news:', error);
      toast({ 
        title: 'Failed to fetch articles', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setAutoFetchingNews(false);
    }
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
      fetchModeratorApplications();
    } else if (isAuthenticated && open && activeTab === 'comments' && isAdmin) {
      fetchComments();
    } else if (isAuthenticated && open && activeTab === 'analytics' && isAdmin) {
      fetchAnalytics();
    } else if (isAuthenticated && open && activeTab === 'leaderboard' && isAdmin) {
      fetchLeaderboard();
    } else if (isAuthenticated && open && activeTab === 'news' && isAdmin) {
      fetchNews();
    } else if (isAuthenticated && open && activeTab === 'settings' && isAdmin) {
      fetchSettings();
    }
  }, [activeTab, isAuthenticated, open, isAdmin]);

  // Refetch submissions when filter changes
  useEffect(() => {
    if (isAuthenticated && open && activeTab === 'submissions' && isAdmin) {
      fetchSubmissions();
      fetchModeratorApplications();
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

  // Single AI call helper
  const runSingleEstimate = async (submission: Submission): Promise<{
    crossPlatformAudience: number;
    deduplicatedAudience: number;
    inputValidation?: {
      categoryCorrect: boolean;
      suggestedCategory: string | null;
      platformCorrect: boolean;
      contentTypeCorrect: boolean;
      validationNotes: string;
    } | null;
    politicalLean?: string | null;
    politicalLeanJustification?: string | null;
    reasoning: string;
    comparableChannels: string[];
    suggestedStartDate: string;
  }> => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-audience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        channel: {
          name: submission.name,
          platform: submission.platform,
          contentType: submission.content_type,
          politicalLean: submission.political_lean,
          category: submission.category,
          country: submission.country
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to estimate audience');
    }

    const data = await response.json();
    
    if (data.success && data.estimate) {
      return data.estimate;
    } else {
      throw new Error('Invalid response from AI');
    }
  };

  // Multi-run AI Audience Estimation function (runs 3 times and calculates mean)
  const estimateAudience = async (submission: Submission) => {
    const TOTAL_RUNS = 3;
    setIsEstimating(true);
    setEstimationResult(null);
    setEstimationProgress({ currentRun: 0, totalRuns: TOTAL_RUNS, runResults: [] });
    
    try {
      const runResults: Array<{
        crossPlatformAudience: number;
        deduplicatedAudience: number;
        inputValidation?: {
          categoryCorrect: boolean;
          suggestedCategory: string | null;
          platformCorrect: boolean;
          contentTypeCorrect: boolean;
          validationNotes: string;
        } | null;
        politicalLean?: string | null;
        politicalLeanJustification?: string | null;
        reasoning: string;
        comparableChannels: string[];
        suggestedStartDate: string;
      }> = [];

      for (let i = 0; i < TOTAL_RUNS; i++) {
        setEstimationProgress({
          currentRun: i + 1,
          totalRuns: TOTAL_RUNS,
          runResults: runResults.map(r => ({
            crossPlatformAudience: r.crossPlatformAudience,
            deduplicatedAudience: r.deduplicatedAudience
          }))
        });

        const result = await runSingleEstimate(submission);
        runResults.push(result);
      }

      // Calculate means and ranges
      const crossPlatformValues = runResults.map(r => r.crossPlatformAudience);
      const deduplicatedValues = runResults.map(r => r.deduplicatedAudience);
      
      const crossPlatformMean = crossPlatformValues.reduce((a, b) => a + b, 0) / TOTAL_RUNS;
      const deduplicatedMean = deduplicatedValues.reduce((a, b) => a + b, 0) / TOTAL_RUNS;
      
      const crossPlatformRange = {
        min: Math.min(...crossPlatformValues),
        max: Math.max(...crossPlatformValues)
      };
      const deduplicatedRange = {
        min: Math.min(...deduplicatedValues),
        max: Math.max(...deduplicatedValues)
      };

      // Use the first run's qualitative data (validation, political lean, reasoning, etc.)
      // but with calculated mean for audience numbers
      const finalResult = {
        ...runResults[0],
        crossPlatformAudience: crossPlatformMean,
        deduplicatedAudience: deduplicatedMean,
        runDetails: runResults.map(r => ({
          crossPlatformAudience: r.crossPlatformAudience,
          deduplicatedAudience: r.deduplicatedAudience
        })),
        crossPlatformRange,
        deduplicatedRange
      };

      setEstimationResult(finalResult);
      toast({ 
        title: 'Audience estimate generated',
        description: `Mean calculated from ${TOTAL_RUNS} AI analyses`
      });
    } catch (error) {
      console.error('Error estimating audience:', error);
      toast({ 
        title: 'Failed to estimate audience', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setIsEstimating(false);
      setEstimationProgress(null);
    }
  };

  // Apply estimation to submission
  const applyEstimation = async () => {
    if (!selectedSubmission || !estimationResult) return;
    
    try {
      const updateData: Record<string, unknown> = { 
        value_millions: estimationResult.deduplicatedAudience,
        start_date: estimationResult.suggestedStartDate || 'TBD',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      };
      
      // Include political lean if determined by AI
      if (estimationResult.politicalLean) {
        updateData.political_lean = estimationResult.politicalLean;
      }
      
      // Apply category correction if AI suggested one
      if (estimationResult.inputValidation && !estimationResult.inputValidation.categoryCorrect && estimationResult.inputValidation.suggestedCategory) {
        updateData.category = estimationResult.inputValidation.suggestedCategory;
      }
      
      const { error } = await supabase
        .from('user_channels')
        .update(updateData)
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Notification is sent automatically by the backend trigger on status change.
      if (selectedSubmission.author_id) {
        // Send email notification with AI analysis data
        sendSubmissionEmail({
          userId: selectedSubmission.author_id,
          channelName: selectedSubmission.name,
          status: 'approved',
          country: selectedSubmission.country,
          aiAnalysis: {
            estimatedAudience: estimationResult.deduplicatedAudience,
            politicalLean: estimationResult.politicalLean,
            category: estimationResult.inputValidation?.suggestedCategory || selectedSubmission.category,
            comparableChannels: estimationResult.comparableChannels
          }
        });
      }

      toast({ title: 'Estimation applied and submission approved' });
      setShowSubmissionDialog(false);
      setSelectedSubmission(null);
      setEstimationResult(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Error applying estimation:', error);
      toast({ title: 'Failed to apply estimation', variant: 'destructive' });
    }
  };

  // Analyze a comparable channel
  const analyzeComparableChannel = async (channelName: string) => {
    setComparableChannelName(channelName);
    setShowComparableModal(true);
    setComparableEstimating(true);
    setComparableEstimation(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          channel: {
            name: channelName,
            platform: 'Unknown',
            contentType: 'Unknown',
            politicalLean: 'Unknown',
            category: 'independent',
            country: selectedSubmission?.country || 'United States'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to estimate audience');
      }

      const data = await response.json();
      
      if (data.success && data.estimate) {
        setComparableEstimation(data.estimate);
        toast({ title: 'Comparable channel analysis complete' });
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error analyzing comparable channel:', error);
      toast({ 
        title: 'Failed to analyze channel', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setComparableEstimating(false);
    }
  };

  // Add comparable channel to database as approved
  const addComparableAsChannel = async () => {
    if (!comparableEstimation || !comparableChannelName) return;
    
    try {
      const { error } = await supabase
        .from('user_channels')
        .insert({
          name: comparableChannelName,
          category: comparableEstimation.inputValidation?.suggestedCategory || 'independent',
          value_millions: comparableEstimation.deduplicatedAudience,
          platform: 'Unknown',
          content_type: 'Unknown',
          political_lean: comparableEstimation.politicalLean || 'Non-partisan',
          country: selectedSubmission?.country || 'United States',
          year: 2025,
          start_date: comparableEstimation.suggestedStartDate || 'TBD',
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          author_id: user?.id
        });

      if (error) throw error;

      toast({ title: `${comparableChannelName} added as approved channel` });
      setShowComparableModal(false);
      setComparableChannelName('');
      setComparableEstimation(null);
    } catch (error) {
      console.error('Error adding comparable channel:', error);
      toast({ title: 'Failed to add channel', variant: 'destructive' });
    }
  };


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

  const toggleSelectPositionAnalysis = (id: string) => {
    setSelectedPositionAnalyses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPositionAnalyses = () => {
    if (selectedPositionAnalyses.size === positionAnalyses.length) {
      setSelectedPositionAnalyses(new Set());
    } else {
      setSelectedPositionAnalyses(new Set(positionAnalyses.map(p => p.id)));
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

      // Submission review notifications are sent automatically by the backend trigger.
      // Send email notifications
      subsToApprove.filter(s => s.author_id).forEach(s => {
        sendSubmissionEmail({
          userId: s.author_id!,
          channelName: s.name,
          status: 'approved',
          country: s.country
        });
      });

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

      // Submission review notifications are sent automatically by the backend trigger.
      // Send email notifications
      subsToReject.filter(s => s.author_id).forEach(s => {
        sendSubmissionEmail({
          userId: s.author_id!,
          channelName: s.name,
          status: 'rejected',
          country: s.country
        });
      });

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

  const handleBulkDeletePositionAnalyses = async () => {
    if (selectedPositionAnalyses.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_position_analyses')
        .delete()
        .in('id', Array.from(selectedPositionAnalyses));

      if (error) throw error;

      toast({ title: `${selectedPositionAnalyses.size} analyses deleted` });
      setSelectedPositionAnalyses(new Set());
      fetchPositionAnalyses();
    } catch (error) {
      console.error('Bulk delete position analyses error:', error);
      toast({ title: 'Failed to delete analyses', variant: 'destructive' });
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
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden">
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  fetchChannels();
                  fetchUsers();
                  fetchSubmissions();
                  fetchComments();
                  fetchAnalytics();
                  fetchLeaderboard();
                  fetchNews();
                  toast({ title: 'Dashboard refreshed' });
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b px-4 shrink-0">
                <TabsList className="h-12">
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
                      <TabsTrigger value="channels" className="gap-2">
                        <Database className="h-4 w-4" />
                        Channels
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger value="position-analytics" className="gap-2" onClick={() => fetchPositionAnalyses()}>
                        <TrendingUp className="h-4 w-4" />
                        Diversity
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
                      <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
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
                  
                  <Input
                    placeholder="Search channels..."
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    className="w-[180px]"
                  />
                  
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
                            channels
                              .filter(channel => 
                                !channelSearch || channel.name.toLowerCase().includes(channelSearch.toLowerCase())
                              )
                              .map(channel => (
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
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-[180px]"
                  />
                  
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
                            users
                              .filter(u => !userSearch || 
                                u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                                u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
                              )
                              .map(u => (
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
                                    <SelectTrigger className={cn(
                                      "w-[120px] h-8 text-xs font-medium",
                                      u.role === 'admin' && "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
                                      u.role === 'moderator' && "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
                                      u.role === 'contributor' && "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
                                      !u.role && "bg-muted/50 text-muted-foreground"
                                    )}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none" className="text-muted-foreground">Member</SelectItem>
                                      <SelectItem value="contributor" className="text-blue-600 dark:text-blue-400">Contributor</SelectItem>
                                      <SelectItem value="moderator" className="text-purple-600 dark:text-purple-400">Moderator</SelectItem>
                                      <SelectItem value="admin" className="text-red-600 dark:text-red-400">Admin</SelectItem>
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
                  
                  <Input
                    placeholder="Search submissions..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="w-[180px]"
                  />
                  
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
                            submissions
                              .filter(sub => !submissionSearch || 
                                sub.name.toLowerCase().includes(submissionSearch.toLowerCase()) ||
                                sub.author_name?.toLowerCase().includes(submissionSearch.toLowerCase())
                              )
                              .map(sub => (
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
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => { setSelectedSubmission(sub); setShowSubmissionDialog(true); }}
                                          >
                                            <Search className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Review</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    {sub.status === 'pending' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="icon"
                                              onClick={() => updateSubmissionStatus(sub.id, 'rejected', sub.author_id)}
                                            >
                                              <XCircle className="h-4 w-4 text-destructive" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Reject</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => deleteSubmission(sub.id)}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Delete</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                  </div>

                  {/* Moderator Applications Section */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Moderator Applications</h3>
                      <Badge variant="secondary" className="ml-1">
                        {moderatorApplications.filter(a => a.status === 'pending').length} pending
                      </Badge>
                    </div>
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-[600px] text-xs">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">
                              <Badge variant="outline" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Type
                              </Badge>
                            </TableHead>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {moderatorApplicationsLoading ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : moderatorApplications.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No moderator applications found
                              </TableCell>
                            </TableRow>
                          ) : (
                            moderatorApplications
                              .filter(app => !submissionSearch || 
                                app.name.toLowerCase().includes(submissionSearch.toLowerCase()) ||
                                app.email.toLowerCase().includes(submissionSearch.toLowerCase())
                              )
                              .map(app => (
                              <TableRow key={app.id} className="bg-primary/5">
                                <TableCell>
                                  <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                                    <Shield className="h-3 w-3" />
                                    Moderator
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{app.name}</TableCell>
                                <TableCell className="text-sm">{app.email}</TableCell>
                                <TableCell>{app.country}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    app.status === 'pending' ? 'secondary' : 
                                    app.status === 'approved' ? 'default' : 'destructive'
                                  } className={app.status === 'approved' ? 'bg-emerald-600' : ''}>
                                    {app.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(app.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => { setSelectedModeratorApplication(app); setShowModeratorApplicationDialog(true); }}
                                          >
                                            <Search className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View Application</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    {app.status === 'pending' && (
                                      <>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => updateModeratorApplicationStatus(app.id, 'approved', app.user_id)}
                                              >
                                                <Check className="h-4 w-4 text-green-600" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Approve (Grant Moderator Role)</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => updateModeratorApplicationStatus(app.id, 'rejected', app.user_id)}
                                              >
                                                <XCircle className="h-4 w-4 text-destructive" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Reject</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
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

              {/* Position Analytics Tab */}
              <TabsContent value="position-analytics" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="border-b p-4 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-medium">Information Diversity Analytics</h3>
                    <p className="text-sm text-muted-foreground">User political position analyses and diversity scores</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedPositionAnalyses.size > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                            Bulk Actions ({selectedPositionAnalyses.size})
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={handleBulkDeletePositionAnalyses}>
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                            Delete Selected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by user or country..."
                        className="pl-8 h-9 w-64"
                        value={positionAnalysisSearch}
                        onChange={(e) => setPositionAnalysisSearch(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchPositionAnalyses}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                    <span className="text-sm text-muted-foreground">{positionAnalyses.length} analyses</span>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b">
                  {(() => {
                    const highDiversity = positionAnalyses.filter(p => p.diversity_score === 'high').length;
                    const mediumDiversity = positionAnalyses.filter(p => p.diversity_score === 'medium').length;
                    const lowDiversity = positionAnalyses.filter(p => p.diversity_score === 'low').length;
                    const avgPosition = positionAnalyses.length > 0 
                      ? Math.round(positionAnalyses.reduce((acc, p) => acc + Number(p.numeric_value), 0) / positionAnalyses.length)
                      : 0;
                    
                    return (
                      <>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">High Diversity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">{highDiversity}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Medium Diversity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{mediumDiversity}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Low Diversity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">{lowDiversity}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Position</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{avgPosition > 0 ? '+' : ''}{avgPosition}</div>
                            <p className="text-xs text-muted-foreground">-100 (Left) to +100 (Right)</p>
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
                          <TableHead className="w-10">
                            <Checkbox
                              checked={positionAnalyses.length > 0 && selectedPositionAnalyses.size === positionAnalyses.length}
                              onCheckedChange={toggleSelectAllPositionAnalyses}
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Diversity</TableHead>
                          <TableHead>Channels</TableHead>
                          <TableHead>Suggestions</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-16">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positionAnalysesLoading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : (() => {
                          const filteredAnalyses = positionAnalyses.filter(analysis => {
                            if (!positionAnalysisSearch) return true;
                            const searchLower = positionAnalysisSearch.toLowerCase();
                            return (
                              (analysis.user_email && analysis.user_email.toLowerCase().includes(searchLower)) ||
                              (analysis.visitor_name && analysis.visitor_name.toLowerCase().includes(searchLower)) ||
                              (analysis.country && analysis.country.toLowerCase().includes(searchLower)) ||
                              (analysis.position_label && analysis.position_label.toLowerCase().includes(searchLower)) ||
                              (analysis.diversity_score && analysis.diversity_score.toLowerCase().includes(searchLower))
                            );
                          });

                          if (filteredAnalyses.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                  {positionAnalysisSearch ? 'No matching analyses found' : 'No position analyses yet'}
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return filteredAnalyses.map((analysis) => {
                            const channels = typeof analysis.selected_channels === 'string' 
                              ? JSON.parse(analysis.selected_channels) 
                              : analysis.selected_channels || [];
                            const suggestions = typeof analysis.suggested_channels === 'string'
                              ? JSON.parse(analysis.suggested_channels)
                              : analysis.suggested_channels || [];
                            
                            return (
                              <TableRow key={analysis.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedPositionAnalyses.has(analysis.id)}
                                    onCheckedChange={() => toggleSelectPositionAnalysis(analysis.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{analysis.user_email || analysis.visitor_name || 'Anonymous'}</div>
                                  <div className="text-muted-foreground">{analysis.country}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{analysis.position_label}</Badge>
                                </TableCell>
                                <TableCell>
                                  <span className={Number(analysis.numeric_value) < 0 ? 'text-blue-600' : Number(analysis.numeric_value) > 0 ? 'text-red-600' : ''}>
                                    {Number(analysis.numeric_value) > 0 ? '+' : ''}{Number(analysis.numeric_value)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    analysis.diversity_score === 'high' 
                                      ? 'bg-green-500/20 text-green-700' 
                                      : analysis.diversity_score === 'medium'
                                      ? 'bg-yellow-500/20 text-yellow-700'
                                      : 'bg-red-500/20 text-red-700'
                                  }>
                                    {analysis.diversity_score}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="cursor-help underline decoration-dotted">
                                          {channels.length} selected
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <div className="space-y-1">
                                          {channels.map((ch: any, i: number) => (
                                            <div key={i} className="text-xs">
                                              {ch.name} ({ch.politicalLean})
                                            </div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                  {suggestions.length > 0 ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <span className="cursor-help underline decoration-dotted">
                                            {suggestions.length} suggested
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <div className="space-y-1">
                                            {suggestions.map((s: any, i: number) => (
                                              <div key={i} className="text-xs">
                                                {s.name} - {s.reason}
                                              </div>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {new Date(analysis.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setPositionAnalysisToDelete({
                                        id: analysis.id,
                                        user_email: analysis.user_email,
                                        visitor_name: analysis.visitor_name
                                      });
                                      setShowDeletePositionAnalysisDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
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
                  <div className="flex gap-2 ml-auto">
                    <Button 
                      onClick={autoFetchNews} 
                      size="sm" 
                      variant="outline"
                      disabled={autoFetchingNews}
                      className="gap-2"
                    >
                      {autoFetchingNews ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <Newspaper className="h-4 w-4" />
                          Fetch Latest
                        </>
                      )}
                    </Button>
                    <Button onClick={handleAddNews} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add News
                    </Button>
                  </div>
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

              {/* Settings Tab */}
              <TabsContent value="settings" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* Account Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AccountSettingsTab isActive={activeTab === 'settings'} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Integrations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mailchimp-url">Mailchimp Form URL</Label>
                        <Input
                          id="mailchimp-url"
                          value={mailchimpUrl}
                          onChange={(e) => setMailchimpUrl(e.target.value)}
                          placeholder="https://group.us12.list-manage.com/subscribe/post?u=..."
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          The Mailchimp form action URL used in the sign-up gate
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Search Flow Methodology */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Channel Discovery Search Methodology
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        How the Channel Discovery feature searches for and identifies media channels.
                      </p>
                      
                      <div className="space-y-4">
                        {/* Primary: Perplexity */}
                        <div className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <img src={perplexityLogo} alt="Perplexity" className="h-5 w-5" />
                            <h4 className="font-medium">Primary: Perplexity AI</h4>
                            <Badge variant="default" className="ml-auto">Active</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uses Perplexity's Sonar model for AI-powered research that:
                          </p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                            <li>Searches for media channels by country and category</li>
                            <li>Returns structured data: name, description, political lean, founding year, etc.</li>
                            <li>Provides reasoning and source URLs for verification</li>
                            <li>Identifies up to 10 channels per search</li>
                          </ul>
                        </div>

                        {/* Fallback: Firecrawl */}
                        <div className="border rounded-lg p-4 space-y-2 opacity-75">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-orange-500" />
                            <h4 className="font-medium">Fallback: Firecrawl</h4>
                            <Badge variant="secondary" className="ml-auto">Backup</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            If Perplexity fails or returns no results, Firecrawl provides a backup:
                          </p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                            <li>Performs direct web search for media channels</li>
                            <li>Extracts basic information: title, URL, description</li>
                            <li>Less structured than Perplexity but ensures results</li>
                          </ul>
                        </div>

                        {/* Deduplication */}
                        <div className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" />
                            <h4 className="font-medium">Deduplication</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Before saving, discovered channels are checked against:
                          </p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                            <li><strong>channel_discoveries</strong> - Existing pending/reviewed discoveries</li>
                            <li><strong>user_channels</strong> - Already approved channels in the system</li>
                          </ul>
                          <p className="text-sm text-muted-foreground mt-2">
                            Only unique channels are added to the staging table with "pending" status.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="guided-tour">Guided Tour</Label>
                          <p className="text-xs text-muted-foreground">
                            Show the guided tour for new visitors
                          </p>
                        </div>
                        <Checkbox
                          id="guided-tour"
                          checked={guidedTourEnabled}
                          onCheckedChange={(checked) => setGuidedTourEnabled(checked === true)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="default-view-mode">Default View Mode</Label>
                          <p className="text-xs text-muted-foreground">
                            The view mode shown when visitors first load the app
                          </p>
                        </div>
                        <Select
                          value={defaultViewMode}
                          onValueChange={(value: 'default' | 'compass') => setDefaultViewMode(value)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Microscope</SelectItem>
                            <SelectItem value="compass">Spectrum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Feature Previews */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Feature Previews
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Preview features that require objective completion to test their appearance and functionality.
                      </p>
                      
                      <div className="grid gap-3">
                        {/* Contributor Celebration Preview */}
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <PartyPopper className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Congratulations Card</p>
                              <p className="text-xs text-muted-foreground">
                                Shown after 10 approved submissions
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCelebrationPreview(true)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>

                        {/* Approval Notification Preview */}
                        <div className="flex flex-col gap-3 p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <BellRing className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Approval Notification</p>
                                <p className="text-xs text-muted-foreground">
                                  Shown in comments bar when submission is approved
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowApprovalNotificationPreview(true)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </div>
                          <div className="flex items-center gap-3 pt-2 border-t">
                            <Label htmlFor="approval-duration" className="text-xs whitespace-nowrap">Display time:</Label>
                            <Input
                              id="approval-duration"
                              type="number"
                              min="5"
                              max="120"
                              step="1"
                              value={approvalNotificationDuration}
                              onChange={(e) => setApprovalNotificationDuration(e.target.value)}
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">seconds</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground mb-4">
                        Adjust the pixel radius multiplier for bubble sizes. Higher values = larger bubbles.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="px-factor-global">Global View PX Factor</Label>
                          <Input
                            id="px-factor-global"
                            type="number"
                            step="0.01"
                            min="0.1"
                            max="10"
                            value={pxFactorGlobal}
                            onChange={(e) => setPxFactorGlobal(e.target.value)}
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground">
                            Used when viewing all countries combined
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="px-factor-all-countries">All Countries PX Factor</Label>
                          <Input
                            id="px-factor-all-countries"
                            type="number"
                            step="0.01"
                            min="0.1"
                            max="10"
                            value={pxFactorAllCountries}
                            onChange={(e) => setPxFactorAllCountries(e.target.value)}
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground">
                            Used when viewing individual countries
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button 
                          onClick={handleSaveCanvasSettings} 
                          disabled={savingCanvasSettings}
                          size="sm"
                        >
                          {savingCanvasSettings ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Update Canvas Settings
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <img src={perplexityLogo} alt="Perplexity" className="h-4 w-4" />
                        Submission Analysis Prompts
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        AI analysis runs 3 times and calculates the mean for Cross-Platform and Deduplicated Audience values.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" className="text-xs">Multi-Run Analysis</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Each submission is analyzed 3 times with a progress indicator. The final audience values are calculated as the <strong>mean</strong> of all runs, with the range displayed for transparency.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="system-prompt">System Prompt</Label>
                        <Textarea
                          id="system-prompt"
                          value={audienceSystemPrompt}
                          onChange={(e) => setAudienceSystemPrompt(e.target.value)}
                          placeholder="You are an expert media analyst specializing in audience measurement..."
                          className="font-mono text-xs min-h-[150px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          Defines the AI's role and expertise for audience estimation.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-prompt">User Prompt Template</Label>
                        <Textarea
                          id="user-prompt"
                          value={audienceUserPrompt}
                          onChange={(e) => setAudienceUserPrompt(e.target.value)}
                          placeholder="Analyze this media channel submission and estimate audience metrics..."
                          className="font-mono text-xs min-h-[200px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          Template for analyzing channels. Available placeholders: {'{channel.name}'}, {'{channel.platform}'}, {'{channel.contentType}'}, {'{channel.politicalLean}'}, {'{channel.category}'}, {'{channel.country}'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="opacity-60">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <img src={perplexityLogo} alt="Perplexity" className="h-4 w-4" />
                        Political Position Analysis Prompts
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        AI analysis is currently disabled. Users select channels from the dataset and their position is calculated locally.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="political-system-prompt">System Prompt</Label>
                        <Textarea
                          id="political-system-prompt"
                          value={politicalSystemPrompt}
                          onChange={(e) => setPoliticalSystemPrompt(e.target.value)}
                          placeholder="You are an expert media analyst specializing in political media classification..."
                          className="font-mono text-xs min-h-[150px]"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Defines the AI's role for analyzing user's political position based on news sources.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="political-user-prompt">User Prompt Template</Label>
                        <Textarea
                          id="political-user-prompt"
                          value={politicalUserPrompt}
                          onChange={(e) => setPoliticalUserPrompt(e.target.value)}
                          placeholder="A user has indicated they regularly consume news from the following sources..."
                          className="font-mono text-xs min-h-[200px]"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Template for analyzing user's political position. Use {'{channels}'} placeholder for the list of channels.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Questionnaire Generation Prompt
                        <Badge variant="default" className="text-xs">Active</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Customize the AI prompt used to generate political questionnaire questions for users.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="questionnaire-prompt">System Prompt</Label>
                        <Textarea
                          id="questionnaire-prompt"
                          value={questionnairePrompt}
                          onChange={(e) => setQuestionnairePrompt(e.target.value)}
                          placeholder="You are a political analyst expert..."
                          className="font-mono text-xs min-h-[250px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use <code className="bg-muted px-1 rounded">{'{country}'}</code> placeholder for the user's selected country.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestionnairePrompt(DEFAULT_QUESTIONNAIRE_PROMPT)}
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reset to Default
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Question Preview & Quality Review Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        Question Preview & Quality Review
                        <Badge variant="outline" className="text-xs">Testing</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Generate sample questions to review accuracy and quality before they reach users.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                          <Label>Test Country</Label>
                          <Select value={previewCountry} onValueChange={setPreviewCountry}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map(country => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={generatePreviewQuestions}
                          disabled={isGeneratingPreview}
                          className="gap-2"
                        >
                          {isGeneratingPreview ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generate Preview
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {previewQuestions.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Generated Questions ({previewQuestions.length})</h4>
                            <Badge variant="secondary" className="text-xs">
                              Review for accuracy & quality
                            </Badge>
                          </div>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {previewQuestions.map((q, idx) => (
                              <div 
                                key={q.id} 
                                className="border rounded-lg p-3 space-y-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {q.domainName || q.domain || 'General'}
                                      </Badge>
                                      <Badge 
                                        variant={q.weight === 1 ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {q.weight === 1 ? 'Agree → Left' : 'Agree → Right'}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {q.category}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-medium">{idx + 1}. {q.text}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                                    className="shrink-0"
                                  >
                                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedQuestionId === q.id ? 'rotate-180' : ''}`} />
                                  </Button>
                                </div>
                                
                                {expandedQuestionId === q.id && (
                                  <div className="pt-2 border-t space-y-2 text-xs text-muted-foreground">
                                    {typeof q.explanation === 'object' && 'summary' in q.explanation ? (
                                      <>
                                        <div>
                                          <span className="font-semibold text-foreground">Summary:</span> {q.explanation.summary}
                                        </div>
                                        <div>
                                          <span className="font-semibold text-green-600 dark:text-green-400">If Agree:</span> {q.explanation.agreement}
                                        </div>
                                        <div>
                                          <span className="font-semibold text-red-600 dark:text-red-400">If Disagree:</span> {q.explanation.disagreement}
                                        </div>
                                      </>
                                    ) : (
                                      <div>{q.explanation}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Quality checklist */}
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-3">
                            <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Quality Checklist</h5>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li>• Are questions short and concise (max 10 words)?</li>
                              <li>• Are explanations detailed and informative?</li>
                              <li>• Is there good variety across all 6 domains?</li>
                              <li>• Are questions balanced (some left, some right)?</li>
                              <li>• Are questions relevant to {previewCountry}?</li>
                              <li>• Are there no offensive or extremely polarizing topics?</li>
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {!isGeneratingPreview && previewQuestions.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          Click "Generate Preview" to see sample questions
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Questionnaire Methodology Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Questionnaire Calculation Methodology
                        <Badge variant="default" className="text-xs">Multi-Dimensional</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        How user political positions are calculated across governance domains.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Scoring Method */}
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <h4 className="font-medium">Scoring Method: Multi-Dimensional Profile</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Rather than a single left-right score, users receive a comprehensive profile across 6 governance domains:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          <div className="bg-muted/50 rounded-md p-2 text-center">
                            <div className="text-xs font-medium text-primary">Personal</div>
                            <div className="text-xs text-muted-foreground">Household governance</div>
                          </div>
                          <div className="bg-muted/50 rounded-md p-2 text-center">
                            <div className="text-xs font-medium text-primary">Social</div>
                            <div className="text-xs text-muted-foreground">Friend circles</div>
                          </div>
                          <div className="bg-muted/50 rounded-md p-2 text-center">
                            <div className="text-xs font-medium text-primary">Professional</div>
                            <div className="text-xs text-muted-foreground">Workplace views</div>
                          </div>
                          <div className="bg-muted/50 rounded-md p-2 text-center">
                            <div className="text-xs font-medium text-primary">Local</div>
                            <div className="text-xs text-muted-foreground">Community issues</div>
                          </div>
                          <div className="bg-muted/50 rounded-md p-2 text-center">
                            <div className="text-xs font-medium text-primary">National</div>
                            <div className="text-xs text-muted-foreground">Country policies</div>
                          </div>
                          <div className="bg-muted/50 rounded-md p-2 text-center">
                            <div className="text-xs font-medium text-primary">International</div>
                            <div className="text-xs text-muted-foreground">Global concerns</div>
                          </div>
                        </div>
                      </div>

                      {/* Question Distribution */}
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-blue-500" />
                          <h4 className="font-medium">Question Distribution: Pyramid Weighting</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Questions are distributed using a pyramid structure that emphasizes broader-impact domains:
                        </p>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-xs text-right text-muted-foreground">Personal</div>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div className="bg-primary/40 h-full" style={{ width: '10%' }}></div>
                            </div>
                            <div className="w-20 text-xs"><span className="font-medium">1 Q</span> · 10% weight</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-xs text-right text-muted-foreground">Social</div>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div className="bg-primary/50 h-full" style={{ width: '10%' }}></div>
                            </div>
                            <div className="w-20 text-xs"><span className="font-medium">1 Q</span> · 10% weight</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-xs text-right text-muted-foreground">Professional</div>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div className="bg-primary/60 h-full" style={{ width: '15%' }}></div>
                            </div>
                            <div className="w-20 text-xs"><span className="font-medium">1 Q</span> · 15% weight</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-xs text-right text-muted-foreground">Local</div>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div className="bg-primary/70 h-full" style={{ width: '15%' }}></div>
                            </div>
                            <div className="w-20 text-xs"><span className="font-medium">2 Q</span> · 15% weight</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-xs text-right text-muted-foreground">National</div>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div className="bg-primary/85 h-full" style={{ width: '25%' }}></div>
                            </div>
                            <div className="w-20 text-xs"><span className="font-medium">2 Q</span> · 25% weight</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-xs text-right text-muted-foreground">International</div>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: '25%' }}></div>
                            </div>
                            <div className="w-20 text-xs"><span className="font-medium">3 Q</span> · 25% weight</div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total: 10 questions per session. Questions are short and concise with detailed "Learn More" explanations. International and National domains carry more weight.
                        </p>
                      </div>

                      {/* Calculation Details */}
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          <h4 className="font-medium">Output Metrics</h4>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-medium">•</span>
                            <span><strong>Domain Scores (0-100):</strong> Individual position for each governance level, displayed on a radar chart.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-medium">•</span>
                            <span><strong>Weighted Composite Score:</strong> Single 0-100 score using pyramid weights for overall positioning.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-medium">•</span>
                            <span><strong>Ideological Consistency:</strong> Standard deviation across domains - lower = more consistent ideology.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-medium">•</span>
                            <span><strong>Position Label:</strong> Derived from composite score (e.g., "Center-Left", "Right", "Far Left").</span>
                          </li>
                        </ul>
                      </div>

                      {/* Why This Approach */}
                      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-sm">Why Multi-Dimensional + Pyramid?</h4>
                        <p className="text-xs text-muted-foreground">
                          This methodology reveals whether someone applies their political philosophy consistently across all life contexts 
                          or holds different views at personal vs. societal levels. The pyramid weighting reflects that macro-level 
                          positions (national/international) typically have more impact on public policy alignment, while micro-level 
                          questions (personal/social) reveal deeper ideological foundations.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Button
                    onClick={handleSaveSettings} 
                    disabled={savingSettings}
                    className="gap-2"
                  >
                    {savingSettings ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
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
            setNewsFormData({ title: '', content: '', category: 'update', is_published: true, source_url: '', image_url: '' });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNews ? 'Edit News' : 'Add News'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Article URL (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newsFormData.source_url}
                    onChange={(e) => setNewsFormData(prev => ({ ...prev, source_url: e.target.value }))}
                    placeholder="https://example.com/article"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={fetchArticle}
                    disabled={fetchingArticle || !newsFormData.source_url}
                  >
                    {fetchingArticle ? 'Fetching...' : 'Fetch'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Enter a URL and click Fetch to auto-fill title, content, and image</p>
              </div>
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
                <Label>Image URL</Label>
                <Input
                  value={newsFormData.image_url}
                  onChange={(e) => setNewsFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                {newsFormData.image_url && (
                  <div className="mt-2 rounded-md overflow-hidden border">
                    <img 
                      src={newsFormData.image_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
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
                    <SelectItem value="news">News</SelectItem>
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

        {/* Delete Position Analysis Confirmation */}
        <AlertDialog open={showDeletePositionAnalysisDialog} onOpenChange={(open) => { setShowDeletePositionAnalysisDialog(open); if (!open) resetDeleteState(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Position Analysis</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the position analysis for "{positionAnalysisToDelete?.user_email || positionAnalysisToDelete?.visitor_name || 'Anonymous'}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="delete-position-analysis-password">Enter your password to confirm</Label>
              <Input
                id="delete-position-analysis-password"
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
              <AlertDialogAction onClick={deletePositionAnalysis} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
          <DialogContent className="max-w-6xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle className="text-xl">Submission Details</DialogTitle>
            </DialogHeader>
            
            {selectedSubmission && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Submission Details Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">Field</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Channel Name</TableCell>
                        <TableCell className="font-semibold">{selectedSubmission.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Category</TableCell>
                        <TableCell className="capitalize">{selectedSubmission.category}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Country</TableCell>
                        <TableCell>{selectedSubmission.country}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Year</TableCell>
                        <TableCell>{selectedSubmission.year}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Platform</TableCell>
                        <TableCell>{selectedSubmission.platform}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Content Type</TableCell>
                        <TableCell>{selectedSubmission.content_type}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Audience (Millions)</TableCell>
                        <TableCell>{selectedSubmission.value_millions}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Political Lean</TableCell>
                        <TableCell>{selectedSubmission.political_lean}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Submitted By</TableCell>
                        <TableCell>{selectedSubmission.author_name || selectedSubmission.author_email || 'Unknown'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Status</TableCell>
                        <TableCell>
                          <Badge variant={
                            selectedSubmission.status === 'pending' ? 'secondary' : 
                            selectedSubmission.status === 'approved' ? 'default' : 'destructive'
                          }>
                            {selectedSubmission.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Analyse Submission Section */}
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => estimateAudience(selectedSubmission)}
                    disabled={isEstimating}
                    className="w-full h-12 px-5 font-semibold text-foreground border-2"
                  >
                    {isEstimating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {estimationProgress 
                          ? `Analysing (Run ${estimationProgress.currentRun}/${estimationProgress.totalRuns})...`
                          : 'Analysing...'
                        }
                      </>
                    ) : (
                      <>
                        <img src={perplexityLogo} alt="Perplexity" className="h-5 w-5 mr-2" />
                        Analyse Submission (3x Cross-Check)
                      </>
                    )}
                  </Button>

                  {/* Progress Indicator */}
                  {isEstimating && estimationProgress && (
                    <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Multi-Run Analysis Progress</span>
                        <span className="text-xs text-muted-foreground">
                          Run {estimationProgress.currentRun} of {estimationProgress.totalRuns}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(estimationProgress.currentRun / estimationProgress.totalRuns) * 100}%` }}
                        />
                      </div>
                      {estimationProgress.runResults.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Completed runs:</p>
                          <div className="flex flex-wrap gap-2">
                            {estimationProgress.runResults.map((result, idx) => (
                              <div key={idx} className="bg-background rounded px-2 py-1 text-xs border">
                                <span className="font-medium">Run {idx + 1}:</span>{' '}
                                {result.deduplicatedAudience.toFixed(2)}M
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {estimationResult && (
                    <div className="rounded-md border bg-muted/30 overflow-hidden">
                      {/* Input Validation */}
                      {estimationResult.inputValidation && (
                        <div className="p-4 border-b">
                          <h4 className="text-sm font-semibold mb-3">Input Validation</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <span className={estimationResult.inputValidation.categoryCorrect ? 'text-green-600' : 'text-amber-600'}>
                                {estimationResult.inputValidation.categoryCorrect ? '✓' : '⚠'}
                              </span>
                              <span className="text-sm">Category: {estimationResult.inputValidation.categoryCorrect ? 'Correct' : `Suggested: ${estimationResult.inputValidation.suggestedCategory}`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={estimationResult.inputValidation.platformCorrect ? 'text-green-600' : 'text-amber-600'}>
                                {estimationResult.inputValidation.platformCorrect ? '✓' : '⚠'}
                              </span>
                              <span className="text-sm">Platform: {estimationResult.inputValidation.platformCorrect ? 'Correct' : 'Review needed'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={estimationResult.inputValidation.contentTypeCorrect ? 'text-green-600' : 'text-amber-600'}>
                                {estimationResult.inputValidation.contentTypeCorrect ? '✓' : '⚠'}
                              </span>
                              <span className="text-sm">Content Type: {estimationResult.inputValidation.contentTypeCorrect ? 'Correct' : 'Review needed'}</span>
                            </div>
                          </div>
                          {estimationResult.inputValidation.validationNotes && (
                            <p className="text-sm text-muted-foreground mt-3 italic">{estimationResult.inputValidation.validationNotes}</p>
                          )}
                        </div>
                      )}

                      {/* Results */}
                      <div className="p-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Results</h4>
                      </div>
                      <Table>
                        <TableBody>
                          {estimationResult.politicalLean && (
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground w-1/3">Political Lean</TableCell>
                              <TableCell>
                                <span className="font-semibold text-primary">{estimationResult.politicalLean}</span>
                                {estimationResult.politicalLeanJustification && (
                                  <p className="text-sm text-muted-foreground mt-1">{estimationResult.politicalLeanJustification}</p>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-medium text-muted-foreground">Cross-Platform Audience</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">{estimationResult.crossPlatformAudience?.toFixed(2) || '0.00'}M</span>
                                <Badge variant="secondary" className="text-xs">Mean</Badge>
                              </div>
                              {estimationResult.crossPlatformRange && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Range: {estimationResult.crossPlatformRange.min.toFixed(2)}M – {estimationResult.crossPlatformRange.max.toFixed(2)}M
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium text-muted-foreground">Deduplicated Audience</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">{estimationResult.deduplicatedAudience?.toFixed(2) || '0.00'}M</span>
                                <Badge variant="secondary" className="text-xs">Mean</Badge>
                              </div>
                              {estimationResult.deduplicatedRange && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Range: {estimationResult.deduplicatedRange.min.toFixed(2)}M – {estimationResult.deduplicatedRange.max.toFixed(2)}M
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                          {estimationResult.runDetails && estimationResult.runDetails.length > 0 && (
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground">Individual Runs</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {estimationResult.runDetails.map((run, idx) => (
                                    <div key={idx} className="bg-muted rounded px-2 py-1 text-xs border">
                                      <span className="font-medium">Run {idx + 1}:</span>{' '}
                                      Cross: {run.crossPlatformAudience.toFixed(2)}M, Dedup: {run.deduplicatedAudience.toFixed(2)}M
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {estimationResult.suggestedStartDate && (
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground">Suggested Start Date</TableCell>
                              <TableCell className="font-medium">{estimationResult.suggestedStartDate}</TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-medium text-muted-foreground">Reasoning</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{estimationResult.reasoning}</TableCell>
                          </TableRow>
                          {estimationResult.comparableChannels?.length > 0 && (
                            <TableRow>
                              <TableCell className="font-medium text-muted-foreground">Comparable Channels</TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-wrap gap-2">
                                  {estimationResult.comparableChannels.map((channel, idx) => (
                                    <Badge 
                                      key={idx}
                                      variant="outline"
                                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                      onClick={() => analyzeComparableChannel(channel)}
                                    >
                                      {channel}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      
                    </div>
                  )}
                </div>

                {selectedSubmission.status === 'pending' && estimationResult && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'rejected', selectedSubmission.author_id)} 
                      className="flex-1"
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => estimateAudience(selectedSubmission)}
                      disabled={isEstimating}
                      className="flex-1"
                    >
                      {isEstimating ? 'Analysing...' : 'Re-analyse'}
                    </Button>
                    <Button 
                      onClick={applyEstimation} 
                      className="flex-1"
                    >
                      Approve ({estimationResult.deduplicatedAudience?.toFixed(2) || '0'}M)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Moderator Application Details Dialog */}
        <Dialog open={showModeratorApplicationDialog} onOpenChange={setShowModeratorApplicationDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Moderator Application
              </DialogTitle>
            </DialogHeader>
            
            {selectedModeratorApplication && (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground w-1/3">Applicant</TableCell>
                        <TableCell className="font-semibold">{selectedModeratorApplication.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Email</TableCell>
                        <TableCell>{selectedModeratorApplication.email}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Country</TableCell>
                        <TableCell>{selectedModeratorApplication.country}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Status</TableCell>
                        <TableCell>
                          <Badge variant={
                            selectedModeratorApplication.status === 'pending' ? 'secondary' : 
                            selectedModeratorApplication.status === 'approved' ? 'default' : 'destructive'
                          } className={selectedModeratorApplication.status === 'approved' ? 'bg-emerald-600' : ''}>
                            {selectedModeratorApplication.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Submitted</TableCell>
                        <TableCell>{new Date(selectedModeratorApplication.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Application Message</Label>
                  <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                    {selectedModeratorApplication.message}
                  </div>
                </div>

                {selectedModeratorApplication.status === 'pending' && (
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateModeratorApplicationStatus(selectedModeratorApplication.id, 'rejected', selectedModeratorApplication.user_id);
                        setShowModeratorApplicationDialog(false);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2 text-destructive" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        updateModeratorApplicationStatus(selectedModeratorApplication.id, 'approved', selectedModeratorApplication.user_id);
                        setShowModeratorApplicationDialog(false);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Grant Moderator Role
                    </Button>
                  </DialogFooter>
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

        {/* Comparable Channel Analysis Modal */}
        <Dialog open={showComparableModal} onOpenChange={(open) => {
          setShowComparableModal(open);
          if (!open) {
            setComparableChannelName('');
            setComparableEstimation(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <img src={perplexityLogo} alt="Perplexity" className="h-5 w-5" />
                Analyze: {comparableChannelName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {comparableEstimating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing {comparableChannelName}...</p>
                </div>
              ) : comparableEstimation ? (
                <div className="space-y-4">
                  {/* Input Validation Section */}
                  {comparableEstimation.inputValidation && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Input Validation</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={comparableEstimation.inputValidation.categoryCorrect ? 'text-green-600' : 'text-amber-600'}>
                            {comparableEstimation.inputValidation.categoryCorrect ? '✓' : '⚠'}
                          </span>
                          <span className="text-sm">
                            Category: {comparableEstimation.inputValidation.suggestedCategory || 'independent'}
                          </span>
                        </div>
                      </div>
                      {comparableEstimation.inputValidation.validationNotes && (
                        <p className="text-sm text-muted-foreground mt-3 italic">{comparableEstimation.inputValidation.validationNotes}</p>
                      )}
                    </div>
                  )}

                  {/* Estimation Results Table */}
                  <Table>
                    <TableBody>
                      {comparableEstimation.politicalLean && (
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground w-1/3">Political Lean</TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">{comparableEstimation.politicalLean}</span>
                            {comparableEstimation.politicalLeanJustification && (
                              <p className="text-sm text-muted-foreground mt-1">{comparableEstimation.politicalLeanJustification}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Cross-Platform Audience</TableCell>
                        <TableCell className="text-lg font-bold">{comparableEstimation.crossPlatformAudience?.toFixed(2) || '0.00'}M</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Deduplicated Audience</TableCell>
                        <TableCell className="text-lg font-bold text-primary">{comparableEstimation.deduplicatedAudience?.toFixed(2) || '0.00'}M</TableCell>
                      </TableRow>
                      {comparableEstimation.suggestedStartDate && (
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">Suggested Start Date</TableCell>
                          <TableCell className="font-medium">{comparableEstimation.suggestedStartDate}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">Reasoning</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{comparableEstimation.reasoning}</TableCell>
                      </TableRow>
                      {comparableEstimation.comparableChannels?.length > 0 && (
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">Comparable Channels</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-wrap gap-2">
                              {comparableEstimation.comparableChannels.map((channel, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => analyzeComparableChannel(channel)}
                                >
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowComparableModal(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => analyzeComparableChannel(comparableChannelName)}
                      disabled={comparableEstimating}
                      className="flex-1"
                    >
                      Re-analyse
                    </Button>
                    <Button 
                      onClick={addComparableAsChannel}
                      className="flex-1"
                    >
                      Add as Channel ({comparableEstimation.deduplicatedAudience?.toFixed(2) || '0'}M)
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        {/* Contributor Celebration Preview */}
        <ContributorCelebration
          open={showCelebrationPreview}
          onOpenChange={setShowCelebrationPreview}
          userName="Preview User"
        />

        {/* Approval Notification Preview Dialog */}
        <Dialog open={showApprovalNotificationPreview} onOpenChange={setShowApprovalNotificationPreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-emerald-600" />
                Approval Notification Preview
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This is how the approval notification appears in the comments bar when a user's submission is approved:
              </p>
              
              {/* Mock notification preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 border-b">
                  <span className="text-xs text-muted-foreground">Comments Bar Preview</span>
                </div>
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-transparent">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        🎉 Your submission was approved!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        "Example Channel Name" has been added to the map.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Display behavior:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Shows in comments bar for {approvalNotificationDuration} seconds per notification</li>
                  <li>• Multiple approvals cycle through automatically</li>
                  <li>• Marked as read after being displayed</li>
                </ul>
              </div>
            </div>

            <Button onClick={() => setShowApprovalNotificationPreview(false)} className="w-full">
              Close Preview
            </Button>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default AdminModal;