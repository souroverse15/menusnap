import { asyncHandler } from "../middleware/errorHandler.js";
import CafeApplication from "../models/CafeApplication.js";
import User from "../models/User.js";
import { supabase } from "../config/supabase.js";
import { io } from "../server.js";
import { ROLES, SOCKET_EVENTS } from "../constants/plans.js";

class CafeController {
  // Submit cafe application
  static submitApplication = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Check if user already has an existing application
    const existingApplication = await CafeApplication.hasExistingApplication(
      userId
    );
    if (existingApplication) {
      return res.status(409).json({
        error: "Application already exists",
        message: "You already have a pending or approved cafe application",
      });
    }

    // Create application
    const applicationData = {
      userId,
      ...req.validatedBody,
    };

    const application = await CafeApplication.create(applicationData);

    // Update user role to PENDING_CAFE
    await User.updateRole(userId, ROLES.PENDING_CAFE);

    // Emit real-time notification to admins
    io.to("admin").emit(SOCKET_EVENTS.APPLICATION_NEW, {
      type: SOCKET_EVENTS.APPLICATION_NEW,
      data: {
        applicationId: application.id,
        cafeName: application.cafe_name,
        userEmail: req.user.email,
        planType: application.plan_type,
        createdAt: application.created_at,
      },
    });

    // Create notification record for admins
    const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select("id")
      .eq("role", ROLES.ADMIN);
    if (!adminError && adminUsers && adminUsers.length > 0) {
      for (const admin of adminUsers) {
        await supabase.from("notifications").insert({
          user_id: admin.id,
          title: "New Cafe Application",
          message: `New application from ${application.cafe_name} (${req.user.email})`,
          type: "application:new",
          data: JSON.stringify({ applicationId: application.id }),
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        application: {
          id: application.id,
          cafeName: application.cafe_name,
          status: application.status,
          planType: application.plan_type,
          createdAt: application.created_at,
        },
      },
    });
  });

  // Get user's cafe application
  static getMyApplication = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const application = await CafeApplication.getByUserId(userId);

    if (!application) {
      return res.status(404).json({
        error: "No application found",
        message: "You have not submitted any cafe application",
      });
    }

    res.json({
      success: true,
      data: {
        application: {
          id: application.id,
          cafeName: application.cafe_name,
          cafeDescription: application.cafe_description,
          address: application.address,
          city: application.city,
          postalCode: application.postal_code,
          phone: application.phone,
          email: application.email,
          websiteUrl: application.website_url,
          businessLicense: application.business_license,
          planType: application.plan_type,
          paymentDetails: application.payment_details,
          status: application.status,
          adminNotes: application.admin_notes,
          reviewedAt: application.reviewed_at,
          createdAt: application.created_at,
          updatedAt: application.updated_at,
        },
      },
    });
  });

  // Update cafe application (only for pending applications)
  static updateApplication = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { applicationId } = req.params;

    const application = await CafeApplication.getById(applicationId);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.user_id !== userId && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "You can only update your own application" });
    }

    if (application.status !== "PENDING") {
      return res.status(400).json({
        error: "Cannot update application",
        message: "Only pending applications can be updated",
      });
    }

    const updatedApplication = await CafeApplication.update(
      applicationId,
      req.validatedBody
    );

    res.json({
      success: true,
      message: "Application updated successfully",
      data: {
        application: updatedApplication,
      },
    });
  });

  // Get cafe dashboard data (for cafe owners)
  static getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get cafe information
    const { data: cafeData, error: cafeError } = await supabase
      .from("cafes")
      .select(
        `
        *,
        subscription_plans(
          plan_type,
          monthly_order_limit,
          current_month_orders,
          is_active
        )
      `
      )
      .eq("owner_id", userId)
      .eq("status", "ACTIVE")
      .single();

    if (cafeError || !cafeData) {
      return res.status(404).json({
        error: "Cafe not found",
        message: "No active cafe found for this user",
      });
    }

    const cafe = {
      ...cafeData,
      plan_type: cafeData.subscription_plans?.[0]?.plan_type || cafeData.plan,
      monthly_order_limit:
        cafeData.subscription_plans?.[0]?.monthly_order_limit || null,
      current_month_orders:
        cafeData.subscription_plans?.[0]?.current_month_orders || 0,
    };

    // Get recent orders
    const { data: recentOrders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("cafe_id", cafe.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get order statistics
    const { data: allOrders, error: allOrdersError } = await supabase
      .from("orders")
      .select("total_amount, status, created_at")
      .eq("cafe_id", cafe.id);

    let totalOrders = 0;
    let monthlyOrders = 0;
    let revenue = 0;

    if (allOrders && !allOrdersError) {
      totalOrders = allOrders.length;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      monthlyOrders = allOrders.filter(
        (order) => new Date(order.created_at) >= thisMonth
      ).length;

      revenue = allOrders
        .filter((order) => order.status === "COMPLETED")
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    }

    // Get notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const stats = {
      totalOrders,
      monthlyOrders,
      orderLimit: cafe.monthly_order_limit || null,
      revenue,
    };

    res.json({
      success: true,
      data: {
        cafe: {
          id: cafe.id,
          name: cafe.name,
          description: cafe.description,
          address: cafe.address,
          city: cafe.city,
          state: cafe.state,
          phone: cafe.phone,
          email: cafe.email,
          websiteUrl: cafe.website_url,
          logoUrl: cafe.logo_url,
          coverImageUrl: cafe.cover_image_url,
          planType: cafe.plan_type,
          isActive: cafe.is_active,
        },
        stats,
        recentOrders,
        notifications: notifications || [],
      },
    });
  });

  // Get public cafes for listing page
  static getPublicCafes = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("cafes")
      .select(
        `
        id,
        name,
        description,
        address,
        city,
        phone,
        logo_url,
        cover_image_url,
        plan
      `
      )
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch cafes");
    }

    res.status(200).json({
      success: true,
      data: data || [],
    });
  });

  // Update cafe information
  static updateCafe = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { cafeId } = req.params;

    // Check if user owns the cafe or is admin
    let cafe;
    if (req.user.role === ROLES.ADMIN) {
      const { data: cafeData, error: cafeError } = await supabase
        .from("cafes")
        .select("*")
        .eq("id", cafeId)
        .single();
      cafe = cafeData;
    } else {
      const { data: cafeData, error: cafeError } = await supabase
        .from("cafes")
        .select("*")
        .eq("id", cafeId)
        .eq("owner_id", userId)
        .single();
      cafe = cafeData;
    }

    if (!cafe) {
      return res.status(404).json({ error: "Cafe not found or access denied" });
    }

    // Update cafe
    const allowedFields = [
      "name",
      "description",
      "address",
      "city",
      "state",
      "postal_code",
      "country",
      "phone",
      "email",
      "website_url",
      "logo_url",
      "cover_image_url",
      "business_hours",
    ];

    const updateData = {};
    Object.keys(req.validatedBody).forEach((key) => {
      if (allowedFields.includes(key) && req.validatedBody[key] !== undefined) {
        updateData[key] = req.validatedBody[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: updatedCafe, error: updateError } = await supabase
      .from("cafes")
      .update(updateData)
      .eq("id", cafeId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: "Cafe updated successfully",
      data: {
        cafe: updatedCafe,
      },
    });
  });
}

export default CafeController;
