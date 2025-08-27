-- Essential MenuSnap Tables for Cafe Applications
-- Run this in Supabase SQL Editor

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

-- Cafe Applications table (essential for cafe onboarding)
CREATE TABLE IF NOT EXISTS cafe_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_name VARCHAR(255) NOT NULL,
  cafe_description TEXT,
  logo_url TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
  phone VARCHAR(20) NOT NULL,
  email TEXT NOT NULL,
  website_url TEXT,
  social_links JSONB,
  business_license VARCHAR(255),
  plan_type VARCHAR(10) NOT NULL CHECK (plan_type IN ('FREE', 'PLUS', 'PRO')),
  payment_details JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
  admin_notes TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_cafe_applications_user_id ON cafe_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_cafe_applications_status ON cafe_applications(status);
CREATE INDEX IF NOT EXISTS idx_cafe_applications_plan_type ON cafe_applications(plan_type);

-- Insert super admin user if not exists
INSERT INTO users (id, email, role, first_name, last_name) 
VALUES ('admin', 'souroveahmed15@gmail.com', 'ADMIN', 'Sourove', 'Ahmed')
ON CONFLICT (id) DO NOTHING;

-- Test the setup
SELECT 'Database setup complete! ✅' as status;
