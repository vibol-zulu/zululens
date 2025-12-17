import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  mailchimpUrl: string;
  guidedTourEnabled: boolean;
}

// Decode HTML entities in URLs (e.g., &amp; -> &)
const decodeHtmlEntities = (str: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

const DEFAULT_MAILCHIMP_URL = 'https://group.us12.list-manage.com/subscribe/post?u=8cebbb69cb233fee8e96a59fe&id=de54a87f37&f_id=005e9fe0f0';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    mailchimpUrl: DEFAULT_MAILCHIMP_URL,
    guidedTourEnabled: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');

        if (error) throw error;

        const settingsMap: Record<string, string> = {};
        data?.forEach(item => {
          settingsMap[item.key] = item.value;
        });

        const rawUrl = settingsMap['mailchimp_url'] || DEFAULT_MAILCHIMP_URL;
        setSettings({
          mailchimpUrl: decodeHtmlEntities(rawUrl),
          guidedTourEnabled: settingsMap['guided_tour_enabled'] === 'true'
        });
      } catch (error) {
        console.error('Error fetching app settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
};
