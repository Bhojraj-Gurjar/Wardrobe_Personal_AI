import { TicketDetailView } from '@/features/customer-support';

export default async function SupportTicketDetailPage({ params }) {
  const { id } = await params;

  return <TicketDetailView ticketId={id} />;
}
