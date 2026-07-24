-- Enable Realtime replication for all tables
-- This is required for Supabase real-time subscriptions to work

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable realtime for boards, columns, and tasks
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Enable realtime for channels and channel_messages
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_messages;

-- Enable realtime for private_messages
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
