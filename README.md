# Car Reservation System

A modern, full-featured car reservation management system built with React, TypeScript, and Firebase. This application provides role-based access control for administrators and teachers, enabling efficient fleet management and reservation handling.

## 🚀 Features

### Core Functionality

- **Role-Based Authentication**: Secure login system with admin/teacher roles
- **Fleet Management**: Complete car inventory management with status tracking
- **Reservation System**: Advanced booking system with conflict detection and multiple status states
- **Real-time Updates**: Live data synchronization via Firebase Firestore
- **Multi-language Support**: English and Thai internationalization with i18next
- **Responsive Design**: Mobile-first design that works on all devices
- **Analytics Dashboard**: Comprehensive insights and reporting with interactive charts
- **PWA Support**: Installable progressive web app with offline capabilities

### Advanced Features

- **Conflict Resolution**: Automatic detection and handling of booking conflicts
- **Status Management**: Dynamic car availability tracking (available, maintenance, out_of_service)
- **User Suspension**: Administrative control over user access and permissions
- **Configurable Settings**: System-wide settings management with real-time updates
- **Bulk Operations**: Batch actions for efficient data management
- **Email Verification**: Secure email verification system with Firebase Auth
- **FAQ System**: Dynamic FAQ management with markdown support
- **Dark Mode**: Theme switching with system preference detection
- **Search & Filtering**: Advanced search capabilities across all data entities
- **Optimistic Updates**: Improved UX with optimistic UI updates

## 🏗️ Architecture Overview

### Technology Stack

**Frontend Framework**

- React 19 with TypeScript for type safety and modern development
- Vite for fast development and optimized builds
- React Router v7 for client-side routing

**State Management**

- TanStack Query for server state management and caching
- React Context for global application state
- React Hook Form with Zod validation for form handling

**UI Components**

- Radix UI primitives for accessible, unstyled components
- Tailwind CSS v4 for utility-first styling
- Lucide React for consistent iconography
- Custom component library built on top of Radix UI

**Backend Services**

- Firebase Authentication for secure user management
- Firestore for real-time database operations
- Firebase Hosting for static site deployment
- Firebase Security Rules for data protection

**Development Tools**

- TypeScript for enhanced development experience
- ESLint for code quality and consistency
- Vite PWA Plugin for progressive web app features
- Firebase Tools for deployment and management

### Project Structure

```
car-reservation/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx      # Button component
│   │   │   ├── input.tsx       # Input component
│   │   │   ├── table.tsx       # Table component
│   │   │   ├── dialog.tsx      # Dialog component
│   │   │   └── ...            # Other UI primitives
│   │   ├── auth/              # Authentication components
│   │   │   ├── EmailVerification.tsx
│   │   │   ├── PasswordReset.tsx
│   │   │   └── EmailChange.tsx
│   │   ├── cars/              # Car-specific components
│   │   │   ├── cars-table.tsx # Car data table
│   │   │   ├── car-form-dialog.tsx
│   │   │   └── car-info-card.tsx
│   │   ├── reservations/      # Reservation components
│   │   │   ├── reservations-table.tsx
│   │   │   ├── reservation-form-dialog.tsx
│   │   │   └── reservation-details-card.tsx
│   │   ├── dashboard/         # Analytics components
│   │   │   ├── fleet-status-chart.tsx
│   │   │   └── reservations-chart.tsx
│   │   ├── users/             # User management components
│   │   │   ├── users-table.tsx
│   │   │   ├── user-form-dialog.tsx
│   │   │   └── user-info-card.tsx
│   │   ├── admin/             # Admin-specific components
│   │   │   ├── allowed-emails-table.tsx
│   │   │   └── add-email-dialog.tsx
│   │   ├── app-sidebar.tsx    # Main navigation sidebar
│   │   ├── language-switcher.tsx
│   │   ├── theme-toggle.tsx
│   │   └── install-app.tsx    # PWA install prompt
│   ├── contexts/              # React context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   ├── SettingsContext.tsx # App settings
│   │   ├── PWAContext.tsx     # PWA functionality
│   │   └── ThemeContext.tsx   # Theme management
│   ├── hooks/                 # Custom React hooks
│   │   ├── useDebounced.ts    # Debounced search
│   │   ├── useOptimizedSearch.ts # Optimized search
│   │   └── use-mobile.ts      # Mobile detection
│   ├── i18n/                  # Internationalization
│   │   ├── index.ts          # i18next configuration
│   │   └── locales/          # Translation files
│   │       ├── en.json       # English translations
│   │       └── th.json       # Thai translations
│   ├── layouts/               # Layout components
│   │   ├── Protected.tsx     # Protected route wrapper
│   │   ├── Sidebar.tsx       # Sidebar layout
│   │   └── Onboarding.tsx    # Onboarding flow
│   ├── lib/                   # Service layer and utilities
│   │   ├── firebase.ts       # Firebase configuration
│   │   ├── cars-service.ts   # Car CRUD operations
│   │   ├── reservations-service.ts # Reservation management
│   │   ├── users-service.ts  # User operations
│   │   ├── user-management-service.ts # User admin
│   │   ├── dashboard-service.ts # Analytics
│   │   ├── profile-service.ts # Profile management
│   │   ├── allowed-emails-service.ts # Email management
│   │   ├── settings-service.ts # Settings management
│   │   ├── query-config.ts   # TanStack Query config
│   │   ├── query-utils.ts    # Query utilities
│   │   ├── search-utils.ts   # Search utilities
│   │   ├── batch-utils.ts    # Batch operations
│   │   ├── date-locale.ts    # Date formatting
│   │   ├── sidebar-config.ts # Navigation config
│   │   └── utils.ts          # General utilities
│   ├── pages/                 # Page components
│   │   ├── Admin/            # Administrator pages
│   │   │   ├── index.tsx     # Admin dashboard
│   │   │   ├── Fleet/        # Fleet management
│   │   │   │   ├── index.tsx # Fleet overview
│   │   │   │   └── Car.tsx   # Individual car details
│   │   │   ├── Reservations/ # Reservation management
│   │   │   │   ├── index.tsx # Reservations overview
│   │   │   │   └── Reservation.tsx # Individual reservation
│   │   │   ├── Users/        # User administration
│   │   │   │   ├── index.tsx # Users overview
│   │   │   │   ├── User.tsx  # Individual user
│   │   │   │   └── AllowedEmails.tsx # Email management
│   │   │   ├── Settings.tsx  # System settings
│   │   │   └── Faq.tsx      # FAQ management
│   │   ├── App/             # User application pages
│   │   │   ├── index.tsx    # User dashboard
│   │   │   ├── Fleet.tsx    # Car browsing
│   │   │   ├── Reservations/ # User reservations
│   │   │   │   ├── index.tsx # Reservations list
│   │   │   │   └── Reservation.tsx # Reservation details
│   │   │   └── Faq.tsx      # User FAQ
│   │   ├── Auth/            # Authentication pages
│   │   │   ├── Login.tsx    # Login page
│   │   │   ├── Register.tsx # Registration
│   │   │   ├── Forgot.tsx   # Password reset
│   │   │   └── Action.tsx   # Email actions
│   │   ├── Profile.tsx      # User profile
│   │   ├── Faq.tsx         # General FAQ
│   │   ├── NotFound.tsx    # 404 page
│   │   ├── Error.tsx       # Error page
│   │   └── Onboarding.tsx  # Onboarding flow
│   ├── types/               # TypeScript definitions
│   │   ├── car.ts          # Car types
│   │   ├── reservation.ts  # Reservation types
│   │   └── user.ts         # User types
│   ├── faq/                # FAQ markdown files
│   │   ├── admin/          # Admin FAQ
│   │   │   ├── en.md       # English admin FAQ
│   │   │   └── th.md       # Thai admin FAQ
│   │   └── app/            # User FAQ
│   │       ├── en.md       # English user FAQ
│   │       └── th.md       # Thai user FAQ
│   ├── App.tsx             # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── icon_x192.png      # PWA icons
│   ├── icon_x512.png
│   ├── monochrome.svg
│   ├── robots.txt
│   └── assets/            # Additional assets
│       └── FastCheapGood.webp
├── firebase.json          # Firebase project configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore database indexes
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── components.json       # shadcn/ui configuration
├── eslint.config.js      # ESLint configuration
├── CLAUDE.md            # Claude Code instructions
└── package.json         # Dependencies and scripts
```

## 🛠️ Development Setup

### Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Firebase CLI** - Install with `npm install -g firebase-tools`

### Installation Steps

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd car-reservation
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

   This will install all required packages including React, TypeScript, Firebase, and development tools.

3. **Firebase Project Setup**

   **Create a new Firebase project:**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Choose a unique project ID (e.g., `car-reservation-prod`)

   ```bash
    firebase projects:create
    firebase use <project-id>
    firebase init
    firebase apps:create web <app-name>
    firebase apps:sdkconfig web --out ./firebase-config.json
   ```

   **Enable required Firebase services:**

   - **Authentication**: Go to Authentication → Sign-in method → Enable Email/Password
   - **Firestore**: Go to Firestore Database → Create database → Start in test mode
   - **Hosting**: Go to Hosting → Get started (optional for deployment)

   **Get your Firebase configuration:**

   - Go to Project Settings → General → Your apps
   - Click "Add app" → Web app → Register app
   - Copy the Firebase config object

4. **Environment Configuration**

   Create a `.env` file in the root directory:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Initialize Firebase in Your Project**

   ```bash
   firebase login
   firebase init
   ```

   - Select Firestore and Hosting
   - Choose your Firebase project
   - Accept default settings for Firestore
   - Set `dist` as your hosting directory
   - Configure as single-page app: Yes

6. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Available Scripts

**Development**

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

**Firebase Deployment**

- `npm run deploy` - Deploy everything to Firebase
- `npm run deploy:hosting` - Deploy only hosting
- `npm run deploy:rules` - Deploy only Firestore rules
- `npm run deploy:indexes` - Deploy only Firestore indexes

**Firebase Setup**

- `npm run init` - Initialize Firebase project

**Development Notes**

- TypeScript compilation is run before build (`tsc -b`)
- ESLint is configured with modern rules
- Vite provides fast development server with HMR
- Firebase CLI tools are included for deployment

## 🔐 Firebase Configuration

### Authentication Setup

The application uses Firebase Authentication with email/password sign-in. To set up authentication:

1. **Enable Email/Password Authentication**

   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password" provider
   - Optionally enable "Email link (passwordless sign-in)"

2. **Configure Email Templates**

   - Go to Authentication → Templates
   - Customize email templates for:
     - Email verification
     - Password reset
     - Email address change
   - Set the url to `https://your-production-domain.com/auth/action` for email actions

3. **Set Up Authorized Domains**
   - Add your production domain to authorized domains
   - localhost is automatically included for development

### Firestore Database Structure

The application uses the following Firestore collections:

**Users Collection (`users`)**

```typescript
{
  id: string; // Document ID (matches Firebase Auth UID)
  name: string; // User's full name
  email: string; // User's email address
  phone: string; // Phone number
  role: "admin" | "teacher"; // User role
  language: "en" | "th"; // Preferred language
  suspended: boolean; // Account suspension status
  createdAt: Timestamp; // Account creation date
  updatedAt: Timestamp; // Last profile update
}
```

**Cars Collection (`cars`)**

```typescript
{
  id: string;           // Document ID
  licensePlate: string; // Unique license plate
  model: string;        // Car model
  color: string;        // Car color
  seats: number;        // Number of seats
  year?: number;        // Manufacturing year
  status: 'available' | 'maintenance' | 'out_of_service';
  description?: string; // Additional notes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Reservations Collection (`reservations`)**

```typescript
{
  id: string;           // Document ID
  userId: string;       // Reference to user
  carId: string;        // Reference to car
  startDate: string;    // Reservation start date (ISO string)
  endDate: string;      // Reservation end date (ISO string)
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancellation_pending' | 'rejected';
  purpose?: string;     // Reservation purpose
  notes?: string;       // Additional notes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Settings Collection (`settings`)**

```typescript
{
  id: string; // Document ID
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  defaultLanguage: "en" | "th";
  maxReservationDays: number;
  advanceBookingDays: number;
  maxConcurrentReservations: number;
  requireApproval: boolean;
  allowWeekendReservations: boolean;
  // ... other configurable settings
}
```

**Allowed Emails Collection (`allowedEmails`)**

```typescript
{
  id: string; // Document ID
  email: string; // Allowed email address
  used: boolean; // Whether email has been used for registration
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Security Rules

The application includes comprehensive Firestore security rules in `firestore.rules`:

```javascript
// Users can read their own profile, admins can read/write all
match /users/{userId} {
  allow read, write: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
}

// Cars are readable by authenticated users, writable by admins
match /cars/{carId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && isAdmin();
}

// Reservations are readable by authenticated users,
// writable by admins, creatable by authenticated users
match /reservations/{reservationId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == resource.data.userId;
  allow update, delete: if request.auth != null && isAdmin();
}
```

## 👥 User Roles and Permissions

### Administrator Role

Administrators have full access to all system features:

**Fleet Management**

- Add, edit, and delete vehicles
- Update car status (available, maintenance, out of service)
- View comprehensive fleet analytics
- Manage car maintenance schedules

**Reservation Management**

- View all system reservations
- Approve or reject reservation requests
- Approve or reject cancelation requests
- Cancel reservations
- Handle reservation conflicts
- Generate reservation reports

**User Administration**

- Add allowed emails for registration
- Assign and modify user roles
- Suspend or reactivate user accounts
- View user activity and statistics
- Manage user profiles

**System Settings**

- Configure company information
- Set reservation policies and limits
- Manage system-wide settings

### Teacher Role

Teachers have focused access to reservation-related features:

**Car Browsing**

- View available cars
- See detailed car information and specifications
- Check car availability for specific dates

**Reservation Management**

- Create new reservations
- View personal reservation history
- Cancel future reservations

**Profile Management**

- Update personal information
- Change password and contact details
- Set language preferences
- Configure notification settings

## 🌐 Internationalization

The application supports multiple languages using i18next:

### Supported Languages

- **English (en)** - Default language
- **Thai (th)** - Secondary language

### Translation Files

- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/th.json` - Thai translations

### Adding New Languages

1. **Create translation file:**

   ```bash
   # Create new language file
   touch src/i18n/locales/es.json
   ```

2. **Add translations:**

   ```json
   {
     "common": {
       "save": "Guardar",
       "cancel": "Cancelar",
       "delete": "Eliminar"
     },
     "navigation": {
       "dashboard": "Panel de control",
       "cars": "Vehículos",
       "reservations": "Reservas"
     }
   }
   ```

3. **Update i18n configuration:**

   ```typescript
   // src/i18n/index.ts
   import es from "./locales/es.json";

   i18n.addResourceBundle("es", "translation", es);
   ```

## 🚀 Deployment

### Firebase Hosting Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**

   ```bash
   npm run deploy
   ```

3. **Deploy specific components:**

   ```bash
   # Deploy only hosting
   npm run deploy:hosting

   # Deploy only Firestore rules
   npm run deploy:rules

   # Deploy only Firestore indexes
   npm run deploy:indexes
   ```

### Production Environment Variables

For production deployment, set these environment variables:

```env
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_production_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_production_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_production_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
VITE_FIREBASE_APP_ID=your_production_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_production_measurement_id
```

### CI/CD Pipeline

For automated deployment, you can set up GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          projectId: your-project-id
```

## 🔧 Development Guidelines

### Code Structure

**Components Organization**

- Keep components focused and single-purpose
- Use TypeScript interfaces for all props
- Implement proper error boundaries
- Follow React best practices for hooks
- Use shadcn/ui components for consistency
- Organize components by feature/domain

**State Management**

- Use TanStack Query for server state management
- Use React Context for global UI state
- Implement proper loading and error states
- Cache frequently accessed data with proper invalidation
- Use optimistic updates for better UX

**Styling Guidelines**

- Use Tailwind CSS v4 utility classes
- Follow the design system established by shadcn/ui
- Create reusable component variants with CVA
- Maintain consistent spacing and typography
- Implement responsive design patterns
- Use CSS variables for theme support

**Form Handling**

- Use React Hook Form with Zod validation
- Implement proper error handling and display
- Use controlled components for complex forms
- Validate on both client and server side

### Architecture Patterns

**Service Layer Pattern**

- All Firebase operations go through service files
- Services return properly typed data
- Handle errors consistently across services
- Use dependency injection for testability

**Query Management**

- Use TanStack Query for all server state
- Implement proper cache invalidation strategies
- Use query keys consistently across the app
- Handle loading and error states uniformly

**Component Composition**

- Use composition over inheritance
- Create reusable compound components
- Implement proper prop drilling alternatives
- Use render props and custom hooks

### Testing Strategy

**Unit Testing**

- Test utility functions thoroughly
- Test complex component logic
- Mock Firebase services for testing
- Use React Testing Library for component tests
- Test custom hooks in isolation

**Integration Testing**

- Test user workflows end-to-end
- Test Firebase integration points
- Verify role-based access control
- Test form validation and submission
- Test error scenarios and recovery

**E2E Testing**

- Test critical user paths
- Test authentication flows
- Test reservation workflows
- Test admin operations

### Performance Optimization

**Code Splitting**

- Implement route-based code splitting
- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize bundle size with tree shaking
- Use dynamic imports for large libraries

**Data Optimization**

- Implement pagination for large datasets
- Use Firestore query optimization
- Cache frequently accessed data
- Implement proper loading states
- Use debounced search for better performance
- Optimize images and assets

**Memory Management**

- Clean up subscriptions and timers
- Use proper dependency arrays in hooks
- Avoid memory leaks in long-running operations
- Monitor bundle size regularly

### Security Best Practices

**Authentication & Authorization**

- Validate user roles on every request
- Use Firebase Security Rules properly
- Implement proper session management
- Handle token refresh gracefully

**Data Validation**

- Validate all input on client and server
- Use Zod schemas for runtime validation
- Sanitize user input properly
- Implement proper error handling

**Firestore Security**

- Use least privilege principle
- Implement proper security rules
- Validate data structure in rules
- Test security rules thoroughly

## 📊 Monitoring and Analytics

### Error Tracking

The application includes comprehensive error handling:

- **Client-side error boundaries** for graceful error recovery
- **Firebase error handling** with user-friendly messages
- **Form validation errors** with clear feedback
- **Network error handling** with retry mechanisms
- **TanStack Query error handling** with proper error states
- **Toast notifications** for user feedback using Sonner

### Performance Monitoring

Monitor application performance with:

- **Firebase Performance Monitoring** for real-time metrics
- **Lighthouse audits** for performance optimization
- **Bundle analysis** for size optimization
- **User experience metrics** for usability insights
- **TanStack Query DevTools** for debugging
- **React DevTools** for component performance

### Analytics Dashboard

The application includes built-in analytics:

- **Fleet status charts** showing car availability
- **Reservation trends** with interactive charts using Recharts
- **User activity metrics** and engagement data
- **System usage statistics** for administrative insights
- **Real-time dashboard updates** with live data

### Logging and Debugging

- **Structured logging** for better debugging
- **Development mode logging** with detailed information
- **Production error logging** with essential information
- **Query debugging** with TanStack Query DevTools
- **Firebase emulator** for local development and testing

## 🤝 Contributing

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Install dependencies** and set up development environment
3. **Make changes** following the code style guidelines
4. **Test thoroughly** including unit and integration tests
5. **Submit a pull request** with detailed description

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Include comprehensive JSDoc comments
- Maintain consistent formatting with Prettier
- Follow React and Firebase conventions

### Pull Request Process

1. **Ensure all tests pass** and code builds successfully
2. **Update documentation** for any new features
3. **Include screenshots** for UI changes
4. **Request code review** from maintainers
5. **Address feedback** and make necessary changes

## 📚 Additional Resources

### Documentation

- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

### Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Router Documentation](https://reactrouter.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [i18next Documentation](https://www.i18next.com/)

## 📄 License

Copyright © 2025 Oscar R.C. All rights reserved.

This project is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

## 🆘 Support

For questions, issues, or feature requests:

1. **Check existing issues** in the repository
2. **Create a new issue** with detailed description
3. **Contact the development team** for urgent matters
4. **Review documentation** for common questions

---

**Built with ❤️ using React, TypeScript, and Firebase**
