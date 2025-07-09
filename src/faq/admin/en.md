## Getting Started

### How do I access the admin panel?

Log in with your admin credentials and you'll automatically see the admin navigation menu with sections for Dashboard, Fleet, Users, Reservations, and Settings. Admin users have full access to all system features including fleet management, user administration, and system configuration.

### How do I create the first admin user?

You can create the first admin user through the Firebase Console. Go to Authentication → Users, click "Add User", then navigate to Firestore Database → users collection and create a user document with the role field set to "admin". Make sure to include all required fields: name, email, phone, role, and suspended (set to false).

### What are the different user roles in the system?

The system supports two main roles:

- **Admin**: Full access to fleet management, user management, reservations, and settings. Can view all data and perform all administrative functions.
- **Teacher**: Limited access for viewing available cars and making reservations. Cannot access administrative functions or view other users' data.

### What should I know about the system architecture?

This car reservation system is built on Firebase (Firestore database, Authentication, and Hosting) using React with TypeScript. It uses Firebase's free Spark plan which has specific limitations on daily read/write operations, storage, and bandwidth. The system is designed for small to medium-sized organizations with moderate usage patterns.

### What are the main system limitations?

The system runs on Firebase's free Spark plan with these daily limits:

- **Database reads**: 50,000 per day
- **Database writes**: 20,000 per day
- **Storage**: 1 GB total
- **Bandwidth**: 10 GB per month for hosting

The system does not support email notifications, real-time conflict resolution, advanced analytics, image uploads, or complex reporting. It's designed for core car reservation functionality with basic management features.

## User Management

### How do I add new users to the system?

Due to Firebase free tier limitations, you cannot create users directly from the admin panel. Instead, you manage user registration through the allowed emails system:

1. Navigate to **Admin → Users → Allowed Emails**
2. Add email addresses (one per line) in the text area
3. Click **"Bulk Add Emails"** to add them to the allowlist
4. Users can then register with those email addresses
5. New users will have the "teacher" role by default

### How do I promote a user to admin?

To change a user's role from teacher to admin:

1. Go to **Admin → Users**
2. Find the user and click **"Edit"**
3. Change the role from "teacher" to "admin"
4. Save the changes

The user will need to log out and log back in to see admin features.

### How do I suspend a user account?

To suspend a user account:

1. Navigate to **Admin → Users**
2. Find the user you want to suspend
3. Click **"Suspend"** or click **"Edit"** and toggle the suspended status
4. Confirm the action

Suspended users cannot login or access the system. They'll see an "Account suspended" message when trying to log in. You cannot suspend your own admin account.

### How do I manage allowed email addresses for registration?

The allowed emails system controls who can register:

1. Go to **Admin → Users → Allowed Emails**
2. View current allowed emails with their status (pending/registered)
3. Add new emails by entering them in the text area (one per line)
4. Click **"Bulk Add Emails"** to add multiple emails at once
5. Remove emails by selecting them and using the delete option

Only emails on this list can create new accounts in the system.

### Can I delete user accounts?

User accounts cannot be permanently deleted to maintain data integrity and reservation history. The system is designed to preserve historical data for audit purposes. Instead, you can:

- Suspend accounts to prevent access
- Keep historical reservation data intact
- Maintain proper audit trails

### How do I view a user's reservation history?

To view any user's complete reservation history:

1. Go to **Admin → Users**
2. Click on a user to view their detail page
3. The user detail page shows all their reservations with filtering options
4. You can manage their reservations directly from this page

### What happens when I edit a user's profile?

When you edit a user's profile:

- Name and phone number changes take effect immediately
- Email address cannot be changed from the admin panel (users must change it themselves)
- Role changes require the user to log out and log back in to take effect
- Search keywords are automatically updated for better search functionality

## Fleet Management

### How do I add a new car to the fleet?

To add a new car:

1. Navigate to **Admin → Fleet**
2. Click **"Add Car"** button
3. Fill in the required information:
   - **License Plate**: Must be unique
   - **Model**: Car model/make
   - **Seats**: Number of passengers
   - **Color**: Vehicle color
   - **Year**: (Optional) Manufacturing year
   - **Description**: (Optional) Additional details
4. Set the initial status (Available, Maintenance, or Out of Service)
5. Click **"Save"** to add the car

The car will be immediately available for reservations if status is set to "Available".

### How do I change a car's status?

To update a car's availability status:

1. Go to **Admin → Fleet**
2. Find the car in the list
3. Click the status badge to quickly change it, or click **"Edit"** for detailed changes
4. Choose from:
   - **Available**: Can be reserved by users
   - **Maintenance**: Not available for reservations
   - **Out of Service**: Permanently unavailable

Only cars with "Available" status appear in user reservation options.

### How do I view fleet analytics?

The admin dashboard provides fleet analytics:

1. Go to **Admin Dashboard**
2. View the **Fleet Status Chart** showing distribution of cars by status
3. See real-time counts of available, maintenance, and out-of-service vehicles
4. Track fleet utilization patterns over time

You can also view individual car reservation history by going to **Admin → Fleet → [Car Details]**.

### Can I edit car details after adding them?

Yes, you can modify all car details at any time:

1. Go to **Admin → Fleet**
2. Find the car and click **"Edit"**
3. Modify any field (license plate, model, seats, color, year, description)
4. Update the status if needed
5. Save changes

**Note**: Changing a license plate will affect all historical reservations referencing that car.

### How do I remove a car from the fleet?

To remove a car:

1. Go to **Admin → Fleet**
2. Find the car and click **"Edit"**
3. Look for the **"Delete Car"** option
4. Confirm deletion

**Important**: Deleting a car will affect historical reservation data. Consider setting the car to "Out of Service" instead if you want to preserve history.

### What information is tracked for each car?

The system tracks:

- **Basic Info**: License plate, model, year, color, seats, description
- **Status**: Current availability status
- **Reservation History**: All past and future reservations
- **Utilization Data**: Usage patterns and frequency
- **Search Keywords**: Automatically generated for efficient searching
- **Timestamps**: Created and last updated dates

## Reservation Management

### How do I view all reservations?

To see all system reservations:

1. Navigate to **Admin → Reservations**
2. View the comprehensive table with all reservations
3. Use filters to narrow down results:
   - **Status**: Filter by pending, confirmed, cancelled, etc.
   - **Date Range**: Filter by start/end dates
   - **User**: See reservations for specific users
   - **Car**: See reservations for specific vehicles
4. Sort by any column (user, car, dates, status, etc.)

### How do I approve or reject reservations?

To process reservation requests:

1. Go to **Admin → Reservations**
2. Find reservations with "Pending" status
3. Click on a reservation to view details
4. Choose to:
   - **Confirm**: Approve the reservation
   - **Reject**: Decline the reservation
   - **Cancel**: Cancel if already confirmed

The system automatically checks for conflicts when confirming reservations.

### How do I handle conflicting reservations?

When reservation times overlap:

1. The system prevents users from selecting already-booked time slots
2. You can manually review potential conflicts in the reservations list
3. If conflicts arise, you can:
   - Assign a different car to one of the users
   - Contact users to negotiate different times
   - Cancel one reservation and notify the user
   - Reject new reservations that conflict with existing ones

### What do the different reservation statuses mean?

Reservation statuses indicate the current state:

- **Pending**: Waiting for admin approval
- **Confirmed**: Approved and active
- **Cancelled**: Cancelled by user or admin
- **Cancellation Pending**: User requested cancellation, awaiting admin approval
- **Rejected**: Denied by admin

### How do I manage reservation cancellations?

For cancellation requests:

1. Go to **Admin → Reservations**
2. Look for "Cancellation Pending" status
3. Review the cancellation request
4. Approve or deny the cancellation
5. The system will update the status accordingly

Users may be able to cancel directly depending on your system settings.

### Can I edit reservation details?

Yes, you can modify reservations:

1. Find the reservation in **Admin → Reservations**
2. Click **"Edit"** on the reservation
3. Modify:
   - Start/end dates and times
   - Driver name
   - Comments/notes
4. Save changes

**Note**: Changing dates will trigger automatic overlap checking.

### How do I view reservation analytics?

The dashboard provides reservation analytics:

1. Go to **Admin Dashboard**
2. View the **Daily Reservations Chart** showing:
   - Reservation counts by day
   - Status breakdown (confirmed, pending, cancelled)
   - Monthly trends
3. Navigate between months to see historical patterns
4. Track reservation approval rates and cancellation patterns

## System Settings

### How do I configure reservation policies?

To set up reservation rules:

1. Go to **Admin → Settings**
2. Configure these key settings:
   - **Advance Reservation Days**: How far in advance users can book (0 disables this restriction)
   - **Auto Approval**: Whether reservations are automatically confirmed
   - **Auto Cancellation**: Whether users can cancel without approval
   - **Max Reservation Duration**: Maximum booking length in hours (0 disables this restriction)
   - **Advance Cancellation Time**: Minimum notice required for cancellation in hours (0 disables this restriction)
   - **Max Concurrent Reservations**: How many active reservations per user (0 disables this restriction)
   - **Weekend Reservations**: Allow or restrict weekend bookings

**Note**: Setting 0 (zero) for number-type settings disables that particular restriction.

### How do I set up business hours?

To configure operating hours:

1. Navigate to **Admin → Settings**
2. Set **Business Hours**:
   - **Start Time**: When reservations can begin
   - **End Time**: When reservations must end
3. Configure **Weekend Settings**:
   - Enable or disable weekend reservations
   - Set different hours for weekends if needed

These settings affect what times users can select when making reservations.

### How do I manage support contact information?

To set up support contacts:

1. Go to **Admin → Settings**
2. Configure **Support Emails**:
   - Add multiple support email addresses
   - Users will see these on their help pages
   - Email notifications can be sent to these addresses
3. Update any displayed company information

### How do I clean up old reservation data?

To manage database size and stay within Firebase limits:

1. Go to **Admin → Settings**
2. Use the **Data Cleanup** tool:
   - Select a year to delete reservations from
   - Preview how many reservations will be deleted
   - Confirm the deletion
3. Recommended to clean up data annually

**Important**: This permanently deletes old reservations and cannot be undone.

### Does the system have email notifications?

The system does not have email notifications for reservation status changes due to Firebase free tier limitations and lack of access to Cloud Functions. Only basic Firebase Auth emails are available:

- **User Registration**: Automatic email verification
- **Password Reset**: Automatic through Firebase Auth

Users must manually check their reservation status in the system. This is a limitation of the free plan.

### How do I manage language settings?

The system supports English and Thai:

1. Users can change their language preference from the app header
2. Language preference is stored in user profiles
3. The entire interface updates to reflect the chosen language
4. Admin settings apply to all users but individual preferences override

### How do I enable or disable automatic reservation approval?

To configure approval workflow:

1. Go to **Admin → Settings**
2. Find **Auto Reservation** setting
3. Enable for automatic approval or disable for manual approval
4. When disabled, all reservations will have "Pending" status until you approve them

### What are the performance optimization settings?

To optimize system performance:

1. Monitor your Firebase usage in the Firebase Console
2. Use the data cleanup tool regularly
3. Consider these settings:
   - Lower the maximum concurrent reservations per user
   - Shorter advance reservation periods
   - Automatic cleanup of old data

## Firebase & Technical Details

### What are the Firebase Spark plan limitations?

The free Spark plan has these daily limits:

- **Firestore Reads**: 50,000 per day
- **Firestore Writes**: 20,000 per day
- **Firestore Deletes**: 20,000 per day
- **Storage**: 1 GB total
- **Hosting Bandwidth**: 10 GB per month

Heavy usage can exceed these limits, causing temporary service interruptions.

### How do I monitor system usage?

To track Firebase usage:

1. Go to the Firebase Console (ask your technical contact for access)
2. Check the **Usage** tab for real-time metrics
3. Monitor daily read/write operations
4. Set up alerts for approaching limits

In the admin panel, you can see basic usage through reservation and user counts.

### What happens if we exceed Firebase limits?

When limits are exceeded:

- **Reads/Writes**: Service becomes temporarily unavailable
- **Storage**: Cannot add new data
- **Bandwidth**: Website may become inaccessible

You'll need to either wait for limits to reset (daily) or upgrade to a paid plan.

### How can I optimize system performance?

To reduce Firebase usage:

1. **Regular Data Cleanup**: Delete old reservations annually
2. **Limit Concurrent Users**: Avoid peak usage times
3. **Efficient Searching**: Use specific search terms
4. **Batch Operations**: Process multiple reservations at once
5. **Monitor Dashboard**: Don't refresh unnecessarily

### What data is stored in Firebase?

The system stores:

- **Users**: Profiles, authentication data, preferences
- **Cars**: Fleet information, status, descriptions
- **Reservations**: Booking details, status, history
- **Settings**: System configuration, business rules
- **Allowed Emails**: Registration whitelist

All data is encrypted and secured through Firebase's security rules.

### How do I backup system data?

Firebase provides automatic backup, but you can also:

1. Export data through the Firebase Console
2. Use the admin panel to view and document important information
3. Regularly export user and car lists
4. Document system settings and configurations

### What happens if the system goes down?

If the system becomes unavailable:

1. Check the Firebase Console for service status
2. Verify internet connectivity
3. Check if daily limits have been exceeded
4. Contact technical support if issues persist

Most outages are temporary and resolve within 24 hours when daily limits reset.

## Troubleshooting

### Why can't a user log in?

Check these common issues:

1. **Account Status**: Is the account suspended?
2. **Email Verification**: Has the user verified their email?
3. **Profile Completeness**: Are name and phone number filled in?
4. **Password**: Is the user entering the correct password?
5. **Allowed Emails**: Is their email on the registration whitelist?

### Why isn't a car showing up for reservations?

Verify these car settings:

1. **Status**: Must be set to "Available"
2. **Conflicts**: No overlapping reservations for the requested time
3. **Data Integrity**: Car record is not corrupted
4. **Search Issues**: Try refreshing the page or clearing browser cache

### How do I handle email verification issues?

For email verification problems:

1. Check that the email address is correct in the user's profile
2. Ask the user to check their spam/junk folder
3. Have the user try resending the verification email from their profile
4. Verify that Firebase email services are working
5. Check if the email domain is blocking Firebase emails

### What should I do if the system seems slow?

System performance issues can be caused by:

1. **Firebase Limits**: Check if daily limits are being approached
2. **Internet Connection**: Verify network connectivity
3. **Browser Issues**: Try a different browser or clear cache
4. **High Usage**: Multiple users accessing simultaneously
5. **Large Data Sets**: Too many reservations or users

### How do I resolve "Permission denied" errors?

Permission errors typically indicate:

1. **User Role**: User doesn't have admin privileges
2. **Session Expired**: User needs to log out and log back in
3. **Account Suspended**: Admin account has been suspended
4. **Firebase Rules**: Security rules are blocking the operation

### Why don't users receive reservation status notifications?

The system does not send email notifications for reservation status changes. This is a limitation of the Firebase free tier and lack of access to Cloud Functions. Users must manually check their reservation status in the system by:

1. Logging into their account
2. Viewing their reservation history
3. Checking the status of their reservations

Only Firebase Auth emails (verification and password reset) are automatically sent.

### How do I handle data corruption or loss?

For data-related issues:

1. **Recent Changes**: Check if recent edits caused the problem
2. **Firebase Console**: Look for error logs
3. **User Reports**: Gather information from affected users
4. **Data Recovery**: Use Firebase's built-in recovery tools
5. **System Restore**: May require technical support

### What should I do if reservations are not saving?

If reservations fail to save:

1. **Database Limits**: Check if write limits have been exceeded
2. **Validation Errors**: Ensure all required fields are filled
3. **Conflicts**: Verify no overlapping reservations exist
4. **Network Issues**: Check internet connectivity
5. **Browser Problems**: Try a different browser

## Security & Maintenance

### How do I manage user permissions?

The system uses role-based access control:

1. **Admin Role**: Full access to all features and data
2. **Teacher Role**: Limited access to reservations and profile
3. **Account Status**: Suspended accounts cannot access anything
4. **Email Verification**: Required for all accounts
5. **Profile Completeness**: Required for full system access

### How do I monitor system usage?

Track system activity through:

1. **Admin Dashboard**: Basic usage statistics
2. **User Activity**: Login patterns and reservation frequency
3. **Fleet Utilization**: Car usage and availability patterns
4. **Firebase Console**: Detailed technical metrics
5. **Error Monitoring**: System errors and performance issues

### What are the security features?

The system includes:

1. **Firebase Authentication**: Industry-standard user authentication
2. **Email Verification**: Prevents unauthorized account creation
3. **Role-Based Access**: Limits access based on user roles
4. **Firestore Security Rules**: Database-level permission control
5. **HTTPS Encryption**: All data transmission is encrypted
6. **reCAPTCHA**: Protects against automated abuse

### How do I handle security incidents?

If you suspect a security issue:

1. **Immediate Action**: Suspend affected accounts
2. **Investigation**: Check user activity logs
3. **Documentation**: Record all findings
4. **Communication**: Notify affected users if necessary
5. **Recovery**: Restore normal operations and implement fixes

### How do I perform regular maintenance?

Monthly maintenance tasks:

1. **Data Cleanup**: Remove old reservations
2. **User Review**: Check for inactive or problematic accounts
3. **System Updates**: Ensure all components are current
4. **Performance Check**: Monitor Firebase usage patterns
5. **Backup Verification**: Ensure data backup is working

### What should I monitor regularly?

Keep an eye on:

1. **Firebase Usage**: Daily read/write operations
2. **User Activity**: Login patterns and account status
3. **Reservation Patterns**: Booking trends and conflicts
4. **System Errors**: Error rates and user complaints
5. **Performance**: Page load times and responsiveness

### How do I plan for system growth?

As usage increases:

1. **Monitor Limits**: Track approaching Firebase limits
2. **Optimize Data**: Regular cleanup and optimization
3. **User Management**: Efficient user onboarding
4. **Capacity Planning**: Plan for potential paid plan upgrade
5. **Feature Requests**: Prioritize new features based on usage

## Advanced Features & Limitations

### Why are these features not implemented?

This app was developed in less than 2 weeks, on the Firebase free tier and with limited resources. As such, it does not include advanced features like:

- Email notifications for reservation status changes
- Real-time conflict resolution
- Advanced analytics and reporting
- Complex user management workflows
- Image uploads and rich media
- Automated integrations
- Mobile app versions
- Multi-tenant support

The focus was on core functionality within budget and time constraints.

### What workarounds exist for missing features?

For common limitations:

1. **No Email Notifications**: Users must manually check their reservation status
2. **No Image Uploads**: Use detailed text descriptions for cars
3. **Limited Analytics**: Export data to external tools for analysis
4. **No Real-time Updates**: Manual page refresh for latest information
5. **Basic Search**: Use multiple search terms for better results
6. **No Mobile App**: Use the responsive web interface on mobile devices

### How can I extend the system?

Potential improvements:

1. **Upgrade to Firebase Blaze Plan**: Remove usage limits and enable Cloud Functions
2. **Add Email Notifications**: Implement Cloud Functions for automated notifications
3. **Add Custom Features**: Hire developers for specific functionality
4. **Integrate External Tools**: Connect with calendar or email systems
5. **Enhanced Reporting**: Build custom dashboards
6. **Mobile App**: Develop native mobile applications

### What are the system's scalability limits?

Current limitations:

1. **Users**: Approximately 100-500 active users (depending on usage)
2. **Cars**: Up to 50-100 vehicles
3. **Reservations**: 200-1000 reservations per month
4. **Data Storage**: 1 GB total
5. **Concurrent Users**: 10-20 simultaneous users

### How do I request new features?

To suggest improvements:

1. **Document Requirements**: Clearly describe needed functionality
2. **Assess Impact**: Understand how it affects current users
3. **Consider Costs**: Evaluate development and hosting costs
4. **Prioritize Features**: Focus on most important additions
5. **Technical Consultation**: Discuss with developers

### What are the long-term considerations?

For sustained use:

1. **Plan Upgrade**: Consider paid Firebase plan as usage grows
2. **Regular Updates**: Keep system components current
3. **User Training**: Ensure users understand limitations
4. **Data Management**: Implement regular maintenance procedures
5. **Backup Strategy**: Maintain reliable data backup

### Why does the system have these limitations?

The design constraints reflect:

1. **Budget**: Developed with minimal cost
2. **Time**: Rapid development timeline
3. **Resources**: Limited development team
4. **Infrastructure**: Firebase free tier constraints
5. **Scope**: Focus on core functionality

![Feature Limitations](/assets/FastCheapGood.webp)

Understanding these constraints helps set appropriate expectations for system capabilities and performance.
