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
})

// ==========================================================================
// カスタムマウスカーソルの追従制御（画面外検知つき）
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (!cursorDot || !cursorOutline) return;

    // マウス移動時に位置を更新＆表示状態にする
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.style.left = `${posX}px`;
        cursorOutline.style.top = `${posY}px`;

        // マウスが動いたら表示クラスを付与
        document.body.classList.add('cursor-active');
    });

    // マウスがウィンドウの外に出たとき（はみ出たとき）に消す
    document.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-active');
    });

    // マウスがウィンドウ内に戻ったときに再表示する
    document.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-active');
    });

    // リンクやボタンの上に載った時のホバーエフェクト
    const interactiveElements = document.querySelectorAll('a, button, .btn, .card');

    interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('hovered');
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovered');
        });
    });
});