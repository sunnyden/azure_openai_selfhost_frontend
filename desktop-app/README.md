# OpenAI Self-Host Desktop App

This is an Electron-based desktop application that loads https://chat.hq.gd as a native desktop app.

## Features

- Native desktop application using Electron
- TypeScript support
- Secure web content loading
- Cross-platform support (Windows, macOS, Linux)
- Custom menu bar
- External link handling

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

3. Run in development mode:
```bash
npm run dev
```

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
│   ├── main.ts          # Main Electron process
│   ├── preload.ts       # Preload script for security
│   └── renderer.ts      # Renderer process utilities
├── assets/              # Application icons and resources
├── dist/                # Compiled TypeScript output
├── package.json         # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

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
