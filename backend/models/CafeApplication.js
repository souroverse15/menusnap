import { supabase } from "../config/supabase.js";

class CafeApplication {
  // Create new cafe application
  static async create(applicationData) {
    try {
      const {
        userId,
        cafeName,
        cafeDescription,
        logoUrl,
        address,
        city,
        postalCode,
        phone,
        email,
        websiteUrl,
        socialLinks,
        businessLicense,
        planType,
        paymentDetails,
      } = applicationData;

      const { data, error } = await supabase
        .from("cafe_applications")
        .insert({
          user_id: userId,
          cafe_name: cafeName,
          cafe_description: cafeDescription,
          logo_url: logoUrl,
          address,
          city,
          postal_code: postalCode,
          phone,
          email,
          website_url: websiteUrl,
          social_links: socialLinks,
          business_license: businessLicense,
          plan_type: planType,
          payment_details: paymentDetails,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error creating cafe application:", error);
      throw error;
    }
  }

  // Get application by ID
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from("cafe_applications")
        .select(
          `
          *,
          users!cafe_applications_user_id_fkey(email, first_name, last_name),
          reviewers:users!cafe_applications_reviewed_by_fkey(email, first_name, last_name)
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error getting cafe application by ID:", error);
      throw error;
    }
  }

  // Get application by user ID
  static async getByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from("cafe_applications")
        .select(
          `
          *,
          users!cafe_applications_user_id_fkey(email, first_name, last_name)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error getting cafe application by user ID:", error);
      throw error;
    }
  }

  // Get all applications with pagination and filters
  static async getAll(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase.from("cafe_applications").select(`
          *,
          users!cafe_applications_user_id_fkey(email, first_name, last_name),
          reviewers:users!cafe_applications_reviewed_by_fkey(email, first_name, last_name)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.planType) {
        query = query.eq("plan_type", filters.planType);
      }

      if (filters.search) {
        query = query.or(
          `cafe_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      // Get total count first
      const { count, error: countError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true });

      if (countError) {
        throw countError;
      }

      const totalCount = count || 0;

      // Get applications with pagination
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Transform data to match frontend expectations
      const transformedApplications = (data || []).map((app) => ({
        id: app.id,
        cafeName: app.cafe_name,
        applicant: app.users
          ? `${app.users.first_name || ""} ${
              app.users.last_name || ""
            }`.trim() || app.users.email
          : "Unknown",
        plan: app.plan_type,
        status: app.status,
        submittedAt: app.created_at,
        // Keep original data for admin use
        ...app,
      }));

      return {
        applications: transformedApplications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting all cafe applications:", error);
      throw error;
    }
  }

  // Update application status
  static async updateStatus(id, status, adminNotes = null, reviewedBy = null) {
    try {
      const { data, error } = await supabase
        .from("cafe_applications")
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error updating cafe application status:", error);
      throw error;
    }
  }

  // Update application
  static async update(id, updateData) {
    try {
      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      // Prepare update data
      const updateFields = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // Handle special fields
      if (updateFields.paymentDetails) {
        updateFields.payment_details = updateFields.paymentDetails;
        delete updateFields.paymentDetails;
      }

      const { data, error } = await supabase
        .from("cafe_applications")
        .update(updateFields)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error updating cafe application:", error);
      throw error;
    }
  }

  // Delete application
  static async delete(id) {
    try {
      const { data, error } = await supabase
        .from("cafe_applications")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error deleting cafe application:", error);
      throw error;
    }
  }

  // Get pending applications count
  static async getPendingCount() {
    try {
      const { count, error } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("Error getting pending applications count:", error);
      throw error;
    }
  }

  // Get application stats
  static async getStats() {
    try {
      // Get total count
      const { count: totalApplications, error: totalError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true });

      if (totalError) throw totalError;

      // Get counts by status
      const { count: pendingCount, error: pendingError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      if (pendingError) throw pendingError;

      const { count: approvedCount, error: approvedError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "APPROVED");

      if (approvedError) throw approvedError;

      const { count: rejectedCount, error: rejectedError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "REJECTED");

      if (rejectedError) throw rejectedError;

      const { count: underReviewCount, error: underReviewError } =
        await supabase
          .from("cafe_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "UNDER_REVIEW");

      if (underReviewError) throw underReviewError;

      // Get counts by plan type
      const { count: freePlanCount, error: freePlanError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .eq("plan_type", "FREE");

      if (freePlanError) throw freePlanError;

      const { count: plusPlanCount, error: plusPlanError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .eq("plan_type", "PLUS");

      if (plusPlanError) throw plusPlanError;

      const { count: proPlanCount, error: proPlanError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .eq("plan_type", "PRO");

      if (proPlanError) throw proPlanError;

      // Get recent counts
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { count: applicationsThisWeek, error: weekError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      if (weekError) throw weekError;

      const { count: applicationsThisMonth, error: monthError } = await supabase
        .from("cafe_applications")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString());

      if (monthError) throw monthError;

      return {
        total_applications: totalApplications || 0,
        pending_count: pendingCount || 0,
        approved_count: approvedCount || 0,
        rejected_count: rejectedCount || 0,
        under_review_count: underReviewCount || 0,
        free_plan_count: freePlanCount || 0,
        plus_plan_count: plusPlanCount || 0,
        pro_plan_count: proPlanCount || 0,
        applications_this_week: applicationsThisWeek || 0,
        applications_this_month: applicationsThisMonth || 0,
      };
    } catch (error) {
      console.error("Error getting application stats:", error);
      throw error;
    }
  }

  // Check if user has existing application
  static async hasExistingApplication(userId) {
    try {
      const { data, error } = await supabase
        .from("cafe_applications")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["PENDING", "UNDER_REVIEW", "APPROVED"]);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking existing application:", error);
      throw error;
    }
  }
}

export default CafeApplication;
