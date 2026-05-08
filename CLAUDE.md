# CLAUDE.md - iMesa (Tablet App)

This file provides guidance to Claude Code when working with code in this project.

## Overview

iMesa is a React Native (Expo) tablet application for in-restaurant digital menu ordering. It's designed to run on tablets placed at restaurant tables, allowing customers to browse the menu and place orders directly.

This app consumes the same API as the iMenu web app (itotem-back).

### Data-Driven Philosophy

iTotem is a data-driven platform inspired by Toast. Every meaningful user interaction (orders, waiter calls, payments) should be sent to the backend with proper context (table number, timestamps, device info) so it can be stored and analyzed later for business insights.

## Quick Commands

```bash
yarn start           # Start Expo dev server
yarn android         # Run on Android device/emulator
yarn ios             # Run on iOS simulator
yarn lint            # ESLint
yarn test            # Run tests
```

## Tech Stack

- **Framework:** React Native with Expo SDK 53
- **Language:** TypeScript (strict mode)
- **Navigation:** React Navigation (native-stack)
- **State Management:** Zustand (with persist middleware)
- **Server State:** TanStack React Query
- **HTTP Client:** Axios
- **Icons:** @expo/vector-icons

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/       # Buttons, inputs, cards, etc.
│   └── menu/         # Menu-specific components (ProductCard, CategoryList)
├── screens/          # Screen components
│   ├── MenuScreen.tsx
│   ├── ProductScreen.tsx
│   ├── CartScreen.tsx
│   └── CheckoutScreen.tsx
├── services/         # API layer (axios)
│   ├── api.ts        # Axios instance
│   └── menuService.ts
├── types/            # TypeScript interfaces
├── stores/           # Zustand stores
│   └── cartStore.ts
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
│   └── money.utils.ts
├── constants/        # App constants
└── theme/            # Colors, typography, spacing
```

## Key Conventions

### Language
- **Code:** English (variables, types, functions)
- **UI Text:** Portuguese (pt-BR)
- **Commits:** English, conventional commits format

### Currency
- Always stored as **cents** (integer)
- Use `formatMoney()` to display: `formatMoney(2590)` → "R$ 25,90"

### Naming Conventions
- Components: PascalCase (`ProductCard.tsx`)
- Hooks: camelCase with `use` prefix (`useMenu.ts`)
- Services: camelCase (`menuService.ts`)
- Constants: SNAKE_CASE

### Styling
- Use `StyleSheet.create()` for all styles
- Colors from `theme/colors.ts`
- Spacing from `theme/spacing.ts`
- Design optimized for **tablet landscape** (1024x768 minimum)

## API Integration

The app uses the same API as iMenu. Base URL is configured via environment variable:

```
EXPO_PUBLIC_API_URL=https://api.itotem.com.br
```

For development:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Public Endpoints Used
- `GET /public/menu/:companySlug` - Get menu catalog
- `GET /public/menu/:companySlug/products/:productId` - Get product details
- `POST /public/orders` - Create order

## Differences from iMenu (Web)

| iMenu (Delivery) | iMesa (Tablet) |
|------------------|----------------|
| Delivery address flow | Table/terminal identification |
| WhatsApp checkout | Direct order to kitchen |
| Mobile portrait | Tablet landscape |
| Customer auth optional | No customer auth |

## Testing on Devices

### Android Tablet
1. Install Expo Go from Play Store
2. Run `yarn start`
3. Scan QR code with Expo Go

### iOS (Development only)
1. Install Expo Go from App Store
2. Run `yarn start`
3. Scan QR code with Camera app

### Production Build
```bash
eas build --platform android --profile production
```

## Important Notes

- This app is designed for **kiosk mode** (fullscreen, no navigation)
- All colors should be dynamic based on company branding (`company.baseColor`)
- Touch targets should be minimum 48x48dp for tablet usability
- Support both portrait and landscape orientations
