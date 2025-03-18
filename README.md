This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AI-Assisted Description Generation

This project uses the Groq API to generate professional bullet points for experience and project descriptions. To set up the Groq integration:

1. Sign up for a Groq account at [console.groq.com](https://console.groq.com)
2. Create an API key in the Groq console
3. Add your API key to the `.env.local` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

### How It Works

The integration securely calls the Groq API from a Next.js API route, ensuring your API key is kept safe on the server. The implementation:

1. Creates a server-side API endpoint (`/api/generate-description`) that handles Groq API calls
2. Provides a client-side service that communicates with this endpoint
3. Includes fallback mock generation for development or if the API is unavailable

The integration allows users to automatically generate professional bullet-point descriptions for:
- Work experiences based on position and company
- Projects based on title and technologies used

This speeds up the resume creation process and ensures consistent, professional-sounding descriptions.
