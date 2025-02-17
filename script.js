// 照片数组 - 按章节分类
const photosByChapter = {
    heart: [],    // 三年心动
    wait: [],     // 九年沉淀
    future: []    // 未来
};

// 在文件开头添加音乐相关变量
let bgMusic = null;
let musicPlaying = false;

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
    for (let chapter in photosByChapter) {
        photosByChapter[chapter] = [];
        let index = 1;
        let consecutiveFails = 0;
        const maxConsecutiveFails = 3; // 允许连续失败次数
        const maxIndex = 200; // 最大检查数量

        while (index <= maxIndex && consecutiveFails < maxConsecutiveFails) {
            const url = `photos/${chapter}/${index}.jpg`;
            try {
                // 使用更可靠的图片检查方式
                const exists = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = url;
                });

                if (exists) {
                    photosByChapter[chapter].push({
                        id: `${chapter}${index}`,
                        url: url,
                        date: new Date().toISOString()
                    });
                    console.log(`✅ Found: ${url}`);
                    consecutiveFails = 0; // 重置连续失败计数
                    index++;
                } else {
                    console.warn(`❌ Missing: ${url}`);
                    consecutiveFails++;
                }
            } catch (error) {
                console.error(`🚨 Error checking ${url}:`, error);
                consecutiveFails++;
            }
        }

        console.log(`📊 ${chapter}章节加载完成，共 ${photosByChapter[chapter].length} 张照片`);
    }
    return true;
}

// 修改创建图片元素函数
function createImageElement(photo) {
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = '照片';
    img.loading = 'lazy';
    
    // 添加加载错误处理
    img.onerror = () => {
        console.error(`Failed to load image: ${photo.url}`);
        img.src = 'placeholder.jpg';
    };
    
    // 添加加载状态类
    img.classList.add('loading');
    img.onload = () => {
        img.classList.remove('loading');
        img.classList.add('loaded');
    };
    
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
    
    // 清空并检查照片
    slidesWrapper.innerHTML = '';
    if (!photos || photos.length === 0) {
        slidesWrapper.innerHTML = '<div class="error">还没有照片</div>';
        return;
    }

    // 添加照片
    photos.forEach((photo, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.style.position = 'absolute';
        slide.style.left = `${index * 100}%`;
        
        if (index === 0) {
            // 第一页显示缩略图网格
            slide.appendChild(createThumbnailGrid(photos));
        } else {
            slide.appendChild(createImageElement(photo));
        }
        
        slidesWrapper.appendChild(slide);
    });

    // 更新显示函数
    function updateSlide(newIndex) {
        if (newIndex < 0 || newIndex >= photos.length) return;
        currentSlide = newIndex;
        slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        displayComments(photos[currentSlide].id);
        
        // 更新按钮状态
        prevButton.style.display = currentSlide > 0 ? 'block' : 'none';
        nextButton.style.display = currentSlide < photos.length - 1 ? 'block' : 'none';
        backButton.style.display = currentSlide > 0 ? 'block' : 'none';
    }

    // 绑定按钮事件
    prevButton.onclick = () => currentSlide > 0 && updateSlide(currentSlide - 1);
    nextButton.onclick = () => currentSlide < photos.length - 1 && updateSlide(currentSlide + 1);
    backButton.onclick = () => updateSlide(0);

    // 初始化显示
    updateSlide(0);
}

// 修改创建缩略图网格函数
function createThumbnailGrid(photos) {
    const grid = document.createElement('div');
    grid.className = 'thumbnail-grid';
    
    // 添加总数显示
    const totalCount = document.createElement('div');
    totalCount.className = 'total-count';
    totalCount.textContent = `共 ${photos.length - 1} 张照片`;
    grid.appendChild(totalCount);
    
    photos.slice(1).forEach((photo, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'grid-thumbnail';
        
        // 添加编号
        const number = document.createElement('div');
        number.className = 'thumbnail-number';
        number.textContent = index + 1;
        thumbnail.appendChild(number);
        
        const img = createImageElement(photo);
        thumbnail.appendChild(img);
        
        thumbnail.onclick = () => {
            currentSlide = index + 1;
            const slidesWrapper = document.querySelector('.slides-wrapper');
            slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
            displayComments(photos[currentSlide].id);
        };
        
        grid.appendChild(thumbnail);
    });
    
    return grid;
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

    // 检查是否已认证
    if (localStorage.getItem('isAuthenticated') === 'true') {
        authOverlay.classList.add('hidden');
        isAuthenticated = true;
        return true;
    }

    // 添加输入验证
    authInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // 添加提交事件
    authSubmit.addEventListener('click', () => {
        const date = authInput.value;
        if (date === CORRECT_DATE) {
            localStorage.setItem('isAuthenticated', 'true');
            isAuthenticated = true;
            authOverlay.classList.add('hidden');
            initializePage();
        } else {
            authError.textContent = '日期不正确，请重试';
            authInput.value = '';
            authInput.focus();
        }
    });

    // 添加回车键提交
    authInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            authSubmit.click();
        }
    });

    return false;
}

// 修改初始化页面函数
async function initializePage() {
    if (!isAuthenticated && !initAuth()) {
        return;
    }

    try {
        // 显示加载状态
        document.querySelector('.slides-wrapper').innerHTML = '<div class="loading">加载中...</div>';
        
        // 初始化音乐播放器
        initMusicPlayer();
        
        // 初始化照片数组
        await initializePhotos();
        
        // 初始化显示
        initSlideshow();
        
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

// 添加音乐播放器初始化函数
function initMusicPlayer() {
    bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicSelect = document.getElementById('musicSelect');
    
    // 初始化音乐播放器状态
    bgMusic.volume = 0.5;
    musicToggle.classList.remove('playing');
    
    // 音乐切换按钮点击事件
    musicToggle.addEventListener('click', () => {
        if (musicPlaying) {
            bgMusic.pause();
            musicToggle.classList.remove('playing');
        } else {
            bgMusic.play();
            musicToggle.classList.add('playing');
        }
        musicPlaying = !musicPlaying;
    });
    
    // 音乐选择事件
    musicSelect.addEventListener('change', () => {
        const wasPlaying = !bgMusic.paused;
        bgMusic.src = `music/${musicSelect.value}`;
        if (wasPlaying) {
            bgMusic.play();
        }
    });
    
    // 音乐结束事件
    bgMusic.addEventListener('ended', () => {
        if (musicPlaying) {
            bgMusic.play();
        }
    });
    
    // 音乐加载错误处理
    bgMusic.addEventListener('error', (e) => {
        console.error('Music loading error:', e);
        musicToggle.classList.remove('playing');
        musicPlaying = false;
    });
    
    // 自动播放处理
    bgMusic.addEventListener('canplaythrough', () => {
        if (musicPlaying) {
            bgMusic.play().catch(error => {
                console.error('Autoplay prevented:', error);
                musicPlaying = false;
                musicToggle.classList.remove('playing');
            });
        }
    });
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializePage); 