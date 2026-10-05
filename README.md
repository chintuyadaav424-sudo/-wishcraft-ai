# WishCraft AI v2

A small AI birthday-wish web app with:
- OpenAI-powered generation through a server endpoint
- Razorpay ₹99 order creation
- Mobile-friendly frontend

## Run locally
1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env` and add your server-side keys.
4. `npm start`
5. Open `http://localhost:3000`

## Important
Never put OPENAI_API_KEY or RAZORPAY_KEY_SECRET inside `index.html` or any client-side JavaScript.
Use Razorpay test/sandbox credentials first, then switch to live credentials after your account is approved and the integration is tested.

## Production
Deploy the Node app on a server/host that supports environment variables. Add the same variables in the host dashboard.
