# UniSync

A comprehensive career platform connecting students with employment opportunities, built with Next.js 14, PostgreSQL, Prisma, and Auth0.

## Features

### For Students
- **Profile Management**: Create comprehensive student profiles with education, experience, and skills
- **Job Discovery**: Browse targeted job postings filtered by major, university, and graduation year
- **Resume Builder**: Generate professional LaTeX-formatted PDF resumes from profile data
- **Application Tracking**: Apply to multiple positions and track application status
- **Event Registration**: Sign up for career fairs, workshops, and networking events
- **Email Notifications**: Receive reminders for upcoming events and application confirmations

### For Employers
- **Job Posting**: Create and manage job listings for full-time, internship, part-time, and contract positions
- **Student Targeting**: Target students based on keywords, university, major, and graduation year
- **Event Management**: Schedule and manage on-campus recruitment events
- **Application Review**: View and manage student applications
- **External Integration**: Link to external job boards and career pages

### For Administrators
- **Analytics Dashboard**: Comprehensive statistics on platform usage and engagement
- **Behavioral Insights**: Track popular jobs, companies, and events
- **Student Demographics**: View distribution by university, major, and graduation year
- **Interaction Monitoring**: Monitor student-employer engagement metrics
- **Trend Analysis**: Visualize application and event registration trends

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth0
- **Email**: Nodemailer
- **Resume Generation**: LaTeX (xelatex/pdflatex)
- **UI Components**: Custom components with Tailwind CSS

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- PostgreSQL 14+
- LaTeX distribution (TeX Live, MiKTeX, or MacTeX) for PDF resume generation
- Auth0 account (free tier available)
- SMTP server credentials for email notifications (optional)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/unisync?schema=public"

# Auth0 Configuration
AUTH0_SECRET="your-auth0-secret-key-minimum-32-characters"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"

# Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@unisync.app"

# File Upload (Optional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET=""

# Application Settings
NEXT_PUBLIC_APP_NAME="UniSync"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up Auth0

1. Create an Auth0 account at [auth0.com](https://auth0.com)
2. Create a new Application (Regular Web Application)
3. Configure the following settings:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
4. Copy your Domain, Client ID, and Client Secret to your `.env` file
5. Generate a secure random string for `AUTH0_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 4. Set Up the Database

Create a PostgreSQL database and run migrations:

```bash
# Create the database
createdb unisync

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

To view and manage your database, use Prisma Studio:

```bash
npx prisma studio
```

### 5. Install LaTeX (For Resume Generation)

**macOS:**
```bash
brew install --cask mactex
# Or use BasicTeX for a smaller installation
brew install --cask basictex
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install texlive-xetex texlive-fonts-recommended texlive-fonts-extra
```

**Windows:**
Download and install [MiKTeX](https://miktex.org/download)

**Verify Installation:**
```bash
xelatex --version
```

### 6. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
unisync/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Auth0 authentication
│   │   ├── jobs/                 # Job posting endpoints
│   │   ├── events/               # Event management endpoints
│   │   ├── applications/         # Application endpoints
│   │   ├── profile/              # Profile management
│   │   ├── resume/               # Resume generation
│   │   ├── admin/                # Admin analytics
│   │   └── onboarding/           # User onboarding
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # React components
│   └── ui/                       # Reusable UI components
├── lib/                          # Utility functions
│   ├── prisma.ts                 # Prisma client
│   ├── auth.ts                   # Auth helpers
│   ├── email.ts                  # Email utilities
│   └── latex.ts                  # LaTeX/PDF generation
├── prisma/
│   └── schema.prisma             # Database schema
├── .env                          # Environment variables (create from .env.example)
├── .env.example                  # Environment template
├── package.json                  # Dependencies
└── README.md                     # This file
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Login with Auth0
- `GET /api/auth/logout` - Logout
- `GET /api/auth/callback` - Auth0 callback
- `POST /api/onboarding` - Complete user onboarding
- `GET /api/onboarding` - Check onboarding status

### Jobs
- `GET /api/jobs` - List all active job postings (with filtering)
- `POST /api/jobs` - Create a job posting (employer only)
- `GET /api/jobs/[id]` - Get job details
- `PATCH /api/jobs/[id]` - Update job posting (employer only, own jobs)
- `DELETE /api/jobs/[id]` - Delete job posting (employer only, own jobs)

### Events
- `GET /api/events` - List all active events
- `POST /api/events` - Create an event (employer only)
- `POST /api/events/[id]/register` - Register for event (student only)
- `DELETE /api/events/[id]/register` - Unregister from event (student only)

### Applications
- `GET /api/applications` - Get applications (student: own, employer: to their jobs)
- `POST /api/applications` - Submit application (student only)

### Profile
- `GET /api/profile/student` - Get student profile
- `PATCH /api/profile/student` - Update student profile

### Resume
- `GET /api/resume/generate` - Get current resume data
- `POST /api/resume/generate` - Generate PDF resume from profile

### Admin
- `GET /api/admin/analytics` - Get comprehensive analytics (admin only)

## Database Schema

The application uses PostgreSQL with the following main models:

- **User**: Core user account (linked to Auth0)
- **StudentProfile**: Student-specific data (university, major, GPA, etc.)
- **EmployerProfile**: Employer-specific data (company name, industry, etc.)
- **AdminProfile**: Administrator data
- **JobPosting**: Job listings with targeting criteria
- **Event**: Recruitment events
- **Application**: Student job applications
- **EventRegistration**: Event sign-ups
- **Experience**: Student work experience
- **Education**: Student education history
- **ResumeData**: LaTeX resume template data

## Email Notifications

The application sends emails for:
- Application confirmations
- Event reminders (24 hours before event)

To enable email notifications, configure SMTP settings in your `.env` file.

### Using Gmail
1. Enable 2-factor authentication on your Google account
2. Generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the App Password in `SMTP_PASSWORD`

## Resume Generation

The application generates professional resumes using LaTeX. Two methods are supported:

1. **Local LaTeX** (default): Requires LaTeX installation on your server
2. **Cloud API**: Configure `LATEX_SERVICE_URL` to use a cloud LaTeX service

The resume builder includes:
- Personal information
- Education history
- Work experience
- Skills
- Projects (optional)

Generated PDFs use the `moderncv` LaTeX template for clean, professional formatting.

## Deployment

### Prerequisites
- PostgreSQL database (Supabase, Railway, or any PostgreSQL provider)
- Auth0 account with production application configured
- SMTP service for emails (SendGrid, AWS SES, etc.)
- LaTeX service or Docker container with LaTeX installed

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Update these values for production:
- `AUTH0_BASE_URL`: Your production URL
- `DATABASE_URL`: Your production database URL
- `AUTH0_SECRET`: Generate a new secure secret
- Update Auth0 Allowed Callback/Logout URLs

### Database Migrations

Run migrations in production:

```bash
npx prisma migrate deploy
```

## Development

### Run Database Migrations

```bash
npx prisma migrate dev --name migration_name
```

### Reset Database

```bash
npx prisma migrate reset
```

### View Database

```bash
npx prisma studio
```

### Type Checking

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### Auth0 Issues
- Verify all callback URLs are correctly configured
- Ensure `AUTH0_SECRET` is at least 32 characters
- Check that Auth0 application type is "Regular Web Application"

### Database Connection
- Verify PostgreSQL is running
- Check `DATABASE_URL` format and credentials
- Ensure database exists before running migrations

### LaTeX PDF Generation
- Verify LaTeX is installed: `xelatex --version`
- Check system PATH includes LaTeX binaries
- Ensure moderncv package is installed

### Email Sending
- Test SMTP credentials manually
- Check firewall settings for SMTP port
- Verify email service allows app passwords

## Security Considerations

- Never commit `.env` file to version control
- Use strong, unique secrets for production
- Implement rate limiting for API endpoints
- Regularly update dependencies
- Use HTTPS in production
- Implement input validation and sanitization
- Set up CORS policies appropriately

## License

MIT

## Support

For issues and questions:
- Check Auth0 documentation: [auth0.com/docs](https://auth0.com/docs)
- Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Check Prisma documentation: [prisma.io/docs](https://prisma.io/docs)

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Authentication by [Auth0](https://auth0.com)
- Database ORM by [Prisma](https://prisma.io)
- Styled with [Tailwind CSS](https://tailwindcss.com)
