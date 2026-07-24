# Supabase Database

This folder contains all Supabase-related database files for the Pixel Nest application.

## Structure

- `migrations/` - SQL migration files for database schema changes
  - `0001_initial_schema.sql` - Initial database schema with tables, RLS policies, and seed data

## Applying Migrations

To apply the migrations to your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the migration file from `migrations/0001_initial_schema.sql`
4. Copy and run the SQL script

## Database Schema

The database includes the following tables:

- `profiles` - User profiles with role information (super_admin, member)
- `boards` - Kanban boards
- `columns` - Board columns
- `tasks` - Kanban tasks with priorities
- `channels` - Chat channels
- `channel_messages` - Messages in channels
- `private_messages` - Direct messages between users

## Security

All tables have Row Level Security (RLS) policies enabled to ensure users can only access data they're authorized to see.

## Seed Data

The initial migration includes:
- A default super admin user (email: admin@pixelnest.com, password: admin123)
- Default channels (general, random, announcements)
- A sample sprint board with columns

**Important:** Change the default admin password after first login!
