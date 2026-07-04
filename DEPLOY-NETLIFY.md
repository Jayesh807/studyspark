# Deploying StudySpark to Netlify

This guide walks you through deploying StudySpark to Netlify with a **permanent PostgreSQL database** (required — SQLite won't work on Netlify's serverless platform).

---

## ⚠️ Why you need PostgreSQL on Netlify

Netlify runs API routes as **serverless functions** with an **ephemeral, read-only filesystem**. SQLite writes to a local file (`db/custom.db`) that either can't be written to or gets wiped between requests. This means:

- ❌ Users can't log in (passwords can't be verified — DB is empty/gone)
- ❌ Tasks/subjects/exams won't save (writes are lost)
- ❌ Every cold start = fresh empty database

**Solution:** Use **Neon** (free serverless PostgreSQL) as your database. The Postgres version of the schema is already prepared at `prisma/schema.netlify.prisma`.

---

## 📋 Prerequisites

- A [Netlify](https://netlify.com) account (free)
- A [Neon](https://neon.tech) account (free tier — 0.5 GB storage, plenty for StudySpark)
- Your StudySpark code pushed to a GitHub repository

---

## 🚀 Step-by-step deployment

### Step 1 — Create a Neon PostgreSQL database

1. Go to **https://neon.tech** → Sign up (free, no credit card)
2. Click **"Create Project"** → name it `studyspark` → pick the region closest to you
3. On the project dashboard, find the **Connection string** — it looks like:
   ```
   postgresql://neondb_owner:AbCdEf123456@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy this string** — you'll need it in Steps 3 and 4.

### Step 2 — Push your code to GitHub

```bash
cd my-project
git init
git add .
git commit -m "Prepare for Netlify deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/studyspark.git
git push -u origin main
```

> **Important:** Make sure `.gitignore` includes `.env`, `node_modules/`, `.next/`, and `db/*.db` — you do NOT want to commit secrets or the local SQLite database.

### Step 3 — Create the database tables on Neon

Run this **once** on your local machine (it creates all the tables on your Neon Postgres DB):

```bash
# Temporarily set the Neon connection string as your DATABASE_URL
# (replace with YOUR actual Neon URL)
DATABASE_URL="postgresql://neondb_owner:AbCdEf123456@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" \
  npx prisma db push --schema=prisma/schema.netlify.prisma
```

You should see: `🚀 Your database is now in sync with your Prisma schema.`

### Step 4 — Connect Netlify to your GitHub repo

1. Go to **https://app.netlify.com** → **"Add new site" → "Import an existing project"**
2. Connect your GitHub account if you haven't already
3. Select your `studyspark` repository
4. Netlify will auto-detect Next.js — **but verify these settings**:

   | Setting | Value |
   |---|---|
   | **Build command** | `npm run build:netlify` |
   | **Publish directory** | `.next` |

   > The `netlify.toml` file in the project root should auto-fill these. If not, set them manually.

5. Under **"Environment variables"**, add these BEFORE clicking deploy:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string (from Step 1) |
   | `JWT_SECRET` | A random 64-character string (generate one at https://jwtsecret.com/generate) |
   | `NEXTAUTH_URL` | `https://YOUR_SITE_NAME.netlify.app` (use the URL Netlify assigns) |
   | `NODE_ENV` | `production` |

   > 💡 You can set env vars later under **Site settings → Environment variables** if you forgot one.

6. Click **"Deploy site"** 🎉

### Step 5 — Wait for the first deploy to finish

The first build takes 3–5 minutes. Watch the deploy log — you should see:
```
$ npm run build:netlify
> prisma generate --schema=prisma/schema.netlify.prisma
✔ Generated Prisma Client
> next build
✓ Compiled successfully
Site deployed!
```

### Step 6 — Test your live site

1. Visit your Netlify URL (e.g. `https://studyspark-xxx.netlify.app`)
2. The landing page should load
3. Click **Sign Up** → create an account → it should work and stay logged in
4. Add a task → refresh the page → the task should still be there ✅

If everything works, you now have a **24/7 live StudySpark** with a permanent PostgreSQL database! 🎉

---

## 🔧 Troubleshooting

### "Page Not Found" after deploy
- **Cause:** The `@netlify/plugin-nextjs` is missing or the publish directory is wrong.
- **Fix:** Check `netlify.toml` exists in your repo root and the plugin is in `package.json` devDependencies. Verify publish directory is `.next` (not `dist` or `build`).

### Build fails with "Prisma can't reach database"
- **Cause:** `DATABASE_URL` env var not set on Netlify, or the Neon DB isn't accessible.
- **Fix:** Go to Site settings → Environment variables → add your Neon connection string. Make sure it includes `?sslmode=require`.

### Login works but data doesn't save
- **Cause:** Tables weren't created on Neon (Step 3 was skipped).
- **Fix:** Run `npx prisma db push --schema=prisma/schema.netlify.prisma` locally with your Neon `DATABASE_URL` set.

### "Database connection error" at runtime
- **Cause:** Neon's free tier "scales to zero" after inactivity — the first request after idle takes a few seconds to wake the DB.
- **Fix:** This is normal on free tiers. For production, enable Neon's "Always-on compute" ($5/mo) or upgrade to a paid plan.

### Prisma client error: "Unknown provider"
- **Cause:** The build used the wrong schema file.
- **Fix:** Make sure the build command is exactly `npm run build:netlify` (NOT `npm run build`), so it uses `schema.netlify.prisma`.

---

## 🔄 Updating your deployed site

Every time you `git push` to `main`, Netlify automatically rebuilds and deploys. No manual steps needed.

If you change the Prisma schema:
1. Run `npx prisma db push --schema=prisma/schema.netlify.prisma` locally (with `DATABASE_URL` = your Neon URL) to update the live DB
2. Commit and push — Netlify rebuilds automatically

---

## 💰 Cost expectations

| Service | Free tier | Paid |
|---|---|---|
| **Netlify** | 100 GB bandwidth, 300 build min/mo | $19/mo for more |
| **Neon** | 0.5 GB storage, always-on compute optional | $19/mo for more storage |
| **Total for a personal project** | **$0/mo** | ~$20-40/mo for scale |

StudySpark will run comfortably on the free tiers for a single user or a small group.

---

## 🆘 Need help?

If you hit issues:
1. Check the **Netlify deploy log** (Deploys → click the failed deploy → scroll)
2. Check the **function logs** (Functions tab → click any function → view logs)
3. Verify all 4 environment variables are set correctly
4. Make sure Step 3 (creating Neon tables) was completed

Good luck! 🚀
