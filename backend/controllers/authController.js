import { asyncHandler } from "../middleware/errorHandler.js";
import User from "../models/User.js";

class AuthController {
  // Get current user profile
  static getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          profileImageUrl: user.profile_image_url,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
    });
  });

  // Update user profile
  static updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, profileImageUrl } = req.validatedBody;

    const updatedUser = await User.update(userId, {
      first_name: firstName,
      last_name: lastName,
      profile_image_url: profileImageUrl,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser.id,
          clerkId: updatedUser.clerk_id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          profileImageUrl: updatedUser.profile_image_url,
          role: updatedUser.role,
          isActive: updatedUser.is_active,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at,
        },
      },
    });
  });

  // Check user permissions
  static checkPermissions = asyncHandler(async (req, res) => {
    const user = req.user;
    const { resource, action } = req.query;

    // Define permissions based on roles
    const permissions = {
      ADMIN: {
        cafe: ["create", "read", "update", "delete", "approve", "ban"],
        user: ["create", "read", "update", "delete", "assign_role"],
        application: [
          "create",
          "read",
          "update",
          "delete",
          "approve",
          "reject",
        ],
        notification: ["create", "read", "update", "delete", "broadcast"],
        support: ["create", "read", "update", "delete", "assign"],
        analytics: ["read"],
      },
      CAFE_OWNER: {
        cafe: ["read", "update"],
        menu: ["create", "read", "update", "delete"],
        order: ["read", "update"],
        notification: ["read"],
        support: ["create", "read"],
      },
      USER: {
        order: ["create", "read"],
        notification: ["read"],
        support: ["create", "read"],
      },
      PENDING_CAFE: {
        application: ["read"],
        notification: ["read"],
        support: ["create", "read"],
      },
      DEV: {
        user: ["read", "assign_role"],
        application: ["read"],
        notification: ["read"],
        support: ["read", "assign"],
      },
      MOD: {
        cafe: ["read", "update"],
        application: ["read", "approve"],
        notification: ["read"],
        support: ["read", "assign"],
      },
    };

    const userPermissions = permissions[user.role] || {};
    const resourcePermissions = userPermissions[resource] || [];
    const hasPermission = resourcePermissions.includes(action);

    res.json({
      success: true,
      data: {
        hasPermission,
        userRole: user.role,
        resource,
        action,
        availableActions: resourcePermissions,
      },
    });
  });

  // Webhook handler for Clerk events
  static handleWebhook = asyncHandler(async (req, res) => {
    const { type, data } = req.body;

    switch (type) {
      case "user.created":
        await handleUserCreated(data);
        break;
      case "user.updated":
        await handleUserUpdated(data);
        break;
      case "user.deleted":
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.json({ success: true });
  });
}

// Webhook helper functions
async function handleUserCreated(userData) {
  try {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = userData;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      console.error("No email found in user created webhook");
      return;
    }

    // Check if user already exists
    const existingUser = await User.getByClerkId(clerkId);
    if (existingUser) {
      console.log(`User ${email} already exists in database`);
      return;
    }

    // Determine role based on email
    const isSuperAdmin = email === process.env.SUPER_ADMIN_EMAIL;
    const role = isSuperAdmin ? "ADMIN" : "USER";

    await User.create({
      clerkId,
      email,
      firstName: first_name,
      lastName: last_name,
      profileImageUrl: image_url,
      role,
    });

    console.log(`✅ User created via webhook: ${email} with role: ${role}`);
  } catch (error) {
    console.error("Error handling user created webhook:", error);
  }
}

async function handleUserUpdated(userData) {
  try {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = userData;
    const email = email_addresses?.[0]?.email_address;

    const user = await User.getByClerkId(clerkId);
    if (!user) {
      console.error(`User with Clerk ID ${clerkId} not found for update`);
      return;
    }

    await User.update(user.id, {
      email,
      first_name,
      last_name,
      profile_image_url: image_url,
    });

    console.log(`✅ User updated via webhook: ${email}`);
  } catch (error) {
    console.error("Error handling user updated webhook:", error);
  }
}

async function handleUserDeleted(userData) {
  try {
    const { id: clerkId } = userData;

    const user = await User.getByClerkId(clerkId);
    if (!user) {
      console.error(`User with Clerk ID ${clerkId} not found for deletion`);
      return;
    }

    await User.deactivate(user.id);
    console.log(`✅ User deactivated via webhook: ${user.email}`);
  } catch (error) {
    console.error("Error handling user deleted webhook:", error);
  }
}

export default AuthController;
