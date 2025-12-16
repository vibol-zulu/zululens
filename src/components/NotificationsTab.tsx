import React, { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Bell, CheckCircle, Loader2, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  channel_id: string | null;
  created_by: string;
  target_role: string;
  target_user_id: string | null;
  is_read: boolean;
  created_at: string;
  creator_name?: string;
  channel_name?: string;
}

interface NotificationsTabProps {
  isActive?: boolean;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ isActive = true }) => {
  const { user } = useAuth();
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
    if (isActive) {
      fetchNotifications();
    }
  }, [isActive, fetchNotifications]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    
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
    if (!user) return;
    
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

  const clearAllNotifications = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const notificationIds = notifications.map(n => n.id);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) throw error;
      
      setNotifications([]);
      toast({ title: 'All notifications cleared' });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({ title: 'Failed to clear notifications', variant: 'destructive' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearAllNotifications}
          className="text-destructive hover:text-destructive"
        >
          Clear All
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
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
                <TableCell className="font-medium">{notif.title}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {notif.message}
                  {notif.channel_name && (
                    <span className="block text-xs">Channel: {notif.channel_name}</span>
                  )}
                </TableCell>
                <TableCell>{notif.creator_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(notif.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => markAsRead(notif.id)}
                        title="Mark as read"
                      >
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => deleteNotification(notif.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default NotificationsTab;
