import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// API utilities
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export function getApiUrl(endpoint) {
  return `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;
}

// Date utilities
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Date(date).toLocaleDateString("en-US", defaultOptions);
}

export function formatDateTime(date, options = {}) {
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return new Date(date).toLocaleDateString("en-US", defaultOptions);
}

export function timeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

// String utilities
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Number utilities
export function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatNumber(number) {
  return new Intl.NumberFormat("en-US").format(number);
}

export function percentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Validation utilities
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone) {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Array utilities
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

export function sortBy(array, key, direction = "asc") {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (direction === "desc") {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
}

export function unique(array) {
  return [...new Set(array)];
}

// Object utilities
export function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

export function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }
  return false;
}

// Local storage utilities
export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Failed to set localStorage item:", error);
  }
}

export function getLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn("Failed to get localStorage item:", error);
    return defaultValue;
  }
}

export function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to remove localStorage item:", error);
  }
}

// Debounce utility
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Failed to copy to clipboard:", error);
    return false;
  }
}

// Generate random ID
export function generateId(length = 8) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

// Role utilities
export function getRoleBadgeColor(role) {
  const colors = {
    ADMIN: "bg-red-100 text-red-800",
    CAFE_OWNER: "bg-green-100 text-green-800",
    USER: "bg-blue-100 text-blue-800",
    PENDING_CAFE: "bg-yellow-100 text-yellow-800",
    DEV: "bg-purple-100 text-purple-800",
    MOD: "bg-orange-100 text-orange-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

export function getStatusBadgeColor(status) {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Plan utilities
export function getPlanDetails(planType) {
  const plans = {
    FREE: {
      name: "Free",
      price: 0,
      orderLimit: 5,
      features: [
        "Basic menu management",
        "5 orders per month",
        "Email support",
      ],
    },
    PLUS: {
      name: "Plus",
      price: 29,
      orderLimit: 10,
      features: [
        "Advanced menu management",
        "10 orders per month",
        "Priority support",
        "Basic analytics",
      ],
    },
    PRO: {
      name: "Pro",
      price: 79,
      orderLimit: 25,
      features: [
        "Full menu management",
        "25 orders per month",
        "Premium support",
        "Advanced analytics",
        "Custom branding",
      ],
    },
  };
  return plans[planType] || plans.FREE;
}
