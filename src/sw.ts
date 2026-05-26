/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { saveSharedFiles } from './lib/db';

declare let self: ServiceWorkerGlobalScope;

// Clean up old caches from previous versions
cleanupOutdatedCaches();

// Precache all assets built by Vite
precacheAndRoute(self.__WB_MANIFEST);

// Force active service worker to take control immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercept Web Share Target POST requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const files = formData.getAll('file') as File[];

          if (files && files.length > 0) {
            // Save files to IndexedDB
            await saveSharedFiles(files);
          }
        } catch (err) {
          console.error('Service Worker: error handling shared files:', err);
        }

        // Redirect to homepage with query indicator so React app can consume them
        return Response.redirect('/?shared=true', 303);
      })()
    );
  }
});
