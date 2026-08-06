/**
 * =====================================================
 * Supabase Database Types
 * =====================================================
 * TypeScript types for the AI E-Commerce Lead Generator database schema
 *
 * IMPORTANT: These types should be auto-generated from your Supabase schema
 * using the Supabase CLI. This file provides the foundational types.
 *
 * To generate types from your database:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
 *
 * Or for local development:
 * npx supabase gen types typescript --local > lib/supabase/database.types.ts
 * =====================================================
 */

// =====================================================
// Enums
// =====================================================

export type OrganizationRole = 'owner' | 'admin' | 'member';

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';

// Phase 2: Lead System Enums
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export type LeadSource = 'chatbot' | 'manual' | 'import' | 'web_form' | 'referral';

// =====================================================
// Database Tables
// =====================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  conversation_id: string | null;
  role: 'user' | 'system';
  created_at: string;
  updated_at: string;
}

export type ChatMessageInsert = Omit<
  ChatMessage,
  'id' | 'created_at' | 'updated_at'
> & {
  conversation_id?: string | null;
};

export type ChatMessageUpdate = Partial<
  Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'>
>;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

// Phase 2: Lead System Tables

export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  lead_score: number;
  product_interests: string[];
  conversation_id: string | null;
  conversation_summary: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer_url: string | null;
  landing_page: string | null;
  user_agent: string | null;
  ip_address: string | null;
  location_country: string | null;
  location_city: string | null;
  metadata: Record<string, any>;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  converted_at: string | null;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  last_used_at: string | null;
  usage_count: number;
  is_active: boolean;
  allowed_domains: string[];
  rate_limit_per_minute: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
}

export interface LeadActivityLog {
  id: string;
  lead_id: string;
  organization_id: string;
  activity_type: string;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  performed_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// =====================================================
// Database Relationships (with joined data)
// =====================================================

export interface OrganizationWithRole extends Organization {
  user_role: OrganizationRole;
  user_joined_at: string;
}

export interface OrganizationMemberWithUser extends OrganizationMember {
  user: User;
}

export interface OrganizationMemberWithOrganization extends OrganizationMember {
  organization: Organization;
}

export interface OrganizationWithMembers extends Organization {
  members: OrganizationMemberWithUser[];
  member_count: number;
}

// =====================================================
// Insert Types (for creating new records)
// =====================================================

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id: string; // Required because it references auth.users
};

export type OrganizationInsert = Omit<
  Organization,
  'id' | 'created_at' | 'updated_at' | 'subscription_tier' | 'subscription_status' | 'settings'
> & {
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  settings?: Record<string, any>;
};

export type OrganizationMemberInsert = Omit<
  OrganizationMember,
  'id' | 'created_at' | 'updated_at' | 'joined_at'
> & {
  role?: OrganizationRole;
};

// Phase 2: Lead System Insert Types

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'> & {
  status?: LeadStatus;
  source?: LeadSource;
  lead_score?: number;
  product_interests?: string[];
  metadata?: Record<string, any>;
};

export type ApiKeyInsert = Omit<
  ApiKey,
  'id' | 'created_at' | 'updated_at' | 'last_used_at' | 'usage_count'
> & {
  is_active?: boolean;
  allowed_domains?: string[];
  rate_limit_per_minute?: number;
};

export type LeadActivityLogInsert = Omit<LeadActivityLog, 'id' | 'created_at'> & {
  metadata?: Record<string, any>;
};

// =====================================================
// Update Types (for updating existing records)
// =====================================================

export type UserUpdate = Partial<Omit<User, 'id' | 'email' | 'created_at' | 'updated_at'>>;

export type OrganizationUpdate = Partial<
  Omit<Organization, 'id' | 'created_at' | 'updated_at'>
>;

export type OrganizationMemberUpdate = Partial<
  Omit<OrganizationMember, 'id' | 'organization_id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// Phase 2: Lead System Update Types

export type LeadUpdate = Partial<Omit<Lead, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;

export type ApiKeyUpdate = Partial<Omit<ApiKey, 'id' | 'organization_id' | 'key_hash' | 'created_at' | 'updated_at' | 'created_by'>>;

export type LeadActivityLogUpdate = Partial<Omit<LeadActivityLog, 'id' | 'created_at'>>;

// =====================================================
// Function Return Types
// =====================================================

export interface GetUserOrganizationsResult {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  organization_description: string | null;
  organization_logo_url: string | null;
  organization_website_url: string | null;
  organization_subscription_tier: SubscriptionTier;
  organization_subscription_status: SubscriptionStatus;
  organization_created_at: string;
  user_role: OrganizationRole;
  user_joined_at: string;
}

export interface CreateOrganizationParams {
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  status: 'success' | 'error';
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// =====================================================
// Auth & Session Types
// =====================================================

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: AuthUser;
}

// =====================================================
// Permission & Authorization Types
// =====================================================

export interface OrganizationPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_invite_members: boolean;
  can_remove_members: boolean;
  can_change_member_roles: boolean;
  can_manage_billing: boolean;
}

export interface MemberPermissions {
  can_view_profile: boolean;
  can_edit_own_profile: boolean;
  can_leave_organization: boolean;
}

// =====================================================
// Utility Types
// =====================================================

export type Tables = {
  users: User;
  organizations: Organization;
  organization_members: OrganizationMember;
  leads: Lead;
  api_keys: ApiKey;
  lead_activity_log: LeadActivityLog;
};

export type TableName = keyof Tables;

// Helper type to extract row type from table name
export type TableRow<T extends TableName> = Tables[T];

// Helper type for Supabase query builders
export type SupabaseTable<T extends TableName> = Tables[T];

// =====================================================
// Validation Types
// =====================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormErrors {
  [field: string]: string | string[];
}

// =====================================================
// Settings & Configuration Types
// =====================================================

export interface OrganizationSettings {
  // General settings
  timezone?: string;
  date_format?: string;

  // Notification preferences
  notifications?: {
    email?: boolean;
    in_app?: boolean;
    weekly_digest?: boolean;
  };

  // Feature flags
  features?: {
    ai_insights?: boolean;
    advanced_analytics?: boolean;
  };

  // Branding
  branding?: {
    primary_color?: string;
    logo_url?: string;
  };

  // Custom fields (extensible)
  [key: string]: any;
}

// =====================================================
// Query Filter Types
// =====================================================

export interface QueryFilters {
  search?: string;
  role?: OrganizationRole;
  status?: SubscriptionStatus;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

// =====================================================
// Audit & Tracking Types
// =====================================================

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

// =====================================================
// Type Guards
// =====================================================

export function isOrganizationRole(value: string): value is OrganizationRole {
  return ['owner', 'admin', 'member'].includes(value);
}

export function isSubscriptionTier(value: string): value is SubscriptionTier {
  return ['free', 'starter', 'professional', 'enterprise'].includes(value);
}

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return ['active', 'inactive', 'trialing', 'past_due', 'canceled'].includes(value);
}

// Phase 2: Lead System Type Guards

export function isLeadStatus(value: string): value is LeadStatus {
  return ['new', 'contacted', 'qualified', 'converted', 'lost'].includes(value);
}

export function isLeadSource(value: string): value is LeadSource {
  return ['chatbot', 'manual', 'import', 'web_form', 'referral'].includes(value);
}

// =====================================================
// Helper Functions
// =====================================================

export function hasRole(role: OrganizationRole, requiredRole: OrganizationRole): boolean {
  const roleHierarchy: Record<OrganizationRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

export function canManageMembers(role: OrganizationRole): boolean {
  return hasRole(role, 'admin');
}

export function canManageOrganization(role: OrganizationRole): boolean {
  return hasRole(role, 'admin');
}

export function canDeleteOrganization(role: OrganizationRole): boolean {
  return role === 'owner';
}

// =====================================================
// Database Function Parameter Types
// =====================================================

export interface CreateOrganizationWithOwnerParams {
  p_name: string;
  p_slug: string;
  p_description?: string | null;
  p_logo_url?: string | null;
  p_website_url?: string | null;
}

export interface UserHasRoleInOrgParams {
  p_organization_id: string;
  p_required_role: OrganizationRole;
}

export interface GetOrganizationMemberCountParams {
  p_organization_id: string;
}

// =====================================================
// Practice RAG — termék embeddings
// =====================================================
// A `practice_product_embeddings` tábla típusai (lásd
// supabase/migrations/20260507120000_create_practice_rag.sql).
// Az `embedding` mezőt stringként olvassuk vissza (pgvector text repr),
// és stringként is írjuk vissza: `[0.1,0.2,...]`.

// FONTOS: ezek `type`-ok, NEM `interface`-ek. A Supabase Database generic
// `Record<string, unknown>` szerinti assignability-t vár; egy interface
// (más interface-tól örökölve) NEM automatikusan assignable Record<...>-höz,
// a type aliasok igen. Ha interface-re cseréled, "values: never" hiba lesz.
export type PracticeProductEmbedding = {
  id: string;
  product_id: string;
  product_name: string;
  product_description: string | null;
  product_category: string | null;
  product_price: number | null;
  product_url: string | null;
  embedding: string;
  embedding_model: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type PracticeProductEmbeddingInsert = {
  id?: string;
  product_id: string;
  product_name: string;
  product_description?: string | null;
  product_category?: string | null;
  product_price?: number | null;
  product_url?: string | null;
  embedding: string;
  embedding_model?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type PracticeProductEmbeddingUpdate =
  Partial<PracticeProductEmbeddingInsert>;

// `practice_search_products` RPC visszatérési sor.
export type PracticeSearchProductRow = {
  id: string;
  product_id: string;
  product_name: string;
  product_description: string | null;
  product_category: string | null;
  product_price: number | null;
  product_url: string | null;
  metadata: Record<string, any>;
  similarity: number;
};

// =====================================================
// Supabase Database Type
// =====================================================

/**
 * Main Database type for Supabase client
 */
export type Database = {
  public: {
    // Megjegyzés: a @supabase/postgrest-js v2 elvárja a `Relationships: []`
    // mezőt minden tábla-definícióban. Ha bármelyikből hiányzik, a teljes
    // Database type kiesik a GenericSchema constraintből, és minden `from()`
    // hívás `never`-re esik vissza ("values: never" hiba). Üres tömb akkor is,
    // ha a táblának nincsenek FK kapcsolatai.
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: OrganizationMemberInsert;
        Update: OrganizationMemberUpdate;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: LeadUpdate;
        Relationships: [];
      };
      api_keys: {
        Row: ApiKey;
        Insert: ApiKeyInsert;
        Update: ApiKeyUpdate;
        Relationships: [];
      };
      lead_activity_log: {
        Row: LeadActivityLog;
        Insert: LeadActivityLogInsert;
        Update: LeadActivityLogUpdate;
        Relationships: [];
      };
      practice_product_embeddings: {
        Row: PracticeProductEmbedding;
        Insert: PracticeProductEmbeddingInsert;
        Update: PracticeProductEmbeddingUpdate;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: ChatMessageInsert;
        Update: ChatMessageUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_organization_with_owner: {
        Args: CreateOrganizationWithOwnerParams;
        Returns: string;
      };
      get_user_organizations: {
        Args: Record<string, never>;
        Returns: GetUserOrganizationsResult[];
      };
      user_has_role_in_org: {
        Args: UserHasRoleInOrgParams;
        Returns: boolean;
      };
      get_organization_member_count: {
        Args: GetOrganizationMemberCountParams;
        Returns: number;
      };
      create_lead: {
        Args: {
          p_organization_id: string;
          p_name: string;
          p_email: string;
          p_phone?: string;
          p_source?: LeadSource;
          p_metadata?: Record<string, any>;
        };
        Returns: string;
      };
      get_lead_stats: {
        Args: {
          p_organization_id: string;
          p_days_back?: number;
        };
        Returns: {
          total_leads: number;
          new_leads: number;
          qualified_leads: number;
          converted_leads: number;
          avg_lead_score: number;
          conversion_rate: number;
        }[];
      };
      search_leads: {
        Args: {
          p_organization_id: string;
          p_search_term: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Partial<Lead>[];
      };
      practice_search_products: {
        Args: {
          p_query_embedding: string;
          p_match_count?: number;
          p_similarity_threshold?: number;
        };
        Returns: PracticeSearchProductRow[];
      };
    };
    Enums: {
      organization_role: OrganizationRole;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      lead_status: LeadStatus;
      lead_source: LeadSource;
    };
  };
};
