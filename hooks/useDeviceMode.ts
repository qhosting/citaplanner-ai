import { useState, useEffect } from 'react';

export type DeviceMode = 'DESKTOP' | 'PWA' | 'MOBILE';

export interface UseDeviceModeReturn {
  mode: DeviceMode;
  isDesktop: boolean;
  isPWA: boolean;
  isMobile: boolean;
}

export const useDeviceMode = (): UseDeviceModeReturn => {
  const [mode, setMode] = useState<DeviceMode>('DESKTOP');

  useEffect(() => {
    const detectEnvironment = () => {
      // 1. Detect PWA display-mode standalone
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      // 2. Detect Mobile device/browser via User Agent and screen size
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isMobileWidth = window.innerWidth < 768;
      const isMobile = isMobileUA || isMobileWidth;

      if (isStandalone) {
        setMode('PWA');
      } else if (isMobile) {
        setMode('MOBILE');
      } else {
        setMode('DESKTOP');
      }
    };

    detectEnvironment();

    // Listen to resize events to handle screen rotation or viewport resizing in real time
    window.addEventListener('resize', detectEnvironment);
    
    // Listen to standalone media query changes (PWA installation/launch transition)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    try {
      mediaQuery.addEventListener('change', detectEnvironment);
    } catch (e) {
      // Fallback for older browsers
      mediaQuery.addListener(detectEnvironment);
    }

    return () => {
      window.removeEventListener('resize', detectEnvironment);
      try {
        mediaQuery.removeEventListener('change', detectEnvironment);
      } catch (e) {
        mediaQuery.removeListener(detectEnvironment);
      }
    };
  }, []);

  return {
    mode,
    isDesktop: mode === 'DESKTOP',
    isPWA: mode === 'PWA',
    isMobile: mode === 'MOBILE',
  };
};
