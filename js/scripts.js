// ==========================================================================
// スクロール時のヘッダー表示切り替え
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (!header) return;

    const updateHeader = () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
});

// ==========================================================================
// タイピングアニメーション終了時にカーソルを非表示にする（TOPページのみ存在）
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const typingText = document.querySelector('.typing-text');

    if (typingText) {
        typingText.addEventListener('animationend', (e) => {
            if (e.animationName === 'typing') {
                typingText.classList.add('typed-complete');
            }
        });
    }
});

// ==========================================================================
// 現在のページに対応するナビゲーションリンクをハイライト
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = document.body.dataset.page;
    if (!currentPage) return;

    document.querySelectorAll('header nav a').forEach((link) => {
        if (link.dataset.page === currentPage) {
            link.classList.add('active');
        }
    });
});

// ==========================================================================
// カスタムマウスカーソルの追従制御（PCの通常幅 + マウス操作時のみ）
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (!cursorDot || !cursorOutline) return;

    const customCursorQuery = window.matchMedia(
        '(min-width: 901px) and (hover: hover) and (pointer: fine)'
    );

    const updateCursorMode = () => {
        const isEnabled = customCursorQuery.matches;

        document.body.classList.toggle('custom-cursor-enabled', isEnabled);

        if (!isEnabled) {
            document.body.classList.remove('cursor-active', 'hovered');
        }
    };

    updateCursorMode();

    if (typeof customCursorQuery.addEventListener === 'function') {
        customCursorQuery.addEventListener('change', updateCursorMode);
    } else {
        customCursorQuery.addListener(updateCursorMode);
    }

    window.addEventListener('mousemove', (e) => {
        if (!customCursorQuery.matches) return;

        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.style.left = `${posX}px`;
        cursorOutline.style.top = `${posY}px`;

        document.body.classList.add('cursor-active');
    });

    document.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-active');
    });

    document.addEventListener('mouseenter', () => {
        if (customCursorQuery.matches) {
            document.body.classList.add('cursor-active');
        }
    });

    const interactiveElements = document.querySelectorAll('a, button, .btn, .card');

    interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            if (customCursorQuery.matches) {
                document.body.classList.add('hovered');
            }
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovered');
        });
    });
});

// ==========================================================================
// お問い合わせフォーム（送信機能なし・入力内容をその場で確認表示）
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const successBox = document.getElementById('form-success');

    if (!form || !successBox) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = form.querySelector('#name').value.trim();

        successBox.querySelector('.form-success-name').textContent = name || 'ゲスト';
        successBox.classList.add('visible');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        form.reset();
    });
});

// ==========================================================================
// ハンバーガーメニューの開閉制御
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (!hamburger || !navMenu) return;

    // ボタンクリックでメニュー開閉
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navMenu.classList.toggle('open');
    });

    // メニュー項目をクリックしたらメニューを閉じる
    document.querySelectorAll('header nav a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navMenu.classList.remove('open');
        });
    });
});
