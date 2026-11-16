# Vercel deployment

Deploy the frontend folder as a Vite project. vercel.json includes the SPA fallback so refreshing React routes works.

Run from frontend:

    vercel login
    vercel --prod

Set Vercel environment variables to the four deployed HTTPS backend URLs:

- VITE_USER_URL
- VITE_VET_URL
- VITE_PHARMACY_URL
- VITE_MILK_URL

Redeploy after setting them because Vite embeds these values at build time.

The Java Spring Boot applications and MySQL require a separate backend host. A frontend-only deployment does not provide working login or database operations. Without the above variables, this project's development defaults point to localhost.

Before connecting the deployed APIs, configure their CORS policy to allow the exact deployed frontend origin. All four backend services must share secure AUTH_SECRET and SERVICE_KEY values, use HTTPS, and have their database and internal REST URLs configured. Remove demonstration account seeding before a public deployment using real data.
