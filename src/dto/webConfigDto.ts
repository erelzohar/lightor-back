import { z } from 'zod';

// Address schema
const addressSchema = z.object({
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  street: z.string().min(1, 'Street is required'),
  other: z.string().nullable().optional(),
});

// Contact schema
const contactSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  mail: z.string().email('Invalid email address'),
});

// Social media schema
const socialSchema = z.object({
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  x: z.string().nullable().optional(),
  tiktok: z.string().nullable().optional(),
});

// Color palette schema
const palleteSchema = z.object({
  colorPrimary: z.string().min(1, 'Primary color is required'),
  colorPrimaryDark: z.string().min(1, 'Primary dark color is required'),
  colorLightBg: z.string().min(1, 'Light background color is required'),
  colorLightSurface: z.string().min(1, 'Light surface color is required'),
  colorLightGray: z.string().min(1, 'Light gray color is required'),
  colorLightText: z.string().min(1, 'Light text color is required'),
  colorDarkBg: z.string().min(1, 'Dark background color is required'),
  colorDarkSurface: z.string().min(1, 'Dark surface color is required'),
  colorDarkGray: z.string().min(1, 'Dark gray color is required'),
  colorDarkText: z.string().min(1, 'Dark text color is required'),
});

// Navbar component schema
const navbarSchema = z.object({
  visible: z.boolean().default(true),
  darkMode: z.boolean().default(true),
  languageSwitcher: z.boolean().default(true),
});

// Hero component schema
const heroSchema = z.object({
  visible: z.boolean().default(true),
  title: z.string().min(1, 'Hero title is required'),
  subtitle: z.string().min(1, 'Hero subtitle is required'),
  description: z.string().min(1, 'Hero description is required'),
  heroImageSrc: z.string().min(1, 'Hero image is required'),
});

// About paragraphs schema
const aboutParagraphsSchema = z.object({
  intro: z.string().min(1, 'Intro paragraph is required'),
  mission: z.string().min(1, 'Mission paragraph is required'),
});

// About feature schema
const aboutFeatureSchema = z.object({
  icon: z.string().min(1, 'Feature icon is required'),
  title: z.string().min(1, 'Feature title is required'),
  description: z.string().min(1, 'Feature description is required'),
});

// About component schema
const aboutSchema = z.object({
  visible: z.boolean().default(true),
  title: z.string().min(1, 'About title is required'),
  description: z.string().min(1, 'About description is required'),
  paragraphs: aboutParagraphsSchema,
  features: z.array(aboutFeatureSchema).optional(),
});

// Portfolio item schema
const portfolioItemSchema = z.object({
  url: z.string().min(4, 'Portfolio item url is required'),
  title: z.string().optional(),
  description: z.string().optional(),
});

// Portfolio component schema
const portfolioSchema = z.object({
  visible: z.boolean().default(true),
  isGrid: z.boolean().default(false),
  title: z.string().min(1, 'Portfolio title is required'),
  description: z.string().optional(),
  items: z.array(portfolioItemSchema).optional().default([]),
});



// Schedule component schema
const scheduleSchema = z.object({
  title: z.string().min(1, 'Schedule title is required'),
  description: z.string().min(1, 'Schedule description is required'),
  // vacations: z.array(vacationSchema),
  // minsPerAppo: z.number().min(5, 'Minimum minutes per appointment must be at least 5'),
  // appointmentTypes: z.array(appointmentTypeSchema).min(1, 'At least one appointment type is required'),
});

// Contact component schema
const contactComponentSchema = z.object({
  visible: z.boolean().default(true),
  title: z.string().min(1, 'Contact title is required'),
  description: z.string().min(1, 'Contact description is required'),
});

// Footer component schema
const footerSchema = z.object({
  visible: z.boolean().default(true),
  description: z.string().min(1, 'Footer description is required'),
});

// Intro popup schema
const introPopupSchema = z.object({
  visible: z.boolean().default(false),
  value: z.string().min(1, 'Intro popup value is required'),
});

// Contact button schema
const contactButtonSchema = z.object({
  visible: z.boolean().default(true),
});

// Components schema
const componentsSchema = z.object({
  navbar: navbarSchema,
  hero: heroSchema,
  about: aboutSchema,
  portfolio: portfolioSchema,
  schedule: scheduleSchema,
  contact: contactComponentSchema,
  footer: footerSchema,
  introPopup: introPopupSchema,
  contactButton: contactButtonSchema,
});

// Query web configs schema
export const queryWebConfigsSchema = z.object({
  query: z.object({
    user_id: z.string().min(1, 'User ID is required'),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

// Create web config schema
export const createWebConfigSchema = z.object({
  body: z.object({
    businessName: z.string().min(1, 'Business name is required'),
    logoImageName: z.string().min(3, 'Logo image name is invalid'),
    vacations: z.array(z.string()),
    appointmentTypes: z.array(z.string()),//.min(1, 'At least one appointment type is required'),
    subDomain: z.string().min(1, 'Subdomain is required').toLowerCase(),
    minCancelTimeMS: z.number().min(0).default(3600000),
    // minsPerSlot: z.number().min(5, 'Minimum minutes per appointment must be at least 5'),
    defaultLanguage: z.enum(['en', 'he', 'ar', 'fr', 'es']).default('he'),
    workingDays: z.array(z.string().nullable()).length(7, 'Must provide 7 entries for working days'),
    address: addressSchema,
    contact: contactSchema,
    social: socialSchema,
    pallete: palleteSchema,
    components: componentsSchema,
  }),
});

// Update web config schema
export const updateWebConfigSchema = z.object({
  body: z.object({
    businessName: z.string().min(1, 'Business name is required').optional(),
    logoImageName: z.string().min(1, 'Logo image URL is invalid').optional(),
    subDomain: z.string().min(1, 'Subdomain is required').toLowerCase().optional(),
    minCancelTimeMS: z.number().min(0).optional(),
    // minsPerSlot: z.number().min(5).optional(),
    vacations: z.array(z.string()).optional(),
    appointmentTypes: z.array(z.string()).optional(),//.min(1, 'At least one appointment type is required'),
    defaultLanguage: z.enum(['en', 'he', 'ar', 'fr', 'es']).optional(),
    workingDays: z.array(z.string().nullable()).length(7, 'Must provide 7 entries for working days').optional(),
    address: addressSchema.partial().optional(),
    contact: contactSchema.partial().optional(),
    social: socialSchema.partial().optional(),
    pallete: palleteSchema.partial().optional(),
    components: z.object({
      navbar: navbarSchema.partial().optional(),
      hero: heroSchema.partial().optional(),
      about: aboutSchema.partial().optional(),
      portfolio: portfolioSchema.partial().optional(),
      schedule: scheduleSchema.partial().optional(),
      contact: contactComponentSchema.partial().optional(),
      footer: footerSchema.partial().optional(),
      introPopup: introPopupSchema.partial().optional(),
      contactButton: contactButtonSchema.partial().optional(),
    }).partial().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Web config ID is required'),
  }),
});

// Get web config by ID schema
export const getWebConfigByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Web config ID is required'),
  }),
});

// Get web config by subdomain schema
export const getWebConfigBySubdomainSchema = z.object({
  params: z.object({
    subdomain: z.string().min(1, 'Subdomain is required'),
  }),
});

export type CreateWebConfigInput = z.infer<typeof createWebConfigSchema>['body'];
export type UpdateWebConfigInput = z.infer<typeof updateWebConfigSchema>['body'];
export type WebConfigIdParam = z.infer<typeof getWebConfigByIdSchema>['params'];
export type WebConfigSubdomainParam = z.infer<typeof getWebConfigBySubdomainSchema>['params'];
export type QueryWebConfigsInput = z.infer<typeof queryWebConfigsSchema>['query'];