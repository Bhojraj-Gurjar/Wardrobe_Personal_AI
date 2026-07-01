'use client';

import { Component } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { logVirtualTryOnError } from '../utils/virtual-try-on-guards.util';

export class VirtualTryOnErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logVirtualTryOnError('error-boundary', error, {
      componentStack: errorInfo?.componentStack,
    });

    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[virtual-try-on:error-boundary] Render crash:',
        error?.message || error,
        error?.stack,
      );
    }
  }

  handleRetry() {
    this.setState({ hasError: false });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="-mx-4 -mt-2 flex min-h-[80vh] items-center justify-center bg-[#090B18] px-4 py-6 md:-mx-6 lg:-mx-8">
        <div className="mx-auto max-w-md rounded-[20px] border border-white/[0.08] bg-[#141B2D] p-8 text-center shadow-[0_0_48px_rgba(124,58,237,0.1)]">
          <AlertTriangle className="mx-auto mb-4 size-10 text-amber-400" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="mt-3 text-sm text-white/50">
            Something went wrong while generating your Virtual Try-On.
            Please try again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Retry
            </button>
            <Link
              href={ROUTES.DASHBOARD.HOME}
              className="rounded-2xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.04]"
            >
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
