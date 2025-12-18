import { supabase } from '@/integrations/supabase/client';

interface SendSubmissionEmailParams {
  userId: string;
  channelName: string;
  status: 'approved' | 'rejected';
  country: string;
}

export async function sendSubmissionEmail(params: SendSubmissionEmailParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-submission-email', {
      body: params
    });

    if (error) {
      console.error('Error sending submission email:', error);
      return false;
    }

    console.log('Submission email sent successfully:', data);
    return true;
  } catch (err) {
    console.error('Failed to send submission email:', err);
    return false;
  }
}
