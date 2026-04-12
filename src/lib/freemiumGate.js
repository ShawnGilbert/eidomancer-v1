// D:\eidomancer\src\lib\freemiumGate.js

const DEFAULT_TIER = "free";
const PREMIUM_TIERS = new Set(["premium", "pro", "paid"]);

const FREE_LIMITS = {
  historyLimit: 3,
  bonusCastsPerDay: 0,
  fullHistory: false,
  deepRead: false,
};

const PREMIUM_LIMITS = {
  historyLimit: 7,
  bonusCastsPerDay: 3,
  fullHistory: true,
  deepRead: true,
};

function normalizeTier(tier = "") {
  const value = String(tier || "").trim().toLowerCase();

  if (!value) return DEFAULT_TIER;
  if (PREMIUM_TIERS.has(value)) return "premium";

  return "free";
}

function getLimitsForTier(tier = DEFAULT_TIER) {
  const normalizedTier = normalizeTier(tier);
  return normalizedTier === "premium" ? PREMIUM_LIMITS : FREE_LIMITS;
}

export function getAccessTier(user = null) {
  if (!user || typeof user !== "object") return DEFAULT_TIER;

  if (typeof user.accessTier === "string") {
    return normalizeTier(user.accessTier);
  }

  if (typeof user.tier === "string") {
    return normalizeTier(user.tier);
  }

  if (user.isPremium === true || user.isPaid === true) {
    return "premium";
  }

  return DEFAULT_TIER;
}

export function isPremiumTier(tier = DEFAULT_TIER) {
  return normalizeTier(tier) === "premium";
}

export function canViewFullHistory(tier = DEFAULT_TIER) {
  return getLimitsForTier(tier).fullHistory;
}

export function canGenerateBonusCast(tier = DEFAULT_TIER, usedToday = 0) {
  const limits = getLimitsForTier(tier);

  if (limits.bonusCastsPerDay < 0) return true;

  const usedCount =
    Number.isFinite(usedToday) && usedToday >= 0 ? Math.floor(usedToday) : 0;

  return usedCount < limits.bonusCastsPerDay;
}

export function canAccessDeepRead(tier = DEFAULT_TIER) {
  return getLimitsForTier(tier).deepRead;
}

export function getHistoryLimit(tier = DEFAULT_TIER) {
  return getLimitsForTier(tier).historyLimit;
}

export function getFreemiumCapabilities(tier = DEFAULT_TIER, usedToday = 0) {
  const normalizedTier = normalizeTier(tier);

  return {
    tier: normalizedTier,
    isPremium: normalizedTier === "premium",
    canViewFullHistory: canViewFullHistory(normalizedTier),
    canGenerateBonusCast: canGenerateBonusCast(normalizedTier, usedToday),
    canAccessDeepRead: canAccessDeepRead(normalizedTier),
    historyLimit: getHistoryLimit(normalizedTier),
    bonusCastsRemaining: Math.max(
      0,
      getLimitsForTier(normalizedTier).bonusCastsPerDay -
        (Number.isFinite(usedToday) && usedToday >= 0 ? Math.floor(usedToday) : 0)
    ),
  };
}