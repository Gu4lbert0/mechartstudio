/*
 * M-Robotics static site JavaScript
 * --------------------------------------------------------------------------
 * This file intentionally uses vanilla JavaScript only. It handles the mobile
 * navigation menu, a subtle sticky-header state, and the static contact form UI.
 */

document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector("[data-header]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const navMenu = document.querySelector("[data-nav-menu]");
    const contactForm = document.querySelector(".contact-form");
    const formNote = document.querySelector("[data-form-note]");

    /*
     * Adds or removes a shadow class when the user scrolls. This gives the
     * sticky header better separation from page content after movement begins.
     */
    const updateHeaderState = () => {
        if (!header) {
            return;
        }

        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    /*
     * Mobile menu toggle. aria-expanded is kept in sync for assistive
     * technologies, and classes drive the visual transition in CSS.
     */
    if (navToggle && navMenu) {
        navToggle.addEventListener("click", () => {
            const isOpen = navMenu.classList.toggle("is-open");

            navToggle.classList.toggle("is-open", isOpen);
            navToggle.setAttribute("aria-expanded", String(isOpen));
            navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
        });

        /*
         * Close the mobile menu after a navigation link is selected. On desktop
         * this has no visible effect, but keeps behavior consistent.
         */
        navMenu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("is-open");
                navToggle.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
                navToggle.setAttribute("aria-label", "Open navigation menu");
            });
        });
    }

    /*
     * The contact form is intentionally static. Preventing submission avoids a
     * dead GitHub Pages POST and gives visitors immediate, honest feedback.
     */
    if (contactForm && formNote) {
        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();
            formNote.textContent = "Thanks for your interest. Please email Gu4lbert0@gmail.com to send your message.";
        });
    }
});
