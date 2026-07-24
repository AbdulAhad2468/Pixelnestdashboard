# Data Migration Guide

This guide explains how to migrate existing JSON data to Supabase for the channels and direct messages features.

## Prerequisites

1. Ensure you have a Supabase project set up with the database schema from `supabase/migrations/0001_initial_schema.sql`
2. Get your Supabase Service Role Key from the Supabase dashboard (Project Settings > API > service_role (secret))

## Setup

1. Add the following to your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Important**: Never commit the service role key to version control. It has full admin access to your database.

## Running the Migration

Run the migration script:

```bash
npm run migrate
```

Or directly:

```bash
node scripts/migrate-data-to-supabase.js
```

## What the Migration Does

1. **Users**: Migrates users from `data/users.json` to Supabase Auth and the `profiles` table
   - Maps old JSON IDs to new Supabase UUIDs
   - Converts 'admin' role to 'super_admin'
   - Skips users that already exist by email

2. **Channels**: Migrates channels from `data/channels.json` to the `channels` table
   - Skips channels that already exist by name
   - Migrates all channel messages to the `channel_messages` table
   - Maps sender names to user IDs

3. **Private Messages**: Migrates private messages from `data/private-messages.json` to the `private_messages` table
   - Maps old user IDs to new Supabase UUIDs
   - Preserves read status and attachments
   - Skips duplicate messages

## Verification

After migration, verify the data in your Supabase dashboard:

1. Check the `profiles` table for all users
2. Check the `channels` table for all channels
3. Check the `channel_messages` table for channel messages
4. Check the `private_messages` table for private messages

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"
Make sure you added the service role key to your `.env` file.

### "User already exists"
The script will skip users that already exist and map their IDs accordingly.

### "Sender not found"
If a message sender name doesn't match any profile, that message will be skipped. Ensure user names in the JSON match the names in the profiles table.

## Rollback

If you need to rollback the migration, you can delete the data from the Supabase tables:

```sql
-- Delete all data (be careful!)
DELETE FROM channel_messages;
DELETE FROM private_messages;
DELETE FROM channels;
-- Note: Users need to be deleted via Supabase Auth API, not directly from profiles table
```

## Security Notes

- The service role key bypasses RLS policies, so use it carefully
- After migration, you can remove the service role key from your `.env` file
- The migration script should only be run in a secure environment
