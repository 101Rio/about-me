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

// 挨拶だけを一文字ずつ表示し、名前と見出しの読み上げは最初から利用できるようにする。
function typeGreeting() {
    const greeting = document.querySelector("[data-typing]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!greeting || reducedMotion.matches) return;

    const text = greeting.textContent;
    const start = performance.now();
    greeting.textContent = text.slice(0, 1);
    greeting.classList.add("is-typing");
    function advance(now) {
        const count = reducedMotion.matches ? text.length : 1 + Math.floor((now - start) / 53);
        const visible = text.slice(0, Math.max(1, count));
        if (greeting.textContent !== visible) greeting.textContent = visible;
        if (count < text.length) requestAnimationFrame(advance);
        else greeting.classList.remove("is-typing");
    }
    requestAnimationFrame(advance);
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

// マウスで操作できる要素に重ねる、元サイトのカーソルリング。
function setupPointer() {
    const enabled = window.matchMedia("(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const ring = document.createElement("span");
    ring.className = "pointer-ring";
    ring.setAttribute("aria-hidden", "true");

    const hide = () => ring.classList.remove("visible");
    function move(event) {
        if (event.pointerType !== "mouse" || !event.target.closest("a, button")) {
            hide();
            return;
        }
        ring.style.transform = `translate3d(${event.clientX - 10.5}px, ${event.clientY - 10.5}px, 0)`;
        ring.classList.add("visible");
    }
    function update() {
        hide();
        if (enabled.matches) {
            document.body.append(ring);
            document.addEventListener("pointermove", move, { passive: true });
        } else {
            document.removeEventListener("pointermove", move);
            ring.remove();
        }
    }

    update();
    enabled.addEventListener("change", update);
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("scroll", hide, { passive: true });
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

setupNavigation();
typeGreeting();
setupDisplay();
setupPointer();
setupContactForm();
