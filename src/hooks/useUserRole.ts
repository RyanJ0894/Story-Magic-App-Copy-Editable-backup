import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type UserRole, type UserProfile } from '@/types/roles';
import { useToast } from '@/hooks/use-toast';

export function useUserRole() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (isMounted) {
            setLoading(false);
            setError('Not authenticated');
          }
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          if (isMounted) {
            setError(profileError.message);
          }
          return;
        }

        if (isMounted) {
          setProfile(data as UserProfile);
          setError(null);
        }
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const updateRole = async (newRole: UserRole): Promise<boolean> => {
    if (!profile) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setProfile({ ...profile, role: newRole });
      
      toast({
        title: "Role Updated",
        description: `Role changed to ${newRole}`,
      });

      return true;
    } catch (error: any) {
      console.error('Role update error:', error);
      toast({
        title: "Role Update Failed", 
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateRole,
    currentRole: profile?.role as UserRole || 'Staff'
  };
}