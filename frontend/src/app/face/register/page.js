import { AuthGuard } from '@/features/auth/components';
import { FaceRegistrationStepper } from '@/features/face/components';

export const metadata = {
  title: 'Register Your Face',
};

export default function FaceRegisterPage() {
  return (
    <AuthGuard>
      <FaceRegistrationStepper />
    </AuthGuard>
  );
}
