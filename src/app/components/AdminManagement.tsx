/**
 * AdminManagement.tsx
 * Admin account management panel — visible only to super admins in the Verifier Portal.
 */

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldOff,
  Mail,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  Crown,
} from 'lucide-react';
import {
  fetchAdmins,
  fetchPendingInvites,
  updateAdminRole,
  revokeAdminAccess,
  createAdminInvite,
  revokeAdminInvite,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_DESCRIPTIONS,
} from '../utils/adminService';
import type { AdminProfile, AdminInvite, AdminRole } from '../utils/adminService';
import { toast } from 'sonner';

const ROLES: AdminRole[] = ['content_moderator', 'challenge_manager', 'user_manager', 'super_admin'];

const ROLE_COLORS: Record<AdminRole, string> = {
  content_moderator: 'bg-blue-50 text-blue-700',
  challenge_manager: 'bg-purple-50 text-purple-700',
  user_manager:      'bg-amber-50 text-amber-700',
  super_admin:       'bg-green-50 text-green-700',
};

interface AdminManagementProps {
  currentProfileId: string;
}

export function AdminManagement({ currentProfileId }: AdminManagementProps) {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('content_moderator');
  const [inviting, setInviting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [adminsData, invitesData] = await Promise.all([
      fetchAdmins(),
      fetchPendingInvites(),
    ]);
    setAdmins(adminsData);
    setInvites(invitesData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateRole = async (profileId: string, role: AdminRole) => {
    setProcessingId(profileId);
    const success = await updateAdminRole(profileId, {
      admin_role: role,
      is_super_admin: role === 'super_admin',
      is_verifier: true,
    });
    if (success) {
      toast.success('Admin role updated.');
      setAdmins(prev =>
        prev.map(a => a.id === profileId
          ? { ...a, admin_role: role, is_super_admin: role === 'super_admin' }
          : a
        )
      );
    } else {
      toast.error('Failed to update role.');
    }
    setProcessingId(null);
  };

  const handleRevoke = async (profileId: string, name: string) => {
    if (!confirm(`Revoke all admin privileges for ${name}? This cannot be undone.`)) return;
    setProcessingId(profileId);
    const success = await revokeAdminAccess(profileId);
    if (success) {
      toast.success(`Admin access revoked for ${name}.`);
      setAdmins(prev => prev.filter(a => a.id !== profileId));
    } else {
      toast.error('Failed to revoke access.');
    }
    setProcessingId(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const invite = await createAdminInvite(currentProfileId, inviteEmail.trim(), inviteRole);
    if (invite) {
      toast.success(`Invite sent to ${inviteEmail}`);
      setInvites(prev => [invite, ...prev]);
      setInviteEmail('');
      setShowInviteForm(false);
    } else {
      toast.error('Failed to create invite. Check if the email already exists.');
    }
    setInviting(false);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    const success = await revokeAdminInvite(inviteId);
    if (success) {
      toast.success('Invite revoked.');
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    } else {
      toast.error('Failed to revoke invite.');
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#2F8F6B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#1a3a2a]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1a3a2a] text-lg">Admin Accounts</h2>
            <p className="text-gray-400 text-xs">{admins.length} admin{admins.length !== 1 ? 's' : ''} · {invites.length} pending invite{invites.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-2 bg-[#1a3a2a] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-green-900 transition font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Invite Admin
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#1a3a2a] mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Invite New Admin
          </h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Admin Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setInviteRole(role)}
                    className={`text-left p-3 rounded-xl border-2 text-xs transition-colors ${
                      inviteRole === role
                        ? 'border-[#2F8F6B] bg-[#E6F4EE]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-[#1a3a2a]">{ADMIN_ROLE_LABELS[role]}</p>
                    <p className="text-gray-400 mt-0.5">{ADMIN_ROLE_DESCRIPTIONS[role]}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 bg-[#1a3a2a] text-white text-sm py-2.5 rounded-xl hover:bg-green-900 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#1a3a2a] text-sm mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" /> Pending Invites
          </h3>
          <div className="space-y-2">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#1a3a2a]">{invite.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold mr-1 ${ROLE_COLORS[invite.admin_role]}`}>
                      {ADMIN_ROLE_LABELS[invite.admin_role]}
                    </span>
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToken(invite.token)}
                    title="Copy invite token"
                    className="p-1.5 text-gray-400 hover:text-[#2F8F6B] transition"
                  >
                    {copiedToken === invite.token ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    title="Revoke invite"
                    className="p-1.5 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-[#1a3a2a] text-sm">Current Admins</h3>
        </div>

        {admins.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No admin accounts found. Invite one above.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {admins.map(admin => {
              const isMe = admin.id === currentProfileId;
              const isProcessing = processingId === admin.id;

              return (
                <div key={admin.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  {admin.avatar_url ? (
                    <img src={admin.avatar_url} alt={admin.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 flex-shrink-0">
                      {admin.name?.charAt(0) || '?'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1a3a2a] text-sm truncate">{admin.name}</p>
                      {isMe && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">You</span>}
                      {admin.is_super_admin && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{admin.location || 'No location'}</p>
                  </div>

                  {/* Role selector */}
                  <div className="relative flex-shrink-0">
                    <select
                      value={admin.admin_role || ''}
                      onChange={e => handleUpdateRole(admin.id, e.target.value as AdminRole)}
                      disabled={isProcessing || isMe}
                      className={`text-xs pl-2 pr-6 py-1.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                        admin.admin_role ? ROLE_COLORS[admin.admin_role] + ' border-transparent' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      <option value="" disabled>No role</option>
                      {ROLES.map(role => (
                        <option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                    {isProcessing && <Loader2 className="w-3 h-3 animate-spin absolute -right-4 top-1/2 -translate-y-1/2 text-[#2F8F6B]" />}
                  </div>

                  {/* Revoke button */}
                  {!isMe && (
                    <button
                      onClick={() => handleRevoke(admin.id, admin.name)}
                      disabled={isProcessing}
                      title="Revoke admin access"
                      className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 transition disabled:opacity-50"
                    >
                      <ShieldOff className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}