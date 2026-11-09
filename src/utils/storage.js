/**
 * Thin, safe wrapper around Web Storage.
 * All application data is namespaced with "ems:" to avoid collisions.
 */
const PREFIX = 'ems:';

function createStore(area) {
  return {
    get(key, fallback = null) {
      try {
        const raw = area.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        area.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        area.removeItem(PREFIX + key);
      } catch {
        /* storage unavailable */
      }
    },
  };
}

export const storage = createStore(window.localStorage);
export const sessionStore = createStore(window.sessionStorage);
