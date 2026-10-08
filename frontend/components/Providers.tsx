'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

function HydrateAuth({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasGoogle = !!googleClientId && googleClientId !== 'your_google_oauth_client_id';

  const content = (
    <QueryClientProvider client={queryClient}>
      <HydrateAuth>
        {children}
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} />
      </HydrateAuth>
    </QueryClientProvider>
  );

  return hasGoogle ? (
    <GoogleOAuthProvider clientId={googleClientId!}>
      {content}
    </GoogleOAuthProvider>
  ) : content;
}
