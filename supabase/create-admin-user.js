// Script to create the default admin user using Supabase Auth API
// Run: node supabase/create-admin-user.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // First, delete any existing improperly created user from database
    console.log('Checking for existing user in database...');
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@pixelnest.com')
      .single();

    if (existingProfile) {
      console.log('Found existing profile, deleting...');
      await supabase.from('profiles').delete().eq('email', 'admin@pixelnest.com');
      // Also try to delete from auth.users if it exists there
      try {
        await supabase.rpc('admin_delete_user', { userid: existingProfile.id });
      } catch (e) {
        // Ignore if function doesn't exist
      }
      console.log('✓ Existing user deleted');
    }

    // Create user using Supabase Auth API
    console.log('Creating user via Auth API...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@pixelnest.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin',
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      process.exit(1);
    }

    console.log('✓ Auth user created successfully');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);

    // The profile will be created automatically by the trigger
    console.log('✓ Profile will be created automatically by trigger');
    console.log('');
    console.log('Admin user created successfully!');
    console.log('Login credentials:');
    console.log('  Email: admin@pixelnest.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
