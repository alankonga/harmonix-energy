// Business WhatsApp number (international format, digits only).
const WHATSAPP_NUMBER = "254729608222";

/* ==========================================================
   Mobile navigation menu
   ========================================================== */

// Tells the CSS that JavaScript is running, so the menu only
// collapses on phones when the toggle button can actually work.
document.documentElement.classList.add("js");

const siteHeader = document.querySelector("#site-header");
const navToggle = document.querySelector("#nav-toggle");
const mainNav = document.querySelector("#main-nav");

if (siteHeader && navToggle && mainNav) {
    function setMenuOpen(isOpen) {
        siteHeader.classList.toggle("nav-open", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
    }

    navToggle.addEventListener("click", function () {
        setMenuOpen(!siteHeader.classList.contains("nav-open"));
    });

    // Close the menu after choosing a link.
    mainNav.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
            setMenuOpen(false);
        }
    });

    // Close the menu with the Escape key.
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setMenuOpen(false);
        }
    });
}

/* ==========================================================
   Shared calculator assumptions and helpers
   ========================================================== */

// Assumptions (also stated on the page).
const SYSTEM_EFFICIENCY = 0.75;   // overall losses: heat, wiring, inverter, dust
const PANEL_AREA_M2 = 2.6;        // roof space per panel, including gaps

// Battery types: "usable" is the share of capacity that can safely be used,
// "efficiency" covers energy lost charging and discharging.
const BATTERY_TYPES = {
    lithium: { name: "lithium", usable: 0.9, efficiency: 0.9 },
    lead: { name: "lead-acid", usable: 0.5, efficiency: 0.8 }
};
const INVERTER_MARGIN = 1.25;     // inverter sized 25% above the largest load
const DAYS_PER_MONTH = 30;

function formatNumber(value, decimals) {
    return value.toLocaleString("en-US", {
        maximumFractionDigits: decimals
    });
}

function roundToHalf(value) {
    return Math.round(value * 2) / 2;
}

function roundUpToHalf(value) {
    return Math.ceil(value * 2) / 2;
}

// Describe the battery bank needed to supply a given usable energy.
function describeBattery(usableKwh, batteryType, volts) {
    const nominalKwh = usableKwh / batteryType.usable;
    const amps = Math.ceil(((nominalKwh * 1000) / volts) / 5) * 5;

    return {
        nominalKwh: nominalKwh,
        amps: amps,
        text:
            "About " + formatNumber(nominalKwh, 1) + " kWh (" +
            formatNumber(usableKwh, 1) + " kWh usable)",
        ampsText: "About " + formatNumber(amps, 0) + " Ah at " + volts + " V"
    };
}

/* ==========================================================
   Solar sizing calculator
   ========================================================== */

const calcForm = document.querySelector("#calc-form");

if (calcForm) {
    const unitSelect = document.querySelector("#calc-unit");
    const usageInput = document.querySelector("#calc-usage");
    const usageLabel = document.querySelector("#calc-usage-label");
    const tariffField = document.querySelector("#calc-tariff-field");
    const tariffInput = document.querySelector("#calc-tariff");
    const coverageInput = document.querySelector("#calc-coverage");
    const sunInput = document.querySelector("#calc-sun");
    const panelSelect = document.querySelector("#calc-panel");
    const backupCheckbox = document.querySelector("#calc-backup");
    const backupFields = document.querySelector("#calc-backup-fields");
    const loadInput = document.querySelector("#calc-load");
    const hoursInput = document.querySelector("#calc-hours");
    const batteryTypeSelect = document.querySelector("#calc-battery-type");
    const voltageSelect = document.querySelector("#calc-voltage");
    const errorBox = document.querySelector("#calc-error");

    const placeholder = document.querySelector("#calc-placeholder");
    const output = document.querySelector("#calc-output");
    const resKwp = document.querySelector("#res-kwp");
    const resPanels = document.querySelector("#res-panels");
    const resArea = document.querySelector("#res-area");
    const resInverter = document.querySelector("#res-inverter");
    const resAnnual = document.querySelector("#res-annual");
    const resBatteryRow = document.querySelector("#res-battery-row");
    const resBattery = document.querySelector("#res-battery");
    const whatsappLink = document.querySelector("#calc-whatsapp");

    // Switch between "kWh" and "KES" input.
    function updateUnit() {
        const usingBill = unitSelect.value === "kes";

        usageLabel.textContent = usingBill
            ? "Monthly electricity bill (KES)"
            : "Monthly usage (kWh)";
        usageInput.placeholder = usingBill ? "e.g. 10000" : "e.g. 400";
        tariffField.hidden = !usingBill;
        tariffInput.required = usingBill;
    }

    // Show or hide the battery backup fields.
    function updateBackup() {
        const wantsBackup = backupCheckbox.checked;

        backupFields.hidden = !wantsBackup;
        loadInput.required = wantsBackup;
        hoursInput.required = wantsBackup;
    }

    unitSelect.addEventListener("change", updateUnit);
    backupCheckbox.addEventListener("change", updateBackup);
    updateUnit();
    updateBackup();

    calcForm.addEventListener("submit", function (event) {
        event.preventDefault();
        errorBox.textContent = "";

        // Read and check the inputs.
        const usage = Number(usageInput.value);
        const coverage = Number(coverageInput.value);
        const sunHours = Number(sunInput.value);
        const panelWatts = Number(panelSelect.value);
        const usingBill = unitSelect.value === "kes";
        const tariff = Number(tariffInput.value);
        const wantsBackup = backupCheckbox.checked;
        const loadWatts = Number(loadInput.value);
        const backupHours = Number(hoursInput.value);

        if (!(usage > 0)) {
            errorBox.textContent = "Please enter your monthly usage or bill.";
            return;
        }
        if (usingBill && !(tariff > 0)) {
            errorBox.textContent = "Please enter the cost per kWh.";
            return;
        }
        if (!(coverage >= 10 && coverage <= 100)) {
            errorBox.textContent =
                "Share of usage to cover must be between 10 and 100.";
            return;
        }
        if (!(sunHours >= 3 && sunHours <= 7)) {
            errorBox.textContent =
                "Peak sun hours should be between 3 and 7.";
            return;
        }
        if (wantsBackup && !(loadWatts > 0 && backupHours > 0)) {
            errorBox.textContent =
                "Please enter your essential load and the backup hours needed.";
            return;
        }

        // Solar array sizing.
        const monthlyKwh = usingBill ? usage / tariff : usage;
        const dailyKwh = monthlyKwh / DAYS_PER_MONTH;
        const targetDailyKwh = dailyKwh * (coverage / 100);
        const kwpNeeded = targetDailyKwh / (sunHours * SYSTEM_EFFICIENCY);

        const panels = Math.max(1, Math.ceil((kwpNeeded * 1000) / panelWatts));
        const arrayKwp = (panels * panelWatts) / 1000;
        const roofArea = panels * PANEL_AREA_M2;
        const annualKwh = arrayKwp * sunHours * SYSTEM_EFFICIENCY * 365;

        // Inverter: usually sized a little below the array size.
        const inverterHigh = Math.max(1, roundToHalf(arrayKwp));
        const inverterLow = Math.max(1, roundToHalf(arrayKwp / 1.3));
        const inverterText = inverterLow === inverterHigh
            ? "About " + formatNumber(inverterHigh, 1) + " kW"
            : "About " + formatNumber(inverterLow, 1) + " to " +
              formatNumber(inverterHigh, 1) + " kW";

        // Optional battery.
        let batteryText = "";
        if (wantsBackup) {
            const usableKwh = (loadWatts / 1000) * backupHours;
            const battery = describeBattery(
                usableKwh,
                BATTERY_TYPES[batteryTypeSelect.value],
                Number(voltageSelect.value)
            );
            batteryText = battery.text + ", " + battery.ampsText;
        }

        // Show the results.
        const arrayText = formatNumber(arrayKwp, 2) + " kWp";
        const panelsText = formatNumber(panels, 0) + " x " + panelWatts + " W";

        resKwp.textContent = arrayText;
        resPanels.textContent = panelsText;
        resArea.textContent = "About " + formatNumber(roofArea, 0) + " m²";
        resInverter.textContent = inverterText;
        resAnnual.textContent =
            "About " + formatNumber(annualKwh, 0) + " kWh";

        resBatteryRow.hidden = !wantsBackup;
        resBattery.textContent = batteryText;

        placeholder.hidden = true;
        output.hidden = false;

        // Build a WhatsApp link that includes the estimate.
        const lines = [
            "Hello Harmonix Energy Solutions,",
            "",
            "I used the solar calculator on your website.",
            "",
            "Monthly usage: about " + formatNumber(monthlyKwh, 0) + " kWh",
            "Share to cover with solar: " + coverage + "%",
            "Estimated array: " + arrayText + " (" + panelsText + " panels)",
            "Inverter: " + inverterText
        ];

        if (wantsBackup) {
            lines.push("Battery backup: " + batteryText);
        }

        lines.push("", "Please contact me for an exact quotation.");

        whatsappLink.href =
            "https://wa.me/" + WHATSAPP_NUMBER +
            "?text=" + encodeURIComponent(lines.join("\n"));

        // On phones the results sit below the form, so scroll to them.
        output.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
}

/* ==========================================================
   Open the load calculator drop-down from links and web addresses
   ========================================================== */

const loadDetails = document.querySelector("#load-details");

if (loadDetails) {
    // Any link to the calculator opens it first.
    document.addEventListener("click", function (event) {
        if (event.target.closest('a[href="#load-calculator"]')) {
            loadDetails.open = true;
        }
    });

    // Also open it when the page is loaded or changed to #load-calculator.
    function openLoadFromHash() {
        if (window.location.hash === "#load-calculator") {
            loadDetails.open = true;
        }
    }

    window.addEventListener("hashchange", openLoadFromHash);
    openLoadFromHash();
}

/* ==========================================================
   Appliance load calculator (day and night)
   ========================================================== */

const loadForm = document.querySelector("#load-form");

if (loadForm) {
    const MAX_APPLIANCES = 40;

    const presetSelect = document.querySelector("#load-preset");
    const nameInput = document.querySelector("#load-name");
    const wattsInput = document.querySelector("#load-watts");
    const qtyInput = document.querySelector("#load-qty");
    const dayInput = document.querySelector("#load-day");
    const nightInput = document.querySelector("#load-night");
    const loadError = document.querySelector("#load-error");

    const sunInput = document.querySelector("#load-sun");
    const panelSelect = document.querySelector("#load-panel");
    const loadBatteryType = document.querySelector("#load-battery-type");
    const loadVoltage = document.querySelector("#load-voltage");

    const emptyMessage = document.querySelector("#load-empty");
    const tableWrap = document.querySelector("#load-table-wrap");
    const tableBody = document.querySelector("#load-body");
    const totalDayCell = document.querySelector("#load-total-day");
    const totalNightCell = document.querySelector("#load-total-night");
    const clearButton = document.querySelector("#load-clear");

    const placeholder = document.querySelector("#load-placeholder");
    const output = document.querySelector("#load-output");
    const resDay = document.querySelector("#load-res-day");
    const resNight = document.querySelector("#load-res-night");
    const resTotal = document.querySelector("#load-res-total");
    const resConnected = document.querySelector("#load-res-connected");
    const scenarioDay = document.querySelector("#load-scenario-day");
    const scenarioFull = document.querySelector("#load-scenario-full");
    const aKwp = document.querySelector("#load-a-kwp");
    const aPanels = document.querySelector("#load-a-panels");
    const aInverter = document.querySelector("#load-a-inverter");
    const bKwp = document.querySelector("#load-b-kwp");
    const bPanels = document.querySelector("#load-b-panels");
    const bBattery = document.querySelector("#load-b-battery");
    const bAh = document.querySelector("#load-b-ah");
    const bInverter = document.querySelector("#load-b-inverter");
    const whatsappLink = document.querySelector("#load-whatsapp");

    // Each appliance: { name, watts, qty, dayHours, nightHours }
    let appliances = [];

    // Fill the name and watts when a quick pick is chosen.
    presetSelect.addEventListener("change", function () {
        const option = presetSelect.options[presetSelect.selectedIndex];

        if (option && option.value) {
            nameInput.value = option.dataset.name || "";
            wattsInput.value = option.value;
        }
    });

    function makeCell(text, className) {
        const cell = document.createElement("td");
        cell.textContent = text;
        if (className) {
            cell.className = className;
        }
        return cell;
    }

    // Redraw the appliance table and recalculate the system.
    function render() {
        tableBody.textContent = "";

        let totalDayWh = 0;
        let totalNightWh = 0;

        appliances.forEach(function (item, index) {
            const dayWh = item.watts * item.qty * item.dayHours;
            const nightWh = item.watts * item.qty * item.nightHours;
            totalDayWh += dayWh;
            totalNightWh += nightWh;

            const row = document.createElement("tr");

            const nameCell = document.createElement("th");
            nameCell.scope = "row";
            nameCell.textContent = item.name;
            row.appendChild(nameCell);

            row.appendChild(makeCell(formatNumber(item.watts, 1)));
            row.appendChild(makeCell(formatNumber(item.qty, 0)));
            row.appendChild(makeCell(formatNumber(item.dayHours, 1)));
            row.appendChild(makeCell(formatNumber(item.nightHours, 1)));
            row.appendChild(makeCell(formatNumber(dayWh, 0)));
            row.appendChild(makeCell(formatNumber(nightWh, 0)));

            const removeCell = document.createElement("td");
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "load-remove";
            removeButton.textContent = "Remove";
            removeButton.setAttribute("aria-label", "Remove " + item.name);
            removeButton.addEventListener("click", function () {
                appliances.splice(index, 1);
                render();
            });
            removeCell.appendChild(removeButton);
            row.appendChild(removeCell);

            tableBody.appendChild(row);
        });

        totalDayCell.textContent = formatNumber(totalDayWh, 0);
        totalNightCell.textContent = formatNumber(totalNightWh, 0);

        const hasItems = appliances.length > 0;
        emptyMessage.hidden = hasItems;
        tableWrap.hidden = !hasItems;
        clearButton.hidden = !hasItems;

        calculate(totalDayWh, totalNightWh);
    }

    function calculate(totalDayWh, totalNightWh) {
        placeholder.textContent =
            "Add at least one appliance to see your energy use and " +
            "suggested system size here.";

        if (appliances.length === 0) {
            placeholder.hidden = false;
            output.hidden = true;
            return;
        }

        const sunHours = Number(sunInput.value);
        const panelWatts = Number(panelSelect.value);

        if (!(sunHours >= 3 && sunHours <= 7)) {
            placeholder.textContent =
                "Peak sun hours should be between 3 and 7.";
            placeholder.hidden = false;
            output.hidden = true;
            return;
        }

        const dayKwh = totalDayWh / 1000;
        const nightKwh = totalNightWh / 1000;
        const totalKwh = dayKwh + nightKwh;

        // Power drawn if everything runs at once, and during each period.
        let connectedW = 0;
        let dayLoadW = 0;
        let nightLoadW = 0;

        appliances.forEach(function (item) {
            const power = item.watts * item.qty;
            connectedW += power;
            if (item.dayHours > 0) {
                dayLoadW += power;
            }
            if (item.nightHours > 0) {
                nightLoadW += power;
            }
        });

        resDay.textContent = formatNumber(dayKwh, 2) + " kWh";
        resNight.textContent = formatNumber(nightKwh, 2) + " kWh";
        resTotal.textContent = formatNumber(totalKwh, 2) + " kWh";
        resConnected.textContent = formatNumber(connectedW / 1000, 2) + " kW";

        // Scenario A: solar for daytime use only.
        const showDay = dayKwh > 0;
        scenarioDay.hidden = !showDay;

        let dayText = "";
        let fullText = "";

        if (showDay) {
            const kwpNeededA = dayKwh / (sunHours * SYSTEM_EFFICIENCY);
            const panelsA = Math.max(1, Math.ceil((kwpNeededA * 1000) / panelWatts));
            const kwpA = (panelsA * panelWatts) / 1000;
            const inverterA = Math.max(1, roundUpToHalf((dayLoadW * INVERTER_MARGIN) / 1000));

            aKwp.textContent = formatNumber(kwpA, 2) + " kWp";
            aPanels.textContent = formatNumber(panelsA, 0) + " x " + panelWatts + " W";
            aInverter.textContent = "At least " + formatNumber(inverterA, 1) + " kW";

            dayText =
                "Daytime solar only: " + formatNumber(kwpA, 2) + " kWp (" +
                panelsA + " x " + panelWatts + " W), inverter at least " +
                formatNumber(inverterA, 1) + " kW";
        }

        // Scenario B: solar plus battery for day and night.
        const showFull = nightKwh > 0;
        scenarioFull.hidden = !showFull;

        if (showFull) {
            const batteryType = BATTERY_TYPES[loadBatteryType.value];
            const battery = describeBattery(
                nightKwh, batteryType, Number(loadVoltage.value)
            );
            const dailyNeed = dayKwh + nightKwh / batteryType.efficiency;
            const kwpNeededB = dailyNeed / (sunHours * SYSTEM_EFFICIENCY);
            const panelsB = Math.max(1, Math.ceil((kwpNeededB * 1000) / panelWatts));
            const kwpB = (panelsB * panelWatts) / 1000;
            const largestLoadW = Math.max(dayLoadW, nightLoadW);
            const inverterB = Math.max(1, roundUpToHalf((largestLoadW * INVERTER_MARGIN) / 1000));

            bKwp.textContent = formatNumber(kwpB, 2) + " kWp";
            bPanels.textContent = formatNumber(panelsB, 0) + " x " + panelWatts + " W";
            bBattery.textContent = battery.text;
            bAh.textContent = battery.ampsText;
            bInverter.textContent = "At least " + formatNumber(inverterB, 1) + " kW";

            fullText =
                "Solar and battery for day and night: " + formatNumber(kwpB, 2) +
                " kWp (" + panelsB + " x " + panelWatts + " W), inverter at least " +
                formatNumber(inverterB, 1) + " kW. Battery (" + batteryType.name +
                "): " + battery.text + ", " + battery.ampsText;
        }

        placeholder.hidden = true;
        output.hidden = false;

        // Build a WhatsApp message with the appliance list and the estimate.
        const lines = [
            "Hello Harmonix Energy Solutions,",
            "",
            "I used the appliance load calculator on your website.",
            "",
            "My appliances:"
        ];

        appliances.forEach(function (item) {
            lines.push(
                "- " + item.name + ": " + item.watts + " W x " + item.qty +
                ", day " + item.dayHours + " h, night " + item.nightHours + " h"
            );
        });

        lines.push(
            "",
            "Daytime energy: " + formatNumber(dayKwh, 2) + " kWh",
            "Night energy: " + formatNumber(nightKwh, 2) + " kWh",
            "Total per day: " + formatNumber(totalKwh, 2) + " kWh",
            "All appliances on together: " + formatNumber(connectedW / 1000, 2) + " kW"
        );

        if (dayText) {
            lines.push("", dayText);
        }
        if (fullText) {
            lines.push("", fullText);
        }

        lines.push("", "Please contact me for an exact quotation.");

        whatsappLink.href =
            "https://wa.me/" + WHATSAPP_NUMBER +
            "?text=" + encodeURIComponent(lines.join("\n"));
    }

    // Add an appliance.
    loadForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loadError.textContent = "";

        const name = nameInput.value.trim();
        const watts = Number(wattsInput.value);
        const qty = Number(qtyInput.value);
        const dayHours = Number(dayInput.value);
        const nightHours = Number(nightInput.value);

        if (!name) {
            loadError.textContent = "Please enter the appliance name.";
            return;
        }
        if (!(watts > 0 && watts <= 100000)) {
            loadError.textContent = "Please enter the power in watts.";
            return;
        }
        if (!(Number.isInteger(qty) && qty >= 1 && qty <= 1000)) {
            loadError.textContent = "Quantity must be a whole number of 1 or more.";
            return;
        }
        if (!(dayHours >= 0 && dayHours <= 12) ||
            !(nightHours >= 0 && nightHours <= 12)) {
            loadError.textContent =
                "Day hours and night hours must each be between 0 and 12.";
            return;
        }
        if (dayHours === 0 && nightHours === 0) {
            loadError.textContent =
                "Enter the hours it runs during the day, the night, or both.";
            return;
        }
        if (appliances.length >= MAX_APPLIANCES) {
            loadError.textContent =
                "You can add up to " + MAX_APPLIANCES + " appliances.";
            return;
        }

        appliances.push({
            name: name,
            watts: watts,
            qty: qty,
            dayHours: dayHours,
            nightHours: nightHours
        });

        // Reset the form ready for the next appliance.
        presetSelect.value = "";
        nameInput.value = "";
        wattsInput.value = "";
        qtyInput.value = "1";
        dayInput.value = "0";
        nightInput.value = "0";
        nameInput.focus();

        render();
    });

    clearButton.addEventListener("click", function () {
        appliances = [];
        render();
    });

    // Recalculate when the system settings change.
    sunInput.addEventListener("input", render);
    panelSelect.addEventListener("change", render);
    loadBatteryType.addEventListener("change", render);
    loadVoltage.addEventListener("change", render);

    render();
}

/* ==========================================================
   Quotation form (opens WhatsApp with a prepared message)
   ========================================================== */

const quoteForm = document.querySelector("#quote-form");
const formStatus = document.querySelector("#form-status");

if (!quoteForm || !formStatus) {
    console.error("Quotation form or status message was not found.");
} else {
    quoteForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Read the customer's details.
        const customerName =
            document.querySelector("#customer-name").value.trim();

        const customerEmail =
            document.querySelector("#customer-email").value.trim();

        const service =
            document.querySelector("#service").value;

        const projectDetails =
            document.querySelector("#project-details").value.trim();

        // Fallback check in case the browser's "required" validation is bypassed.
        if (!customerName || !customerEmail ||
            !service || !projectDetails) {
            formStatus.textContent =
                "Please complete all fields before continuing.";
            return;
        }

        // Construct the message.
        const message =
            "Hello Harmonix Energy Solutions,\n\n" +
            "I would like to request a quotation.\n\n" +
            "Name: " + customerName + "\n" +
            "Email: " + customerEmail + "\n" +
            "Service: " + service + "\n" +
            "Project details: " + projectDetails;

        // Convert the message into URL-safe text.
        const whatsappURL =
            "https://wa.me/" + WHATSAPP_NUMBER +
            "?text=" + encodeURIComponent(message);

        // Open WhatsApp with the prepared message.
        // (Passing "noopener" in the features string makes browsers return
        // null even on success, so the opener is cleared manually instead.)
        const newWindow = window.open(whatsappURL, "_blank");

        if (newWindow === null) {
            // Pop-up blocked: give the customer a link they can click.
            formStatus.textContent =
                "Your browser may have blocked the new tab. ";

            const fallbackLink = document.createElement("a");
            fallbackLink.href = whatsappURL;
            fallbackLink.target = "_blank";
            fallbackLink.rel = "noopener noreferrer";
            fallbackLink.textContent = "Open WhatsApp instead";
            formStatus.appendChild(fallbackLink);
        } else {
            newWindow.opener = null;
            formStatus.textContent =
                "Your message is ready in WhatsApp. " +
                "Review it and press Send.";
            quoteForm.reset();
        }
    });
}
