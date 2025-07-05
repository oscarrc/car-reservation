# Car Reservation System

A modern car reservation management system built with React, TypeScript, and Firebase. This application allows administrators to manage fleet vehicles and reservations, while teachers can browse and reserve cars.

## 🚀 Features

- **User Authentication**: Role-based access control (Admin/Teacher)
- **Fleet Management**: Add, edit, and manage vehicle fleet
- **Reservation System**: Create, manage, and track car reservations
- **Multi-language Support**: English and Thai languages
- **Real-time Updates**: Firebase Firestore integration
- **Responsive Design**: Works on desktop and mobile devices
- **Admin Dashboard**: Analytics and fleet status overview

## 🏗️ Project Structure

```
car-reservation/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, forms, etc.)
│   │   ├── cars/           # Car-related components
│   │   ├── reservations/   # Reservation-related components
│   │   ├── dashboard/      # Dashboard components
│   │   └── users/          # User management components
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Authentication context
│   │   └── SettingsContext.tsx # Settings context
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization
│   │   └── locales/        # Language files (en.json, th.json)
│   ├── layouts/            # Layout components
│   ├── lib/                # Utility functions and services
│   │   ├── firebase.ts     # Firebase configuration
│   │   ├── cars-service.ts # Car management service
│   │   ├── reservations-service.ts # Reservation service
│   │   └── users-service.ts # User management service
│   ├── pages/              # Page components
│   │   ├── Admin/          # Admin-only pages
│   │   ├── App/            # General app pages
│   │   └── Auth/           # Authentication pages
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
└── package.json           # Project dependencies
```

## 🛠️ Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd car-reservation
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Setup**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Get your Firebase configuration

4. **Environment Configuration**
   Create a `.env.local` file in the root directory:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to Firebase Hosting

## 🔧 Configuration

### Firebase Configuration

Update `src/lib/firebase.ts` with your Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};
```

### Firestore Security Rules

The project includes security rules in `firestore.rules`:

- **Cars**: Read access for authenticated users, write access for admins only
- **Reservations**: Read access for authenticated users, write access for admins, create access for all authenticated users
- **Users**: Read/write access for admins, users can read/write their own profile
- **Settings**: Read access for authenticated users, write access for admins only

### Settings Available

The application includes configurable settings managed through the admin panel:

- **Company Information**: Name, contact details
- **Reservation Policies**: Maximum reservation duration, advance booking limits
- **Fleet Settings**: Default car status, maintenance schedules
- **User Management**: Role assignments, suspension controls
- **Language Settings**: Default language, available languages

## 👥 User Roles & Usage

### Admin Users

Admins have full access to all features:

#### Fleet Management

- **Add New Cars**: Navigate to Admin → Fleet → Add Car
- **Edit Car Details**: Model, license plate, capacity, color, status
- **Manage Car Status**: Available, In Maintenance, Out of Service
- **View Fleet Analytics**: Dashboard shows fleet status distribution

#### Reservation Management

- **View All Reservations**: Admin → Reservations
- **Approve/Reject Reservations**: Change reservation status
- **Manage Conflicts**: Handle overlapping reservations
- **Generate Reports**: Export reservation data

#### User Management

- **Add Users**: Admin → Users → Add User
- **Manage Roles**: Assign admin/teacher roles
- **Suspend Users**: Temporarily disable user accounts
- **View User Activity**: Track user reservations and usage

#### Settings

- **System Configuration**: Admin → Settings
- **Update Company Info**: Name, contact details
- **Set Policies**: Reservation rules and limits
- **Manage Languages**: Default language settings

### Teacher Users

Teachers have limited access focused on reservations:

#### Browse Cars

- **View Available Cars**: Browse fleet with filters
- **Car Details**: View specifications, availability
- **Search & Filter**: Find cars by model, capacity, etc.

#### Make Reservations

- **Create Reservations**: Select car, date, and time
- **View My Reservations**: Track personal reservations
- **Cancel Reservations**: Cancel future reservations
- **Reservation History**: View past reservations

#### Profile Management

- **Update Profile**: Personal information, contact details
- **Language Preference**: Choose interface language
- **Notification Settings**: Email preferences

## 🚀 Deployment

### Firebase Hosting

1. **Install Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**

   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**

   ```bash
   firebase init
   ```

   - Select Hosting and Firestore
   - Choose your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes

4. **Build and Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

### Environment Variables for Production

Set the following environment variables in your hosting platform:

```env
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_production_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_production_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_production_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
VITE_FIREBASE_APP_ID=your_production_app_id
```

## � User Authentication Management

### Firebase Authentication Setup

#### Initial Setup in Firebase Console

1. **Enable Authentication**

   - Go to Firebase Console → Authentication
   - Click "Get Started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" provider

2. **Configure Email Settings**
   - Go to "Templates" tab
   - Customize email templates for:
     - Email verification
     - Password reset
     - Email address change

#### User Management

##### Creating Initial Admin User

1. **Through Firebase Console**

   - Go to Authentication → Users
   - Click "Add User"
   - Enter email and password
   - After creation, go to Firestore Database
   - Navigate to `users` collection
   - Create/edit the user document with admin role:

   ```json
   {
     "name": "Admin User",
     "email": "admin@company.com",
     "phone": "+1234567890",
     "role": "admin",
     "language": "en",
     "suspended": false,
     "createdAt": "2025-01-01T00:00:00Z",
     "updatedAt": "2025-01-01T00:00:00Z"
   }
   ```

2. **Through Application (Once you have admin access)**
   - Login as admin
   - Go to Admin → Users
   - Click "Add User"
   - Fill in user details and assign role

##### User Roles

The system supports two roles:

- **Admin**: Full access to all features

  - Fleet management
  - User management
  - Reservation management
  - System settings
  - Analytics dashboard

- **Teacher**: Limited access for reservations
  - View available cars
  - Create reservations
  - Manage own reservations
  - Update profile

##### User Status Management

**Suspending Users**

- Go to Admin → Users
- Find the user and click "Edit"
- Toggle the "Suspended" status
- Suspended users cannot login or access the system

**Reactivating Users**

- Go to Admin → Users
- Find the suspended user
- Edit and uncheck "Suspended"

#### Authentication Flow

##### Login Process

1. User enters email and password
2. Firebase Authentication validates credentials
3. Application fetches user profile from Firestore
4. User role determines available features
5. User is redirected to appropriate dashboard

##### Registration Process

- New users must be created by administrators
- No self-registration is allowed
- Admin creates user account with email and temporary password
- User receives email to set permanent password

#### Security Configuration

##### Authentication Rules

```javascript
// Firestore Security Rules for Authentication
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Only authenticated users can read
    match /{document=**} {
      allow read: if request.auth != null;
    }

    // Only non-suspended users can perform operations
    match /{document=**} {
      allow read, write: if request.auth != null &&
                          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.suspended != true;
    }
  }
}
```

##### Password Requirements

- Minimum 6 characters (Firebase default)
- For production, consider implementing stronger password policies
- Use Firebase Auth's password policy settings

#### Managing Authentication in Code

##### Authentication Context

The application uses React Context for authentication state management:

```typescript
// AuthContext.tsx
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  authUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  hasRole: (role: "admin" | "teacher") => boolean;
}
```

##### Role-Based Access Control

```typescript
// Checking user roles in components
const { hasRole } = useAuth();

if (hasRole("admin")) {
  // Show admin-only features
}

// Protecting routes
<Route
  path="/admin/*"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminLayout />
    </ProtectedRoute>
  }
/>;
```

#### Common Authentication Tasks

##### Password Reset

1. **Through Firebase Console**

   - Go to Authentication → Users
   - Find user and click "Reset Password"
   - User receives reset email

2. **Through Application**
   - User clicks "Forgot Password" on login page
   - Enters email address
   - Receives reset email from Firebase

##### Email Verification

1. **Enable Email Verification**

   - In Firebase Console → Authentication → Settings
   - Enable "Email verification"

2. **Send Verification Email**

   ```typescript
   import { sendEmailVerification } from "firebase/auth";

   await sendEmailVerification(user);
   ```

##### Update User Profile

```typescript
// Update user profile in Firestore
await updateDoc(doc(db, "users", userId), {
  name: newName,
  phone: newPhone,
  language: newLanguage,
  updatedAt: new Date(),
});
```

#### Monitoring Authentication

##### Firebase Console Analytics

1. **User Activity**

   - Go to Authentication → Users
   - View user sign-in activity
   - Monitor daily active users

2. **Authentication Logs**
   - Go to Authentication → Usage
   - View authentication events
   - Monitor failed login attempts

##### Setting Up Alerts

1. **Failed Login Monitoring**

   - Set up Cloud Monitoring alerts
   - Monitor for unusual login patterns
   - Configure notifications for multiple failed attempts

2. **User Growth Tracking**
   - Monitor new user registrations
   - Track user retention rates
   - Analyze authentication patterns

#### Troubleshooting Authentication

##### Common Issues

1. **User Can't Login**

   - Check if user exists in Authentication tab
   - Verify user is not suspended in Firestore
   - Check if email is verified (if required)
   - Verify password is correct

2. **User Has No Access**

   - Check user role in Firestore `users` collection
   - Verify user profile exists
   - Check if user is suspended

3. **Authentication Errors**
   - Check Firebase configuration
   - Verify API keys are correct
   - Check internet connectivity
   - Review browser console for errors

##### Testing Authentication

```typescript
// Test authentication flow
const testAuth = async () => {
  try {
    // Test login
    await signInWithEmailAndPassword(auth, "test@example.com", "password");

    // Test profile fetch
    const userDoc = await getDoc(doc(db, "users", user.uid));

    // Test role check
    const hasAdminRole = userDoc.data()?.role === "admin";

    console.log("Auth test passed:", { hasAdminRole });
  } catch (error) {
    console.error("Auth test failed:", error);
  }
};
```

#### Best Practices

1. **Security**

   - Never store sensitive data in client-side code
   - Use environment variables for configuration
   - Implement proper error handling
   - Log authentication events

2. **User Experience**

   - Provide clear error messages
   - Implement loading states
   - Show authentication status
   - Handle network errors gracefully

3. **Data Management**
   - Keep user profiles in sync with Firebase Auth
   - Implement proper data validation
   - Use transactions for critical updates
   - Backup user data regularly

## �🔥 Firestore Database Structure

### Collections

#### `cars`

```typescript
{
  id: string,
  model: string,
  licensePlate: string,
  year?: number,
  color: string,
  seats: number,
  status: 'available' | 'maintenance' | 'out_of_service',
  description?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `reservations`

```typescript
{
  id: string,
  carId: string,
  userId: string,
  startDate: Timestamp,
  endDate: Timestamp,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  purpose: string,
  notes?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `users`

```typescript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  role: 'admin' | 'teacher',
  language: 'en' | 'th',
  suspended: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `settings`

```typescript
{
  id: string,
  companyName: string,
  contactEmail: string,
  contactPhone: string,
  maxReservationDays: number,
  advanceBookingDays: number,
  defaultLanguage: 'en' | 'th',
  updatedAt: Timestamp
}
```

### Indexes

The project includes optimized indexes in `firestore.indexes.json`:

- **Reservations**: Compound indexes for efficient querying by user, car, and date ranges
- **Cars**: Index by status for fleet management
- **Users**: Index by role for user management queries

## 📊 Firebase Usage Monitoring

### Firebase Console Analytics

1. **Navigate to Firebase Console**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Firestore Usage**

   - Go to Firestore Database
   - Click on "Usage" tab
   - Monitor reads, writes, and deletes
   - Set up billing alerts

3. **Authentication Usage**

   - Go to Authentication
   - View daily active users
   - Monitor sign-in methods usage

4. **Hosting Usage**
   - Go to Hosting
   - View bandwidth and storage usage
   - Monitor deploy frequency

### Setting Up Usage Alerts

1. **Billing Alerts**

   - Go to Google Cloud Console
   - Navigate to Billing
   - Set up budget alerts
   - Configure notification thresholds

2. **Quota Monitoring**
   - Monitor Firestore quotas
   - Set up alerts for approaching limits
   - Plan for scaling needs

### Performance Monitoring

1. **Enable Performance Monitoring**

   ```bash
   firebase init performance
   ```

2. **View Performance Data**
   - Go to Firebase Console → Performance
   - Monitor page load times
   - Track user interactions
   - Identify performance bottlenecks

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Configuration**

   - Ensure environment variables are set correctly
   - Check Firebase project settings
   - Verify API keys are valid

2. **Firestore Rules**

   - Test rules in Firebase Console
   - Check user roles are set correctly
   - Verify authentication state

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all dependencies are installed

### Development Tips

- Use Firebase Local Emulator Suite for development
- Test Firestore rules locally before deploying
- Monitor console for errors and warnings
- Use React DevTools for debugging

## 📄 License

(c) 2025 Oscar R.C. All rights reserved.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

---
