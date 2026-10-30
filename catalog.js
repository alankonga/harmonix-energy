/* ==========================================================
   Projects, packages, equipment prices and the layout designer.
   Everything here is driven by SITE_DATA from data.js.
   Uses WHATSAPP_NUMBER, formatNumber, roundUpToHalf, PANEL_MIN_W and
   PANEL_MAX_W from script.js (loaded before this file).
   ========================================================== */

(function () {
    "use strict";

    const data = (typeof SITE_DATA !== "undefined")
        ? SITE_DATA
        : { projects: [], products: [], packages: [] };

    const projects = Array.isArray(data.projects) ? data.projects : [];
    const products = Array.isArray(data.products) ? data.products : [];
    const packages = Array.isArray(data.packages) ? data.packages : [];

    const CATEGORIES = [
        { key: "panel", label: "Solar panels", unit: "W" },
        { key: "inverter", label: "Inverters", unit: "kW" },
        { key: "battery", label: "Batteries", unit: "kWh" },
        { key: "controller", label: "Charge controllers", unit: "A" }
    ];

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    /* ---------- small helpers ---------- */

    function make(tag, className, text) {
        const node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text !== undefined && text !== null) {
            node.textContent = text;
        }
        return node;
    }

    function formatPrice(value) {
        return (typeof value === "number" && isFinite(value))
            ? "KES " + value.toLocaleString("en-US")
            : "Price on request";
    }

    function formatMonth(value) {
        const match = /^(\d{4})-(\d{2})$/.exec(String(value || ""));
        if (!match) {
            return String(value || "");
        }
        const month = MONTHS[Number(match[2]) - 1];
        return month ? month + " " + match[1] : match[1];
    }

    function findProduct(id) {
        return products.find(function (item) { return item.id === id; }) || null;
    }

    function whatsappLink(lines) {
        return "https://wa.me/" + WHATSAPP_NUMBER +
            "?text=" + encodeURIComponent(lines.join("\n"));
    }

    // Work out the size, parts and price of a package.
    function describePackage(pkg) {
        const panel = findProduct(pkg.panelId);
        const inverter = findProduct(pkg.inverterId);
        const battery = findProduct(pkg.batteryId);
        const controller = findProduct(pkg.controllerId);

        const panelQty = Number(pkg.panelQty) || 0;
        const inverterQty = Number(pkg.inverterQty) || (inverter ? 1 : 0);
        const batteryQty = Number(pkg.batteryQty) || 0;
        const controllerQty = Number(pkg.controllerQty) || 0;

        const panelW = panel ? Number(panel.rating) : 0;
        const kwp = panel ? (panelQty * panelW) / 1000 : 0;
        const inverterKw = inverter ? inverterQty * Number(inverter.rating) : 0;
        const batteryKwh = battery ? batteryQty * Number(battery.rating) : 0;

        // Use the package price if set, otherwise add up the parts when
        // every part has a price.
        let price = null;
        if (typeof pkg.price === "number") {
            price = pkg.price;
        } else {
            const parts = [
                [panel, panelQty], [inverter, inverterQty],
                [battery, batteryQty], [controller, controllerQty]
            ].filter(function (pair) { return pair[0] && pair[1] > 0; });

            if (parts.length > 0 && parts.every(function (pair) {
                return typeof pair[0].price === "number";
            })) {
                price = parts.reduce(function (sum, pair) {
                    return sum + pair[0].price * pair[1];
                }, 0);
            }
        }

        return {
            pkg: pkg,
            panel: panel, panelQty: panelQty, panelW: panelW,
            inverter: inverter, inverterQty: inverterQty,
            battery: battery, batteryQty: batteryQty,
            controller: controller, controllerQty: controllerQty,
            kwp: kwp, inverterKw: inverterKw, batteryKwh: batteryKwh,
            price: price
        };
    }

    const described = packages.map(describePackage);

    /* ---------- projects ---------- */

    function projectCard(item) {
        const card = make("article", "project-card");

        function placeholder() {
            const box = make("div", "project-placeholder", "\u2600\uFE0F");
            box.setAttribute("aria-hidden", "true");
            return box;
        }

        if (item.image) {
            const img = document.createElement("img");
            img.src = item.image;
            img.alt = item.title || "Project photo";
            img.width = 800;
            img.height = 460;
            img.loading = "lazy";
            img.addEventListener("error", function () {
                img.replaceWith(placeholder());
            });
            card.appendChild(img);
        } else {
            card.appendChild(placeholder());
        }

        const info = make("div", "project-info");
        info.appendChild(make("p", "project-type", item.type || "Project"));
        info.appendChild(make("h3", "", item.title || "Untitled project"));

        if (item.description) {
            info.appendChild(make("p", "", item.description));
        }

        const meta = [item.location, item.size, formatMonth(item.date)]
            .filter(Boolean).join(" \u00B7 ");
        if (meta) {
            info.appendChild(make("p", "project-meta", meta));
        }

        card.appendChild(info);
        return card;
    }

    function renderProjects() {
        const grid = document.querySelector("#project-grid");
        if (!grid || projects.length === 0) {
            return;   // keep the sample cards in index.html
        }

        const LIMIT = 6;
        let showAll = false;

        const sorted = projects.slice().sort(function (a, b) {
            return String(b.date || "").localeCompare(String(a.date || ""));
        });

        const more = make("div", "projects-more");
        grid.insertAdjacentElement("afterend", more);

        function draw() {
            grid.textContent = "";
            (showAll ? sorted : sorted.slice(0, LIMIT)).forEach(function (item) {
                grid.appendChild(projectCard(item));
            });

            more.textContent = "";
            if (sorted.length > LIMIT) {
                const button = make(
                    "button", "button button-outline",
                    showAll ? "Show fewer projects"
                            : "Show all " + sorted.length + " projects"
                );
                button.type = "button";
                button.addEventListener("click", function () {
                    showAll = !showAll;
                    draw();
                });
                more.appendChild(button);
            }
        }

        draw();
    }

    /* ---------- packages ---------- */

    function packageCard(info) {
        const pkg = info.pkg;
        const card = make("article", "package-card");

        card.appendChild(make("h3", "", pkg.name || "Package"));

        if (info.kwp > 0) {
            card.appendChild(
                make("p", "package-size", formatNumber(info.kwp, 2) + " kWp system")
            );
        }
        if (pkg.description) {
            card.appendChild(make("p", "package-desc", pkg.description));
        }

        const list = make("ul", "package-includes");
        function addLine(product, qty) {
            if (product && qty > 0) {
                list.appendChild(make("li", "", qty + " x " + product.name));
            }
        }
        addLine(info.panel, info.panelQty);
        addLine(info.inverter, info.inverterQty);
        addLine(info.battery, info.batteryQty);
        addLine(info.controller, info.controllerQty);
        card.appendChild(list);

        card.appendChild(make("p", "package-price", formatPrice(info.price)));

        const actions = make("div", "package-actions");

        const layoutButton = make("button", "button button-outline", "View layout");
        layoutButton.type = "button";
        layoutButton.addEventListener("click", function () {
            selectPackage(pkg.id);
        });
        actions.appendChild(layoutButton);

        const quote = make("a", "button", "Request a quote");
        quote.href = whatsappLink([
            "Hello Harmonix Energy Solutions,",
            "",
            "I am interested in the " + (pkg.name || "package") +
                (info.kwp > 0 ? " (" + formatNumber(info.kwp, 2) + " kWp)" : "") + ".",
            "Please send me a quotation."
        ]);
        quote.target = "_blank";
        quote.rel = "noopener noreferrer";
        actions.appendChild(quote);

        card.appendChild(actions);
        return card;
    }

    function renderPackages() {
        const grid = document.querySelector("#package-grid");
        const empty = document.querySelector("#package-empty");
        if (!grid) {
            return;
        }
        if (described.length === 0) {
            if (empty) {
                empty.hidden = false;
            }
            return;
        }
        described.forEach(function (info) {
            grid.appendChild(packageCard(info));
        });
    }

    /* ---------- equipment catalogue ---------- */

    function renderCatalog() {
        const catalog = document.querySelector("#catalog");
        const tabs = document.querySelector("#catalog-tabs");
        const body = document.querySelector("#catalog-body");
        const empty = document.querySelector("#catalog-empty");
        if (!catalog || !tabs || !body) {
            return;
        }
        if (products.length === 0) {
            catalog.hidden = true;
            return;
        }

        const firstWithItems = CATEGORIES.find(function (cat) {
            return products.some(function (item) { return item.category === cat.key; });
        });
        let active = (firstWithItems || CATEGORIES[0]).key;

        function drawTable() {
            const cat = CATEGORIES.find(function (c) { return c.key === active; });
            const items = products.filter(function (item) {
                return item.category === active;
            });

            body.textContent = "";
            empty.hidden = items.length > 0;

            items.forEach(function (item) {
                const row = document.createElement("tr");

                const nameCell = document.createElement("th");
                nameCell.scope = "row";
                nameCell.appendChild(make("span", "", item.name));
                if (item.brand) {
                    nameCell.appendChild(make("span", "catalog-brand", item.brand));
                }
                row.appendChild(nameCell);

                row.appendChild(make("td", "", formatNumber(Number(item.rating) || 0, 2) + " " + cat.unit));
                row.appendChild(make("td", "", item.details || ""));
                row.appendChild(make("td", "catalog-price", formatPrice(item.price)));

                body.appendChild(row);
            });

            Array.prototype.forEach.call(tabs.children, function (button) {
                button.setAttribute("aria-pressed", String(button.dataset.key === active));
            });
        }

        CATEGORIES.forEach(function (cat) {
            const button = make("button", "tab-button", cat.label);
            button.type = "button";
            button.dataset.key = cat.key;
            button.addEventListener("click", function () {
                active = cat.key;
                drawTable();
            });
            tabs.appendChild(button);
        });

        drawTable();
    }

    /* ---------- layout designer ---------- */

    const NS = "http://www.w3.org/2000/svg";

    function svgEl(tag, attrs, text) {
        const node = document.createElementNS(NS, tag);
        Object.keys(attrs || {}).forEach(function (key) {
            node.setAttribute(key, attrs[key]);
        });
        if (text !== undefined && text !== null) {
            node.textContent = text;
        }
        return node;
    }

    function clip(text, max) {
        const value = String(text || "");
        return value.length > max ? value.slice(0, max - 1) + "\u2026" : value;
    }

    // Work out the panel count, strings and sizes for a design.
    function computeLayout(targetKwp, panelW, batteryKwh, inverterKw, perString) {
        const n = Math.max(1, Math.ceil((targetKwp * 1000) / panelW - 1e-9));
        const kwp = (n * panelW) / 1000;

        const autoInverter = !(inverterKw > 0);
        const inverter = autoInverter
            ? Math.max(1, roundUpToHalf(kwp / 1.2))
            : inverterKw;

        // Default: balanced strings of about 6 panels or fewer.
        let perStringUsed = perString > 0 ? Math.min(perString, n) : 0;
        if (!perStringUsed) {
            const count = Math.ceil(n / 6);
            perStringUsed = Math.ceil(n / count);
        }

        const strings = [];
        let left = n;
        while (left > 0) {
            const size = Math.min(perStringUsed, left);
            strings.push(size);
            left -= size;
        }

        return {
            n: n,
            panelW: panelW,
            kwp: kwp,
            inverterKw: inverter,
            autoInverter: autoInverter,
            batteryKwh: batteryKwh,
            perString: perStringUsed,
            strings: strings,
            roofM2: (kwp * 1000) / 200    // about 200 W per m2 including gaps
        };
    }

    function buildSvg(layout, names) {
        const width = 900;
        const maxString = Math.max.apply(null, layout.strings);
        const cellW = Math.max(14, Math.min(48, Math.floor(700 / maxString)));
        const cellH = Math.max(10, Math.round(cellW * 0.62));
        const rowH = cellH + 8;
        const rows = layout.strings.length;

        const arrayTop = 52;
        const arrayBottom = arrayTop + rows * rowH;
        const diagramTop = arrayBottom + 60;
        const boxH = 100;
        const hasBattery = layout.batteryKwh > 0;
        const batteryTop = diagramTop + boxH + 56;
        const height = (hasBattery ? batteryTop + boxH : diagramTop + boxH) + 70;

        const root = svgEl("svg", {
            xmlns: NS,
            viewBox: "0 0 " + width + " " + height,
            width: width,
            height: height,
            role: "img",
            "aria-label": "System layout: " + layout.n + " solar panels, " +
                formatNumber(layout.inverterKw, 1) + " kW inverter" +
                (hasBattery ? ", " + formatNumber(layout.batteryKwh, 1) + " kWh battery" : ""),
            "font-family": "Arial, Helvetica, sans-serif"
        });

        root.appendChild(svgEl("rect", { width: width, height: height, fill: "#ffffff" }));

        // Arrowheads
        const defs = svgEl("defs");
        [["arrowDc", "#ea580c"], ["arrowAc", "#16a34a"]].forEach(function (pair) {
            const marker = svgEl("marker", {
                id: pair[0], viewBox: "0 0 10 10", refX: "9", refY: "5",
                markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse"
            });
            marker.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: pair[1] }));
            defs.appendChild(marker);
        });
        root.appendChild(defs);

        // Panel array
        root.appendChild(svgEl("text", {
            x: 20, y: 30, "font-size": 18, "font-weight": "bold", fill: "#10243a"
        }, "Panel layout: " + layout.n + " x " + layout.panelW + " W = " +
            formatNumber(layout.kwp, 2) + " kWp"));

        let panelNumber = 0;
        layout.strings.forEach(function (count, row) {
            const y = arrayTop + row * rowH;

            root.appendChild(svgEl("text", {
                x: 20, y: y + cellH * 0.7, "font-size": 12, fill: "#334155"
            }, "String " + (row + 1) + " (" + count + ")"));

            for (let col = 0; col < count; col += 1) {
                panelNumber += 1;
                const x = 130 + col * cellW;

                root.appendChild(svgEl("rect", {
                    x: x, y: y, width: cellW - 3, height: cellH,
                    fill: "#1d4e89", stroke: "#0b2540", "stroke-width": 1
                }));

                if (cellW >= 30) {
                    root.appendChild(svgEl("text", {
                        x: x + (cellW - 3) / 2, y: y + cellH * 0.68,
                        "text-anchor": "middle", "font-size": 10, fill: "#ffffff"
                    }, String(panelNumber)));
                }
            }
        });

        // System diagram
        root.appendChild(svgEl("text", {
            x: 20, y: diagramTop - 18, "font-size": 18, "font-weight": "bold", fill: "#10243a"
        }, "System diagram"));

        function box(x, y, title, lines, fill, stroke) {
            root.appendChild(svgEl("rect", {
                x: x, y: y, width: 185, height: boxH, rx: 10,
                fill: fill, stroke: stroke, "stroke-width": 2
            }));
            root.appendChild(svgEl("text", {
                x: x + 92.5, y: y + 27, "text-anchor": "middle",
                "font-size": 16, "font-weight": "bold", fill: "#10243a"
            }, title));
            lines.forEach(function (line, index) {
                root.appendChild(svgEl("text", {
                    x: x + 92.5, y: y + 52 + index * 20, "text-anchor": "middle",
                    "font-size": 13, fill: "#334155"
                }, clip(line, 27)));
            });
        }

        function arrow(x1, y1, x2, y2, colour, marker, both) {
            const attrs = {
                x1: x1, y1: y1, x2: x2, y2: y2,
                stroke: colour, "stroke-width": 3,
                "marker-end": "url(#" + marker + ")"
            };
            if (both) {
                attrs["marker-start"] = "url(#" + marker + ")";
            }
            root.appendChild(svgEl("line", attrs));
        }

        const xs = [20, 245, 470, 695];
        const midY = diagramTop + boxH / 2;

        box(xs[0], diagramTop, "Solar array", [
            layout.n + " x " + layout.panelW + " W",
            formatNumber(layout.kwp, 2) + " kWp",
            layout.strings.length + (layout.strings.length === 1 ? " string of " : " strings of ") +
                layout.perString
        ], "#e0f2fe", "#1d4e89");

        box(xs[1], diagramTop, "Charge controller",
            names.controller
                ? [names.controller]
                : ["MPPT built into", "the hybrid inverter"],
            "#fff7ed", "#ea580c");

        box(xs[2], diagramTop, "Inverter", [
            formatNumber(layout.inverterKw, 1) + " kW",
            names.inverter || "Hybrid inverter"
        ], "#ecfdf5", "#16a34a");

        box(xs[3], diagramTop, "Loads", [
            "Distribution board",
            "Home or business loads",
            "Grid or generator (optional)"
        ], "#f1f5f9", "#64748b");

        arrow(xs[0] + 185, midY, xs[1], midY, "#ea580c", "arrowDc", false);
        arrow(xs[1] + 185, midY, xs[2], midY, "#ea580c", "arrowDc", false);
        arrow(xs[2] + 185, midY, xs[3], midY, "#16a34a", "arrowAc", false);

        if (hasBattery) {
            box(xs[2], batteryTop, "Battery bank", [
                formatNumber(layout.batteryKwh, 1) + " kWh",
                names.battery || "Lithium or lead-acid"
            ], "#fefce8", "#ca8a04");

            arrow(xs[2] + 92.5, diagramTop + boxH, xs[2] + 92.5, batteryTop,
                  "#ea580c", "arrowDc", true);
        }

        // Legend
        const legendY = height - 24;
        root.appendChild(svgEl("line", {
            x1: 20, y1: legendY, x2: 60, y2: legendY, stroke: "#ea580c", "stroke-width": 3
        }));
        root.appendChild(svgEl("text", { x: 68, y: legendY + 4, "font-size": 13, fill: "#334155" }, "DC wiring"));
        root.appendChild(svgEl("line", {
            x1: 170, y1: legendY, x2: 210, y2: legendY, stroke: "#16a34a", "stroke-width": 3
        }));
        root.appendChild(svgEl("text", { x: 218, y: legendY + 4, "font-size": 13, fill: "#334155" }, "AC wiring"));

        return root;
    }

    function renderDesigner() {
        const form = document.querySelector("#designer-form");
        if (!form) {
            return;
        }

        const packageSelect = document.querySelector("#d-package");
        const kwpInput = document.querySelector("#d-kwp");
        const panelInput = document.querySelector("#d-panel");
        const batteryInput = document.querySelector("#d-battery");
        const inverterInput = document.querySelector("#d-inverter");
        const stringInput = document.querySelector("#d-string");
        const errorBox = document.querySelector("#d-error");
        const result = document.querySelector("#d-result");
        const summary = document.querySelector("#d-summary");
        const priceLine = document.querySelector("#d-price");
        const svgWrap = document.querySelector("#d-svg-wrap");
        const whatsapp = document.querySelector("#d-whatsapp");
        const downloadButton = document.querySelector("#d-download");

        let currentSvg = null;
        let lastLines = null;

        attachContactToLink(
            whatsapp,
            function () { return lastLines; },
            document.querySelector("#d-name"),
            document.querySelector("#d-phone"),
            document.querySelector("#d-contact-error"),
            2
        );

        // Package choices
        described.forEach(function (info) {
            const option = document.createElement("option");
            option.value = info.pkg.id;
            option.textContent = (info.pkg.name || "Package") +
                (info.kwp > 0 ? " (" + formatNumber(info.kwp, 2) + " kWp)" : "");
            packageSelect.appendChild(option);
        });

        function selectedPackage() {
            return described.find(function (info) {
                return info.pkg.id === packageSelect.value;
            }) || null;
        }

        function fillFromPackage(info) {
            if (info.kwp > 0) {
                kwpInput.value = String(Math.round(info.kwp * 1000) / 1000);
                panelInput.value = String(info.panelW);
            }
            batteryInput.value = String(Math.round(info.batteryKwh * 100) / 100);
            inverterInput.value = info.inverterKw > 0 ? String(info.inverterKw) : "";
            stringInput.value = "";
            errorBox.textContent = "";
        }

        packageSelect.addEventListener("change", function () {
            const info = selectedPackage();
            if (info) {
                fillFromPackage(info);
            }
        });

        // Changing a value by hand means it is no longer the package.
        [kwpInput, panelInput, batteryInput, inverterInput].forEach(function (input) {
            input.addEventListener("input", function () {
                packageSelect.value = "";
            });
        });

        function closestPackage(kwp) {
            let best = null;
            described.forEach(function (info) {
                if (info.kwp >= kwp - 0.001 && (!best || info.kwp < best.kwp)) {
                    best = info;
                }
            });
            return best;
        }

        function generate() {
            errorBox.textContent = "";

            const targetKwp = Number(kwpInput.value);
            const panelW = Number(panelInput.value);
            const batteryKwh = batteryInput.value.trim() === "" ? 0 : Number(batteryInput.value);
            const inverterText = inverterInput.value.trim();
            const inverterKw = inverterText === "" ? 0 : Number(inverterText);
            const stringText = stringInput.value.trim();
            const perString = stringText === "" ? 0 : Number(stringText);

            if (!(targetKwp >= 0.5 && targetKwp <= 500)) {
                errorBox.textContent = "System size must be between 0.5 and 500 kWp.";
                return;
            }
            if (!(panelW >= PANEL_MIN_W && panelW <= PANEL_MAX_W)) {
                errorBox.textContent =
                    "Panel size must be between " + PANEL_MIN_W + " and " + PANEL_MAX_W + " W.";
                return;
            }
            if (!(batteryKwh >= 0 && batteryKwh <= 1000)) {
                errorBox.textContent = "Battery storage must be between 0 and 1000 kWh.";
                return;
            }
            if (inverterText !== "" && !(inverterKw > 0 && inverterKw <= 1000)) {
                errorBox.textContent = "Inverter size must be between 0.5 and 1000 kW, or left blank.";
                return;
            }
            if (stringText !== "" && !(Number.isInteger(perString) && perString >= 1 && perString <= 30)) {
                errorBox.textContent = "Panels per string must be a whole number from 1 to 30, or left blank.";
                return;
            }

            const layout = computeLayout(targetKwp, panelW, batteryKwh, inverterKw, perString);
            const info = selectedPackage();
            const names = {
                inverter: info && info.inverter ? info.inverter.name : "",
                battery: info && info.battery ? info.battery.name : "",
                controller: info && info.controller ? info.controller.name : ""
            };

            // Summary
            summary.textContent = "";
            const facts = [
                ["Solar array", formatNumber(layout.kwp, 2) + " kWp"],
                ["Panels", layout.n + " x " + layout.panelW + " W"],
                ["Strings", layout.strings.length + " (about " + layout.perString + " panels each)"],
                ["Inverter", formatNumber(layout.inverterKw, 1) + " kW" + (layout.autoInverter ? " (suggested)" : "")],
                ["Battery", layout.batteryKwh > 0 ? formatNumber(layout.batteryKwh, 1) + " kWh" : "None"],
                ["Roof space", "About " + formatNumber(layout.roofM2, 0) + " m\u00B2"]
            ];
            facts.forEach(function (fact) {
                const wrapper = document.createElement("div");
                wrapper.appendChild(make("dt", "", fact[0]));
                wrapper.appendChild(make("dd", "", fact[1]));
                summary.appendChild(wrapper);
            });

            // Price
            let priceText = "";
            if (info) {
                priceText = (info.pkg.name || "Package") + ": " + formatPrice(info.price);
            } else {
                const near = closestPackage(layout.kwp);
                priceText = near
                    ? "Closest package: " + (near.pkg.name || "Package") + " (" +
                      formatNumber(near.kwp, 2) + " kWp), " + formatPrice(near.price)
                    : "Send us your design for an exact quotation.";
            }
            priceLine.textContent = priceText;

            // Drawing
            currentSvg = buildSvg(layout, names);
            svgWrap.textContent = "";
            svgWrap.appendChild(currentSvg);

            // WhatsApp message
            const lines = [
                "Hello Harmonix Energy Solutions,",
                "",
                "I designed a system on your website:",
                "Solar array: " + formatNumber(layout.kwp, 2) + " kWp (" +
                    layout.n + " x " + layout.panelW + " W panels, " +
                    layout.strings.length + " strings)",
                "Inverter: " + formatNumber(layout.inverterKw, 1) + " kW",
                "Battery: " + (layout.batteryKwh > 0
                    ? formatNumber(layout.batteryKwh, 1) + " kWh" : "none")
            ];
            if (info) {
                lines.push("Package: " + (info.pkg.name || "Package"));
            }
            lines.push("", "Please contact me for an exact quotation.");
            whatsapp.href = whatsappLink(lines);
            lastLines = lines.slice();

            result.hidden = false;
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            generate();
        });

        downloadButton.addEventListener("click", function () {
            if (!currentSvg) {
                return;
            }
            const xml = new XMLSerializer().serializeToString(currentSvg);
            const blob = new Blob([xml], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "harmonix-system-layout.svg";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        });

        function scrollToDesigner() {
            const section = document.querySelector("#designer");
            if (section) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }

        // Used by the package cards.
        window.selectPackage = function (id) {
            packageSelect.value = id;
            const info = selectedPackage();
            if (info) {
                fillFromPackage(info);
                generate();
                scrollToDesigner();
            }
        };

        // Used by the appliance load calculator.
        window.prefillDesigner = function (design) {
            packageSelect.value = "";
            kwpInput.value = String(Math.round(design.kwp * 1000) / 1000);
            panelInput.value = String(design.panelW);
            batteryInput.value = String(Math.round(design.batteryKwh * 10) / 10);
            inverterInput.value = String(design.inverterKw);
            stringInput.value = "";
            generate();
            scrollToDesigner();
        };
    }

    // selectPackage is also used before the designer exists on the page.
    function selectPackage(id) {
        if (typeof window.selectPackage === "function") {
            window.selectPackage(id);
        }
    }

    renderProjects();
    renderPackages();
    renderCatalog();
    renderDesigner();
})();
