/**
 * TaskFlow – Demo Data Seeder
 * Run:  npm run seed   (from project root)
 *       tsx server/scripts/seedDemoData.ts
 *
 * Safe to run multiple times – won't duplicate data.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── helpers ──────────────────────────────────────────────────────────────────
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── connection ───────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/taskflow';

async function connect() {
  await mongoose.connect(MONGO_URI);
}

// ─── raw collection handles (bypass timestamps for controlled createdAt) ───────
const col = {
  users:      () => mongoose.connection.collection('users'),
  projects:   () => mongoose.connection.collection('projects'),
  tasks:      () => mongoose.connection.collection('tasks'),
  activities: () => mongoose.connection.collection('activities'),
};

// ─── project definitions ──────────────────────────────────────────────────────
const PROJECT_DEFS = [
  { name: 'College',               color: '#3b82f6' }, // blue
  { name: 'Placement Preparation', color: '#8b5cf6' }, // purple
  { name: 'Personal',              color: '#22c55e' }, // green
  { name: 'Fitness',               color: '#f97316' }, // orange
  { name: 'Shopping',              color: '#ec4899' }, // pink
  { name: 'Work',                  color: '#6b7280' }, // gray
];

// ─── task definitions ─────────────────────────────────────────────────────────
type Status   = 'todo' | 'in-progress' | 'done';
type Priority = 'low' | 'medium' | 'high';
type Category = 'Study' | 'Work' | 'Personal' | 'Fitness' | 'Shopping' | 'Other';

interface TaskDef {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  dueDaysOffset: number; // negative = overdue, positive = future
  createdDaysAgo: number;
  tags: string[];
  subtasks: { title: string; completed: boolean }[];
}

const TASK_DEFS: Record<string, TaskDef[]> = {
  'College': [
    {
      title: 'Complete DBMS Assignment',
      description: 'Finish ER diagram, normalization up to 3NF, and SQL implementation for the university database project before Friday submission.',
      status: 'done', priority: 'high', category: 'Study',
      dueDaysOffset: -12, createdDaysAgo: 20, tags: ['dbms', 'sql', 'assignment'],
      subtasks: [{ title: 'Draw ER diagram', completed: true }, { title: 'Write SQL queries', completed: true }, { title: 'Submit on portal', completed: true }],
    },
    {
      title: 'Finish Operating Systems Lab',
      description: 'Complete the process scheduling simulation using Round Robin and FCFS algorithms. Document observations and submit the lab report.',
      status: 'in-progress', priority: 'high', category: 'Study',
      dueDaysOffset: 2, createdDaysAgo: 10, tags: ['os', 'lab', 'scheduling'],
      subtasks: [{ title: 'Implement Round Robin', completed: true }, { title: 'Implement FCFS', completed: false }, { title: 'Write lab report', completed: false }],
    },
    {
      title: 'Prepare AI Presentation',
      description: 'Create a 15-slide PowerPoint on Neural Networks for the AI seminar. Include architecture diagrams, activation functions, and real-world use cases.',
      status: 'todo', priority: 'high', category: 'Study',
      dueDaysOffset: 5, createdDaysAgo: 8, tags: ['ai', 'presentation', 'neural-networks'],
      subtasks: [{ title: 'Research neural networks', completed: false }, { title: 'Create slides', completed: false }],
    },
    {
      title: 'Submit Mini Project Report',
      description: 'Write the final project report for the MERN Stack Todo Application including system design, implementation details, and testing documentation.',
      status: 'todo', priority: 'high', category: 'Study',
      dueDaysOffset: 7, createdDaysAgo: 5, tags: ['project', 'report', 'mern'],
      subtasks: [{ title: 'System design section', completed: false }, { title: 'Implementation details', completed: false }, { title: 'Testing docs', completed: false }],
    },
    {
      title: 'Study Compiler Design',
      description: 'Revise lexical analysis, syntax analysis, and semantic analysis chapters. Solve previous year questions on parsing techniques and grammar.',
      status: 'done', priority: 'medium', category: 'Study',
      dueDaysOffset: -25, createdDaysAgo: 40, tags: ['compiler', 'theory'],
      subtasks: [{ title: 'Lexical analysis', completed: true }, { title: 'Syntax analysis', completed: true }],
    },
    {
      title: 'Revise Computer Networks',
      description: 'Go through OSI model layers, TCP/IP protocol suite, and routing algorithms. Practice subnetting problems and review network security concepts.',
      status: 'in-progress', priority: 'medium', category: 'Study',
      dueDaysOffset: 3, createdDaysAgo: 6, tags: ['networking', 'osi', 'tcp-ip'],
      subtasks: [{ title: 'OSI model', completed: true }, { title: 'TCP/IP', completed: true }, { title: 'Routing algorithms', completed: false }],
    },
    {
      title: 'Practice SQL Queries',
      description: 'Solve complex SQL problems on HackerRank – JOINs, subqueries, window functions, and aggregate functions for placement interview preparation.',
      status: 'done', priority: 'medium', category: 'Study',
      dueDaysOffset: -8, createdDaysAgo: 15, tags: ['sql', 'practice', 'placement'],
      subtasks: [],
    },
    {
      title: 'Complete Software Engineering Notes',
      description: 'Complete notes on SDLC models, Agile methodology, UML diagrams, and software testing strategies for the upcoming internal exam.',
      status: 'todo', priority: 'low', category: 'Study',
      dueDaysOffset: 10, createdDaysAgo: 3, tags: ['se', 'notes', 'agile'],
      subtasks: [],
    },
    {
      title: 'Read Machine Learning Chapter 4',
      description: 'Read and summarize Chapter 4 on Supervised Learning from ISLR book. Implement linear regression from scratch using NumPy.',
      status: 'todo', priority: 'medium', category: 'Study',
      dueDaysOffset: 14, createdDaysAgo: 4, tags: ['ml', 'reading', 'python'],
      subtasks: [],
    },
    {
      title: 'Prepare for Internal Exam',
      description: 'Revise all subjects – DBMS, OS, CN, and Software Engineering. Solve previous year question papers from the last 3 semesters.',
      status: 'in-progress', priority: 'high', category: 'Study',
      dueDaysOffset: 1, createdDaysAgo: 7, tags: ['exam', 'revision'],
      subtasks: [{ title: 'DBMS revision', completed: true }, { title: 'OS revision', completed: false }, { title: 'CN revision', completed: false }],
    },
    {
      title: 'Implement Linked List Assignment',
      description: 'Implement singly and doubly linked lists in C++ with insert, delete, search, and reverse operations for the Data Structures assignment.',
      status: 'done', priority: 'medium', category: 'Study',
      dueDaysOffset: -30, createdDaysAgo: 45, tags: ['dsa', 'cpp', 'assignment'],
      subtasks: [{ title: 'Singly linked list', completed: true }, { title: 'Doubly linked list', completed: true }, { title: 'Submit code', completed: true }],
    },
    {
      title: 'Study Cloud Computing',
      description: 'Learn about AWS EC2, S3, and deployment basics. Understand cloud service models (IaaS, PaaS, SaaS) and deployment models for the exam.',
      status: 'todo', priority: 'low', category: 'Study',
      dueDaysOffset: 21, createdDaysAgo: 2, tags: ['cloud', 'aws', 'devops'],
      subtasks: [],
    },
  ],

  'Placement Preparation': [
    {
      title: 'Solve Two Sum Problem',
      description: 'Solve LeetCode Two Sum using HashMap approach. Understand time complexity O(n) vs brute force O(n²). Add to revision notes.',
      status: 'done', priority: 'high', category: 'Work',
      dueDaysOffset: -20, createdDaysAgo: 30, tags: ['leetcode', 'dsa', 'hashmap'],
      subtasks: [{ title: 'Brute force solution', completed: true }, { title: 'HashMap solution', completed: true }, { title: 'Note complexity', completed: true }],
    },
    {
      title: 'Practice Binary Search',
      description: 'Solve 10 binary search problems on LeetCode. Cover variations: rotated array, first/last occurrence, search in 2D matrix.',
      status: 'done', priority: 'high', category: 'Work',
      dueDaysOffset: -15, createdDaysAgo: 25, tags: ['leetcode', 'binary-search'],
      subtasks: [],
    },
    {
      title: 'Dynamic Programming Revision',
      description: 'Revise DP concepts: memoization vs tabulation. Solve classic problems – Knapsack, LCS, LIS, Matrix Chain Multiplication.',
      status: 'in-progress', priority: 'high', category: 'Work',
      dueDaysOffset: 3, createdDaysAgo: 12, tags: ['dp', 'algorithms', 'leetcode'],
      subtasks: [{ title: 'Knapsack variations', completed: true }, { title: 'LCS and LIS', completed: true }, { title: 'Matrix chain', completed: false }],
    },
    {
      title: 'Mock Interview Session',
      description: 'Schedule a mock interview on Pramp or Interviewing.io. Practice coding under time pressure with communication of thought process.',
      status: 'todo', priority: 'high', category: 'Work',
      dueDaysOffset: 0, createdDaysAgo: 2, tags: ['mock-interview', 'practice'],
      subtasks: [{ title: 'Book session on Pramp', completed: false }, { title: 'Prepare problem list', completed: false }],
    },
    {
      title: 'Revise OOP Concepts',
      description: 'Review all four pillars: Encapsulation, Inheritance, Polymorphism, Abstraction. Prepare Java and Python code examples for each.',
      status: 'done', priority: 'medium', category: 'Work',
      dueDaysOffset: -5, createdDaysAgo: 20, tags: ['oop', 'java', 'concepts'],
      subtasks: [],
    },
    {
      title: 'Practice HR Questions',
      description: 'Prepare answers to top 30 HR interview questions: Tell me about yourself, strengths/weaknesses, conflict resolution, career goals.',
      status: 'in-progress', priority: 'medium', category: 'Other',
      dueDaysOffset: 5, createdDaysAgo: 7, tags: ['hr', 'interview', 'soft-skills'],
      subtasks: [{ title: 'Tell me about yourself', completed: true }, { title: 'Strengths & weaknesses', completed: false }],
    },
    {
      title: 'Update Resume',
      description: 'Add MERN Stack Todo App to projects section. Update skills with React, Node.js, MongoDB. Get it reviewed using Resume Worded.',
      status: 'done', priority: 'high', category: 'Work',
      dueDaysOffset: -10, createdDaysAgo: 18, tags: ['resume', 'job-search'],
      subtasks: [{ title: 'Add new projects', completed: true }, { title: 'Update skills section', completed: true }, { title: 'ATS check', completed: true }],
    },
    {
      title: 'Apply on LinkedIn',
      description: 'Apply to 10 SDE intern positions on LinkedIn. Target companies: Razorpay, Zepto, Groww, CRED, and other product startups.',
      status: 'in-progress', priority: 'high', category: 'Other',
      dueDaysOffset: -1, createdDaysAgo: 5, tags: ['job-application', 'linkedin'],
      subtasks: [{ title: 'Update LinkedIn profile', completed: true }, { title: 'Apply to 10 companies', completed: false }],
    },
    {
      title: 'Apply to Microsoft',
      description: 'Apply for Microsoft SDE Intern role through careers.microsoft.com. Tailor resume to highlight Azure, .NET, and system design skills.',
      status: 'todo', priority: 'high', category: 'Other',
      dueDaysOffset: 2, createdDaysAgo: 1, tags: ['microsoft', 'job-application'],
      subtasks: [],
    },
    {
      title: 'Study System Design',
      description: 'Learn system design fundamentals: Load Balancing, Caching, Database Sharding, CAP theorem. Study Grokking the System Design Interview.',
      status: 'todo', priority: 'high', category: 'Work',
      dueDaysOffset: 14, createdDaysAgo: 3, tags: ['system-design', 'scalability'],
      subtasks: [{ title: 'Load balancing', completed: false }, { title: 'Caching strategies', completed: false }, { title: 'Database design', completed: false }],
    },
    {
      title: 'Practice Trees and Graphs',
      description: 'Solve 15 tree and graph problems: BFS, DFS, Dijkstra, topological sort, cycle detection, LCA. Document patterns in a cheat sheet.',
      status: 'todo', priority: 'medium', category: 'Work',
      dueDaysOffset: 7, createdDaysAgo: 2, tags: ['dsa', 'graphs', 'trees'],
      subtasks: [],
    },
    {
      title: 'Revise DBMS Interview Questions',
      description: 'Prepare for top 50 DBMS interview questions: ACID properties, normalization, indexing, transactions, and SQL query optimization.',
      status: 'done', priority: 'medium', category: 'Study',
      dueDaysOffset: -7, createdDaysAgo: 22, tags: ['dbms', 'sql', 'interview'],
      subtasks: [],
    },
  ],

  'Personal': [
    {
      title: 'Call Parents',
      description: 'Call home and have a long conversation. Update them about college progress, placement preparation, and upcoming exams.',
      status: 'done', priority: 'high', category: 'Personal',
      dueDaysOffset: -3, createdDaysAgo: 10, tags: ['family', 'personal'],
      subtasks: [],
    },
    {
      title: 'Pay Electricity Bill',
      description: 'Pay the monthly electricity bill online through the MSEB portal before the due date to avoid late fee charges.',
      status: 'done', priority: 'high', category: 'Personal',
      dueDaysOffset: -2, createdDaysAgo: 8, tags: ['bills', 'urgent'],
      subtasks: [],
    },
    {
      title: 'Visit Dentist',
      description: 'Schedule and attend a routine dental checkup. Get a cleaning done and address the tooth sensitivity issue reported last month.',
      status: 'todo', priority: 'medium', category: 'Personal',
      dueDaysOffset: 10, createdDaysAgo: 5, tags: ['health', 'appointment'],
      subtasks: [{ title: 'Book appointment', completed: false }, { title: 'Visit clinic', completed: false }],
    },
    {
      title: 'Read 20 Pages',
      description: 'Continue reading "Atomic Habits" by James Clear. Target 20 pages daily to finish the book within two weeks.',
      status: 'in-progress', priority: 'low', category: 'Personal',
      dueDaysOffset: 1, createdDaysAgo: 14, tags: ['reading', 'self-improvement'],
      subtasks: [],
    },
    {
      title: 'Watch React Tutorial',
      description: 'Complete the React 19 full course on YouTube. Focus on hooks, context API, and performance optimization patterns.',
      status: 'done', priority: 'medium', category: 'Personal',
      dueDaysOffset: -14, createdDaysAgo: 25, tags: ['react', 'learning', 'frontend'],
      subtasks: [{ title: 'Hooks deep dive', completed: true }, { title: 'Context API', completed: true }, { title: 'Performance patterns', completed: true }],
    },
    {
      title: 'Morning Meditation',
      description: 'Practice 10-minute guided meditation using the Headspace app every morning before studies to improve focus and reduce exam stress.',
      status: 'in-progress', priority: 'low', category: 'Personal',
      dueDaysOffset: 0, createdDaysAgo: 30, tags: ['wellness', 'mindfulness'],
      subtasks: [],
    },
    {
      title: 'Clean Room',
      description: 'Deep clean the room: organize study desk, clear clutter, vacuum floor, and organize books and notes by subject.',
      status: 'done', priority: 'low', category: 'Personal',
      dueDaysOffset: -6, createdDaysAgo: 12, tags: ['cleaning', 'organization'],
      subtasks: [{ title: 'Organize desk', completed: true }, { title: 'Sort books', completed: true }, { title: 'Vacuum floor', completed: true }],
    },
    {
      title: 'Do Laundry',
      description: 'Wash, dry, and fold all clothes. Separately wash gym clothes and hang them to dry. Iron formal clothes for interviews.',
      status: 'todo', priority: 'low', category: 'Personal',
      dueDaysOffset: 1, createdDaysAgo: 2, tags: ['chores', 'personal'],
      subtasks: [],
    },
    {
      title: 'Book Train Ticket',
      description: 'Book IRCTC train ticket for the upcoming visit home during mid-semester break. Book at least 2 weeks in advance.',
      status: 'done', priority: 'high', category: 'Personal',
      dueDaysOffset: -20, createdDaysAgo: 35, tags: ['travel', 'booking'],
      subtasks: [],
    },
    {
      title: 'Backup Laptop',
      description: 'Backup all important files – college projects, assignment documents, code repositories, and photos to external hard drive and Google Drive.',
      status: 'todo', priority: 'medium', category: 'Personal',
      dueDaysOffset: 5, createdDaysAgo: 3, tags: ['backup', 'data'],
      subtasks: [{ title: 'Copy to external drive', completed: false }, { title: 'Upload to Google Drive', completed: false }],
    },
    {
      title: 'Reply to Emails',
      description: 'Clear the email inbox – reply to internship application follow-ups, college portal notifications, and professor emails.',
      status: 'in-progress', priority: 'medium', category: 'Other',
      dueDaysOffset: 0, createdDaysAgo: 1, tags: ['email', 'communication'],
      subtasks: [],
    },
    {
      title: 'Plan Weekend Study Schedule',
      description: "Plan this weekend's study schedule. Allocate time blocks for each subject, LeetCode practice, and project work.",
      status: 'todo', priority: 'low', category: 'Personal',
      dueDaysOffset: 3, createdDaysAgo: 1, tags: ['planning', 'schedule'],
      subtasks: [],
    },
  ],

  'Fitness': [
    {
      title: 'Push Day Workout',
      description: 'Chest, shoulders, triceps. Bench press 4x8, Overhead press 3x10, Incline dumbbell press 3x12, Lateral raises 4x15, Tricep pushdowns 3x15.',
      status: 'done', priority: 'high', category: 'Fitness',
      dueDaysOffset: -1, createdDaysAgo: 30, tags: ['gym', 'push', 'chest'],
      subtasks: [{ title: 'Bench press', completed: true }, { title: 'Overhead press', completed: true }, { title: 'Lateral raises', completed: true }],
    },
    {
      title: 'Pull Day Workout',
      description: 'Back and biceps. Deadlift 4x5, Pull-ups 4x8, Barbell rows 3x10, Face pulls 4x15, Hammer curls 3x12. Focus on mind-muscle connection.',
      status: 'done', priority: 'high', category: 'Fitness',
      dueDaysOffset: -2, createdDaysAgo: 30, tags: ['gym', 'pull', 'back'],
      subtasks: [],
    },
    {
      title: 'Leg Day Workout',
      description: "Squats 4x8, Romanian deadlift 3x10, Leg press 3x12, Leg curls 4x12, Calf raises 5x20. Don't skip legs.",
      status: 'in-progress', priority: 'high', category: 'Fitness',
      dueDaysOffset: 0, createdDaysAgo: 1, tags: ['gym', 'legs', 'squats'],
      subtasks: [{ title: 'Squats', completed: true }, { title: 'Romanian deadlift', completed: false }, { title: 'Calf raises', completed: false }],
    },
    {
      title: 'Morning Walk',
      description: '30-minute brisk morning walk in the park. Aim for 4,000 steps minimum. Listen to a podcast or revision notes while walking.',
      status: 'done', priority: 'low', category: 'Fitness',
      dueDaysOffset: -1, createdDaysAgo: 20, tags: ['cardio', 'morning', 'walk'],
      subtasks: [],
    },
    {
      title: 'Track Daily Calories',
      description: 'Log all meals on MyFitnessPal. Target 2500 calories with 160g protein, 250g carbs, 70g fat for lean bulk phase.',
      status: 'in-progress', priority: 'medium', category: 'Fitness',
      dueDaysOffset: 0, createdDaysAgo: 45, tags: ['nutrition', 'tracking', 'diet'],
      subtasks: [],
    },
    {
      title: 'Meal Prep Sunday',
      description: 'Cook and portion meals for the week – grilled chicken breast, brown rice, boiled eggs, oats, and broccoli for 5 days.',
      status: 'todo', priority: 'medium', category: 'Fitness',
      dueDaysOffset: 3, createdDaysAgo: 2, tags: ['meal-prep', 'nutrition'],
      subtasks: [{ title: 'Buy ingredients', completed: false }, { title: 'Cook and portion', completed: false }],
    },
    {
      title: 'Drink 3L Water Daily',
      description: 'Track water intake using a 1L bottle. Drink one full bottle before noon, one in afternoon, and one by evening.',
      status: 'done', priority: 'low', category: 'Fitness',
      dueDaysOffset: -1, createdDaysAgo: 60, tags: ['hydration', 'habit'],
      subtasks: [],
    },
    {
      title: 'Cardio Session',
      description: '25-minute LISS cardio on treadmill at 6 km/h, followed by 10-minute HIIT intervals for maximum fat burning.',
      status: 'todo', priority: 'medium', category: 'Fitness',
      dueDaysOffset: 1, createdDaysAgo: 3, tags: ['cardio', 'hiit', 'fat-loss'],
      subtasks: [],
    },
    {
      title: 'Measure Body Weight',
      description: 'Weigh in every Monday morning on an empty stomach. Log in Google Sheets to track progress over the 12-week program.',
      status: 'done', priority: 'low', category: 'Fitness',
      dueDaysOffset: -5, createdDaysAgo: 12, tags: ['tracking', 'progress'],
      subtasks: [],
    },
    {
      title: 'Stretching and Flexibility',
      description: '20-minute full body stretching routine post-workout. Focus on hip flexors, hamstrings, and thoracic spine mobility.',
      status: 'in-progress', priority: 'low', category: 'Fitness',
      dueDaysOffset: 0, createdDaysAgo: 15, tags: ['flexibility', 'recovery'],
      subtasks: [],
    },
    {
      title: 'Buy Whey Protein',
      description: 'Order MuscleBlaze Whey Gold 2kg from Amazon. Check for ongoing deals and apply credit card offer for 10% cashback.',
      status: 'done', priority: 'medium', category: 'Shopping',
      dueDaysOffset: -18, createdDaysAgo: 25, tags: ['supplements', 'protein', 'shopping'],
      subtasks: [],
    },
  ],

  'Shopping': [
    {
      title: 'Buy Laptop Stand',
      description: 'Purchase an adjustable aluminium laptop stand for ergonomic desk setup. Budget: ₹1000-1500. Check Amazon and Flipkart.',
      status: 'done', priority: 'medium', category: 'Shopping',
      dueDaysOffset: -22, createdDaysAgo: 35, tags: ['laptop', 'desk-setup', 'ergonomic'],
      subtasks: [],
    },
    {
      title: 'Order Wireless Mouse',
      description: 'Buy a wireless mouse for better productivity. Logitech M235 or similar. Need silent click and good battery life.',
      status: 'done', priority: 'medium', category: 'Shopping',
      dueDaysOffset: -30, createdDaysAgo: 42, tags: ['mouse', 'peripherals'],
      subtasks: [],
    },
    {
      title: 'Purchase Protein Powder',
      description: 'Order Optimum Nutrition Gold Standard Whey 2.27kg from Amazon. Flavor: Double Rich Chocolate. Apply HDFC cashback offer.',
      status: 'in-progress', priority: 'high', category: 'Shopping',
      dueDaysOffset: 1, createdDaysAgo: 2, tags: ['protein', 'fitness', 'supplements'],
      subtasks: [{ title: 'Compare prices', completed: true }, { title: 'Apply coupon and order', completed: false }],
    },
    {
      title: 'Buy Water Bottle',
      description: 'Purchase a 1L stainless steel insulated water bottle for gym and daily use. Budget: ₹500-800.',
      status: 'done', priority: 'low', category: 'Shopping',
      dueDaysOffset: -40, createdDaysAgo: 55, tags: ['gym', 'bottle'],
      subtasks: [],
    },
    {
      title: 'Purchase Notebooks',
      description: 'Buy 5 college notebooks (200 pages each) for new semester subjects. Also get highlighters and sticky notes.',
      status: 'done', priority: 'medium', category: 'Shopping',
      dueDaysOffset: -50, createdDaysAgo: 65, tags: ['stationery', 'college'],
      subtasks: [],
    },
    {
      title: 'Buy Mechanical Keyboard',
      description: 'Research and purchase a budget mechanical keyboard for coding. Preferred: Keychron K2 or Royal Kludge RK61. Budget: ₹3000-5000.',
      status: 'todo', priority: 'low', category: 'Shopping',
      dueDaysOffset: 30, createdDaysAgo: 5, tags: ['keyboard', 'setup', 'coding'],
      subtasks: [{ title: 'Research options', completed: false }, { title: 'Order', completed: false }],
    },
    {
      title: 'Buy Running Shoes',
      description: 'Purchase a good pair of running shoes for morning walks and cardio. Nike Revolution 6 or Adidas Duramo. Budget: ₹2500-4000.',
      status: 'todo', priority: 'medium', category: 'Shopping',
      dueDaysOffset: 14, createdDaysAgo: 3, tags: ['shoes', 'fitness', 'running'],
      subtasks: [],
    },
    {
      title: 'Order Groceries',
      description: 'Order weekly grocery essentials from Blinkit – oats, eggs, chicken breast, brown rice, bananas, spinach, and cooking oil.',
      status: 'in-progress', priority: 'high', category: 'Shopping',
      dueDaysOffset: 0, createdDaysAgo: 1, tags: ['groceries', 'food', 'weekly'],
      subtasks: [{ title: 'Make grocery list', completed: true }, { title: 'Place order', completed: false }],
    },
    {
      title: 'Buy Casual T-shirts',
      description: 'Order 3-4 comfortable cotton t-shirts for college. Check H&M or Myntra for deals. Budget: ₹500-800 per piece.',
      status: 'todo', priority: 'low', category: 'Shopping',
      dueDaysOffset: 21, createdDaysAgo: 2, tags: ['clothing', 'fashion'],
      subtasks: [],
    },
    {
      title: 'Buy College Backpack',
      description: 'Purchase a laptop backpack with good padding and multiple compartments. Wildcraft or American Tourister. Budget: ₹1500-2500.',
      status: 'done', priority: 'medium', category: 'Shopping',
      dueDaysOffset: -60, createdDaysAgo: 80, tags: ['bag', 'college'],
      subtasks: [],
    },
  ],

  'Work': [
    {
      title: 'Fix Login Bug',
      description: 'Investigate and fix the authentication bug where users get logged out unexpectedly after 15 minutes. Trace the JWT refresh token flow.',
      status: 'done', priority: 'high', category: 'Work',
      dueDaysOffset: -10, createdDaysAgo: 15, tags: ['bug', 'auth', 'jwt'],
      subtasks: [{ title: 'Identify root cause', completed: true }, { title: 'Fix refresh token logic', completed: true }, { title: 'Test edge cases', completed: true }],
    },
    {
      title: 'Deploy Backend to Railway',
      description: 'Deploy the Node.js Express backend to Railway.app. Configure environment variables, set up MongoDB Atlas connection, and test all API endpoints.',
      status: 'in-progress', priority: 'high', category: 'Work',
      dueDaysOffset: 2, createdDaysAgo: 5, tags: ['deployment', 'backend', 'railway'],
      subtasks: [{ title: 'Set up Railway project', completed: true }, { title: 'Configure env variables', completed: true }, { title: 'Test API endpoints', completed: false }],
    },
    {
      title: 'Fix Calendar Date Issue',
      description: 'Fix the bug where tasks due on the last day of the month are not showing in the calendar view. Investigate date timezone handling.',
      status: 'done', priority: 'high', category: 'Work',
      dueDaysOffset: -5, createdDaysAgo: 12, tags: ['bug', 'calendar', 'frontend'],
      subtasks: [],
    },
    {
      title: 'Optimize Database Queries',
      description: 'Add compound indexes to the Tasks collection for (owner, status) and (owner, dueDate) to improve dashboard query performance.',
      status: 'done', priority: 'medium', category: 'Work',
      dueDaysOffset: -8, createdDaysAgo: 20, tags: ['mongodb', 'performance', 'indexing'],
      subtasks: [],
    },
    {
      title: 'Review Pull Request',
      description: "Review teammate's PR for the new Kanban board feature. Check for code quality, edge cases, proper error handling, and TypeScript types.",
      status: 'todo', priority: 'medium', category: 'Work',
      dueDaysOffset: 0, createdDaysAgo: 1, tags: ['code-review', 'pr', 'collaboration'],
      subtasks: [],
    },
    {
      title: 'Update API Documentation',
      description: 'Update the README with all new API endpoints. Document request/response format, authentication headers, and error codes for each route.',
      status: 'in-progress', priority: 'medium', category: 'Work',
      dueDaysOffset: 7, createdDaysAgo: 8, tags: ['documentation', 'api', 'readme'],
      subtasks: [{ title: 'Auth endpoints', completed: true }, { title: 'Tasks endpoints', completed: false }, { title: 'Analytics endpoints', completed: false }],
    },
    {
      title: 'Improve Dashboard UI',
      description: 'Redesign the dashboard summary cards to show more meaningful data. Add progress bars for task completion rate and color-coded priority indicators.',
      status: 'done', priority: 'medium', category: 'Work',
      dueDaysOffset: -15, createdDaysAgo: 28, tags: ['ui', 'dashboard', 'frontend'],
      subtasks: [],
    },
    {
      title: 'Refactor Auth Middleware',
      description: 'Refactor the authentication middleware to use a cleaner pattern. Extract token validation logic, add proper TypeScript types, and handle edge cases.',
      status: 'done', priority: 'low', category: 'Work',
      dueDaysOffset: -20, createdDaysAgo: 35, tags: ['refactor', 'auth', 'backend'],
      subtasks: [],
    },
    {
      title: 'Write Unit Tests',
      description: 'Write Jest unit tests for authentication routes, task CRUD operations, and analytics endpoints. Target 80% code coverage.',
      status: 'in-progress', priority: 'high', category: 'Work',
      dueDaysOffset: 5, createdDaysAgo: 10, tags: ['testing', 'jest', 'backend'],
      subtasks: [{ title: 'Auth tests', completed: true }, { title: 'Tasks tests', completed: true }, { title: 'Analytics tests', completed: false }],
    },
    {
      title: 'Fix Responsive Layout',
      description: 'Fix mobile responsive layout issues on the dashboard and calendar pages. Ensure proper display on 320px, 375px, and 768px screen widths.',
      status: 'todo', priority: 'medium', category: 'Work',
      dueDaysOffset: 4, createdDaysAgo: 3, tags: ['responsive', 'css', 'mobile'],
      subtasks: [],
    },
    {
      title: 'Update README',
      description: 'Update the project README with setup instructions, environment variables guide, features list, screenshots, and deployment steps.',
      status: 'in-progress', priority: 'low', category: 'Work',
      dueDaysOffset: 10, createdDaysAgo: 6, tags: ['documentation', 'readme'],
      subtasks: [{ title: 'Setup instructions', completed: true }, { title: 'Add screenshots', completed: false }],
    },
    {
      title: 'Deploy Frontend to Vercel',
      description: 'Deploy the React frontend to Vercel. Configure the proxy URL to point to the Railway backend. Test the full application flow.',
      status: 'todo', priority: 'high', category: 'Work',
      dueDaysOffset: 3, createdDaysAgo: 2, tags: ['deployment', 'vercel', 'frontend'],
      subtasks: [{ title: 'Connect GitHub repo', completed: false }, { title: 'Set VITE_API_URL env var', completed: false }, { title: 'Test end-to-end', completed: false }],
    },
  ],
};

// ─── activity templates ────────────────────────────────────────────────────────
type ActivityType = 
  | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_DELETED'
  | 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED'
  | 'PROFILE_UPDATED' | 'PASSWORD_CHANGED';

const ACTIVITY_TEMPLATES: { type: ActivityType; message: string; daysAgo: number }[] = [
  { type: 'TASK_CREATED',    message: 'Created task "Complete DBMS Assignment"',           daysAgo: 60 },
  { type: 'PROJECT_CREATED', message: 'Created project "College"',                         daysAgo: 60 },
  { type: 'PROJECT_CREATED', message: 'Created project "Placement Preparation"',           daysAgo: 59 },
  { type: 'TASK_CREATED',    message: 'Created task "Solve Two Sum Problem"',              daysAgo: 58 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Implement Linked List Assignment"', daysAgo: 57 },
  { type: 'PROJECT_CREATED', message: 'Created project "Fitness"',                         daysAgo: 56 },
  { type: 'TASK_CREATED',    message: 'Created task "Push Day Workout"',                   daysAgo: 55 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Buy College Backpack"',             daysAgo: 54 },
  { type: 'TASK_CREATED',    message: 'Created task "Book Train Ticket"',                  daysAgo: 52 },
  { type: 'PROJECT_CREATED', message: 'Created project "Shopping"',                        daysAgo: 51 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Buy Laptop Stand"',                 daysAgo: 50 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Book Train Ticket"',                daysAgo: 48 },
  { type: 'TASK_CREATED',    message: 'Created task "Study Compiler Design"',              daysAgo: 47 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Study Compiler Design"',            daysAgo: 45 },
  { type: 'TASK_CREATED',    message: 'Created task "Practice Binary Search"',             daysAgo: 44 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Purchase Notebooks"',               daysAgo: 43 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Buy Water Bottle"',                 daysAgo: 42 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Order Wireless Mouse"',             daysAgo: 41 },
  { type: 'PROFILE_UPDATED', message: 'Updated profile information',                       daysAgo: 40 },
  { type: 'TASK_CREATED',    message: 'Created task "Update Resume"',                      daysAgo: 38 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Update Resume"',                    daysAgo: 36 },
  { type: 'TASK_CREATED',    message: 'Created task "Revise Computer Networks"',           daysAgo: 35 },
  { type: 'PROJECT_CREATED', message: 'Created project "Work"',                            daysAgo: 34 },
  { type: 'TASK_CREATED',    message: 'Created task "Fix Login Bug"',                      daysAgo: 33 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Refactor Auth Middleware"',         daysAgo: 32 },
  { type: 'TASK_CREATED',    message: 'Created task "Watch React Tutorial"',               daysAgo: 30 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Watch React Tutorial"',             daysAgo: 28 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Revise OOP Concepts"',             daysAgo: 27 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Revise DBMS Interview Questions"', daysAgo: 25 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Practice SQL Queries"',            daysAgo: 24 },
  { type: 'TASK_CREATED',    message: 'Created task "Improve Dashboard UI"',              daysAgo: 23 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Improve Dashboard UI"',            daysAgo: 21 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Buy Whey Protein"',               daysAgo: 20 },
  { type: 'TASK_CREATED',    message: 'Created task "Mock Interview Session"',            daysAgo: 18 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Fix Calendar Date Issue"',        daysAgo: 17 },
  { type: 'PASSWORD_CHANGED',message: 'Changed account password',                         daysAgo: 16 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Fix Login Bug"',                  daysAgo: 15 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Optimize Database Queries"',      daysAgo: 14 },
  { type: 'TASK_CREATED',    message: 'Created task "Write Unit Tests"',                 daysAgo: 13 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Call Parents"',                   daysAgo: 12 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Pay Electricity Bill"',           daysAgo: 11 },
  { type: 'TASK_COMPLETED',  message: 'Completed task "Clean Room"',                     daysAgo: 10 },
  { type: 'TASK_CREATED',    message: 'Created task "Deploy Backend to Railway"',        daysAgo: 8 },
  { type: 'TASK_CREATED',    message: 'Created task "Deploy Frontend to Vercel"',        daysAgo: 5 },
  { type: 'TASK_UPDATED',    message: 'Updated task "Revise Computer Networks"',         daysAgo: 4 },
  { type: 'TASK_CREATED',    message: 'Created task "Study System Design"',              daysAgo: 3 },
  { type: 'TASK_CREATED',    message: 'Created task "Apply to Microsoft"',               daysAgo: 2 },
  { type: 'TASK_UPDATED',    message: 'Updated task "Deploy Backend to Railway"',        daysAgo: 1 },
];

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  TaskFlow Demo Data Seeder\n' + '─'.repeat(40));
  await connect();
  console.log('✅  MongoDB connected\n');

  // ── 1. Demo User ────────────────────────────────────────────────────────────
  console.log('👤  Creating Demo User...');
  const DEMO_EMAIL = 'demo@taskflow.com';
  
  let userId: mongoose.Types.ObjectId;
  const existingUser = await col.users().findOne({ email: DEMO_EMAIL });

  if (existingUser) {
    console.log('    ℹ️  Demo User already exists – skipping user creation.');
    userId = existingUser._id as mongoose.Types.ObjectId;

    // Check if projects already seeded
    const existingProjects = await col.projects().countDocuments({ owner: userId });
    if (existingProjects >= 6) {
      console.log('    ℹ️  Demo data already seeded for this user.\n');
      console.log('    Demo Credentials');
      console.log(`    Email:    ${DEMO_EMAIL}`);
      console.log('    Password: Demo@123\n');
      process.exit(0);
    }
  } else {
    const passwordHash = await bcrypt.hash('Demo@123', 12);
    userId = new mongoose.Types.ObjectId();
    const threeMonthsAgo = daysAgo(90);
    await col.users().insertOne({
      _id: userId,
      name: 'Demo User',
      email: DEMO_EMAIL,
      passwordHash,
      createdAt: threeMonthsAgo,
      updatedAt: threeMonthsAgo,
    });
    console.log('    ✅  Demo User created.\n');
  }

  // ── 2. Projects ─────────────────────────────────────────────────────────────
  console.log(`📁  Creating ${PROJECT_DEFS.length} Projects...`);
  const projectMap: Record<string, mongoose.Types.ObjectId> = {};

  const projectDocs = PROJECT_DEFS.map((p, i) => {
    const id = new mongoose.Types.ObjectId();
    projectMap[p.name] = id;
    const createdAt = daysAgo(90 - i * 2);
    return {
      _id: id,
      name: p.name,
      owner: userId,
      color: p.color,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await col.projects().insertMany(projectDocs);
  console.log('    ✅  Projects created.\n');

  // ── 3. Tasks ─────────────────────────────────────────────────────────────────
  const totalTaskCount = Object.values(TASK_DEFS).reduce((s, arr) => s + arr.length, 0);
  console.log(`✅  Creating ${totalTaskCount} Tasks...`);

  const taskDocs: object[] = [];

  for (const [projectName, tasks] of Object.entries(TASK_DEFS)) {
    const projectId = projectMap[projectName];

    for (const t of tasks) {
      const taskId = new mongoose.Types.ObjectId();
      const createdAt = daysAgo(t.createdDaysAgo);
      const dueDate = t.dueDaysOffset < 0
        ? daysAgo(Math.abs(t.dueDaysOffset))
        : daysFromNow(t.dueDaysOffset);
      const completedAt = t.status === 'done' ? daysAgo(Math.max(1, t.createdDaysAgo - 2)) : undefined;

      taskDocs.push({
        _id: taskId,
        title: t.title,
        description: t.description,
        owner: userId,
        project: projectId,
        status: t.status,
        priority: t.priority,
        category: t.category,
        dueDate,
        tags: t.tags,
        subtasks: t.subtasks.map(st => ({ _id: new mongoose.Types.ObjectId(), ...st })),
        completedAt,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  await col.tasks().insertMany(taskDocs);
  console.log('    ✅  Tasks created.\n');

  // ── 4. Activities ────────────────────────────────────────────────────────────
  console.log(`📋  Creating ${ACTIVITY_TEMPLATES.length} Activities...`);

  const activityDocs = ACTIVITY_TEMPLATES.map(a => ({
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    type: a.type,
    message: a.message,
    createdAt: daysAgo(a.daysAgo),
  }));

  await col.activities().insertMany(activityDocs);
  console.log('    ✅  Activities created.\n');

  // ── Done ──────────────────────────────────────────────────────────────────────
  console.log('─'.repeat(40));
  console.log('🎉  Database seeded successfully!\n');
  console.log('    Demo Credentials');
  console.log(`    Email:    ${DEMO_EMAIL}`);
  console.log('    Password: Demo@123\n');

  process.exit(0);
}

main().catch(err => {
  console.error('❌  Seeder failed:', err);
  process.exit(1);
});
