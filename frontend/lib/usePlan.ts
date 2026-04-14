import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from './store';
import api from './api';

const PLAN_FEATURES: Record<string, string[]> = {
  basic:   [],
  premium: ['aiInterviews', 'atsAnalysis', 'advancedAnalytics', 'bulkUpload'],
  gold:    ['aiInterviews', 'atsAnalysis', 'advancedAnalytics', 'bulkUpload', 'apiAccess', 'customBranding'],
};

export function usePlan() {
  const { user } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/billing/subscription').then(r => r.data),
    enabled: user?.role === 'client',
    staleTime: 60_000,
  });

  const plan = data?.subscription?.plan || 'basic';
  const status = data?.subscription?.status || 'trial';

  const canUse = (feature: string): boolean => {
    if (user?.role !== 'client') return true; // admins/recruiters always have access
    if (status === 'expired' || status === 'cancelled') return false;
    return PLAN_FEATURES[plan]?.includes(feature) ?? false;
  };

  return {
    plan,
    status,
    subscription: data?.subscription,
    canUse,
  };
}
