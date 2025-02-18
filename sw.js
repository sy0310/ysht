// 创建service worker文件
const CACHE_NAME = 'our-story-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/placeholder.jpg',
    '/music/1.mp3',
    '/music/2.mp3',
    '/music/3.mp3',
    '/music/4.mp3',
    '/music/5.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
}); 