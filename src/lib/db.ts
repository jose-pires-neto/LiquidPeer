export interface StoredSharedFile {
  name: string;
  type: string;
  data: Blob;
}

/**
 * Opens connection to IndexedDB database 'liquidpeer-db'
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('liquidpeer-db', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('shared-files')) {
        db.createObjectStore('shared-files', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Saves shared files into IndexedDB under a single record with ID 'pending'
 */
export async function saveSharedFiles(files: File[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shared-files', 'readwrite');
    const store = tx.objectStore('shared-files');

    // Create serializable structure while retaining Blob data
    const record = {
      id: 'pending',
      files: files.map(file => ({
        name: file.name,
        type: file.type,
        data: file // IndexedDB natively supports storing File/Blob objects
      }))
    };

    store.put(record);

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(tx.error);
    };
  });
}

/**
 * Retrieves the pending shared files from IndexedDB
 */
export async function getSharedFiles(): Promise<StoredSharedFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shared-files', 'readonly');
    const store = tx.objectStore('shared-files');
    const request = store.get('pending');

    request.onsuccess = () => {
      if (request.result && Array.isArray(request.result.files)) {
        resolve(request.result.files);
      } else {
        resolve([]);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Deletes any pending shared files record in IndexedDB
 */
export async function clearSharedFiles(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shared-files', 'readwrite');
    const store = tx.objectStore('shared-files');
    store.delete('pending');

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(tx.error);
    };
  });
}
