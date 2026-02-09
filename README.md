# 🚀 Task Management Pro - Full Stack Next.js

Professional task management application with real-time collaboration, built with Next.js 14, Prisma, and Vercel Postgres.

## ✨ Features

### 🎯 Core Features
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete tasks
- ✅ **Drag & Drop** - Kanban board with drag and drop
- ✅ **Real-time Updates** - Live collaboration
- ✅ **Authentication** - Email/Password, Google, GitHub OAuth
- ✅ **User Management** - Multi-user support with roles

### 📊 Advanced Features
- ✅ **Due Dates & Deadlines** - Task scheduling with visual warnings
- ✅ **Tags & Labels** - Organize tasks with custom tags
- ✅ **Subtasks** - Break down tasks into smaller steps
- ✅ **Task Assignment** - Assign tasks to team members
- ✅ **Comments** - Discuss tasks with team
- ✅ **File Attachments** - Upload files to tasks
- ✅ **Priority Levels** - High, Medium, Low
- ✅ **Search & Filter** - Advanced filtering options
- ✅ **Dark Mode** - Eye-friendly interface
- ✅ **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Deployment**: Vercel
- **UI Components**: Lucide Icons, React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn or pnpm
- Git

### 1. Clone Repository

\`\`\`bash
git clone <your-repo-url>
cd task-management-nextjs
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### 3. Setup Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
# Database (Will be auto-filled by Vercel)
POSTGRES_PRISMA_URL="your-postgres-connection-url"
POSTGRES_URL_NON_POOLING="your-postgres-direct-url"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
\`\`\`

**Generate NEXTAUTH_SECRET:**
\`\`\`bash
openssl rand -base64 32
\`\`\`

### 4. Setup Database

\`\`\`bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deploy to Vercel

### Quick Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/task-management-nextjs)

### Manual Deploy

#### 1. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
\`\`\`

#### 2. Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

#### 3. Setup Vercel Postgres

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose a database name and region
5. Click **Create**

Vercel will automatically:
- Create the database
- Add environment variables (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`)
- Connect to your project

#### 4. Add Environment Variables

In Vercel Project Settings → Environment Variables, add:

\`\`\`
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret
\`\`\`

**Optional OAuth (if using Google/GitHub login):**
\`\`\`
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
\`\`\`

#### 5. Run Database Migrations

After deployment, you need to run migrations:

**Option A: Using Vercel CLI**
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
\`\`\`

**Option B: Using Prisma Studio in Vercel**
1. Go to your Vercel Postgres database
2. Click "Query" tab
3. Run the SQL from \`prisma/migrations/\` folder

#### 6. Redeploy

\`\`\`bash
git add .
git commit -m "Add environment variables"
git push
\`\`\`

Vercel will automatically redeploy.

## 🔐 OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - \`http://localhost:3000/api/auth/callback/google\` (development)
   - \`https://your-domain.vercel.app/api/auth/callback/google\` (production)
6. Copy Client ID and Client Secret to \`.env\`

### GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Task Management Pro
   - **Homepage URL**: \`https://your-domain.vercel.app\`
   - **Authorization callback URL**: \`https://your-domain.vercel.app/api/auth/callback/github\`
4. Copy Client ID and Client Secret to \`.env\`

## 📁 Project Structure

\`\`\`
task-management-nextjs/
├── app/
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── tasks/        # Task CRUD
│   │   ├── tags/         # Tags management
│   │   └── users/        # Users list
│   ├── dashboard/        # Main app (protected)
│   ├── login/           # Login page
│   ├── register/        # Register page
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Global styles
├── components/
│   ├── providers/       # Context providers
│   ├── ui/             # Reusable UI components
│   └── dashboard/      # Dashboard components
├── lib/
│   ├── prisma.ts       # Prisma client
│   └── auth.ts         # NextAuth config
├── prisma/
│   └── schema.prisma   # Database schema
├── public/             # Static files
├── .env.example        # Environment template
├── next.config.js      # Next.js config
├── tailwind.config.js  # Tailwind config
├── tsconfig.json       # TypeScript config
└── package.json        # Dependencies
\`\`\`

## 🗄️ Database Schema

### Users
- id, name, email, password
- OAuth accounts
- Created tasks
- Assigned tasks

### Tasks
- id, title, description
- status (todo, in-progress, done)
- priority (low, medium, high)
- dueDate, userId
- Relations: tags, assignees, subtasks, comments, attachments

### Tags
- id, name, color

### Subtasks
- id, title, completed, order, taskId

### Comments
- id, content, userId, taskId

### Attachments
- id, filename, url, size, type, taskId

## 🔧 Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
npx prisma migrate   # Run database migrations
\`\`\`

## 🎨 Customization

### Changing Theme Colors

Edit \`tailwind.config.js\`:

\`\`\`javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
\`\`\`

### Adding New Task Status

1. Update Prisma schema in \`prisma/schema.prisma\`
2. Run migration: \`npx prisma migrate dev\`
3. Update frontend in dashboard components

## 🐛 Troubleshooting

### Database Connection Issues

\`\`\`bash
# Check if database is accessible
npx prisma db push

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset
\`\`\`

### Build Errors

\`\`\`bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
\`\`\`

### OAuth Not Working

1. Check redirect URIs match exactly
2. Verify environment variables are set in Vercel
3. Check OAuth app is not restricted

## 📚 API Endpoints

### Authentication
- \`POST /api/register\` - Create new user
- \`POST /api/auth/signin\` - Login
- \`POST /api/auth/signout\` - Logout

### Tasks
- \`GET /api/tasks\` - Get all tasks
- \`POST /api/tasks\` - Create task
- \`PUT /api/tasks/[id]\` - Update task
- \`DELETE /api/tasks/[id]\` - Delete task

### Tags
- \`GET /api/tags\` - Get all tags
- \`POST /api/tags\` - Create tag

### Users
- \`GET /api/users\` - Get all users (for assignment)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/yourusername/task-management-nextjs/issues) page
2. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Screenshots (if applicable)
   - Environment info (Node version, OS, etc.)

## 🎯 Roadmap

- [ ] Email notifications
- [ ] Real-time WebSocket updates
- [ ] Activity timeline
- [ ] Advanced analytics
- [ ] Export to PDF/CSV
- [ ] Mobile apps (React Native)
- [ ] Team workspaces
- [ ] Time tracking
- [ ] Recurring tasks
- [ ] Kanban board customization

## 🌟 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

Made with ❤️ by [Your Name]

**Live Demo**: [https://your-app.vercel.app](https://your-app.vercel.app)
**Repository**: [https://github.com/yourusername/task-management-nextjs](https://github.com/yourusername/task-management-nextjs)
