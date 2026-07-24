# Channels & Direct Messages Testing Checklist

This checklist provides comprehensive testing steps to ensure 100% QA success rate for the channels and direct messages functionality wired with Supabase.

## Prerequisites

- [ ] Supabase project is set up and running
- [ ] Database schema migration (`0001_initial_schema.sql`) has been applied
- [ ] Environment variables are configured (`.env` file)
- [ ] At least 2 test users exist in the system
- [ ] Data migration has been run (if migrating from JSON)

## Setup Verification

### Environment Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- [ ] Supabase connection is working (check browser console for errors)

### Database Schema
- [ ] `profiles` table exists with correct columns
- [ ] `channels` table exists with correct columns
- [ ] `channel_messages` table exists with correct columns
- [ ] `private_messages` table exists with correct columns
- [ ] All RLS policies are in place
- [ ] Indexes are created for performance

## Channels Functionality Testing

### Channel List Display
- [ ] Channels load successfully on page load
- [ ] Default channels (general, random) are displayed
- [ ] Channel names are displayed correctly
- [ ] Loading state shows while fetching channels
- [ ] Error state displays if fetch fails
- [ ] Real-time updates work when new channels are added

### Channel Creation (Super Admin Only)
- [ ] Super admin can see "+" button to create channels
- [ ] Regular members cannot see "+" button
- [ ] Clicking "+" prompts for channel name
- [ ] Channel name validation works:
  - [ ] Empty names are rejected
  - [ ] Names > 100 characters are rejected
  - [ ] Invalid characters are rejected
- [ ] Successfully created channel appears in list
- [ ] Error message shows if creation fails

### Channel Deletion (Super Admin Only)
- [ ] Super admin can see delete (🗑️) button on hover
- [ ] Regular members cannot see delete button
- [ ] Clicking delete shows confirmation dialog
- [ ] Confirmation dialog text is clear
- [ ] Canceling deletion does nothing
- [ ] Confirming deletion removes channel from list
- [ ] If active channel is deleted, switches to another channel
- [ ] If last channel is deleted, active channel is cleared
- [ ] All messages in deleted channel are removed
- [ ] Error message shows if deletion fails

### Channel Messages
- [ ] Messages load for selected channel
- [ ] Messages are displayed in chronological order
- [ ] Sender names are displayed correctly
- [ ] User roles are displayed (super_admin badge)
- [ ] Timestamps are formatted correctly
- [ ] Real-time updates work when new messages are sent
- [ ] Messages auto-scroll to bottom when new ones arrive

### Sending Channel Messages
- [ ] Message input field is present
- [ ] Send button is disabled when input is empty
- [ ] Send button shows "Sending..." while sending
- [ ] Message appears immediately after sending
- [ ] Empty messages cannot be sent
- [ ] Whitespace-only messages cannot be sent
- [ ] Messages > 10,000 characters are rejected
- [ ] Error message shows if send fails

### Channel Message Attachments
- [ ] Attachment button (📎) is present
- [ ] File picker opens when clicked
- [ ] Selected file name is displayed
- [ ] File can be deselected with ✕ button
- [ ] Image attachments display as thumbnails
- [ ] Non-image attachments show download link
- [ ] Attachments > 5MB are rejected
- [ ] Invalid attachment types are handled gracefully

### Deleting Channel Messages
- [ ] Delete button appears on hover for own messages
- [ ] Delete button appears on hover for all messages (super admin)
- [ ] Clicking delete shows confirmation dialog
- [ ] Confirmation dialog text is clear
- [ ] Canceling deletion does nothing
- [ ] Confirming deletion removes message from UI
- [ ] Error message shows if deletion fails
- [ ] Users cannot delete others' messages (unless super admin)

## Direct Messages Functionality Testing

### User List Display
- [ ] User list loads successfully
- [ ] All users except current user are displayed
- [ ] User names are displayed correctly
- [ ] User roles are displayed
- [ ] Online status indicators work
- [ ] Loading state shows while fetching users
- [ ] Error state displays if fetch fails

### User Search
- [ ] Search input field is present
- [ ] Search filters by user name
- [ ] Search filters by email
- [ ] Search is case-insensitive
- [ ] "No members found" shows when no results
- [ ] Clearing search shows all users again

### Unread Message Counters
- [ ] Unread count badge appears on users with unread messages
- [ ] Badge shows correct count (1-9)
- [ ] Badge shows "9+" for 10+ unread messages
- [ ] Badge disappears when messages are read
- [ ] Badge updates in real-time

### Last Message Preview
- [ ] Last message text is displayed in user list
- [ ] Last message timestamp is displayed
- [ ] Timestamp format is correct (HH:MM)
- [ ] User role shows if no messages exist
- [ ] Preview updates when new messages arrive

### Conversation View
- [ ] Clicking user opens conversation
- [ ] User header shows selected user info
- [ ] Online status shows in header
- [ ] Messages load for selected conversation
- [ ] Messages are displayed in chronological order
- [ ] Own messages appear on right (blue)
- [ ] Other messages appear on left (dark)
- [ ] Message bubbles have correct styling
- [ ] Timestamps are displayed on each message
- [ ] Read receipts (✓✓) show on own messages

### Sending Private Messages
- [ ] Message input field is present
- [ ] Placeholder shows recipient name
- [ ] Send button is disabled when input is empty
- [ ] Send button shows "Sending..." while sending
- [ ] Message appears immediately after sending
- [ ] Empty messages cannot be sent
- [ ] Whitespace-only messages cannot be sent
- [ ] Messages > 10,000 characters are rejected
- [ ] Error message shows if send fails

### Private Message Attachments
- [ ] Attachment button (📎) is present
- [ ] File picker opens when clicked
- [ ] Selected file name is displayed
- [ ] File can be deselected with ✕ button
- [ ] Image attachments display as thumbnails
- [ ] Non-image attachments show download link
- [ ] Attachments > 5MB are rejected
- [ ] Invalid attachment types are handled gracefully

### Marking Messages as Read
- [ ] Unread messages are marked as read when conversation opens
- [ ] Unread count badge updates immediately
- [ ] Mark-as-read API is called correctly
- [ ] Error handling if mark-as-read fails

### Deleting Private Messages
- [ ] Delete button appears on hover for own messages
- [ ] Delete button appears on hover for all messages (super admin)
- [ ] Clicking delete shows confirmation dialog
- [ ] Confirmation dialog text is clear
- [ ] Canceling deletion does nothing
- [ ] Confirming deletion removes message from UI
- [ ] Error message shows if deletion fails
- [ ] Users cannot delete others' messages (unless super admin)

## Real-time Updates Testing

### Channel Messages Real-time
- [ ] New messages appear without page refresh
- [ ] Deleted messages disappear without page refresh
- [ ] Supabase subscription is established
- [ ] Subscription handles errors gracefully
- [ ] Subscription is cleaned up on unmount

### Private Messages Real-time
- [ ] New messages appear without page refresh
- [ ] Deleted messages disappear without page refresh
- [ ] Unread counters update in real-time
- [ ] Last message preview updates in real-time
- [ ] Supabase subscription is established
- [ ] Subscription handles errors gracefully
- [ ] Subscription is cleaned up on unmount

## Mobile Responsiveness Testing

### Channels Mobile
- [ ] Sidebar toggle button (☰) appears on mobile
- [ ] Sidebar opens when toggle is clicked
- [ ] Sidebar closes when channel is selected
- [ ] Sidebar closes when ✕ is clicked
- [ ] Chat area takes full width when sidebar closed
- [ ] Touch targets are appropriately sized
- [ ] Text is readable on small screens

### Direct Messages Mobile
- [ ] Sidebar toggle button (☰) appears on mobile
- [ ] Sidebar opens when toggle is clicked
- [ ] Sidebar closes when user is selected
- [ ] Sidebar closes when ✕ is clicked
- [ ] Chat area takes full width when sidebar closed
- [ ] Touch targets are appropriately sized
- [ ] Text is readable on small screens

## Error Handling Testing

### Network Errors
- [ ] Graceful handling when Supabase is unreachable
- [ ] Error messages are user-friendly
- [ ] Retry mechanisms work where appropriate
- [ ] Loading states don't get stuck

### Validation Errors
- [ ] Form validation errors are clear
- [ ] Invalid UUIDs are rejected with clear message
- [ ] Invalid message text is rejected with clear message
- [ ] Invalid attachments are rejected with clear message

### Permission Errors
- [ ] Non-admin users cannot create channels
- [ ] Non-admin users cannot delete channels
- [ ] Users cannot delete others' messages
- [ ] RLS policies are enforced correctly

## Performance Testing

### Load Performance
- [ ] Channels load within 2 seconds
- [ ] Messages load within 1 second
- [ ] User list loads within 2 seconds
- [ ] Initial page load is smooth

### Interaction Performance
- [ ] Message sending completes within 500ms
- [ ] Channel creation completes within 1 second
- [ ] Channel deletion completes within 1 second
- [ ] Real-time updates appear within 1 second

### Large Dataset Performance
- [ ] Handles 100+ channels without lag
- [ ] Handles 1000+ messages without lag
- [ ] Handles 50+ users without lag
- [ ] Pagination or virtualization if needed

## Security Testing

### Data Privacy
- [ ] Users can only see their own private messages
- [ ] Users cannot access others' conversations
- [ ] RLS policies prevent unauthorized access
- [ ] Sensitive data is not exposed in API responses

### Input Sanitization
- [ ] XSS attacks are prevented in message text
- [ ] SQL injection attacks are prevented
- [ ] File uploads are validated
- [ ] File size limits are enforced

### Authentication
- [ ] Unauthenticated users cannot access channels
- [ ] Unauthenticated users cannot access messages
- [ ] Session expiry is handled gracefully
- [ ] Token refresh works correctly

## Cross-Browser Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Firefox Mobile
- [ ] Samsung Internet

## Accessibility Testing

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Keyboard shortcuts work if implemented

### Screen Reader Support
- [ ] All images have alt text
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Live regions update correctly

### Visual Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is resizable
- [ ] No color-only indicators
- [ ] Focus states are visible

## Data Migration Testing (if applicable)

### Migration Script
- [ ] Migration script runs without errors
- [ ] Users are migrated correctly
- [ ] Channels are migrated correctly
- [ ] Channel messages are migrated correctly
- [ ] Private messages are migrated correctly
- [ ] User ID mapping is preserved
- [ ] Timestamps are preserved
- [ ] Attachments are preserved
- [ ] Read status is preserved

### Post-Migration Verification
- [ ] All users exist in Supabase
- [ ] All channels exist in Supabase
- [ ] All messages exist in Supabase
- [ ] Data integrity is maintained
- [ ] No duplicate data
- [ ] No data loss

## Cleanup Testing

### Channel Deletion Cleanup
- [ ] Deleting channel removes all messages
- [ ] No orphaned messages remain
- [ ] Database is cleaned up correctly

### Message Deletion Cleanup
- [ ] Deleting message removes from database
- [ ] No orphaned data remains
- [ ] Storage is cleaned up if applicable

## Final Acceptance Criteria

- [ ] All critical bugs are fixed
- [ ] All high-priority issues are resolved
- [ ] Performance meets requirements
- [ ] Security requirements are met
- [ ] Accessibility requirements are met
- [ ] Cross-browser compatibility is verified
- [ ] Mobile responsiveness is verified
- [ ] Real-time functionality works reliably
- [ ] Error handling is comprehensive
- [ ] User experience is smooth and intuitive

## Test Execution Notes

- Test environment: [_________________]
- Tester name: [_________________]
- Test date: [_________________]
- Supabase project URL: [_________________]
- Browser(s) tested: [_________________]
- Device(s) tested: [_________________]

## Bug Tracking

Record any bugs found during testing:

| Bug ID | Description | Severity | Status | Notes |
|--------|-------------|----------|--------|-------|
| | | | | |
| | | | | |
| | | | | |

## Sign-off

- [ ] All tests passed
- [ ] Known issues documented
- [ ] Ready for production deployment
- [ ] Tester signature: [_________________]
- [ ] Date: [_________________]
