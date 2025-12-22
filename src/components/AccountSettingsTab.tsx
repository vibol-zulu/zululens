import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AccountSettingsTabProps {
  isActive: boolean;
}

const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({ isActive }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile data
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [originalFullName, setOriginalFullName] = useState('');
  
  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Account info
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string>('email');

  useEffect(() => {
    if (isActive) {
      fetchUserData();
    }
  }, [isActive]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');
      setCreatedAt(user.created_at);
      setLastSignIn(user.last_sign_in_at || null);
      
      // Determine auth provider
      const providers = user.identities?.map(i => i.provider) || [];
      if (providers.includes('google')) {
        setAuthProvider('Google');
      } else if (providers.includes('github')) {
        setAuthProvider('GitHub');
      } else {
        setAuthProvider('Email');
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setOriginalFullName(profile.full_name || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (fullName === originalFullName) {
      toast({ title: 'No changes to save' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null })
        .eq('id', user.id);

      if (error) throw error;

      setOriginalFullName(fullName);
      toast({ title: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'New passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({ title: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({ 
        title: 'Failed to change password', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="rounded-md border p-4">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile Information
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Display Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your display name"
            />
            <p className="text-xs text-muted-foreground">
              This is how your name will appear across the platform
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              Email Address
            </Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <Button 
            onClick={handleSaveProfile} 
            disabled={saving || fullName === originalFullName}
            size="sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Password Section */}
      <div className="rounded-md border p-4">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password & Security
        </h3>
        
        {authProvider !== 'Email' && (
          <p className="text-sm text-muted-foreground mb-4">
            You signed in with {authProvider}. You can still set a password to enable email login.
          </p>
        )}

        {!showPasswordSection ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPasswordSection(true)}
          >
            Change Password
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleChangePassword}
                disabled={changingPassword}
                size="sm"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPasswordSection(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Account Info Section */}
      <div className="rounded-md border p-4">
        <h3 className="text-sm font-medium mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sign-in Method</span>
            <span className="font-medium">{authProvider}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Created</span>
            <span className="font-medium">{formatDate(createdAt)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Sign In</span>
            <span className="font-medium">{formatDate(lastSignIn)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsTab;
