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

## Deployment

### Environment Variables

Configure the backend API URL using environment variables:

- **Development**: `VITE_API_URL=http://localhost:3000/api`
- **Production**: `VITE_API_URL=https://your-backend-url.com/api`

### Deploy to Vercel

1. Push this folder to a GitHub repository
2. Connect your repository to Vercel
3. Set the environment variable `VITE_API_URL` to your backend URL
4. Deploy

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Set the environment variable `VITE_API_URL` to your backend URL

### Deploy to GitHub Pages

1. Build the project: `npm run build`
2. Copy the `dist` folder contents to your gh-pages branch
3. Configure your backend URL in the build step

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend Requirements

This frontend requires a compatible backend API with the following endpoints:

- `GET /api/config` - Get current configuration
- `POST /api/config` - Save configuration
- `DELETE /api/endpoints/:name` - Remove endpoint
- `POST /api/test-endpoint` - Test endpoint connectivity
- `POST /api/validate` - Run schema validation
- `POST /api/cleanup-schemas` - Clean up orphaned schemas

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
