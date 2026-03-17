import { config } from './config';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EZlines Appointment Scheduling API',
      version: '1.0.0',
      description: 'API documentation for the Appointment Scheduling System',
      contact: {
        name: 'API Support',
        email: 'support@appointment-system.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [""],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};