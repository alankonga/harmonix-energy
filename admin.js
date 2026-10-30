/* ==========================================================
   Admin helper: edit projects, equipment and packages, then copy
   the generated data.js into GitHub. Nothing here changes the live
   site by itself.
   ========================================================== */

(function () {
    "use strict";

    const STORAGE_KEY = "harmonix-admin-draft";

    const UNITS = {
        panel: { label: "Power rating (W)" },
        inverter: { label: "Power rating (kW)" },
        battery: { label: "Capacity (kWh)" },
        controller: { label: "Current rating (A)" }
    };

    const CATEGORY_NAMES = {
        panel: "Solar panels",
        inverter: "Inverters",
        battery: "Batteries",
        controller: "Charge controllers"
    };

    function $(selector) {
        return document.querySelector(selector);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalise(data) {
        const source = data || {};
        return {
            projects: Array.isArray(source.projects) ? source.projects : [],
            products: Array.isArray(source.products) ? source.products : [],
            packages: Array.isArray(source.packages) ? source.packages : []
        };
    }

    const published = (typeof SITE_DATA !== "undefined") ? SITE_DATA : {};
    let state = normalise(clone(published));

    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
            state = normalise(JSON.parse(saved));
        }
    } catch (error) {
        // Storage can be unavailable; the page still works without a draft.
    }

    // Which item (if any) is being edited: { kind, index }
    let editing = { kind: "", index: -1 };

    const status = $("#admin-status");

    function say(message) {
        status.textContent = message;
    }

    function save() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            // ignore
        }
    }

    function slug(text) {
        const base = String(text).toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
        return (base || "item") + "-" + Date.now().toString(36).slice(-4);
    }

    function numberOrNull(value) {
        const text = String(value).trim();
        if (text === "") {
            return null;
        }
        const number = Number(text);
        return isFinite(number) && number >= 0 ? number : null;
    }

    function make(tag, text, className) {
        const node = document.createElement(tag);
        if (text) {
            node.textContent = text;
        }
        if (className) {
            node.className = className;
        }
        return node;
    }

    /* ---------- editing banner ---------- */

    function startEditing(kind, index, label) {
        editing = { kind: kind, index: index };

        const banner = $("#" + kind + "-editing");
        banner.textContent = "";
        banner.appendChild(document.createTextNode("Editing: " + label + "  "));

        const cancel = make("button", "Cancel", "link-button");
        cancel.type = "button";
        cancel.addEventListener("click", function () {
            stopEditing(kind);
            $("#" + kind + "-form").reset();
            updateRatingLabel();
        });
        banner.appendChild(cancel);
        banner.hidden = false;

        $("#" + kind + "-submit").textContent = "Save changes";
        $("#" + kind + "-form").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function stopEditing(kind) {
        editing = { kind: "", index: -1 };
        $("#" + kind + "-editing").hidden = true;
        const labels = { project: "Add project", product: "Add equipment", package: "Add package" };
        $("#" + kind + "-submit").textContent = labels[kind];
    }

    function isEditing(kind) {
        return editing.kind === kind ? editing.index : -1;
    }

    /* ---------- projects ---------- */

    $("#project-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const item = {
            title: $("#p-title").value.trim(),
            type: $("#p-type").value,
            location: $("#p-location").value.trim(),
            size: $("#p-size").value.trim(),
            date: $("#p-date").value,
            image: $("#p-image").value.trim(),
            description: $("#p-desc").value.trim()
        };

        if (!item.title) {
            return;
        }

        const index = isEditing("project");
        if (index >= 0) {
            state.projects[index] = item;
            stopEditing("project");
            say("Project updated.");
        } else {
            state.projects.unshift(item);
            say("Project added.");
        }

        $("#project-form").reset();
        save();
        render();
    });

    function editProject(index) {
        const item = state.projects[index];
        $("#p-title").value = item.title || "";
        $("#p-type").value = item.type || "Solar PV";
        $("#p-location").value = item.location || "";
        $("#p-size").value = item.size || "";
        $("#p-date").value = item.date || "";
        $("#p-image").value = item.image || "";
        $("#p-desc").value = item.description || "";
        startEditing("project", index, item.title);
    }

    /* ---------- equipment ---------- */

    function updateRatingLabel() {
        $("#e-rating-label").textContent = UNITS[$("#e-category").value].label;
    }

    $("#e-category").addEventListener("change", updateRatingLabel);

    $("#product-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const rating = Number($("#e-rating").value);
        const name = $("#e-name").value.trim();
        if (!name || !(rating > 0)) {
            return;
        }

        const index = isEditing("product");
        const item = {
            id: index >= 0 ? state.products[index].id : slug(name),
            category: $("#e-category").value,
            name: name,
            brand: $("#e-brand").value.trim(),
            rating: rating,
            details: $("#e-details").value.trim(),
            price: numberOrNull($("#e-price").value)
        };

        if (index >= 0) {
            state.products[index] = item;
            stopEditing("product");
            say("Equipment updated.");
        } else {
            state.products.push(item);
            say("Equipment added.");
        }

        $("#product-form").reset();
        updateRatingLabel();
        save();
        render();
    });

    function editProduct(index) {
        const item = state.products[index];
        $("#e-category").value = item.category;
        updateRatingLabel();
        $("#e-rating").value = item.rating;
        $("#e-name").value = item.name || "";
        $("#e-brand").value = item.brand || "";
        $("#e-details").value = item.details || "";
        $("#e-price").value = item.price === null || item.price === undefined ? "" : item.price;
        startEditing("product", index, item.name);
    }

    /* ---------- packages ---------- */

    function fillSelect(select, category, optional) {
        const previous = select.value;
        select.textContent = "";

        if (optional) {
            const none = document.createElement("option");
            none.value = "";
            none.textContent = "None";
            select.appendChild(none);
        }

        state.products
            .filter(function (item) { return item.category === category; })
            .forEach(function (item) {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.name;
                select.appendChild(option);
            });

        if (Array.prototype.some.call(select.options, function (o) { return o.value === previous; })) {
            select.value = previous;
        }
    }

    function renderSelects() {
        fillSelect($("#k-panel"), "panel", false);
        fillSelect($("#k-inverter"), "inverter", false);
        fillSelect($("#k-battery"), "battery", true);
        fillSelect($("#k-controller"), "controller", true);
    }

    $("#package-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const name = $("#k-name").value.trim();
        const panelId = $("#k-panel").value;
        const inverterId = $("#k-inverter").value;
        const panelQty = Math.floor(Number($("#k-panel-qty").value));
        const inverterQty = Math.floor(Number($("#k-inverter-qty").value));

        if (!name) {
            return;
        }
        if (!panelId || !inverterId) {
            say("Add at least one solar panel and one inverter in Equipment first.");
            return;
        }
        if (!(panelQty >= 1) || !(inverterQty >= 1)) {
            say("Panels and inverters need a quantity of 1 or more.");
            return;
        }

        const batteryId = $("#k-battery").value;
        const controllerId = $("#k-controller").value;
        const index = isEditing("package");

        const item = {
            id: index >= 0 ? state.packages[index].id : slug(name),
            name: name,
            description: $("#k-desc").value.trim(),
            panelId: panelId,
            panelQty: panelQty,
            inverterId: inverterId,
            inverterQty: inverterQty,
            batteryId: batteryId,
            batteryQty: batteryId ? Math.max(0, Math.floor(Number($("#k-battery-qty").value)) || 0) : 0,
            controllerId: controllerId,
            controllerQty: controllerId ? Math.max(0, Math.floor(Number($("#k-controller-qty").value)) || 0) : 0,
            price: numberOrNull($("#k-price").value)
        };

        if (index >= 0) {
            state.packages[index] = item;
            stopEditing("package");
            say("Package updated.");
        } else {
            state.packages.push(item);
            say("Package added.");
        }

        $("#package-form").reset();
        save();
        render();
    });

    function editPackage(index) {
        const item = state.packages[index];
        renderSelects();
        $("#k-name").value = item.name || "";
        $("#k-desc").value = item.description || "";
        $("#k-panel").value = item.panelId || "";
        $("#k-panel-qty").value = item.panelQty || 1;
        $("#k-inverter").value = item.inverterId || "";
        $("#k-inverter-qty").value = item.inverterQty || 1;
        $("#k-battery").value = item.batteryId || "";
        $("#k-battery-qty").value = item.batteryQty || 0;
        $("#k-controller").value = item.controllerId || "";
        $("#k-controller-qty").value = item.controllerQty || 0;
        $("#k-price").value = item.price === null || item.price === undefined ? "" : item.price;
        startEditing("package", index, item.name);
    }

    /* ---------- lists ---------- */

    function listItem(label, onEdit, onRemove) {
        const li = document.createElement("li");
        li.appendChild(make("span", label));

        const actions = make("span", "", "item-actions");

        const edit = make("button", "Edit");
        edit.type = "button";
        edit.addEventListener("click", onEdit);
        actions.appendChild(edit);

        const remove = make("button", "Remove", "remove");
        remove.type = "button";
        remove.addEventListener("click", onRemove);
        actions.appendChild(remove);

        li.appendChild(actions);
        return li;
    }

    function formatPrice(value) {
        return typeof value === "number" ? "KES " + value.toLocaleString("en-US") : "no price";
    }

    function renderLists() {
        const projectList = $("#project-list");
        projectList.textContent = "";
        if (state.projects.length === 0) {
            projectList.appendChild(make("li", "No projects added yet."));
        }
        state.projects.forEach(function (item, index) {
            projectList.appendChild(listItem(
                item.title + (item.date ? " (" + item.date + ")" : ""),
                function () { editProject(index); },
                function () {
                    if (window.confirm("Remove this project?\n\n" + item.title)) {
                        state.projects.splice(index, 1);
                        stopEditingIfNeeded("project", index);
                        save();
                        render();
                    }
                }
            ));
        });

        const productList = $("#product-list");
        productList.textContent = "";
        if (state.products.length === 0) {
            productList.appendChild(make("li", "No equipment added yet."));
        }
        state.products.forEach(function (item, index) {
            productList.appendChild(listItem(
                CATEGORY_NAMES[item.category] + ": " + item.name + " (" + formatPrice(item.price) + ")",
                function () { editProduct(index); },
                function () {
                    const used = state.packages.filter(function (pkg) {
                        return [pkg.panelId, pkg.inverterId, pkg.batteryId, pkg.controllerId]
                            .indexOf(item.id) !== -1;
                    });
                    const warning = used.length
                        ? "\n\nIt is used in: " + used.map(function (p) { return p.name; }).join(", ")
                        : "";
                    if (window.confirm("Remove this equipment?\n\n" + item.name + warning)) {
                        state.products.splice(index, 1);
                        stopEditingIfNeeded("product", index);
                        save();
                        render();
                    }
                }
            ));
        });

        const packageList = $("#package-list");
        packageList.textContent = "";
        if (state.packages.length === 0) {
            packageList.appendChild(make("li", "No packages added yet."));
        }
        state.packages.forEach(function (item, index) {
            packageList.appendChild(listItem(
                item.name + " (" + formatPrice(item.price) + ")",
                function () { editPackage(index); },
                function () {
                    if (window.confirm("Remove this package?\n\n" + item.name)) {
                        state.packages.splice(index, 1);
                        stopEditingIfNeeded("package", index);
                        save();
                        render();
                    }
                }
            ));
        });
    }

    // If the removed item was being edited, leave edit mode.
    function stopEditingIfNeeded(kind, removedIndex) {
        if (editing.kind === kind && editing.index === removedIndex) {
            stopEditing(kind);
            $("#" + kind + "-form").reset();
            updateRatingLabel();
        } else if (editing.kind === kind && editing.index > removedIndex) {
            editing.index -= 1;
        }
    }

    /* ---------- export ---------- */

    function buildFile() {
        return [
            "/* ==========================================================",
            "   Harmonix Energy Solutions: site data (projects, equipment, packages)",
            "   Built with admin.html. Prices are in KES; null means Price on request.",
            "   Equipment rating units: panel W, inverter kW, battery kWh, controller A.",
            "   ========================================================== */",
            "const SITE_DATA = " + JSON.stringify(state, null, 2) + ";",
            ""
        ].join("\n");
    }

    function renderExport() {
        $("#export-box").value = buildFile();
    }

    $("#copy-button").addEventListener("click", function () {
        const box = $("#export-box");
        const done = function () { say("Copied. Now paste it into data.js on GitHub."); };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(box.value).then(done, function () {
                box.select();
                document.execCommand("copy");
                done();
            });
        } else {
            box.select();
            document.execCommand("copy");
            done();
        }
    });

    $("#download-button").addEventListener("click", function () {
        const blob = new Blob([buildFile()], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "data.js";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        say("Downloaded data.js.");
    });

    $("#reset-button").addEventListener("click", function () {
        if (window.confirm("Discard your draft and go back to the data currently on the website?")) {
            try {
                window.localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
                // ignore
            }
            state = normalise(clone(published));
            ["project", "product", "package"].forEach(stopEditing);
            render();
            say("Draft discarded.");
        }
    });

    function render() {
        renderSelects();
        renderLists();
        renderExport();
    }

    updateRatingLabel();
    render();
})();
