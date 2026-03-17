import mongoose, { Document, Schema } from 'mongoose';

// Address interface
interface IAddress {
  state: string;
  city: string;
  street: string;
  other?: string;
}

// Contact interface
interface IContact {
  phone: string;
  mail: string;
}

// Social media interface
interface ISocial {
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
}

// Color palette interface
interface IPalette {
  colorPrimary: string;
  colorPrimaryDark: string;
  colorLightBg: string;
  colorLightSurface: string;
  colorLightGray: string;
  colorLightText: string;
  colorDarkBg: string;
  colorDarkSurface: string;
  colorDarkGray: string;
  colorDarkText: string;
}

// Navbar component interface
interface INavbar {
  visible: boolean;
  darkMode: boolean;
  languageSwitcher: boolean;
}

// Hero component interface
interface IHero {
  visible: boolean;
  title: string;
  subtitle: string;
  description: string;
  heroImageSrc: string;
}

// About paragraphs interface
interface IAboutParagraphs {
  intro: string;
  mission: string;
}

// About feature interface
interface IAboutFeature {
  icon: string;
  title: string;
  description: string;
}

// About component interface
interface IAbout {
  visible: boolean;
  title: string;
  description: string;
  paragraphs: IAboutParagraphs;
  features: IAboutFeature[];
}

// Portfolio item interface
interface IPortfolioItem {
  url: string;
  title: string;
  description: string;
}

// Portfolio component interface
interface IPortfolio {
  visible: boolean;
  isGrid: boolean;
  title: string;
  description: string;
  items: IPortfolioItem[];
}

// Appointment type interface
// interface IAppointmentType {
//   _id: string;
//   name: string;
//   price: number;
//   durationMS: string;
// }

// Schedule component interface
interface ISchedule {
  title: string;
  description: string;
  // vacations: IVacation[];
  // minsPerAppo: number;
}

// Contact component interface
interface IContact {
  visible: boolean;
  title: string;
  description: string;
}

// Footer component interface
interface IFooter {
  visible: boolean;
  description: string;
}

// Intro popup interface
interface IIntroPopup {
  visible: boolean;
  value: string;
}

// Contact button interface
interface IContactButton {
  visible: boolean;
}

// Vacation interface
// interface IVacation {

//   title: string;
//   startDate: string;
//   endDate: string;
// }

// Components interface
interface IComponents {
  navbar: INavbar;
  hero: IHero;
  about: IAbout;
  portfolio: IPortfolio;
  schedule: ISchedule;
  contact: IContact;
  footer: IFooter;
  introPopup: IIntroPopup;
  contactButton: IContactButton;
}

// WebConfig interface
export interface IWebConfig extends Document {
  user_id: mongoose.Types.ObjectId;
  businessName: string;
  logoImageName: string;
  subDomain: string;
  minCancelTimeMS: number;
  minsPerSlot: number;
  defaultLanguage: string;
  vacations: mongoose.Types.ObjectId[];
  appointmentTypes: mongoose.Types.ObjectId[];
  workingDays: (string | null)[];
  address: IAddress;
  contact: IContact;
  social: ISocial;
  pallete: IPalette;
  components: IComponents;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definitions
const addressSchema = new Schema<IAddress>({
  state: { type: String, required: true },
  city: { type: String, required: true },
  street: { type: String, required: true },
  other: { type: String }
}, { id: false, _id: false });

const contactSchema = new Schema<IContact>({
  phone: { type: String, required: true },
  mail: { type: String, required: true }
}, { id: false, _id: false });

const socialSchema = new Schema<ISocial>({
  instagram: { type: String },
  facebook: { type: String },
  x: { type: String },
  tiktok: { type: String }
}, { id: false, _id: false });

const palleteSchema = new Schema<IPalette>({
  colorPrimary: { type: String, required: true },
  colorPrimaryDark: { type: String, required: true },
  colorLightBg: { type: String, required: true },
  colorLightSurface: { type: String, required: true },
  colorLightGray: { type: String, required: true },
  colorLightText: { type: String, required: true },
  colorDarkBg: { type: String, required: true },
  colorDarkSurface: { type: String, required: true },
  colorDarkGray: { type: String, required: true },
  colorDarkText: { type: String, required: true }
}, { id: false, _id: false });

const navbarSchema = new Schema<INavbar>({
  visible: { type: Boolean, required: true, default: true },
  darkMode: { type: Boolean, required: true, default: true },
  languageSwitcher: { type: Boolean, required: true, default: true }
}, { id: false, _id: false });

const heroSchema = new Schema<IHero>({
  visible: { type: Boolean, required: true, default: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  heroImageSrc: { type: String, required: true }
}, { id: false, _id: false });

const aboutParagraphsSchema = new Schema<IAboutParagraphs>({
  intro: { type: String, required: true },
  mission: { type: String, required: true }
}, { id: false, _id: false });

const aboutFeatureSchema = new Schema<IAboutFeature>({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { id: false });

const aboutSchema = new Schema<IAbout>({
  visible: { type: Boolean, required: true, default: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  paragraphs: { type: aboutParagraphsSchema, required: true },
  features: { type: [aboutFeatureSchema], required: true }
}, { id: false, _id: false });

const portfolioItemSchema = new Schema<IPortfolioItem>({
  url: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { id: false });

const portfolioSchema = new Schema<IPortfolio>({
  visible: { type: Boolean, required: true, default: true },
  isGrid: { type: Boolean, required: true, default: false },
  title: { type: String, required: true },
  description: { type: String, required: true },
  items: { type: [portfolioItemSchema], required: true }
}, { id: false, _id: false });

// const appointmentTypeSchema = new Schema<IAppointmentType>({
//   _id: { type: String, required: true },
//   name: { type: String, required: true },
//   price: { type: Number, required: true },
//   durationMS: { type: String, required: true }
// });

// const vacationSchema = new Schema<IVacation>({
//   title: { type: String, required: true },
//   startDate: { type: String, required: true },
//   endDate: { type: String, required: true }
// }, { id: false });

const scheduleSchema = new Schema<ISchedule>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  // vacations: { type: [vacationSchema], required: true },
  // minsPerAppo: { type: Number, required: true },
  // appointmentTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentType', required: true }]
}, { id: false, _id: false });


const contactComponentSchema = new Schema<IContact>({
  visible: { type: Boolean, required: true, default: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { id: false, _id: false });

const footerSchema = new Schema<IFooter>({
  visible: { type: Boolean, required: true, default: true },
  description: { type: String, required: true }
}, { id: false, _id: false });

const introPopupSchema = new Schema<IIntroPopup>({
  visible: { type: Boolean, required: true, default: false },
  value: { type: String, required: true }
}, { id: false, _id: false });

const contactButtonSchema = new Schema<IContactButton>({
  visible: { type: Boolean, required: true, default: true }
}, { id: false, _id: false });

const componentsSchema = new Schema<IComponents>({
  navbar: { type: navbarSchema, required: true },
  hero: { type: heroSchema, required: true },
  about: { type: aboutSchema, required: true },
  portfolio: { type: portfolioSchema, required: true },
  schedule: { type: scheduleSchema, required: true },
  contact: { type: contactComponentSchema, required: true },
  footer: { type: footerSchema, required: true },
  introPopup: { type: introPopupSchema, required: true },
  contactButton: { type: contactButtonSchema, required: true }
}, { id: false, _id: false });

// Main WebConfig schema
const webConfigSchema = new Schema<IWebConfig>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    businessName: {
      type: String,
      required: [true, 'Please add a business name'],
      trim: true
    },
    logoImageName: {
      type: String,
      required: [true, 'Please add a logo image URL']
    },
    subDomain: {
      type: String,
      required: [true, 'Please add a subdomain'],
      unique: true,
      trim: true,
      lowercase: true
    },
    minCancelTimeMS: {
      type: Number,
      required: [true, 'Please add minimum cancellation time in milliseconds'],
      default: 3600000 // 1 hour in milliseconds
    },
    minsPerSlot: {
      type: Number,
      required: [true, 'Please add mins per slot in minutes'],
      default: 20 // 1 hour in milliseconds
    },
    defaultLanguage: {
      type: String,
      enum: ['en', 'he', 'ar', 'fr', 'es'],
      default: 'en'
    },
    workingDays: {
      type: [String],
      required: true,
      validate: {
        validator: function (value: (string | null)[]) {
          return value.length === 7; // One entry for each day of the week
        },
        message: 'Working days must have exactly 7 entries (one for each day of the week)'
      }
    },
    // vacations: {
    //   type: [mongoose.Schema.Types.ObjectId],
    //   ref: 'Vacation'
    // },
    // appointmentTypes: {
    //   type: [mongoose.Schema.Types.ObjectId],
    //   ref: 'AppointmentType'
    // },
    address: {
      type: addressSchema,
      required: true
    },
    contact: {
      type: contactSchema,
      required: true
    },
    social: {
      type: socialSchema,
      required: true
    },
    pallete: {
      type: palleteSchema,
      required: true
    },
    components: {
      type: componentsSchema,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// Virtual: Vacations
webConfigSchema.virtual('vacations', {
  ref: 'Vacation',            // The model to use
  localField: '_id',          // Field on WebConfig
  foreignField: 'webConfig_id', // Field on Vacation that references WebConfig
  justOne: false              // since it's an array
});

// Virtual: Appointment Types
webConfigSchema.virtual('appointmentTypes', {
  ref: 'AppointmentType',
  localField: '_id',
  foreignField: 'webConfig_id', // assuming AppointmentType has a `webConfig_id`
  justOne: false
});

export const WebConfig = mongoose.model<IWebConfig>('WebConfig', webConfigSchema);