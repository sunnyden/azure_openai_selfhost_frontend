# OpenAI Self-Host Desktop App

This is an Electron-based desktop application that loads the OpenAI Self-Host frontend. It can run in development mode (loading from localhost:3000) or production mode (loading from https://chat.hq.gd).

## Features

- Native desktop application using Electron
- TypeScript support
- Automatic development server management
- Secure web content loading
- Cross-platform support (Windows, macOS, Linux)
- Custom menu bar
- External link handling
- Development/production mode detection

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

### Running the Application

#### Development Mode
To run in development mode (automatically starts React dev server and loads from localhost:3000):
```bash
npm run dev
```

This will:
- Build the TypeScript files
- Start Electron in development mode
- Automatically start the React development server (if not already running)
- Load the app from `http://localhost:3000`
- Open DevTools automatically

#### Production Mode
To run in production mode (loads from remote URL):
```bash
npm run start
```

This loads the app from `https://chat.hq.gd`.

### Building for Production

To build the application for distribution:

```bash
npm run dist
```

This will create distributable packages in the `dist-electron` directory.

## File Structure

```
desktop-app/
├── src/
│   ├── main.ts          # Main Electron process with dev server management
│   ├── preload.ts       # Preload script for security
│   └── renderer.ts      # Renderer process utilities
├── assets/              # Application icons and resources
├── dist/                # Compiled TypeScript output
├── package.json         # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Development vs Production

The application automatically detects the environment:

- **Development**: `NODE_ENV=development` or `ELECTRON_DEV=true`
  - Loads from `http://localhost:3000`
  - Automatically starts React dev server if needed
  - Opens DevTools
  - Includes hot reloading

- **Production**: Default mode
  - Loads from `https://chat.hq.gd`
  - No DevTools
  - Optimized for distribution

## Security

The application follows Electron security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Remote module disabled
- External links open in default browser
- Content Security Policy enforced

## Icons

Place application icons in the `assets/` directory:
- `icon.ico` for Windows
- `icon.icns` for macOS
- `icon.png` for Linux (512x512 recommended)
