const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to .env

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load JSON data
const channelsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/channels.json'), 'utf8'));
const privateMessagesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/private-messages.json'), 'utf8'));
const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8'));

// User ID mapping (old JSON ID -> new Supabase UUID)
const userIdMap = {};

async function migrateUsers() {
  console.log('=== Migrating Users ===');
  
  for (const user of usersData) {
    try {
      // Check if user already exists by email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        console.log(`User ${user.email} already exists, mapping ID: ${user.id} -> ${existingUser.id}`);
        userIdMap[user.id] = existingUser.id;
        continue;
      }

      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role === 'admin' ? 'super_admin' : 'member'
        }
      });

      if (authError) {
        console.error(`Failed to create auth user ${user.email}:`, authError.message);
        continue;
      }

      console.log(`Created user: ${user.email} with ID: ${authData.user.id}`);
      userIdMap[user.id] = authData.user.id;

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Error migrating user ${user.email}:`, error.message);
    }
  }
  
  console.log('User ID mapping:', userIdMap);
  console.log('=== Users Migration Complete ===\n');
}

async function migrateChannels() {
  console.log('=== Migrating Channels ===');
  
  for (const channel of channelsData) {
    try {
      // Check if channel already exists by name
      const { data: existingChannel } = await supabase
        .from('channels')
        .select('id')
        .eq('name', channel.name)
        .single();

      if (existingChannel) {
        console.log(`Channel ${channel.name} already exists with ID: ${existingChannel.id}`);
        await migrateChannelMessages(existingChannel.id, channel.messages);
        continue;
      }

      // Create channel
      const { data: newChannel, error } = await supabase
        .from('channels')
        .insert({ name: channel.name })
        .select()
        .single();

      if (error) {
        console.error(`Failed to create channel ${channel.name}:`, error.message);
        continue;
      }

      console.log(`Created channel: ${channel.name} with ID: ${newChannel.id}`);
      
      // Migrate messages for this channel
      await migrateChannelMessages(newChannel.id, channel.messages);

    } catch (error) {
      console.error(`Error migrating channel ${channel.name}:`, error.message);
    }
  }
  
  console.log('=== Channels Migration Complete ===\n');
}

async function migrateChannelMessages(channelId, messages) {
  console.log(`  Migrating ${messages.length} messages for channel ${channelId}`);
  
  for (const message of messages) {
    try {
      // Map sender name to user ID
      const senderProfile = await supabase
        .from('profiles')
        .select('id')
        .eq('name', message.sender)
        .single();

      const senderId = senderProfile?.data?.id || null;

      if (!senderId) {
        console.warn(`    Skipping message - sender not found: ${message.sender}`);
        continue;
      }

      const { error } = await supabase
        .from('channel_messages')
        .insert({
          channel_id: channelId,
          text: message.text,
          sender_id: senderId,
          attachment: message.attachment || null,
          created_at: message.timestamp
        });

      if (error) {
        console.error(`    Failed to insert message:`, error.message);
      } else {
        console.log(`    Inserted message from ${message.sender}`);
      }

    } catch (error) {
      console.error(`    Error migrating message:`, error.message);
    }
  }
}

async function migratePrivateMessages() {
  console.log('=== Migrating Private Messages ===');
  
  for (const message of privateMessagesData) {
    try {
      // Map old user IDs to new Supabase UUIDs
      const senderId = userIdMap[message.senderId];
      const receiverId = userIdMap[message.receiverId];

      if (!senderId || !receiverId) {
        console.warn(`Skipping private message - user ID mapping missing: ${message.senderId} -> ${senderId}, ${message.receiverId} -> ${receiverId}`);
        continue;
      }

      // Check if message already exists
      const { data: existingMessage } = await supabase
        .from('private_messages')
        .select('id')
        .eq('text', message.text)
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .eq('created_at', message.timestamp)
        .single();

      if (existingMessage) {
        console.log(`Private message already exists, skipping`);
        continue;
      }

      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          text: message.text,
          attachment: message.attachment || null,
          read: message.read || false,
          created_at: message.timestamp
        });

      if (error) {
        console.error(`Failed to insert private message:`, error.message);
      } else {
        console.log(`Inserted private message from ${senderId} to ${receiverId}`);
      }

    } catch (error) {
      console.error(`Error migrating private message:`, error.message);
    }
  }
  
  console.log('=== Private Messages Migration Complete ===\n');
}

async function main() {
  console.log('Starting data migration to Supabase...\n');
  
  try {
    await migrateUsers();
    await migrateChannels();
    await migratePrivateMessages();
    
    console.log('\n=== Migration Complete ===');
    console.log('Please verify the data in your Supabase dashboard');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
