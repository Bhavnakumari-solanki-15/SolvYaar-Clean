// This is a simple test script to verify your badge service works
// Run with: node test-badge-service.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user - replace with a valid user ID from your auth.users table
// You can check this in the Supabase dashboard
const TEST_USER_ID = "YOUR_TEST_USER_ID"; // ⚠️ Replace this with a real user ID

async function testBadgeService() {
  console.log('💡 Badge Service Test');
  console.log('====================');
  
  // 1. Check connection
  console.log('\n📡 Testing Supabase connection...');
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.log('✅ Connected to Supabase as user:', session.user.id);
  } else {
    console.log('⚠️ No active session. Running in anonymous mode.');
  }
  
  // 2. Check if badges table exists
  console.log('\n🔍 Checking if badges table exists...');
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('count(*)', { count: 'exact' })
      .limit(1);
      
    if (error) {
      console.error('❌ Error accessing badges table:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
    } else {
      console.log('✅ Badges table exists');
    }
  } catch (error) {
    console.error('❌ Error checking badges table:', error.message);
  }
  
  // 3. Check if badge_category enum exists
  console.log('\n🔍 Checking badge_category enum...');
  try {
    // Try to insert a badge with a valid category to test the enum
    if (TEST_USER_ID !== "YOUR_TEST_USER_ID") {
      const testBadge = {
        user_id: TEST_USER_ID,
        name: "Test Badge",
        description: "This is a test badge",
        category: "algebra", // Using a valid category from the enum
        icon: "🧪"
      };
      
      const { data, error } = await supabase
        .from('badges')
        .insert([testBadge])
        .select();
        
      if (error) {
        if (error.message.includes('badge_category')) {
          console.error('❌ Error with badge_category enum:', error.message);
        } else {
          console.error('❌ Error inserting test badge:', error.message);
        }
      } else {
        console.log('✅ Successfully inserted test badge with category enum');
        
        // Clean up the test badge
        const { error: deleteError } = await supabase
          .from('badges')
          .delete()
          .eq('id', data[0].id);
          
        if (deleteError) {
          console.error('⚠️ Warning: Could not delete test badge:', deleteError.message);
        } else {
          console.log('✅ Successfully cleaned up test badge');
        }
      }
    } else {
      console.log('⚠️ Skipping enum test. Please replace TEST_USER_ID with a valid user ID');
    }
  } catch (error) {
    console.error('❌ Error testing enum:', error.message);
  }
  
  // 4. List all badges in the system
  console.log('\n📊 Listing all badges in the system...');
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error('❌ Error fetching badges:', error.message);
    } else if (data.length === 0) {
      console.log('ℹ️ No badges found in the database');
    } else {
      console.log(`✅ Found ${data.length} badges:`);
      data.forEach((badge, i) => {
        console.log(`   ${i+1}. ${badge.name} (${badge.category}) - User: ${badge.user_id.slice(0,8)}...`);
      });
    }
  } catch (error) {
    console.error('❌ Error listing badges:', error.message);
  }
  
  console.log('\n🏁 Test completed');
}

testBadgeService().catch(console.error); 