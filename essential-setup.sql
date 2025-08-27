-- Essential MenuSnap Database Setup
-- Run this in Supabase SQL Editor first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (essential for login)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk UID
    email TEXT UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'DEV', 'MOD', 'CAFE_OWNER', 'USER', 'PENDING_CAFE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Test the setup
SELECT 'Database setup complete! ✅' as status;
