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
  role: "admin" | "teacher";
  language?: "en" | "th";
  suspended: boolean;
}
```

**Car** (`src/types/car.ts`):

```typescript
interface Car {
  licensePlate: string;
  model: string;
  status: "available" | "maintenance" | "out_of_service";
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
  status: "pending" | "confirmed" | "cancelled" | "cancellation_pending";
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

# **Implementation Steps for Registration & Email Verification System**

## **Phase 1: Database Schema & Types**

### **Step 1.1: Update User Types**

- Add `name` and `phone` fields to `UserProfile` type
- Make them nullable/optional initially
- Remove any existing `profileComplete` field if it exists

### **Step 1.2: Create Allowed Emails Types**

- Create `AllowedEmail` type with: `email`, `adminId`, `timestamp`
- Create `AllowedEmailsService` for CRUD operations

## **Phase 2: Remove Delete User Functionality**

### **Step 2.1: Remove Delete User Components**

- Remove delete buttons from user tables
- Remove delete confirmation dialogs
- Remove delete user service functions
- Update user table columns to remove delete actions

### **Step 2.2: Update User Management**

- Keep suspend/unsuspend functionality
- Update user status management
- Remove any delete-related translations

## **Phase 3: Admin Email Management**

### **Step 3.1: Create Allowed Emails Service**

- `addAllowedEmail(email: string, adminId: string)`
- `removeAllowedEmail(email: string)`
- `getAllowedEmails()`
- `isEmailAllowed(email: string)`
- `deleteEmailAfterRegistration(email: string)` - Remove from collection after successful registration

### **Step 3.2: Create Admin Interface Components**

- `AllowedEmailsPanel.tsx` - Main management component
- `AddEmailDialog.tsx` - Add single email
- `BulkEmailImport.tsx` - Import multiple emails
- `AllowedEmailsTable.tsx` - Display and manage emails

### **Step 3.3: Add to Admin Settings Page**

- Add new section for "User Registration Management"
- Include allowed emails management
- Add to sidebar navigation

## **Phase 4: Registration Flow Updates**

### **Step 4.1: Create Registration Form**

- Add email validation against allowed emails
- Show error if email not in allowed list
- Send email verification when user registers
- Update registration success flow

### **Step 4.2: Update Auth Context**

- Modify `login` function to check allowed emails
- Update profile creation to include name/phone fields
- Send verification email after registration
- Delete email from allowed list after successful registration

### **Step 4.3: Create Profile Completion Page**

- `ProfileSetup.tsx` - Form for name and phone
- Validation for required fields
- Save profile data
- Redirect to main app after completion

## **Phase 5: Email Verification System**

### **Step 5.1: Update Auth Context**

- Add email verification status checking
- Listen for email verification changes
- Update profile when email is verified

### **Step 5.2: Create Email Verification Components**

- `EmailVerificationCard.tsx` - For profile page
- `ResendVerificationButton.tsx` - Resend email functionality
- Handle verification success/failure states

## **Phase 6: Header Badge Implementation**

### **Step 6.1: Update Site Header**

- Add email verification status check
- Create `EmailVerificationBadge.tsx` component
- Make badge clickable to redirect to profile
- Add real-time updates when email is verified

### **Step 6.2: Badge Styling**

- Design badge to match existing UI
- Add hover states and animations
- Ensure responsive design

## **Phase 7: Profile Page Updates**

### **Step 7.1: Update Profile Page**

- Add email verification card
- Show verification status
- Add resend email functionality
- Handle verification success messages

### **Step 7.2: Profile Completion Logic**

- Check if name and phone exist
- Show completion status
- Allow editing of profile data

## **Phase 8: Access Control & Routing**

### **Step 8.1: Update Protected Routes**

- Check profile completion (name + phone exist)
- Redirect to profile setup if incomplete
- Allow access to main app after profile completion

### **Step 8.2: Update Auth Guards**

- Modify existing auth guards
- Add profile completion checks
- Handle different user states

## **Phase 9: Error Handling & UX**

### **Step 9.1: Error Messages**

- Add translations for new error states
- Handle email verification failures
- Show appropriate messages for each step

### **Step 9.2: Loading States**

- Add loading states for email operations
- Show progress indicators
- Handle async operations gracefully

## **Phase 10: Testing & Validation**

### **Step 10.1: Test Registration Flow**

- Test with allowed emails
- Test with disallowed emails
- Test email verification process

### **Step 10.2: Test Admin Interface**

- Test adding/removing emails
- Test bulk import functionality
- Test email management features

## **Phase 11: Cleanup & Polish**

### **Step 11.1: Remove Old Code**

- Remove any existing profile completion logic
- Clean up unused imports
- Update any references to old fields

### **Step 11.2: Final Testing**

- End-to-end testing of complete flow
- Test all edge cases
- Verify responsive design

## **Updated Implementation Order:**

1. **Database & Types** (Step 1)
2. **Remove Delete User** (Step 2) - **NEW PRIORITY**
3. **Admin Email Management** (Step 3)
4. **Registration Updates** (Step 4)
5. **Email Verification** (Step 5)
6. **Header Badge** (Step 6)
7. **Profile Updates** (Step 7)
8. **Access Control** (Step 8)
9. **Error Handling** (Step 9)
10. **Testing** (Step 10)
11. **Cleanup** (Step 11)
