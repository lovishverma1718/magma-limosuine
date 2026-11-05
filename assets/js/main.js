/* Magma Limousine — site interactions
   Works without GSAP/Lenis (content simply shows); enhances when they load. */
(function () {
  "use strict";

  var PHONE = "+17788982147";
  var root = document.documentElement;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop = window.matchMedia("(min-width: 861px)").matches;

  if (hasGsap && !reduceMotion) {
    root.classList.add("anim");
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header ---------- */
  var header = document.querySelector(".header");
  var callbar = document.querySelector(".callbar");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.toggle("is-hidden", y > lastY && y > 400 && !root.classList.contains("menu-open"));
    }
    // Only reveal the mobile action bar while scrolling up (or at the very end), so it never covers text being read
    if (callbar) {
      var atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
      if (y < window.innerHeight * 0.6) callbar.classList.remove("is-visible");
      else if (y < lastY - 4 || atEnd) callbar.classList.add("is-visible");
      else if (y > lastY + 4) callbar.classList.remove("is-visible");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = root.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    document.querySelectorAll(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () { root.classList.remove("menu-open"); if (lenis) lenis.start(); });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (hasGsap && isDesktop && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () { gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" }); });
    });
  }

  /* ---------- Preloader + intro ---------- */
  var preloader = document.querySelector(".preloader");
  var seen = false;
  try { seen = sessionStorage.getItem("magma-intro") === "1"; sessionStorage.setItem("magma-intro", "1"); } catch (e) {}

  function intro() {
    if (!hasGsap || reduceMotion) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from("[data-intro] .line > span", { yPercent: 115, duration: 1.5, stagger: 0.1 })
      .from("[data-intro-fade]", { opacity: 0, y: 24, duration: 1.2, stagger: 0.08 }, "-=1.1")
      .to(".hero__media img, .page-hero__media img", { scale: 1, duration: 2.6, ease: "power2.out" }, 0);
  }

  if (preloader) {
    if (seen || !hasGsap || reduceMotion) {
      preloader.classList.add("is-skipped");
      intro();
    } else {
      if (lenis) lenis.stop();
      gsap.timeline()
        .from(".preloader__logo", { scale: 0.86, opacity: 0, filter: "blur(8px)", duration: 1.2, ease: "expo.out" })
        .to(".preloader__bar span", { scaleX: 1, duration: 1, ease: "power2.inOut" }, 0.2)
        .to(".preloader", { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "+=0.15")
        .add(function () { preloader.classList.add("is-skipped"); if (lenis) lenis.start(); })
        .add(intro, "-=0.55");
    }
  } else {
    intro();
  }

  /* ---------- Scroll reveals ---------- */
  if (hasGsap && !reduceMotion) {
    ScrollTrigger.batch("[data-reveal]:not([data-reveal='clip'])", {
      start: "top 94%",
      once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: isDesktop ? 1.3 : 0.9, ease: "expo.out", stagger: isDesktop ? 0.09 : 0.05 }); }
    });
    gsap.utils.toArray("[data-reveal='clip']").forEach(function (el) {
      gsap.to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    gsap.utils.toArray("[data-lines]").forEach(function (el) {
      gsap.from(el.querySelectorAll(".line > span"), {
        yPercent: 115, duration: 1.4, ease: "expo.out", stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    });
    gsap.utils.toArray("[data-parallax]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-parallax")) || 12;
      gsap.fromTo(el, { yPercent: -amt / 2 }, { yPercent: amt / 2, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    gsap.utils.toArray(".hero__media img").forEach(function (el) {
      gsap.to(el, { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- Counters ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (!hasGsap || reduceMotion) { el.textContent = end.toFixed(dec); return; }
    var o = { v: 0 };
    el.textContent = (0).toFixed(dec);
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () { gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", onUpdate: function () { el.textContent = o.v.toFixed(dec); } }); }
    });
  });

  /* ---------- Horizontal fleet (desktop pin) ---------- */
  var fleetH = document.querySelector(".fleet-h");
  if (fleetH && hasGsap && isDesktop && !reduceMotion) {
    var track = fleetH.querySelector(".fleet-h__track");
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -dist(); },
      ease: "none",
      scrollTrigger: { trigger: fleetH, start: "center center", end: function () { return "+=" + dist(); }, pin: fleetH.closest("section"), scrub: 0.8, invalidateOnRefresh: true, pinSpacing: true, anticipatePin: 1 }
    });
  }

  /* ---------- Testimonials ---------- */
  var slider = document.querySelector("[data-testi]");
  if (slider) {
    var quotes = slider.querySelectorAll(".quote");
    var count = slider.querySelector(".testi__count");
    var bar = slider.querySelector(".testi__progress span");
    var i = 0, timer, DURATION = 7000;
    function show(n) {
      quotes[i].classList.remove("is-active");
      i = (n + quotes.length) % quotes.length;
      quotes[i].classList.add("is-active");
      if (count) count.textContent = String(i + 1).padStart(2, "0") + " / " + String(quotes.length).padStart(2, "0");
      if (bar) {
        bar.style.transition = "none"; bar.style.transform = "scaleX(0)";
        void bar.offsetWidth;
        bar.style.transition = "transform " + DURATION + "ms linear"; bar.style.transform = "scaleX(1)";
      }
      clearTimeout(timer);
      if (!reduceMotion) timer = setTimeout(function () { show(i + 1); }, DURATION);
    }
    slider.querySelector("[data-prev]").addEventListener("click", function () { show(i - 1); });
    slider.querySelector("[data-next]").addEventListener("click", function () { show(i + 1); });
    show(0);
  }

  /* ---------- Vehicle thumbnails ---------- */
  document.querySelectorAll(".vehicle").forEach(function (v) {
    var main = v.querySelector(".vehicle__main img");
    var note = v.querySelector(".vehicle__photo-note");
    v.querySelectorAll(".vehicle__thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        v.querySelectorAll(".vehicle__thumbs button").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        var img = b.querySelector("img");
        var swap = function () {
          main.src = img.src; main.alt = img.alt;
          if (note) note.textContent = b.getAttribute("data-note") || "";
          note && (note.style.display = b.getAttribute("data-note") ? "" : "none");
        };
        if (hasGsap) gsap.to(main, { opacity: 0, duration: 0.25, onComplete: function () { swap(); gsap.to(main, { opacity: 1, duration: 0.5 }); } });
        else swap();
      });
    });
  });

  /* ---------- Booking strip -> contact page ---------- */
  var strip = document.querySelector("[data-booking-strip]");
  if (strip) {
    strip.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = new URLSearchParams(new FormData(strip));
      window.location.href = "contact.html?" + p.toString() + "#book";
    });
  }

  /* ---------- Booking form ---------- */
  var formWrap = document.querySelector("[data-booking]");
  if (formWrap) {
    var form = formWrap.querySelector("form");
    var params = new URLSearchParams(window.location.search);
    params.forEach(function (val, key) {
      var el = form.elements[key];
      if (!el || !val) return;
      if (el.length && el[0] && el[0].type === "radio") {
        Array.prototype.forEach.call(el, function (r) { r.checked = r.value === val; });
      } else { el.value = val; }
    });
    var dateEl = form.elements.date;
    if (dateEl) dateEl.min = new Date().toISOString().split("T")[0];

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (el) {
        var f = el.closest(".field");
        var bad = !el.value.trim();
        if (f) f.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) { var first = form.querySelector(".is-invalid input, .is-invalid select"); if (first) first.focus(); return; }

      var d = new FormData(form);
      var lines = [
        "New booking request — Magma Limousine",
        "Name: " + d.get("name"),
        "Phone: " + d.get("phone"),
        d.get("email") ? "Email: " + d.get("email") : "",
        "Occasion: " + (d.get("occasion") || "—"),
        "Vehicle: " + (d.get("vehicle") || "—"),
        "Date/time: " + d.get("date") + " " + (d.get("time") || ""),
        "Passengers: " + (d.get("passengers") || "—"),
        "Pickup: " + d.get("pickup"),
        d.get("dropoff") ? "Drop-off: " + d.get("dropoff") : "",
        d.get("notes") ? "Notes: " + d.get("notes") : ""
      ].filter(Boolean).join("\n");
      var sms = formWrap.querySelector("[data-sms]");
      if (sms) sms.href = "sms:" + PHONE + "?&body=" + encodeURIComponent(lines);
      formWrap.classList.add("is-sent");
      if (lenis) lenis.scrollTo(formWrap, { offset: -120 }); else formWrap.scrollIntoView({ behavior: "smooth" });
    });
    form.addEventListener("input", function (e) {
      var f = e.target.closest(".field");
      if (f && e.target.value.trim()) f.classList.remove("is-invalid");
    });
  }

  /* Re-measure whenever fonts or lazy images change the layout, otherwise reveal triggers sit at stale
     positions and content further down the page can stay hidden (most visible on phones) */
  if (hasGsap) {
    var refreshTimer;
    var queueRefresh = function () { clearTimeout(refreshTimer); refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 150); };
    window.addEventListener("load", queueRefresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueRefresh);
    document.querySelectorAll("img").forEach(function (img) { if (!img.complete) img.addEventListener("load", queueRefresh, { once: true }); });

    // Safety net: anything that has already scrolled into view gets shown, whatever the trigger state
    var sweepTimer;
    window.addEventListener("scroll", function () {
      clearTimeout(sweepTimer);
      sweepTimer = setTimeout(function () {
        var limit = window.innerHeight * 0.98;
        document.querySelectorAll("[data-reveal]").forEach(function (el) {
          var cs = getComputedStyle(el);
          if (el.getBoundingClientRect().top < limit && (cs.opacity === "0" || cs.clipPath.indexOf("100%") > -1)) {
            gsap.to(el, { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)", duration: 0.8, ease: "expo.out" });
          }
        });
        document.querySelectorAll("[data-lines] .line > span, [data-intro] .line > span").forEach(function (el) {
          if (el.getBoundingClientRect().top < limit && gsap.getProperty(el, "yPercent") > 50) gsap.to(el, { yPercent: 0, duration: 0.8, ease: "expo.out" });
        });
      }, 250);
    }, { passive: true });
  }
})();
