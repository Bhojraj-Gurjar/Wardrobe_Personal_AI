import dynamic from 'next/dynamic';

export function createLazyView(importFn, options = {}) {
  const {
    loading = defaultLoading,
    ssr = true,
    ...rest
  } = options;

  return dynamic(importFn, {
    loading,
    ssr,
    ...rest,
  });
}

function defaultLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded-xl bg-white/5" />
      <div className="h-64 rounded-[24px] bg-white/5" />
    </div>
  );
}
