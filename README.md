# Tax Cases Site — Live-synced with Notion

This is a small Next.js app that fetches your **Notion page live** on every visit.
Add a new case in Notion → refresh the website → it's there. No redeploy needed.

## How it works

- `pages/index.js` fetches your main Notion hub page and lists every case (subpage) found inside it.
- `pages/case/[id].js` fetches any individual case subpage by its Notion ID and renders it.
- Both run on the server on every request (`getServerSideProps`), so there's no caching to worry about — it's always current.

## One-time setup (about 10 minutes)

### Step 1 — Create a Notion integration
1. Go to https://www.notion.so/my-integrations
2. Click **+ New integration**
3. Name it anything (e.g. "Tax Cases Site")
4. Associated workspace: pick your workspace
5. Click **Submit**
6. On the next screen, copy the **Internal Integration Secret** (starts with `ntn_` or `secret_`) — you'll need this in Step 4.

### Step 2 — Share your Notion page with the integration
1. Open your **"Tax Cases — Recitation Table"** page in Notion
2. Click the **"..."** menu (top right) → **Connections** → **Add connections**
3. Find and select the integration you just created
4. This also gives it access to all subpages (the individual case pages) automatically.

### Step 3 — Get your root page ID
1. Open your Tax Cases page in Notion, click **Share → Copy link**
2. The link looks like: `https://www.notion.so/Tax-Cases-Recitation-Table-3baeb17941d48160a00de395d2330928`
3. The **32-character ID** at the end (`3baeb17941d48160a00de395d2330928`) is your `NOTION_ROOT_PAGE_ID`.

### Step 4 — Push this code to GitHub
1. Go to https://github.com/new, create a repo (e.g. `tax-cases-site`), leave it empty (no README)
2. On your machine / this download, initialize and push:
   ```bash
   cd notion-tax-site
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/tax-cases-site.git
   git push -u origin main
   ```
   (Or use GitHub Desktop / GitHub's "upload files" web UI if you don't use the command line — just drag in all files and folders, keeping the folder structure intact.)

### Step 5 — Deploy on Vercel
1. Go to https://vercel.com → sign in with GitHub
2. **Add New... → Project → Import** your `tax-cases-site` repo
3. Vercel will detect it's a Next.js app automatically
4. Before clicking Deploy, expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `NOTION_TOKEN` | (the integration secret from Step 1) |
   | `NOTION_ROOT_PAGE_ID` | (the page ID from Step 3) |
5. Click **Deploy**

You'll get a live URL. Every time you visit it (or refresh), it pulls fresh content straight from Notion.

## Updating the site going forward

You don't need to touch GitHub or Vercel again for content changes. Just:
1. Add/edit a case page in Notion (as we've been doing)
2. Make sure the new page is nested under the main Tax Cases page (so it's auto-detected as a "case")
3. Refresh the live site — it's there

You'd only need to touch the code again if you want to change the site's *design* (colors, layout, etc.) rather than its content.

## Troubleshooting

- **Blank page / error**: Double-check the `NOTION_TOKEN` and `NOTION_ROOT_PAGE_ID` env vars in Vercel's Project Settings → Environment Variables, then redeploy.
- **"Case not found"**: Make sure the integration was shared with that specific page (sharing the parent page shares children automatically, but pages created *before* sharing may need a manual re-share).
- **New case not showing on homepage**: Make sure it's a genuine Notion **subpage** (created via the `<page>` block / "Turn into page" / drag-in-as-subpage), not just a text link.
