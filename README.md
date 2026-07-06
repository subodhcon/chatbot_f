# AI Chatbot SaaS Platform - Frontend

This is the frontend portion of the AI Chatbot SaaS Platform, built using **Next.js 15**, **TypeScript**, and **Tailwind CSS**.

## Folder Structure

Following a scalable enterprise SaaS architecture, the `src/` directory is organized as follows:

```
frontend/src/
├── app/               # Next.js App Router (pages, layouts, and API routing)
├── components/        # Reusable UI components (buttons, inputs, chatbots, etc.)
├── hooks/             # Custom React hooks (useAuth, useChat, etc.)
├── lib/               # Third-party service clients & configs (supabase, stripe, etc.)
├── services/          # API layer calling the backend (FastAPI) endpoints
├── store/             # Global state management (Zustand/Context)
├── types/             # TypeScript interfaces and types
└── utils/             # Helper and utility functions
```

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18.17.0+ recommended) and `npm`.

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To run the Next.js development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

To compile the production build:

```bash
npm run build
```

And to start the production server:

```bash
npm start
```

## Styling & Theme

- **Tailwind CSS**: Used for UI styling.
- **Theme configuration** can be adjusted in `tailwind.config.ts`.
