import { Appointment, IAppointment } from '../models/appointmentModel';
import { User, IUser } from '../models/userModel';
import { WebConfig, IWebConfig } from '../models/webConfigModel';
import { config } from '../config/config';
import { logger } from './logger';

interface WhatsAppTemplate {
  name: string;
  language: string;
  components: any[];
}

const translations: Record<string, any> = {
  en: {
    'day.0': 'Sunday',
    'day.1': 'Monday',
    'day.2': 'Tuesday',
    'day.3': 'Wednesday',
    'day.4': 'Thursday',
    'day.5': 'Friday',
    'day.6': 'Saturday',
    'schedule.confirmation.user': 'Hi {{name}},\n your appointment at {{businessName}} has been scheduled for {{day}} {{date}} at {{time}}. \n Cancellation or update link {{timeUntilLabel}}: {{link}}\n\n Lightor',
    'schedule.confirmation.user.update': 'Hi {{name}},\n your appointment at {{businessName}} has been updated to {{day}} {{date}} at {{time}}.\n Cancellation or update link {{timeUntilLabel}}: {{link}}\n\n Lightor',
    'schedule.confirmation.business': "New appointment scheduled!\nName: {{name}}\nPhone: {{phone}}\nDate: {{day}} {{date}} at {{time}}\n\n Lightor",
    'common.until': 'until {{time}}',
    'common.before': 'before the appointment',
    'time.unlimited': 'Unlimited',
    'time.half.hour': 'Half an hour',
    'time.hour': 'An hour',
    'time.2hours': '2 hours',
    'time.3hours': '3 hours',
    'time.4hours': '4 hours',
    'time.6hours': '6 hours',
    'time.12hours': '12 hours',
    'time.24hours': '24 hours',
    'time.48hours': '48 hours',
    'time.72hours': '72 hours',
    'time.week': 'A week',
    'time.2weeks': 'Two weeks',
    'morning.reminder': 'Good morning {{name}}, \nThis is a reminder for your appointment today at {{time}} with {{businessName}}.\nFor cancellation or update: {{link}}\n\n Lightor',
    'hourly.reminder': 'Hi {{name}}, \nYour appointment with {{businessName}} is in one hour at {{time}}.\nSee you soon!\n\n Lightor',
  },
  he: {
    'day.0': 'ראשון',
    'day.1': 'שני',
    'day.2': 'שלישי',
    'day.3': 'רביעי',
    'day.4': 'חמישי',
    'day.5': 'שישי',
    'day.6': 'שבת',
    'schedule.confirmation.user': 'היי {{name}},\n נקבע לך תור ל{{businessName}},\n יום {{day}} ה-{{date}} בשעה {{time}}. \n לינק לניהול התור {{timeUntilLabel}}: {{link}}\n\n Lightor',
    'schedule.confirmation.user.update': 'היי {{name}},\n התור שלך ב-{{businessName}} עודכן ליום {{day}} ה-{{date}} בשעה {{time}}.\n לינק לניהול התור {{timeUntilLabel}}: {{link}}\n\n Lightor',
    'schedule.confirmation.business': "נקבע אצלך תור חדש !\nשם: {{name}}\nטלפון: {{phone}}\nתאריך: יום {{day}} ה-{{date}} בשעה {{time}}\n\nLightor",
    'common.until': 'עד {{time}}',
    'common.before': 'לפני התור',
    'time.unlimited': 'ללא הגבלה',
    'time.half.hour': 'חצי שעה',
    'time.hour': 'שעה',
    'time.2hours': 'שעתיים',
    'time.3hours': '3 שעות',
    'time.4hours': '4 שעות',
    'time.6hours': '6 שעות',
    'time.12hours': '12 שעות',
    'time.24hours': '24 שעות',
    'time.48hours': '48 שעות',
    'time.72hours': '72 שעות',
    'time.week': 'שבוע',
    'time.2weeks': 'שבועיים',
    'morning.reminder': 'בוקר טוב {{name}}, \nזוהי תזכורת לתור שלך היום בשעה {{time}} אצל {{businessName}}.\nלביטול או עדכון: {{link}}',
    'hourly.reminder': 'היי {{name}}, \nהתור שלך אצל {{businessName}} בעוד שעה בשעה {{time}}.\nנתראה!',
  }
};

const millisecondsToTimeMap: Record<number, string> = {
  0: 'time.unlimited',
  90000: 'time.half.hour',
  1800000: 'time.half.hour',
  3600000: 'time.hour',
  7200000: 'time.2hours',
  10800000: 'time.3hours',
  14400000: 'time.4hours',
  21600000: 'time.6hours',
  43200000: 'time.12hours',
  86400000: 'time.24hours',
  172800000: 'time.48hours',
  259200000: 'time.72hours',
  604800000: 'time.week',
  1209600000: 'time.2weeks'
};

function t(key: string, lang: string, variables: Record<string, string> = {}): string {
  let text = translations[lang]?.[key] || translations['en']?.[key] || key;
  Object.entries(variables).forEach(([k, v]) => {
    text = text.replace(`{{${k}}}`, v);
  });
  return text;
}

export const sendAppointmentConfirmation = async (appointment: IAppointment, isUpdating: boolean = false) => {
  try {
    const user = await User.findById(appointment.user_id) as IUser;
    const webConfig = await WebConfig.findOne({ user_id: appointment.user_id }) as IWebConfig;

    if (!user || !webConfig) {
      logger.error('User or WebConfig not found for appointment confirmation');
      return;
    }

    const lang = user.defaultLanguage || 'he';
    const apptTime = new Date(Number(appointment.timestamp));

    const dateStr = apptTime.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Jerusalem'
    }).replace(/\//g, '.');

    const timeStr = apptTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jerusalem'
    });

    const dayKey = `day.${apptTime.getDay()}`;
    const dayName = t(dayKey, lang);

    const timeUntilKey = millisecondsToTimeMap[webConfig.minCancelTimeMS] || 'time.unlimited';
    const timeUntilValue = t(timeUntilKey, lang);
    const timeUntilLabel = webConfig.minCancelTimeMS === 0
      ? timeUntilValue
      : t('common.until', lang, { time: timeUntilValue }) + ' ' + t('common.before', lang);

    const link = `https://${webConfig.subDomain}.lightor.app/manage/${appointment._id}`;

    // Prepare User Message
    let userWhatsAppTemplate: WhatsAppTemplate | undefined;
    const userMsgKey = isUpdating ? 'schedule.confirmation.user.update' : 'schedule.confirmation.user';
    const userMsg = t(userMsgKey, lang, {
      name: appointment.name,
      businessName: webConfig.businessName,
      day: dayName,
      date: dateStr,
      time: timeStr,
      timeUntilLabel: timeUntilLabel,
      link: link
    });

    if (appointment.channelType === 'whatsapp') {
      const templateBase = isUpdating ? 'lightor_app_update' : 'lightor_cust_app';
      userWhatsAppTemplate = {
        name: `${templateBase}_${lang}`,
        language: lang,
        components: [
          {
            type: "body",
            parameters: isUpdating ? [
              { type: "text", text: appointment.name },
              { type: "text", text: webConfig.businessName },
              { type: "text", text: dayName },
              { type: "text", text: dateStr },
              { type: "text", text: timeStr }
            ] : [
              { type: "text", text: appointment.name },
              { type: "text", text: webConfig.businessName },
              { type: "text", text: dayName },
              { type: "text", text: dateStr },
              { type: "text", text: timeStr },
              { type: "text", text: timeUntilLabel }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: appointment._id.toString() }
            ]
          }
        ]
      };
    }

    // Send to User
    await sendMessage(appointment.phone, userMsg, appointment.channelType, userWhatsAppTemplate);

    // Business Notification
    if (!isUpdating) {
      let businessWhatsAppTemplate: WhatsAppTemplate | undefined;
      const businessMsg = t('schedule.confirmation.business', lang, {
        name: appointment.name,
        phone: appointment.phone,
        day: dayName,
        date: dateStr,
        time: timeStr
      });

      if (user.channelType === 'whatsapp') {
        businessWhatsAppTemplate = {
          name: `lightor_bsns_app_${lang}`,
          language: lang,
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: appointment.name },
                { type: "text", text: appointment.phone },
                { type: "text", text: dayName },
                { type: "text", text: dateStr },
                { type: "text", text: timeStr }
              ]
            }
          ]
        };
      }

      // Send to Business
      await sendMessage(user.phone, businessMsg, user.channelType, businessWhatsAppTemplate);
    }

  } catch (error) {
    logger.error('Error in sendAppointmentConfirmation:', error);
  }
};

export const sendReminder = async (appointment: IAppointment, type: 'morning' | 'hourly') => {
    try {
        const user = await User.findById(appointment.user_id) as IUser;
        const webConfig = await WebConfig.findOne({ user_id: appointment.user_id }) as IWebConfig;

        if (!user || !webConfig) return;

        const lang = user.defaultLanguage || 'he';
        const apptTime = new Date(Number(appointment.timestamp));
        const timeStr = apptTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jerusalem'
        });

        const timeUntilKey = millisecondsToTimeMap[webConfig.minCancelTimeMS] || 'time.unlimited';
        const timeUntilValue = t(timeUntilKey, lang);

        const link = `${webConfig.subDomain}.lightor.app/manage/${appointment._id}`;
        
        const msgKey = type === 'morning' ? 'morning.reminder' : 'hourly.reminder';
        const msg = t(msgKey, lang, {
            name: appointment.name,
            time: timeStr,
            businessName: webConfig.businessName,
            link: link
        });

        let template: WhatsAppTemplate | undefined;
        if (appointment.channelType === 'whatsapp') {
            if (type === 'morning') {
                template = {
                    name: `lightor_morning_rem_${lang}`,
                    language: lang,
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: appointment.name },
                                { type: "text", text: timeStr },
                                { type: "text", text: webConfig.businessName },
                                { type: "text", text: timeUntilValue }
                            ]
                        },
                        {
                            type: "button",
                            sub_type: "url",
                            index: "0",
                            parameters: [
                                { type: "text", text: appointment._id.toString() }
                            ]
                        }
                    ]
                };
            } else {
                template = {
                    name: `lightor_hourly_rem_${lang}`,
                    language: lang,
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: appointment.name },
                                { type: "text", text: timeStr },
                                { type: "text", text: webConfig.businessName }
                            ]
                        },
                        {
                            type: "button",
                            sub_type: "url",
                            index: "0",
                            parameters: [
                                { type: "text", text: appointment._id.toString() }
                            ]
                        }
                    ]
                };
            }
        }

        await sendMessage(appointment.phone, msg, appointment.channelType, template);

    } catch (error) {
        logger.error(`Error sending ${type} reminder:`, error);
    }
};

export async function sendSmsMessage(to: string, message: string): Promise<void> {
  const smsApiUrl = "https://my.textme.co.il/api/";
  const hasUnicode = /[^\x00-\x7F]/.test(message);

  const response = await fetch(smsApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.smsService.newToken
    },
    body: JSON.stringify({
      sms: {
        user: { username: config.smsService.newUser },
        source: "Lightor",
        destinations: { phone: to },
        message,
        ...(hasUnicode && { encoding: "unicode" })
      }
    })
  });

  if (!response.ok) {
    logger.error(`SMS failed for ${to}: ${response.status}`);
  } else {
    logger.info(`SMS sent to ${to}`);
  }
}

export async function sendWhatsAppMessage(to: string, message: string, template?: WhatsAppTemplate): Promise<void> {
  const waApiUrl = `https://graph.facebook.com/v22.0/${config.whatsapp.accountId}/messages`;
  const body: any = { messaging_product: "whatsapp", to };

  if (template) {
    body.type = "template";
    body.template = {
      name: template.name,
      language: { code: template.language },
      components: template.components
    };
  } else {
    body.type = "text";
    body.text = { body: message };
  }

  const response = await fetch(waApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.whatsapp.accountToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    logger.error(`WhatsApp failed for ${to}: ${response.status} ${JSON.stringify(errorData)}`);
  } else {
    logger.info(`WHATSAPP sent to ${to}${template ? ' (Template: ' + template.name + ')' : ''}`);
  }
}

async function sendMessage(to: string, message: string, channelType: string = 'sms', template?: WhatsAppTemplate) {
  try {
    if (channelType === 'whatsapp') {
      await sendWhatsAppMessage(to, message, template);
    } else {
      await sendSmsMessage(to, message);
    }
  } catch (error) {
    logger.error(`Failed to send ${channelType} to ${to}:`, error);
  }
}
