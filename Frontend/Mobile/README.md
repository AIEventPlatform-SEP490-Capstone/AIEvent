# AIEvent Mobile App

React Native mobile application built with Expo SDK 54.

## 📱 Project Overview

AIEvent is a React Native mobile application that provides a clean, organized project structure for building scalable mobile apps. The project uses Expo SDK 54 with React Native 0.81.4 and React 19.1.0.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Expo Go app** on your mobile device - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd AIEvent-Frontend-Mobile
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   > Note: Using `--legacy-peer-deps` to resolve dependency conflicts

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Install **Expo Go** app on your phone
   - Scan the QR code displayed in your terminal
   - The app will load on your device

## 📁 Project Structure

```
├── src/
│   ├── api/                 # API calls and endpoints
│   ├── assets/              # Images, fonts, and static files
│   │   ├── fonts/
│   │   └── images/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components
│   │   └── presentation/    # UI-specific components
│   ├── constants/           # App constants (colors, strings, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── navigation/          # Navigation configuration
│   ├── redux/               # State management
│   │   ├── actions/
│   │   ├── constants/
│   │   ├── reducers/
│   │   └── store.js
│   ├── screens/             # App screens
│   │   ├── homeScreen/
│   │   └── aboutScreen/
│   ├── styles/              # Global styles
│   └── utility/             # Helper functions and utilities
├── android/                 # Android-specific files
├── ios/                     # iOS-specific files
├── App.js                   # Main app component
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler configuration
└── package.json             # Dependencies and scripts
```

## 🛠 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## 📱 Running on Different Platforms

### Mobile Device (Recommended)
1. Install **Expo Go** from App Store/Google Play
2. Run `npx expo start`
3. Scan QR code with Expo Go app

### Android Emulator
1. Set up Android Studio and emulator
2. Run `npx expo start --android`

### iOS Simulator (macOS only)
1. Install Xcode
2. Run `npx expo start --ios`

### Web Browser
1. Run `npx expo start --web`
2. Open browser to the displayed URL

## 🔧 Configuration

### Expo Configuration
The app is configured for Expo SDK 54. Key configuration files:
- `app.json` - Expo app configuration
- `babel.config.js` - Babel transpilation settings
- `metro.config.js` - Metro bundler configuration

### Dependencies
- **Expo SDK**: 54.0.0
- **React**: 19.1.0
- **React Native**: 0.81.4
- **Babel Preset**: babel-preset-expo ~54.0.0

## 🐛 Troubleshooting

### Common Issues

1. **"Project is incompatible with this version of Expo Go"**
   - Ensure you have Expo Go app compatible with SDK 54
   - Update Expo Go app to latest version

2. **"PlatformConstants could not be found"**
   - Clear cache: `npx expo start --clear`
   - Reinstall dependencies: `rm -rf node_modules && npm install --legacy-peer-deps`

3. **Metro bundler issues**
   - Reset cache: `npx expo start --clear --reset-cache`
   - Restart development server

4. **Dependency conflicts**
   - Use `--legacy-peer-deps` flag when installing
   - Ensure Node.js version is 18 or higher

### Cache Clearing
If you encounter issues, try clearing various caches:
```bash
# Clear Expo cache
npx expo start --clear

# Clear Metro cache
npx expo start --reset-cache

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 📚 Development Guidelines

### Code Organization
- Place reusable components in `src/components/`
- Keep screen-specific logic in `src/screens/`
- Store constants and configurations in `src/constants/`
- Use `src/utility/` for helper functions

### Styling
- Use StyleSheet.create() for component styles
- Store global styles in `src/styles/GlobalStyle.js`
- Follow React Native styling best practices

### State Management
- Redux setup is available in `src/redux/`
- Use actions, reducers, and store pattern
- Connect components using react-redux

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed description
4. Include error messages and steps to reproduce

---

**Happy coding! 🎉**