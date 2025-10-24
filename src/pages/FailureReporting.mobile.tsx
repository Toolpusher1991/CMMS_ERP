import React from "react";
import { isMobileDevice } from "@/lib/device-detection";
import "./FailureReporting.mobile.css";

/**
 * Mobile-optimized wrapper for FailureReporting
 * Adds mobile-specific styles and behavior
 */
export const withMobileOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const isMobile = isMobileDevice();

    if (!isMobile) {
      return <Component {...props} />;
    }

    // Mobile view with touch-optimized styling
    return (
      <div className="mobile-failure-reporting">
        <Component {...props} />
      </div>
    );
  };
};
