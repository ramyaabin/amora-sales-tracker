const API_URL = import.meta.env.VITE_API_URL;

const api = {
  /* -------------------- USERS -------------------- */
  async getUsers() {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const users = await res.json();
      localStorage.setItem("salesTracker_users", JSON.stringify(users));
      return users;
    } catch (_error) {
      console.error("API Error:", _error);
      const stored = localStorage.getItem("salesTracker_users");
      return stored ? JSON.parse(stored) : [];
    }
  },

  async addUser(userData) {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to add user");
        } else {
          console.warn("Backend returned HTML error page");
          return { success: true, offline: true };
        }
      }

      return await res.json();
    } catch (_error) {
      console.error("API Error:", _error);
      throw _error; // ✅ Throw instead of silently failing so UI can show error
    }
  },

  async deleteUser(salesmanId) {
    try {
      const res = await fetch(`${API_URL}/api/users/${salesmanId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      return await res.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  /* -------------------- AUTH -------------------- */
  async login(username, password) {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }

      return await res.json();
    } catch (err) {
      console.error("API Error:", err);

      // Fallback to cached users if backend is unreachable
      const users = JSON.parse(
        localStorage.getItem("salesTracker_users") || "[]",
      );
      const found = users.find(
        (u) => u.username === username && u.password === password,
      );
      if (!found) throw new Error("Invalid username or password");
      return { success: true, user: found };
    }
  },

  /* -------------------- FORGOT PASSWORD (OTP) -------------------- */
  async forgotPassword(email) {
    const res = await fetch(`${API_URL}/api/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send OTP");
    return data; // { success, maskedEmail }
  },

  async verifyOtp(email, otp) {
    const res = await fetch(`${API_URL}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Invalid OTP");
    return data;
  },

  async resetPasswordWithOtp(email, newPassword) {
    const res = await fetch(`${API_URL}/api/reset-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset password");
    return data;
  },

  /* -------------------- ADMIN -------------------- */
  async resetPassword(data) {
    try {
      const res = await fetch(
        `${API_URL}/api/users/${data.salesmanId}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: data.password }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Password reset failed");
      }

      return await res.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  /* -------------------- PRODUCTS -------------------- */
  async getProducts(query = {}) {
    try {
      const params = new URLSearchParams(query);
      // ✅ Now passes search/brand/category params to backend
      const res = await fetch(`${API_URL}/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const products = await res.json();
      localStorage.setItem("salesTracker_products", JSON.stringify(products));
      return products;
    } catch (_error) {
      console.error("API Error:", _error);
      const stored = localStorage.getItem("salesTracker_products");
      return stored ? JSON.parse(stored) : [];
    }
  },

  /* -------------------- SALES -------------------- */
  async getSales(query = {}) {
    try {
      const params = new URLSearchParams(query);
      const res = await fetch(`${API_URL}/api/sales?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sales");
      const sales = await res.json();
      localStorage.setItem("salesTracker_sales", JSON.stringify(sales));
      return sales;
    } catch (_error) {
      console.error("API Error:", _error);

      let sales = JSON.parse(
        localStorage.getItem("salesTracker_sales") || "[]",
      );
      if (query.salesmanId)
        sales = sales.filter((s) => s.salesmanId === query.salesmanId);
      if (query.date) sales = sales.filter((s) => s.date === query.date);
      if (query.month)
        sales = sales.filter((s) => s.date.startsWith(query.month));
      return sales;
    }
  },

  async addSale(saleData) {
    const res = await fetch(`${API_URL}/api/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to add sale");
    }

    const result = await res.json();

    // ✅ Update localStorage cache so offline fallback stays fresh
    const stored = JSON.parse(
      localStorage.getItem("salesTracker_sales") || "[]",
    );
    stored.unshift(result.sale || saleData); // newest first
    localStorage.setItem("salesTracker_sales", JSON.stringify(stored));

    return { success: true, sale: result.sale };
  },

  async deleteSale(id) {
    try {
      const res = await fetch(`${API_URL}/api/sales/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete sale");
      return await res.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  /* -------------------- LEAVES -------------------- */
  async getLeaves(query = {}) {
    try {
      const params = new URLSearchParams(query);
      const res = await fetch(`${API_URL}/api/leaves?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leaves");
      const leaves = await res.json();
      localStorage.setItem("salesTracker_leaves", JSON.stringify(leaves));
      return leaves;
    } catch (_error) {
      console.error("API Error:", _error);

      let leaves = JSON.parse(
        localStorage.getItem("salesTracker_leaves") || "[]",
      );
      if (query.salesmanId)
        leaves = leaves.filter((l) => l.salesmanId === query.salesmanId);
      if (query.date) leaves = leaves.filter((l) => l.date === query.date);
      return leaves;
    }
  },

  async addLeave(leaveData) {
    const res = await fetch(`${API_URL}/api/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leaveData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to add leave");
    }

    const result = await res.json();

    // ✅ Update localStorage cache
    const stored = JSON.parse(
      localStorage.getItem("salesTracker_leaves") || "[]",
    );
    stored.unshift(result.leave || leaveData);
    localStorage.setItem("salesTracker_leaves", JSON.stringify(stored));

    return { success: true, leave: result.leave };
  },

  // ✅ ADDED — Approve or reject a leave (for admin dashboard)
  async updateLeaveStatus(leaveId, status, adminRemark = "") {
    try {
      const res = await fetch(`${API_URL}/api/leaves/${leaveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminRemark }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update leave status");
      }

      const result = await res.json();

      // ✅ Sync status change to localStorage cache
      const stored = JSON.parse(
        localStorage.getItem("salesTracker_leaves") || "[]",
      );
      const updated = stored.map((l) =>
        l._id === leaveId
          ? { ...l, status, adminRemark, actionAt: new Date().toISOString() }
          : l,
      );
      localStorage.setItem("salesTracker_leaves", JSON.stringify(updated));

      return result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  async deleteLeave(id) {
    try {
      const res = await fetch(`${API_URL}/api/leaves/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete leave");
      return await res.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },
};

export default api;
