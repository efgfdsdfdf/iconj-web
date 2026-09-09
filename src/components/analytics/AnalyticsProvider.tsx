'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// ==========================================
// TYPES
// ==========================================
interface AnalyticsContextType {
  trackEvent: (eventType: string, properties?: Record<string, any>, idempotencyKey?: string) => void;
  getSessionId: () => string;
  getAttribution: () => Attribution;
}

interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  getSessionId: () => '',
  getAttribution: () => ({
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    referrer: null,
    sessionId: '',
  }),
});

export const useAnalytics = () => useContext(AnalyticsContext);

// ==========================================
// HELPERS
// ==========================================
function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  let sessionId = localStorage.getItem('iconj_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('iconj_session_id', sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
  if (/tablet|ipad/.test(ua)) return 'tablet';
  return 'desktop';
}

// ==========================================
// PROVIDER
// ==========================================
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPage = useRef<string>('');
  const sessionIdRef = useRef<string>('');
  const initialized = useRef(false);

  // Initialize session
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    sessionIdRef.current = getOrCreateSessionId();

    // Capture UTM params from URL on first load
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const utmContent = searchParams.get('utm_content');
    const utmTerm = searchParams.get('utm_term');

    // Store first-touch (never overwrite)
    if (utmSource && !localStorage.getItem('iconj_first_touch_source')) {
      localStorage.setItem('iconj_first_touch_source', utmSource);
      localStorage.setItem('iconj_first_touch_medium', utmMedium || '');
      localStorage.setItem('iconj_first_touch_campaign', utmCampaign || '');
    }

    // Always update last-touch
    if (utmSource) {
      localStorage.setItem('iconj_last_touch_source', utmSource);
      localStorage.setItem('iconj_last_touch_medium', utmMedium || '');
      localStorage.setItem('iconj_last_touch_campaign', utmCampaign || '');
      localStorage.setItem('iconj_last_touch_content', utmContent || '');
      localStorage.setItem('iconj_last_touch_term', utmTerm || '');
    }
  }, [searchParams]);

  // Auto-track page_view on route change (deduplicated)
  useEffect(() => {
    const pageKey = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    if (pageKey === lastTrackedPage.current) return;
    lastTrackedPage.current = pageKey;

    // Small delay to let the page settle
    const timer = setTimeout(() => {
      sendEvent('page_view', {
        path: pathname,
        title: document.title,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Send event to the backend
  const sendEvent = useCallback(
    (eventType: string, properties?: Record<string, any>, idempotencyKey?: string) => {
      if (typeof window === 'undefined') return;

      const sessionId = sessionIdRef.current || getOrCreateSessionId();

      const payload = {
        eventType,
        sessionId,
        properties: properties || {},
        utmSource: localStorage.getItem('iconj_last_touch_source') || null,
        utmMedium: localStorage.getItem('iconj_last_touch_medium') || null,
        utmCampaign: localStorage.getItem('iconj_last_touch_campaign') || null,
        utmContent: localStorage.getItem('iconj_last_touch_content') || null,
        utmTerm: localStorage.getItem('iconj_last_touch_term') || null,
        referrer: document.referrer || null,
        device: getDeviceType(),
        landingPage: pathname,
        idempotencyKey: idempotencyKey || null,
      };

      // Fire and forget — don't block the UI
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently fail — analytics should never break the app
      });
    },
    [pathname]
  );

  const getSessionId = useCallback(() => {
    return sessionIdRef.current || getOrCreateSessionId();
  }, []);

  const getAttribution = useCallback((): Attribution => {
    return {
      utmSource: localStorage.getItem('iconj_last_touch_source'),
      utmMedium: localStorage.getItem('iconj_last_touch_medium'),
      utmCampaign: localStorage.getItem('iconj_last_touch_campaign'),
      utmContent: localStorage.getItem('iconj_last_touch_content'),
      utmTerm: localStorage.getItem('iconj_last_touch_term'),
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      sessionId: sessionIdRef.current,
    };
  }, []);

  return (
    <AnalyticsContext.Provider value={{ trackEvent: sendEvent, getSessionId, getAttribution }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
