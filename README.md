# Still & Story

A responsive photography portfolio and studio dashboard built with Astro, React, TypeScript, Tailwind CSS, and Motion. Prepared for Vercel hosting, Firebase Authentication/Firestore, and Cloudinary image storage. The studio identity, portfolio photographs, and copy are illustrative demo content.

## Run locally

Use Node.js 22.18 or newer (Node 24 LTS recommended).

```sh
npm install
npm run dev
```

Open the printed address. `/` is the portfolio; `/admin` is the studio dashboard. Without Firebase configuration, the dashboard offers a clearly labelled demo. Demo content and enquiries persist in localStorage on that browser/origin only. Uploaded demo images are compressed to WebP and stored locally, subject to the browser's storage quota. Nothing is sent to a photographer in demo mode.

```sh
npm run check
npm test
npm run build
npm run preview
```

`npm run dev` serves Astro pages; the Vercel `/api/cloudinary-sign` function runs on Vercel. To exercise live signed uploads locally use `npx vercel dev` after linking your project and configuring its environment.

## Included

- Editorial homepage, responsive navigation, category filters, shareable albums (`/?album=ALBUM_ID`), fullscreen viewer, keyboard controls, and reduced-motion support.
- Light and dark themes across the portfolio and studio dashboard. The header toggle saves the choice in the browser; without a saved choice the site follows the device appearance. Theme is applied before the page paints.
- About section, services accordion, enquiry form, and configurable email/telephone/WhatsApp/Instagram links.
- Dashboard with album creation/deletion, drafts, publication, photo upload/reordering/removal, alt text, studio details, enquiries, and JSON backup export.
- A server-side Cloudinary signature endpoint that checks Firebase ID tokens and admin access. No Cloudinary API secret or service-account private key is shipped to the browser.
- Firestore rules keep editable drafts private and allow only published content in the publicly readable document. Public enquiries are write-only to visitors with field validation.

## Connect Firebase

1. Create a Firebase project and register a Web app. Enable **Authentication → Email/Password**. Add the Vercel production domain to Authentication's authorized domains. Create a **Cloud Firestore Standard** database in production mode. Firebase Storage is not used; Authentication and Firestore can use Spark within its quotas.
2. Copy `.env.example` to `.env` locally and fill the four `PUBLIC_FIREBASE_*` values from Project settings. Add the same values to your Vercel environment. These identify your web app and are intended for client use; Firestore security rules protect your data.
3. Create the photographer's account in Firebase Authentication. Copy the user's UID. In Firestore create `admins/USER_UID`, with a boolean field `enabled` set to `true`. This must be done through the Firebase console or trusted Admin SDK; the browser cannot grant itself access.
4. Publish `firestore.rules` through the console, or use `npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID`. The project ID in this command is your actual Firebase project ID.
5. For the Vercel upload endpoint, create a dedicated service account with the Firebase Authentication token-verification/user-read and Firestore document-read permissions it needs. Add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` to Vercel. The private key may contain actual newlines or escaped `\n`. Keep service-account JSON and secrets out of source control. Firebase's Admin SDK guide describes credential setup: https://firebase.google.com/docs/admin/setup
6. Set `PUBLIC_DEMO_MODE=false` on the production deployment. If Firebase values are missing, editing and form submissions will then be disabled. A configured Firebase app never falls back to local demo saving after an error.

The dashboard reads `private/content`, while visitors read `site/content`. Saving writes both in a single batch, with unpublished albums removed from the public document. Create albums as drafts, add images, then publish. First live sign-in starts with an empty album list; use **Site details** to replace the illustrative copy and hero/about images, then save. Demo edits do not automatically migrate to Firebase. Replace all sample content before publishing a business site.

## Connect Cloudinary

1. Use the **Image & Video APIs** product and create a **signed** upload preset. Restrict it to JPEG, PNG, and WebP images, set a maximum file size of 10 MB, and disable unwanted add-ons. Do not use an unrestricted unsigned upload preset.
2. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_UPLOAD_PRESET` to Vercel's server environment. None may use a `PUBLIC_` prefix except values explicitly designated as browser configuration above.
3. Redeploy. The browser authenticates with Firebase, requests a signature from `/api/cloudinary-sign`, then uploads directly to Cloudinary. Images are resized to a maximum 2,000-pixel longest edge and converted to WebP before uploading.
4. Removing a photo/album from the dashboard removes the website reference. It does **not** delete the Cloudinary asset. Delete unused assets in the Cloudinary console when you want to reclaim storage. Uploaded assets can exist before a content save, so review unused uploads periodically.

Cloudinary's free allowance is shared across storage, transformations, and delivery. Watch usage in its console. Original-resolution files should be backed up outside this portfolio.

## Deploy to Vercel

1. Put this project in a Git repository and import it into Vercel. Select the **Astro** framework preset. Build command: `npm run build`. Output: `dist`. Vercel automatically deploys the root `api/` Node function alongside the static Astro output.
2. Set the environment variables above for production (and preview if needed), then deploy. Firebase/Cloudinary account setup and credentials are required for live editing and uploads.
3. Verify sign-in, admin authorization, saving, image upload, and a test enquiry from a private browser. Unauthorized accounts must be denied admin reads and uploads.
4. Use a Vercel plan that permits commercial use. Vercel Hobby is restricted to non-commercial personal use. A photography business portfolio needs a commercial plan: https://vercel.com/docs/limits/fair-use-guidelines

## Enquiries and privacy

Live enquiries are stored in Firestore and shown in the dashboard. There is no automatic email delivery or booking confirmation. **Reply by email** opens your mail application. The public form has a honeypot and server-enforced Firestore field validation. For Firebase App Check, register your production domain with reCAPTCHA Enterprise, configure it in Firebase App Check, set `PUBLIC_FIREBASE_APPCHECK_SITE_KEY` in Vercel, and redeploy. Verify valid requests in App Check's metrics before enforcing it for Firestore. The browser integration is included. The form collects contact and shoot-planning details; set your retention policy and add the privacy notice your business needs. Do not put confidential material in public portfolio albums.

## Verification scope

The project can be built and its demo flows verified without accounts. Live Firebase permissions, Cloudinary uploads, password-reset email, and Vercel deployment need the owner's configured accounts and must be checked after connection. The included unit tests exercise upload endpoint rejection paths and draft filtering; they do not replace live service testing.

## Sample image sources

Demo photographs are downloaded from Unsplash through `scripts/download-images.py`; filenames and original photo identifiers are recorded in that script. Unsplash license: https://unsplash.com/license . The demo image descriptions are illustrative and should be replaced with accurate alt text when you add the photographer's own images. No real customer names, testimonials, or studio contact details are invented.
