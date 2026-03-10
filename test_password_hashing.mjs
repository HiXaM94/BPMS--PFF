import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordHashing() {
    console.log('--- Testing Password Hashing ---');

    const testEmail = 'test_hash@flowly.io';
    const testPassword = 'SecurePassword123!';
    const wrongPassword = 'WrongPassword456!';

    // 1. Create a test user (we simulate this by manual insert/update if possible, or using create_employee)
    // For the sake of this test, we assume there is a user we can update.
    const { data: userData } = await supabase.from('users').select('id').eq('email', testEmail).maybeSingle();

    if (!userData) {
        console.log('Skipping real DB update test - no test user found. Please run this in an environment where you can create a test user.');
        return;
    }

    const userId = userData.id;

    console.log(`Testing with user ID: ${userId}`);

    // 2. Update password via RPC
    console.log('Updating password via update_profile_password...');
    const { error: updateError } = await supabase.rpc('update_profile_password', {
        p_user_id: userId,
        p_role: 'EMPLOYEE',
        p_new_password: testPassword
    });

    if (updateError) {
        console.error('Update failed:', updateError.message);
        return;
    }
    console.log('Password updated successfully.');

    // 3. Verify storage is hashed
    const { data: storedData } = await supabase.from('users').select('password_hash').eq('id', userId).single();
    console.log('Stored password format:', storedData.password_hash);

    if (storedData.password_hash === testPassword) {
        console.error('CRITICAL FAILURE: Password stored in PLAIN TEXT!');
    } else if (storedData.password_hash.startsWith('$2')) {
        console.log('SUCCESS: Password correctly stored as a bcrypt/crypt hash.');
    } else {
        console.log('Password stored as (starts with):', storedData.password_hash.substring(0, 5));
    }

    // 4. Verify login with correct password
    console.log('Verifying login with CORRECT password...');
    const { data: loginSuccess, error: loginError } = await supabase.rpc('verify_login', {
        p_email: testEmail,
        p_password: testPassword
    });

    if (loginError) {
        console.error('Login verify RPC failed:', loginError.message);
    } else if (loginSuccess) {
        console.log('SUCCESS: Login verified with correct password.');
    } else {
        console.error('FAILURE: Login failed with correct password.');
    }

    // 5. Verify login with WRONG password
    console.log('Verifying login with WRONG password...');
    const { data: loginFail } = await supabase.rpc('verify_login', {
        p_email: testEmail,
        p_password: wrongPassword
    });

    if (loginFail === null) {
        console.log('SUCCESS: Login correctly rejected wrong password.');
    } else {
        console.error('FAILURE: Login accepted wrong password!');
    }
}

testPasswordHashing();
