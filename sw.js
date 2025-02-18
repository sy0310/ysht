// 创建service worker文件
const CACHE_NAME = 'our-story-v1';
const ASSETS = [
    '/ysht.io/',  // 修改为正确的仓库名
    '/ysht.io/index.html',
    '/ysht.io/styles.css',
    '/ysht.io/script.js',
    '/ysht.io/placeholder.jpg',
    '/ysht.io/music/1.mp3',
    '/ysht.io/music/2.mp3',
    '/ysht.io/music/3.mp3',
    '/ysht.io/music/4.mp3',
    '/ysht.io/music/5.mp3'
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