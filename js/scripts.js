"use strict";

// スマートフォンのナビゲーション。JavaScriptが無効な場合は通常のリンク一覧を表示する。
function setupNavigation() {
    const header = document.querySelector(".masthead");
    const button = header.querySelector(".menu-toggle");
    const nav = document.getElementById("main-nav");
    const smallScreen = window.matchMedia("(max-width: 850px)");

    function setOpen(open) {
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
        nav.classList.toggle("is-open", open);
    }

    button.hidden = false;
    header.classList.add("menu-ready");
    button.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.addEventListener("click", () => setOpen(false));
    document.addEventListener("pointerdown", (event) => {
        if (!header.contains(event.target) && nav.classList.contains("is-open")) setOpen(false);
    });
    header.addEventListener("focusout", (event) => {
        if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
            setOpen(false);
            button.focus();
        }
    });
    smallScreen.addEventListener("change", () => setOpen(false));
    window.addEventListener("pageshow", () => setOpen(false));
}

// 挨拶から名前まで、HTMLに書かれた順に一文字ずつ表示する。
async function typeGreeting() {
    const lines = Array.from(document.querySelectorAll("[data-typing]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!lines.length || reducedMotion.matches) return;

    const texts = lines.map(line => line.textContent);
    for (const line of lines) line.textContent = "";

    for (const [index, line] of lines.entries()) {
        line.classList.add("is-typing");
        for (const letter of texts[index]) {
            await new Promise(resolve => setTimeout(resolve, 60));
            if (reducedMotion.matches) {
                lines.forEach((part, i) => { part.textContent = texts[i]; });
                line.classList.remove("is-typing");
                return;
            }
            line.textContent += letter;
        }
        line.classList.remove("is-typing");
    }
}

// TOPの実機風ディスプレイ。見た目と読み上げの状態を一緒に切り替える。
function setupDisplay() {
    const figure = document.querySelector(".terminal-figure");
    if (!figure || !window.ProfileArt?.setPower) return;

    const canvas = figure.querySelector(".hero-art");
    const button = figure.querySelector(".power-toggle");
    const label = button.querySelector(".power-text");
    button.hidden = false;
    button.addEventListener("click", () => {
        const power = button.getAttribute("aria-pressed") !== "true";
        window.ProfileArt.setPower(canvas, power);
        button.setAttribute("aria-pressed", String(power));
        figure.dataset.power = power ? "on" : "off";
        label.textContent = power ? "Display on" : "Display off";
        canvas.setAttribute("aria-label", power
            ? "画面に RIO IMAI と表示された、キーボードとマウス付きのレトロPC"
            : "ディスプレイの電源を切ったレトロPC");
    });
}

// リングの中心をマウスの位置に合わせる。リンク上での拡大はCSSで扱う。
function setupPointer() {
    const root = document.documentElement;
    const ring = document.createElement("span");
    ring.className = "pointer-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.append(ring);

    const hide = () => root.classList.remove("has-mouse-position");
    function move(event) {
        if (event.pointerType !== "mouse") {
            hide();
            return;
        }
        ring.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        root.classList.add("has-mouse-position");
    }

    document.addEventListener("pointerover", move, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", move, { passive: true });
    root.addEventListener("pointerleave", hide);
    document.addEventListener("pointercancel", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("pagehide", hide);
}

// デモフォーム。下書きはページ内だけで扱う。
function setupContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const fields = document.getElementById("draft-fields");
    const preview = document.getElementById("draft-preview");
    const title = document.getElementById("preview-title");
    const status = preview.querySelector(".copy-status");
    const names = ["name", "email", "subject", "message"];

    form.addEventListener("input", (event) => {
        event.target.setCustomValidity("");
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        for (const name of names) {
            const input = form.elements.namedItem(name);
            const value = input.value.trim();
            if (input.required && !value) {
                input.setCustomValidity("空白以外の文字を入力してください。");
                input.reportValidity();
                return;
            }
            preview.querySelector(`[data-field="${name}"]`).textContent = value || "（未入力）";
        }

        status.textContent = "";
        form.hidden = true;
        preview.hidden = false;
        title.focus();
    });

    document.getElementById("edit-draft").addEventListener("click", () => {
        preview.hidden = true;
        form.hidden = false;
        form.elements.namedItem("name").focus();
    });

    const copyButton = document.getElementById("copy-draft");
    copyButton.addEventListener("click", async () => {
        const entries = [...preview.querySelectorAll("dl > div")];
        const draft = entries.map((entry) =>
            entry.querySelector("dt").textContent + "\n" + entry.querySelector("dd").textContent
        ).join("\n\n");
        try {
            await navigator.clipboard.writeText(draft);
            status.textContent = "下書きをコピーしました。";
        } catch {
            // ローカルファイルやクリップボードを許可していないブラウザでも選択・コピーできる。
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(preview.querySelector("dl"));
            selection.removeAllRanges();
            selection.addRange(range);
            status.textContent = "入力内容を選択しました。お使いの端末のコピー操作をご利用ください。";
        }
    });
    fields.disabled = false;
}

// トップでは描画前に目印を付け、完成した見出しが一瞬だけ見えるのを防ぐ。
document.documentElement.classList.add("typing-pending");
document.addEventListener("DOMContentLoaded", () => {
    typeGreeting();
    document.documentElement.classList.remove("typing-pending");
    setupNavigation();
    setupDisplay();
    setupPointer();
    setupContactForm();
}, { once: true });
