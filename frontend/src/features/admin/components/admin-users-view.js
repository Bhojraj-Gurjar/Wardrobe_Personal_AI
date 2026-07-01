'use client';

import { useMemo, useState } from 'react';
import { Filter, MoreHorizontal, Plus, Search, Star } from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import {
  useAdminUsersQuery,
  useAdminUpdateUserMutation,
  useAdminDeactivateUserMutation,
  useAdminDeleteUserMutation,
  useAdminInviteUserMutation,
} from '@/features/admin/hooks';
import { showToast } from '@/stores/toast-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function UserActionsMenu({ user, onView, onEdit, onDeactivate, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="User actions"
      >
        <MoreHorizontal className="size-4" />
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-dashboard-border bg-dashboard-surface py-1 shadow-lg">
            <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-dashboard-surface-elevated" onClick={() => { onView(user); setOpen(false); }}>View</button>
            <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-dashboard-surface-elevated" onClick={() => { onEdit(user); setOpen(false); }}>Edit</button>
            <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-dashboard-surface-elevated" onClick={() => { onDeactivate(user); setOpen(false); }}>Deactivate</button>
            <button type="button" className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-dashboard-surface-elevated" onClick={() => { onDelete(user); setOpen(false); }}>Delete</button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function UserModal({ user, onClose, onSave, isSaving }) {
  const [name, setName] = useState(user?.name || '');
  const [plan, setPlan] = useState(user?.plan || 'Free');
  const [status, setStatus] = useState(user?.status || 'active');

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-dashboard-border bg-dashboard-surface p-6">
        <h3 className="text-lg font-semibold text-dashboard-foreground">
          {user.readOnly ? 'View User' : 'Edit User'}
        </h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-dashboard-muted">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={user.readOnly}
              className="mt-1 border-dashboard-border bg-dashboard-bg"
            />
          </div>
          <div>
            <label className="text-xs text-dashboard-muted">Email</label>
            <Input value={user.email} disabled className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-dashboard-muted">Plan</label>
            <SelectField
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              disabled={user.readOnly}
              className="mt-1"
            >
              {['Free', 'Pro', 'Premium'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </SelectField>
          </div>
          {!user.readOnly ? (
            <div>
              <label className="text-xs text-dashboard-muted">Status</label>
              <SelectField
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </SelectField>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!user.readOnly ? (
            <Button
              onClick={() => onSave({ name, plan, status: status.toUpperCase() })}
              disabled={isSaving}
            >
              Save
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InviteUserModal({ open, onClose, onSubmit, isSubmitting }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Free');
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      email: email.trim(),
      name: name.trim(),
      plan,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-dashboard-border bg-dashboard-surface p-6">
        <h3 className="text-lg font-semibold text-dashboard-foreground">Invite User</h3>
        <p className="mt-1 text-sm text-dashboard-muted">
          Create a customer account. A temporary password is generated if you leave the password blank.
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-dashboard-muted" htmlFor="invite-email">Email</label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 border-dashboard-border bg-dashboard-bg"
            />
          </div>
          <div>
            <label className="text-xs text-dashboard-muted" htmlFor="invite-name">Name</label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 border-dashboard-border bg-dashboard-bg"
            />
          </div>
          <div>
            <label className="text-xs text-dashboard-muted" htmlFor="invite-plan">Plan</label>
            <SelectField
              id="invite-plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="mt-1"
            >
              {['Free', 'Pro', 'Premium'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </SelectField>
          </div>
          <div>
            <label className="text-xs text-dashboard-muted" htmlFor="invite-password">
              Temporary password (optional)
            </label>
            <Input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="Min 8 characters"
              className="mt-1 border-dashboard-border bg-dashboard-bg"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting…' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminUsersView() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const params = useMemo(
    () => ({
      search: search || undefined,
      plan: planFilter || undefined,
      status: statusFilter || undefined,
      page: 1,
      limit: 50,
    }),
    [search, planFilter, statusFilter],
  );

  const { data, isLoading, isError, refetch } = useAdminUsersQuery(params);
  const updateMutation = useAdminUpdateUserMutation();
  const deactivateMutation = useAdminDeactivateUserMutation();
  const deleteMutation = useAdminDeleteUserMutation();
  const inviteMutation = useAdminInviteUserMutation();

  if (isLoading) {
    return <LoadingState title="Loading users…" rows={6} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load users" onRetry={refetch} />;
  }

  const users = data?.items || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        label="Admin"
        title="User Management"
        action={
          <Button className="gap-2 rounded-xl" onClick={() => setInviteOpen(true)}>
            <Plus className="size-4" />
            Invite User
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="h-10 border-dashboard-border bg-dashboard-surface pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 w-auto min-w-[9.5rem] shrink-0"
          >
            <option value="">All Plans</option>
            <option value="Free">Free</option>
            <option value="Pro">Pro</option>
            <option value="Premium">Premium</option>
          </SelectField>
          <SelectField
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-auto min-w-[9.5rem] shrink-0"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </SelectField>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'h-10 shrink-0 gap-2 rounded-lg border border-dashboard-border bg-dashboard-surface px-4',
              'text-sm font-medium text-dashboard-foreground shadow-none',
              'hover:border-primary/30 hover:bg-dashboard-surface-elevated hover:text-dashboard-foreground',
            )}
            onClick={() => {
              setSearch('');
              setPlanFilter('');
              setStatusFilter('');
            }}
          >
            <Filter className="size-4 text-dashboard-muted" />
            Reset
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-dashboard-border text-left text-xs uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Style Score</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-dashboard-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                        {user.avatarInitial}
                      </span>
                      <div>
                        <p className="font-medium text-dashboard-foreground">{user.name}</p>
                        <p className="text-xs text-dashboard-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="bg-primary/15 text-primary">
                      {user.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.styleScore != null ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.styleScore}</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-dashboard-border">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(user.styleScore, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-dashboard-foreground">{user.orders}</td>
                  <td className="px-4 py-3 text-dashboard-muted">{formatDate(user.joinedDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs font-medium capitalize',
                        user.status === 'active' ? 'text-emerald-400' : 'text-dashboard-muted',
                      )}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UserActionsMenu
                      user={user}
                      onView={(u) => setModalUser({ ...u, readOnly: true })}
                      onEdit={(u) => setModalUser({ ...u, readOnly: false })}
                      onDeactivate={(u) => deactivateMutation.mutate(u.id)}
                      onDelete={(u) => {
                        if (window.confirm(`Delete ${u.name}?`)) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalUser ? (
        <UserModal
          user={modalUser}
          onClose={() => setModalUser(null)}
          isSaving={updateMutation.isPending}
          onSave={(payload) => {
            updateMutation.mutate(
              { id: modalUser.id, payload },
              { onSuccess: () => setModalUser(null) },
            );
          }}
        />
      ) : null}

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        isSubmitting={inviteMutation.isPending}
        onSubmit={(payload) => {
          inviteMutation.mutate(payload, {
            onSuccess: (result) => {
              setInviteOpen(false);
              showToast(result?.message || 'User invited successfully');
              if (result?.temporaryPassword) {
                showToast(
                  `Temporary password: ${result.temporaryPassword}`,
                  'info',
                );
              }
            },
            onError: (error) => {
              showToast(error?.message || 'Unable to invite user', 'error');
            },
          });
        }}
      />
    </div>
  );
}
