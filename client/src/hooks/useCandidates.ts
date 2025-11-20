import { useMemo } from 'react';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  source: string;
  experience: number;
  location: string;
  tags: string[];
  updatedAt: string;
  score: number;
  rationale: string;
  status: string;
}

export function useFilteredCandidates(
  candidates: Candidate[],
  query: string,
  role: string | null,
  minScore: number | null,
) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      const qhit = !q || `${c.name} ${c.email} ${c.role} ${c.tags.join(' ')}`.toLowerCase().includes(q);
      const rhit = !role || c.role === role;
      const shit = minScore == null || c.score >= minScore;
      return qhit && rhit && shit;
    });
  }, [candidates, query, role, minScore]);
}

export type SortKey = 'updatedAt' | 'score' | 'name';
export type SortDir = 'asc' | 'desc';

export function useSortedCandidates(list: Candidate[], key: SortKey, dir: SortDir) {
  return useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      const sgn = dir === 'asc' ? 1 : -1;
      if (key === 'score') return (a.score - b.score) * sgn * -1; // higher first
      if (key === 'updatedAt') return a.updatedAt.localeCompare(b.updatedAt) * sgn * -1; // recent first
      return a.name.localeCompare(b.name) * sgn;
    });
    return arr;
  }, [list, key, dir]);
}


