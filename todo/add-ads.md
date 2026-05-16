# add ads to the site

Wire up Google AdSense in `public/index.html`.

- only render the ad on named-day pages (when `name` is set), not the empty home form
- place the ad unit below the `.answer` element, above where `.hint` would go
- keep it small so it doesn't dominate the minimal layout
- needs publisher id (`ca-pub-…`) and slot id from AdSense — get these before implementing

Alternative if AdSense approval is a blocker: affiliate links or EthicalAds (no approval required).
