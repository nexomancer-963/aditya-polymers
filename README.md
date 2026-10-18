# Aditya Polymers demo site

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

## Demo configuration

Leave `NEXT_PUBLIC_ALLOW_INDEXING` unset or `false` on a temporary demo URL. This keeps pages `noindex,nofollow`, disallows crawlers in `robots.txt`, and publishes an empty sitemap. The supplied future live origin is `https://www.m.adityapolymers.com`; the demo does not change or claim that domain. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` only for an approved production build on that exact origin after the existing site is replaced and the release gates pass.

The enquiry UI is present, but the API returns a clear delivery-unavailable response until `ENQUIRY_WEBHOOK_URL` and its recipient/provider are supplied and tested. Do not configure a made-up inbox or claim delivery from this demo. `.env.example` lists the variables without secrets.

The content artwork is conceptual and does not depict the company's actual equipment, products, or facilities. Product, certification, market, privacy, and contact facts need business approval before public launch. Preserve the established `.html` URLs when replacing the live site.

**Hosting plan:** Vercel's Hobby tier is limited to non-commercial personal use under its current fair-use terms. A company marketing site requires a plan that permits commercial use, or another suitable host. Check the current terms before importing this repo.
