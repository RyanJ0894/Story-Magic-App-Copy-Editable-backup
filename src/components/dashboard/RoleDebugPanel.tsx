import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../../supabase/client";

interface RoleDebugPanelProps {
  profile: any;
  onRoleChange: () => void;
}

export function RoleDebugPanel({ profile, onRoleChange }: RoleDebugPanelProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const currentRole = profile?.role || 'Staff';

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;
    
    console.log("🔄 Role change initiated:", { from: currentRole, to: newRole });
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      console.log("👤 User ID for update:", user.id);

      // First, verify current profile state
      const { data: beforeProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id, role')
        .eq('user_id', user.id)
        .single();
      
      console.log("📋 Current profile before update:", beforeProfile);
      if (fetchError) console.error("❌ Error fetching profile:", fetchError);

      // Perform the update
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();

      console.log("✅ Update response:", { data: updateData, error: updateError });

      if (updateError) throw updateError;

      // Verify the update worked
      const { data: afterProfile } = await supabase
        .from('profiles')
        .select('user_id, role')
        .eq('user_id', user.id)
        .single();
      
      console.log("📋 Profile after update:", afterProfile);

      toast({
        title: "Role Updated",
        description: `Your role has been updated to ${newRole}`,
      });
      
      console.log("🔄 Triggering page reload...");
      onRoleChange();
    } catch (error: any) {
      console.error("❌ Role update error:", error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!profile) {
    return <div>No profile found</div>;
  }

  return (
    <Card className="border-cinema-gold/20">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cinema-gold" />
              <h3 className="text-lg font-semibold">Change Role</h3>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Current Role</p>
                <Badge variant="outline" className="mt-1">{currentRole}</Badge>
              </div>
            </div>
          </div>

          <Select 
            value={currentRole} 
            onValueChange={handleRoleChange}
            disabled={updating}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Master">Master</SelectItem>
              <SelectItem value="Team Lead">Team Lead</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
