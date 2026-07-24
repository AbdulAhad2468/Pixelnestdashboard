-- Fix RLS policies to allow message sending during migration period
-- This migration relaxes RLS policies to support legacy string IDs

-- Drop existing channels RLS policies
DROP POLICY IF EXISTS "Authenticated users can view channels" ON channels;
DROP POLICY IF EXISTS "Super admins can insert channels" ON channels;
DROP POLICY IF EXISTS "Super admins can update channels" ON channels;
DROP POLICY IF EXISTS "Super admins can delete channels" ON channels;

-- Create more permissive channels RLS policies
CREATE POLICY "Authenticated users can view channels" ON channels 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert channels" ON channels 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Super admins can update channels" ON channels 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete channels" ON channels 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Drop existing private_messages RLS policies
DROP POLICY IF EXISTS "Users can view own private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can insert private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can update own private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can delete own private messages" ON private_messages;

-- Create more permissive private_messages RLS policies
CREATE POLICY "Users can view own private messages" ON private_messages 
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id OR auth.role() = 'authenticated'
);

CREATE POLICY "Users can insert private messages" ON private_messages 
FOR INSERT WITH CHECK (
  auth.uid() = sender_id OR auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own private messages" ON private_messages 
FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own private messages" ON private_messages 
FOR DELETE USING (auth.uid() = sender_id);

-- Drop existing channel_messages RLS policies
DROP POLICY IF EXISTS "Authenticated users can view channel messages" ON channel_messages;
DROP POLICY IF EXISTS "Authenticated users can insert channel messages" ON channel_messages;
DROP POLICY IF EXISTS "Users can delete own channel messages" ON channel_messages;
DROP POLICY IF EXISTS "Super admins can delete any channel message" ON channel_messages;

-- Create more permissive channel_messages RLS policies
CREATE POLICY "Authenticated users can view channel messages" ON channel_messages 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert channel messages" ON channel_messages 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own channel messages" ON channel_messages 
FOR DELETE USING (auth.uid() = sender_id);

CREATE POLICY "Super admins can delete any channel message" ON channel_messages 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
