import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, MessageSquare, Send, Edit2, Trash2, Reply, X, UserPlus, PartyPopper, CheckCircle2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useComments, Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppSettings } from '@/hooks/useAppSettings';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';


interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  source_url?: string;
  image_url?: string;
}

interface ApprovalNotification {
  id: string;
  channelName: string;
  message: string;
  created_at: string;
}

interface CommentsSectionProps {
  country: string;
  onSignUpClick?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggleLike: (commentId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onToggleLike,
  currentUserId,
  isAdmin,
  isModerator,
  depth = 0
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const canEdit = currentUserId === comment.user_id;
  const canDelete = currentUserId === comment.user_id || isAdmin || isModerator;
  const displayName = comment.user_name || comment.user_email?.split('@')[0] || 'User';

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}`}>
      <div className="bg-muted/50 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 gap-1 ${comment.liked_by_user ? 'text-red-500 hover:text-red-600' : ''}`}
              onClick={() => onToggleLike(comment.id)}
            >
              <Heart className={`h-3 w-3 ${comment.liked_by_user ? 'fill-current' : ''}`} />
              {comment.like_count > 0 && (
                <span className="text-xs">{comment.like_count}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onReply(comment.id)}
            >
              <Reply className="h-3 w-3" />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              isModerator={isModerator}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Interface for recently approved channels
interface RecentChannel {
  id: string;
  name: string;
  author_name: string;
  approved_at: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ country, onSignUpClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [approvalNotifications, setApprovalNotifications] = useState<ApprovalNotification[]>([]);
  const [showingApproval, setShowingApproval] = useState(false);
  const [recentChannels, setRecentChannels] = useState<RecentChannel[]>([]);
  
  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  const { settings } = useAppSettings();
  const { comments, loading, addComment, updateComment, deleteComment, toggleLike } = useComments(country);

  // Check if user has moderator role (similar to admin check in useAuth)
  const [isModerator, setIsModerator] = useState(false);
  
  // Fetch recently approved channels for cycling preview
  useEffect(() => {
    const fetchRecentChannels = async () => {
      const { data, error } = await supabase
        .from('user_channels')
        .select('id, name, author_id, approved_at')
        .eq('status', 'approved')
        .eq('country', country)
        .not('author_id', 'is', null)
        .order('approved_at', { ascending: false })
        .limit(10);
      
      if (!error && data && data.length > 0) {
        // Fetch author names
        const authorIds = [...new Set(data.map(c => c.author_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .rpc('get_profiles_by_ids', { _user_ids: authorIds });
        
        const profileMap = new Map(profiles?.map((p: { id: string; full_name: string }) => [p.id, p.full_name]) || []);
        
        const channels: RecentChannel[] = data.map(c => ({
          id: c.id,
          name: c.name,
          author_name: profileMap.get(c.author_id) || 'A contributor',
          approved_at: c.approved_at
        }));
        
        setRecentChannels(channels);
      }
    };
    
    fetchRecentChannels();
  }, [country]);
  
  // Fetch approval notifications for the user
  useEffect(() => {
    const fetchApprovalNotifications = async () => {
      if (!user) {
        setApprovalNotifications([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id, message, channel_id, created_at')
        .eq('target_user_id', user.id)
        .eq('type', 'submission_review')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!error && data && data.length > 0) {
        // Extract channel names from messages
        const notifications: ApprovalNotification[] = data.map(n => {
          // Extract channel name from message like 'Your channel suggestion "CNN" has been approved...'
          const match = n.message.match(/"([^"]+)"/);
          const channelName = match ? match[1] : 'Your channel';
          
          return {
            id: n.id,
            channelName,
            message: n.message,
            created_at: n.created_at
          };
        });
        
        setApprovalNotifications(notifications);
        setShowingApproval(true);
      }
    };
    
    fetchApprovalNotifications();
    
    // Set up realtime subscription for new notifications
    if (user) {
      const channel = supabase
        .channel('approval-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `target_user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotif = payload.new as any;
            if (newNotif.type === 'submission_review' && !newNotif.is_read) {
              const match = newNotif.message.match(/"([^"]+)"/);
              const channelName = match ? match[1] : 'Your channel';
              
              setApprovalNotifications(prev => [{
                id: newNotif.id,
                channelName,
                message: newNotif.message,
                created_at: newNotif.created_at
              }, ...prev]);
              setShowingApproval(true);
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  // Fetch news items (for desktop/tablet)
  useEffect(() => {
    if (isMobile) return;
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from('news_updates')
        .select('id, title, content, category, created_at, source_url, image_url')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setNewsItems(data);
      }
    };
    fetchNews();
  }, [isMobile]);
  
  useEffect(() => {
    const checkModerator = async () => {
      if (!user) {
        setIsModerator(false);
        return;
      }
      const { data } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'moderator' 
      });
      setIsModerator(data === true);
    };
    checkModerator();
  }, [user]);

  // Cycle through placeholder comments OR approval notifications when collapsed
  React.useEffect(() => {
    if (isExpanded) return;
    
    // If showing approval notifications, cycle through them
    if (showingApproval && approvalNotifications.length > 0) {
      const interval = setInterval(() => {
        setPreviewIndex((prev) => {
          const nextIndex = (prev + 1) % approvalNotifications.length;
          // After cycling through all approvals, switch back to regular comments
          if (nextIndex === 0 && prev === approvalNotifications.length - 1) {
            // Mark notifications as read after user has seen them
            approvalNotifications.forEach(async (notif) => {
              await supabase
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString(), read_by: user?.id })
                .eq('id', notif.id);
            });
            setShowingApproval(false);
            setApprovalNotifications([]);
            return 0;
          }
          return nextIndex;
        });
      }, settings.approvalNotificationDuration * 1000); // Use configurable duration
      
      return () => clearInterval(interval);
    }
    
    // Cycle through recently approved channels
    if (recentChannels.length > 0) {
      const interval = setInterval(() => {
        setPreviewIndex((prev) => (prev + 1) % recentChannels.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isExpanded, showingApproval, approvalNotifications, user, settings.approvalNotificationDuration, recentChannels.length]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    const { error } = await addComment(newComment, replyingTo || undefined);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive'
      });
    } else {
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleEdit = async (id: string, content: string) => {
    const { error } = await updateComment(id, content);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteComment(id);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      });
    }
  };

  const totalComments = comments.reduce((acc, c) => {
    return acc + 1 + (c.replies?.length || 0);
  }, 0);

  // Tier 1 users (not authenticated) see the section but with sign-up prompt
  const isAuthenticated = !!user;
  
  const currentRecentChannel = recentChannels.length > 0 
    ? recentChannels[previewIndex % recentChannels.length] 
    : null;
  const currentApproval = showingApproval && approvalNotifications.length > 0 
    ? approvalNotifications[previewIndex % approvalNotifications.length] 
    : null;

  // Render recent channel with celebration styling
  const renderRecentChannelPreview = () => {
    if (!currentRecentChannel) return null;
    
    return (
      <span 
        key={`channel-${currentRecentChannel.id}-${previewIndex}`}
        className="flex items-center gap-2 animate-fade-in"
      >
        <span className="font-semibold text-green-600 dark:text-green-400">
          🎉 Thank you {currentRecentChannel.author_name}!
        </span>
        <span className="text-foreground truncate">
          "{currentRecentChannel.name}" has been added!
        </span>
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      </span>
    );
  };

  // Render approval notification with celebration styling
  const renderApprovalPreview = () => {
    if (!currentApproval) return null;
    const isApproved = currentApproval.message.includes('approved');
    
    return (
      <span 
        key={`approval-${currentApproval.id}-${previewIndex}`}
        className="flex items-center gap-2 animate-fade-in"
      >
        {isApproved ? (
          <>
            <span className="font-semibold text-green-600 dark:text-green-400">
              🎉 Thank you!
            </span>
            <span className="text-foreground">
              "{currentApproval.channelName}" has been added!
            </span>
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          </>
        ) : (
          <>
            <span className="font-medium text-muted-foreground">
              Update on "{currentApproval.channelName}"
            </span>
          </>
        )}
      </span>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg">
      {/* Toggle Header */}
      <button
        data-tour="comments-news"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 hover:bg-muted/50 transition-colors ${
          isExpanded ? 'py-2' : 'py-4'
        } ${
          isMobile && !isExpanded ? 'flex flex-col gap-3' : 'flex items-center justify-between'
        }`}
      >
        {/* Mobile: Preview on top when collapsed */}
        {isMobile && !isExpanded && (
          <div className={`w-full text-sm overflow-hidden text-left ${
            (showingApproval && currentApproval) || currentRecentChannel ? 'bg-green-50 dark:bg-green-950/30 -mx-4 px-4 py-2 border-b border-green-200 dark:border-green-800' : ''
          }`}>
            {showingApproval && currentApproval ? (
              renderApprovalPreview()
            ) : currentRecentChannel ? (
              renderRecentChannelPreview()
            ) : (
              <span 
                key={previewIndex}
                className="block truncate animate-fade-in text-muted-foreground"
              >
                <span className="italic">Be the first to add a channel!</span>
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Always show comments icon and count */}
            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-sm shrink-0">
              Comments {totalComments > 0 && `(${totalComments})`}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">— {country}</span>
            
            {/* Desktop: Cycling preview inline when collapsed */}
            {!isMobile && !isExpanded && (
              <div className="flex items-center gap-2 ml-4 text-sm overflow-hidden">
                <span className="text-muted-foreground shrink-0">|</span>
                {showingApproval && currentApproval ? (
                  renderApprovalPreview()
                ) : currentRecentChannel ? (
                  renderRecentChannelPreview()
                ) : (
                  <span 
                    key={previewIndex}
                    className="truncate animate-fade-in text-muted-foreground"
                  >
                    <span className="italic">Be the first to add a channel!</span>
                  </span>
                )}
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="overflow-hidden px-4 h-[50vh]">
          <div className="flex h-full w-full min-h-0">
            {/* Comments Interface */}
            <div className={`flex flex-col h-full ${isMobile ? 'w-full' : 'flex-1 border-r border-border'}`}>
              {!isAuthenticated ? (
                /* Sign-up gate for Tier 1 users */
                <div className="flex items-center justify-center p-4 flex-1 overflow-y-auto">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Join the Conversation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create a free account to share your thoughts and engage with the community.
                    </p>
                    <Button onClick={onSignUpClick} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading comments...
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No comments yet. Be the first to share your thoughts!
                      </div>
                    ) : (
                      comments.map(comment => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          onReply={setReplyingTo}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleLike={toggleLike}
                          currentUserId={user.id}
                          isAdmin={isAdmin}
                          isModerator={isModerator}
                        />
                      ))
                    )}
                  </div>

                  {/* New Comment Input */}
                  <div className="border-t p-4 bg-background">
                    {replyingTo && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <Reply className="h-3 w-3" />
                        <span>Replying to comment</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => setReplyingTo(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px] flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSubmit();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={!newComment.trim()}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Press Cmd/Ctrl + Enter to send
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* News & Updates - Desktop/Tablet only */}
            {!isMobile && (
              <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                <div className="p-4 border-b border-border shrink-0">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    News & Updates
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {newsItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No news updates yet.
                    </div>
                  ) : (
                    newsItems.map((item) => {
                      const getCategoryStyle = (category: string) => {
                        switch (category) {
                          case 'feature': return 'text-primary';
                          case 'update': return 'text-corporate';
                          case 'community': return 'text-independent';
                          case 'milestone': return 'text-muted-foreground';
                          case 'coming-soon': return 'text-primary';
                          case 'news': return 'text-blue-500';
                          default: return 'text-muted-foreground';
                        }
                      };
                      
                      const getCategoryLabel = (category: string) => {
                        switch (category) {
                          case 'feature': return 'NEW FEATURE';
                          case 'update': return 'DATA UPDATE';
                          case 'community': return 'COMMUNITY';
                          case 'milestone': return 'MILESTONE';
                          case 'coming-soon': return 'COMING SOON';
                          case 'news': return 'NEWS';
                          default: return category.toUpperCase();
                        }
                      };
                      
                      return (
                        <div key={item.id} className="bg-muted/30 rounded-lg overflow-hidden border border-border/50 flex">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.title}
                              className="w-1/3 object-cover flex-shrink-0"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                          <div className="p-3 flex-1">
                            <span className={`text-xs font-medium ${getCategoryStyle(item.category)}`}>
                              {getCategoryLabel(item.category)}
                            </span>
                            <h4 className="font-medium text-sm mt-1">{item.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground block">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </span>
                              {item.source_url && (
                                <a 
                                  href={item.source_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Read more →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
