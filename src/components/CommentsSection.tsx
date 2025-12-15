import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MessageSquare, Send, Edit2, Trash2, Reply, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useComments, Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CommentsSectionProps {
  country: string;
  onSignUpClick?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
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

const CommentsSection: React.FC<CommentsSectionProps> = ({ country, onSignUpClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const { user, isAdmin } = useAuth();
  const { comments, loading, addComment, updateComment, deleteComment } = useComments(country);

  // Check if user has moderator role (similar to admin check in useAuth)
  const [isModerator, setIsModerator] = useState(false);
  
  React.useEffect(() => {
    const checkModerator = async () => {
      if (!user) {
        setIsModerator(false);
        return;
      }
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'moderator' 
      });
      setIsModerator(data === true);
    };
    checkModerator();
  }, [user]);

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">
            Comments {totalComments > 0 && `(${totalComments})`}
          </span>
          <span className="text-xs text-muted-foreground">— {country}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="max-h-[50vh] overflow-hidden flex flex-col">
          {!isAuthenticated ? (
            /* Sign-up gate for Tier 1 users */
            <div className="p-6 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Join the Conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Create a free account to share your thoughts, reply to others, and engage with the community discussing the media landscape.
                </p>
                <Button onClick={onSignUpClick} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Account to Comment
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
      )}
    </div>
  );
};

export default CommentsSection;
