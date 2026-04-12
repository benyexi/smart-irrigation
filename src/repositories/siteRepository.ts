import type { Site } from '../types/site';
import {
  deleteSite as deleteStoredSite,
  getCurrentSiteId,
  getSiteStorageSnapshot,
  getSites,
  saveSite as saveStoredSite,
  setCurrentSiteId,
  subscribeSiteStorage,
} from '../utils/siteStorage';

export type SiteSnapshot = {
  sites: Site[];
  currentSiteId: string;
};

export interface SiteRepository {
  getSnapshot: () => SiteSnapshot;
  listSites: () => Site[];
  getCurrentSiteId: () => string;
  setCurrentSiteId: (id: string) => void;
  saveSite: (site: Site) => void;
  deleteSite: (id: string) => void;
  subscribe: (listener: () => void) => () => void;
}

export const localSiteRepository: SiteRepository = {
  getSnapshot: () => getSiteStorageSnapshot(),
  listSites: () => getSites(),
  getCurrentSiteId: () => getCurrentSiteId(),
  setCurrentSiteId: (id) => setCurrentSiteId(id),
  saveSite: (site) => saveStoredSite(site),
  deleteSite: (id) => deleteStoredSite(id),
  subscribe: (listener) => subscribeSiteStorage(listener),
};
