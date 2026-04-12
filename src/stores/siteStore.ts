import { useEffect } from 'react';
import { create } from 'zustand';
import type { Site } from '../types/site';
import {
  deleteSite as removeStoredSite,
  getSiteStorageSnapshot,
  saveSite as saveStoredSite,
  setCurrentSiteId as persistCurrentSiteId,
  subscribeSiteStorage,
} from '../utils/siteStorage';

type SiteStore = {
  sites: Site[];
  currentSiteId: string;
  syncFromStorage: () => void;
  setCurrentSite: (id: string) => void;
  saveSite: (site: Site) => void;
  deleteSite: (id: string) => void;
};

const initialSnapshot = getSiteStorageSnapshot();

export const useSiteStore = create<SiteStore>((set) => ({
  ...initialSnapshot,

  syncFromStorage: () => set(getSiteStorageSnapshot()),

  setCurrentSite: (id) => {
    persistCurrentSiteId(id);
    set(getSiteStorageSnapshot());
  },

  saveSite: (site) => {
    saveStoredSite(site);
    set(getSiteStorageSnapshot());
  },

  deleteSite: (id) => {
    removeStoredSite(id);
    set(getSiteStorageSnapshot());
  },
}));

export const useSyncSiteStore = () => {
  const syncFromStorage = useSiteStore((state) => state.syncFromStorage);

  useEffect(() => {
    syncFromStorage();
    return subscribeSiteStorage(syncFromStorage);
  }, [syncFromStorage]);
};
