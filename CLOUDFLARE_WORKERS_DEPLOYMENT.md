# Cloudflare Workers Deployment Guide

Deploy WeatherStar 4000+ on Cloudflare Workers with full environment-variable support to pin any location and lock any display setting for every visitor.

> **Why Workers instead of Pages?**  
> Cloudflare Pages with *static assets only* does not execute a Worker script, so `WSQS_*` environment variables cannot be injected at request time. Using Cloudflare Workers (with the Assets binding) gives you a real script that reads variables from the Worker's environment and redirects the visitor to the correct URL on every request.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [How It Works](#how-it-works)
3. [Quick Start (Wrangler CLI)](#quick-start-wrangler-cli)
4. [Setting Environment Variables](#setting-environment-variables)
   - [In wrangler.toml (source-controlled)](#in-wranglertoml-source-controlled)
   - [In the Cloudflare Dashboard (recommended for secrets)](#in-the-cloudflare-dashboard-recommended-for-secrets)
5. [All Available WSQS_ Variables](#all-available-wsqs_-variables)
6. [Example Configurations](#example-configurations)
7. [Continuous Deployment (GitHub Actions)](#continuous-deployment-github-actions)
8. [Custom Domain](#custom-domain)
9. [Cost Information](#cost-information)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- Node.js 20 or later
- A fork or clone of this repository

Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/), Cloudflare's CLI tool:

```bash
npm install -g wrangler
```

---

## How It Works

```
Browser  →  GET /
                Worker reads WSQS_* env vars
                ↓
        WSQS_latLonQuery = "Orlando International Airport"
        WSQS_kiosk = "true"
                ↓
        307 redirect → /?latLonQuery=Orlando+International+Airport&kiosk=true
                ↓
        Static dist/index.html served with pinned parameters
```

1. The Worker script (`src/index.js`) inspects every incoming request.
2. When a visitor hits the bare root URL (`/`) with no query string, the Worker builds a query string from all `WSQS_*` environment variables and issues a `307` redirect.
3. The redirected request (which now has a query string) is served directly from the static `dist/` files — the Worker does not redirect again.
4. Requests for assets (CSS, JS, images, etc.) are passed straight through to the static files without any redirect.

---

## Quick Start (Wrangler CLI)

```bash
# 1. Install dependencies and build the static files
npm install
npm run build

# 2. Log in to Cloudflare
wrangler login

# 3. Deploy (creates the Worker on first run)
wrangler deploy
```

Your Worker is now live at `https://ws4kp.<your-subdomain>.workers.dev`.

---

## Setting Environment Variables

### In wrangler.toml (source-controlled)

Add a `[vars]` section to `wrangler.toml`. These variables are stored in your repository and visible to anyone with access to the code — do **not** put secrets here.

```toml
[vars]
WSQS_latLonQuery = "Orlando International Airport, Orlando, FL, USA"
WSQS_kiosk = "true"
WSQS_hazards_checkbox = "true"
WSQS_current_weather_checkbox = "true"
WSQS_latest_observations_checkbox = "true"
WSQS_hourly_graph_checkbox = "true"
WSQS_travel_checkbox = "false"
WSQS_regional_forecast_checkbox = "true"
WSQS_local_forecast_checkbox = "true"
WSQS_extended_forecast_checkbox = "true"
WSQS_almanac_checkbox = "false"
WSQS_spc_outlook_checkbox = "true"
WSQS_radar_checkbox = "true"
```

After editing `wrangler.toml` run `wrangler deploy` to push the changes.

### In the Cloudflare Dashboard (recommended for secrets)

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**.
2. Select your Worker → **Settings** → **Variables and Secrets**.
3. Click **Add variable**, enter the name (e.g. `WSQS_latLonQuery`) and value.
4. Click **Save** — the new variable is live immediately on the next request.

Variables set in the dashboard override the same-named variable in `wrangler.toml`.

---

## All Available WSQS_ Variables

Use the **Copy Permalink** button in the app's settings panel to generate a starting URL, then convert each key by adding the `WSQS_` prefix and replacing hyphens with underscores.

### Display Sections

| Variable | Query-string key | Values | Default |
|----------|-----------------|--------|---------|
| `WSQS_hazards_checkbox` | `hazards-checkbox` | `true` / `false` | `true` |
| `WSQS_current_weather_checkbox` | `current-weather-checkbox` | `true` / `false` | `true` |
| `WSQS_latest_observations_checkbox` | `latest-observations-checkbox` | `true` / `false` | `true` |
| `WSQS_hourly_checkbox` | `hourly-checkbox` | `true` / `false` | `false` |
| `WSQS_hourly_graph_checkbox` | `hourly-graph-checkbox` | `true` / `false` | `true` |
| `WSQS_travel_checkbox` | `travel-checkbox` | `true` / `false` | `false` |
| `WSQS_regional_forecast_checkbox` | `regional-forecast-checkbox` | `true` / `false` | `true` |
| `WSQS_local_forecast_checkbox` | `local-forecast-checkbox` | `true` / `false` | `true` |
| `WSQS_extended_forecast_checkbox` | `extended-forecast-checkbox` | `true` / `false` | `true` |
| `WSQS_almanac_checkbox` | `almanac-checkbox` | `true` / `false` | `false` |
| `WSQS_spc_outlook_checkbox` | `spc-outlook-checkbox` | `true` / `false` | `true` |
| `WSQS_radar_checkbox` | `radar-checkbox` | `true` / `false` | `true` |

### Appearance & Playback

| Variable | Query-string key | Values | Default |
|----------|-----------------|--------|---------|
| `WSQS_settings_wide_checkbox` | `settings-wide-checkbox` | `true` / `false` | `false` |
| `WSQS_settings_kiosk_checkbox` | `settings-kiosk-checkbox` | `true` / `false` | `false` |
| `WSQS_settings_scanLines_checkbox` | `settings-scanLines-checkbox` | `true` / `false` | `false` |
| `WSQS_settings_speed_select` | `settings-speed-select` | `0.50` `0.75` `1.00` `1.25` `1.50` | `1.00` |
| `WSQS_settings_units_select` | `settings-units-select` | `us` / `metric` | `us` |

### Kiosk / Auto-play

| Variable | Query-string key | Values | Default |
|----------|-----------------|--------|---------|
| `WSQS_kiosk` | `kiosk` | `true` / `false` | `false` |
| `WSQS_settings_mediaPlaying_boolean` | `settings-mediaPlaying-boolean` | `true` / `false` | `false` |

### Location

| Variable | Query-string key | Notes |
|----------|-----------------|-------|
| `WSQS_latLonQuery` | `latLonQuery` | Plain-text address or airport name; geocoded on first load |
| `WSQS_latLon` | `latLon` | JSON: `{"lat":28.431,"lon":-81.3076}` — skips geocoding |

---

## Example Configurations

See `wrangler.toml.example` for copy-paste ready configurations. A few highlights:

### Home Weather Dashboard — Orlando, FL

```toml
[vars]
WSQS_latLonQuery = "Orlando International Airport, Orlando, FL, USA"
WSQS_hazards_checkbox = "true"
WSQS_current_weather_checkbox = "true"
WSQS_latest_observations_checkbox = "true"
WSQS_hourly_graph_checkbox = "true"
WSQS_travel_checkbox = "false"
WSQS_regional_forecast_checkbox = "true"
WSQS_local_forecast_checkbox = "true"
WSQS_extended_forecast_checkbox = "true"
WSQS_almanac_checkbox = "false"
WSQS_spc_outlook_checkbox = "true"
WSQS_radar_checkbox = "true"
WSQS_settings_units_select = "us"
```

### Kiosk / Digital Signage — fullscreen, auto-play

```toml
[vars]
WSQS_latLonQuery = "Orlando International Airport, Orlando, FL, USA"
WSQS_kiosk = "true"
WSQS_settings_mediaPlaying_boolean = "true"
WSQS_settings_speed_select = "1.00"
WSQS_hazards_checkbox = "true"
WSQS_current_weather_checkbox = "true"
WSQS_hourly_graph_checkbox = "true"
WSQS_radar_checkbox = "true"
WSQS_travel_checkbox = "false"
WSQS_almanac_checkbox = "false"
```

---

## Continuous Deployment (GitHub Actions)

Create `.github/workflows/deploy-workers.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets in GitHub → **Settings** → **Secrets and variables** → **Actions**.

---

## Custom Domain

1. In the Cloudflare dashboard open your Worker → **Settings** → **Domains & Routes**.
2. Click **Add** → **Custom Domain** and enter your domain (e.g. `weather.example.com`).
3. Cloudflare automatically provisions a TLS certificate and sets up routing.

---

## Cost Information

The Cloudflare Workers **free tier** (Workers Free plan) includes:

| Resource | Free allowance |
|----------|---------------|
| Requests | 100,000 / day |
| CPU time | 10 ms / invocation |
| Workers | Unlimited |
| Custom domains | Unlimited |

WeatherStar 4000+ is a small static site. The Worker script executes in under 1 ms per request, well within free-tier CPU limits. At 100,000 requests/day the free tier is sufficient for personal and small-group use.

---

## Troubleshooting

### Worker deploys but location does not redirect

- Verify the variable name is exactly `WSQS_latLonQuery` (case-sensitive).
- Make sure you ran `wrangler deploy` after updating `wrangler.toml`, or saved the variable in the dashboard.
- Open DevTools → Network tab and check that the initial `GET /` returns a `307` response. If it returns `200` directly, the variable may not be set.

### `kiosk=true` has no effect

- The `kiosk` parameter must be present when the page first loads. Set `WSQS_kiosk = "true"` as a Worker variable so the redirect includes it.

### Build fails with "Cannot find module"

- Ensure Node.js 20 is active: `node --version`
- Run `npm install` before `npm run build` or `wrangler deploy`.

### Workers Free tier request limit exceeded

- Upgrade to the **Workers Paid** plan ($5/month, 10 million requests included), or restrict access using Cloudflare Access to reduce public traffic.

### Music does not play automatically

- Browsers block autoplay of audio by default. For kiosk/signage deployments, launch the browser with `--autoplay-policy=no-user-gesture-required` and set `WSQS_settings_mediaPlaying_boolean = "true"`.
