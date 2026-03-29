import { config } from './config';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lightor Appointment Scheduling API',
      version: '1.0.0',
      description: 'API documentation for the Appointment Scheduling System',
      contact: {
        name: 'API Support',
        email: config.email.from,
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