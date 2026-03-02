/* ============================================================
   REPLATE DARK MODE ENGINE v3.0

   ARCHITECTURE:
   - global.js  → owns hamburger, modal, toast, tabs, reveal
   - darkmode.js → owns ONLY: dark class toggle, matrix canvas,
                   cursor glow, 3D tilt, dm-toggle button injection
   
   STORAGE KEY: 'replate_dark_mode' (string 'true'/'false')
   
   KEY FIXES:
   - Does NOT touch hamburger (global.js handles it)
   - Does NOT apply global transition !important overrides
   - Does NOT inject hologram scan elements
   - Inserts dm-toggle button into nav ONCE, no duplicates
   - Works correctly with dashboard's manual #dmToggle
   ============================================================ */
(function () {
    'use strict';

    const STORAGE_KEY = 'replate_dark_mode';

    /* ── Read saved preference ── */
    let isDark = localStorage.getItem(STORAGE_KEY) === 'true';

    /* ── Prevent white flash: set background immediately ── */
    if (isDark) {
        document.documentElement.classList.add('dark-init');
        document.documentElement.style.background = '#06060f';
    }

    /* ── Internal state ── */
    let matrixRunning = false;
    let matrixAF      = null;
    let tiltEntries   = [];
    let cursorEl      = null;
    let cursorActive  = false;

    /* ════════════════════════════════════════════
       CORE: apply or remove dark mode
       ════════════════════════════════════════════ */
    function applyDark(dark, animate) {
        isDark = dark;
        localStorage.setItem(STORAGE_KEY, String(dark));

        if (animate) {
            runLoader(function () {
                commitDark(dark);
            });
        } else {
            commitDark(dark);
        }
    }

    function commitDark(dark) {
        /* Toggle body class */
        document.body.classList.toggle('dark-mode', dark);
        document.documentElement.classList.toggle('dark-init', dark);
        if (dark) document.documentElement.style.background = '#06060f';
        else       document.documentElement.style.background = '';

        /* Update all toggle UIs */
        syncToggleUI();

        /* Start / stop visual effects */
        if (dark) {
            startMatrix();
            startCursorGlow();
            applyTilt();
        } else {
            stopMatrix();
            stopCursorGlow();
            removeTilt();
        }
    }

    /* ════════════════════════════════════════════
       TOGGLE UI: update all .dm-toggle buttons
       ════════════════════════════════════════════ */
    function syncToggleUI() {
        document.querySelectorAll('.dm-toggle').forEach(function (btn) {
            var icon  = btn.querySelector('.dm-toggle-icon');
            var label = btn.querySelector('.dm-toggle-label');
            if (icon)  icon.textContent  = isDark ? '🌙' : '☀️';
            if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        });
    }

    /* ════════════════════════════════════════════
       AI LOADER ANIMATION
       ════════════════════════════════════════════ */
    function runLoader(callback) {
        var loader = document.getElementById('aiLoader');
        if (!loader) { callback(); return; }

        var text  = loader.querySelector('.ai-loader-text');
        var bar   = loader.querySelector('.ai-loader-bar-fill');
        var msgs  = ['Activating AI...', 'Switching Theme...', 'Applying Neon...', 'Ready! ✨'];
        var idx   = 0;

        loader.classList.add('active');

        var msgTimer = setInterval(function () {
            idx = Math.min(idx + 1, msgs.length - 1);
            if (text) text.textContent = msgs[idx];
            if (idx >= msgs.length - 1) clearInterval(msgTimer);
        }, 450);

        if (bar) {
            bar.style.animation = 'none';
            bar.offsetWidth; /* reflow */
            bar.style.animation = 'loaderFill 1.8s ease-in-out forwards';
        }

        setTimeout(function () {
            loader.classList.remove('active');
            callback();
        }, 1950);
    }

    /* ════════════════════════════════════════════
       MATRIX CANVAS
       ════════════════════════════════════════════ */
    function startMatrix() {
        if (matrixRunning) return;
        matrixRunning = true;

        var canvas = document.getElementById('matrixCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'matrixCanvas';
            document.body.prepend(canvas);
        }

        var ctx   = canvas.getContext('2d');
        var chars = 'アイウエオカキクケ0123456789ABCDEF@#$%[]{}01';
        var arr   = chars.split('');
        var fs    = 13;
        var cols, drops;

        function resize() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            cols  = Math.floor(canvas.width / fs);
            drops = new Array(cols).fill(1);
        }
        resize();
        canvas._resize = resize;
        window.addEventListener('resize', resize, { passive: true });

        function draw() {
            if (!matrixRunning) return;
            ctx.fillStyle = 'rgba(6,6,15,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            var t = Date.now() * 0.001;
            for (var i = 0; i < drops.length; i++) {
                var ch  = arr[Math.floor(Math.random() * arr.length)];
                var hue = 270 + Math.sin(i * 0.1 + t) * 30;
                var br  = 44 + Math.random() * 56;
                ctx.fillStyle = 'hsl(' + hue + ',100%,' + br + '%)';
                ctx.font = fs + 'px Courier New,monospace';
                ctx.fillText(ch, i * fs, drops[i] * fs);
                if (drops[i] * fs > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
            matrixAF = requestAnimationFrame(draw);
        }
        draw();
    }

    function stopMatrix() {
        matrixRunning = false;
        if (matrixAF) { cancelAnimationFrame(matrixAF); matrixAF = null; }
        var canvas = document.getElementById('matrixCanvas');
        if (canvas) {
            if (canvas._resize) window.removeEventListener('resize', canvas._resize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    /* ════════════════════════════════════════════
       CURSOR GLOW
       pointer-events: none in CSS — never blocks clicks
       ════════════════════════════════════════════ */
    function startCursorGlow() {
        if (cursorActive) return;
        cursorActive = true;
        if (!cursorEl) {
            cursorEl = document.createElement('div');
            cursorEl.className = 'cursor-glow';
            document.body.appendChild(cursorEl);
        }
        document.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    function onMouseMove(e) {
        if (!cursorEl || !isDark) return;
        cursorEl.style.left = e.clientX + 'px';
        cursorEl.style.top  = e.clientY + 'px';
    }

    function stopCursorGlow() {
        cursorActive = false;
        document.removeEventListener('mousemove', onMouseMove);
    }

    /* ════════════════════════════════════════════
       3D TILT EFFECT
       Uses perspective transform on mousemove.
       NO hologram scan elements injected.
       ════════════════════════════════════════════ */
    function applyTilt() {
        var sel = '.stat-card, .recipe-card, .food-card, .feature-card, .badge-card, .testi-card, .avail-card';
        document.querySelectorAll(sel).forEach(function (card) {
            if (card._tiltDone) return;
            card._tiltDone = true;

            function onMove(e) {
                if (!isDark) return;
                var rect = card.getBoundingClientRect();
                var px = e.touches ? e.touches[0].clientX : e.clientX;
                var py = e.touches ? e.touches[0].clientY : e.clientY;
                var dx = (px - rect.left - rect.width  / 2) / (rect.width  / 2);
                var dy = (py - rect.top  - rect.height / 2) / (rect.height / 2);
                card.style.transform = 'perspective(900px) rotateX(' + (-dy * 7) + 'deg) rotateY(' + (dx * 7) + 'deg) translateY(-5px)';
            }
            function onLeave() { card.style.transform = ''; }

            card.addEventListener('mousemove', onMove, { passive: true });
            card.addEventListener('mouseleave', onLeave);
            card.addEventListener('touchmove', onMove, { passive: true });
            card.addEventListener('touchend', onLeave);
            tiltEntries.push({ card: card, move: onMove, leave: onLeave });
        });
    }

    function removeTilt() {
        tiltEntries.forEach(function (e) {
            e.card.removeEventListener('mousemove', e.move);
            e.card.removeEventListener('mouseleave', e.leave);
            e.card.removeEventListener('touchmove', e.move);
            e.card.removeEventListener('touchend', e.leave);
            e.card.style.transform = '';
            e.card._tiltDone = false;
        });
        tiltEntries = [];
    }

    /* ════════════════════════════════════════════
       INJECT AI LOADER HTML
       (only if not already present)
       ════════════════════════════════════════════ */
    function injectLoader() {
        if (document.getElementById('aiLoader')) return;
        var el = document.createElement('div');
        el.id = 'aiLoader';
        el.className = 'ai-loader';
        el.innerHTML =
            '<div class="ai-loader-ring"></div>' +
            '<div class="ai-loader-text">Switching Theme...</div>' +
            '<div class="ai-loader-bar"><div class="ai-loader-bar-fill"></div></div>';
        document.body.prepend(el);
    }

    /* ════════════════════════════════════════════
       BUILD dm-toggle BUTTON HTML
       ════════════════════════════════════════════ */
    function buildToggle() {
        var btn = document.createElement('button');
        btn.className = 'dm-toggle';
        btn.setAttribute('title', 'Toggle Dark Mode (Ctrl+Shift+D)');
        btn.setAttribute('aria-label', 'Toggle Dark Mode');
        btn.innerHTML =
            '<span class="dm-toggle-icon">' + (isDark ? '🌙' : '☀️') + '</span>' +
            '<div class="dm-toggle-track"></div>' +
            '<span class="dm-toggle-label">' + (isDark ? 'Light Mode' : 'Dark Mode') + '</span>';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            applyDark(!isDark, true);
        });
        return btn;
    }

    /* ════════════════════════════════════════════
       INJECT TOGGLES INTO NAVBAR
       Strategy:
       - If page has #dmToggle (dashboard), wire it up, don't add another
       - Otherwise inject one into .nav-actions (before hamburger)
       - Always add one to .mobile-menu for mobile access
       ════════════════════════════════════════════ */
    function injectToggles() {
        /* Dashboard has its own #dmToggle — just wire it */
        var manual = document.getElementById('dmToggle');
        if (manual && !manual._dmWired) {
            manual._dmWired = true;
            /* Rebuild inner HTML to match our structure */
            manual.className = 'dm-toggle';
            manual.innerHTML =
                '<span class="dm-toggle-icon">' + (isDark ? '🌙' : '☀️') + '</span>' +
                '<div class="dm-toggle-track"></div>' +
                '<span class="dm-toggle-label">' + (isDark ? 'Light Mode' : 'Dark Mode') + '</span>';
            manual.addEventListener('click', function (e) {
                e.stopPropagation();
                applyDark(!isDark, true);
            });
        } else if (!manual) {
            /* No manual toggle — inject into every .nav-actions */
            document.querySelectorAll('.nav-actions').forEach(function (container) {
                if (container.querySelector('.dm-toggle')) return; /* already there */
                var toggle    = buildToggle();
                var hamburger = container.querySelector('.hamburger');
                if (hamburger) container.insertBefore(toggle, hamburger);
                else           container.appendChild(toggle);
            });
        }

        /* Always inject into .mobile-menu for phone access */
        document.querySelectorAll('.mobile-menu').forEach(function (menu) {
            if (menu.querySelector('.dm-toggle')) return;
            var toggle = buildToggle();
            toggle.style.cssText = 'margin-top:12px;width:100%;justify-content:center;';
            menu.appendChild(toggle);
        });
    }

    /* ════════════════════════════════════════════
       KEYBOARD SHORTCUT  Ctrl+Shift+D
       ════════════════════════════════════════════ */
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            applyDark(!isDark, true);
        }
    });

    /* ════════════════════════════════════════════
       CROSS-TAB SYNC
       ════════════════════════════════════════════ */
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) {
            var newDark = e.newValue === 'true';
            if (newDark !== isDark) applyDark(newDark, false);
        }
    });

    /* ════════════════════════════════════════════
       INIT — run after DOM is ready
       ════════════════════════════════════════════ */
    function init() {
        injectLoader();
        injectToggles();

        /* Apply saved preference WITHOUT loader (no flash) */
        if (isDark) {
            commitDark(true);
        } else {
            syncToggleUI();
        }

        /* Watch for new cards added dynamically (modals open, etc.) */
        if (window.MutationObserver) {
            new MutationObserver(function () {
                if (isDark) applyTilt();
            }).observe(document.body, { childList: true, subtree: false });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ════════════════════════════════════════════
       PUBLIC API
       ════════════════════════════════════════════ */
    window.RePlate = window.RePlate || {};
    window.RePlate.darkMode = {
        toggle:   function () { applyDark(!isDark, true); },
        enable:   function () { applyDark(true, true); },
        disable:  function () { applyDark(false, true); },
        isActive: function () { return isDark; }
    };

})();
