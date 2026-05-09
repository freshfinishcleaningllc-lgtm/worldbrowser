# 🌍 WorldBrowser AI

> The world's most powerful free AI browser — built for everyone, everywhere.

**8 built-in apps in one:** Search · News · Learning · Health · Tools · Marketplace · Community · Voice Search  
**12 languages** · Works on phone, tablet, desktop · Installs as a mobile app (PWA)

---

## 🚀 DEPLOY IN 5 MINUTES (Free on Netlify)

### Step 1 — Get your API key
1. Go to https://console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)

### Step 2 — Upload to GitHub
1. Go to https://github.com and create a new repository called `worldbrowser`
2. Upload all these files into it (drag and drop the folder)

### Step 3 — Deploy on Netlify
1. Go to https://netlify.com → **Sign up free**
2. Click **Add new site** → **Import from GitHub**
3. Select your `worldbrowser` repository
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**

### Step 4 — Add your API key (IMPORTANT)
1. In Netlify, go to **Site Settings** → **Environment Variables**
2. Click **Add variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: paste your API key
5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### Step 5 — Your app is LIVE! 🎉
Your URL will be something like: `https://worldbrowser-abc123.netlify.app`

---

## 📱 MAKE IT AN ANDROID APP (APK)

Once deployed, wrap it as an Android APK using Bubblewrap (same tool used for Seeker Music):

```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize (use your Netlify URL)
bubblewrap init --manifest https://your-site.netlify.app/manifest.webmanifest

# Build APK
bubblewrap build
```

Then submit the APK to:
- Google Play Store
- Solana Mobile dApp Store
- Samsung Galaxy Store
- APKPure (for countries without Google Play)

---

## 🌐 CUSTOM DOMAIN (Optional)

Get a free domain from: https://www.freenom.com  
Or buy `worldbrowser.app` for ~$10/year

In Netlify: **Site Settings** → **Domain Management** → **Add custom domain**

---

## 💰 COST ESTIMATE

| Users/day | Searches/day | Monthly API Cost |
|-----------|-------------|-----------------|
| 100       | 500         | ~$0.40          |
| 1,000     | 5,000       | ~$4.00          |
| 10,000    | 50,000      | ~$40.00         |

**The app already has a 30 searches/day limit per user** to protect costs.

---

## 📊 FUNDING OPTIONS

- **UNICEF Innovation Fund** — funds digital access projects
- **Gates Foundation** — technology for development grants  
- **Google.org** — AI for social good grants
- **Telecom zero-rating** — MTN, Airtel, Safaricom free data partnerships
- **Government contracts** — Ministries of Education/Health

---

## 🛠️ PROJECT STRUCTURE

```
worldbrowser/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Full WorldBrowser app
├── public/
│   └── favicon.svg       # App icon
├── netlify/
│   └── functions/
│       └── ai.js         # Secure API proxy
├── index.html            # HTML shell
├── vite.config.js        # Build config + PWA
├── package.json          # Dependencies
├── netlify.toml          # Netlify settings
└── .env.example          # API key template
```

---

## 📄 LICENSE

Built by **Lovelead** / Fresh Finish Cleaning LLC  
Free for personal and community use.

---

*WorldBrowser AI — Knowledge without borders* 🌍
