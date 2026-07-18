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

// 「球投げ」のカードをクリックした時のちょっとしたギミック
const ballCard = document.querySelector('.clickable-card');

if (ballCard) {
    ballCard.addEventListener('click', () => {
        // コンソールにこっそりメッセージを表示（エンジニアらしく！）
        console.log("⚾ ピッチングメカニクス発動：エネルギー伝達率 100%!");
        
        // カードを一時的に光らせるエフェクト
        ballCard.style.boxShadow = "0 0 25px rgba(56, 189, 248, 0.8)";
        ballCard.style.transition = "boxShadow 0.1s ease";
        
        alert("ナイスピッチ！ 圧倒的な球速のストレートが、サーバーの壁を突き抜けました！");
        
        setTimeout(() => {
            ballCard.style.boxShadow = "none";
        }, 500);
    });
}