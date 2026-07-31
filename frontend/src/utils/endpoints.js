// Mandatory Centralized API Endpoints Configuration as per AGENTS.md rule

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },
  SERVICES: {
    LIST: "/services",
    DETAIL: (id) => `/services/${id}`,
    CREATE: "/services",
    UPDATE: (id) => `/services/${id}`,
    DELETE: (id) => `/services/${id}`,
  },
  TECHNICIANS: {
    LIST: "/technicians",
    UPDATE_PROFILE: "/technician/profile",
  },
  USERS: {
    LIST: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    UPDATE_STATUS: (id) => `/users/${id}/status`,
  },
  ORDERS: {
    LIST: "/orders",
    CREATE: "/orders",
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
  },
  DEPOSITS: {
    CREATE: "/deposits",
    HISTORY: "/deposits/history",
    TOPUP_SUBMIT: "/technician/topup",
    UPDATE_STATUS: (id) => `/deposits/${id}/status`,
  },
  RATINGS: {
    CREATE: "/ratings",
  },
  ADMIN: {
    STATS: "/admin/dashboard-stats",
  },
  SETTINGS: {
    GET: "/settings",
    UPDATE: "/settings",
  }
};
