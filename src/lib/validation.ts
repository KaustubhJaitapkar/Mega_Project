import { z } from 'zod';

// User validation
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const userSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['PARTICIPANT', 'ORGANISER']).default('PARTICIPANT'),
});

export const userProfileSchema = z.object({
  bio: z.string().optional(),
  skills: z.array(z.string()).max(15, 'Maximum 15 skills allowed').optional(),
  college: z.string().optional(),
  yearOfStudy: z.string().optional(),
  experience: z.enum(['junior', 'mid', 'senior']).optional(),
  company: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  resumeUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  githubUsername: z
    .string()
    .regex(/^[a-zA-Z0-9-]{1,39}$/, 'Invalid GitHub username')
    .optional()
    .or(z.literal('')),
  linkedin: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitter: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  sponsorVisible: z.boolean().optional(),
});

// Hackathon validation
export const hackathonCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().min(5, 'Short description required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationDeadline: z.string().datetime(),
  submissionDeadline: z.string().datetime(),
  maxTeamSize: z.number().int().min(1).default(5),
  minTeamSize: z.number().int().min(1).default(1),
  location: z.string().optional(),
  venue: z.string().optional(),
  isVirtual: z.boolean().default(true),
  prize: z.string().optional(),
  rules: z.string().optional(),
  tagline: z.string().optional(),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  hostName: z.string().optional(),
  theme: z.string().optional(),
  eligibilityDomain: z.string().optional(),
  breakfastProvided: z.boolean().default(false),
  lunchProvided: z.boolean().default(false),
  dinnerProvided: z.boolean().default(false),
  swagProvided: z.boolean().default(false),
  sponsorDetails: z.any().optional(),
  judgeDetails: z.any().optional(),
  mentorDetails: z.any().optional(),
  // New fields
  themedTracks: z.array(z.string()).optional().default([]),
  targetBatches: z.array(z.string()).optional().default([]),
  allowedDepartments: z.array(z.string()).optional().default([]),
  allowCrossYearTeams: z.boolean().default(false),
  submissionRequirements: z.array(z.string()).optional().default([]),
  mealSchedule: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      day: z.number(),
    })
  ).optional().default([]),
  rubricItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      weight: z.number(),
      maxScore: z.number(),
    })
  ).optional().default([]),
  internalMentors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      department: z.string().optional(),
      expertise: z.string().optional(),
    })
  ).optional().default([]),
});

// Team validation
export const teamCreateSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().optional(),
  maxMembers: z.number().int().min(1).default(5),
});

export const teamJoinSchema = z.object({
  message: z.string().optional(),
});

// Submission validation
export const submissionSchema = z.object({
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  liveUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

// Rubric validation
export const rubricCreateSchema = z.object({
  name: z.string().min(3, 'Rubric name required'),
  description: z.string().optional(),
  maxScore: z.number().default(100),
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      weight: z.number().default(1),
      maxScore: z.number().default(10),
    })
  ),
});

// Score validation
export const scoreSchema = z.object({
  score: z.number().min(0, 'Score cannot be negative'),
  comment: z.string().optional(),
});

// Ticket validation
export const ticketCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['technical', 'general', 'judging']),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// Timeline validation
export const timelineCreateSchema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.string().min(1, 'Type required'),
});

// Announcement validation
export const announcementCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  isUrgent: z.boolean().default(false),
});

export const hackathonRegistrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().or(z.literal('')),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(6, 'Phone is required'),
  gender: z.string().min(1, 'Gender is required'),
  location: z.string().min(2, 'Location is required'),
  instituteName: z.string().min(2, 'Institute is required'),
  differentlyAbled: z.boolean().default(false),
  userType: z.string().min(2, 'User type is required'),
  domain: z.string().min(2, 'Domain is required'),
  course: z.string().min(2, 'Course is required'),
  courseSpecialization: z.string().min(2, 'Specialization is required'),
  graduatingYear: z.number().int().min(2000),
  courseDuration: z.string().min(2, 'Course duration is required'),
  termsAccepted: z.boolean().refine((v) => v, 'Accept terms to continue'),
});
