import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Twitter, Facebook, Linkedin, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  /** Optional ref to capture a specific element instead of the entire page */
  targetRef?: React.RefObject<HTMLElement>;
}

const ShareButton: React.FC<ShareButtonProps> = ({ targetRef }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const captureScreenshot = async (): Promise<Blob | null> => {
    const target = targetRef?.current || document.body;
    
    try {
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  };

  const shareToTwitter = async () => {
    setIsCapturing(true);
    try {
      const blob = await captureScreenshot();
      if (!blob) {
        toast({ title: 'Error', description: 'Failed to capture screenshot', variant: 'destructive' });
        return;
      }

      // Twitter doesn't support direct image upload via URL, so we use text sharing
      const text = encodeURIComponent('Check out this visualization of the US Media Landscape from 2000 to 2025 on Zulu Digital Microscope! 🔬📊');
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
      
      toast({ title: 'Opening Twitter', description: 'Share your thoughts about the media landscape!' });
    } finally {
      setIsCapturing(false);
    }
  };

  const shareToFacebook = async () => {
    setIsCapturing(true);
    try {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
      
      toast({ title: 'Opening Facebook', description: 'Share the media landscape visualization!' });
    } finally {
      setIsCapturing(false);
    }
  };

  const shareToLinkedIn = async () => {
    setIsCapturing(true);
    try {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent('Zulu Digital Microscope - US Media Landscape');
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
      
      toast({ title: 'Opening LinkedIn', description: 'Share with your professional network!' });
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadScreenshot = async () => {
    setIsCapturing(true);
    try {
      const blob = await captureScreenshot();
      if (!blob) {
        toast({ title: 'Error', description: 'Failed to capture screenshot', variant: 'destructive' });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zulu-media-landscape-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Downloaded!', description: 'Screenshot saved to your device.' });
    } finally {
      setIsCapturing(false);
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      toast({ title: 'Not supported', description: 'Native sharing is not available on this device.', variant: 'destructive' });
      return;
    }

    setIsCapturing(true);
    try {
      const blob = await captureScreenshot();
      
      const shareData: ShareData = {
        title: 'Zulu Digital Microscope - US Media Landscape',
        text: 'Check out this visualization of the US Media Landscape from 2000 to 2025!',
        url: window.location.href,
      };

      // Try to share with file if supported
      if (blob && navigator.canShare) {
        const file = new File([blob], 'media-landscape.png', { type: 'image/png' });
        const shareWithFile = { ...shareData, files: [file] };
        
        if (navigator.canShare(shareWithFile)) {
          await navigator.share(shareWithFile);
          toast({ title: 'Shared!', description: 'Thanks for sharing!' });
          return;
        }
      }

      // Fallback to sharing without file
      await navigator.share(shareData);
      toast({ title: 'Shared!', description: 'Thanks for sharing!' });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast({ title: 'Error', description: 'Failed to share', variant: 'destructive' });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isCapturing}>
          {isCapturing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {typeof navigator !== 'undefined' && navigator.share && (
          <DropdownMenuItem onClick={nativeShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={shareToTwitter} className="gap-2">
          <Twitter className="h-4 w-4" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook} className="gap-2">
          <Facebook className="h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedIn} className="gap-2">
          <Linkedin className="h-4 w-4" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadScreenshot} className="gap-2">
          <Download className="h-4 w-4" />
          Download Image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
