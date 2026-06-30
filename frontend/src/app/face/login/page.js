import { Suspense } from 'react';
import { FaceLoginView } from '@/features/face/components';
import { LoadingState } from '@/components/shared/loading-state';

export const metadata = {
  title: 'Face Login',
};

export default function FaceLoginPage() {
  return (
    <Suspense fallback={<LoadingState title="Starting camera…" rows={1} />}>
      <FaceLoginView />
    </Suspense>
  );
}
