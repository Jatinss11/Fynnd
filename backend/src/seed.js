require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Candidate = require('./models/Candidate');
const Job = require('./models/Job');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fynnd';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await Promise.all([User.deleteMany(), Candidate.deleteMany(), Job.deleteMany()]);

  // Create admin
  const admin = await User.create({
    name: 'Alex Morgan', email: 'admin@fynnd.com', password: 'Admin@123',
    role: 'admin', phone: '+1-555-0100', city: 'San Francisco', state: 'California',
  });

  // Create recruiters
  const [r1, r2] = await User.create([
    { name: 'Sarah Chen', email: 'recruiter@fynnd.com', password: 'Test@123', role: 'recruiter', city: 'New York', specializations: ['Tech', 'Product'] },
    { name: 'James Okafor', email: 'james@fynnd.com', password: 'Test@123', role: 'recruiter', city: 'London', specializations: ['Engineering', 'Data'] },
  ]);

  // Create clients
  const [c1, c2, c3] = await User.create([
    { name: 'Emily Carter', email: 'client@acme.com', password: 'Test@123', role: 'client', company: 'Acme Corp', industry: 'SaaS', companySize: '1000+', city: 'San Francisco' },
    { name: 'David Park', email: 'david@techcorp.com', password: 'Test@123', role: 'client', company: 'TechCorp', industry: 'Fintech', companySize: '500-1000', city: 'New York' },
    { name: 'Lena Müller', email: 'lena@globalretail.com', password: 'Test@123', role: 'client', company: 'Global Retail', industry: 'E-commerce', companySize: '1000+', city: 'Berlin' },
  ]);

  // Create candidates
  await Candidate.create([
    {
      name: 'Marcus Johnson', email: 'marcus.j@gmail.com', phone: '+1-555-0201',
      location: 'San Francisco', city: 'San Francisco', state: 'California',
      currentCompany: 'Stripe', currentRole: 'Senior Software Engineer',
      experienceYears: 5, skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
      currentSalary: 140, expectedSalary: 170, noticePeriod: '30 days',
      willingToRelocate: true, source: 'manual', addedBy: r1._id,
      education: [{ degree: 'B.Sc Computer Science', institution: 'MIT', year: 2019 }],
    },
    {
      name: 'Priya Patel', email: 'priya.patel@gmail.com', phone: '+44-7700-900201',
      location: 'London', city: 'London', state: 'England',
      currentCompany: 'Shopify', currentRole: 'Product Manager',
      experienceYears: 4, skills: ['Product Management', 'Agile', 'SQL', 'Figma', 'Analytics'],
      currentSalary: 95, expectedSalary: 120, noticePeriod: '45 days',
      willingToRelocate: false, source: 'linkedin', addedBy: r1._id,
      education: [{ degree: 'MBA', institution: 'London Business School', year: 2020 }],
    },
    {
      name: 'Carlos Rivera', email: 'carlos.r@gmail.com', phone: '+1-555-0203',
      location: 'Austin', city: 'Austin', state: 'Texas',
      currentCompany: 'Databricks', currentRole: 'Data Scientist',
      experienceYears: 3, skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Tableau'],
      currentSalary: 110, expectedSalary: 140, noticePeriod: '60 days',
      willingToRelocate: true, source: 'portal', addedBy: r2._id,
      education: [{ degree: 'M.Sc Data Science', institution: 'Stanford University', year: 2021 }],
    },
    {
      name: 'Aisha Osei', email: 'aisha.osei@gmail.com', phone: '+1-555-0204',
      location: 'Toronto', city: 'Toronto', state: 'Ontario',
      currentCompany: 'Atlassian', currentRole: 'Backend Engineer',
      experienceYears: 6, skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'Docker'],
      currentSalary: 130, expectedSalary: 160, noticePeriod: '30 days',
      willingToRelocate: true, source: 'referral', addedBy: r2._id,
      education: [{ degree: 'B.Eng Software Engineering', institution: 'University of Toronto', year: 2018 }],
    },
    {
      name: 'Tom Nguyen', email: 'tom.nguyen@gmail.com', phone: '+61-400-000205',
      location: 'Sydney', city: 'Sydney', state: 'New South Wales',
      currentCompany: 'Canva', currentRole: 'Frontend Developer',
      experienceYears: 2, skills: ['React', 'Vue.js', 'CSS', 'JavaScript', 'Figma'],
      currentSalary: 85, expectedSalary: 105, noticePeriod: 'Immediate',
      willingToRelocate: true, source: 'portal', addedBy: r1._id,
      education: [{ degree: 'B.Sc Information Technology', institution: 'UNSW Sydney', year: 2022 }],
    },
    {
      name: 'Nina Kovač', email: 'nina.kovac@gmail.com', phone: '+49-30-000206',
      location: 'Berlin', city: 'Berlin', state: 'Berlin',
      currentCompany: 'Zalando', currentRole: 'DevOps Engineer',
      experienceYears: 4, skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
      currentSalary: 90, expectedSalary: 115, noticePeriod: '30 days',
      willingToRelocate: false, source: 'manual', addedBy: r2._id,
      education: [{ degree: 'B.Sc Computer Engineering', institution: 'TU Berlin', year: 2020 }],
    },
  ]);

  // Create jobs
  await Job.create([
    {
      title: 'Senior Full Stack Engineer', company: 'TechCorp', clientId: c2._id, postedBy: r1._id,
      location: 'New York', cities: ['New York', 'Remote'], remote: 'hybrid',
      experienceMin: 4, experienceMax: 8, salaryMin: 140, salaryMax: 200,
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
      industry: 'Fintech', department: 'Engineering', employmentType: 'Full-time',
      openings: 3, urgency: 'urgent', status: 'open',
      description: 'Build and scale payment infrastructure used by millions of businesses worldwide.',
    },
    {
      title: 'Product Manager - Growth', company: 'Acme Corp', clientId: c1._id, postedBy: r1._id,
      location: 'San Francisco', cities: ['San Francisco', 'Remote'], remote: 'hybrid',
      experienceMin: 3, experienceMax: 6, salaryMin: 120, salaryMax: 160,
      skills: ['Product Management', 'Analytics', 'SQL', 'Agile'],
      industry: 'SaaS', department: 'Product', employmentType: 'Full-time',
      openings: 1, urgency: 'normal', status: 'open',
      description: 'Drive growth initiatives for our core platform serving customers globally.',
    },
    {
      title: 'Data Scientist - ML Platform', company: 'Global Retail', clientId: c3._id, postedBy: r2._id,
      location: 'Berlin', cities: ['Berlin', 'Remote'], remote: 'hybrid',
      experienceMin: 2, experienceMax: 5, salaryMin: 90, salaryMax: 130,
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
      industry: 'E-commerce', department: 'Data Science', employmentType: 'Full-time',
      openings: 2, urgency: 'urgent', status: 'open',
      description: 'Build recommendation and pricing ML models for our global e-commerce platform.',
    },
  ]);

  console.log('✅ Seed complete!');
  console.log('\n📧 Login credentials:');
  console.log('Admin:     admin@fynnd.com      / Admin@123');
  console.log('Recruiter: recruiter@fynnd.com  / Test@123');
  console.log('Recruiter: james@fynnd.com      / Test@123');
  console.log('Client:    client@acme.com      / Test@123');
  console.log('Client:    david@techcorp.com   / Test@123');
  console.log('Client:    lena@globalretail.com / Test@123');

  await mongoose.disconnect();
}

seed().catch(console.error);
