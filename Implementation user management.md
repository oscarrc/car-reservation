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

### **Step 4.1: Update Registration Form**

- Add email validation against allowed emails
- Show error if email not in allowed list
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
