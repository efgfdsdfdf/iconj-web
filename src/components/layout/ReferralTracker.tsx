'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // If the URL has ?ref=CODE, save it to a cookie for 30 days
    const ref = searchParams.get('ref');
    if (ref) {
      Cookies.set('iconj_ref', ref, { expires: 30, path: '/' });
    }
  }, [searchParams]);

  return null;
}
