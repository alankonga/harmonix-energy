/* Hero slideshow + product cards. Edit HERO_SLIDES to change the background photos. */
(function () {
    "use strict";
    var HERO_SLIDES = [
        { img: "images/hero-house.jpg", mode: "right" },   // mode "right" keeps the photo at the right edge, like the mockup
        { img: "images/solar-installation.jpg" },          // other photos fill the whole hero
        { img: "images/battery-storage.jpg" },             // add as many as you like
        { img: "images/solar-maintenance.jpg" }
    ];
    var wrap = document.getElementById("hero-slides"), dots = document.getElementById("hero-dots"), idx = 0, timer;
    if (wrap) {
        wrap.innerHTML = HERO_SLIDES.map(function (s) { return '<div style="background-image:url(\'' + s.img + '\');' + (s.mode === "right" ? 'left:auto;width:auto;aspect-ratio:554/287;background-size:100% 100%;background-position:right center' : 'background-size:cover;background-position:center') + '"' + (s.mode === "right" ? ' class="r"' : '') + '></div>'; }).join("");
        dots.innerHTML = HERO_SLIDES.map(function (s, i) { return '<button type="button" class="dt" data-i="' + i + '" aria-label="Show slide ' + (i + 1) + '"></button>'; }).join("");
        var show = function (n) {
            idx = (n + HERO_SLIDES.length) % HERO_SLIDES.length;
            [].forEach.call(wrap.children, function (e, i) { e.classList.toggle("on", i === idx); });
            [].forEach.call(dots.children, function (e, i) { e.classList.toggle("on", i === idx); });
        };
        var play = function () {
            clearInterval(timer);
            if (HERO_SLIDES.length > 1 && !matchMedia("(prefers-reduced-motion:reduce)").matches) timer = setInterval(function () { show(idx + 1); }, 6000);
        };
        document.getElementById("hero-prev").onclick = function () { show(idx - 1); play(); };
        document.getElementById("hero-next").onclick = function () { show(idx + 1); play(); };
        dots.onclick = function (e) { var i = e.target.getAttribute("data-i"); if (i !== null) { show(+i); play(); } };
        var hero = document.getElementById("home");
        hero.onmouseenter = function () { clearInterval(timer); }; hero.onmouseleave = play;
        show(0); play();
    }

    /* Product cards, filled from data.js */
    var grid = document.getElementById("product-cards"), tabs = document.getElementById("product-tabs");
    if (!grid || typeof SITE_DATA === "undefined") return;
    var CATS = [["all", "All Products", "i-cart"], ["inverter", "Inverters", "i-bolt"], ["battery", "Batteries", "i-battery"], ["controller", "Charge Controllers", "i-ctl"], ["panel", "Solar Panels", "i-panel"], ["protection", "Protection", "i-shield"], ["accessory", "Accessories", "i-cable"]];
    var UNIT = { panel: "W", inverter: "kW", battery: "kWh", controller: "A" }, active = "all";
    var phone = typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : "254729608222";
    var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var icon = function (id) { return '<svg class="i" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
    function draw() {
        tabs.innerHTML = CATS.map(function (c) { return '<button type="button" class="ptab' + (c[0] === active ? " on" : "") + '" aria-pressed="' + (c[0] === active) + '" data-c="' + c[0] + '">' + icon(c[2]) + c[1] + '</button>'; }).join("");
        var list = (SITE_DATA.products || []).filter(function (p) { return active === "all" || p.category === active; });
        if (!list.length) { grid.innerHTML = '<p class="pempty">Nothing listed in this category yet. <a href="#contact">Contact us</a> for availability.</p>'; return; }
        grid.innerHTML = list.map(function (p) {
            var cat = CATS.filter(function (c) { return c[0] === p.category; })[0] || CATS[0];
            var feats = [];
            String(p.details || "").split(/[,;]/).forEach(function (d) { if (d.trim()) feats.push(d.trim()); });
            if (!feats.length && p.rating) feats.push(p.rating + " " + (UNIT[p.category] || ""));
            var price = typeof p.price === "number" ? "KES " + p.price.toLocaleString("en-KE") : "Price on request";
            var msg = "Hello Harmonix Energy Solutions, I would like to enquire about: " + p.name;
            return '<article class="pcard"><div class="pimg">' + (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' : icon(cat[2])) + '</div><h3>' + esc(p.name) + '</h3><ul>' +
                feats.slice(0, 3).map(function (f) { return '<li>' + icon("i-check") + esc(f) + '</li>'; }).join("") + '</ul><div class="pprice">' + price +
                '</div><a class="penq" target="_blank" rel="noopener noreferrer" href="https://wa.me/' + phone + '?text=' + encodeURIComponent(msg) + '">' + icon("i-chat") + 'Enquire Now</a></article>';
        }).join("");
    }
    tabs.onclick = function (e) { var b = e.target.closest("[data-c]"); if (b) { active = b.getAttribute("data-c"); draw(); } };
    draw();
})();
