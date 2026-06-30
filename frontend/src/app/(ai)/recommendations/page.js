import { PageContainer } from '@/components/layout/page-container';
import { RecommendationsView } from '@/lib/lazy-pages';

export const metadata = {
  title: 'Recommendations',
};

export default function RecommendationsPage() {
  return (
    <PageContainer>
      <RecommendationsView />
    </PageContainer>
  );
}
