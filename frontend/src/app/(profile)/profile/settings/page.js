import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export const metadata = {
  title: 'Profile Settings',
};

export default function ProfileSettingsPage() {
  redirect(`${ROUTES.PROFILE.HOME}#settings`);
}
