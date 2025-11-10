import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { type UserRole } from "@/types/roles";
import { Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RoleDebugPanel() {
  const { profile, loading, updateRole, currentRole } = useUserRole();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleUpdateToMaster = async () => {
    setUpdating(true);
    try {
      const success = await updateRole('Master' as UserRole);
      if (success) {
        toast({
          title: "Role Updated!",
          description: "Your role has been updated to Master. Refreshing page...",
        });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading role information...</div>;
  }

  if (!profile) {
    return <div>No profile found</div>;
  }

  return (
    <Card className="border-cinema-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Debug Information
        </CardTitle>
        <CardDescription>
          Current role status and quick fix
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Role</p>
            <Badge variant="outline" className="mt-1">{currentRole}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="text-xs font-mono mt-1">{profile.user_id.slice(0, 8)}...</p>
          </div>
        </div>

        {currentRole !== 'Master' && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Your role is currently set to <strong>{currentRole}</strong>. 
              Click below to update it to Master:
            </p>
            <Button 
              onClick={handleUpdateToMaster}
              disabled={updating}
              className="w-full"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Update Role to Master
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
