import React, { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SignupGateToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'signup_gate_enabled').maybeSingle()
      .then(({ data }) => setEnabled(data?.value === 'true'));
  }, []);

  const toggle = async (v: boolean) => {
    setSaving(true);
    const { error } = await supabase.from('app_settings')
      .update({ value: v.toString() }).eq('key', 'signup_gate_enabled');
    setSaving(false);
    if (error) { toast.error('Could not update sign-up gate'); return; }
    setEnabled(v);
    toast.success(v ? 'Sign-up gate turned on' : 'Sign-up gate turned off');
  };

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="font-medium text-foreground">Sign-up gate</p>
        <p className="text-sm text-muted-foreground">Require visitors to sign up before viewing the app.</p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} />
    </div>
  );
};

export default SignupGateToggle;
