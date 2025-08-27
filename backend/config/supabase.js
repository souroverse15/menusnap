import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase client with anon key (for regular operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client with service role key (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) throw error;

    console.log("✅ Supabase connection successful");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection failed:", error.message);
    throw error;
  }
}

// Initialize Supabase (replaces PostgreSQL pool)
export async function initSupabase() {
  try {
    await testSupabaseConnection();
    console.log("🚀 Supabase client initialized successfully");
    return supabase;
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    throw error;
  }
}
