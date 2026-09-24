import { useEffect, useState } from 'react';

/**
 * The household profile lives only in this browser (localStorage). It is never
 * sent to Canairy's servers; the ZIP is turned into coordinates from a static
 * file and only the coordinates go to the National Weather Service.
 */
export interface Household {
  zip?: string;
  housing?: 'rent' | 'own' | 'other';
  drives?: boolean;
  heat?: 'gas' | 'electric' | 'oil' | 'unsure';
  prescriptions?: boolean;
  kids?: boolean;
  benefits?: boolean;
}

const KEY = 'canairy:household';
const EVENT = 'canairy:household-changed';

function read(): Household {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveHousehold(h: Household): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    // Private mode or blocked storage: the profile just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearHousehold(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useHousehold(): Household {
  const [h, setH] = useState<Household>(read);
  useEffect(() => {
    const update = () => setH(read());
    window.addEventListener(EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return h;
}

export function hasProfile(h: Household): boolean {
  return Object.keys(h).length > 0;
}

/** Checked-off actions, keyed by action id + the week, so they reset weekly. */
const DONE_KEY = 'canairy:done';

function weekKey(): string {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-w${week}`;
}

export function useDone(scope: 'week' | 'forever' = 'week') {
  const storageKey = scope === 'week' ? `${DONE_KEY}:${weekKey()}` : `${DONE_KEY}:plan`;
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
    } catch {
      return new Set();
    }
  });
  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };
  return { done, toggle };
}

/** Opens the household dialog from anywhere (the Shell listens for this). */
export function openHousehold(): void {
  window.dispatchEvent(new Event('canairy:open-household'));
}
