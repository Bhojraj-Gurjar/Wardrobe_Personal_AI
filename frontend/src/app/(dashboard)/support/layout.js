import { SupportRealtimeProvider } from '@/features/customer-support/components/support-realtime-provider';

export default function SupportLayout({ children }) {
  return (
    <>
      <SupportRealtimeProvider />
      {children}
    </>
  );
}
