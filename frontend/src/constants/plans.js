// Plan Constants - Aligned with specification
export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    monthlyOrderQuota: 5,
    features: [
      "Basic menu management",
      "5 orders per month",
      "Email support",
      "QR code generation",
      "Mobile-friendly menus",
    ],
  },
  PLUS: {
    name: "Plus",
    price: 29,
    monthlyOrderQuota: 10,
    features: [
      "Advanced menu management",
      "10 orders per month",
      "Priority support",
      "Basic analytics",
      "Custom branding",
      "Order notifications",
    ],
  },
  PRO: {
    name: "Pro",
    price: 79,
    monthlyOrderQuota: 25,
    features: [
      "Full menu management",
      "25 orders per month",
      "Premium support",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Multi-location support",
    ],
  },
};

// Role types aligned with specification
export const ROLES = {
  ADMIN: "ADMIN", // super-admin (souroveahmed15@gmail.com)
  DEV: "DEV", // full admin features, cannot edit others' roles
  MOD: "MOD", // café mgmt + support only
  CAFE_OWNER: "CAFE_OWNER", // approved café owner
  USER: "USER", // end-customer
  PENDING_CAFE: "PENDING_CAFE", // signed in, submitted application, awaiting approval
};

// Status types
export const STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  BANNED: "BANNED",
};

// Application status types
export const APPLICATION_STATUS = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// Socket event types aligned with specification
export const SOCKET_EVENTS = {
  APPLICATION_NEW: "application:new", // payload: cafeId, ownerEmail
  APPLICATION_APPROVED: "application:approved", // payload: cafeId
  NOTIFICATION_NEW: "notification:new", // generic bell alerts
  SUPPORT_MESSAGE: "support:message", // live chat threads
};

// Helper function to get plan details by type
export function getPlanDetails(planType) {
  return PLANS[planType] || PLANS.FREE;
}

// Helper function to validate role
export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

// Helper function to check if role has admin privileges
export function hasAdminPrivileges(role) {
  return [ROLES.ADMIN, ROLES.DEV].includes(role);
}

// Helper function to check if role can manage cafés
export function canManageCafes(role) {
  return [ROLES.ADMIN, ROLES.DEV, ROLES.MOD].includes(role);
}

// Helper function to get role badge color
export function getRoleBadgeColor(role) {
  const colors = {
    ADMIN: "bg-red-100 text-red-800",
    DEV: "bg-purple-100 text-purple-800",
    MOD: "bg-orange-100 text-orange-800",
    CAFE_OWNER: "bg-green-100 text-green-800",
    USER: "bg-blue-100 text-blue-800",
    PENDING_CAFE: "bg-yellow-100 text-yellow-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

// Helper function to get status badge color
export function getStatusBadgeColor(status) {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-green-100 text-green-800",
    BANNED: "bg-red-100 text-red-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
