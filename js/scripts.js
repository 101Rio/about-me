// スクロール時のヘッダーアニメーション（少し透過をコントロール）
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.padding = '15px 40px';
        header.style.backgroundColor = 'rgba(10, 15, 29, 0.95)';
    } else {
        header.style.padding = '20px 40px';
        header.style.backgroundColor = 'rgba(10, 15, 29, 0.9)';
    }
});


// タイピングアニメーション終了時にカーソルを非表示にする
document.addEventListener('DOMContentLoaded', () => {
    const typingText = document.querySelector('.typing-text');
    
    if (typingText) {
        // CSSのアニメーション(typing)が終わったイベントを検知
        typingText.addEventListener('animationend', (e) => {
            // widthアニメーションが完了したタイミングでクラスを付与
            if (e.animationName === 'typing') {
                typingText.classList.add('typed-complete');
            }
        });
    }
});