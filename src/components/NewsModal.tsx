import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  source_url?: string;
  image_url?: string;
}

interface NewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ open, onOpenChange }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const fetchNews = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('news_updates')
          .select('id, title, content, category, created_at, source_url, image_url')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (!error && data) {
          setNewsItems(data);
        }
        setLoading(false);
      };
      fetchNews();
    }
  }, [open]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            News & Updates
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading news...
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No news updates yet.
            </div>
          ) : (
            <div className="space-y-4">
              {newsItems.map((item) => (
                <div key={item.id} className="bg-muted/30 rounded-lg overflow-hidden border border-border/50">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-32 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="p-4">
                    <span className={`text-xs font-medium ${getCategoryStyle(item.category)}`}>
                      {getCategoryLabel(item.category)}
                    </span>
                    <h4 className="font-medium text-sm mt-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      {item.source_url && (
                        <a 
                          href={item.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Read more →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;
