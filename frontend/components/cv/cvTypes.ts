export interface CVData {
  template: string;
  personal: {
    name: string;
    email: string;
    phone: string;
    city: string;
    linkedin: string;
    github: string;
    website: string;
    summary: string;
  };
  experience: {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    grade: string;
  }[];
  skills: string[];
  certifications: string[];
  languages: string[];
  jobTitle: string;
  jobDescription: string;
}

export const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean with indigo accent',
    previewBg: 'bg-gray-800',
    accentColor: 'bg-indigo-500',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional',
    previewBg: 'bg-slate-700',
    accentColor: 'bg-slate-400',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Dark header, high impact',
    previewBg: 'bg-gray-900',
    accentColor: 'bg-emerald-500',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean lines, lots of space',
    previewBg: 'bg-gray-700',
    accentColor: 'bg-orange-400',
  },
];
