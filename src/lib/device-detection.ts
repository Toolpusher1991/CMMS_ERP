/**
 * Device detection utilities for responsive layouts
 */

/**
 * Detect if the current device is a mobile device (phone only, NOT tablet)
 * Checks user agent for common mobile device patterns
 * Excludes tablets like iPad
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if it's a tablet first - tablets should NOT be considered mobile
  if (isTabletDevice()) return false;
  
  // Only phones are considered mobile
  return /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detect if the current device is a tablet (iPad, Android Tablet)
 * Tablets have larger screens and should get desktop UI
 */
export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // iPad detection
  const isIPad = /iPad/i.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Android Tablet detection (screen width >= 768px)
  const isAndroidTablet = /Android/i.test(navigator.userAgent) && 
    !/Mobile/i.test(navigator.userAgent);
  
  return isIPad || isAndroidTablet;
};

/**
 * Check if device has touch capability
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get device type: 'mobile', 'tablet', or 'desktop'
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobileDevice() && !isTabletDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};
