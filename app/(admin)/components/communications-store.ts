'use client';

export type CommunicationEntry = {
  id: string;
  title: string;
  body: string;
  mediaType?: 'image' | 'video' | 'pdf' | 'none';
  mediaUrl?: string;
  createdAt: string;
  author?: string;
};

export const COMMUNICATIONS_UPDATE_EVENT = 'sm-communications-update';

const sortByNewest = (entries: CommunicationEntry[]) =>
  entries.slice().sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return Number.isNaN(bTime) || Number.isNaN(aTime) ? 0 : bTime - aTime;
  });

export const readCommunications = async (): Promise<CommunicationEntry[]> => {
  if (typeof window === 'undefined') return [];
  try {
    const response = await fetch('/api/communications', { cache: 'no-store' });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      communications?: CommunicationEntry[];
    };
    return sortByNewest(data.communications ?? []);
  } catch {
    return [];
  }
};

export const addCommunication = async (
  entry: CommunicationEntry,
): Promise<CommunicationEntry | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { communication?: CommunicationEntry };
    const created = data.communication ?? entry;
    window.dispatchEvent(
      new CustomEvent(COMMUNICATIONS_UPDATE_EVENT, { detail: created }),
    );
    return created;
  } catch {
    return null;
  }
};

export const deleteCommunication = async (
  id: string,
): Promise<CommunicationEntry | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch('/api/communications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { communication?: CommunicationEntry };
    const deleted = data.communication ?? null;
    window.dispatchEvent(
      new CustomEvent(COMMUNICATIONS_UPDATE_EVENT, { detail: deleted }),
    );
    return deleted;
  } catch {
    return null;
  }
};
