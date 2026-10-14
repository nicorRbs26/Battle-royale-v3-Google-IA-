import { useState, useEffect } from 'react';

export type DeviceMode = 'mobile' | 'pc';

export function useDeviceMode() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    const saved = localStorage.getItem('game_device_mode_override');
    if (saved === 'mobile' || saved === 'pc') return saved;

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    return (isTouch && isSmallScreen) || isMobileUA ? 'mobile' : 'pc';
  });

  const [overrideMode, setOverrideMode] = useState<'auto' | 'mobile' | 'pc'>(() => {
    return (localStorage.getItem('game_device_mode_override') as any) || 'auto';
  });

  const [isPortrait, setIsPortrait] = useState<boolean>(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      if (overrideMode === 'auto') {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const newMode = (isTouch && isSmallScreen) || isMobileUA ? 'mobile' : 'pc';
        setDeviceMode(newMode);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [overrideMode]);

  const setModeOverride = (mode: 'auto' | 'mobile' | 'pc') => {
    setOverrideMode(mode);
    if (mode === 'auto') {
      localStorage.removeItem('game_device_mode_override');
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setDeviceMode((isTouch && isSmallScreen) || isMobileUA ? 'mobile' : 'pc');
    } else {
      localStorage.setItem('game_device_mode_override', mode);
      setDeviceMode(mode);
    }
  };

  return {
    deviceMode,
    isPortrait,
    overrideMode,
    setModeOverride,
  };
}
