import { requireAuth, getAuth, createClerkClient } from "@clerk/express";
import { supabase } from "../config/supabase.js";
import { ROLES } from "../constants/plans.js";

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Middleware to require authentication
export const requireAuthentication = requireAuth();

// Role-based access control middleware
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const auth = req.auth();
      if (!auth?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get user from Supabase
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", auth.userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: "User not found" });
      }
      req.user = user;

      // Check if user role is allowed
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: allowedRoles,
          current: user.role,
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Admin role middleware
export const requireAdmin = requireRole([ROLES.ADMIN]);

// Cafe owner role middleware
export const requireCafeOwner = requireRole([ROLES.CAFE_OWNER, ROLES.ADMIN]);

// Developer/Moderator role middleware
export const requireDevMod = requireRole([ROLES.DEV, ROLES.MOD, ROLES.ADMIN]);

// User sync middleware - creates/updates user in database from Clerk
export const syncUser = async (req, res, next) => {
  try {
    const auth = req.auth();
    if (!auth?.userId) {
      return next();
    }

    const { userId, sessionClaims } = auth;

    let email = sessionClaims?.email;
    let firstName = sessionClaims?.first_name;
    let lastName = sessionClaims?.last_name;
    let profileImageUrl = sessionClaims?.image_url;

    // If email is not in session claims, fetch from Clerk API
    if (!email) {
      try {
        const user = await clerkClient.users.getUser(userId);
        email = user.emailAddresses?.[0]?.emailAddress;
        firstName = user.firstName;
        lastName = user.lastName;
        profileImageUrl = user.imageUrl;
      } catch (error) {
        console.error("❌ Failed to fetch user from Clerk:", error);
        return next();
      }
    }

    if (!email) {
      return next();
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    let user;

    if (fetchError && fetchError.code === "PGRST116") {
      // User doesn't exist (PGRST116 = no rows returned)
      // Determine role based on email
      const isSuperAdmin = email === process.env.SUPER_ADMIN_EMAIL;
      const role = isSuperAdmin ? ROLES.ADMIN : ROLES.USER;

      // Create new user in Supabase
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          profile_image_url: profileImageUrl,
          role,
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Failed to create user:", insertError);
        throw insertError;
      }

      user = newUser;
      console.log(`✅ New user created: ${email} with role: ${role}`);
    } else if (existingUser) {
      // Update existing user in Supabase
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
          profile_image_url: profileImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      user = updatedUser;
    } else {
      throw fetchError;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: "Failed to sync user data" });
  }
};

// Check if user owns the cafe
export const requireCafeOwnership = async (req, res, next) => {
  try {
    const { cafeId } = req.params;
    const auth = req.auth();

    if (!auth?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", auth.userId)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user; // Set user for subsequent middleware/controllers
    const userId = user.id;

    console.log("🔍 Checking cafe ownership:", {
      cafeId,
      userId,
      userRole: user.role,
    });

    if (user.role === ROLES.ADMIN) {
      console.log("✅ Admin access granted");
      return next(); // Admins can access any cafe
    }

    const { data: cafe, error } = await supabase
      .from("cafes")
      .select("*")
      .eq("id", cafeId)
      .eq("owner_id", userId)
      .single();

    console.log("🔍 Cafe query result:", {
      cafe: cafe?.id,
      error: error?.message,
    });

    if (error || !cafe) {
      console.log(
        "❌ Cafe ownership denied:",
        error?.message || "No cafe found"
      );
      return res.status(403).json({
        error: "You do not own this cafe",
        details: { cafeId, userId, dbError: error?.message },
      });
    }

    console.log("✅ Cafe ownership verified");
    req.cafe = cafe;
    next();
  } catch (error) {
    console.error("Cafe ownership check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Validate request body middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    req.validatedBody = value;
    next();
  };
};
