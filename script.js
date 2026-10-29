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
   Solar sizing calculator
   ========================================================== */

const calcForm = document.querySelector("#calc-form");

if (calcForm) {
    // Assumptions (also stated on the page).
    const SYSTEM_EFFICIENCY = 0.75;   // overall losses: heat, wiring, inverter, dust
    const PANEL_AREA_M2 = 2.6;        // roof space per panel, including gaps
    const BATTERY_USABLE = 0.9;       // usable share of a lithium battery
    const DAYS_PER_MONTH = 30;

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

    function formatNumber(value, decimals) {
        return value.toLocaleString("en-US", {
            maximumFractionDigits: decimals
        });
    }

    function roundToHalf(value) {
        return Math.round(value * 2) / 2;
    }

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
            const nominalKwh = usableKwh / BATTERY_USABLE;
            batteryText =
                "About " + formatNumber(nominalKwh, 1) + " kWh (" +
                formatNumber(usableKwh, 1) + " kWh usable)";
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
