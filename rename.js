const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // 需要先安装: npm install sharp

// 章节目录
const chapters = ['heart', 'wait', 'future'];

// 转换为webp并重命名
async function processImages() {
    for (const chapter of chapters) {
        const chapterPath = path.join(__dirname, 'photos', chapter);
        
        // 确保目录存在
        if (!fs.existsSync(chapterPath)) {
            console.log(`创建目录: ${chapterPath}`);
            fs.mkdirSync(chapterPath, { recursive: true });
            continue;
        }
        
        // 读取目录下的所有文件
        const files = fs.readdirSync(chapterPath)
            .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
            .sort((a, b) => {
                const numA = parseInt(path.parse(a).name);
                const numB = parseInt(path.parse(b).name);
                return numA - numB;
            });
            
        console.log(`处理 ${chapter} 章节，共 ${files.length} 张图片`);
        
        // 处理每个文件
        for (let i = 0; i < files.length; i++) {
            const oldPath = path.join(chapterPath, files[i]);
            const newName = `${i + 1}.webp`;
            const newPath = path.join(chapterPath, newName);
            
            try {
                // 转换为webp格式
                await sharp(oldPath)
                    .webp({ quality: 80 }) // 设置webp质量
                    .toFile(newPath);
                
                // 删除原文件
                fs.unlinkSync(oldPath);
                
                console.log(`✅ ${files[i]} -> ${newName}`);
            } catch (error) {
                console.error(`❌ 处理失败 ${files[i]}: ${error.message}`);
            }
        }
    }
}

// 执行转换
processImages().then(() => {
    console.log('所有图片处理完成！');
}).catch(error => {
    console.error('处理过程出错:', error);
}); 