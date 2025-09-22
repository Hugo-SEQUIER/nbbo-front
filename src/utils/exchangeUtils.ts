/**
 * Utility functions for exchange/DEX handling
 */

/**
 * Convert API DEX ID to UI-safe identifier
 * @param apiDexId - The DEX identifier from API (empty string for main DEX)
 * @returns UI-safe identifier ("main" for empty string, others unchanged)
 */
export function apiDexIdToUiId(apiDexId: string): string {
  return apiDexId === '' ? 'main' : apiDexId;
}

/**
 * Convert UI identifier back to API DEX ID
 * @param uiId - The UI-safe identifier
 * @returns API DEX identifier (empty string for "main", others unchanged)
 */
export function uiIdToApiDexId(uiId: string): string {
  return uiId === 'main' ? '' : uiId;
}

/**
 * Get the display name for a DEX ID (works with both API and UI identifiers)
 * @param dexId - The DEX identifier (empty string or "main" for main DEX)
 * @returns Human-readable display name
 */
export function getExchangeDisplayName(dexId: string): string {
  if (dexId === '' || dexId === 'main') {
    return 'Main DEX';
  }
  return dexId.toUpperCase();
}

/**
 * Check if a DEX ID represents the main DEX (works with both API and UI identifiers)
 * @param dexId - The DEX identifier
 * @returns True if it's the main DEX
 */
export function isMainDex(dexId: string): boolean {
  return dexId === '' || dexId === 'main';
}

/**
 * Get the full display name for a DEX with additional context
 * @param dexId - The DEX identifier
 * @returns Full display name with context
 */
export function getExchangeFullName(dexId: string): string {
  if (isMainDex(dexId)) {
    return 'Main DEX (Hyperliquid)';
  }
  return `${dexId.toUpperCase()} DEX`;
}
