'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';

// Higher Order Component (HOC) to protect routes
export function withAuth(
  Component: React.ComponentType<any>,
  options: { redirectTo?: string } = {}
) {
  // Return a new component that wraps the original component
  return function AuthProtectedComponent(props: any) {
    return (
      <RequireAuth redirectTo={options.redirectTo}>
        <Component {...props} />
      </RequireAuth>
    );
  };
}

// Example usage:
// const ProtectedPage = withAuth(YourPageComponent, { redirectTo: '/auth/signin' });
