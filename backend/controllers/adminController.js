import { asyncHandler } from "../middleware/errorHandler.js";
import CafeApplication from "../models/CafeApplication.js";
import User from "../models/User.js";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { io } from "../server.js";
import { ROLES, STATUS, PLANS, SOCKET_EVENTS } from "../constants/plans.js";

class AdminController {
  // Get admin dashboard overview
  static getDashboard = asyncHandler(async (req, res) => {
    // Get user statistics
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: adminUsers, error: adminUsersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "ADMIN");

    const userStats = {
      total_users: totalUsersError ? 0 : totalUsers || 0,
      admin_count: adminUsersError ? 0 : adminUsers || 0,
    };

    // Get cafe statistics
    const { count: activeCafes, error: activeCafesError } = await supabase
      .from("cafes")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");

    const cafeStats = {
      active_cafes: activeCafesError ? 0 : activeCafes || 0,
    };

    // Get application statistics
    const applicationStats = await CafeApplication.getStats();

    // Get support ticket statistics (handle case where table might not exist)
    let supportStats = { open_tickets: 0 };
    try {
      const { count: supportTickets, error: supportTicketsError } =
        await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "OPEN");

      supportStats = {
        open_tickets: supportTicketsError ? 0 : supportTickets || 0,
      };
    } catch (error) {
      console.warn("Support tickets table not found - using default value");
      supportStats = { open_tickets: 0 };
    }

    // Get recent applications
    const recentApplications = await CafeApplication.getAll(1, 5);

    // Get system notifications (placeholder - notifications table may not exist yet)
    let notifications = [];
    try {
      const { data: notificationsData, error: notificationsError } =
        await supabase
          .from("notifications")
          .select("*")
          .or(`user_id.eq.${req.user.id},user_id.is.null`)
          .order("created_at", { ascending: false })
          .limit(10);

      if (!notificationsError) {
        notifications = notificationsData || [];
      }
    } catch (error) {
      // Notifications table might not exist yet - that's ok
      console.warn("Notifications table not found - using empty array");
    }

    // Calculate growth metrics from historical data
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user growth
    const { count: lastMonthUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .lt("created_at", currentMonth.toISOString());

    const userGrowthCount = (totalUsers || 0) - (lastMonthUsers || 0);
    const userGrowthPercent =
      lastMonthUsers > 0
        ? Math.round((userGrowthCount / lastMonthUsers) * 100)
        : 0;

    // Get cafe growth
    const { count: lastMonthCafes } = await supabase
      .from("cafes")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .lt("created_at", currentMonth.toISOString());

    const cafeGrowthCount = (activeCafes || 0) - (lastMonthCafes || 0);
    const cafeGrowthPercent =
      lastMonthCafes > 0
        ? Math.round((cafeGrowthCount / lastMonthCafes) * 100)
        : 0;

    // Get application growth
    const { count: lastMonthApplications } = await supabase
      .from("cafe_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING")
      .lt("created_at", currentMonth.toISOString());

    const applicationGrowthCount =
      (applicationStats.pendingCount || 0) - (lastMonthApplications || 0);

    // Get support ticket growth
    let lastMonthTickets = 0;
    try {
      const result = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "OPEN")
        .lt("created_at", currentMonth.toISOString());
      lastMonthTickets = result.count || 0;
    } catch (error) {
      console.warn("Support tickets table not found for growth calculation");
      lastMonthTickets = 0;
    }

    const supportGrowthCount =
      (supportStats.open_tickets || 0) - (lastMonthTickets || 0);

    const growthMetrics = {
      userGrowth:
        userGrowthPercent !== 0
          ? `${userGrowthPercent > 0 ? "+" : ""}${userGrowthPercent}%`
          : null,
      userGrowthType:
        userGrowthPercent > 0
          ? "positive"
          : userGrowthPercent < 0
          ? "negative"
          : "neutral",

      cafeGrowth:
        cafeGrowthPercent !== 0
          ? `${cafeGrowthPercent > 0 ? "+" : ""}${cafeGrowthPercent}%`
          : null,
      cafeGrowthType:
        cafeGrowthPercent > 0
          ? "positive"
          : cafeGrowthPercent < 0
          ? "negative"
          : "neutral",

      applicationGrowth:
        applicationGrowthCount !== 0
          ? `${applicationGrowthCount > 0 ? "+" : ""}${applicationGrowthCount}`
          : null,
      applicationGrowthType:
        applicationGrowthCount > 0
          ? "positive"
          : applicationGrowthCount < 0
          ? "negative"
          : "neutral",

      supportGrowth:
        supportGrowthCount !== 0
          ? `${supportGrowthCount > 0 ? "+" : ""}${supportGrowthCount}`
          : null,
      supportGrowthType:
        supportGrowthCount > 0
          ? "negative"
          : supportGrowthCount < 0
          ? "positive"
          : "neutral", // Less tickets is good
    };

    res.json({
      success: true,
      data: {
        stats: {
          users: userStats,
          cafes: cafeStats,
          applications: applicationStats,
          support: supportStats,
          growth: growthMetrics,
        },
        recentApplications: recentApplications.applications,
        notifications: notifications,
      },
    });
  });

  // Get all cafe applications with filters
  static getApplications = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      planType,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const filters = {
      status,
      planType,
      search,
      dateFrom,
      dateTo,
    };

    const result = await CafeApplication.getAll(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.json({
      success: true,
      data: result,
    });
  });

  // Get single application details
  static getApplication = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const application = await CafeApplication.getById(applicationId);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({
      success: true,
      data: {
        application,
      },
    });
  });

  // Approve cafe application
  static approveApplication = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    const application = await CafeApplication.getById(applicationId);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (
      application.status !== "PENDING" &&
      application.status !== "UNDER_REVIEW"
    ) {
      return res.status(400).json({
        error: "Invalid status",
        message: "Only pending or under review applications can be approved",
      });
    }

    try {
      // Update application status using Supabase
      const { error: updateError } = await supabase
        .from("cafe_applications")
        .update({
          status: "APPROVED",
          admin_notes: adminNotes,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) {
        throw updateError;
      }

      // Update user role to CAFE_OWNER using Supabase Admin (requires elevated permissions)
      const { error: userUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          role: ROLES.CAFE_OWNER,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.user_id);

      if (userUpdateError) {
        throw userUpdateError;
      }

      // Create cafe record using Supabase Admin (requires elevated permissions)
      const { data: cafe, error: cafeError } = await supabaseAdmin
        .from("cafes")
        .insert({
          owner_id: application.user_id,
          name: application.cafe_name,
          description: application.cafe_description,
          address: application.address,
          city: application.city,
          postal_code: application.postal_code,
          phone: application.phone,
          email: application.email,
          website_url: application.website_url,
          plan: application.plan_type, // Add the plan from the application
          status: "ACTIVE", // Set cafe status to active when approved
        })
        .select()
        .single();

      if (cafeError) {
        throw cafeError;
      }

      // Create subscription plan using constants
      const planDetails = PLANS[application.plan_type];

      const { error: planError } = await supabaseAdmin
        .from("subscription_plans")
        .insert({
          cafe_id: cafe.id,
          plan_type: application.plan_type,
          monthly_order_limit: planDetails.monthlyOrderQuota,
        });

      if (planError) {
        throw planError;
      }

      // Emit real-time notification to the cafe owner
      io.to(`user:${application.user_id}`).emit("application:approved", {
        type: "application:approved",
        data: {
          applicationId: application.id,
          cafeName: application.cafe_name,
          cafeId: cafe.id,
          planType: application.plan_type,
        },
      });

      // Create notification for the user (placeholder - notifications table may not exist yet)
      try {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: application.user_id,
            title: "Application Approved!",
            message: `Congratulations! Your cafe "${application.cafe_name}" has been approved.`,
            type: "application:approved",
            data: JSON.stringify({
              applicationId: application.id,
              cafeId: cafe.id,
            }),
          });

        if (notificationError) {
          console.warn("Failed to create notification:", notificationError);
        }
      } catch (error) {
        console.warn(
          "Notifications table not found - skipping notification creation"
        );
      }

      res.json({
        success: true,
        message: "Application approved successfully",
        data: {
          application: {
            id: application.id,
            status: "APPROVED",
            adminNotes,
            reviewedAt: new Date().toISOString(),
          },
          cafe: {
            id: cafe.id,
            name: cafe.name,
          },
        },
      });
    } catch (error) {
      console.error("Error approving application:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  });

  // Reject cafe application
  static rejectApplication = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    const application = await CafeApplication.getById(applicationId);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (
      application.status !== "PENDING" &&
      application.status !== "UNDER_REVIEW"
    ) {
      return res.status(400).json({
        error: "Invalid status",
        message: "Only pending or under review applications can be rejected",
      });
    }

    // Update application status
    await CafeApplication.updateStatus(
      applicationId,
      "REJECTED",
      adminNotes,
      adminId
    );

    // Update user role back to USER
    await User.updateRole(application.user_id, ROLES.USER);

    // Emit real-time notification to the user
    io.to(`user:${application.user_id}`).emit("application:rejected", {
      type: "application:rejected",
      data: {
        applicationId: application.id,
        cafeName: application.cafe_name,
        adminNotes,
      },
    });

    // Create notification for the user (placeholder - notifications table may not exist yet)
    try {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: application.user_id,
          title: "Application Rejected",
          message: `Your cafe application "${
            application.cafe_name
          }" has been rejected. ${adminNotes || ""}`,
          type: "application:rejected",
          data: JSON.stringify({ applicationId: application.id }),
        });

      if (notificationError) {
        console.warn("Failed to create notification:", notificationError);
      }
    } catch (error) {
      console.warn(
        "Notifications table not found - skipping notification creation"
      );
    }

    res.json({
      success: true,
      message: "Application rejected successfully",
      data: {
        application: {
          id: application.id,
          status: "REJECTED",
          adminNotes,
          reviewedAt: new Date().toISOString(),
        },
      },
    });
  });

  // Get all users with management options
  static getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, isActive, search } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query - get users first, then manually join cafe data
    let query = supabase.from("users").select("*");

    // Apply filters
    if (role) {
      query = query.eq("role", role);
    }

    if (isActive !== undefined) {
      query = query.eq("is_active", isActive === "true");
    }

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw countError;
    }

    // Get users with pagination
    const { data: users, error: usersError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (usersError) {
      throw usersError;
    }

    // Get cafe data for all users who own cafes
    const userIds = (users || []).map((user) => user.id);
    const { data: cafes, error: cafesError } = await supabase
      .from("cafes")
      .select("id, name, plan, status, owner_id")
      .in("owner_id", userIds);

    if (cafesError) {
      console.error("Error fetching cafes:", cafesError);
    }

    // Create a map of owner_id to cafe data
    const cafeMap = {};
    (cafes || []).forEach((cafe) => {
      cafeMap[cafe.owner_id] = cafe;
    });

    // Transform data to include package information
    const transformedUsers = (users || []).map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      // Cafe information for cafe owners
      cafe: cafeMap[user.id]
        ? {
            id: cafeMap[user.id].id,
            name: cafeMap[user.id].name,
            plan: cafeMap[user.id].plan,
            status: cafeMap[user.id].status,
          }
        : null,
    }));

    const totalCount = count || 0;

    res.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  });

  // Update user role
  static updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = Object.values(ROLES);

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role",
        message: `Role must be one of: ${validRoles.join(", ")}`,
      });
    }

    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent self-demotion from admin
    if (
      req.user.id === userId &&
      req.user.role === ROLES.ADMIN &&
      role !== ROLES.ADMIN
    ) {
      return res.status(400).json({
        error: "Cannot change your own admin role",
        message: "You cannot demote yourself from admin role",
      });
    }

    const updatedUser = await User.updateRole(userId, role);

    // Emit real-time notification to the user
    io.to(`user:${userId}`).emit("role:updated", {
      type: "role:updated",
      data: {
        oldRole: user.role,
        newRole: role,
        updatedBy: req.user.email,
      },
    });

    // Create notification for the user (placeholder - notifications table may not exist yet)
    try {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: "Role Updated",
          message: `Your role has been updated from ${user.role} to ${role} by ${req.user.email}`,
          type: "notification:new",
          data: JSON.stringify({ oldRole: user.role, newRole: role }),
        });

      if (notificationError) {
        console.warn("Failed to create notification:", notificationError);
      }
    } catch (error) {
      console.warn(
        "Notifications table not found - skipping notification creation"
      );
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          updatedAt: updatedUser.updated_at,
        },
      },
    });
  });

  // Ban/Unban user
  static toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent self-ban
    if (req.user.id === userId) {
      return res.status(400).json({
        error: "Cannot change your own status",
        message: "You cannot ban/unban yourself",
      });
    }

    const updatedUser = isActive
      ? await User.reactivate(userId)
      : await User.deactivate(userId);

    const action = isActive ? "reactivated" : "deactivated";

    // Emit real-time notification to the user
    io.to(`user:${userId}`).emit("status:updated", {
      type: "status:updated",
      data: {
        isActive,
        updatedBy: req.user.email,
      },
    });

    res.json({
      success: true,
      message: `User ${action} successfully`,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          isActive: updatedUser.is_active,
          updatedAt: updatedUser.updated_at,
        },
      },
    });
  });

  // Delete user and all associated data
  static deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent self-deletion
    if (req.user.id === userId) {
      return res.status(400).json({
        error: "Cannot delete your own account",
        message: "You cannot delete yourself",
      });
    }

    try {
      // Delete user and all associated data (CASCADE will handle related records)
      const { error: deleteError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        throw deleteError;
      }

      res.json({
        success: true,
        message: "User and all associated data deleted successfully",
        data: {
          deletedUser: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        error: "Failed to delete user",
        message: error.message,
      });
    }
  });

  // Get system notifications (placeholder - notifications table may not exist yet)
  static getNotifications = asyncHandler(async (req, res) => {
    try {
      // For now, return empty notifications since the table might not exist
      res.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            currentPage: parseInt(page) || 1,
            totalPages: 0,
            totalCount: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    } catch (error) {
      console.warn("Notifications not available:", error);
      res.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    }
  });

  // Mark notification as read (placeholder - notifications table may not exist yet)
  static markNotificationRead = asyncHandler(async (req, res) => {
    try {
      // For now, return success since notifications are not fully implemented
      res.json({
        success: true,
        message: "Notification marked as read",
        data: {
          notification: { id: req.params.notificationId, is_read: true },
        },
      });
    } catch (error) {
      console.warn("Notifications not available:", error);
      res.json({
        success: true,
        message: "Notification marked as read",
        data: {
          notification: { id: req.params.notificationId, is_read: true },
        },
      });
    }
  });
}

export default AdminController;
