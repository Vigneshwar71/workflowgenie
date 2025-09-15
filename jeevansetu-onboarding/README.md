JeevanSetu Onboarding Demo

Quick start

1) Serve locally

Option A: Python 3

    cd /workspace/jeevansetu-onboarding && python3 -m http.server 5173

Option B: Node

    cd /workspace/jeevansetu-onboarding && npx serve -l 5173 --single --no-clipboard --yes

2) Open in browser

    http://localhost:5173

Notes

- This is a static, client-side demo with simulated OTP, consent, notifications, TTS.
- Multilingual support: English (en), Hindi (hi), Malayalam (ml), Bengali (bn).
- For notifications, the browser may require localhost over http(s). A fallback banner is included.

