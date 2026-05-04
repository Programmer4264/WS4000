# Cloudflare Pages Deployment Guide

Deploy WeatherStar 4000+ as a completely free static site on Cloudflare Pages – no server required.  
All weather data is fetched directly from NOAA's API in the visitor's browser.

---

## Table of Contents

1. [Why Cloudflare Pages?](#why-cloudflare-pages)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment](#step-by-step-deployment)
   - [Option A – Connect GitHub repository (recommended)](#option-a--connect-github-repository-recommended)
   - [Option B – Direct upload via Wrangler CLI](#option-b--direct-upload-via-wrangler-cli)
4. [Pinning a Static Location](#pinning-a-static-location)
5. [Pinning Display Settings](#pinning-display-settings)
   - [All Available Parameters](#all-available-parameters)
6. [Example Permalinks](#example-permalinks)
7. [Kiosk / Digital Signage Setup](#kiosk--digital-signage-setup)
8. [Continuous Deployment (GitHub Actions)](#continuous-deployment-github-actions)
9. [Music on Cloudflare Pages](#music-on-cloudflare-pages)
10. [Cost Information](#cost-information)
11. [Troubleshooting](#troubleshooting)

---

## Why Cloudflare Pages?

| Feature | Detail |
|---------|--------|
| **Free tier** | 500 builds/month, unlimited requests, unlimited bandwidth |
| **Global CDN** | Static files served from 300+ edge locations worldwide |
| **Custom domain** | Free SSL for any domain you own |
| **No server needed** | All NOAA API calls happen in the browser |
| **Zero maintenance** | Cloudflare handles uptime, certificates, and scaling |

> **Limitation:** The Node.js caching proxy (`proxy/` directory) is not available on Cloudflare Pages. All API requests are made directly from the browser to NOAA. This is identical to the Docker static deployment mode.

---

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- Node.js 18 or later (for local builds or the Wrangler CLI)
- A fork or clone of this repository

---

## Step-by-Step Deployment

### Option A – Connect GitHub repository (recommended)

1. **Fork** this repository to your own GitHub account (or use a clone that you have pushed to GitHub).

2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and open **Workers & Pages**.

3. Click **Create** → **Pages** → **Connect to Git**.

4. Authorize Cloudflare to access your GitHub account and select your fork/repo.

5. Configure the build settings:

   | Setting | Value |
   |---------|-------|
   | **Framework preset** | None |
   | **Build command** | `npm run build` |
   | **Build output directory** | `dist` |
   | **Root directory** | *(leave blank)* |
   | **Node.js version** | `20` (under *Environment Variables* set `NODE_VERSION=20`) |

6. Click **Save and Deploy**. Cloudflare will run `npm run build` and publish the `dist/` folder.

7. Once deployed, your site is available at `https://<project-name>.pages.dev`.

### Option B – Direct upload via Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Build the static files
npm run build

# Log in to Cloudflare
wrangler login

# Deploy (first time – creates the project)
wrangler pages deploy dist --project-name=ws4kp

# Subsequent deploys
wrangler pages deploy dist --project-name=ws4kp
```

---

## Pinning a Static Location

To lock WeatherStar to a specific city so that every visitor sees the same location, set environment variables in the Cloudflare Pages dashboard:

1. Open your Pages project → **Settings** → **Environment Variables**.
2. Click **Add variable** and add:

   | Variable name | Example value |
   |---------------|---------------|
   | `WSQS_latLonQuery` | `Orlando International Airport, Orlando, FL, USA` |

3. Redeploy the project (or trigger a new commit) for the variable to take effect.

> **How it works:** Variables that start with `WSQS_` are injected into the page's URL query string at build time by the static-env-handler. The `WSQS_` prefix is stripped and underscores (`_`) are converted to hyphens (`-`) to match the query-string key.  
> `WSQS_latLonQuery` → `?latLonQuery=Orlando+International+Airport...`

You can also pre-supply the resolved latitude/longitude to skip geocoding:

```
WSQS_latLon={"lat":28.431,"lon":-81.3076}
```

Use the **Copy Permalink** button in the app to capture the exact `latLon` value for your location.

> **Note on static deployments:** On Cloudflare Pages the `WSQS_` variable injection uses a client-side redirect (the same `redirect.html` mechanism used by the Docker static image). If no environment variables are set the app loads normally with no redirect.

---

## Pinning Display Settings

Set any combination of `WSQS_` environment variables in the Cloudflare Pages dashboard to control which weather sections appear for every visitor.

### All Available Parameters

The table below lists every query-string parameter and its matching `WSQS_` environment variable name.

#### Display Sections

| Parameter (URL) | Environment variable | Values | Default |
|-----------------|----------------------|--------|---------|
| `hazards-checkbox` | `WSQS_hazards_checkbox` | `true` / `false` | `true` |
| `current-weather-checkbox` | `WSQS_current_weather_checkbox` | `true` / `false` | `true` |
| `latest-observations-checkbox` | `WSQS_latest_observations_checkbox` | `true` / `false` | `true` |
| `hourly-checkbox` | `WSQS_hourly_checkbox` | `true` / `false` | `false` |
| `hourly-graph-checkbox` | `WSQS_hourly_graph_checkbox` | `true` / `false` | `true` |
| `travel-checkbox` | `WSQS_travel_checkbox` | `true` / `false` | `false` |
| `regional-forecast-checkbox` | `WSQS_regional_forecast_checkbox` | `true` / `false` | `true` |
| `local-forecast-checkbox` | `WSQS_local_forecast_checkbox` | `true` / `false` | `true` |
| `extended-forecast-checkbox` | `WSQS_extended_forecast_checkbox` | `true` / `false` | `true` |
| `almanac-checkbox` | `WSQS_almanac_checkbox` | `true` / `false` | `false` |
| `spc-outlook-checkbox` | `WSQS_spc_outlook_checkbox` | `true` / `false` | `true` |
| `radar-checkbox` | `WSQS_radar_checkbox` | `true` / `false` | `true` |

#### Appearance & Playback

| Parameter (URL) | Environment variable | Values | Default |
|-----------------|----------------------|--------|---------|
| `settings-wide-checkbox` | `WSQS_settings_wide_checkbox` | `true` / `false` | `false` |
| `settings-kiosk-checkbox` | `WSQS_settings_kiosk_checkbox` | `true` / `false` | `false` |
| `settings-scanLines-checkbox` | `WSQS_settings_scanLines_checkbox` | `true` / `false` | `false` |
| `settings-speed-select` | `WSQS_settings_speed_select` | `0.50` `0.75` `1.00` `1.25` `1.50` | `1.00` |
| `settings-units-select` | `WSQS_settings_units_select` | `us` / `metric` | `us` |

#### Kiosk / Auto-play

| Parameter (URL) | Environment variable | Values | Default |
|-----------------|----------------------|--------|---------|
| `kiosk` | `WSQS_kiosk` | `true` / `false` | `false` |
| `settings-mediaPlaying-boolean` | `WSQS_settings_mediaPlaying_boolean` | `true` / `false` | `false` |

---

## Example Permalinks

All of the permalinks below work on the live site at `https://weatherstar.netbymatt.com` or on your own Cloudflare Pages deployment by replacing the domain.

### Home weather dashboard – Orlando, FL (US units, no travel or almanac)
```
https://<your-site>.pages.dev/?latLonQuery=Orlando+International+Airport%2C+Orlando%2C+FL%2C+USA&hazards-checkbox=true&current-weather-checkbox=true&latest-observations-checkbox=true&hourly-graph-checkbox=true&travel-checkbox=false&regional-forecast-checkbox=true&local-forecast-checkbox=true&extended-forecast-checkbox=true&almanac-checkbox=false&spc-outlook-checkbox=true&radar-checkbox=true&settings-units-select=us
```

### Kiosk / digital signage – fullscreen, auto-playing, metric units
```
https://<your-site>.pages.dev/?latLonQuery=Chicago+O%27Hare+International+Airport&kiosk=true&settings-units-select=metric&settings-speed-select=1.00&current-weather-checkbox=true&hourly-graph-checkbox=true&radar-checkbox=true&travel-checkbox=false&almanac-checkbox=false
```

### Minimal view – current conditions and radar only
```
https://<your-site>.pages.dev/?latLonQuery=New+York+City&hazards-checkbox=false&current-weather-checkbox=true&latest-observations-checkbox=false&hourly-checkbox=false&hourly-graph-checkbox=false&travel-checkbox=false&regional-forecast-checkbox=false&local-forecast-checkbox=false&extended-forecast-checkbox=false&almanac-checkbox=false&spc-outlook-checkbox=false&radar-checkbox=true
```

### All sections enabled – widescreen, slow speed
```
https://<your-site>.pages.dev/?latLonQuery=Dallas+Fort+Worth+International+Airport&hazards-checkbox=true&current-weather-checkbox=true&latest-observations-checkbox=true&hourly-checkbox=true&hourly-graph-checkbox=true&travel-checkbox=true&regional-forecast-checkbox=true&local-forecast-checkbox=true&extended-forecast-checkbox=true&almanac-checkbox=true&spc-outlook-checkbox=true&radar-checkbox=true&settings-wide-checkbox=true&settings-speed-select=0.75
```

> **Tip:** Use the **Copy Permalink** button in the app's settings panel to generate a permalink for any configuration, then convert it to `WSQS_` environment variables or share it directly.

---

## Kiosk / Digital Signage Setup

For a TV or digital signage installation:

1. Set environment variables in Cloudflare Pages to pin the location and hide unwanted sections.
2. Launch the browser in kiosk mode pointing at your Cloudflare Pages URL with `&kiosk=true` appended:

   ```bash
   # Chromium/Chrome example
   chromium-browser --kiosk "https://<your-site>.pages.dev/?kiosk=true"

   # Or with all parameters baked into the URL:
   chromium-browser --kiosk "https://<your-site>.pages.dev/?latLonQuery=Orlando&kiosk=true&radar-checkbox=true"
   ```

3. To enable music autoplay (subject to browser policy), add `&settings-mediaPlaying-boolean=true` and launch Chrome with:

   ```bash
   chromium-browser --kiosk --autoplay-policy=no-user-gesture-required "https://<your-site>.pages.dev/?kiosk=true&settings-mediaPlaying-boolean=true"
   ```

---

## Continuous Deployment (GitHub Actions)

An example workflow is provided at `.github/workflows/deploy-cloudflare.yml`. It automatically builds and deploys to Cloudflare Pages on every push to `main`.

To enable it:

1. In your Cloudflare dashboard generate an **API Token** with *Cloudflare Pages: Edit* permissions.
2. Find your **Account ID** (right sidebar of the Cloudflare dashboard home page).
3. Add both as GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Push a commit to `main` – the workflow runs automatically.

---

## Music on Cloudflare Pages

The static build includes a `playlist.json` with the default tracks. Cloudflare Pages serves these files as-is, so the default music **will** play automatically.

To add custom music tracks:

1. Place `.mp3` files in `server/music/` before running `npm run build`.
2. Rebuild and redeploy. The new tracks will be included in `dist/music/` and listed in `playlist.json`.

> The browser's autoplay policy may prevent music from starting without user interaction. Launch Chrome with `--autoplay-policy=no-user-gesture-required` for kiosk/signage use cases.

---

## Cost Information

Cloudflare Pages **free tier** includes:

| Resource | Free allowance |
|----------|----------------|
| Sites / projects | Unlimited |
| Requests | Unlimited |
| Bandwidth | Unlimited |
| Builds per month | 500 |
| Build time per build | Up to 20 minutes |
| Custom domains | 1 per project (free SSL) |
| Preview deployments | Unlimited |

WeatherStar 4000+ is a small static site (~1–2 MB). Each `npm run build` completes in about 1–2 minutes, well within free-tier limits.

---

## Troubleshooting

### Build fails with "Cannot find module" or "npm ci" error

- Make sure **Node.js version 20** is configured in Cloudflare Pages settings.  
  Go to **Settings → Environment Variables** and add `NODE_VERSION=20`.

### Page loads but shows "Unable to load weather data"

- This is typically a NOAA API outage or a location outside the USA. NOAA's API only covers the contiguous United States, Alaska, Hawaii, and US territories.

### Location does not redirect to pinned city

- Confirm the environment variable is named exactly `WSQS_latLonQuery` (case-sensitive).
- Check that there are no extra spaces around the `=` sign.
- Trigger a new deployment after saving the variable – Pages does not hot-reload environment variables.

### `kiosk=true` has no effect

- The `kiosk` parameter must be in the URL query string **when the page first loads**. If you set `WSQS_kiosk=true` as an environment variable, the redirect will append it correctly. Alternatively add it manually to the end of your permalink: `&kiosk=true`.

### Music does not play automatically

- Browsers block autoplay of audio by default. For kiosk/signage use, launch the browser with `--autoplay-policy=no-user-gesture-required`.

### Custom domain not working

- Add a CNAME record in your DNS provider pointing your domain to `<project>.pages.dev`, then add the domain under **Pages → Custom domains** in the Cloudflare dashboard.
