import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import localFallbackStats from '../data/stats.json';

export function useStats() {
  const [stats, setStats] = useState(localFallbackStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const docRef = doc(db, 'stats', 'eventbrite');
        const docSnap = await getDoc(docRef);
        if (!isMounted) return;

        if (docSnap.exists()) {
          setStats(docSnap.data());
        } else {
          setStats(localFallbackStats);
        }
      } catch (err) {
        if (!isMounted) return;
        setStats(localFallbackStats);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, loading };
}
