import { supabase } from "../config/supabase.js";

class User {
  // Get user by Clerk ID
  static async getByClerkId(clerkId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error getting user by Clerk ID:", error);
      throw error;
    }
  }

  // Get user by ID
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  // Get user by email
  static async getByEmail(email) {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const {
        clerkId,
        email,
        firstName,
        lastName,
        profileImageUrl,
        role = "USER",
      } = userData;

      const result = await pool.query(
        `
        INSERT INTO users (clerk_id, email, first_name, last_name, profile_image_url, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [clerkId, email, firstName, lastName, profileImageUrl, role]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      fields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      const query = `
        UPDATE users 
        SET ${fields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Update user role
  static async updateRole(id, role) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  // Get all users with pagination
  static async getAll(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = "WHERE 1=1";
      const values = [];
      let paramCount = 1;

      // Apply filters
      if (filters.role) {
        whereClause += ` AND role = $${paramCount}`;
        values.push(filters.role);
        paramCount++;
      }

      if (filters.isActive !== undefined) {
        whereClause += ` AND is_active = $${paramCount}`;
        values.push(filters.isActive);
        paramCount++;
      }

      if (filters.search) {
        whereClause += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get users
      values.push(limit, offset);
      const query = `
        SELECT * FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const result = await pool.query(query, values);

      return {
        users: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  // Deactivate user
  static async deactivate(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }

  // Reactivate user
  static async reactivate(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error reactivating user:", error);
      throw error;
    }
  }

  // Get user stats
  static async getStats() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'CAFE_OWNER' THEN 1 END) as cafe_owner_count,
          COUNT(CASE WHEN role = 'USER' THEN 1 END) as user_count,
          COUNT(CASE WHEN role = 'PENDING_CAFE' THEN 1 END) as pending_cafe_count,
          COUNT(CASE WHEN role = 'DEV' THEN 1 END) as dev_count,
          COUNT(CASE WHEN role = 'MOD' THEN 1 END) as mod_count,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
        FROM users
      `);

      return result.rows[0];
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }
}

export default User;
