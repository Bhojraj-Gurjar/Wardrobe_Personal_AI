import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export default function LegacyFaceAuthPage() {
  redirect(ROUTES.FACE.LOGIN);
}
