# 🚀 Quick Deployment Guide - Vercel

## Step-by-Step: Deploy ke Vercel dalam 10 Menit

### 1️⃣ Persiapan Project

\`\`\`bash
# Clone atau buka project
cd task-management-nextjs

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
\`\`\`

### 2️⃣ Push ke GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"

# Create repo di GitHub, lalu:
git remote add origin https://github.com/username/your-repo.git
git push -u origin main
\`\`\`

### 3️⃣ Deploy ke Vercel

1. **Login ke Vercel**
   - Buka https://vercel.com
   - Sign in dengan GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select repository: `your-repo`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Leave other settings as default
   - Click "Deploy"

### 4️⃣ Setup Database (Vercel Postgres)

1. **Buka Project di Vercel**
   - Go to your project dashboard

2. **Create Database**
   - Click tab "Storage"
   - Click "Create Database"
   - Select "Postgres"
   - Pilih nama database (contoh: `taskmanagement`)
   - Pilih region terdekat (Singapore/Tokyo)
   - Click "Create"

3. **Auto-Connect**
   - Vercel akan otomatis menambahkan environment variables:
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`

### 5️⃣ Add Environment Variables

Di Vercel Project → Settings → Environment Variables, tambahkan:

\`\`\`
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=<generate-dengan-command-dibawah>
\`\`\`

**Generate NEXTAUTH_SECRET:**
\`\`\`bash
openssl rand -base64 32
\`\`\`

Copy hasil output dan paste ke environment variable.

### 6️⃣ Run Database Migration

**Cara 1: Menggunakan Vercel CLI (Recommended)**

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migration
npx prisma migrate deploy
\`\`\`

**Cara 2: Manual via Vercel Dashboard**

1. Go to Storage → Your Postgres DB
2. Click "Query" tab
3. Run SQL query dari file migration di `prisma/migrations/xxx/migration.sql`

### 7️⃣ Redeploy

\`\`\`bash
# Trigger redeploy
git commit --allow-empty -m "Trigger redeploy"
git push
\`\`\`

Atau di Vercel Dashboard:
- Go to "Deployments" tab
- Click "..." pada latest deployment
- Click "Redeploy"

### 8️⃣ Test Application

1. Buka URL: `https://your-app-name.vercel.app`
2. Click "Sign up" untuk create account
3. Login dan mulai gunakan!

---

## ✅ Checklist Deployment

- [ ] Project ter-push ke GitHub
- [ ] Project ter-import di Vercel
- [ ] Vercel Postgres database sudah dibuat
- [ ] Environment variables sudah di-set (NEXTAUTH_URL, NEXTAUTH_SECRET)
- [ ] Database migration sudah dijalankan
- [ ] Application bisa diakses dan login berfungsi

---

## 🎯 Optional: Setup OAuth (Google/GitHub)

### Google OAuth

1. **Google Cloud Console**
   - https://console.cloud.google.com/
   - Create Project
   - Enable Google+ API
   - OAuth consent screen → External
   - Credentials → Create OAuth 2.0 Client ID

2. **Authorized Redirect URIs**
   - Add: `https://your-app.vercel.app/api/auth/callback/google`

3. **Add to Vercel Env Variables**
   \`\`\`
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   \`\`\`

### GitHub OAuth

1. **GitHub Settings**
   - https://github.com/settings/developers
   - New OAuth App
   - Homepage URL: `https://your-app.vercel.app`
   - Callback URL: `https://your-app.vercel.app/api/auth/callback/github`

2. **Add to Vercel Env Variables**
   \`\`\`
   GITHUB_ID=your-client-id
   GITHUB_SECRET=your-client-secret
   \`\`\`

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check if Vercel Postgres is properly linked
- Verify environment variables are set
- Run migration again

### "NextAuth Configuration Error"
- Make sure NEXTAUTH_URL matches your actual Vercel URL
- Check NEXTAUTH_SECRET is set
- Redeploy after adding env vars

### "Build Failed"
- Check build logs in Vercel
- Make sure all dependencies are in package.json
- Verify TypeScript has no errors

### "OAuth Not Working"
- Verify redirect URIs match exactly
- Check OAuth credentials are correct
- Make sure OAuth app is published/verified

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

Happy Deploying! 🚀
