# ReadySetHire Backend with Prisma ORM

A modern TypeScript Express server using Prisma ORM for type-safe database operations.

## 🚀 Features

- **Prisma ORM**: Type-safe database operations with auto-generated client
- **PostgreSQL**: Robust relational database with proper relationships
- **Docker Support**: Complete containerization with docker-compose
- **Type Safety**: Full TypeScript support throughout the application
- **Auto Migrations**: Database schema versioning and migrations
- **Service Layer**: Clean abstraction over database operations
- **RESTful API**: Clean API endpoints following REST conventions

## 📊 Database Schema

### Models
- **User**: User accounts with roles (ADMIN, RECRUITER, INTERVIEWER)
- **Job**: Job postings linked to users
- **Interview**: Interview sessions linked to jobs
- **Question**: Interview questions linked to interviews
- **Applicant**: Candidate information linked to interviews
- **ApplicantAnswer**: Candidate responses to interview questions

### Relationships
- Users can have multiple Jobs, Interviews, Questions, Applicants, and Answers
- Jobs can have multiple Interviews
- Interviews can have multiple Questions and Applicants
- Applicants can have multiple Answers
- Questions can have multiple Answers

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment
Create a `.env` file:
```env
DATABASE_URL="postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

### 3. Start with Docker (Recommended)
```bash
# Start PostgreSQL and backend
npm run docker:up

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 4. Or Start Locally
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

## 🗄️ Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Reset database (careful!)
npm run db:reset

# Seed sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🐳 Docker Commands

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Restart services
npm run docker:restart

# Clean up (removes volumes)
npm run docker:clean
```

## 🔗 API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID

### Jobs
- `GET /api/jobs` - List jobs (supports ?user_id, ?status filters)
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Interviews
- `GET /api/interviews` - List interviews (supports ?user_id, ?job_id filters)
- `GET /api/interviews/:id` - Get interview by ID
- `POST /api/interviews` - Create new interview
- `PATCH /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview

### Questions
- `GET /api/questions` - List questions (supports ?interview_id filter)
- `GET /api/questions/:id` - Get question by ID
- `POST /api/questions` - Create new question
- `PATCH /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Applicants
- `GET /api/applicants` - List applicants (supports ?interview_id filter)
- `GET /api/applicants/:id` - Get applicant by ID
- `POST /api/applicants` - Create new applicant
- `PATCH /api/applicants/:id` - Update applicant
- `DELETE /api/applicants/:id` - Delete applicant

### Applicant Answers
- `GET /api/applicant_answers` - List answers (supports ?applicant_id, ?question_id filters)
- `GET /api/applicant_answers/:id` - Get answer by ID
- `POST /api/applicant_answers` - Create new answer
- `PATCH /api/applicant_answers/:id` - Update answer
- `DELETE /api/applicant_answers/:id` - Delete answer

## 🏗️ Architecture

### Service Layer Pattern
All database operations go through service classes:
- `UserService` - User management
- `JobService` - Job operations
- `InterviewService` - Interview management
- `QuestionService` - Question operations
- `ApplicantService` - Applicant management
- `ApplicantAnswerService` - Answer operations

### Base Service Class
All services extend `BaseService<T>` which provides:
- `create(data)` - Insert new record
- `findMany(where)` - Get multiple records with filtering
- `findUnique(where)` - Get single record by unique field
- `findFirst(where)` - Get first matching record
- `update(where, data)` - Update record
- `delete(where)` - Delete record
- `count(where)` - Count records

### Prisma Client
- Type-safe database operations
- Auto-generated TypeScript types
- Connection pooling
- Query optimization
- Transaction support

## 🔧 Development

### Prisma Schema
The database schema is defined in `prisma/schema.prisma`:
- Models with relationships
- Enums for constrained values
- Field mappings for database columns
- Indexes and constraints

### Migrations
Database changes are managed through Prisma migrations:
- Version controlled schema changes
- Automatic SQL generation
- Rollback support
- Production deployment ready

### Type Safety
- All database operations are type-safe
- Auto-completion in IDE
- Compile-time error checking
- Runtime validation

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Configure production `DATABASE_URL`
3. Set secure `JWT_SECRET`
4. Run migrations: `npm run db:migrate`
5. Build: `npm run build`
6. Start: `npm start`

## 📝 Sample Data

The seed script creates:
- 3 users (1 admin, 2 recruiters)
- 3 published jobs
- 3 interviews linked to jobs
- 6 sample questions
- 3 applicants with different statuses

## 🔍 Monitoring

- Health check endpoint: `/health`
- Prisma Studio: `npm run db:studio`
- Docker logs: `npm run docker:logs`
- Database connection monitoring

The server will be available at `http://localhost:3000` with API endpoints at `/api/*`.