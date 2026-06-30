'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  ProfileDetailCard,
  ProfileFieldGroup,
  ProfileSaveFooter,
  ProfileToggleRow,
  PROFILE_FORM_INPUT_CLASS,
} from '@/features/profile/components/profile-detail-card';
import { changePasswordSchema } from '@/features/profile/schemas';
import { useChangePasswordMutation } from '@/features/profile/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { showToast } from '@/stores/toast-store';

const SETTINGS_KEY = 'wardrobe-profile-settings';

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  recommendationNotifications: true,
  orderNotifications: true,
  darkMode: true,
};

const EMPTY_PASSWORD_FORM = {
  current: '',
  next: '',
  confirm: '',
};

function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function ProfileSettingsSection() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordMessage, setPasswordMessage] = useState('');
  const changePasswordMutation = useChangePasswordMutation();

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function updateSetting(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    if (changePasswordMutation.isPending) {
      return;
    }

    setPasswordMessage('');

    const validation = changePasswordSchema.safeParse(passwordForm);

    if (!validation.success) {
      const message = validation.error.issues[0]?.message || 'Invalid password details.';
      setPasswordMessage(message);
      return;
    }

    changePasswordMutation.mutate(validation.data, {
      onSuccess: () => {
        setPasswordForm(EMPTY_PASSWORD_FORM);
        setPasswordMessage('');
      },
      onError: (error) => {
        const message = error?.message || 'Unable to update password.';
        setPasswordMessage(message);
        showToast(message, 'error');
      },
    });
  }

  return (
    <ProfileDetailCard
      id="settings"
      title="Account Settings"
      description="Notification preferences and account security."
      divided={false}
      contentClassName="mt-5 space-y-0"
    >
      <ProfileFieldGroup title="Notifications">
        <div className="space-y-3">
          <ProfileToggleRow
            label="Email notifications"
            description="Order updates and account alerts"
            checked={settings.emailNotifications}
            onChange={(value) => updateSetting('emailNotifications', value)}
          />
          <ProfileToggleRow
            label="Recommendation notifications"
            description="New AI picks and style insights"
            checked={settings.recommendationNotifications}
            onChange={(value) => updateSetting('recommendationNotifications', value)}
          />
          <ProfileToggleRow
            label="Order notifications"
            description="Shipping and delivery updates"
            checked={settings.orderNotifications}
            onChange={(value) => updateSetting('orderNotifications', value)}
          />
        </div>
      </ProfileFieldGroup>

      <ProfileFieldGroup title="Theme" className="border-t border-white/[0.06]">
        <ProfileToggleRow
          label="Dark mode"
          description="Wardrobe AI dark purple theme"
          checked={settings.darkMode}
          onChange={(value) => updateSetting('darkMode', value)}
        />
      </ProfileFieldGroup>

      <ProfileFieldGroup title="Change password" className="border-t border-white/[0.06]">
        <form id="profile-password-form" onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-medium text-dashboard-muted">Current password</span>
              <input
                type="password"
                autoComplete="current-password"
                className={PROFILE_FORM_INPUT_CLASS}
                value={passwordForm.current}
                disabled={changePasswordMutation.isPending}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, current: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-dashboard-muted">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                className={PROFILE_FORM_INPUT_CLASS}
                value={passwordForm.next}
                disabled={changePasswordMutation.isPending}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, next: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-dashboard-muted">Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                className={PROFILE_FORM_INPUT_CLASS}
                value={passwordForm.confirm}
                disabled={changePasswordMutation.isPending}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirm: event.target.value }))
                }
              />
            </label>
          </div>

          {passwordMessage ? (
            <p className="text-sm text-destructive">{passwordMessage}</p>
          ) : null}
        </form>
      </ProfileFieldGroup>

      <ProfileSaveFooter className="border-t border-white/[0.06] pt-5">
        <div className="flex-1" />
        <Button
          type="submit"
          form="profile-password-form"
          className={cn(
            'h-11 rounded-xl px-6 font-semibold shadow-sm shadow-primary/20',
            'bg-gradient-to-r from-primary to-purple-dark text-primary-foreground',
            'transition-all duration-300 ease-out',
            'hover:-translate-y-0.5 hover:brightness-105 hover:shadow-md hover:shadow-primary/25',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          disabled={changePasswordMutation.isPending}
        >
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </Button>
      </ProfileSaveFooter>
    </ProfileDetailCard>
  );
}
