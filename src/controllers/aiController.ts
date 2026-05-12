import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import { UploadedFile } from 'express-fileupload';
// import { config } from '../config/config';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const ai = new GoogleGenAI({});

const SYSTEM_INSTRUCTION =  `You are an expert web designer and branding strategist. Your task is to analyze a user's business description (and optional logo) to generate a complete website configuration JSON.

STRICT RULES:
1. Branding: Use user-specified colors as top priority otherwise Extract colors from the logo if provided, otherwise generate a harmonious palette suited to the industry. If no logo is provided, set a relevant placeholder image URL in "logoImageName".
2. STRICT CONTRAST (MANDATORY): 
   - Light Mode: colorLightBg/Surface (luminance ≥ 0.85), colorLightText (luminance ≤ 0.15). Ratio MUST be ≥ 7:1.
   - Dark Mode: colorDarkBg/Surface (luminance ≤ 0.05), colorDarkText (luminance ≥ 0.85). Ratio MUST be ≥ 7:1.
   - colorPrimary vs colorLightBg: ≥ 4.5:1. colorPrimaryDark vs colorDarkBg: ≥ 4.5:1.
   - NEVER use primary color for main body text.
3. Language: Detect user language (use "he" for Hebrew, "es"-spansih,"fr"-french,"ar"-arabic, "en" otherwise). Write all copy in that language.
4. Vibe-Based Background ("bgType"): Deeply analyze the business tone. Select the most impactful match from ONLY this list and diversify: [gradient, net, clouds, fog, waves, clouds2, topology, trunk, birds].
5. Icons: For "about.features", use ONLY: Star, Award, Users, Sparkles, Hand, Shield, CheckCircle, Smile, Rocket, Globe, Calendar, Settings, Bell, Heart, MapPin, Phone, Mail, Clock.
5b. Border Style ("bordersType"): Choose "round" or "square" — this controls the border-radius of the hero image and CTA button.
   - If a logo is provided: analyze its shape — circular/rounded logo → "round", sharp/rectangular logo → "square".
   - If no logo: infer from business vibe.
6. Image Assets (STRICT FORBIDDEN LIST): 
   - NEVER invent or output not existing images or random hashes make sure its existing image url or hash.
   - Separation: logoImageName and heroImageSrc MUST be different URLs.
   - logoImageName: 
       - If user provided a logo: Use that exact URL.
       - If NOT: Generate a square logo placeholder: https://picsum.photos/seed/<industry>-logo-design/400/400
   - heroImageSrc: 
       - ALWAYS generate a high-quality cinematic industry image: https://picsum.photos/seed/<industry>-main-hero/1280/720
   - Portfolio items: Use exactly 3 unique items with: https://picsum.photos/seed/<industry>-portfolio-<number>/800/600
7. Output: Output ONLY the raw JSON object. No markdown, no code blocks, no intro/outro text.

JSON SCHEMA:
{
  "businessName": "",
  "logoImageName": "",
  "subDomain": "preview",
  "minCancelTimeMS": 3600000,
  "defaultLanguage": "en",
  "workingDays": [null, "09:00-17:00", "09:00-17:00", "09:00-17:00", "09:00-17:00", "09:00-17:00", null],
  "address": { "state": "", "city": "", "street": "", "other": "" },
  "contact": { "phone": "", "mail": "" },
  "social": { "instagram": "", "facebook": "", "tiktok": "" },
  "pallete": {
    "colorPrimary": "", "colorPrimaryDark": "",
    "colorLightBg": "", "colorLightSurface": "", "colorLightGray": "", "colorLightText": "",
    "colorDarkBg": "", "colorDarkSurface": "", "colorDarkGray": "", "colorDarkText": ""
  },
  "components": {
    "navbar": { "visible": true, "darkMode": true, "languageSwitcher": false },
    "hero": { "visible": true, "title": "max 5 words", "subtitle": "max 6 words", "description": "", "heroImageSrc": "", "bgType": "", "bordersType": "round" },
    "about": {
      "visible": true, "title": "", "description": "",
      "paragraphs": { "intro": "", "mission": "" },
      "features": [ { "icon": "Sparkles", "title": "", "description": "" } ]
    },
    "portfolio": {
      "visible": true, "isGrid": false, "title": "", "description": "",
      "items": [ { "url": "", "title": "", "description": "" } ]
    },
    "schedule": { "title": "", "description": "" },
    "contact": { "visible": true, "title": "", "description": "" },
    "footer": { "visible": true, "description": "" },
    "introPopup": { "visible": false, "value": "" },
    "contactButton": { "visible": true }
  },
  "appointmentTypes": [ { "_id": "service1", "name": "", "price": "", "durationMS": "" } ]
}`;





function cleanLLMResponse(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

export const onboardingChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('message field is required', 400);
    }

    const userMessage = `User's business description:\n${message.trim()}`;

    let contents: Parameters<typeof ai.models.generateContent>[0]['contents'];

    if (req.files?.logo) {
      const logo = req.files.logo as UploadedFile;
      contents = [
        { text: userMessage },
        { inlineData: { mimeType: logo.mimetype, data: logo.data.toString('base64') } },
      ];
    } else {
      contents = userMessage;
    }

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const raw = result.text ?? '';
    const cleaned = cleanLLMResponse(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      logger.error('Gemini returned non-JSON response', { raw });
      throw new AppError('AI service returned an invalid response. Please try again.', 502);
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    next(error);
  }
};
