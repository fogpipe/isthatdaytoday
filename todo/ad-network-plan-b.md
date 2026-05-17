# plan b: ezoic if adsense rejects

If Google AdSense rejects the site (likely reason: "low value content" on the minimal one-page layout), switch to **Ezoic** before trying anything else.

Why Ezoic over the alternatives:
- No traffic minimum (Mediavine needs 50k/mo, Raptive 100k/mo)
- No upfront fee (Monumetric charges $99 setup)
- Higher RPMs than AdSense once they optimize
- More lenient on thin/novelty content than AdSense

Setup notes when the time comes:
- Sign up at ezoic.com, add the site, verify ownership via DNS or nameserver change
- Remove the AdSense `<script>` tag and `<ins>` element from `public/index.html`
- Remove `public/ads.txt` (Ezoic provides its own)
- Ezoic injects ads automatically via their script — no per-slot markup needed
- They use nameserver integration by default; the Cloudflare-only "Ezoic Leap" or script-only integration is the alternative if we don't want to hand over DNS

Fallbacks if Ezoic also rejects:
- Media.net (Yahoo/Bing contextual ads)
- Ethical Ads (cookieless, low CPM, dev-leaning inventory)
- Affiliate links per named-day page (e.g. `/pizza` → Amazon pizza stone)
- Skip ads entirely, add a Ko-fi / "buy me a coffee" button
