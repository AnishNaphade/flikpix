import { useState, useEffect, useCallback } from 'react';
import { listsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for managing user lists (favorites, must_watch, watched)
 */
export function useUserLists() {
  const { isAuthenticated } = useAuth();
  const [lists, setLists] = useState({
    favorite: [],
    must_watch: [],
    watched: [],
  });
  const [loading, setLoading] = useState(false);
  const [itemStatuses, setItemStatuses] = useState({});

  // Fetch all lists
  const fetchLists = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await listsAPI.getAll();
      const organized = { favorite: [], must_watch: [], watched: [] };
      (data.items || []).forEach(item => {
        if (organized[item.list_type]) {
          organized[item.list_type].push(item);
        }
      });
      setLists(organized);
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Check if a specific item is in any list
  const checkItemStatus = useCallback(async (contentType, contentId) => {
    if (!isAuthenticated) return {};
    try {
      const data = await listsAPI.checkItem(contentType, contentId);
      const key = `${contentType}_${contentId}`;
      setItemStatuses(prev => ({ ...prev, [key]: data.lists }));
      return data.lists;
    } catch {
      return {};
    }
  }, [isAuthenticated]);

  // Add item to a list
  const addToList = useCallback(async (item, listType) => {
    if (!isAuthenticated) return;
    try {
      await listsAPI.addItem({
        content_id: item.id,
        content_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        list_type: listType,
        title: item.title || item.name,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        overview: item.overview,
        release_date: item.release_date || item.first_air_date,
      });
      await fetchLists();
      // Update item status cache
      const contentType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      await checkItemStatus(contentType, item.id);
      return true;
    } catch (err) {
      console.error('Failed to add to list:', err);
      return false;
    }
  }, [isAuthenticated, fetchLists, checkItemStatus]);

  // Remove item from a list
  const removeFromList = useCallback(async (contentType, contentId, listType) => {
    if (!isAuthenticated) return;
    try {
      await listsAPI.removeByContent(contentType, contentId, listType);
      await fetchLists();
      await checkItemStatus(contentType, contentId);
      return true;
    } catch (err) {
      console.error('Failed to remove from list:', err);
      return false;
    }
  }, [isAuthenticated, fetchLists, checkItemStatus]);

  // Toggle item in a list
  const toggleListItem = useCallback(async (item, listType) => {
    const contentType = item.media_type || item.content_type || (item.first_air_date ? 'tv' : 'movie');
    const contentId = item.id || item.content_id;
    const key = `${contentType}_${contentId}`;
    const currentStatus = itemStatuses[key] || {};

    if (currentStatus[listType]) {
      return removeFromList(contentType, contentId, listType);
    } else {
      return addToList({ ...item, media_type: contentType }, listType);
    }
  }, [itemStatuses, addToList, removeFromList]);

  // Check if item is in a specific list
  const isInList = useCallback((contentType, contentId, listType) => {
    const key = `${contentType}_${contentId}`;
    return !!(itemStatuses[key] && itemStatuses[key][listType]);
  }, [itemStatuses]);

  return {
    lists,
    loading,
    itemStatuses,
    fetchLists,
    addToList,
    removeFromList,
    toggleListItem,
    checkItemStatus,
    isInList,
  };
}

export default useUserLists;
