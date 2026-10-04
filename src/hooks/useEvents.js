import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import localFallbackEvents from '../data/events.json';

export function useEvents() {
  const [events, setEvents] = useState(localFallbackEvents);
  // Default to false when local pre-fetched data is available to avoid hydration flicker
  const [loading, setLoading] = useState(localFallbackEvents?.length ? false : true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('status', '==', 'live'),
          orderBy('start', 'asc')
        );

        const snapshot = await getDocs(q);
        if (!isMounted) return;

        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEvents(fetched);
        } else {
          // If Firestore is not populated yet, retain synced fallback events
          setEvents(localFallbackEvents);
        }
      } catch (err) {
        if (!isMounted) return;
        // Gracefully fall back to local synced data if Firestore isn't reached yet
        console.warn('Firestore load failed, using local synced fallback events:', err);
        setEvents(localFallbackEvents);
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return { events, loading, error };
}
