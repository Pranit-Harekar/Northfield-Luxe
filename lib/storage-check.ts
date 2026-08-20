// Detects whether the browser is actually granting access to the storage
// this app depends on (localStorage for the session, IndexedDB for
// everything else). Both can be silently unavailable — private/incognito
// modes, "block third-party cookies/site data" settings, or embedding this
// app in a sandboxed iframe can all cause reads/writes to throw or no-op —
// so we probe them explicitly instead of assuming they work.

export interface StorageAvailability {
  localStorage: boolean;
  indexedDB: boolean;
}

const PROBE_KEY = "atlas-commerce:storage-check";

function checkLocalStorage(): boolean {
  try {
    window.localStorage.setItem(PROBE_KEY, "1");
    window.localStorage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function checkIndexedDB(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(false);
      return;
    }
    try {
      const request = indexedDB.open(PROBE_KEY);
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase(PROBE_KEY);
        resolve(true);
      };
      request.onerror = () => resolve(false);
      request.onblocked = () => resolve(true);
    } catch {
      resolve(false);
    }
  });
}

/** Probes whether localStorage and IndexedDB are actually usable in this browser context. */
export async function checkStorageAvailability(): Promise<StorageAvailability> {
  const [localStorageOk, indexedDBOk] = await Promise.all([
    Promise.resolve(checkLocalStorage()),
    checkIndexedDB(),
  ]);
  return { localStorage: localStorageOk, indexedDB: indexedDBOk };
}
