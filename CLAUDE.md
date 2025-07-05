# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based car reservation management system with role-based access control. The application serves two main user types:
- **Admins**: Manage cars, users, and reservations through the `/admin/*` routes
- **Teachers**: Browse available cars and make reservations through the `/app/*` routes

## Development Commands

```bash
# Start development server
npm run dev

# Build for production 
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview

# Deploy to Firebase
npm run deploy
```

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI with Tailwind CSS v4
- **Backend**: Firebase (Firestore, Auth, Hosting)
- **Internationalization**: i18next (English and Thai)

## Architecture

### Route Structure
- `/` - Login page (redirects to role-specific dashboard)
- `/admin/*` - Admin interface (requires admin role)
- `/app/*` - User interface (requires teacher role)
- `/profile` - User profile management

### Key Directories
- `src/components/` - Reusable UI components organized by feature
- `src/contexts/` - React contexts (AuthContext, SettingsContext)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Service layer for Firebase operations
- `src/pages/` - Page components organized by route structure
- `src/types/` - TypeScript type definitions

### Authentication & Authorization
- Firebase Auth with email/password authentication
- Role-based access control (admin/teacher)
- Protected routes using `<Protected>` component
- User profiles stored in Firestore `users` collection

### Data Models

**User Profile** (`src/types/user.ts`):
```typescript
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher';
  language?: 'en' | 'th';
  suspended: boolean;
}
```

**Car** (`src/types/car.ts`):
```typescript
interface Car {
  licensePlate: string;
  model: string;
  status: 'available' | 'maintenance' | 'out_of_service';
  seats: number;
  color: string;
  year?: number;
  description?: string;
}
```

**Reservation** (`src/types/reservation.ts`):
```typescript
interface Reservation {
  userId: string;
  carId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancellation_pending';
  // Additional fields for user/car data populated via joins
}
```

## Firebase Configuration

Environment variables required (in `.env.local`):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_RECAPTCHA_SITE_KEY=
```

## Service Layer

Services in `src/lib/` handle all Firebase operations:
- `cars-service.ts` - Car CRUD operations
- `reservations-service.ts` - Reservation management
- `user-management-service.ts` - User administration
- `profile-service.ts` - User profile management
- `dashboard-service.ts` - Dashboard analytics

## UI Components

The component library uses Radix UI primitives with custom styling:
- Base components in `src/components/ui/`
- Feature-specific components in `src/components/{feature}/`
- Consistent design system with Tailwind CSS

## Internationalization

- Configured in `src/i18n/index.ts`
- Translation files: `src/i18n/locales/en.json` and `src/i18n/locales/th.json`
- Language preference stored in user profile and synchronized with localStorage

## Development Notes

- All Firebase operations use TanStack Query for caching and state management
- Forms use React Hook Form with Zod validation schemas
- Component props are typed with TypeScript interfaces
- Path mapping configured for `@/` imports pointing to `src/`
- No test framework is currently configured in the project