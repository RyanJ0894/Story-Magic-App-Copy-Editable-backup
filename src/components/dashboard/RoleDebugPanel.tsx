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
    if (newRole === currentRole) {
      console.log("⚠️ Role unchanged:", newRole);
      return;
    }
    
    console.log("🔄 Role change initiated:", { from: currentRole, to: newRole });
    setUpdating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ No authenticated user");
        throw new Error("No user found");
      }
      
      console.log("👤 User ID for update:", user.id);

      // First check current state
      const { data: beforeData, error: fetchError } = await supabase
        .from('profiles')
        .select('role, user_id')
        .eq('user_id', user.id)
        .single();
      
      console.log("📊 Current profile state:", { beforeData, fetchError });

      // Attempt the update
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();

      console.log("📝 Update attempt result:", { 
        updateResult, 
        updateError,
        errorCode: updateError?.code,
        errorMessage: updateError?.message,
        errorDetails: updateError?.details,
        errorHint: updateError?.hint
      });

      if (updateError) {
        // Log the full error for debugging
        console.error("❌ Full update error object:", JSON.stringify(updateError, null, 2));
        
        // Check if it's an RLS policy error
        if (updateError.code === '42501' || 
            updateError.message?.includes('policy') ||
            updateError.message?.includes('permission')) {
          throw new Error(
            "🔒 Role update blocked by Row Level Security. This is a security feature. To change roles, you need to run the SQL setup script first. See supabase/SETUP_INSTRUCTIONS.md"
          );
        }
        throw updateError;
      }

      // Verify the update
      const { data: afterData } = await supabase
        .from('profiles')
        .select('role, user_id')
        .eq('user_id', user.id)
        .single();
      
      console.log("✅ After update state:", afterData);

      if (afterData?.role !== newRole) {
        console.error("❌ Role didn't change in database!", { expected: newRole, actual: afterData?.role });
        throw new Error("Role update failed - changes not persisted");
      }

      toast({
        title: "Role Updated Successfully",
        description: `Your role has been changed from ${currentRole} to ${newRole}. Refreshing page...`,
      });
      
      console.log("🔄 Role verified. Triggering page reload in 1 second...");
      setTimeout(() => onRoleChange(), 1000);
      
    } catch (error: any) {
      console.error("❌ Role update failed:", error);
      toast({
        title: "Role Update Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
        duration: 10000, // Show for 10 seconds
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
