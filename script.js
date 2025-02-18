// 照片数组 - 按章节分类
const photosByChapter = {
    heart: [],    // 三年心动
    wait: [],     // 九年沉淀
    future: []    // 未来
};

// 全局认证相关变量
let failedAttempts = 0;
const MAX_ATTEMPTS = 3;
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5分钟锁定（毫秒）

// 在文件开头添加WebP支持检测
async function checkWebPSupport() {
    const webP = new Image();
    webP.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    
    return new Promise((resolve) => {
        webP.onload = () => resolve(true);
        webP.onerror = () => resolve(false);
    });
}

// 修改异步加载图片函数
async function loadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// 修改初始化照片数组函数
async function initializePhotos() {
    console.log('开始初始化照片数组...');
    for (let chapter in photosByChapter) {
        console.log(`正在加载 ${chapter} 章节的照片...`);
        photosByChapter[chapter] = [];
        let index = 1;
        let consecutiveFails = 0;
        const maxConsecutiveFails = 3;
        const maxIndex = 200;

        while (index <= maxIndex && consecutiveFails < maxConsecutiveFails) {
            // 确保使用.webp格式
            const url = `photos/${chapter}/${index}.webp`;
            console.log(`尝试加载: ${url}`);
            try {
                const exists = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        console.log(`✅ 成功加载: ${url}`);
                        resolve(true);
                    };
                    img.onerror = () => {
                        console.log(`❌ 加载失败: ${url}`);
                        resolve(false);
                    };
                    img.src = url;
                });

                if (exists) {
                    photosByChapter[chapter].push({
                        id: `${chapter}${index}`,
                        url: url,  // 使用.webp格式的URL
                        date: new Date().toISOString()
                    });
                    consecutiveFails = 0;
                    index++;
                } else {
                    console.warn(`未找到图片: ${url}`);
                    consecutiveFails++;
                }
            } catch (error) {
                console.error(`加载出错 ${url}:`, error);
                consecutiveFails++;
            }
        }

        console.log(`${chapter} 章节加载完成，共找到 ${photosByChapter[chapter].length} 张照片`);
    }
    
    console.log('照片加载结果:', photosByChapter);
    return true;
}

// 修改创建图片元素函数
function createImageElement(photo) {
    const img = document.createElement('img');
    img.className = 'loading';
    img.dataset.src = photo.url;
    img.alt = '照片加载中...';
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                console.log(`开始加载图片: ${img.dataset.src}`);
                img.src = img.dataset.src;
                img.onload = () => {
                    console.log(`图片加载成功: ${img.dataset.src}`);
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                };
                img.onerror = () => {
                    console.error(`图片加载失败: ${img.dataset.src}`);
                    img.src = 'placeholder.jpg';
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                };
                observer.unobserve(img);
            }
        });
    }, {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    });
    
    observer.observe(img);
    return img;
}

// 全局变量
let currentChapter = 'heart';
let currentSlide = 0;
let comments = JSON.parse(localStorage.getItem('comments') || '{}');
const CORRECT_DATE = '20250110';
let isAuthenticated = false;

// 初始化幻灯片
function initSlideshow() {
    const slidesWrapper = document.querySelector('.slides-wrapper');
    const prevButton = document.getElementById('prevSlide');
    const nextButton = document.getElementById('nextSlide');
    const backButton = document.getElementById('backToGrid');
    
    const photos = photosByChapter[currentChapter];
    let currentSlideIndex = 0;
    
    slidesWrapper.innerHTML = '';
    if (!photos || photos.length === 0) {
        slidesWrapper.innerHTML = '<div class="error">还没有照片</div>';
        return;
    }

    // 创建所有幻灯片
    const slides = photos.map((photo, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.style.position = 'absolute';
        slide.style.left = `${index * 100}%`;
        return slide;
    });

    // 更新显示函数（使用函数表达式）
    const updateSlide = function(newIndex) {
        if (newIndex < 0 || newIndex >= photos.length) return;
        currentSlideIndex = newIndex;
        currentSlide = newIndex; // 更新全局变量
        slidesWrapper.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
        displayComments(photos[currentSlideIndex].id);
        
        // 更新按钮显示
        prevButton.style.display = currentSlideIndex > 0 ? 'block' : 'none';
        nextButton.style.display = currentSlideIndex < photos.length - 1 ? 'block' : 'none';
        backButton.style.display = currentSlideIndex > 0 ? 'block' : 'none';
    };

    // 创建缩略图网格
    const gridSlide = slides[0];
    const grid = document.createElement('div');
    grid.className = 'thumbnail-grid';
    
    // 总数显示
    const totalCount = document.createElement('div');
    totalCount.className = 'total-count';
    totalCount.textContent = `共 ${photos.length - 1} 张照片`;
    grid.appendChild(totalCount);
    
    // 添加缩略图
    photos.slice(1).forEach((photo, i) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'grid-thumbnail';
        
        // 编号
        const number = document.createElement('div');
        number.className = 'thumbnail-number';
        number.textContent = i + 1;
        thumbnail.appendChild(number);
        
        // 图片
        const img = createImageElement(photo);
        thumbnail.appendChild(img);
        
        // 点击事件（现在可以访问updateSlide）
        thumbnail.onclick = function() {
            updateSlide(i + 1);
        };
        
        grid.appendChild(thumbnail);
    });
    
    gridSlide.appendChild(grid);

    // 创建照片视图
    photos.slice(1).forEach((photo, i) => {
        const container = document.createElement('div');
        container.className = 'photo-container';
        
        // 添加照片编号和跳转控制
        const controls = document.createElement('div');
        controls.className = 'photo-controls';
        
        // 添加照片编号显示
        const photoNumber = document.createElement('span');
        photoNumber.className = 'photo-number';
        photoNumber.textContent = `${i + 1}/${photos.length - 1}`;
        controls.appendChild(photoNumber);
        
        // 添加跳转输入框
        const jumpInput = document.createElement('input');
        jumpInput.type = 'number';
        jumpInput.min = 1;
        jumpInput.max = photos.length - 1;
        jumpInput.placeholder = '跳转到...';
        jumpInput.className = 'jump-input';
        controls.appendChild(jumpInput);
        
        // 跳转按钮
        const jumpButton = document.createElement('button');
        jumpButton.className = 'jump-button';
        jumpButton.textContent = '跳转';
        jumpButton.onclick = function() {
            const num = parseInt(jumpInput.value);
            if (num >= 1 && num <= photos.length - 1) {
                updateSlide(num);
            }
        };
        controls.appendChild(jumpButton);
        
        // 返回按钮
        const backToGridBtn = document.createElement('button');
        backToGridBtn.className = 'back-to-grid-btn';
        backToGridBtn.textContent = '返回相册';
        backToGridBtn.onclick = function() {
            updateSlide(0);
        };
        controls.appendChild(backToGridBtn);
        
        container.appendChild(controls);
        container.appendChild(createImageElement(photo));
        slides[i + 1].appendChild(container);
    });

    // 添加所有幻灯片到容器
    slides.forEach(slide => slidesWrapper.appendChild(slide));

    // 按钮事件绑定
    prevButton.onclick = function() {
        if (currentSlideIndex > 0) updateSlide(currentSlideIndex - 1);
    };
    nextButton.onclick = function() {
        if (currentSlideIndex < photos.length - 1) updateSlide(currentSlideIndex + 1);
    };
    backButton.onclick = function() {
        updateSlide(0);
    };

    // 初始化显示
    updateSlide(0);
}

// 显示评论
function displayComments(photoId) {
    const container = document.querySelector('.comments-container');
    container.innerHTML = '';
    
    const photoComments = comments[photoId] || [];
    photoComments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.textContent = comment.content;
        container.appendChild(commentDiv);
    });
}

// 添加评论
function addComment(photoId, content) {
    if (!comments[photoId]) {
        comments[photoId] = [];
    }
    
    comments[photoId].push({
        content,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('comments', JSON.stringify(comments));
    displayComments(photoId);
}

// 添加认证函数
function initAuth() {
    const authOverlay = document.getElementById('auth-overlay');
    const authInput = document.getElementById('authDate');
    const authSubmit = document.getElementById('authSubmit');
    const authError = document.getElementById('authError');
    const lockMessage = document.getElementById('lockMessage');

    // 检查锁定状态
    const lockUntil = sessionStorage.getItem('lockUntil');
    if (lockUntil && Date.now() < parseInt(lockUntil)) {
        showLockMessage(lockMessage, authInput, authSubmit);
        return;
    }

    // 重置认证状态（每次都需要重新认证）
    isAuthenticated = false;
    authOverlay.classList.remove('hidden');

    // 输入验证
    authInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // 提交事件
    authSubmit.addEventListener('click', () => handleAuthSubmit());

    // 回车键提交
    authInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAuthSubmit();
    });

    async function handleAuthSubmit() {
        if (failedAttempts >= MAX_ATTEMPTS) {
            lockAccount(lockMessage, authInput, authSubmit);
            return;
        }

        const date = authInput.value;
        if (date === CORRECT_DATE) {
            // 认证成功
            isAuthenticated = true;
            authOverlay.classList.add('hidden');
            initializePage();
            failedAttempts = 0; // 重置失败计数
        } else {
            // 认证失败
            failedAttempts++;
            authError.textContent = `密码错误（剩余尝试次数：${MAX_ATTEMPTS - failedAttempts}）`;
            authInput.value = '';
            authInput.focus();

            if (failedAttempts >= MAX_ATTEMPTS) {
                lockAccount(lockMessage, authInput, authSubmit);
            }
        }
    }

    function lockAccount(lockMessage, authInput, authSubmit) {
        const lockUntil = Date.now() + LOCK_TIMEOUT;
        sessionStorage.setItem('lockUntil', lockUntil);
        showLockMessage(lockMessage, authInput, authSubmit);
    }

    function showLockMessage(lockMessage, authInput, authSubmit) {
        authInput.style.display = 'none';
        authSubmit.style.display = 'none';
        lockMessage.style.display = 'block';
        authError.textContent = '';
    }
}

// 修改createInteractiveBackground函数
function createInteractiveBackground() {
    const bg = document.createElement('div');
    bg.className = 'interactive-bg';
    
    // 创建持续漂浮的爱心
    function createFloatingHeart() {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.animationDuration = `${Math.random() * 5 + 5}s`;
        bg.appendChild(heart);
        
        setTimeout(() => heart.remove(), 5000);
    }
    
    // 自动生成爱心（每秒一个）
    setInterval(createFloatingHeart, 1000);
    
    document.body.appendChild(bg);
}

// 修改initializePage函数
async function initializePage() {
    if (!isAuthenticated && !initAuth()) {
        return;
    }

    try {
        // 添加互动背景
        createInteractiveBackground();
        
        // 显示加载进度条
        const loadingBar = document.createElement('div');
        loadingBar.className = 'loading-bar';
        document.body.appendChild(loadingBar);
        
        // 更新进度条
        const updateProgress = (progress) => {
            loadingBar.style.width = `${progress}%`;
        };
        
        // 初始化步骤
        updateProgress(10);
        const supportsWebP = await checkWebPSupport();
        updateProgress(30);
        await initializePhotos();
        updateProgress(70);
        initSlideshow();
        updateProgress(100);
        
        // 移除进度条
        setTimeout(() => loadingBar.remove(), 500);
        
        // 添加章节切换事件
        document.querySelectorAll('.chapter').forEach(chapterDiv => {
            chapterDiv.addEventListener('click', () => {
                const chapter = chapterDiv.dataset.chapter;
                if (chapter !== currentChapter) {
                    currentChapter = chapter;
                    document.querySelectorAll('.chapter').forEach(div => {
                        div.classList.remove('active');
                    });
                    chapterDiv.classList.add('active');
                    initSlideshow();
                }
            });
        });
        
        // 添加评论提交功能
        const commentContent = document.getElementById('commentContent');
        document.getElementById('submitComment').addEventListener('click', () => {
            const content = commentContent.value.trim();
            if (content) {
                const photos = photosByChapter[currentChapter];
                if (photos && photos.length > 0) {
                    addComment(photos[currentSlide].id, content);
                    commentContent.value = '';
                }
            }
        });
        
    } catch (error) {
        console.error('初始化失败:', error);
        document.querySelector('.slides-wrapper').innerHTML = '<div class="error">加载失败，请刷新页面重试</div>';
    }
}

// 修改音乐播放器初始化函数
function initMusicPlayer() {
    console.log('初始化音乐播放器...');  // 添加调试日志
    
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicSelect = document.getElementById('musicSelect');
    
    if (!bgMusic || !musicToggle || !musicSelect) {
        console.error('找不到音乐播放器元素');
        return;
    }
    
    let musicPlaying = false;
    
    // 初始化音乐播放器状态
    bgMusic.volume = 0.5;
    musicToggle.classList.remove('playing');
    
    // 音乐切换按钮点击事件
    musicToggle.onclick = function() {
        console.log('点击音乐按钮');  // 添加调试日志
        
        if (!musicPlaying) {
            console.log('尝试播放音乐');
            bgMusic.play()
                .then(() => {
                    console.log('音乐开始播放');
                    musicToggle.classList.add('playing');
                    musicPlaying = true;
                })
                .catch(error => {
                    console.error('播放失败:', error);
                });
        } else {
            console.log('暂停音乐');
            bgMusic.pause();
            musicToggle.classList.remove('playing');
            musicPlaying = false;
        }
    };
    
    // 音乐选择事件
    musicSelect.onchange = function() {
        console.log('切换音乐:', this.value);  // 添加调试日志
        const wasPlaying = !bgMusic.paused;
        bgMusic.src = `music/${this.value}`;
        
        if (wasPlaying) {
            bgMusic.play()
                .then(() => {
                    console.log('新音乐开始播放');
                    musicToggle.classList.add('playing');
                    musicPlaying = true;
                })
                .catch(error => {
                    console.error('切换音乐失败:', error);
                });
        }
    };
    
    console.log('音乐播放器初始化完成');  // 添加调试日志
}

// 添加缓存优化
function initCache() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/仓库名/sw.js')  // 替换成你的GitHub仓库名
            .then(reg => {
                console.log('Service Worker 注册成功:', reg.scope);
            })
            .catch(error => {
                console.error('Service Worker 注册失败:', error);
            });
    }
}

// 在页面初始化时注册
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化页面');
    initMusicPlayer();
    initializePage();
    initCache();  // 添加这行
}); 