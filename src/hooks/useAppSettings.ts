import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  mailchimpUrl: string;
}

const DEFAULT_MAILCHIMP_URL = 'https://group.us12.list-manage.com/subscribe/post?u=8cebbb69cb233fee8e96a59fe&amp;id=de54a87f37&amp;f_id=005e9fe0f0';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    mailchimpUrl: DEFAULT_MAILCHIMP_URL
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

        setSettings({
          mailchimpUrl: settingsMap['mailchimp_url'] || DEFAULT_MAILCHIMP_URL
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
