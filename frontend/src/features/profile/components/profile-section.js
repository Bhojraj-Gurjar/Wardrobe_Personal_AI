import { ProfileDetailCard } from '@/features/profile/components/profile-detail-card';

/** @deprecated Use ProfileDetailCard directly — kept for backward compatibility. */
export function ProfileSection(props) {
  return <ProfileDetailCard divided={false} contentClassName="mt-5 space-y-5" {...props} />;
}
