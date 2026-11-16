# QuickList Personal — iPhone-first web app

## What works now
- Add up to eight photos, resized locally and stored in IndexedDB.
- Save, edit, delete inventory items; manually track marketplace statuses.
- One shared title and description and AI-assistable fields.
- Separate prices for eBay, Depop, Mercari; AI never changes prices.
- Export item metadata (does NOT include photos).
- Install to iPhone Home Screen after hosting on HTTPS.
- Optional real multi-photo AI analysis using the included Cloudflare Worker and an OpenAI API account.

## What is NOT connected
- No direct publishing or sold-item synchronization. eBay requires a separate OAuth + Inventory/Offer API integration and seller setup. Depop requires approved integration access; Mercari does not offer a generally available public seller listing API. Do not mark manual statuses as proof of publication.
- AI analysis requires an external AI API account and can incur charges. The app itself is free.

## Deploy with only an iPhone
1. Download and unzip this folder using Files.
2. Create a free GitHub account. In Safari, create a new public repository (for example `quicklist-personal`). **Do not upload secrets, personal inventory or photos.**
3. Upload `index.html`, `manifest.webmanifest`, `icon.svg`, and `sw.js` to the repository root using GitHub's Add file > Upload files. (Safari's Request Desktop Website may help.) Do not upload `worker.js` to the public site as a configured secret; the example file contains no secret.
4. Open repository Settings > Pages, select Deploy from a branch, branch `main`, folder `/ (root)`, Save. Wait for the published `https://USERNAME.github.io/quicklist-personal/` URL. GitHub Pages availability and menus may change.
5. Open the URL in Safari, tap Share > Add to Home Screen > Add.
6. Test saving an item and closing/reopening the app. Browser storage is device-local and can be cleared; export metadata regularly.

## Optional real AI connection (advanced; may cost money)
1. Create an OpenAI API account and set a usage budget. ChatGPT subscriptions do not include API usage.
2. Create a Cloudflare Worker by pasting `worker.js` into the online editor. In Worker settings add secrets `OPENAI_API_KEY` (your provider key) and `APP_TOKEN` (a long random private access token). Add `ALLOWED_ORIGIN` as the exact origin, such as `https://USERNAME.github.io` (no path).
3. Deploy the Worker. In QuickList Settings, enter the Worker HTTPS URL and the **APP_TOKEN**, not the OpenAI API key.
4. Tap Analyze photos with AI. Review the draft, especially condition, size, and authenticity.

Security note: the Worker example is for a single-user prototype. A shared bearer token stored in browser localStorage can be exposed if the device or page is compromised. The Worker does not include rate limiting or user authentication beyond the token; add Cloudflare rate limits and/or stronger authentication before relying on it. Avoid sharing the token. Do not publish your OpenAI API key in GitHub or frontend code. Cross-origin checks are not authentication.

## Backup limitations
The JSON export omits photos. Browser IndexedDB may be evicted. Keep original photos in your iPhone Photos library and do not rely on QuickList as your sole inventory record.

## Sold-item workflow (new in this version)
- Open **Sales & Alerts** to see the integration status and try a clearly labeled **simulation**. Simulations do not update real inventory or contact marketplaces.
- `sold-sync.js` contains a testable `processConfirmedSale` engine for future server-side use. It rejects unverified events, tracks duplicate event IDs, handles missing listing IDs and unavailable adapters, and only marks a listing delisted when its adapter confirms success.
- **Not live:** no marketplace OAuth, sale webhooks/polling, server-side database, scheduled jobs, push notifications or actual delisting adapters are included. Do not put seller access tokens in browser code.
- To activate later, deploy a trusted backend with authorized marketplace integrations, durable event deduplication, and reliable notifications. Depop/Mercari may not offer the access required.
