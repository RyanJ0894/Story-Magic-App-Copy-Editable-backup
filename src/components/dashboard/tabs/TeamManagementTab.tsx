import { useState, useEffect } from "react";
import { Plus, Mail, Users, Crown, UserCheck, UserX, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type UserRole, type RolePermissions, type UserProfile, type TeamInvitation, ROLE_COLORS } from "@/types/roles";

interface TeamManagementTabProps {
  userRole: UserRole;
  permissions: RolePermissions;
  projects?: any[];
  onDeleteProject?: (id: string, title: string) => void;
  deletingId?: string | null;
}

export function TeamManagementTab({ userRole, permissions }: TeamManagementTabProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Staff');
  const [isInviting, setIsInviting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [sentInvitations, setSentInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      // Load team members based on hierarchy
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      // Load sent invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('team_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      setTeamMembers((members || []) as UserProfile[]);
      setSentInvitations((invitations || []) as TeamInvitation[]);
    } catch (error: any) {
      console.error('Error loading team data:', error);
      toast({
        title: "Loading Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Missing Information",
        description: "Please provide email and role",
        variant: "destructive"
      });
      return;
    }

    if (!permissions.canInvite.includes(inviteRole)) {
      toast({
        title: "Invalid Role",
        description: `You cannot invite ${inviteRole} users`,
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);
    try {
      // Generate invitation token
      const token = crypto.randomUUID();

      // Get current user ID first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          email: inviteEmail,
          role: inviteRole,
          token: token,
          invited_by: session.user.id
        });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} as ${inviteRole}`,
      });

      setInviteEmail('');
      setInviteRole('Staff');
      loadTeamData();
    } catch (error: any) {
      console.error('Invitation error:', error);
      toast({
        title: "Invitation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Cancelled",
        description: "Invitation has been cancelled",
      });

      loadTeamData();
    } catch (error: any) {
      console.error('Cancel invitation error:', error);
      toast({
        title: "Cancel Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading team data...</div>;
  }

  const pendingInvitations = sentInvitations.filter(inv => inv.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvitations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === 'Team Lead').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === 'Staff').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite New Member */}
      {permissions.canInvite.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Invite Team Member
            </CardTitle>
            <CardDescription>
              Send an invitation to add a new team member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.canInvite.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={sendInvitation}
                  disabled={isInviting || !inviteEmail}
                  className="w-full"
                >
                  {isInviting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>
              Invitations waiting for acceptance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited as {invitation.role} • {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Pending
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Current team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No team members yet
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.user_id === teamMembers.find(m => m.role === 'Master')?.user_id ? 'You' : 'Team Member'}
                      {member.role === 'Master' && ' (Owner)'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                      {member.invited_by && ' • Invited by Team Lead'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={ROLE_COLORS[member.role]}>
                      {member.role === 'Master' ? (
                        <Crown className="h-3 w-3 mr-1" />
                      ) : (
                        <UserCheck className="h-3 w-3 mr-1" />
                      )}
                      {member.role}
                    </Badge>
                    {member.role !== 'Master' && userRole === 'Master' && (
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}