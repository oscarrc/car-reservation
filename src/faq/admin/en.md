## Getting Started

### How do I access the admin panel?

Log in with your admin credentials and you'll automatically see the admin navigation menu with sections for Fleet, Users, Reservations, and Settings. Admin users have full access to all system features.

### How do I create the first admin user?

You can create the first admin user through the Firebase Console. Go to Authentication → Users, click "Add User", then navigate to Firestore Database → users collection and create a user document with the admin role set to "admin".

### What are the different user roles in the system?

The system supports two main roles: **Admin** (full access to fleet management, user management, reservations, and settings) and **Teacher** (limited access for viewing cars and making reservations).

### What are the limitations?

The system runs on Firebase's free tier, which means there are limitations on data storage, bandwith usage and database read/write/deletions. It does not support advanced features like real-time conflict resolution or detailed analytics.

Due to the storage limitations of Firebase free tier, the system does not support uploading images for cars or users. All car and user data must be text-based.

It is recomended to yearly delete old reservations to keep the database size manageable. The system does not automatically delete old reservations, so you should periodically review and remove outdated records. You can do this through the Admin → Settings by selecting a year to remove the reservations.

## User Management

### How do I add new users to the system?

Due to the app working within Firebase fee tier you cannot add users directly. Instead you can allow email addresses to register. To do so, Navigate to Admin → Allowed emails. Add the allowed emails one per line and clic Bulk Add Emails. After that users can register with those emails.

### How do I suspend a user account?

Go to Admin → Users, find the user you want to suspend, click "Edit", and toggle the "Suspended" status. Suspended users cannot login or access the system until reactivated. Alternatively, you can also suspend users by clicking the "Suspend" button in the user list.

### How do I manage allowed email addresses for registration?

In the Admin → Allowed section, you can manage the allowed emails list. Only emails on this list can register for the system. You can add multiple emails at once.

### Can I delete user accounts?

User accounts cannot be deleted from the system to maintain data integrity and reservation history. Instead, you can suspend accounts to prevent access while preserving historical data.

## Fleet Management

### How do I add a new car to the fleet?

Navigate to Admin → Fleet → Add Car. Enter the car details including model, license plate, capacity, color, and set the initial status. The car will be available for reservations once added.

### How do I change a car's status?

Go to Admin → Fleet, find the car, and click "Edit". You can change the status to Available, In Maintenance, or Out of Service. Only available cars can be reserved by users. Alternatively, you can also change the status by status badge in the car list.

### How do I view fleet analytics?

The admin dashboard shows fleet status distribution and usage analytics. You can see how many cars are available, in maintenance, or out of service at any given time.

### Can I edit car details after adding them?

Yes, you can edit all car details including model, license plate, capacity, color, and status at any time through the Admin → Fleet section.

## Reservation Management

### How do I view all reservations?

Navigate to Admin → Reservations to see all reservations in the system. You can filter by status, date range, user, or car to find specific reservations.

### How do I approve or reject reservations?

In the reservations list, click on a reservation to view details and change its status. You can approve, reject, or cancel reservations as needed.

### How do I handle conflicting reservations?

Due to constraints of Firebase free tier there is no real time overlapping monitoring. However, users cannot select cars that are already booked or whose reservation overlaps the user choice. If you detect a conflict, you can resolve conflicts by assigning different cars, canceling the reservation or contacting the users involved.

## System Settings

### How do I update company information?

Go to Admin → Settings and update the company name, contact details, and other organizational information that appears throughout the system.

### How do I set reservation policies?

In the Settings section, you can configure maximum reservation duration, advance booking limits, and other reservation rules that apply to all users.

### Are the reservations automatically confirmed?

It depends on your settings. By default, reservations are automatically confirmed when made. However, you can change this behavior in the Admin → Settings section to require manual approval for reservations.

### Are the reservations automatically canceled?

It depends on your settings. By default, reservations are not automatically canceled. However, you can set cancellation policies in the Admin → Settings section to decide whether an user can cancel the reservation or require manual approval.

### How do I manage language settings?

The system supports multiple languages. You can set your preferred language from the app header. The language will be applied to the entire user interface, including admin and user sections.

### How do I configure email verification settings?

Email verification is automatically enabled for new users. Due to security reasons, this cannot be disabled.

## Troubleshooting

### Why can't a user log in?

Check if the user account is suspended, if their email is verified, and if their profile is complete with name and phone number. All these are required for full system access.

### Why isn't a car showing up for reservations?

Make sure the car status is set to "Available". Cars that are "In Maintenance" or "Out of Service" won't appear in reservation options.

### How do I handle email verification issues?

Users can resend verification emails from their profile page. If they don't receive the email, check their spam folder or ensure the email address is correct. If issues persist, contact technical support.

### What should I do if the system seems slow?

System performance depends on Firebase resources and internet connection. Check the Firebase Console for any service issues or contact technical support if problems persist.

## Security and Maintenance

### How do I manage user permissions?

User permissions are role-based. Admins have full access while teachers have limited access to reservation features. You can change user roles through the user management section.

### How do I monitor system usage?

The admin dashboard provides usage analytics including reservation patterns, and fleet utilization. For Firebase-specific metrics, you can check the Firebase Console for detailed logs and performance data.

### What are the security features?

The system includes Firebase Authentication, role-based access control, email verification, and Firestore security rules to protect data and ensure only authorized users can access appropriate features.

## Missing Features

### Why these features are not implemented?

This app was developed in less than 2 weeks, on the Firebase free tier and with free labour. As such, it does not include advanced features like real-time conflict resolution, detailed analytics, or complex user management. The focus was on core functionality based on budget and time constraints. Take a look at the following graph to undertand it better:

![Feature Limitations](/assets/FastCheapGood.webp)
