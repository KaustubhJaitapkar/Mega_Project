const { z } = require('zod');

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  shortDescription: z.string().min(5),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationDeadline: z.string().datetime(),
  submissionDeadline: z.string().datetime(),
  maxTeamSize: z.number().int().min(1).default(5),
  minTeamSize: z.number().int().min(1).default(1),
  location: z.string().optional(),
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
});

const payload = {
  title: 'Test Hackathon',
  tagline: '',
  description: 'Test description goes here',
  shortDescription: 'Test short',
  bannerUrl: '',
  logoUrl: '',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  registrationDeadline: new Date().toISOString(),
  submissionDeadline: new Date().toISOString(),
  isVirtual: true,
  location: '',
  maxTeamSize: 5,
  minTeamSize: 1,
  breakfastProvided: false,
  lunchProvided: false,
  dinnerProvided: false,
  swagProvided: false,
  contactEmail: '',
  hostName: '',
  theme: '',
  eligibilityDomain: '',
  prize: '',
  rules: '',
  sponsorDetails: [],
  judgeDetails: [],
  mentorDetails: [],
};

try {
  schema.parse(payload);
  console.log("Success");
} catch (e) {
  console.error(e.errors);
}
