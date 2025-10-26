# Schema Validator - Public Frontend

This is the public frontend for the Schema Validator tool. It provides a web interface for managing Swagger/OpenAPI endpoints and triggering schema validation.

## Features

- 📋 Add and manage Swagger/OpenAPI endpoints
- 🔍 Test endpoint connectivity
- ✅ Validate API schemas
- 🔄 Update schema snapshots
- 💾 Import/Export configurations
- 🧹 Clean up orphaned schema files
- 🌐 Demo mode with sample data


### Deploy to Vercel

1. Push this folder to a GitHub repository
2. Connect your repository to Vercel
3. Set the environment variable `VITE_API_URL` to your backend URL
4. Deploy

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Set the environment variable `VITE_API_URL` to your backend URL


## Demo Mode

When the backend is not available, the frontend will operate in demo mode with:
- Sample endpoint data
- Local-only configuration storage
- Warning messages for unavailable features

## Architecture

This frontend is designed to be deployed separately from the backend, allowing for:
- Public frontend deployment (GitHub Pages, Netlify, Vercel)
- Private backend deployment (with API authentication)
- CORS configuration for cross-origin requests
