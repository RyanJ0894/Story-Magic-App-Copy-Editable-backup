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
    
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `Your role has been updated to ${newRole}`,
      });
      
      onRoleChange();
    } catch (error: any) {
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
