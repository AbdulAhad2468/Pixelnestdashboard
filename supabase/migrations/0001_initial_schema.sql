-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users with additional fields)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  column_id UUID REFERENCES columns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channel_messages table
CREATE TABLE IF NOT EXISTS channel_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  attachment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create private_messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  attachment TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can delete profiles" ON profiles FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Boards RLS Policies
CREATE POLICY "Authenticated users can view boards" ON boards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super admins can insert boards" ON boards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can update boards" ON boards FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can delete boards" ON boards FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Columns RLS Policies
CREATE POLICY "Authenticated users can view columns" ON columns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super admins can insert columns" ON columns FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can update columns" ON columns FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can delete columns" ON columns FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Tasks RLS Policies
CREATE POLICY "Authenticated users can view tasks" ON tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super admins can insert tasks" ON tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can update tasks" ON tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can delete tasks" ON tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Channels RLS Policies
CREATE POLICY "Authenticated users can view channels" ON channels FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super admins can insert channels" ON channels FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can update channels" ON channels FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Super admins can delete channels" ON channels FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Channel Messages RLS Policies
CREATE POLICY "Authenticated users can view channel messages" ON channel_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert channel messages" ON channel_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete own channel messages" ON channel_messages FOR DELETE USING (auth.uid() = sender_id);
CREATE POLICY "Super admins can delete any channel message" ON channel_messages FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Private Messages RLS Policies
CREATE POLICY "Users can view own private messages" ON private_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can insert private messages" ON private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own private messages" ON private_messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own private messages" ON private_messages FOR DELETE USING (auth.uid() = sender_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert profile, but don't fail if it already exists
  BEGIN
    INSERT INTO profiles (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
  EXCEPTION WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE profiles SET
      email = NEW.email,
      name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      role = COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    WHERE id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.email, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger for tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default channels
INSERT INTO channels (name) VALUES
  ('general'),
  ('random')
ON CONFLICT DO NOTHING;

-- Insert default board with columns
WITH default_board AS (
  INSERT INTO boards (name) VALUES ('Sprint Board')
  RETURNING id
)
INSERT INTO columns (board_id, title)
SELECT 
  id,
  unnest(ARRAY['To Do', 'In Progress', 'Review', 'Done'])
FROM default_board
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_id ON channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_sender_id ON channel_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_id ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);
