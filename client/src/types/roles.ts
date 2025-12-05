// Role types and configurations for hierarchical team system
export type UserRole = 'Master' | 'Team Lead' | 'Staff' | 'Client';

export interface UserProfile {
  user_id: string;
  role: UserRole;
  plan_type: string;
  account_status: string;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  id: string;
  invited_by: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export interface RolePermissions {
  canInvite: UserRole[];
  canSeeAllProjects: boolean;
  canSeeAllTeamMembers: boolean;
  availableTabs: DashboardTab[];
}

export type DashboardTab = 'individual' | 'overview' | 'team' | 'projects' | 'analytics';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'Master': {
    canInvite: ['Team Lead', 'Staff', 'Client'],
    canSeeAllProjects: true,
    canSeeAllTeamMembers: true,
    availableTabs: ['individual', 'overview', 'team', 'projects', 'analytics']
  },
  'Team Lead': {
    canInvite: ['Staff', 'Client'],
    canSeeAllProjects: false, // Only invited users' projects
    canSeeAllTeamMembers: false, // Only invited users
    availableTabs: ['individual', 'overview', 'team', 'projects', 'analytics']
  },
  'Staff': {
    canInvite: [],
    canSeeAllProjects: false,
    canSeeAllTeamMembers: false,
    availableTabs: ['individual']
  },
  'Client': {
    canInvite: [],
    canSeeAllProjects: false,
    canSeeAllTeamMembers: false,
    availableTabs: ['individual']
  }
};

export const ROLE_COLORS: Record<UserRole, string> = {
  'Master': 'bg-purple-500/10 text-purple-600 border-purple-200',
  'Team Lead': 'bg-blue-500/10 text-blue-600 border-blue-200', 
  'Staff': 'bg-green-500/10 text-green-600 border-green-200',
  'Client': 'bg-orange-500/10 text-orange-600 border-orange-200'
};