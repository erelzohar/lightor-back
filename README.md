# Appointment Scheduling API

A TypeScript Node.js server with MongoDB integration for scheduling appointments, built with Express.js and Mongoose.

## Features

- User authentication (signup/login) with JWT tokens
- CRUD operations for appointments
- Input validation and error handling
- Appointment conflict prevention
- Email notifications for appointments
- Web configuration management
- Rate limiting and security headers
- API documentation with Swagger/OpenAPI

## Prerequisites

- Node.js (v16+)
- MongoDB
- npm or yarn

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory (use `.env.example` as a template)
4. Start the development server:

```bash
npm run dev
```

5. Seed the database with sample data:

```bash
npm run seed
```

## Project Structure

```
appointment-scheduling-api/
├── dist/                   # Compiled TypeScript output
├── logs/                   # Application logs
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── dto/                # Data Transfer Objects
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   ├── scripts/            # Utility scripts (e.g., seed)
│   ├── utils/              # Utility functions
│   └── server.ts           # Entry point
├── .env                    # Environment variables
├── .env.example            # Example environment variables
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Core Data Models

### User

- name: string
- email: string (unique)
- phone: string
- username: string (unique)
- password: string (hashed)
- subscription: string (free, basic, premium)
- webConfig_id: ObjectId (reference to WebConfig)
- defaultLanguage: string

### Appointment

- timestamp: Date
- name: string
- phone: string
- user_id: ObjectId (reference to User)
- user: ObjectId (reference to User)
- type: string
- duration: number (milliseconds)
- status: string (scheduled, completed, cancelled, no-show)
- notes: string (optional)

### WebConfig

Complex configuration object for business settings, including:
- Business information
- Working hours
- Address and contact details
- UI components configuration
- Appointment types
- Visual theme settings

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected routes:

1. Register a new user or login with existing credentials
2. Use the returned token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build the project for production
- `npm start`: Start the production server
- `npm run seed`: Seed the database with sample data
- `npm run lint`: Run ESLint to check code quality
- `npm test`: Run tests

## Security Features

- JWT Authentication
- Password hashing
- Input validation
- Rate limiting
- Security headers with Helmet
- Error handling