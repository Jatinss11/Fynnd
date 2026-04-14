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
    name: 'Arjun Sharma', email: 'admin@fynnd.in', password: 'Admin@123',
    role: 'admin', phone: '9876543210', city: 'Bengaluru', state: 'Karnataka',
  });

  // Create recruiters
  const [r1, r2] = await User.create([
    { name: 'Priya Nair', email: 'priya@fynnd.in', password: 'Test@123', role: 'recruiter', city: 'Mumbai', specializations: ['Tech', 'Product'] },
    { name: 'Rahul Verma', email: 'rahul@fynnd.in', password: 'Test@123', role: 'recruiter', city: 'Bengaluru', specializations: ['Engineering', 'Data'] },
  ]);

  // Create clients
  const [c1, c2, c3] = await User.create([
    { name: 'Sneha Kapoor', email: 'sneha@zomato.com', password: 'Test@123', role: 'client', company: 'Zomato', industry: 'Food Tech', companySize: '1000+', city: 'Gurugram' },
    { name: 'Vikram Singh', email: 'vikram@razorpay.com', password: 'Test@123', role: 'client', company: 'Razorpay', industry: 'Fintech', companySize: '500-1000', city: 'Bengaluru' },
    { name: 'Ananya Reddy', email: 'ananya@meesho.com', password: 'Test@123', role: 'client', company: 'Meesho', industry: 'E-commerce', companySize: '1000+', city: 'Bengaluru' },
  ]);

  // Create candidates
  await Candidate.create([
    {
      name: 'Aditya Kumar', email: 'aditya.kumar@gmail.com', phone: '9876501234',
      location: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka',
      currentCompany: 'Infosys', currentRole: 'Senior Software Engineer',
      experienceYears: 5, skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
      currentSalary: 18, expectedSalary: 25, noticePeriod: '30 days',
      willingToRelocate: true, source: 'manual', addedBy: r1._id,
      education: [{ degree: 'B.Tech Computer Science', institution: 'NIT Trichy', year: 2019 }],
    },
    {
      name: 'Kavya Menon', email: 'kavya.menon@gmail.com', phone: '9876502345',
      location: 'Mumbai', city: 'Mumbai', state: 'Maharashtra',
      currentCompany: 'Flipkart', currentRole: 'Product Manager',
      experienceYears: 4, skills: ['Product Management', 'Agile', 'SQL', 'Figma', 'Analytics'],
      currentSalary: 22, expectedSalary: 30, noticePeriod: '45 days',
      willingToRelocate: false, source: 'linkedin', addedBy: r1._id,
      education: [{ degree: 'MBA', institution: 'IIM Ahmedabad', year: 2020 }],
    },
    {
      name: 'Rohan Gupta', email: 'rohan.gupta@gmail.com', phone: '9876503456',
      location: 'Hyderabad', city: 'Hyderabad', state: 'Telangana',
      currentCompany: 'TCS', currentRole: 'Data Scientist',
      experienceYears: 3, skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Tableau'],
      currentSalary: 12, expectedSalary: 18, noticePeriod: '60 days',
      willingToRelocate: true, source: 'naukri', addedBy: r2._id,
      education: [{ degree: 'M.Tech Data Science', institution: 'IIT Hyderabad', year: 2021 }],
    },
    {
      name: 'Ishaan Patel', email: 'ishaan.patel@gmail.com', phone: '9876504567',
      location: 'Pune', city: 'Pune', state: 'Maharashtra',
      currentCompany: 'Wipro', currentRole: 'Backend Developer',
      experienceYears: 6, skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'Docker'],
      currentSalary: 20, expectedSalary: 28, noticePeriod: '30 days',
      willingToRelocate: true, source: 'referral', addedBy: r2._id,
      education: [{ degree: 'B.E. Computer Engineering', institution: 'COEP Pune', year: 2018 }],
    },
    {
      name: 'Divya Sharma', email: 'divya.sharma@gmail.com', phone: '9876505678',
      location: 'Delhi', city: 'Delhi', state: 'Delhi',
      currentCompany: 'Paytm', currentRole: 'Frontend Developer',
      experienceYears: 2, skills: ['React', 'Vue.js', 'CSS', 'JavaScript', 'Figma'],
      currentSalary: 8, expectedSalary: 12, noticePeriod: 'Immediate',
      willingToRelocate: true, source: 'portal', addedBy: r1._id,
      education: [{ degree: 'B.Tech IT', institution: 'DTU Delhi', year: 2022 }],
    },
    {
      name: 'Aryan Mehta', email: 'aryan.mehta@gmail.com', phone: '9876506789',
      location: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka',
      currentCompany: 'Swiggy', currentRole: 'DevOps Engineer',
      experienceYears: 4, skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
      currentSalary: 16, expectedSalary: 22, noticePeriod: '30 days',
      willingToRelocate: false, source: 'manual', addedBy: r2._id,
      education: [{ degree: 'B.Tech ECE', institution: 'VIT Vellore', year: 2020 }],
    },
  ]);

  // Create jobs
  await Job.create([
    {
      title: 'Senior Full Stack Engineer', company: 'Razorpay', clientId: c2._id, postedBy: r1._id,
      location: 'Bengaluru', cities: ['Bengaluru', 'Mumbai'], remote: 'hybrid',
      experienceMin: 4, experienceMax: 8, salaryMin: 20, salaryMax: 35,
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
      industry: 'Fintech', department: 'Engineering', employmentType: 'Full-time',
      openings: 3, urgency: 'urgent', status: 'open',
      description: 'Build and scale payment infrastructure used by millions of Indian businesses.',
    },
    {
      title: 'Product Manager - Growth', company: 'Zomato', clientId: c1._id, postedBy: r1._id,
      location: 'Gurugram', cities: ['Gurugram', 'Bengaluru'], remote: 'onsite',
      experienceMin: 3, experienceMax: 6, salaryMin: 25, salaryMax: 40,
      skills: ['Product Management', 'Analytics', 'SQL', 'Agile'],
      industry: 'Food Tech', department: 'Product', employmentType: 'Full-time',
      openings: 1, urgency: 'normal', status: 'open',
      description: 'Drive growth initiatives for Zomato\'s core ordering platform.',
    },
    {
      title: 'Data Scientist - ML Platform', company: 'Meesho', clientId: c3._id, postedBy: r2._id,
      location: 'Bengaluru', cities: ['Bengaluru'], remote: 'hybrid',
      experienceMin: 2, experienceMax: 5, salaryMin: 15, salaryMax: 28,
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
      industry: 'E-commerce', department: 'Data Science', employmentType: 'Full-time',
      openings: 2, urgency: 'urgent', status: 'open',
      description: 'Build recommendation and pricing ML models for 140M+ users.',
    },
  ]);

  console.log('✅ Seed complete!');
  console.log('\n📧 Login credentials:');
  console.log('Admin:     admin@fynnd.in     / Admin@123');
  console.log('Recruiter: priya@fynnd.in     / Test@123');
  console.log('Recruiter: rahul@fynnd.in     / Test@123');
  console.log('Client:    sneha@zomato.com   / Test@123');
  console.log('Client:    vikram@razorpay.com / Test@123');
  console.log('Client:    ananya@meesho.com  / Test@123');

  await mongoose.disconnect();
}

seed().catch(console.error);
