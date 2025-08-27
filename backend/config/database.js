import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Database connected successfully at:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Initialize database tables
export const initDatabase = async () => {
  try {
    await testConnection();
    await createTables();
    await insertDefaultData();
    console.log("✅ Database initialization completed");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

// Create database tables
const createTables = async () => {
  const client = await pool.connect();

  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Users table (synced with Clerk)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clerk_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        profile_image_url TEXT,
        role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'CAFE_OWNER', 'USER', 'PENDING_CAFE', 'DEV', 'MOD')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cafes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cafes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'US',
        phone VARCHAR(20),
        email VARCHAR(255),
        website_url TEXT,
        logo_url TEXT,
        cover_image_url TEXT,
        business_hours JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cafe applications table
    await client.query(`
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
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('application:new', 'application:approved', 'application:rejected', 'notification:new', 'support:message', 'system')),
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Support tickets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED', 'RESOLVED')),
        priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
        assigned_to UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Support messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        attachments JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subscription plans table
    await client.query(`
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
      )
    `);

    // Create indexes for better performance
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_cafes_owner_id ON cafes(owner_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_cafe_applications_user_id ON cafe_applications(user_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_cafe_applications_status ON cafe_applications(status)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)"
    );

    console.log("✅ Database tables created successfully");
  } finally {
    client.release();
  }
};

// Insert default data
const insertDefaultData = async () => {
  const client = await pool.connect();

  try {
    // Check if super admin exists
    const superAdminCheck = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [process.env.SUPER_ADMIN_EMAIL]
    );

    if (superAdminCheck.rows.length === 0) {
      console.log(
        "ℹ️  Super admin will be created when they first sign in with Clerk"
      );
    }

    console.log("✅ Default data initialization completed");
  } finally {
    client.release();
  }
};

// Graceful shutdown
process.on("SIGINT", () => {
  pool.end(() => {
    console.log("Database pool has ended");
  });
});

process.on("SIGTERM", () => {
  pool.end(() => {
    console.log("Database pool has ended");
  });
});
