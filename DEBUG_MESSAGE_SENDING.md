# Debug Message Sending Issues

## Steps to Debug Message Sending

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for any error messages when trying to send a message.

### 2. Check Network Tab
Open browser DevTools (F12) and go to the Network tab. Try sending a message and look for:
- The API request to `/api/channels/[id]/messages` or `/api/messages`
- Request status code (should be 200 for success)
- Request payload (check if data is being sent correctly)
- Response payload (check error messages)

### 3. Verify Supabase Connection
Check if Supabase is properly configured:
- Open browser console and type: `localStorage.getItem('supabase.auth.token')`
- Check if there's a valid session token
- Verify the token isn't expired

### 4. Check User Authentication
Verify the user is properly authenticated:
- Check if `user.id` exists in the frontend
- Check if the user ID is a valid UUID format
- Verify the user exists in the `profiles` table in Supabase

### 5. Test API Endpoints Directly

#### Test Channel Message API
```bash
# Replace with actual values
curl -X POST http://localhost:3000/api/channels/YOUR_CHANNEL_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test message",
    "senderId": "YOUR_USER_ID",
    "attachment": null
  }'
```

#### Test Private Message API
```bash
# Replace with actual values
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "YOUR_SENDER_ID",
    "receiverId": "YOUR_RECEIVER_ID", 
    "text": "Test message",
    "attachment": null
  }'
```

### 6. Check Supabase RLS Policies
Verify RLS policies allow message insertion:

```sql
-- Check if user can insert channel messages
SELECT * FROM pg_policies 
WHERE tablename = 'channel_messages';

-- Check if user can insert private messages  
SELECT * FROM pg_policies 
WHERE tablename = 'private_messages';
```

### 7. Verify Database Schema
Check that the tables exist and have the correct structure:

```sql
-- Check channel_messages table
DESCRIBE channel_messages;

-- Check private_messages table
DESCRIBE private_messages;

-- Check profiles table
DESCRIBE profiles;
```

### 8. Test Direct Supabase Query
Try inserting a message directly in Supabase SQL Editor:

```sql
-- Test channel message insertion
INSERT INTO channel_messages (channel_id, text, sender_id, attachment)
VALUES ('YOUR_CHANNEL_ID', 'Test message', 'YOUR_USER_ID', NULL);

-- Test private message insertion
INSERT INTO private_messages (sender_id, receiver_id, text, attachment, read)
VALUES ('YOUR_SENDER_ID', 'YOUR_RECEIVER_ID', 'Test message', NULL, false);
```

### 9. Check Environment Variables
Verify `.env` file has correct values:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 10. Common Issues and Solutions

#### Issue: "Invalid UUID format"
**Cause**: Strict UUID validation rejecting legacy string IDs
**Solution**: We've relaxed validation to support legacy IDs during migration

#### Issue: "Failed to add message" 
**Cause**: RLS policy blocking insertion
**Solution**: Check RLS policies and user permissions

#### Issue: "You must be logged in to send messages"
**Cause**: User authentication issue
**Solution**: Check if user is properly authenticated and has valid ID

#### Issue: "Valid sender ID is required"
**Cause**: User ID is missing or invalid
**Solution**: Check user authentication and profile creation

#### Issue: Network/CORS errors
**Cause**: Supabase connection issues
**Solution**: Check Supabase URL and CORS settings

### 11. Enable Debug Logging

Add temporary console logging to track the issue:

In `src/components/Chat.tsx`:
```typescript
console.log('Sending message:', { message, activeChannel, userId: user?.id });
console.log('Request payload:', { text: message, senderId: user?.id, attachment });
```

In `src/app/api/channels/[id]/messages/route.ts`:
```typescript
console.log('Received request:', { params: params.id, body: { text, senderId, attachment } });
console.log('Supabase error:', error);
```

### 12. Check Supabase Dashboard
- Go to Supabase Dashboard → Database
- Check Table Editor for `channel_messages` and `private_messages`
- Try manually inserting a row to test permissions
- Check the Logs for any database errors

## Next Steps

1. Run through the debugging steps above
2. Note any specific error messages
3. Check browser console and network tab
4. Test API endpoints directly with curl
5. Verify Supabase RLS policies
6. Report back with specific error messages for further assistance
