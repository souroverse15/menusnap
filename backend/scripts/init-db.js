#!/usr/bin/env node

// Database initialization script
// Run this manually if you want to initialize the database separately

import { initDatabase } from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Starting database initialization...");

  try {
    await initDatabase();
    console.log("✅ Database initialization completed successfully!");
    console.log("");
    console.log("📊 The following has been set up:");
    console.log("  • All tables created with proper relationships");
    console.log("  • Indexes created for optimal performance");
    console.log("  • Analytics views for KPIs and reporting");
    console.log("  • Materialized view for daily metrics");
    console.log("");
    console.log("🔐 Super admin setup:");
    console.log(`  • Email: ${process.env.SUPER_ADMIN_EMAIL}`);
    console.log("  • Will be created automatically when they first sign in");
    console.log("");
    console.log("🎉 Your MenuSnap database is ready!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

main();
