-- MenuSnap Database Schema
-- PostgreSQL Database Schema for MenuSnap SaaS Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (aligned with specification)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk UID as per spec
    email TEXT UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'DEV', 'MOD', 'CAFE_OWNER', 'USER', 'PENDING_CAFE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields from original schema (keeping for compatibility)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cafes table (aligned with specification)
CREATE TABLE IF NOT EXISTS cafes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id TEXT NOT NULL, -- Clerk UID as per spec
    name TEXT NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    social_links JSONB, -- Facebook, Instagram, etc.
    plan VARCHAR(10) NOT NULL CHECK (plan IN ('FREE', 'PLUS', 'PRO')),
    status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'BANNED')),
    payment_info JSONB, -- captured but unused v1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields from original schema (keeping for compatibility)
    description TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    email VARCHAR(255),
    website_url TEXT,
    cover_image_url TEXT,
    business_hours JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cafe applications table
CREATE TABLE IF NOT EXISTS cafe_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cafe_name VARCHAR(255) NOT NULL,
    cafe_description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'US',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website_url TEXT,
    business_license TEXT,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('FREE', 'PLUS', 'PRO')),
    payment_details JSONB,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('application:new', 'application:approved', 'application:rejected', 'notification:new', 'support:message', 'system')),
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED', 'RESOLVED')),
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('FREE', 'PLUS', 'PRO')),
    monthly_order_limit INTEGER NOT NULL,
    current_month_orders INTEGER DEFAULT 0,
    billing_cycle_start DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Future tables (for post-MVP development)

-- Menu categories table
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    allergens TEXT[],
    dietary_info JSONB,
    preparation_time INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED')),
    order_type VARCHAR(20) DEFAULT 'PICKUP' CHECK (order_type IN ('PICKUP', 'DINE_IN', 'DELIVERY')),
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    queue_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    customizations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_cafes_owner_id ON cafes(owner_id);
CREATE INDEX IF NOT EXISTS idx_cafe_applications_user_id ON cafe_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_cafe_applications_status ON cafe_applications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_cafe_id ON menu_items(cafe_id);
CREATE INDEX IF NOT EXISTS idx_orders_cafe_id ON orders(cafe_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Analytics Views (Lightweight PostgreSQL-based analytics)

-- View: Café counts by plan
CREATE OR REPLACE VIEW v_cafe_counts_by_plan AS
SELECT 
    plan,
    COUNT(*) as cafe_count,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'BANNED' THEN 1 END) as banned_count
FROM cafes 
GROUP BY plan;

-- View: Monthly Recurring Revenue (MRR)
CREATE OR REPLACE VIEW v_mrr AS
SELECT 
    CASE 
        WHEN plan = 'FREE' THEN 0
        WHEN plan = 'PLUS' THEN 29
        WHEN plan = 'PRO' THEN 79
        ELSE 0
    END as plan_price,
    plan,
    COUNT(*) as active_cafes,
    COUNT(*) * CASE 
        WHEN plan = 'FREE' THEN 0
        WHEN plan = 'PLUS' THEN 29
        WHEN plan = 'PRO' THEN 79
        ELSE 0
    END as monthly_revenue
FROM cafes 
WHERE status = 'ACTIVE'
GROUP BY plan;

-- View: Overall system metrics
CREATE OR REPLACE VIEW v_system_metrics AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'USER') as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'CAFE_OWNER') as cafe_owners,
    (SELECT COUNT(*) FROM cafes WHERE status = 'ACTIVE') as active_cafes,
    (SELECT COUNT(*) FROM cafe_applications WHERE status = 'PENDING') as pending_applications,
    (SELECT SUM(monthly_revenue) FROM v_mrr) as total_mrr,
    (SELECT COUNT(*) FROM support_tickets WHERE status IN ('OPEN', 'IN_PROGRESS')) as open_tickets;

-- Materialized view for daily metrics (refresh daily via cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_metrics AS
SELECT 
    CURRENT_DATE as metric_date,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM cafes WHERE status = 'ACTIVE') as active_cafes,
    (SELECT SUM(monthly_revenue) FROM v_mrr) as mrr,
    (SELECT COUNT(*) FROM cafe_applications WHERE DATE(created_at) = CURRENT_DATE) as new_applications_today,
    (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE) as new_users_today;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_metrics_date ON mv_daily_metrics(metric_date);

-- Sample data for development (optional)
-- This will be handled by the application initialization
