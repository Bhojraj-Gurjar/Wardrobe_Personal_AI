import { ClosetSectionPage } from '@/features/personal-closet/components/closet-section-page';

export const metadata = {
  title: 'Personal Closet',
};

export default async function ClosetSectionRoute({ params }) {
  const { section } = await params;

  return <ClosetSectionPage sectionId={section} />;
}
