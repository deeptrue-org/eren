import { useState, useEffect } from 'react';
import { STORAGE_KEYS, RECENT_URLS_LIMIT } from '../app/keywords/constants';

export const useUrlManagement = () => {
  const [recentWebUrls, setRecentWebUrls] = useState<string[]>([]);
  const [recentNotionUrls, setRecentNotionUrls] = useState<string[]>([]);

  // Load URLs from localStorage on initial render
  useEffect(() => {
    try {
      const storedWebUrls = localStorage.getItem(STORAGE_KEYS.RECENT_WEB_URLS);
      if (storedWebUrls) setRecentWebUrls(JSON.parse(storedWebUrls));
      const storedNotionUrls = localStorage.getItem(
        STORAGE_KEYS.RECENT_NOTION_URLS
      );
      if (storedNotionUrls) setRecentNotionUrls(JSON.parse(storedNotionUrls));
    } catch (error) {
      console.error('Failed to parse URLs from localStorage', error);
    }
  }, []);

  // Centralized function to update state and localStorage
  const updateRecentUrls = (
    updater: (prev: string[]) => string[],
    type: 'web' | 'notion'
  ) => {
    const key =
      type === 'web'
        ? STORAGE_KEYS.RECENT_WEB_URLS
        : STORAGE_KEYS.RECENT_NOTION_URLS;
    const setter = type === 'web' ? setRecentWebUrls : setRecentNotionUrls;
    setter((prevUrls) => {
      const newUrls = updater(prevUrls);
      try {
        localStorage.setItem(key, JSON.stringify(newUrls));
      } catch (error) {
        console.error(
          `Failed to save URLs to localStorage for key: ${key}`,
          error
        );
      }
      return newUrls;
    });
  };

  const addUrlToRecent = (url: string, type: 'web' | 'notion') => {
    if (!url || !url.trim()) return;
    updateRecentUrls((prevUrls) => {
      if (prevUrls.includes(url)) return prevUrls;
      return [url, ...prevUrls].slice(0, RECENT_URLS_LIMIT);
    }, type);
  };

  const removeUrl = (urlToRemove: string, type: 'web' | 'notion') => {
    updateRecentUrls(
      (prevUrls) => prevUrls.filter((url) => url !== urlToRemove),
      type
    );
  };

  return {
    recentWebUrls,
    recentNotionUrls,
    addUrlToRecent,
    removeUrl,
  };
};
