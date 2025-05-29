# Snaplog - Image Management App

A React-based web application for managing and organizing images using Google Drive integration.

## Features

- Google Drive integration for image storage
- Image organization and categorization
- Date-based entry system
- Responsive design for both desktop and mobile
- PWA support for mobile installation

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Cloud Platform account with Drive API enabled

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/snaplog.git
cd snaplog
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Drive API:
   - Create a project in Google Cloud Console
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Download credentials and save as `src/services/credentials.json`

4. Start the development server:
```bash
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_GOOGLE_API_KEY=your_api_key
```

## Building for Production

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

- Never commit sensitive files like `credentials.json` or `token.json`
- Keep your API keys and client secrets secure
- Use environment variables for sensitive configuration

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── hooks/         # Custom React hooks
  ├── pages/         # Page components
  ├── services/      # API and service functions
  ├── types/         # TypeScript type definitions
  ├── App.tsx        # Main application component
  └── index.tsx      # Application entry point
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Browser Support

The application is built to work in modern browsers that support:
- ES6+ features
- IndexedDB
- Fetch API
- File API

## License

MIT 