# Car Reservation System

A modern, full-featured car reservation management system built with React, TypeScript, and Firebase. This application provides role-based access control for administrators and teachers, enabling efficient fleet management and reservation handling.

## 🚀 Features

### Core Functionality

- **Role-Based Authentication**: Secure login system with admin/teacher roles
- **Fleet Management**: Complete car inventory management with status tracking
- **Reservation System**: Advanced booking system with conflict detection
- **Real-time Updates**: Live data synchronization via Firebase Firestore
- **Multi-language Support**: English and Thai internationalization
- **Responsive Design**: Mobile-first design that works on all devices
- **Analytics Dashboard**: Comprehensive insights and reporting

### Advanced Features

- **Conflict Resolution**: Automatic detection and handling of booking conflicts
- **Status Management**: Dynamic car availability tracking
- **User Suspension**: Administrative control over user access
- **Configurable Settings**: System-wide settings management
- **Export Functionality**: Data export for reporting and analysis
- **Progressive Web App**: Installable app experience

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
│   │   ├── ui/                 # Base UI components (Button, Input, etc.)
│   │   ├── cars/               # Car-specific components
│   │   ├── reservations/       # Reservation management components
│   │   ├── dashboard/          # Analytics and dashboard components
│   │   └── users/              # User management components
│   ├── contexts/               # React context providers
│   │   ├── AuthContext.tsx     # Authentication state management
│   │   └── SettingsContext.tsx # Application settings
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Internationalization setup
│   │   ├── index.ts           # i18next configuration
│   │   └── locales/           # Translation files
│   │       ├── en.json        # English translations
│   │       └── th.json        # Thai translations
│   ├── layouts/                # Layout components
│   │   ├── AdminLayout.tsx    # Admin panel layout
│   │   └── AppLayout.tsx      # User application layout
│   ├── lib/                    # Service layer and utilities
│   │   ├── firebase.ts        # Firebase configuration and initialization
│   │   ├── cars-service.ts    # Car management operations
│   │   ├── reservations-service.ts # Reservation CRUD operations
│   │   ├── users-service.ts   # User management operations
│   │   ├── dashboard-service.ts # Analytics and reporting
│   │   └── utils.ts           # Helper functions
│   ├── pages/                  # Page components
│   │   ├── Admin/             # Administrator pages
│   │   │   ├── Dashboard.tsx  # Admin dashboard
│   │   │   ├── Fleet.tsx      # Fleet management
│   │   │   ├── Reservations.tsx # Reservation management
│   │   │   ├── Users.tsx      # User administration
│   │   │   └── Settings.tsx   # System settings
│   │   ├── App/               # User application pages
│   │   │   ├── index.tsx      # User dashboard
│   │   │   ├── Cars.tsx       # Car browsing
│   │   │   ├── Reservations.tsx # User reservations
│   │   │   └── Profile.tsx    # User profile
│   │   └── Auth/              # Authentication pages
│   │       ├── Login.tsx      # Login page
│   │       └── ForgotPassword.tsx # Password reset
│   ├── types/                  # TypeScript type definitions
│   │   ├── car.ts             # Car-related types
│   │   ├── reservation.ts     # Reservation types
│   │   ├── user.ts            # User profile types
│   │   └── settings.ts        # Settings types
│   ├── App.tsx                 # Main application component
│   └── main.tsx               # Application entry point
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # PWA icons
├── firebase.json              # Firebase project configuration
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore database indexes
├── tailwind.config.js        # Tailwind CSS configuration
├── vite.config.ts            # Vite build configuration
└── package.json              # Dependencies and scripts
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

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks
- `npm run deploy` - Deploy to Firebase Hosting
- `npm run deploy:hosting` - Deploy only hosting
- `npm run deploy:rules` - Deploy only Firestore rules
- `npm run deploy:indexes` - Deploy only Firestore indexes

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
  startDateTime: Timestamp;  // Reservation start
  endDateTime: Timestamp;    // Reservation end
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancellation_pending';
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
  // ... other configurable settings
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

**State Management**

- Use TanStack Query for server state
- Use React Context for global UI state
- Implement proper loading and error states
- Cache frequently accessed data

**Styling Guidelines**

- Use Tailwind CSS utility classes
- Create reusable component variants
- Maintain consistent spacing and typography
- Implement responsive design patterns

### Testing Strategy

**Unit Testing**

- Test utility functions thoroughly
- Test complex component logic
- Mock Firebase services for testing
- Use React Testing Library for component tests

**Integration Testing**

- Test user workflows end-to-end
- Test Firebase integration points
- Verify role-based access control
- Test form validation and submission

### Performance Optimization

**Code Splitting**

- Implement route-based code splitting
- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize bundle size with tree shaking

**Data Optimization**

- Implement pagination for large datasets
- Use Firestore query optimization
- Cache frequently accessed data
- Implement proper loading states

## 📊 Monitoring and Analytics

### Error Tracking

The application includes comprehensive error handling:

- **Client-side error boundaries** for graceful error recovery
- **Firebase error handling** with user-friendly messages
- **Form validation errors** with clear feedback
- **Network error handling** with retry mechanisms

### Performance Monitoring

Monitor application performance with:

- **Firebase Performance Monitoring** for real-time metrics
- **Lighthouse audits** for performance optimization
- **Bundle analysis** for size optimization
- **User experience metrics** for usability insights

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
