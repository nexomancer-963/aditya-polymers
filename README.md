# Aditya Polymers website

Self-contained Next.js source for the ten-page Aditya Polymers website. Import this repository into a Vercel project with the repository root as the project root, using Node 22 or newer and the Next.js framework preset. The project does not need the sibling `Branding/`, `demo-review/`, or `archive/` folders.

## Local verification

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run start -- --port 3187
```

With the server running, `npm.cmd run test:seo` checks all public URLs, canonical tags, redirects, and review crawl rules. The larger source workspace retains ESLint, Chromium visual checks, and accessibility tests; this deployment repository contains only the site and lightweight checks.

## Vercel preview configuration

For the current Vercel-generated URL, leave `NEXT_PUBLIC_SITE_URL` unset and `NEXT_PUBLIC_ALLOW_INDEXING` unset or `false`. Metadata uses Vercel's `VERCEL_URL` system variable, while pages remain `noindex,nofollow`, `robots.txt` disallows crawling, and the sitemap is empty. Keep Vercel system environment variables enabled. A future custom domain and indexing decision require a separate release review.

The enquiry UI is present, but the API returns a clear delivery-unavailable response until `ENQUIRY_WEBHOOK_URL` and its recipient/provider are supplied and tested. Do not configure a made-up inbox or claim delivery from this demo. `.env.example` lists the variables without secrets.

The site uses licensed illustrative stock photos. They do not establish what the company's actual equipment, products, or facilities look like. Product, certification, market, privacy, and contact facts need business approval before public launch. The established `.html` URLs remain in the route map.

**Hosting plan:** Vercel's Hobby tier is limited to non-commercial personal use under its current fair-use terms. A company marketing site requires a plan that permits commercial use, or another suitable host. Check the current terms before importing this repo.
