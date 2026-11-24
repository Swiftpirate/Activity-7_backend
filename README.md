# Activity 7 – Campus Maintenance Requests API

Node.js + Express API with a PostgreSQL database, both hosted on Render.

## 1. Push to GitHub
Upload this folder to a new GitHub repository. `.gitignore` already leaves out `.env` and `node_modules`.

## 2. Create the database on Render
1. Sign in to https://render.com (use "Sign in with GitHub").
2. New → **Postgres**. Name: `campus-maintenance-db`. Plan: **Free**. Create.
3. When it is ready, copy the **Internal Database URL**.

## 3. Create the web service on Render
New → **Web Service** → connect the GitHub repo. Use the **same region** as the database.
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Instance: Free
- Environment variables:
  - `DATABASE_URL` = the Internal Database URL
  - `CLIENT_ORIGINS` = `https://genuine-entremet-af724c.netlify.app`

The table and 9 seed records are created automatically on the first start.
Open the service URL, then `/health`, then test every route in Postman.

## Run locally (optional)
Copy `.env.example` to `.env`, paste Render's **External** Database URL into `DATABASE_URL`, keep `DATABASE_SSL=true`, then:
```
npm install
npm start
```
Open http://localhost:3000. (On PowerShell, use `npm.cmd` if `npm` is blocked.)
