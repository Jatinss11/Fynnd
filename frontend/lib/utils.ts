import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLPA(amount?: number | null) {
  if (!amount) return '—';
  return `₹${amount} LPA`;
}

export function formatDate(date?: string | Date | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date?: string | Date | null) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const INDIAN_CITIES = [
  'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata',
  'Ahmedabad', 'Gurugram', 'Noida', 'Jaipur', 'Chandigarh', 'Kochi', 'Indore',
];

export const INDIAN_STATES = [
  'Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Tamil Nadu', 'Gujarat',
  'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Punjab', 'Kerala', 'Madhya Pradesh',
];

export const INDUSTRIES = [
  'Fintech', 'Food Tech', 'E-commerce', 'SaaS', 'EdTech', 'HealthTech',
  'Logistics', 'Gaming', 'Media', 'Consulting', 'Banking', 'Insurance',
  'Real Estate', 'Manufacturing', 'Retail', 'Telecom', 'IT Services',
];

export const NOTICE_PERIODS = ['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days', 'Serving notice'];

export const PIPELINE_STAGES = [
  'Sourced', 'Screening', 'Shortlisted',
  'Interview Round 1', 'Interview Round 2', 'HR Round',
  'Offer Released', 'Offer Accepted', 'Joined',
  'Rejected', 'Withdrawn',
];

export const STAGE_COLORS: Record<string, string> = {
  'Sourced':           'badge-gray',
  'Screening':         'badge-blue',
  'Shortlisted':       'badge-purple',
  'Interview Round 1': 'badge-yellow',
  'Interview Round 2': 'badge-yellow',
  'HR Round':          'badge-orange',
  'Offer Released':    'badge-orange',
  'Offer Accepted':    'badge-green',
  'Joined':            'badge-green',
  'Rejected':          'badge-red',
  'Withdrawn':         'badge-gray',
};

export const SCORE_COLOR = (score: number) => {
  if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
  return 'text-red-500 bg-red-50 border-red-100';
};
