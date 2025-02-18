// 创建service worker文件
const CACHE_NAME = 'our-story-v1';
const ASSETS = [
    'ysht.io/',  // 移除开头的斜杠
    'ysht.io/index.html',
    'ysht.io/styles.css',
    'ysht.io/script.js',
    'ysht.io/placeholder.jpg',
    'ysht.io/music/1.mp3',
    'ysht.io/music/2.mp3',
    'ysht.io/music/3.mp3',
    'ysht.io/music/4.mp3',
    'ysht.io/music/5.mp3'
];

// 安装时清理旧缓存
self.addEventListener('install', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
            })
            .then(() => caches.open(CACHE_NAME))
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// 添加激活事件处理
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // 清理旧缓存
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // 立即接管页面
            self.clients.claim()
        ])
    );
});

// 添加消息处理
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 