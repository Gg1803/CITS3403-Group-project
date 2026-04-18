// Lightweight interactions for auth buttons, reveal-on-scroll, and mobile navigation.
document.addEventListener("DOMContentLoaded", () => {
  const authButtons = document.querySelectorAll("[data-auth]");
  const scrollButtons = document.querySelectorAll("[data-scroll-target]");
  const revealItems = document.querySelectorAll("[data-reveal]");
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  function openAuth(mode) {
    try {
      sessionStorage.setItem("eventure-auth-intent", mode);
    } catch (error) {
      // Ignore storage failures so navigation still works.
    }

    window.location.href = "login_signup.html";
  }

  function closeMobileMenu() {
    if (!mobileMenu || !menuToggle) return;

    mobileMenu.hidden = true;
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  authButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openAuth(button.dataset.auth);
      closeMobileMenu();
    });
  });

  scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTarget;
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll('.mobile-menu a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu.hidden = isOpen;
      mobileMenu.classList.toggle("is-open", !isOpen);
    });
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -60px 0px"
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  window.addEventListener("scroll", () => {
    if (!siteHeader) return;
    siteHeader.classList.toggle("scrolled", window.scrollY > 12);
  });

  lucide.createIcons();
});
