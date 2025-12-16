import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Bell, Flag, CheckCircle, Loader2, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  channel_id: string | null;
  created_by: string;
  target_role: string;
  is_read: boolean;
  created_at: string;
  creator_name?: string;
  channel_name?: string;
}

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch creator names and channel names
      const creatorIds = [...new Set((data || []).map(n => n.created_by))];
      const channelIds = [...new Set((data || []).map(n => n.channel_id).filter(Boolean))];
      
      let profiles: { id: string; full_name: string | null; email: string }[] = [];
      let channels: { id: string; name: string }[] = [];

      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', creatorIds);
        profiles = profilesData || [];
      }

      if (channelIds.length > 0) {
        const { data: channelsData } = await supabase
          .from('user_channels')
          .select('id, name')
          .in('id', channelIds as string[]);
        channels = channelsData || [];
      }

      const notificationsWithDetails: Notification[] = (data || []).map(notif => {
        const profile = profiles.find(p => p.id === notif.created_by);
        const channel = channels.find(c => c.id === notif.channel_id);
        return {
          ...notif,
          creator_name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
          channel_name: channel?.name || undefined
        };
      });

      setNotifications(notificationsWithDetails);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({ title: 'Failed to load notifications', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_by: user?.id,
          read_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      toast({ title: 'Marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const deleteNotification = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Date</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notif) => (
                    <TableRow key={notif.id} className={!notif.is_read ? 'bg-muted/50' : ''}>
                      <TableCell>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={notif.type === 'channel_flag' ? 'destructive' : 'secondary'}>
                          {notif.type === 'channel_flag' ? (
                            <><Flag className="h-3 w-3 mr-1" /> Flag</>
                          ) : notif.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{notif.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {notif.message}
                        {notif.channel_name && (
                          <span className="block text-xs">Channel: {notif.channel_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{notif.creator_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(notif.created_at)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!notif.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notif.id)}
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notif.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsModal;
