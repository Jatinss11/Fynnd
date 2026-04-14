'use client';
import { usePlan } from '@/lib/usePlan';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';

interface Props {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PLAN_LABELS: Record<string, string> = {
  aiInterviews: 'AI Interviews',
  atsAnalysis: 'ATS Analysis',
  advancedAnalytics: 'Advanced Analytics',
  bulkUpload: 'Bulk Upload',
  apiAccess: 'API Access',
  customBranding: 'Custom Branding',
};

const FEATURE_PLAN: Record<string, string> = {
  aiInterviews: 'Premium',
  atsAnalysis: 'Premium',
  advancedAnalytics: 'Premium',
  bulkUpload: 'Premium',
  apiAccess: 'Gold',
  customBranding: 'Gold',
};

export default function PlanGate({ feature, children, fallback }: Props) {
  const { user } = useAuthStore();
  const { canUse } = usePlan();

  if (user?.role !== 'client') return <>{children}</>;
  if (canUse(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="card border-dashed border-2 border-gray-200 flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
        <Lock size={20} className="text-gray-400" />
      </div>
      <p className="font-semibold text-gray-700">{PLAN_LABELS[feature] || feature} is locked</p>
      <p className="text-sm text-gray-400 mt-1 mb-4">Available on {FEATURE_PLAN[feature] || 'Premium'} plan and above</p>
      <Link href="/billing" className="btn-primary text-sm">
        <Zap size={14} /> Upgrade Plan
      </Link>
    </div>
  );
}
