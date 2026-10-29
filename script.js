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