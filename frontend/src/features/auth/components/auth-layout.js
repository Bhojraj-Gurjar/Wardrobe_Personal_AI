import { AuthHero } from '@/features/auth/components/auth-hero';

export function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <AuthHero />
      <div className="flex min-h-screen flex-col justify-center bg-auth-panel px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
