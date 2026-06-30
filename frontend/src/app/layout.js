import { APP_DESCRIPTION, APP_NAME } from '@/constants/app';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
