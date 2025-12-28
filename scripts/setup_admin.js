
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = "acharyaomshah@gmail.com";
    const password = "omshahastrologer";

    console.log(`Checking if user ${email} exists...`);

    // List users to check if exists (Admin API)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log("User already exists. Updating password...");
        const { data, error } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password }
        );
        if (error) {
            console.error("Error updating password:", error);
        } else {
            console.log("Password updated successfully.");
        }
    } else {
        console.log("User does not exist. Creating...");
        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: "Admin" }
        });

        if (error) {
            console.error("Error creating user:", error);
        } else {
            console.log("User created successfully:", data.user.id);
        }
    }
}

createAdmin();
