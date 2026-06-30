import { VirtualTryOnView } from '@/lib/lazy-pages';
import { VirtualTryOnErrorBoundary } from '@/features/virtual-try-on/components/virtual-try-on-error-boundary';

export const metadata = {
  title: 'Virtual Try-On',
};

export default function VirtualTryOnPage() {
  return (
    <VirtualTryOnErrorBoundary>
      <VirtualTryOnView />
    </VirtualTryOnErrorBoundary>
  );
}
