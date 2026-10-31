// src/utils.js

// Format number to AED currency
export const money = (amount) => {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
  }).format(amount);
};

// Get today's date in YYYY-MM-DD format
export const getToday = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
