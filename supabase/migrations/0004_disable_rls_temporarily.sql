-- TEMPORARY FIX: Disable RLS to allow operations with legacy IDs
-- This is a temporary measure to ensure functionality works
-- Re-enable RLS with proper policies after migration is complete

-- Disable RLS on all messaging tables
ALTER TABLE private_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE channels DISABLE ROW LEVEL SECURITY;

-- Disable RLS on boards and columns tables
ALTER TABLE boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Note: This disables RLS entirely.
-- After migration is complete and all IDs are UUIDs,
-- re-enable RLS with proper policies using:
-- ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
