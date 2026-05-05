// Lightweight in-memory commitment store.
// For production: swap with a PostgreSQL pool using the `pg` package.
// This module has no express imports — it stays pure and testable.

export interface Commitment {
  id: string;
  email: string | null;
  flowType: string;
  objective: string;
  createdAt: Date;
  checkedInAt?: Date;
  followedThrough?: boolean;
}

const store = new Map<string, Commitment>();

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCommitment(
  email: string | null,
  flowType: string,
  objective: string,
): Commitment {
  const c: Commitment = { id: uid(), email, flowType, objective, createdAt: new Date() };
  store.set(c.id, c);
  return c;
}

export function getCommitment(id: string): Commitment | undefined {
  return store.get(id);
}

export function checkIn(id: string, followedThrough: boolean): Commitment | null {
  const c = store.get(id);
  if (!c) return null;
  const updated: Commitment = { ...c, checkedInAt: new Date(), followedThrough };
  store.set(id, updated);
  return updated;
}

export function pendingForEmail(email: string): Commitment[] {
  return [...store.values()].filter((c) => c.email === email && !c.checkedInAt);
}
