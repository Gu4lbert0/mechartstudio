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
    const aboutToggle = document.querySelector("[data-about-toggle]");
    const aboutMore = document.querySelector("[data-about-more]");
    const revealElements = document.querySelectorAll("[data-reveal]");
    const previewImages = document.querySelectorAll(".project-detail-hero__image img, .project-gallery img");

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
     * Expand and collapse the About Me biography. max-height is set from the
     * element's scrollHeight so the transition stays smooth even if text wraps
     * differently across screen sizes.
     */
    if (aboutToggle && aboutMore) {
        const aboutCard = aboutToggle.closest(".about-me-card");

        aboutToggle.addEventListener("click", () => {
            const isExpanded = aboutToggle.getAttribute("aria-expanded") === "true";
            const shouldExpand = !isExpanded;

            aboutToggle.setAttribute("aria-expanded", String(shouldExpand));
            aboutToggle.textContent = shouldExpand ? "Show Less" : "Read More";
            aboutCard?.classList.toggle("is-expanded", shouldExpand);
            aboutMore.style.maxHeight = shouldExpand ? `${aboutMore.scrollHeight}px` : "0px";
        });

        window.addEventListener("resize", () => {
            if (aboutToggle.getAttribute("aria-expanded") === "true") {
                aboutMore.style.maxHeight = `${aboutMore.scrollHeight}px`;
            }
        });
    }

    /*
     * Fade sections into view when supported. If IntersectionObserver is not
     * available, content is shown immediately so older browsers still work.
     */
    if (revealElements.length > 0) {
        if ("IntersectionObserver" in window) {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.18 });

            revealElements.forEach((element) => revealObserver.observe(element));
        } else {
            revealElements.forEach((element) => element.classList.add("is-visible"));
        }
    }

    /*
     * Project image preview. Images open in an in-page lightbox so visitors can
     * inspect the full image without navigating away from the current project.
     */
    if (previewImages.length > 0) {
        const lightbox = document.createElement("div");
        lightbox.className = "image-lightbox";
        lightbox.setAttribute("role", "dialog");
        lightbox.setAttribute("aria-modal", "true");
        lightbox.setAttribute("aria-label", "Project image preview");
        lightbox.innerHTML = `
            <div class="image-lightbox__dialog">
                <button class="image-lightbox__close" type="button" aria-label="Close image preview">&times;</button>
                <img class="image-lightbox__image" alt="">
                <p class="image-lightbox__caption"></p>
            </div>
        `;

        document.body.appendChild(lightbox);

        const lightboxImage = lightbox.querySelector(".image-lightbox__image");
        const lightboxCaption = lightbox.querySelector(".image-lightbox__caption");
        const closeButton = lightbox.querySelector(".image-lightbox__close");

        const closeLightbox = () => {
            lightbox.classList.remove("is-open");
            document.body.style.overflow = "";
        };

        previewImages.forEach((image) => {
            image.setAttribute("tabindex", "0");
            image.setAttribute("role", "button");
            image.setAttribute("aria-label", `Preview image: ${image.alt || "project image"}`);

            const openLightbox = () => {
                const caption = image.closest("figure")?.querySelector("figcaption")?.textContent || image.alt || "";

                lightboxImage.src = image.currentSrc || image.src;
                lightboxImage.alt = image.alt || "Project image preview";
                lightboxCaption.textContent = caption;
                lightbox.classList.add("is-open");
                document.body.style.overflow = "hidden";
                closeButton.focus();
            };

            image.addEventListener("click", openLightbox);
            image.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openLightbox();
                }
            });
        });

        closeButton.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
                closeLightbox();
            }
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
