import React from 'react';
import { config } from '../config';

/**
 * Custom hook for feature flags
 * 
 * Usage:
 * const { isEnabled } = useFeatureFlag();
 * if (isEnabled('analytics')) { ... }
 */
export const useFeatureFlag = () => {
  const isEnabled = (feature: keyof typeof config.features): boolean => {
    return config.features[feature];
  };

  const getFeatures = () => config.features;

  return {
    isEnabled,
    getFeatures,
    features: config.features,
  };
};

/**
 * Higher-order component for feature-based rendering
 * 
 * Usage:
 * <FeatureGate feature="analytics">
 *   <AnalyticsComponent />
 * </FeatureGate>
 */
interface FeatureGateProps {
  feature: keyof typeof config.features;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback = null 
}) => {
  const { isEnabled } = useFeatureFlag();
  
  return isEnabled(feature) ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback);
};

export default useFeatureFlag;
