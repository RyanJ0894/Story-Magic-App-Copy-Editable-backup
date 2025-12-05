// Plan types and configurations
export type PlanTier = 
  | 'individual' 
  | 'starter-enterprise' 
  | 'professional-enterprise' 
  | 'studio-enterprise' 
  | 'enterprise-unlimited' 
  | 'university-academic';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: string;
  period: string;
  maxUsers: number;
  additionalUserPrice: number;
  bulkUserPrice?: number;
  bulkUserThreshold?: number;
  features: string[];
  isEnterprise: boolean;
  supportLevel: string;
  voiceLibrarySize: number;
  customVoices: number | 'unlimited';
  isAcademic?: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  'individual': {
    id: 'individual',
    name: 'Individual',
    price: '$30',
    period: 'month',
    maxUsers: 1,
    additionalUserPrice: 0,
    features: [
      'Personal projects',
      'Standard voice library (20+ voices)',
      'Basic audio export (MP3, WAV)',
      'Mobile and desktop access'
    ],
    isEnterprise: false,
    supportLevel: 'Community',
    voiceLibrarySize: 20,
    customVoices: 0
  },
  'starter-enterprise': {
    id: 'starter-enterprise',
    name: 'Starter Enterprise',
    price: '$2,400',
    period: 'year',
    maxUsers: 10,
    additionalUserPrice: 20,
    bulkUserPrice: 15,
    bulkUserThreshold: 11,
    features: [
      'Team management (up to 10 users)',
      'Basic collaboration tools',
      'Shared script library',
      'Standard voice library (20+ voices)',
      'Email support (48-hour response)',
      'Usage analytics',
      'Team project sharing'
    ],
    isEnterprise: true,
    supportLevel: 'Email (48h)',
    voiceLibrarySize: 20,
    customVoices: 0
  },
  'professional-enterprise': {
    id: 'professional-enterprise',
    name: 'Professional Enterprise',
    price: '$6,000',
    period: 'year',
    maxUsers: 30,
    additionalUserPrice: 20,
    bulkUserPrice: 15,
    bulkUserThreshold: 31,
    features: [
      'Extended team management (up to 30 users)',
      'Premium voice library (50+ voices)',
      'Custom voice cloning (up to 5 voices)',
      'Advanced collaboration suite',
      'Priority audio processing',
      'Phone + email support (24-hour response)',
      'Custom ambient sound library (100+ environments)',
      'Advanced analytics dashboard',
      'Department organization',
      'Version control'
    ],
    isEnterprise: true,
    supportLevel: 'Phone + Email (24h)',
    voiceLibrarySize: 50,
    customVoices: 5
  },
  'studio-enterprise': {
    id: 'studio-enterprise',
    name: 'Studio Enterprise',
    price: '$15,000',
    period: 'year',
    maxUsers: 75,
    additionalUserPrice: 20,
    bulkUserPrice: 15,
    bulkUserThreshold: 76,
    features: [
      'Large team management (up to 75 users)',
      'Unlimited custom voice cloning',
      'Dedicated account manager',
      '24/7 priority support',
      'Enterprise-grade security (SSO)',
      'Custom ambient soundscapes',
      'Advanced workflow automation',
      'Detailed reporting suite',
      'Dedicated infrastructure',
      'White-label options',
      'Personalized onboarding'
    ],
    isEnterprise: true,
    supportLevel: 'Dedicated + 24/7',
    voiceLibrarySize: 100,
    customVoices: 'unlimited'
  },
  'enterprise-unlimited': {
    id: 'enterprise-unlimited',
    name: 'Enterprise Unlimited',
    price: 'Custom',
    period: 'pricing',
    maxUsers: 200,
    additionalUserPrice: 0,
    features: [
      'Unlimited user accounts (200+ typical)',
      'Custom feature development',
      'Dedicated infrastructure (private cloud)',
      'Advanced compliance (SOC 2, GDPR)',
      'Multiple admin hierarchies',
      'Custom voice library development',
      'Exclusive early access',
      'Quarterly business reviews',
      'Volume discounts',
      'Custom security protocols'
    ],
    isEnterprise: true,
    supportLevel: 'Executive',
    voiceLibrarySize: 200,
    customVoices: 'unlimited'
  },
  'university-academic': {
    id: 'university-academic',
    name: 'University Program',
    price: '$1,200 - $3,000',
    period: 'year',
    maxUsers: 30,
    additionalUserPrice: 7.5,
    features: [
      'Academic verification required',
      'Educational use only',
      'Student portfolio tools',
      'Faculty oversight',
      'Curriculum integration',
      'Academic year licensing'
    ],
    isEnterprise: true,
    isAcademic: true,
    supportLevel: 'Academic',
    voiceLibrarySize: 20,
    customVoices: 0
  }
};

export const PLAN_HIERARCHY: PlanTier[] = [
  'individual',
  'starter-enterprise',
  'professional-enterprise',
  'studio-enterprise',
  'enterprise-unlimited',
  'university-academic'
];