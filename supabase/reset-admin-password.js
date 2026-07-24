// Script to reset admin user password using Supabase Auth API
// Run: node supabase/reset-admin-password.js

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

async function resetAdminPassword() {
  try {
    console.log('Resetting admin user password...');

    // Get the admin user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const adminUser = users.find(user => user.email === 'admin@pixelnest.com');

    if (!adminUser) {
      console.error('Admin user not found. Run create-admin-user.js first.');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.email);
    console.log('User ID:', adminUser.id);

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { 
        password: 'admin123',
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      process.exit(1);
    }

    console.log('✓ Password reset successfully');
    console.log('');
    console.log('Admin user credentials:');
    console.log('  Email: admin@pixelnest.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
