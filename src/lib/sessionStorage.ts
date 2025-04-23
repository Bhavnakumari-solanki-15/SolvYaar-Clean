/**
 * Helper functions for working with sessionStorage to persist navigation state
 */

export const saveLastVisitedPath = (path: string) => {
  try {
    if (path !== '/login' && path !== '/signup' && path !== '/') {
      sessionStorage.setItem('lastVisitedPath', path);
    }
  } catch (error) {
    console.error('Error saving path to sessionStorage:', error);
  }
};

export const getLastVisitedPath = (): string => {
  try {
    return sessionStorage.getItem('lastVisitedPath') || '/';
  } catch (error) {
    console.error('Error getting path from sessionStorage:', error);
    return '/';
  }
};

export const clearLastVisitedPath = () => {
  try {
    sessionStorage.removeItem('lastVisitedPath');
  } catch (error) {
    console.error('Error clearing path from sessionStorage:', error);
  }
}; 