import { useEffect } from 'react';
import { create } from 'zustand';
import type { Site } from '../types/site';
import { localSiteRepository } from '../repositories/siteRepository';

type SiteStore = {
  sites: Site[];
  currentSiteId: string;
  syncFromStorage: () => void;
  setCurrentSite: (id: string) => void;
  saveSite: (site: Site) => void;
  deleteSite: (id: string) => void;
};

const initialSnapshot = localSiteRepository.getSnapshot();

export const useSiteStore = create<SiteStore>((set) => ({
  ...initialSnapshot,

  syncFromStorage: () => set(localSiteRepository.getSnapshot()),

  setCurrentSite: (id) => {
    localSiteRepository.setCurrentSiteId(id);
    set(localSiteRepository.getSnapshot());
  },

  saveSite: (site) => {
    localSiteRepository.saveSite(site);
    set(localSiteRepository.getSnapshot());
  },

  deleteSite: (id) => {
    localSiteRepository.deleteSite(id);
    set(localSiteRepository.getSnapshot());
  },
}));

export const useSyncSiteStore = () => {
  const syncFromStorage = useSiteStore((state) => state.syncFromStorage);

  useEffect(() => {
    syncFromStorage();
    return localSiteRepository.subscribe(syncFromStorage);
  }, [syncFromStorage]);
};
