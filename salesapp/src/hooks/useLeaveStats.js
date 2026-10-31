// src/hooks/useLeaveStats.js
import { useMemo } from "react";

export const useLeaveStats = (leaves, selectedDate) => {
  return useMemo(() => {
    const day = selectedDate;

    const onLeaveToday = leaves.filter(
      (l) => l.status === "approved" && l.fromDate <= day && l.toDate >= day,
    );

    const critical = onLeaveToday.filter((l) => l.isCritical);

    const monthly = {};
    leaves.forEach((l) => {
      const month = l.fromDate.slice(0, 7);
      monthly[month] = (monthly[month] || 0) + 1;
    });

    return {
      onLeaveToday,
      criticalOnLeave: critical,
      monthlySummary: monthly,
    };
  }, [leaves, selectedDate]);
};
