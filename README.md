# Aroma House - Full-Stack Website

This project now includes:

- Frontend: static marketing website (`index.html`, `css/`, `js/`)
- Backend: Express API (`server.js`)
- Data source: `data/site-content.json`
- Inquiry endpoint: `POST /api/inquiries`

## 1) Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start server:
   ```bash
   npm start
   ```
3. Open:
   ```
   http://localhost:3000
   ```

The server hosts frontend + backend together.

## 2) API endpoints

- `GET /api/health`
- `GET /api/site-content`
- `POST /api/inquiries`
- `GET /api/admin/inquiries`

## 2.1) Admin dashboard

- Open `/admin` in the browser.
- Enter the admin token when prompted.
- The dashboard shows all inquiries, lets you search them, and export them as CSV.
- If `ADMIN_TOKEN` is set in the environment, the API requires the same token in the request header.

Inquiry body example:

```json
{
  "name": "Amit",
  "phone": "9876543210",
  "message": "Need a family combo for tonight"
}
```

## 3) Best deployment approach (recommended)

Use a full-stack host connected to GitHub (Render recommended).

1. Push this project to a GitHub repository.
2. In Render, create a new Web Service from your GitHub repo.
3. Render will auto-detect `render.yaml`.
4. Build command: `npm install`
5. Start command: `npm start`
6. After deploy, your website and backend will run on one URL.

This is the easiest way to keep frontend and backend connected.

## 4) Optional: GitHub Pages for frontend only

This repo includes `.github/workflows/deploy-pages.yml`.

Important: GitHub Pages cannot run Node/Express backend.

If you deploy frontend on Pages, keep backend on Render (or another backend host), then set API URL in `js/config.js`:

```js
window.APP_CONFIG = {
  apiBaseUrl: "https://your-backend-domain.com",
};
```

Then push to `main` and Pages workflow will publish the static site.

## 5) GitHub push commands

```bash
git init
git add .
git commit -m "Connect frontend to backend and add deployment setup"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If repository already exists, skip `git init` and `git remote add origin`.

## 6) Environment variables

```bash
PORT=3000
ADMIN_TOKEN=your-secure-token
```
