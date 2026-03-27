/**
 * adminService.ts
 * Data access layer for admin account management in the Verifier Portal.
 * All write operations require the caller to be a super admin.
 */

import { supabase } from './supabase';

export type AdminRole = 'content_moderator' | 'challenge_manager' | 'user_manager' | 'super_admin';

export interface AdminProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  location: string | null;
  is_verifier: boolean;
  is_super_admin: boolean;
  admin_role: AdminRole | null;
  created_at: string;
}

export interface AdminInvite {
  id: string;
  email: string;
  admin_role: AdminRole;
  invited_by: string;
  token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  content_moderator: 'Content Moderator',
  challenge_manager: 'Challenge Manager',
  user_manager: 'User Manager',
  super_admin: 'Super Admin',
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  content_moderator: 'Reviews flagged feed posts and moderation queue',
  challenge_manager: 'Creates, edits, and pins community challenges',
  user_manager: 'Manages user profiles and verifier status',
  super_admin: 'Full access — can manage all admin accounts',
};

// ============================================================================
// READ
// ============================================================================

/**
 * Fetch all admin accounts from the admin_directory view.
 */
export async function fetchAdmins(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('admin_directory')
    .select('*');

  if (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
  return (data || []) as AdminProfile[];
}

/**
 * Fetch all pending (unused, non-expired) admin invites.
 */
export async function fetchPendingInvites(): Promise<AdminInvite[]> {
  const { data, error } = await supabase
    .from('admin_invites')
    .select('*')
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invites:', error);
    return [];
  }
  return (data || []) as AdminInvite[];
}

// ============================================================================
// WRITE (super admin only — enforced by RLS)
// ============================================================================

/**
 * Update an admin's role and/or verifier status.
 */
export async function updateAdminRole(
  profileId: string,
  updates: {
    admin_role?: AdminRole | null;
    is_verifier?: boolean;
    is_super_admin?: boolean;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId);

  if (error) {
    console.error('Error updating admin role:', error);
    return false;
  }
  return true;
}

/**
 * Revoke an admin's privileges (reset all admin fields to defaults).
 */
export async function revokeAdminAccess(profileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_verifier: false,
      is_super_admin: false,
      admin_role: null,
    })
    .eq('id', profileId);

  if (error) {
    console.error('Error revoking admin access:', error);
    return false;
  }
  return true;
}

/**
 * Create an invite for a new admin.
 * The invite token is stored and can be shared with the invitee.
 */
export async function createAdminInvite(
  inviterProfileId: string,
  email: string,
  role: AdminRole
): Promise<AdminInvite | null> {
  const { data, error } = await supabase
    .from('admin_invites')
    .insert({
      email,
      admin_role: role,
      invited_by: inviterProfileId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating admin invite:', error);
    return null;
  }
  return data as AdminInvite;
}

/**
 * Revoke (delete) a pending invite.
 */
export async function revokeAdminInvite(inviteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('admin_invites')
    .delete()
    .eq('id', inviteId);

  if (error) {
    console.error('Error revoking invite:', error);
    return false;
  }
  return true;
}