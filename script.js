/* ===== Easy Workflow Pro — Main JavaScript ===== */

// ===== GEO-BASED CURRENCY DETECTION =====
// Pricing config: Indian users see INR, everyone else sees USD
const PRICING = {
    IN: {
        currency: 'INR',
        symbol: '₹',
        basic: { amount: 100, label: '₹100', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflow', formValue: 'basic - ₹100' },
        pro: { amount: 2000, label: '₹2000', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - ₹2000' },
        autocaptions: { amount: 800, label: '₹800', gumroadLink: 'https://harshedits55.gumroad.com/l/Autocaptionpro', formValue: 'autocaptions - ₹800' },
        projectmanager: { amount: 1000, label: '₹1000', gumroadLink: 'https://harshedits55.gumroad.com/l/ProjectManager', formValue: 'projectmanager - ₹1000' },
        proAfterDeadline: { amount: 2000, label: '₹2000', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - ₹2000' },
        autocaptionsAfterDeadline: { amount: 800, label: '₹800', gumroadLink: 'https://harshedits55.gumroad.com/l/Autocaptionpro', formValue: 'autocaptions - ₹800' },
        showUPI: true,
        badge: '🇮🇳 Prices in INR'
    },
    US: {
        currency: 'USD',
        symbol: '$',
        basic: { amount: 2, label: '$2', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflow', formValue: 'basic - $2' },
        pro: { amount: 24, label: '$24', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - $24' },
        autocaptions: { amount: 10, label: '$10', gumroadLink: 'https://harshedits55.gumroad.com/l/Autocaptionpro', formValue: 'autocaptions - $10' },
        projectmanager: { amount: 12, label: '$12', gumroadLink: 'https://harshedits55.gumroad.com/l/ProjectManager', formValue: 'projectmanager - $12' },
        proAfterDeadline: { amount: 24, label: '$24', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - $24' },
        autocaptionsAfterDeadline: { amount: 10, label: '$10', gumroadLink: 'https://harshedits55.gumroad.com/l/Autocaptionpro', formValue: 'autocaptions - $10' },
        showUPI: false,
        badge: '🌍 Prices in USD'
    }
};

// ===== PRICE INCREASE DEADLINE =====
// After this date, Pro price increases automatically
let PRICE_DEADLINE = new Date('2026-05-20T23:59:59+05:30'); // May 20, 2026 end of day IST

function isPastDeadline() {
    return new Date() > PRICE_DEADLINE;
}

// ===== PAYMENT GATEWAY CONFIGURATION (Global) =====
var RZP_KEY_ID = 'rzp_test_SbYRBwt9vpi7Rr';
var CF_APP_ID = '121259341f82a4cec1053b822723952121';
var CF_MODE = 'production';

var RZP_AMOUNTS = {
    basic: { INR: 10000, USD: 200 },
    pro: { INR: 200000, USD: 2400 }, // Default ₹2000
    autocaptions: { INR: 80000, USD: 1000 },
    projectmanager: { INR: 100000, USD: 1200 }
};

var RZP_AMOUNTS_DEADLINE = {
    basic: { INR: 10000, USD: 200 },
    pro: { INR: 200000, USD: 2400 }, // Default ₹2000
    autocaptions: { INR: 80000, USD: 1000 },
    projectmanager: { INR: 100000, USD: 1200 }
};

// Apply deadline pricing — overwrite pro config if past deadline
function applyDeadlinePricing(region) {
    if (isPastDeadline() && region.proAfterDeadline) {
        region.pro = { ...region.proAfterDeadline };
    }
    return region;
}

// Detected region config — defaults to IN until API call completes
// (site is India-primary; non-Indian users switch to USD once geo-API responds)
window.pricingRegion = applyDeadlinePricing({ ...PRICING.IN });

// ===== COUNTDOWN TIMER =====
function initCountdownTimer() {
    const banner = document.getElementById('countdown-banner');
    if (!banner) return;

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    const newPriceLabel = document.getElementById('new-price-label');

    // Update the "increases to" label based on detected currency
    function updateNewPriceLabel() {
        const region = window.pricingRegion || PRICING.IN;
        // Show the post-deadline price from the original config (not the overwritten one)
        const originalRegion = (region.currency === 'USD') ? PRICING.US : PRICING.IN;
        if (newPriceLabel && originalRegion.proAfterDeadline) {
            newPriceLabel.textContent = originalRegion.proAfterDeadline.label;
        }
    }

    function updateTimer() {
        const now = new Date();
        const diff = PRICE_DEADLINE - now;

        if (diff <= 0) {
            // Deadline passed — completely hide the countdown banner
            banner.style.display = 'none';
            return; // stop ticking
        } else {
            // Ensure banner is visible if we fetched a new deadline from Firebase
            banner.style.display = 'block';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

        setTimeout(updateTimer, 1000);
    }

    updateNewPriceLabel();
    updateTimer();

    // Re-update label whenever pricing region changes
    window._updateCountdownLabel = updateNewPriceLabel;

    // NEW: Update the human-readable deadline date string
    window._updateDeadlineDateLabel = function () {
        const dateLabel = document.querySelector('.countdown-date-label');
        if (dateLabel && PRICE_DEADLINE) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            dateLabel.textContent = PRICE_DEADLINE.toLocaleDateString('en-US', options);
        }
    };
}

function applyPricingToPage(region) {
    const p = region;
    const sym = p.symbol;
    const basicAmt = p.basic.amount;
    const proAmt = p.pro.amount;

    // --- Pricing section currencies and values ---
    // Price currency symbols
    document.querySelectorAll('.price-currency').forEach(el => { el.textContent = sym; });

    // Price values — update based on sibling label context
    document.querySelectorAll('.price-card').forEach(card => {
        const titleEl = card.querySelector('h3');
        const valueEl = card.querySelector('.price-value');
        const noteEl = card.querySelector('.price-note');
        const btnBlock = card.querySelector('.btn-block');
        if (!titleEl || !valueEl) return;

        const isAutoCaptions = titleEl.textContent.trim().toLowerCase().includes('auto captions');
        const isProjectManager = titleEl.textContent.trim().toLowerCase().includes('project manager');
        const isProCard = titleEl.textContent.trim().toLowerCase().includes('pro') && !isAutoCaptions && !isProjectManager;

        if (isAutoCaptions) {
            valueEl.textContent = p.autocaptions.amount;
            if (btnBlock && (btnBlock.id === 'btn-pro' || btnBlock.id === 'btn-autocaptions')) {
                btnBlock.textContent = `Get Auto Captions — ${p.autocaptions.label}`;
            }
        }
        else if (isProjectManager) {
            valueEl.textContent = p.projectmanager.amount;
            if (btnBlock) {
                btnBlock.textContent = `Get Project Manager — ${p.projectmanager.label}`;
            }
        }
        else if (isProCard) {
            valueEl.textContent = proAmt;
            // Update inline CTA button text
            if (btnBlock && btnBlock.id === 'btn-pro') {
                btnBlock.textContent = `Get Pro — ${p.pro.label}`;
            }
        } else {
            valueEl.textContent = basicAmt;
            // Update note text
            if (noteEl && noteEl.textContent.includes('100') || noteEl && noteEl.textContent.includes('2')) {
                noteEl.innerHTML = `Just ${p.basic.label} for lifetime access`;
            }
            // Update Basic card button
            if (btnBlock && (btnBlock.dataset.tier === 'basic' || btnBlock.id === 'btn-free')) {
                const isPayBtn = btnBlock.classList.contains('btn-pay');
                if (isPayBtn) btnBlock.textContent = `Get Basic — ${p.basic.label}`;
            }
        }
    });

    // Price badge on free version card ("JUST ₹100" / "JUST $2")
    document.querySelectorAll('.price-badge').forEach(badge => {
        if (badge.textContent.includes('POPULAR')) return; // skip "MOST POPULAR"
        badge.textContent = `JUST ${p.basic.label}`;
    });

    // --- CTA section buttons (Navbar, Hero, Final CTA) ---
    // Update any "Get Pro" button
    document.querySelectorAll('.pro-only').forEach(el => {
        if (el.tagName === 'A' && el.classList.contains('btn-primary')) {
            // Only update if it doesn't already have specific logic (like in cards)
            if (!el.closest('.price-card')) {
                el.textContent = `Get Pro — ${p.pro.label}`;
            }
        }
    });

    // --- Hero section CTA (has an inner <span>, needs separate targeting) ---
    const heroCTAText = document.getElementById('hero-pro-cta-text');
    if (heroCTAText) heroCTAText.textContent = `Get Pro — ${p.pro.label}`;

    const heroBasicInline = document.getElementById('hero-basic-price-inline');
    if (heroBasicInline) heroBasicInline.textContent = p.basic.label;

    // Update any "Get Auto Captions" buttons via data-tier
    document.querySelectorAll('[data-tier="autocaptions"]').forEach(el => {
        if (el.id === 'final-autocap-cta') {
            el.textContent = `Get Auto Captions — ${p.autocaptions.label}`;
        } else if (el.id === 'hero-autocaptions-cta') {
            const span = el.querySelector('#hero-autocaptions-cta-text');
            if (span) span.textContent = `Get Auto Captions — ${p.autocaptions.label}`;
        } else if (el.classList.contains('btn-primary')) {
            // pricing card or navbar
            el.textContent = `Get Auto Captions — ${p.autocaptions.label}`;
        }
    });

    // Inline text notes
    document.querySelectorAll('.price-note').forEach(note => {
        if (note.querySelector('a')) return; // skip notes with links
        if (note.textContent.includes('Just') || note.textContent.includes('Instant')) {
            if (note.closest('.price-card-pro')) {
                note.innerHTML = `Instant download • Lifetime access`;
            }
        }
    });

    // --- FAQ text updates ---
    document.querySelectorAll('.faq-answer p, .faq-question span').forEach(el => {
        if (!el.dataset.originalHtml) {
            el.dataset.originalHtml = el.innerHTML;
        }

        let content = el.dataset.originalHtml;
        const region = window.pricingRegion || PRICING.IN;

        // Replace placeholders or hardcoded strings with current prices
        content = content
            .replace(/₹1[,.]?500/g, region.pro.label)
            .replace(/₹800/g, region.autocaptions.label)
            .replace(/₹100/g, region.basic.label)
            .replace(/\$24/g, region.pro.label)
            .replace(/\$10/g, region.autocaptions.label)
            .replace(/\$2/g, region.basic.label);

        el.innerHTML = content;
    });

    // --- Currency badge in pricing header ---
    // Inject or update a small badge showing which currency is active
    let badge = document.getElementById('currency-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'currency-badge';
        badge.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:6px',
            'background:rgba(255,255,255,0.06)', 'border:1px solid rgba(255,255,255,0.12)',
            'border-radius:20px', 'padding:4px 14px', 'font-size:12px',
            'color:var(--text-secondary)', 'margin-top:12px', 'letter-spacing:0.03em'
        ].join(';');
        // Append after each pricing section-header subtitle
        document.querySelectorAll('.pricing .section-subtitle').forEach(subtitle => {
            const clone = badge.cloneNode(true);
            clone.textContent = p.badge;
            subtitle.insertAdjacentElement('afterend', clone);
        });
    } else {
        document.querySelectorAll('#currency-badge').forEach(b => { b.textContent = p.badge; });
    }
}

async function detectAndApplyCurrency() {
    // ---- URL OVERRIDE FOR TESTING ----
    // Add ?currency=usd or ?currency=inr to the URL to force a currency
    const urlParam = new URLSearchParams(window.location.search).get('currency');
    if (urlParam === 'usd') {
        window.pricingRegion = applyDeadlinePricing({ ...PRICING.US });
        applyPricingToPage(window.pricingRegion);
        if (window._updateCountdownLabel) window._updateCountdownLabel();
        return;
    }
    if (urlParam === 'inr') {
        window.pricingRegion = applyDeadlinePricing({ ...PRICING.IN });
        applyPricingToPage(window.pricingRegion);
        if (window._updateCountdownLabel) window._updateCountdownLabel();
        return;
    }
    // ----------------------------------

    // Helper: try a single geo API, returns country code string or null
    async function tryGeoAPI(url, extractor) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return null;
            const data = await res.json();
            const code = extractor(data);
            return (typeof code === 'string' && code.length === 2) ? code.toUpperCase() : null;
        } catch (e) {
            return null;
        }
    }

    // Try 4 HTTPS-compatible geo APIs in order — stops as soon as one works
    // NOTE: ip-api.com was removed — it does NOT support HTTPS on the free tier
    let countryCode =
        await tryGeoAPI('https://ipapi.co/json/', d => d.country_code) ||
        await tryGeoAPI('https://freeipapi.com/api/json', d => d.countryCode) ||
        await tryGeoAPI('https://api.country.is/', d => d.country) ||
        await tryGeoAPI('https://ipinfo.io/json', d => d.country);

    if (countryCode) {
        window.pricingRegion = applyDeadlinePricing((countryCode === 'IN') ? { ...PRICING.IN } : { ...PRICING.US });
    } else {
        // All APIs failed — default to INR (site is India-primary)
        window.pricingRegion = applyDeadlinePricing({ ...PRICING.IN });
    }

    applyPricingToPage(window.pricingRegion);
    if (window._updateCountdownLabel) window._updateCountdownLabel();
}

// Run geo-detection immediately (before DOM ready, catches early elements)
detectAndApplyCurrency();

// ═══════════════════════════════════════════════════════════════════
// 🔥 FIRESTORE DYNAMIC PRICING — Overrides hardcoded prices with
//    values from Firebase, editable from the Admin Dashboard.
//    Falls back to hardcoded PRICING if Firestore is unavailable.
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// 🔥 FIRESTORE DYNAMIC PRICING — Real-time Listeners
//    Overrides hardcoded prices with values from Firebase.
// ═══════════════════════════════════════════════════════════════════
let pricingListener = null;
let settingsListener = null;

function startFirestoreListeners() {
    if (!window.firestore) return;

    // --- 1. Pricing Listener ---
    if (pricingListener) pricingListener(); // Unsubscribe if already exists
    pricingListener = window.firestore.collection('config').doc('pricing').onSnapshot(doc => {
        if (!doc.exists) {
            console.log('[Firebase] Pricing document does not exist. Using defaults.');
            return;
        }

        const p = doc.data();
        console.log('[Firebase] Dynamic pricing updated:', p);

        // Crucial: Set this for the checkout form logic to use verified Firestore amounts
        window.currentFirestorePricing = p;

        // Update the hardcoded PRICING object with Firestore values
        if (p.basic_inr !== undefined) {
            PRICING.IN.basic.amount = p.basic_inr;
            PRICING.IN.basic.label = '₹' + p.basic_inr;
            PRICING.IN.basic.formValue = 'basic - ₹' + p.basic_inr;
        }
        if (p.pro_inr !== undefined) {
            PRICING.IN.pro.amount = p.pro_inr;
            PRICING.IN.pro.label = '₹' + p.pro_inr;
            PRICING.IN.pro.formValue = 'pro - ₹' + p.pro_inr;
            // Also update deadline prices to match if they aren't separately defined in Firestore
            PRICING.IN.proAfterDeadline.amount = p.pro_inr;
            PRICING.IN.proAfterDeadline.label = '₹' + p.pro_inr;
            PRICING.IN.proAfterDeadline.formValue = 'pro - ₹' + p.pro_inr;
        }
        if (p.autocaptions_inr !== undefined) {
            PRICING.IN.autocaptions.amount = p.autocaptions_inr;
            PRICING.IN.autocaptions.label = '₹' + p.autocaptions_inr;
            PRICING.IN.autocaptions.formValue = 'autocaptions - ₹' + p.autocaptions_inr;
            PRICING.IN.autocaptionsAfterDeadline.amount = p.autocaptions_inr;
            PRICING.IN.autocaptionsAfterDeadline.label = '₹' + p.autocaptions_inr;
            PRICING.IN.autocaptionsAfterDeadline.formValue = 'autocaptions - ₹' + p.autocaptions_inr;
        }
        if (p.basic_usd !== undefined) {
            PRICING.US.basic.amount = p.basic_usd;
            PRICING.US.basic.label = '$' + p.basic_usd;
            PRICING.US.basic.formValue = 'basic - $' + p.basic_usd;
        }
        if (p.pro_usd !== undefined) {
            PRICING.US.pro.amount = p.pro_usd;
            PRICING.US.pro.label = '$' + p.pro_usd;
            PRICING.US.pro.formValue = 'pro - $' + p.pro_usd;
            PRICING.US.proAfterDeadline.amount = p.pro_usd;
            PRICING.US.proAfterDeadline.label = '$' + p.pro_usd;
            PRICING.US.proAfterDeadline.formValue = 'pro - $' + p.pro_usd;
        }
        if (p.autocaptions_usd !== undefined) {
            PRICING.US.autocaptions.amount = p.autocaptions_usd;
            PRICING.US.autocaptions.label = '$' + p.autocaptions_usd;
            PRICING.US.autocaptions.formValue = 'autocaptions - $' + p.autocaptions_usd;
            PRICING.US.autocaptionsAfterDeadline.amount = p.autocaptions_usd;
            PRICING.US.autocaptionsAfterDeadline.label = '$' + p.autocaptions_usd;
            PRICING.US.autocaptionsAfterDeadline.formValue = 'autocaptions - $' + p.autocaptions_usd;
        }

        // Update RZP_AMOUNTS for payment validation
        if (p.basic_inr !== undefined) {
            RZP_AMOUNTS.basic.INR = p.basic_inr * 100;
            RZP_AMOUNTS_DEADLINE.basic.INR = p.basic_inr * 100;
        }
        if (p.pro_inr !== undefined) {
            RZP_AMOUNTS.pro.INR = p.pro_inr * 100;
            RZP_AMOUNTS_DEADLINE.pro.INR = p.pro_inr * 100;
        }
        if (p.autocaptions_inr !== undefined) {
            RZP_AMOUNTS.autocaptions.INR = p.autocaptions_inr * 100;
            RZP_AMOUNTS_DEADLINE.autocaptions.INR = p.autocaptions_inr * 100;
        }
        if (p.basic_usd !== undefined) {
            RZP_AMOUNTS.basic.USD = p.basic_usd * 100;
            RZP_AMOUNTS_DEADLINE.basic.USD = p.basic_usd * 100;
        }
        if (p.pro_usd !== undefined) {
            RZP_AMOUNTS.pro.USD = p.pro_usd * 100;
            RZP_AMOUNTS_DEADLINE.pro.USD = p.pro_usd * 100;
        }
        if (p.autocaptions_usd !== undefined) {
            RZP_AMOUNTS.autocaptions.USD = p.autocaptions_usd * 100;
            RZP_AMOUNTS_DEADLINE.autocaptions.USD = p.autocaptions_usd * 100;
        }

        // Re-apply region logic and update UI
        const currentCurrency = (window.pricingRegion && window.pricingRegion.currency === 'USD') ? 'US' : 'IN';
        window.pricingRegion = applyDeadlinePricing({ ...PRICING[currentCurrency] });
        applyPricingToPage(window.pricingRegion);
        if (window._updateCountdownLabel) window._updateCountdownLabel();
        if (window._updateDeadlineDateLabel) window._updateDeadlineDateLabel();
    }, err => {
        console.warn('[Firebase] Pricing listener error:', err);
    });

    // --- 2. Settings Listener ---
    if (settingsListener) settingsListener();
    settingsListener = window.firestore.collection('config').doc('settings').onSnapshot(doc => {
        if (!doc.exists) return;
        const data = doc.data();

        if (data.deadlineDate) {
            PRICE_DEADLINE = new Date(data.deadlineDate);
        }
        if (data.bannerText !== undefined) {
            const bannerTextEl = document.querySelector('#countdown-banner .countdown-label');
            if (bannerTextEl && data.bannerText.trim() !== '') {
                bannerTextEl.innerHTML = data.bannerText;
            }
        }

        // After settings change, re-apply pricing logic (might change deadline status)
        const currentCurrency = (window.pricingRegion && window.pricingRegion.currency === 'USD') ? 'US' : 'IN';
        window.pricingRegion = applyDeadlinePricing({ ...PRICING[currentCurrency] });
        applyPricingToPage(window.pricingRegion);
        initCountdownTimer(); // Refresh the timer
    }, err => {
        console.warn('[Firebase] Settings listener error:', err);
    });
}

// Re-apply after DOM is fully ready to catch elements rendered after script runs
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let the page fully paint before re-applying
    setTimeout(() => applyPricingToPage(window.pricingRegion), 100);
    initCountdownTimer(); // Start the countdown!

    // Initialize Firestore features as soon as the SDK is ready
    const initDbFeatures = () => {
        if (!window.firestore) {
            setTimeout(initDbFeatures, 100);
            return;
        }
        startFirestoreListeners();
    };
    initDbFeatures();



    // ===== LENIS SMOOTH SCROLL =====
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // ===== NAVBAR SCROLL =====
    const navbar = document.getElementById('navbar');

    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ===== MOBILE MENU =====
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
        document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('mobile-open');
            document.body.style.overflow = '';
        });
    });

    // ===== SCROLL REVEAL ANIMATIONS =====
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, parseInt(delay));
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ===== COUNTER ANIMATION =====
    const counters = document.querySelectorAll('.stat-number[data-target]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    function animateCounter(el) {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            el.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ===== INTERACTIVE TABS =====
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update active button
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active panel
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `tab-${targetTab}`) {
                    panel.classList.add('active');
                }
            });
        });
    });

    // ===== FAQ ACCORDION =====
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all items
            faqItems.forEach(i => i.classList.remove('open'));

            // Toggle clicked item
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = navbar.offsetHeight + 20;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== PARTICLE BACKGROUND (HERO) =====
    const hero = document.querySelector('.hero-bg');
    if (hero) {
        createParticles(hero);
    }

    function createParticles(container) {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId;

        function resize() {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.1,
                hue: Math.random() > 0.5 ? 270 : 190 // purple or cyan
            };
        }

        function init() {
            resize();
            particles = Array.from({ length: 60 }, createParticle);
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.opacity})`;
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(124, 58, 237, ${0.06 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(draw);
        }

        init();
        draw();

        window.addEventListener('resize', () => {
            resize();
        });
    }

    // ===== NAVBAR ACTIVE LINK HIGHLIGHT =====
    const sections = document.querySelectorAll('section[id]');

    const activeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.querySelectorAll('a').forEach(link => {
                    link.classList.toggle('active',
                        link.getAttribute('href') === `#${id}`
                    );
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => activeObserver.observe(section));

    // ===== MOCKUP TAB SWITCHING =====
    const mockupTabs = document.querySelectorAll('.mockup-tab[data-mockup-tab]');
    const mockupPanels = document.querySelectorAll('.mockup-panel[data-panel]');

    mockupTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.mockupTab;

            // Switch active tab
            mockupTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch active panel
            mockupPanels.forEach(p => {
                p.classList.remove('active');
                if (p.dataset.panel === target) {
                    p.classList.add('active');
                }
            });
        });
    });
    // ===== CURSOR GLOW =====
    const cursorGlow = document.createElement('div');
    cursorGlow.classList.add('cursor-glow');
    document.body.appendChild(cursorGlow);

    let glowX = 0, glowY = 0, currentX = 0, currentY = 0;
    document.addEventListener('mousemove', (e) => {
        glowX = e.clientX;
        glowY = e.clientY;
    });

    function updateGlow() {
        currentX += (glowX - currentX) * 0.08;
        currentY += (glowY - currentY) * 0.08;
        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';
        requestAnimationFrame(updateGlow);
    }
    updateGlow();

    // ===== SCROLL PROGRESS BAR =====
    const scrollProgress = document.createElement('div');
    scrollProgress.classList.add('scroll-progress');
    document.body.appendChild(scrollProgress);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
        scrollProgress.style.transform = `scaleX(${scrollPercent})`;
    }, { passive: true });

    // ===== PAGE LOADER =====
    const loader = document.querySelector('.page-loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 300);
        });
    }

    // ===== SUBTLE PARALLAX ON GLOW ORBS =====
    const orbs = document.querySelectorAll('.glow-orb');
    if (orbs.length > 0) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            orbs.forEach((orb, i) => {
                const speed = (i + 1) * 0.03;
                orb.style.transform = `translateY(${scrollY * speed}px)`;
            });
        }, { passive: true });
    }
    // ===== VERSION TOGGLE (FREE / PRO / AUTOCAPTIONS) =====
    const toggleOptions = document.querySelectorAll('.toggle-option');
    const body = document.body;
    const toggleIndicator = document.getElementById('toggleIndicator');

    // Position toggle indicator dynamically based on the active option
    function positionIndicator(activeOption) {
        if (!toggleIndicator || !activeOption) return;
        const pill = activeOption.parentElement;
        const pillRect = pill.getBoundingClientRect();
        const optRect = activeOption.getBoundingClientRect();
        toggleIndicator.style.left = (optRect.left - pillRect.left) + 'px';
        toggleIndicator.style.width = optRect.width + 'px';
    }

    // Position on page load
    const initialActive = document.querySelector('.toggle-option.active');
    if (initialActive) {
        setTimeout(() => positionIndicator(initialActive), 100);
        window.addEventListener('resize', () => positionIndicator(document.querySelector('.toggle-option.active')));
    }

    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            const version = option.dataset.version;
            const currentVersion = body.getAttribute('data-version');

            // Don't switch if already on this version
            if (version === currentVersion) return;

            // Update toggle UI
            toggleOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');

            // Slide indicator to the clicked option
            positionIndicator(option);

            // Start transition animation (3D flip out)
            body.classList.add('version-transitioning');

            // Wait for flip-out to complete
            setTimeout(() => {
                // Switch version
                body.setAttribute('data-version', version);

                // Swap classes for entrance animation (3D flip in)
                body.classList.remove('version-transitioning');
                body.classList.add('version-entering');

                // Re-trigger reveal animations for newly visible content

                const classNameMap = {
                    'free': 'free-only',
                    'pro': 'pro-only',
                    'autocaptions': 'autocaptions-only',
                    'projectmanager': 'projectmanager-only'
                };
                const cName = classNameMap[version];
                const newVisibleElements = document.querySelectorAll(
                    `.${cName} .reveal, .${cName}.reveal`
                );
                newVisibleElements.forEach(el => {
                    el.classList.remove('active');
                    void el.offsetWidth; // Force reflow
                    el.classList.add('active');
                });

                // Reset deep-dive tabs - activate the first tab for current version
                const activeTabsNav = document.querySelector(`.tabs-nav.${version}-only`);
                if (activeTabsNav) {
                    const firstBtn = activeTabsNav.querySelector('.tab-btn');
                    if (firstBtn) {
                        // Clear all tab buttons active state
                        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                        firstBtn.classList.add('active');

                        // Clear all panels, activate the first one
                        const targetTab = firstBtn.dataset.tab;
                        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                        const targetPanel = document.getElementById(`tab-${targetTab}`);
                        if (targetPanel) targetPanel.classList.add('active');
                    }
                }

                // Reset mockup tabs - activate the first tab for current version
                const activeMockupTabsNav = document.querySelector(`.mockup-tabs.${version}-only`);
                if (activeMockupTabsNav) {
                    const firstMockupBtn = activeMockupTabsNav.querySelector('.mockup-tab');
                    if (firstMockupBtn) {
                        // Clear all mockup tab buttons active state
                        document.querySelectorAll('.mockup-tab').forEach(b => b.classList.remove('active'));
                        firstMockupBtn.classList.add('active');

                        // Clear all mockup panels, activate the first one correctly
                        const targetMockup = firstMockupBtn.dataset.mockupTab;
                        document.querySelectorAll('.mockup-panel').forEach(p => p.classList.remove('active'));

                        const targetPanels = document.querySelectorAll(`.mockup-panel[data-panel="${targetMockup}"]`);
                        targetPanels.forEach(p => {
                            if (p.classList.contains('pro-only') && version !== 'pro') return;
                            if (p.classList.contains('autocaptions-only') && version !== 'autocaptions') return;
                            if (p.classList.contains('free-only') && version !== 'free') return;
                            if (p.classList.contains('projectmanager-only') && version !== 'projectmanager') return;
                            p.classList.add('active');
                        });
                    }
                }

                // Re-animate stat counters
                const visibleCounters = document.querySelectorAll(
                    `.${cName} .stat-number[data-target]`
                );
                visibleCounters.forEach(counter => {
                    counter.textContent = '0';
                    animateCounter(counter);
                });

                // End transition animation
                setTimeout(() => {
                    body.classList.remove('version-entering');
                }, 600);
            }, 500);
        });
    });

    const GUMROAD_LINKS = {
        basic: 'https://harshedits55.gumroad.com/l/Easyworkflow',
        pro: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n',
        autocaptions: 'https://harshedits55.gumroad.com/l/Autocaptionpro',
        projectmanager: 'https://harshedits55.gumroad.com/l/ProjectManager'
    };

    // Initialized from Global Scope above
    let cashfree;
    if (typeof Cashfree !== 'undefined') {
        cashfree = Cashfree({ mode: CF_MODE });
    }
    // Security nonce generator (crypto-grade randomness)
    function generateNonce(len = 32) {
        const arr = new Uint8Array(len);
        crypto.getRandomValues(arr);
        return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    }

    // Session integrity: track payment session to prevent replay
    const paymentSessions = new Set();

    const proButtons = document.querySelectorAll('#btn-pro');

    // ───────────────────────────── CHECKOUT MODAL ─────────────────────────────
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'checkout-overlay';
    modalOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:9999;display:none;justify-content:center;align-items:center;opacity:0;transition:opacity 0.3s ease;';

    const modalBox = document.createElement('div');
    modalBox.id = 'checkout-box';
    modalBox.style.cssText = 'background:#14141a;border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:0;max-width:880px;width:95%;position:relative;transform:translateY(20px);transition:all 0.4s;box-shadow:0 30px 120px rgba(0,0,0,0.8);overflow:hidden;max-height:calc(100vh - 40px);display:flex;flex-direction:column;';

    modalBox.innerHTML = `
        <div id="modal-main-split" style="display:flex;height:100%;flex-direction:row;overflow:hidden;min-height:0;">
            <!-- Left Sidebar (Order Summary) -->
            <div id="modal-sidebar" style="width:340px;background:linear-gradient(165deg, #1e1e2d, #121218);border-right:1px solid rgba(255,255,255,0.05);padding:40px;display:flex;flex-direction:column;flex-shrink:0;">
                <div style="flex:1;">
                    <div style="display:inline-flex;align-items:center;background:rgba(124,58,237,0.2);color:#a78bfa;padding:5px 14px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;">SECURE CHECKOUT</div>
                    <h2 id="checkout-tier-name" style="font-family:var(--font-heading);color:white;margin:0;font-size:26px;font-weight:800;line-height:1.2;">Easy Workflow Pro</h2>
                    <p style="color:rgba(255,255,255,0.4);font-size:14px;margin-top:10px;line-height:1.5;">Get instant access to the ultimate After Effects toolkit.</p>
                    
                    <div style="margin-top:30px;display:flex;flex-direction:column;gap:15px;">
                        <div style="display:flex;align-items:center;gap:12px;color:rgba(255,255,255,0.7);font-size:13px;">
                            <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                            Lifetime Updates
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;color:rgba(255,255,255,0.7);font-size:13px;">
                            <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                            Priority Discord Support
                        </div>
                    </div>
                </div>

                <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:30px;">
                    <div id="checkout-original-price" style="display:none;color:rgba(255,255,255,0.3);font-size:16px;text-decoration:line-through;margin-bottom:5px;">1500</div>
                    <div style="display:flex;align-items:baseline;gap:10px;">
                        <span id="checkout-price-display" style="color:white;font-size:42px;font-weight:800;font-family:var(--font-heading);">1500</span>
                        <span style="color:rgba(255,255,255,0.3);font-size:15px;font-weight:500;">/ License</span>
                    </div>
                </div>
            </div>

            <!-- Right Content (Form Area) -->
            <div style="flex:1;display:flex;flex-direction:column;background:#14141a;position:relative;">
                <button id="close-modal" style="position:absolute;top:24px;right:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);font-size:22px;cursor:pointer;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;z-index:10;">&times;</button>

                <form id="checkout-form" style="display:flex;flex-direction:column;height:100%;">
                    <div style="padding:40px 40px 20px;flex:1;overflow-y:auto;" id="modal-scroll-body">
                        <h2 id="modal-title" style="color:white;margin:0 0 10px;font-size:20px;font-weight:700;">Complete Checkout</h2>
                        <span id="modal-product-badge" style="background:rgba(124,58,237,0.15);color:#a78bfa;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;margin-bottom:24px;display:inline-block;">PRO</span>
                        <div id="modal-windows-warning" class="os-warning-box" style="display:none; margin-bottom:20px; width:100%; border-radius:12px;">
                            <div class="os-warning-icon">⚠️</div>
                            <span style="font-size:12px;"><b>Windows Only</b> • Do not buy for Mac (No Refunds)</span>
                        </div>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
                            <div style="grid-column: span 2;">
                                <label style="display:block;color:rgba(255,255,255,0.5);font-size:11px;margin-bottom:8px;font-weight:700;letter-spacing:0.5px;">FULL NAME *</label>
                                <input type="text" id="rzp-name" required placeholder="John Doe" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:12px;color:white;font-size:14px;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor='#7c3aed'">
                            </div>
                            <div>
                                <label style="display:block;color:rgba(255,255,255,0.5);font-size:11px;margin-bottom:8px;font-weight:700;letter-spacing:0.5px;">EMAIL ADDRESS *</label>
                                <input type="email" id="rzp-email" required placeholder="john@example.com" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:12px;color:white;font-size:14px;outline:none;" onfocus="this.style.borderColor='#7c3aed'">
                            </div>
                            <div>
                                <label style="display:block;color:rgba(255,255,255,0.5);font-size:11px;margin-bottom:8px;font-weight:700;letter-spacing:0.5px;">WHATSAPP NUMBER *</label>
                                <div style="display:flex;gap:8px;">
                                    <div id="country-selector-container" style="position:relative;width:110px;">
                                        <div id="country-selected" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:14px 10px;border-radius:12px;color:white;font-size:13px;outline:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="toggleCountryDropdown()">
                                            <span id="selected-flag-text">🇮🇳 +91</span>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="transition:transform 0.2s;" id="country-arrow"><path d="M6 9l6 6 6-6"/></svg>
                                        </div>
                                        <div id="country-dropdown" style="display:none;position:absolute;top:100%;left:0;width:280px;background:#1a1a24;border:1px solid rgba(255,255,255,0.1);border-radius:12px;margin-top:8px;z-index:100;box-shadow:0 10px 40px rgba(0,0,0,0.5);overflow:hidden;">
                                            <div style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);">
                                                <input type="text" id="country-search" placeholder="Search country..." style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:8px 12px;border-radius:8px;color:white;font-size:12px;outline:none;" onkeyup="filterCountries()" onclick="event.stopPropagation()">
                                            </div>
                                            <div id="country-list" style="max-height:250px;overflow-y:auto;padding:5px;">
                                                <!-- Countries will be injected here -->
                                            </div>
                                        </div>
                                        <input type="hidden" id="rzp-country-code" value="+91">
                                    </div>
                                    <input type="tel" id="rzp-phone" required placeholder="9876543210" style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:12px;color:white;font-size:14px;outline:none;" onfocus="this.style.borderColor='#7c3aed'">
                                </div>
                            </div>
                        </div>

                        <div style="margin-bottom:24px;">
                            <label style="display:block;color:rgba(255,255,255,0.5);font-size:11px;margin-bottom:8px;font-weight:700;letter-spacing:0.5px;">PROMO CODE</label>
                            <div style="display:flex;gap:10px;">
                                <input type="text" id="rzp-promo-code" placeholder="ENTER CODE" style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:12px;color:white;font-size:13px;outline:none;text-transform:uppercase;">
                                <button type="button" id="btn-apply-promo" style="background:rgba(255,255,255,0.05);color:#a78bfa;border:1px solid rgba(167,139,250,0.3);padding:0 24px;border-radius:12px;font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(167,139,250,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">APPLY</button>
                            </div>
                            <div id="promo-message" style="font-size:11px;margin-top:8px;display:none;"></div>
                        </div>

                        <div id="gateway-selection-row" style="margin-bottom:10px;">
                            <label style="display:block;color:rgba(255,255,255,0.5);font-size:11px;margin-bottom:12px;font-weight:700;letter-spacing:0.5px;">CHOOSE GATEWAY</label>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                                <label id="label-cf" style="background:rgba(34,197,94,0.08);border:1px solid #22c55e;padding:16px;border-radius:14px;cursor:pointer;text-align:center;transition:all 0.2s;display:flex;flex-direction:column;gap:4px;">
                                    <input type="radio" name="gateway" value="cashfree" checked style="display:none;">
                                    <span style="color:white;font-size:14px;font-weight:700;">CASHFREE</span>
                                    <span style="color:rgba(255,255,255,0.3);font-size:9px;">UPI & CARDS</span>
                                </label>
                                <label id="label-rzp" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.1);padding:16px;border-radius:14px;cursor:pointer;text-align:center;transition:all 0.2s;display:flex;flex-direction:column;gap:4px;">
                                    <input type="radio" name="gateway" value="razorpay" style="display:none;">
                                    <span style="color:white;font-size:14px;font-weight:700;">RAZORPAY</span>
                                    <span style="color:rgba(255,255,255,0.3);font-size:9px;">ALL METHODS</span>
                                </label>
                            </div>
                        </div>

                        <input type="hidden" id="rzp-tier" value="pro">
                        <input type="hidden" id="rzp-nonce" value="">
                        <input type="hidden" id="rzp-session-ts" value="">
                    </div>

                    <!-- Sticky Footer Area -->
                    <div style="padding:24px 40px;background:rgba(20,20,26,0.98);border-top:1px solid rgba(255,255,255,0.05);flex-shrink:0;">
                        <div id="security-badge-area" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:18px;color:#22c55e;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:rgba(34,197,94,0.05);padding:12px;border-radius:12px;border:1px solid rgba(34,197,94,0.1);">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <span id="security-badge-text">Encrypted with 256-bit SSL Security</span>
                        </div>
                        <button type="submit" id="rzp-pay-btn" style="width:100%;padding:18px;background:linear-gradient(135deg, #7c3aed, #6d28d9);color:white;border:none;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 12px 40px rgba(124,58,237,0.3);transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <span id="rzp-btn-text">PAY NOW & GET ACCESS</span>
                            <span id="rzp-btn-loader" style="display:none;align-items:center;justify-content:center;gap:12px;">
                                <svg width="22" height="22" viewBox="0 0 24 24" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/></svg>
                                PROCESSING ORDER...
                            </span>
                        </button>
                        ${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `
                        <button type="button" id="simulate-success-btn" style="width:100%;margin-top:12px;padding:12px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);border:1px dashed rgba(255,255,255,0.1);border-radius:12px;font-weight:600;font-size:12px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.color='white';this.style.borderColor='rgba(255,255,255,0.3)'" onmouseout="this.style.color='rgba(255,255,255,0.4)';this.style.borderColor='rgba(255,255,255,0.1)'">
                            🛠️ SIMULATE SUCCESS (LOCAL ONLY)
                        </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        </div>

        <style>
            @media (max-width: 800px) {
                #checkout-box { max-width: 480px !important; margin: 20px !important; }
                #modal-main-split { flex-direction: column !important; overflow-y: auto !important; }
                #modal-sidebar { width: 100% !important; padding: 30px !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
                #modal-scroll-body { overflow-y: visible !important; }
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            #modal-scroll-body::-webkit-scrollbar { width: 6px; }
            #modal-scroll-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            #country-list::-webkit-scrollbar { width: 4px; }
            #country-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            .country-item { padding: 10px 12px; cursor: pointer; color: white; font-size: 13px; display: flex; align-items: center; gap: 10px; transition: background 0.2s; }
            .country-item:hover { background: rgba(255,255,255,0.05); }
        </style>
    `;

    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    // ───────────────────────────── COUNTRY SELECTOR LOGIC ─────────────────────────────
    const COUNTRIES = [
        { name: 'India', code: '+91', flag: '🇮🇳' },
        { name: 'United States', code: '+1', flag: '🇺🇸' },
        { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
        { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
        { name: 'Canada', code: '+1', flag: '🇨🇦' },
        { name: 'Australia', code: '+61', flag: '🇦🇺' },
        { name: 'Singapore', code: '+65', flag: '🇸🇬' },
        { name: 'Germany', code: '+49', flag: '🇩🇪' },
        { name: 'France', code: '+33', flag: '🇫🇷' },
        { name: 'Japan', code: '+81', flag: '🇯🇵' },
        { name: 'Russia', code: '+7', flag: '🇷🇺' },
        { name: 'China', code: '+86', flag: '🇨🇳' },
        { name: 'Brazil', code: '+55', flag: '🇧🇷' },
        { name: 'South Africa', code: '+27', flag: '🇿🇦' },
        { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
        { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
        { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
        { name: 'Nepal', code: '+977', flag: '🇳🇵' },
        { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
        { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
        { name: 'Qatar', code: '+974', flag: '🇶🇦' },
        { name: 'Oman', code: '+968', flag: '🇴🇲' },
        { name: 'Bahrain', code: '+973', flag: '🇧🇭' },
        { name: 'Italy', code: '+39', flag: '🇮🇹' },
        { name: 'Spain', code: '+34', flag: '🇪🇸' },
        { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
        { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
        { name: 'Sweden', code: '+46', flag: '🇸🇪' },
        { name: 'Norway', code: '+47', flag: '🇳🇴' },
        { name: 'Denmark', code: '+45', flag: '🇩🇰' },
        { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
        { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
        { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
        { name: 'Thailand', code: '+66', flag: '🇹🇭' },
        { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
        { name: 'Philippines', code: '+63', flag: '🇵🇭' },
        { name: 'South Korea', code: '+82', flag: '🇰🇷' },
        { name: 'Turkey', code: '+90', flag: '🇹🇷' }
    ];

    window.toggleCountryDropdown = function () {
        const dropdown = document.getElementById('country-dropdown');
        const arrow = document.getElementById('country-arrow');
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        arrow.style.transform = isVisible ? 'rotate(0)' : 'rotate(180deg)';
        if (!isVisible) document.getElementById('country-search').focus();
    };

    window.selectCountry = function (code, flag) {
        document.getElementById('rzp-country-code').value = code;
        document.getElementById('selected-flag-text').textContent = `${flag} ${code}`;
        window.toggleCountryDropdown();
    };

    window.filterCountries = function () {
        const term = document.getElementById('country-search').value.toLowerCase();
        const items = document.querySelectorAll('.country-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(term) ? 'flex' : 'none';
        });
    };

    function initCountryList() {
        const list = document.getElementById('country-list');
        list.innerHTML = COUNTRIES.map(c => `
            <div class="country-item" onclick="selectCountry('${c.code}', '${c.flag}')">
                <span style="font-size:18px;">${c.flag}</span>
                <span style="flex:1;">${c.name}</span>
                <span style="color:rgba(255,255,255,0.4);font-size:12px;">${c.code}</span>
            </div>
        `).join('');
    }

    // Call init after everything is appended or in openModal
    setTimeout(initCountryList, 100);

    // Close dropdown on outside click
    window.addEventListener('click', (e) => {
        const container = document.getElementById('country-selector-container');
        if (container && !container.contains(e.target)) {
            const dropdown = document.getElementById('country-dropdown');
            const arrow = document.getElementById('country-arrow');
            if (dropdown) dropdown.style.display = 'none';
            if (arrow) arrow.style.transform = 'rotate(0)';
        }
    });

    // ───────────────────────────── SUCCESS SCREEN ─────────────────────────────
    const successOverlay = document.createElement('div');
    successOverlay.id = 'payment-success-overlay';
    successOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);backdrop-filter:blur(15px);z-index:10002;display:none;justify-content:center;align-items:center;opacity:0;transition:opacity 0.4s ease;';

    const successBox = document.createElement('div');
    successBox.id = 'payment-success-box';
    successBox.style.cssText = 'background:#14141a;border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:0;max-width:480px;width:92%;position:relative;transform:translateY(30px) scale(0.95);transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);box-shadow:0 30px 120px rgba(0,0,0,0.8);overflow:hidden;';

    successBox.innerHTML = `
        <div style="background:linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.05));padding:32px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;position:relative;">
            <button id="close-success" style="position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.06);border:none;color:white;cursor:pointer;width:32px;height:32px;border-radius:50%;">&times;</button>
            <div style="width:70px;height:70px;margin:0 auto 20px;">
                <svg viewBox="0 0 70 70" style="width:100%;height:100%;">
                    <circle cx="35" cy="35" r="32" fill="none" stroke="#22c55e" stroke-width="3" stroke-dasharray="201" id="success-circle" stroke-dashoffset="201" style="transition:stroke-dashoffset 0.6s ease;"></circle>
                    <polyline points="22,36 32,46 49,26" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" id="success-tick" stroke-dasharray="40" stroke-dashoffset="40" style="transition:stroke-dashoffset 0.4s ease 0.6s;"></polyline>
                </svg>
            </div>
            <h2 style="color:white;margin:0;font-size:24px;">Payment Successful</h2>
        </div>
        <div style="padding:32px;text-align:center;">
            <!-- License Key Section -->
            <div id="license-key-section" style="display:none;">
                <div style="margin-bottom:20px;">
                    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(124,58,237,0.15);color:#a78bfa;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        YOUR LICENSE KEY
                    </div>
                    <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:8px 0 0;">Save this key — you'll need it to activate your extension</p>
                </div>
                <div id="license-key-card" style="background:linear-gradient(145deg, #1a1a2e, #16162a);border:2px solid rgba(124,58,237,0.3);border-radius:16px;padding:24px 20px;position:relative;overflow:hidden;">
                    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4);"></div>
                    <div id="license-key-display" style="font-family:'Courier New',monospace;font-size:22px;font-weight:800;color:white;letter-spacing:3px;padding:12px 0;user-select:all;word-break:break-all;" data-nosnippet>
                        ————-————-————-————
                    </div>
                    <button id="copy-license-btn" style="margin-top:12px;padding:10px 28px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);color:#a78bfa;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;" onmouseover="this.style.background='rgba(124,58,237,0.35)'" onmouseout="this.style.background='rgba(124,58,237,0.2)'">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        COPY LICENSE KEY
                    </button>
                </div>
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;color:rgba(255,255,255,0.3);font-size:10px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    This key is also sent to your email for safekeeping
                </div>
            </div>
            <!-- Loading State for License Generation -->
            <div id="license-loading-section" style="margin-bottom:20px;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke="#7c3aed" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/></svg>
                    <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">Generating your secure license key...</p>
                </div>
            </div>
            <!-- License Error State -->
            <div id="license-error-section" style="display:none;margin-bottom:20px;">
                <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px;color:#ef4444;font-size:13px;">
                    <p style="margin:0 0 8px;font-weight:700;">⚠️ License generation pending</p>
                    <p id="license-error-msg" style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;">Your license key will be sent to your email within a few hours. Contact support if not received.</p>
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.03);padding:20px;border-radius:16px;display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.4);"><span>Payment ID:</span><span id="success-payment-id" style="color:white;font-family:monospace;">—</span></div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.4);"><span>Amount Paid:</span><span id="success-amount" style="color:#22c55e;font-weight:700;">—</span></div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.4);"><span>Product:</span><span id="success-product" style="color:white;">—</span></div>
                <div id="success-email-row" style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.4);"><span>Email:</span><span id="success-email" style="color:white;">—</span></div>
            </div>
            <button id="success-done-btn" style="width:100%;margin-top:28px;padding:16px;background:#22c55e;color:white;border:none;border-radius:14px;font-weight:700;cursor:pointer;">DONE</button>
        </div>
        <span id="success-product-badge" style="display:none;"></span>
    `;

    successOverlay.appendChild(successBox);
    document.body.appendChild(successOverlay);

    // ───────────────────────────── MODAL OPEN / CLOSE ─────────────────────────────
    let currentCheckoutTier = 'pro';
    let currentPromoMultiplier = 1; // 1 = 100% price (0 discount)
    let currentPromoCode = '';

    function openModal(e) {
        if (e) e.preventDefault();

        // Determine tier
        let tier = 'pro'; // Default

        if (e && e.currentTarget && e.currentTarget.getAttribute('data-tier')) {
            tier = e.currentTarget.getAttribute('data-tier');
        } else {
            const v = document.body.getAttribute('data-version');
            const versionMap = {
                'free': 'basic',
                'pro': 'pro',
                'autocaptions': 'autocaptions',
                'projectmanager': 'projectmanager'
            };
            tier = versionMap[v] || 'pro';
        }
        currentCheckoutTier = tier;

        const region = window.pricingRegion || PRICING.IN;
        const tierConfig = (tier === 'basic') ? region.basic :
            (tier === 'autocaptions' ? region.autocaptions :
                (tier === 'projectmanager' ? region.projectmanager : region.pro));

        // Reset promo state
        currentPromoMultiplier = 1;
        currentPromoCode = '';
        document.getElementById('rzp-promo-code').value = '';
        document.getElementById('promo-message').style.display = 'none';
        document.getElementById('checkout-original-price').style.display = 'none';

        // Update modal header
        const titleMap = { basic: 'Checkout', pro: 'Checkout', autocaptions: 'Checkout', projectmanager: 'Checkout' };
        const badgeMap = {
            basic: 'Easy Workflow Basic',
            pro: 'Easy Workflow Pro',
            autocaptions: 'Auto Captions Pro',
            projectmanager: 'Project Manager Pro'
        };
        document.getElementById('modal-title').textContent = titleMap[tier];
        document.getElementById('modal-product-badge').textContent = badgeMap[tier];
        document.getElementById('checkout-tier-name').textContent = badgeMap[tier];
        document.getElementById('checkout-price-display').textContent = tierConfig.label;

        // Show Windows Only warning for Auto Captions
        const warningEl = document.getElementById('modal-windows-warning');
        if (warningEl) {
            warningEl.style.display = (tier === 'autocaptions') ? 'block' : 'none';
        }

        // Update pay button text
        document.getElementById('rzp-btn-text').textContent = `Pay ${tierConfig.label} — Proceed to Payment`;

        // Generate security nonce and session timestamp
        const nonce = generateNonce();
        const sessionTs = Date.now().toString();
        document.getElementById('rzp-nonce').value = nonce;
        document.getElementById('rzp-session-ts').value = sessionTs;
        document.getElementById('rzp-tier').value = tier;

        // Handle International Gateway Visibility
        const isUSD = (region.currency === 'USD');
        const gatewayRow = document.getElementById('gateway-selection-row');
        const rzpRadio = document.querySelector('input[name="gateway"][value="razorpay"]');
        const cfRadio = document.querySelector('input[name="gateway"][value="cashfree"]');
        const labelCF = document.getElementById('label-cf');
        const labelRZP = document.getElementById('label-rzp');
        const securityText = document.getElementById('security-badge-text');

        if (isUSD) {
            if (gatewayRow) gatewayRow.style.display = 'none';
            if (rzpRadio) rzpRadio.checked = true;
            if (securityText) securityText.textContent = 'Secured by Razorpay • Instant Settlements';
            if (labelRZP) { labelRZP.style.background = 'rgba(124,58,237,0.1)'; labelRZP.style.borderColor = '#7c3aed'; }
            if (labelCF) { labelCF.style.background = 'rgba(255,255,255,0.03)'; labelCF.style.borderColor = 'rgba(255,255,255,0.1)'; }
        } else {
            if (gatewayRow) gatewayRow.style.display = 'block';
            if (cfRadio) cfRadio.checked = true;
            if (securityText) securityText.textContent = 'Secured by Cashfree • 256-bit SSL Encryption';
            if (labelCF) { labelCF.style.background = 'rgba(34,197,94,0.1)'; labelCF.style.borderColor = '#22c55e'; }
            if (labelRZP) { labelRZP.style.background = 'rgba(255,255,255,0.03)'; labelRZP.style.borderColor = 'rgba(255,255,255,0.1)'; }
        }

        // Show modal
        modalOverlay.style.display = 'flex';
        void modalOverlay.offsetWidth;
        modalOverlay.style.opacity = '1';
        modalBox.style.transform = 'translateY(0)';
        document.body.style.overflow = 'hidden';

        // Initialize country list
        if (typeof initCountryList === 'function') initCountryList();
    }

    function closeModal() {
        modalOverlay.style.opacity = '0';
        modalBox.style.transform = 'translateY(20px)';
        setTimeout(() => {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    function showSuccessScreen(paymentId, amount, productName, email) {
        // Update success details
        document.getElementById('success-payment-id').textContent = paymentId || '—';
        document.getElementById('success-amount').textContent = amount || '—';
        document.getElementById('success-product').textContent = productName || '—';
        document.getElementById('success-product-badge').textContent = productName || 'Easy Workflow Pro';
        document.getElementById('success-email').textContent = email || '—';

        // Reset license UI states
        document.getElementById('license-key-section').style.display = 'none';
        document.getElementById('license-loading-section').style.display = 'block';
        document.getElementById('license-error-section').style.display = 'none';

        // Trigger Confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#7c3aed', '#a78bfa', '#22c55e']
            });
        }

        // Show overlay
        successOverlay.style.display = 'flex';
        void successOverlay.offsetWidth;
        successOverlay.style.opacity = '1';
        successBox.style.transform = 'translateY(0) scale(1)';
        document.body.style.overflow = 'hidden';

        // Trigger checkmark animation
        setTimeout(() => {
            document.getElementById('success-circle').style.strokeDashoffset = '0';
            document.getElementById('success-tick').style.strokeDashoffset = '0';
        }, 100);
    }

    // ── License Key Display Helper ──
    function displayLicenseKey(licenseKey) {
        document.getElementById('license-loading-section').style.display = 'none';
        document.getElementById('license-error-section').style.display = 'none';
        document.getElementById('license-key-section').style.display = 'block';
        document.getElementById('license-key-display').textContent = licenseKey;

        // Second confetti burst for the license reveal
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 50,
                origin: { y: 0.5 },
                colors: ['#7c3aed', '#3b82f6', '#06b6d4']
            });
        }
    }

    function displayLicenseError(errorMsg) {
        document.getElementById('license-loading-section').style.display = 'none';
        document.getElementById('license-key-section').style.display = 'none';
        document.getElementById('license-error-section').style.display = 'block';
        if (errorMsg) {
            document.getElementById('license-error-msg').textContent = errorMsg;
        }
    }

    function closeSuccessScreen() {
        successOverlay.style.opacity = '0';
        successBox.style.transform = 'translateY(30px) scale(0.95)';
        setTimeout(() => {
            successOverlay.style.display = 'none';
            document.body.style.overflow = '';
            // Reset animation for next time
            document.getElementById('success-circle').style.strokeDashoffset = '201';
            document.getElementById('success-tick').style.strokeDashoffset = '40';
            // Reset license states
            document.getElementById('license-key-section').style.display = 'none';
            document.getElementById('license-loading-section').style.display = 'block';
            document.getElementById('license-error-section').style.display = 'none';
        }, 400);
    }

    // ═══════════════════════════════════════════════════════════════════
    // LICENSE RECOVERY
    // ═══════════════════════════════════════════════════════════════════
    window.openRecoveryModal = function () {
        const modal = document.getElementById('recoveryModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeRecoveryModal = function () {
        const modal = document.getElementById('recoveryModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
        document.getElementById('recoveryStatus').style.display = 'none';
    };

    window.handleRecovery = async function (e) {
        e.preventDefault();
        const email = document.getElementById('recoveryEmail').value.trim();
        const btn = document.getElementById('recoverySubmitBtn');
        const status = document.getElementById('recoveryStatus');

        if (!email) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        status.style.display = 'block';
        status.style.color = 'var(--text-secondary)';
        status.textContent = 'Searching for your license...';

        try {
            const response = await fetch('/api/recover-license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                status.style.color = 'var(--accent-green)';
                status.innerHTML = `<strong>Success!</strong><br>License details sent to <strong>${email}</strong>.<br>Please check your inbox (and spam folder).`;
                btn.innerHTML = 'Email Sent!';
                // Reset form after a delay
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Send My License';
                }, 5000);
            } else {
                throw new Error(data.error || 'Could not find a license for this email.');
            }
        } catch (error) {
            status.style.color = 'var(--red)';
            status.textContent = error.message;
            btn.disabled = false;
            btn.innerHTML = 'Try Again';
        }
    };


    // ───────────────────────── BUTTON LISTENERS ─────────────────────────
    proButtons.forEach(btn => btn.addEventListener('click', openModal));
    const autoCaptionsBtns = document.querySelectorAll('#btn-autocaptions, #hero-autocaptions-cta');
    autoCaptionsBtns.forEach(btn => btn.addEventListener('click', openModal));

    const pmBtns = document.querySelectorAll('#btn-projectmanager, #final-pm-cta');
    pmBtns.forEach(btn => btn.addEventListener('click', openModal));
    const navProBtns = document.querySelectorAll('a[href="#pricing"].btn-primary.pro-only');
    navProBtns.forEach(btn => btn.addEventListener('click', openModal));
    const basicBtns = document.querySelectorAll('.btn-pay');
    basicBtns.forEach(btn => btn.addEventListener('click', openModal));
    // Also attach to hero Pro CTA and any data-tier="pro" buttons
    const heroProCta = document.getElementById('hero-pro-cta');
    if (heroProCta) heroProCta.addEventListener('click', openModal);
    document.querySelectorAll('[data-tier="pro"]').forEach(btn => btn.addEventListener('click', openModal));
    document.querySelectorAll('[data-tier="autocaptions"]').forEach(btn => btn.addEventListener('click', openModal));

    // Promo Logic
    document.getElementById('btn-apply-promo').addEventListener('click', async () => {
        const input = document.getElementById('rzp-promo-code');
        const code = input.value.trim().toUpperCase();
        const msgEl = document.getElementById('promo-message');
        const btn = document.getElementById('btn-apply-promo');

        if (!code) return;

        btn.textContent = '...';
        btn.disabled = true;

        try {
            if (!window.firestore) throw new Error("Database not connected");
            const doc = await window.firestore.collection('coupons').doc(code).get();

            if (doc.exists && doc.data().active !== false) {
                const discount = parseInt(doc.data().discountPercent);
                currentPromoCode = code;
                currentPromoMultiplier = (100 - discount) / 100;

                const region = window.pricingRegion || PRICING.IN;
                const tierConfig = (currentCheckoutTier === 'basic') ? region.basic : (currentCheckoutTier === 'autocaptions' ? region.autocaptions : region.pro);

                // Update UI Prices
                document.getElementById('checkout-original-price').style.display = 'block';
                document.getElementById('checkout-original-price').textContent = tierConfig.label;

                // Calculate discounted price
                const originalAmt = tierConfig.amount;
                const discountedAmt = Math.round(originalAmt * currentPromoMultiplier);
                const discountLabel = region.symbol + discountedAmt;

                document.getElementById('checkout-price-display').textContent = discountLabel;
                document.getElementById('rzp-btn-text').textContent = `Pay ${discountLabel} — Proceed to Payment`;

                msgEl.style.color = '#22c55e';
                msgEl.textContent = `✓ ${discount}% Discount applied!`;
                msgEl.style.display = 'block';
            } else {
                throw new Error("Invalid or expired code");
            }
        } catch (err) {
            currentPromoMultiplier = 1;
            currentPromoCode = '';

            const region = window.pricingRegion || PRICING.IN;
            const tierConfig = (currentCheckoutTier === 'basic') ? region.basic :
                (currentCheckoutTier === 'autocaptions' ? region.autocaptions :
                    (currentCheckoutTier === 'projectmanager' ? region.projectmanager : region.pro));
            document.getElementById('checkout-original-price').style.display = 'none';
            document.getElementById('checkout-price-display').textContent = tierConfig.label;
            document.getElementById('rzp-btn-text').textContent = `Pay ${tierConfig.label} — Proceed to Payment`;

            msgEl.style.color = '#ef4444';
            msgEl.textContent = 'Invalid promo code';
            msgEl.style.display = 'block';
        }

        btn.textContent = 'Apply';
        btn.disabled = false;
    });

    // Close listeners
    document.getElementById('close-modal').addEventListener('click', closeModal);
    
    // 🛠️ Simulation Mode for Local Testing
    document.getElementById('simulate-success-btn')?.addEventListener('click', () => {
        const nameVal = document.getElementById('rzp-name').value.trim();
        const emailVal = document.getElementById('rzp-email').value.trim();
        const tierVal = document.getElementById('rzp-tier').value;
        const amountVal = document.getElementById('checkout-price-display')?.textContent || '—';

        if (!nameVal || !emailVal) {
            showToast('Please enter your Name and Email to simulate.', 'error');
            return;
        }

        const simId = 'pay_test_simulation_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        console.log('[Simulation] Triggering fake success for:', simId);
        
        const simData = {
            name: nameVal,
            email: emailVal,
            phone: (document.getElementById('rzp-country-code')?.value || '+91') + (document.getElementById('rzp-phone')?.value || '0000000000'),
            tier: tierVal,
            amount: amountVal
        };

        window.handlePaymentSuccess(simId, 'razorpay', simData);
    });

    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    document.getElementById('close-success').addEventListener('click', closeSuccessScreen);
    document.getElementById('success-done-btn').addEventListener('click', closeSuccessScreen);

    // Gateway UI Toggle Logic
    const gatewayRadios = document.querySelectorAll('input[type="radio"][name="gateway"]');
    gatewayRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const isCF = radio.value === 'cashfree';
            const labelCF = document.getElementById('label-cf');
            const labelRZP = document.getElementById('label-rzp');
            const badgeText = document.getElementById('security-badge-text');

            if (isCF) {
                labelCF.style.background = 'rgba(34,197,94,0.1)';
                labelCF.style.borderColor = '#22c55e';
                labelRZP.style.background = 'rgba(255,255,255,0.03)';
                labelRZP.style.borderColor = 'rgba(255,255,255,0.1)';
                badgeText.textContent = 'Secured by Cashfree • 256-bit SSL Encryption';
            } else {
                labelRZP.style.background = 'rgba(124,58,237,0.1)';
                labelRZP.style.borderColor = '#7c3aed';
                labelCF.style.background = 'rgba(255,255,255,0.03)';
                labelCF.style.borderColor = 'rgba(255,255,255,0.1)';
                badgeText.textContent = 'Secured by Razorpay • Instant Settlements';
            }
        });
    });

    // Copy Payment ID Function
    document.getElementById('success-payment-id').style.cursor = 'pointer';
    document.getElementById('success-payment-id').title = 'Click to copy';
    document.getElementById('success-payment-id').addEventListener('click', function () {
        const id = this.textContent;
        if (id !== '—') {
            navigator.clipboard.writeText(id).then(() => {
                showToast('Payment ID copied to clipboard!', 'success');
            });
        }
    });
    // NOTE: No click-outside-to-close on success screen — only Done/X can close it

    // Copy License Key Function
    document.getElementById('copy-license-btn').addEventListener('click', function () {
        const keyDisplay = document.getElementById('license-key-display');
        const key = keyDisplay.textContent.trim();
        if (key && !key.includes('————')) {
            navigator.clipboard.writeText(key).then(() => {
                const originalHTML = this.innerHTML;
                this.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> COPIED!';
                this.style.borderColor = '#22c55e';
                this.style.color = '#22c55e';
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.style.borderColor = 'rgba(124,58,237,0.4)';
                    this.style.color = '#a78bfa';
                }, 2000);
            });
        }
    });

    // ────────────────────── CHECKOUT FORM SUBMISSION ──────────────────────
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameVal = document.getElementById('rzp-name').value.trim();
        const emailVal = document.getElementById('rzp-email').value.trim();
        const countryCode = document.getElementById('rzp-country-code').value;
        const phoneInput = document.getElementById('rzp-phone').value.trim();
        // Cashfree requires strict phone formats, often rejecting spaces or hyphens.
        const phoneVal = (countryCode + phoneInput).replace(/[^\d+]/g, '');
        const tier = document.getElementById('rzp-tier').value;
        const nonce = document.getElementById('rzp-nonce').value;
        const sessionTs = document.getElementById('rzp-session-ts').value;

        // ── Validation ──
        if (!nameVal || !emailVal || !phoneVal) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        // Email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }
        // Phone format check (minimum 7 digits for international support)
        if (phoneInput.replace(/\D/g, '').length < 7) {
            showToast('Please enter a valid phone number.', 'error');
            return;
        }

        // ── Security: Session age check (prevent stale forms — 30 min max) ──
        const sessionAge = Date.now() - parseInt(sessionTs);
        if (sessionAge > 30 * 60 * 1000) {
            showToast('Your session has expired. Please refresh and try again.', 'error');
            closeModal();
            return;
        }

        // ── Security: Nonce replay prevention ──
        if (paymentSessions.has(nonce)) {
            showToast('This payment session has already been used. Please try again.', 'error');
            closeModal();
            return;
        }

        const gatewayInput = document.querySelector('input[name="gateway"]:checked') || document.querySelector('input[name="gateway"][type="hidden"]');
        const gateway = gatewayInput ? gatewayInput.value : 'cashfree';

        const payBtn = document.getElementById('rzp-pay-btn');
        const btnText = document.getElementById('rzp-btn-text');
        const btnLoader = document.getElementById('rzp-btn-loader');
        payBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';

        // ── Step 1: Save lead to Firebase Firestore (replaces Formspree — unlimited writes) ──
        const region = window.pricingRegion || PRICING.IN;
        const tierConfig = (tier === 'basic') ? region.basic :
            (tier === 'autocaptions' ? region.autocaptions :
                (tier === 'projectmanager' ? region.projectmanager : region.pro));
        const badgeMap = {
            basic: 'Easy Workflow Basic',
            pro: 'Easy Workflow Pro',
            autocaptions: 'Auto Captions Pro',
            projectmanager: 'Project Manager Pro'
        };

        // Store the lead doc ID so we can update it later on payment success
        let currentLeadDocId = null;

        try {
            if (window.firestore) {
                console.log('[Firebase] Saving lead to Firestore...');
                const leadRef = await window.firestore.collection('leads').add({
                    name: nameVal,
                    email: emailVal,
                    phone: phoneVal,
                    tier: badgeMap[tier],
                    gateway: gateway,
                    status: 'interested',
                    amount: currentPromoCode ? (tierConfig.label + ` (Used: ${currentPromoCode})`) : tierConfig.label,
                    nonce: nonce,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                currentLeadDocId = leadRef.id;
                console.log('[Firebase] Lead saved with ID:', currentLeadDocId);
            }
        } catch (err) {
            console.error('[Firebase Lead] Error:', err);
        }

        // ── Step 2: Determine verified amount in paise ──
        let amountInSmallestUnit;
        const currency = region.currency;

        // NEW: Try to use dynamic pricing from Firestore if available
        if (window.currentFirestorePricing) {
            const currKey = (currency || 'INR').toLowerCase();
            const priceKey = `${tier}_${currKey}`;
            const dynamicPrice = window.currentFirestorePricing[priceKey];
            if (dynamicPrice) {
                amountInSmallestUnit = dynamicPrice * (currency === 'INR' ? 100 : 100); // Already in base units? No, Firestore usually stores in ₹ or $
                // If weight was stored in ₹/$, convert to paise/cents
                amountInSmallestUnit = Math.round(dynamicPrice * 100);
                console.log(`[Checkout] Using Dynamic Price: ${priceKey} = ${amountInSmallestUnit} units`);
            }
        }

        // Fallback to hardcoded registry if Firestore fails
        if (!amountInSmallestUnit) {
            const amountRegistry = isPastDeadline() ? RZP_AMOUNTS_DEADLINE : RZP_AMOUNTS;
            amountInSmallestUnit = amountRegistry[tier]?.[currency];
            console.log(`[Checkout] Using Fallback Price: ${amountInSmallestUnit} units`);
        }

        if (amountInSmallestUnit && currentPromoMultiplier < 1) {
            amountInSmallestUnit = Math.round(amountInSmallestUnit * currentPromoMultiplier);
        }

        if (!amountInSmallestUnit) {
            showToast('Pricing error. Please refresh the page and try again.', 'error');
            payBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            return;
        }

        // ── STEP 3: EXECUTE SELECTED GATEWAY ──
        if (gateway === 'razorpay') {
            const options = {
                key: RZP_KEY_ID,
                amount: amountInSmallestUnit,
                currency: currency,
                name: 'Easy Workflow',
                description: badgeMap[tier] + ' — Lifetime License',
                image: 'https://easyworkflow.store/logo.png',
                prefill: { name: nameVal, email: emailVal, contact: phoneVal },
                notes: { tier, nonce, session_ts: sessionTs, product: badgeMap[tier], promoCode: currentPromoCode },
                theme: { color: '#7c3aed', backdrop_color: 'rgba(0,0,0,0.85)' },
                payment_capture: 1, // Auto-capture payments
                handler: function (response) {
                    window.handlePaymentSuccess(response.razorpay_payment_id || 'N/A', 'razorpay');
                }
            };
            const rzp = new Razorpay(options);
            rzp.open();
            // Reset button
            setTimeout(() => {
                payBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }, 1000);
            return;
        }

        // ── International Logic: Redirect to Gumroad for USD ──
        if (currency === 'USD') {
            const gumroadUrl = GUMROAD_LINKS[tier];
            showToast('Redirecting to secure international checkout...', 'success');
            setTimeout(() => {
                window.location.href = gumroadUrl;
            }, 1500);
            return;
        }

        // ── Cashfree Logic (For INR/Domestic) ──

        try {
            // BACKEND URL: Auto-switch between local Node server and Netlify production
            const BACKEND_URL = '/api/create-order';

            const orderRes = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountInSmallestUnit / 100,
                    currency: currency,
                    name: nameVal, email: emailVal, phone: phoneVal, tier: tier,
                    mode: CF_MODE // Pass mode to backend for explicit verification
                })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json().catch(() => ({}));
                if (errData.code === 'customer_phone_invalid' || (errData.details && errData.details.includes('phone'))) {
                    throw new Error('Please enter a valid phone number.');
                }
                throw new Error(errData.details || errData.error || 'Payment Server Offline');
            }
            const { payment_session_id } = await orderRes.json();

            if (!payment_session_id) throw new Error('Mission Session ID');

            // --- SAVE TO LOCALSTORAGE FOR REDIRECT RECOVERY ---
            const checkoutData = {
                name: nameVal,
                email: emailVal,
                phone: phoneVal,
                tier: tier,
                leadDocId: currentLeadDocId,
                amount: tierConfig.label,
                nonce: nonce,
                ts: Date.now()
            };
            localStorage.setItem('last_checkout', JSON.stringify(checkoutData));

            const checkoutOptions = {
                paymentSessionId: payment_session_id,
                returnUrl: window.location.href + '?cf_id={order_id}', // Use cf_id to avoid conflicts
                redirectTarget: "_modal"
            };

            cashfree.checkout(checkoutOptions).then((result) => {
                payBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';

                if (result.error) showToast(result.error.message, 'error');
                if (result.paymentDetails) {
                    window.handlePaymentSuccess(result.paymentDetails.paymentId, 'cashfree');
                }
            });

        } catch (err) {
            console.error('[Payment] Error:', err);
            payBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            showToast(err.message, 'error');
        }
    });

    // ────────────────────── PAYMENT SUCCESS HANDLER (Global Access) ──────────────────────
    window.handlePaymentSuccess = async function (paymentId, method, dataOverride = null) {
        // Use either passed data (for redirects) or form variables
        const data = dataOverride || {
            name: document.getElementById('rzp-name').value,
            email: document.getElementById('rzp-email').value,
            phone: (document.getElementById('rzp-country-code').value + document.getElementById('rzp-phone').value).replace(/[^\d+]/g, ''),
            tier: document.getElementById('rzp-tier').value,
            leadId: null // will be set below
        };

        const badgeMap = {
            basic: 'Easy Workflow Basic',
            pro: 'Easy Workflow Pro',
            autocaptions: 'Auto Captions Pro',
            projectmanager: 'Project Manager Pro'
        };

        console.log(`[Success] Handling ${method} payment: ${paymentId}`);
        showToast('Verifying payment... Please wait.', 'success');

        // 1. Update Firestore (Captured)
        try {
            if (window.firestore) {
                // Add to payments
                await window.firestore.collection('payments').add({
                    paymentId, gateway: method, tier: badgeMap[data.tier] || data.tier,
                    name: data.name, email: data.email, phone: data.phone,
                    amount: data.amount || '—', verified: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update lead
                if (data.leadDocId) {
                    await window.firestore.collection('leads').doc(data.leadDocId).update({
                        status: 'paid', paymentId, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        } catch (e) { console.error('[Firebase] Capture error:', e); }

        // 2. Verify with Backend (and trigger Auto-Email)
        let paymentVerified = false;
        try {
            const VERIFY_URL = '/api/verify-payment';

            const res = await fetch(VERIFY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId, method, tier: badgeMap[data.tier] || data.tier,
                    name: data.name, email: data.email, phone: data.phone
                })
            });

            const result = await res.json();

            if (result.verified) {
                paymentVerified = true;
                // Update with server-confirmed data if available
                if (result.amount) data.amount = result.amount;
                if (result.tier) data.tier = result.tier;
                // Mark as verified in Firestore
                if (window.firestore && data.leadDocId) {
                    await window.firestore.collection('leads').doc(data.leadDocId).update({
                        status: 'verified', updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        } catch (err) {
            console.error('[Verify] Error:', err);
        }

        // 3. Show Success UI (with loading spinner for license)
        if (typeof closeModal === 'function') closeModal();
        showSuccessScreen(paymentId, data.amount || '—', badgeMap[data.tier] || data.tier, data.email);

        // 4. Generate License Key (server-side only)
        if (paymentVerified) {
            try {
                const LICENSE_URL = '/api/generate-license';

                const nonce = document.getElementById('rzp-nonce')?.value || '';
                const sessionTs = document.getElementById('rzp-session-ts')?.value || '';

                const licenseRes = await fetch(LICENSE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentId: paymentId,
                        method: method,
                        email: data.email,
                        name: data.name,
                        tier: data.tier,
                        phone: data.phone,
                        nonce: nonce,
                        sessionTs: sessionTs
                    })
                });

                const licenseResult = await licenseRes.json();

                if (licenseResult.success && licenseResult.licenseKey) {
                    console.log('[License] Key generated successfully');
                    displayLicenseKey(licenseResult.licenseKey);
                } else {
                    console.error('[License] Generation failed:', licenseResult.error);
                    displayLicenseError(licenseResult.error || 'License generation failed. Check your email.');
                }
            } catch (licenseErr) {
                console.error('[License] Network error:', licenseErr);
                displayLicenseError('Network error during license generation. Your key will be emailed to you.');
            }
        } else {
            // Payment not verified — show pending message
            displayLicenseError('Payment verification is pending. Your license key will be emailed once confirmed.');
        }

        localStorage.removeItem('last_checkout'); // Clear on success
    };

    // ────────────────────── URL PARAMETER CHECKER (For Redirects) ──────────────────────
    function checkUrlForPayment() {
        const params = new URLSearchParams(window.location.search);
        const cfId = params.get('cf_id') || params.get('order_id');
        const rzpId = params.get('razorpay_payment_id');

        if (cfId || rzpId) {
            console.log('[Redirect] Payment ID found in URL:', cfId || rzpId);
            const saved = localStorage.getItem('last_checkout');
            if (saved) {
                const data = JSON.parse(saved);
                // Ensure it's recent (within 1 hour)
                if (Date.now() - data.ts < 3600000) {
                    window.handlePaymentSuccess(cfId || rzpId, cfId ? 'cashfree' : 'razorpay', data);
                }
            }
        }
    }
    checkUrlForPayment();

});

// ===== CENTERED ALERT NOTIFICATION ======
function showToast(message, type = 'success') {
    // Alert Overlay
    const alertOverlay = document.createElement('div');
    alertOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(5px);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    const textColor = type === 'success' ? '#10b981' : '#ef4444';

    // Alert Box
    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
        background: var(--bg-card);
        border: 2px solid ${bgColor};
        color: white;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 20px 80px rgba(0,0,0,0.6);
        font-size: 16px;
        text-align: center;
        max-width: 500px;
        width: 90%;
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    alertBox.innerHTML = `
        <div style="font-weight:700; font-family:var(--font-heading); font-size:24px; margin-bottom:12px; color:${textColor};">
            ${type === 'success' ? 'Success!' : 'Error'}
        </div>
        <div style="color:var(--text-secondary); line-height:1.6; font-size:16px; margin-bottom:24px;">
            ${message}
        </div>
        <button id="alert-ok-btn" style="
            background: ${bgColor}; 
            color: white; 
            border: none; 
            padding: 12px 32px; 
            font-size: 16px; 
            font-weight: 600; 
            border-radius: 8px; 
            cursor: pointer;
            transition: opacity 0.2s;
        ">OK</button>
    `;

    alertOverlay.appendChild(alertBox);
    document.body.appendChild(alertOverlay);

    // Fade in
    setTimeout(() => {
        alertOverlay.style.opacity = '1';
        alertBox.style.transform = 'translateY(0) scale(1)';
    }, 10);

    // Dismiss Logic
    function dismissAlert() {
        alertOverlay.style.opacity = '0';
        alertBox.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => {
            alertOverlay.remove();
        }, 300);
    }

    // Attach click listener to OK button
    const okBtn = alertBox.querySelector('#alert-ok-btn');
    okBtn.addEventListener('click', dismissAlert);

    // Hover effect on OK button
    okBtn.addEventListener('mouseover', () => okBtn.style.opacity = '0.8');
    okBtn.addEventListener('mouseout', () => okBtn.style.opacity = '1');
}

// ===== TIMELINE PREVIEW LOGIC =====
document.addEventListener('DOMContentLoaded', () => {
    const previewButtons = document.querySelectorAll('[data-preview]');
    const layersList = document.getElementById('timeline-layers-list');
    const timelineTime = document.querySelector('.timeline-time');
    const timelinePlayhead = document.querySelector('.timeline-playhead');
    const compViewer = document.getElementById('comp-viewer');
    const compObject = document.getElementById('comp-object');
    const timelinePreview = document.getElementById('timeline-preview');

    if (!layersList) return;

    // AE exact colors
    const C = {
        red: { bg: '#ef4444', bar: 'rgba(239, 68, 68, 0.4)' },
        teal: { bg: '#06b6d4', bar: 'rgba(6, 182, 212, 0.4)' },
        orange: { bg: '#f59e0b', bar: 'rgba(245, 158, 11, 0.4)' },
        purple: { bg: '#a855f7', bar: 'rgba(168, 85, 247, 0.4)' },
        blue: { bg: '#3b82f6', bar: 'rgba(59, 130, 246, 0.4)' },
        pink: { bg: '#ec4899', bar: 'rgba(236, 72, 153, 0.4)' },
    };

    let sequenceTimer = null;
    let scenarioIndex = 0;

    const createLayer = (num, name, color, left, width, isAnimated, isSelected = false, extras = '') => {
        const selectStyle = isSelected ? 'background:rgba(255,255,255,0.15); border-radius:3px; padding:0 4px;' : '';
        const selectBar = isSelected ? 'border:1px solid #fff;' : `border:1px solid ${color.bg};`;
        const animClass = isAnimated ? 'animated-in' : '';
        return `
            <div class="timeline-layer ${animClass}">
                <div class="layer-info" style="${isSelected ? 'background:#333;' : ''}">
                    <span class="layer-color" style="background:${color.bg}"></span>
                    <span class="layer-num">${num}</span>
                    <span class="layer-name" style="${selectStyle}">${name}</span>
                </div>
                <div class="layer-bar-container">
                    <div class="layer-bar" style="background:${color.bar}; ${selectBar} left:${left}; width:${width};">
                        ${extras}
                    </div>
                </div>
            </div>
        `;
    };

    // Universal State Machine for all Button Previews
    const ACTION_SCENARIOS = {
        'SOLID': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;transition:background 0.3s;background:transparent;"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Full_Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = '#ef4444';
                        return createLayer(1, '[Solid 1]', C.red, '0%', '100%', true) + createLayer(2, '[Full_Video.mp4]', C.teal, '0%', '100%', false);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'NULL': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.teal, '10%', '60%', false, true) + createLayer(2, '[Layer 2]', C.purple, '20%', '40%', false, true),
                    after: () => createLayer(1, '[Null 1]', C.orange, '10%', '60%', true) + createLayer(2, '[Layer 1]', C.teal, '10%', '60%', false) + createLayer(3, '[Layer 2]', C.purple, '20%', '40%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'CAMERA': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Camera Controller]', C.orange, '0%', '100%', true) + createLayer(2, '[Camera 1]', C.teal, '0%', '100%', true) + createLayer(3, '[Video.mp4]', C.teal, '0%', '100%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TEXT': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'TEXT'; o.style.cssText = 'color: white; font-size: 0px; font-weight:800; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform:scale(0);'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.transform = 'scale(1)';
                        return createLayer(1, '[Text 1]', C.purple, '0%', '100%', true) + createLayer(2, '[Video.mp4]', C.teal, '0%', '100%', false);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'BOUNCE': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'TEXT'; o.className = 'comp-object'; o.style.cssText = 'color:white; font-size:28px; font-weight:800;'; },
            steps: [
                {
                    before: () => createLayer(1, 'TEXT', C.purple, '10%', '80%', false, true, '<div class="keyframe-dot" style="left:5%;"></div>'),
                    after: () => {
                        compObject.classList.add('bounce-active');
                        return createLayer(1, 'TEXT', C.purple, '10%', '80%', false, true, '<div class="keyframe-dot" style="left:5%;"></div><div class="keyframe-dot" style="left:15%;"></div>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;02'
                }
            ]
        },
        'RAMP': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;transition:background 0.5s;background:#888;"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Shape Layer]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = 'linear-gradient(180deg, #ff00ff 0%, #00ffff 100%)';
                        return createLayer(1, '[Shape Layer]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'FIT': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:20px;height:10px;background:#06b6d4;transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Small_Image.png]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.width = '100%';
                        compObject.firstChild.style.height = '100%';
                        return createLayer(1, '[Small_Image.png]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'GLOW': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'GLOW'; o.style.cssText = 'color: white; font-size: 28px; font-weight:800; transition: text-shadow 0.5s; text-shadow: none;'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Logo.png]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.textShadow = '0 0 10px #fff, 0 0 20px #f0f, 0 0 30px #f0f';
                        return createLayer(1, '[Logo.png]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'ADJ': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;background:#444;position:relative;"><div id="adjOverlay" style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:background 0.5s;"></div></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        const overlay = o.querySelector('#adjOverlay');
                        if (overlay) overlay.style.background = 'rgba(255,100,200,0.3)';
                        return createLayer(1, '[Adjustment 1]', C.cyan, '0%', '100%', true) + createLayer(2, '[Video.mp4]', C.teal, '0%', '100%', false);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TRIM': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer_To_Trim.mp4]', C.teal, '0%', '100%', false, true) + createLayer(2, '[Base_Layer.mp4]', C.purple, '30%', '40%', false),
                    after: () => createLayer(1, '[Layer_To_Trim.mp4]', C.teal, '30%', '40%', true, true) + createLayer(2, '[Base_Layer.mp4]', C.purple, '30%', '40%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'MIRROR': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'IMG'; o.style.cssText = 'color:white; font-size:28px; font-weight:800; transition:transform 0.5s; transform:scaleX(1);'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.transform = 'scaleX(-1)';
                        return createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'FILL': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:40px;height:40px;border-radius:50%;background:#fff;transition:background 0.5s;"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Shape]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = '#ef4444';
                        return createLayer(1, '[Shape]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TINT': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(45deg,#00f,#f0f);transition:filter 0.5s, background 0.5s;filter:grayscale(0%);"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = 'linear-gradient(45deg,#000,#fff)';
                        return createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'BLUR': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'FOCUS'; o.style.cssText = 'color:white; font-size:24px; font-weight:800; transition: filter 0.5s; filter: blur(0px);'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Text]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.filter = 'blur(4px)';
                        return createLayer(1, '[Text]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'LUM': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;background:url(https://images.unsplash.com/photo-1542204165-65bf26472b9b?h=120) center/cover; transition:filter 0.5s; filter:contrast(50%) brightness(80%) saturate(10%);"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.filter = 'contrast(130%) brightness(100%) saturate(140%) hue-rotate(10deg)';
                        return createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'CAPITAL': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'text layer'; o.style.cssText = 'color:white; font-size:20px; text-transform:lowercase; font-weight:800; transition:all 0.3s;'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Text]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.textTransform = 'uppercase';
                        return createLayer(1, '[Text]', C.purple, '0%', '100%', false, true);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'FXLOCK': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:80px;height:80px;border-radius:10px;background:linear-gradient(135deg,#f0f,#00f);position:absolute;transition:all 0.5s cubic-bezier(0.175,0.885,0.32,1.275);left:10%;top:20%;"></div>'; o.className = 'comp-object'; o.style.cssText = 'width:100%;height:100%;position:relative;'; },
            steps: [
                {
                    before: () => createLayer(1, '[Shape Layer (Gradient)]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#ef4444; color:#fff; padding:1px 3px; border-radius:2px;">🔒</span>'),
                    after: () => {
                        compObject.firstChild.style.left = '60%';
                        compObject.firstChild.style.background = 'linear-gradient(135deg,#f0f,#00f)'; // gradient moves with it perfectly
                        return createLayer(1, '[Shape Layer (Gradient)]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#ef4444; color:#fff; padding:1px 3px; border-radius:2px;">🔒</span><div class="keyframe-dot" style="left:50%;"></div>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;01;00'
                }
            ]
        },
        'ALIGN': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.orange, '0%', '40%', false, true) + createLayer(2, '[Layer 2]', C.teal, '30%', '40%', false),
                    after: () => createLayer(1, '[Layer 1]', C.orange, '70%', '40%', true, true) + createLayer(2, '[Layer 2]', C.teal, '30%', '40%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'REMOVE_FX': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>'),
                    after: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TRUE_DUP': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Composition 1]', C.purple, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Composition 2]', C.purple, '0%', '100%', true, true) + createLayer(2, '[Composition 1]', C.purple, '0%', '100%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'SEQ_LAYERS': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Image 1]', C.purple, '0%', '20%', false, true) + createLayer(2, '[Image 2]', C.teal, '0%', '20%', false, true) + createLayer(3, '[Image 3]', C.orange, '0%', '20%', false, true),
                    after: () => createLayer(1, '[Image 1]', C.purple, '0%', '20%', true) + createLayer(2, '[Image 2]', C.teal, '20%', '20%', true) + createLayer(3, '[Image 3]', C.orange, '40%', '20%', true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;10'
                }
            ]
        },
        'SPLIT_MASKS': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;position:relative;';
                o.innerHTML = `
                    <div id="sm-vid" style="width:140px;height:80px;background:#334155;border:1px solid #475569;border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
                        <!-- Three distinct masked regions -->
                        <div id="sm-mask1" style="position:absolute;width:30px;height:30px;border:1.5px solid #fbbf24;border-radius:50%;left:20%;top:20%;transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
                        <div id="sm-mask2" style="position:absolute;width:30px;height:30px;border:1.5px solid #fbbf24;left:60%;top:50%;transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
                        <div id="sm-mask3" style="position:absolute;width:40px;height:20px;border:1.5px solid #fbbf24;left:30%;top:65%;transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
                    </div>
                `;
            },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4] 3 Masks', C.teal, '0%', '100%', false, true),
                    after: () => {
                        const m1 = document.getElementById('sm-mask1');
                        const m2 = document.getElementById('sm-mask2');
                        const m3 = document.getElementById('sm-mask3');
                        if (m1) { m1.style.borderColor = '#ef4444'; m1.style.transform = 'scale(1.2)'; }
                        if (m2) { m2.style.borderColor = '#3b82f6'; m2.style.transform = 'scale(1.2)'; }
                        if (m3) { m3.style.borderColor = '#10b981'; m3.style.transform = 'scale(1.2)'; }
                        return createLayer(1, '[Mask 1] Video.mp4', C.red, '0%', '100%', true) +
                            createLayer(2, '[Mask 2] Video.mp4', C.blue, '0%', '100%', true) +
                            createLayer(3, '[Mask 3] Video.mp4', C.green, '0%', '100%', true);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TRACK_PATH': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f172a;position:relative;';
                o.innerHTML = `
                    <svg width="160" height="90" viewBox="0 0 160 90" style="position:relative;">
                        <path id="tp-path" d="M 20,70 Q 80,10 140,70" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="2 4" />
                        <circle id="tp-point" cx="20" cy="70" r="4" fill="#6366f1">
                            <animate attributeName="cx" from="20" to="140" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="cy" from="70" to="70" values="70;10;70" dur="2s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                    <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:8px;color:#6366f1;font-weight:700;letter-spacing:1px;background:rgba(99,102,241,0.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(99,102,241,0.3);">TRACKING PATH...</div>
                `;
            },
            steps: [
                {
                    before: () => createLayer(1, '[Shape Layer 1]', C.purple, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Shape Layer 1]', C.purple, '0%', '100%', false, true) +
                        createLayer(2, '[Path Data]', C.teal, '0%', '100%', true, true, '<span style="position:absolute;right:8px;color:#00e676;font-size:8px;">✓ Tracked</span>'),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;02;00'
                }
            ]
        },
        'DEL_BEFORE': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00',
                    playheadBefore: '0%', playheadAfter: '40%'
                },
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '40%', '60%', true, true),
                    timeBefore: '0;00;05;00', timeAfter: '0;00;05;00',
                    playheadBefore: '40%', playheadAfter: '40%'
                }
            ]
        },
        'DEL_AFTER': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;07;12',
                    playheadBefore: '0%', playheadAfter: '60%'
                },
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '60%', true, true),
                    timeBefore: '0;00;07;12', timeAfter: '0;00;07;12',
                    playheadBefore: '60%', playheadAfter: '60%'
                }
            ]
        },
        'PRECOMP_TOG': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.blue, '0%', '40%', false, true) +
                        createLayer(2, '[Layer 2]', C.pink, '20%', '50%', false, true) +
                        createLayer(3, '[Layer 3]', C.orange, '40%', '60%', false, true),
                    after: () => createLayer(1, '[Precomp 1]', C.purple, '0%', '100%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00'
                }
            ]
        },
        'PRECOMP_SEP': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.blue, '0%', '40%', false, true) +
                        createLayer(2, '[Layer 2]', C.pink, '20%', '50%', false, true) +
                        createLayer(3, '[Layer 3]', C.orange, '40%', '60%', false, true),
                    after: () => createLayer(1, '[Layer 1 Comp]', C.purple, '0%', '40%', true, true) +
                        createLayer(2, '[Layer 2 Comp]', C.purple, '20%', '50%', true, true) +
                        createLayer(3, '[Layer 3 Comp]', C.purple, '40%', '60%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00'
                }
            ]
        },
        'UNPRECOMP': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Precomp 1]', C.purple, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Layer 1]', C.blue, '0%', '40%', true, true) +
                        createLayer(2, '[Layer 2]', C.pink, '20%', '50%', true, true) +
                        createLayer(3, '[Layer 3]', C.orange, '40%', '60%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00'
                }
            ]
        },
        'ORGANIZE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#18181b;color:#ddd;font-size:12px;font-family:var(--font-body);padding:10px;box-sizing:border-box;';
            },
            steps: [
                {
                    before: () => {
                        compObject.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;justify-content:center;">
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-file-video" style="color:#2dd4bf"></i> video.mp4</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-file-image" style="color:#f472b6"></i> logo.png</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-layer-group" style="color:#a78bfa"></i> Comp 1</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-volume-up" style="color:#fb923c"></i> audio.wav</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-layer-group" style="color:#a78bfa"></i> Comp 2</div>
                        </div>`;
                        return createLayer(1, '[Project Panel]', C.teal, '0%', '100%', false, true);
                    },
                    after: () => {
                        compObject.innerHTML = `<div style="display:flex;flex-direction:row;gap:12px;align-items:flex-start;width:100%;justify-content:center;">
                            <div style="color:#a78bfa;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 01_Comps</div>
                            <div style="color:#2dd4bf;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 02_Video</div>
                            <div style="color:#f472b6;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 03_Images</div>
                            <div style="color:#fb923c;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 04_Audio</div>
                        </div>`;
                        return createLayer(1, '[Project Organized]', C.purple, '0%', '100%', true, true);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        ...['ALIGN_L', 'ALIGN_CX', 'ALIGN_R', 'ALIGN_T', 'ALIGN_CY', 'ALIGN_B'].reduce((acc, type) => {
            acc[type] = {
                useViewer: true,
                hideTimeline: true,
                setupViewer: (v, o) => {
                    o.className = 'comp-object';
                    // We'll mimic a video layer in a composition frame
                    v.style.background = '#222';
                    o.innerHTML = '<div id="align-target" style="width:120px; height:67px; background:#06b6d4; border-radius:4px; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-clapperboard" style="color:rgba(0,0,0,0.3); font-size:24px;"></i></div>';
                },
                steps: [
                    {
                        before: () => {
                            const t = document.getElementById('align-target');
                            if (t) {
                                t.style.transition = 'none';
                                t.style.left = '50%';
                                t.style.top = '50%';
                                t.style.transform = 'translate(-50%, -50%)';
                                void t.offsetWidth;
                                t.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            }
                            return '';
                        },
                        after: () => {
                            const t = document.getElementById('align-target');
                            if (!t) return '';
                            if (type === 'ALIGN_L') { t.style.left = '0%'; t.style.transform = 'translate(0, -50%)'; }
                            if (type === 'ALIGN_CX') { t.style.left = '50%'; t.style.transform = 'translate(-50%, -50%)'; }
                            if (type === 'ALIGN_R') { t.style.left = '100%'; t.style.transform = 'translate(-100%, -50%)'; }
                            if (type === 'ALIGN_T') { t.style.top = '0%'; t.style.transform = 'translate(-50%, 0)'; }
                            if (type === 'ALIGN_CY') { t.style.top = '50%'; t.style.transform = 'translate(-50%, -50%)'; }
                            if (type === 'ALIGN_B') { t.style.top = '100%'; t.style.transform = 'translate(-50%, -100%)'; }
                            return '';
                        },
                        timeBefore: '', timeAfter: ''
                    }
                ]
            };
            return acc;
        }, {}),
        ...['ANCHOR_TL', 'ANCHOR_TC', 'ANCHOR_TR', 'ANCHOR_ML', 'ANCHOR_MC', 'ANCHOR_MR', 'ANCHOR_BL', 'ANCHOR_BC', 'ANCHOR_BR'].reduce((acc, type) => {
            acc[type] = {
                useViewer: true,
                hideTimeline: true,
                setupViewer: (v, o) => {
                    o.className = 'comp-object';
                    v.style.background = '#222';
                    // Video layer with anchor point visual
                    o.innerHTML = `
                        <div style="width:120px; height:67px; background:rgba(168, 85, 247, 0.3); border:1px solid #a855f7; border-radius:4px; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-clapperboard" style="color:rgba(168, 85, 247, 0.5); font-size:24px;"></i>
                            <div id="anchor-target" style="position:absolute; width:12px; height:12px; border:2px solid #fff; border-radius:50%; transform:translate(-50%, -50%); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); left:50%; top:50%;">
                                <div style="position:absolute; width:20px; height:1px; background:#fff; left:50%; top:50%; transform:translate(-50%, -50%);"></div>
                                <div style="position:absolute; width:1px; height:20px; background:#fff; left:50%; top:50%; transform:translate(-50%, -50%);"></div>
                            </div>
                        </div>
                    `;
                },
                steps: [
                    {
                        before: () => {
                            const t = document.getElementById('anchor-target');
                            if (t) {
                                t.style.transition = 'none';
                                t.style.left = '50%';
                                t.style.top = '50%';
                                void t.offsetWidth;
                                t.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            }
                            return '';
                        },
                        after: () => {
                            const t = document.getElementById('anchor-target');
                            if (!t) return '';
                            const dir = type.split('_')[1]; // TL, TC, TR, etc.
                            if (dir.includes('L')) t.style.left = '0%';
                            if (dir.includes('C')) t.style.left = '50%';
                            if (dir.includes('R')) t.style.left = '100%';
                            if (dir.includes('T')) t.style.top = '0%';
                            if (dir.includes('M')) t.style.top = '50%';
                            if (dir.includes('B')) t.style.top = '100%';
                            return '';
                        },
                        timeBefore: '', timeAfter: ''
                    }
                ]
            };
            return acc;
        }, {}),
        'IMPORT_SRT': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; overflow:hidden; background:#111;';
                o.innerHTML = `
                    <div id="srt-vid-bg" style="width:100%;height:100%;background:linear-gradient(180deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);position:relative;display:flex;align-items:center;justify-content:center;">
                        <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.5);color:#aaa;font-size:7px;padding:2px 5px;border-radius:3px;">▶ Comp 1 | 0:00:00:00</div>
                        <div style="font-size:10px;color:rgba(255,255,255,0.15);letter-spacing:2px;text-transform:uppercase;">Video Preview</div>
                        <div id="srt-subtitle-display" style="position:absolute;bottom:16%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:3px;border:1px solid rgba(255,255,255,0.2);white-space:nowrap;opacity:0;transition:opacity 0.3s ease;text-align:center;min-width:80px;"></div>
                    </div>
                    <div id="srt-file-drop" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;opacity:0;transition:opacity 0.2s;">
                        <div style="font-size:20px;">📄</div>
                        <div style="color:#f59e0b;font-size:8px;font-weight:700;letter-spacing:1px;">subtitles.srt</div>
                    </div>
                `;
                // Animate drop → subtitles appear
                let srtPhase = 0;
                const subtitles = ['Hi there!', 'Welcome to this video', 'Easy Workflow Pro', 'Import SRT ✓'];
                const subDisplay = o.querySelector('#srt-subtitle-display');
                const fileIcon = o.querySelector('#srt-file-drop');
                if (window._srtViewerInterval) clearInterval(window._srtViewerInterval);
                // Show file drop hint first
                setTimeout(() => { if (fileIcon) fileIcon.style.opacity = '1'; }, 200);
                setTimeout(() => { if (fileIcon) fileIcon.style.opacity = '0'; }, 800);
                window._srtViewerInterval = setInterval(() => {
                    if (!subDisplay) return;
                    subDisplay.style.opacity = '1';
                    subDisplay.textContent = subtitles[srtPhase % subtitles.length];
                    srtPhase++;
                    setTimeout(() => { if (subDisplay) subDisplay.style.opacity = '0'; }, 900);
                }, 1400);
            },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Sub] Hi there!', C.purple, '0%', '20%', true) +
                        createLayer(2, '[Sub] Welcome to this video', C.purple, '22%', '30%', true) +
                        createLayer(3, '[Sub] Easy Workflow Pro', C.purple, '55%', '15%', true) +
                        createLayer(4, '[Sub] Import SRT ✓', C.purple, '72%', '28%', true) +
                        createLayer(5, '[Video.mp4]', C.teal, '0%', '100%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;04;12'
                }
            ]
        },
        'RESIZE_COMP': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; background:#111; display:flex; align-items:center; justify-content:center; overflow:hidden;';
                o.innerHTML = `
                    <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);color:#555;font-size:7px;letter-spacing:1px;text-transform:uppercase;">COMPOSITION SIZE</div>
                    <div id="rc-frame" style="
                        width:42%; height:72%;
                        background:rgba(124,58,237,0.12);
                        border:2px solid rgba(124,58,237,0.7);
                        border-radius:4px;
                        display:flex; flex-direction:column;
                        align-items:center; justify-content:center;
                        transition: width 0.7s cubic-bezier(0.175,0.885,0.32,1.275), height 0.7s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.4s ease;
                        position:relative;
                    ">
                        <div id="rc-label" style="color:#a78bfa;font-size:9px;font-weight:700;letter-spacing:1px;transition:opacity 0.3s;">1080×1920</div>
                        <div style="color:rgba(255,255,255,0.25);font-size:7px;margin-top:2px;">9:16</div>
                    </div>
                    <div id="rc-arrow" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:#00e676;font-size:8px;font-weight:700;opacity:0;transition:opacity 0.4s;">✓ Resized!</div>
                `;
                if (window._rcInterval) clearInterval(window._rcInterval);
                const sizes = [
                    { w: '42%', h: '72%', label: '1080×1920', ratio: '9:16', color: 'rgba(124,58,237,0.7)' },
                    { w: '88%', h: '50%', label: '1920×1080', ratio: '16:9', color: 'rgba(6,182,212,0.7)' },
                    { w: '55%', h: '55%', label: '1080×1080', ratio: '1:1', color: 'rgba(245,158,11,0.7)' },
                    { w: '48%', h: '60%', label: '1080×1350', ratio: '4:5', color: 'rgba(236,72,153,0.7)' },
                ];
                let si = 0;
                const frame = o.querySelector('#rc-frame');
                const label = o.querySelector('#rc-label');
                const arrow = o.querySelector('#rc-arrow');
                window._rcInterval = setInterval(() => {
                    si = (si + 1) % sizes.length;
                    const s = sizes[si];
                    if (!frame || !label) return;
                    label.style.opacity = '0';
                    setTimeout(() => {
                        if (!frame || !label) return;
                        frame.style.width = s.w;
                        frame.style.height = s.h;
                        frame.style.borderColor = s.color;
                        frame.style.background = s.color.replace('0.7', '0.1');
                        label.textContent = s.label;
                        label.style.color = s.color.replace('0.7', '1');
                        frame.querySelector('div:last-child').textContent = s.ratio;
                        label.style.opacity = '1';
                        if (arrow) { arrow.style.opacity = '1'; setTimeout(() => { if (arrow) arrow.style.opacity = '0'; }, 600); }
                    }, 250);
                }, 1800);
            },
            steps: [
                {
                    before: () => createLayer(1, '[Comp] 1080×1920', C.purple, '0%', '100%', false, true),
                    after: () => {
                        return createLayer(1, '[Comp] 1920×1080  ✓', C.teal, '0%', '100%', true, true);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TEXT_EXPLODE': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[TEXT]', C.purple, '0%', '100%', false, true),
                    after: () => createLayer(1, '[T]', C.teal, '0%', '100%', true) +
                        createLayer(2, '[E]', C.teal, '0%', '100%', true) +
                        createLayer(3, '[X]', C.teal, '0%', '100%', true) +
                        createLayer(4, '[T]', C.teal, '0%', '100%', true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'NUM_COUNTER': {
            useViewer: true,
            setupViewer: (v, o, step) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; background:#18181b; color:#10b981; font-family:monospace; font-size:36px; gap:8px; font-weight:800;';
                if (window.numCountInt) clearInterval(window.numCountInt);
                if (window.numSeqTo) clearTimeout(window.numSeqTo);

                const updateTitle = t => {
                    const el = document.getElementById('num-title');
                    if (el) el.innerText = t;
                };

                o.innerHTML = `<div id="num-title" style="font-size:10px; color:#aaa; font-family:var(--font-body); letter-spacing:1px; white-space:nowrap;">1. Smooth Counting</div><div id="num-disp">0</div>`;

                let c = 0;
                let phase = 'COUNT';
                let symI = 0;
                const syms = ['$', '₹', '€', '£', '¥'];
                let fmtI = 0;
                const fmts = ['9,000.00', '9,000', '09000', '9k'];
                let pfxI = 0;
                const pfxs = ['₹ 9k', '9k USD', 'Price: 9k', '9k views'];
                let pc = 8000;

                const tick = () => {
                    const disp = document.getElementById('num-disp');
                    if (!disp) return;

                    if (phase === 'COUNT') {
                        c += 187;
                        if (c > 9000) c = 9000;
                        disp.innerText = c;
                    } else if (phase === 'SYMBOLS') {
                        disp.innerText = `${syms[symI]} 9000`;
                        symI = (symI + 1) % syms.length;
                    } else if (phase === 'FORMAT') {
                        disp.innerText = `₹ ${fmts[fmtI]}`;
                        fmtI = (fmtI + 1) % fmts.length;
                    } else if (phase === 'PREFIX') {
                        disp.innerText = pfxs[pfxI];
                        pfxI = (pfxI + 1) % pfxs.length;
                    } else if (phase === 'POSTERIZE') {
                        pc += 100;
                        if (pc > 9000) pc = 9000;
                        disp.innerText = pc + ' views';
                    }
                };

                // Master Sequencer
                window.numCountInt = setInterval(tick, 20);

                window.numSeqTo = setTimeout(() => {
                    // Start SYMBOLS phase
                    phase = 'SYMBOLS';
                    updateTitle('2. Change Symbols');
                    clearInterval(window.numCountInt);
                    window.numCountInt = setInterval(tick, 250);

                    setTimeout(() => {
                        // Start FORMAT phase
                        phase = 'FORMAT';
                        updateTitle('3. Formats (US / Indian / Insta)');
                        clearInterval(window.numCountInt);
                        window.numCountInt = setInterval(tick, 350);

                        setTimeout(() => {
                            // Start PREFIX phase
                            phase = 'PREFIX';
                            updateTitle('4. Prefixes & Suffixes');
                            clearInterval(window.numCountInt);
                            window.numCountInt = setInterval(tick, 350);

                            setTimeout(() => {
                                // Start POSTERIZE phase
                                phase = 'POSTERIZE';
                                updateTitle('5. Posterize Time Frame Rate');
                                clearInterval(window.numCountInt);
                                window.numCountInt = setInterval(tick, 300); // Slower choppy tick frame rate
                            }, 1800);
                        }, 1800);
                    }, 1800);
                }, 1200);
            },
            steps: [
                {
                    before: () => createLayer(1, '[Numbers]', C.green, '0%', '20%', false, true),
                    after: () => createLayer(1, '[Numbers]', C.green, '0%', '100%', true, true) + `<div class="keyframe-dot" style="left:20%; background:#ef4444; transition:left 6.6s linear;"></div><div class="keyframe-dot" style="left:90%; background:#ef4444; transition:none;"></div>`,
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00',
                    actionDuration: 800,
                    loopDelay: 6600
                }
            ]
        },
        'CLIP_SLOT_1': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-scissors fa-3x" style="color:#2979ff;"></i>
                    <span>Clipboard Slot 1 Active</span>
                </div>`;
            },
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.classList.toggle('active', n === 1);
                    });
                    return '';
                },
                after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_SLOT_2': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-scissors fa-3x" style="color:#2979ff;"></i>
                    <span>Clipboard Slot 2 Active</span>
                </div>`;
            },
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.classList.toggle('active', n === 2);
                    });
                    return '';
                },
                after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_SLOT_3': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-scissors fa-3x" style="color:#2979ff;"></i>
                    <span>Clipboard Slot 3 Active</span>
                </div>`;
            },
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.classList.toggle('active', n === 3);
                    });
                    return '';
                },
                after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_COPY': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:10px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                        <div id="clip-l1" style="width:140px; height:40px; background:#2979ff; border:2px solid #fff; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; font-weight:bold; box-shadow:0 0 10px rgba(41,121,255,0.5);">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> BLUE LAYER [SELECTED]
                        </div>
                        <div style="width:140px; height:40px; background:#f472b6; border:1px solid #444; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; opacity:0.6;">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER
                        </div>
                    </div>
                `;
            },
            steps: [{
                before: () => {
                    const s = document.getElementById('clip-slot-1');
                    if (s) s.innerText = '1';
                    return '';
                },
                after: () => {
                    const s = document.getElementById('clip-slot-1');
                    if (s) s.innerHTML = '1 <span style="color:#00e676">•</span>';
                    return createLayer(1, 'Properties Copied to Slot 1', C.blue, '0%', '100%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_PASTE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:10px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                        <div style="width:140px; height:40px; background:#2979ff; border:1px solid #444; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; opacity:0.6;">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> BLUE LAYER
                        </div>
                        <div id="clip-l2" style="width:140px; height:40px; background:#f472b6; border:2px solid #fff; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; font-weight:bold; transition: background 0.3s, box-shadow 0.3s;">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER [SELECTED]
                        </div>
                    </div>
                `;
                const s = document.getElementById('clip-slot-1');
                if (s) s.innerHTML = '1 <span style="color:#00e676">•</span>';
            },
            steps: [{
                before: () => {
                    const l2 = document.getElementById('clip-l2');
                    if (l2) {
                        l2.style.background = '#f472b6';
                        l2.style.boxShadow = 'none';
                        l2.innerHTML = '<i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER [SELECTED]';
                    }
                    return '';
                },
                after: () => {
                    const l2 = document.getElementById('clip-l2');
                    if (l2) {
                        l2.style.background = '#2979ff';
                        l2.style.boxShadow = '0 0 15px rgba(41,121,255,0.7)';
                        l2.innerHTML = '<i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER (PASTED)';
                    }
                    return createLayer(1, 'Properties Pasted from Slot 1', C.purple, '0%', '100%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_CLEAR': {
            useViewer: false,
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.innerHTML = `${n} <span style="color:#00e676">•</span>`;
                    });
                    return createLayer(1, 'Active Clipboard Slots', C.orange, '0%', '100%', false, true);
                },
                after: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.innerText = n;
                    });
                    return createLayer(1, 'All Slots Cleared', C.red, '0%', '100%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'IMPORT_SRT': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; overflow:hidden; background:#111;';
                o.innerHTML = `
                    <div style="width:100%;height:100%;background:linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;">
                        <div style="position:absolute;top:0;left:0;right:0;height:18px;background:rgba(0,0,0,0.4);display:flex;align-items:center;padding:0 6px;gap:4px;">
                            <span style="color:#888;font-size:7px;">⬛ Comp 1</span>
                            <span style="color:#555;font-size:7px;margin-left:auto;">0:00:00:00</span>
                        </div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.12);letter-spacing:2px;text-transform:uppercase;margin-top:8px;">Video</div>
                        <div id="srt-free-drop" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;opacity:1;transition:all 0.5s ease;">
                            <div style="font-size:22px;filter:drop-shadow(0 0 8px rgba(245,158,11,0.8));">📄</div>
                            <div style="color:#f59e0b;font-size:7px;font-weight:700;letter-spacing:1px;background:rgba(245,158,11,0.15);padding:2px 6px;border-radius:3px;border:1px solid rgba(245,158,11,0.4);">subtitles.srt</div>
                        </div>
                        <div id="srt-free-sub" style="position:absolute;bottom:18%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:600;padding:4px 14px;border-radius:3px;border:1px solid rgba(255,255,255,0.25);white-space:nowrap;opacity:0;transition:opacity 0.4s ease;min-width:80px;text-align:center;"></div>
                        <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);color:#00e676;font-size:7px;opacity:0;transition:opacity 0.3s;" id="srt-free-ok">✓ Subtitles Created</div>
                    </div>
                `;
                const subs = ['Hi there!', 'Welcome back!', 'Easy Workflow Pro', 'SRT Imported!'];
                const dropEl = o.querySelector('#srt-free-drop');
                const subEl = o.querySelector('#srt-free-sub');
                const okEl = o.querySelector('#srt-free-ok');
                if (window._srtFreeInt) clearInterval(window._srtFreeInt);
                let si = 0;
                // Drop animation: icon falls into place, then subtitles start cycling
                setTimeout(() => {
                    if (dropEl) { dropEl.style.opacity = '0'; dropEl.style.transform = 'translate(-50%,-50%) scale(1.3)'; }
                    setTimeout(() => {
                        if (okEl) okEl.style.opacity = '1';
                        window._srtFreeInt = setInterval(() => {
                            if (!subEl) return;
                            subEl.style.opacity = '1';
                            subEl.textContent = subs[si % subs.length];
                            si++;
                            setTimeout(() => { if (subEl) subEl.style.opacity = '0'; }, 1000);
                        }, 1500);
                    }, 400);
                }, 600);
            },
            steps: [{
                before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                after: () =>
                    createLayer(1, '[Sub] Hi there!', C.purple, '0%', '18%', true) +
                    createLayer(2, '[Sub] Welcome back!', C.purple, '20%', '22%', true) +
                    createLayer(3, '[Sub] Easy Workflow Pro', C.purple, '45%', '20%', true) +
                    createLayer(4, 'SUBTITLES_TRACK', C.blue, '0%', '100%', true) +
                    createLayer(5, '[Video.mp4]', C.teal, '0%', '100%', false),
                timeBefore: '0;00;00;00', timeAfter: '0;00;04;08'
            }]
        },
        'RESIZE_COMP': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; background:#111; display:flex; align-items:center; justify-content:center; overflow:hidden;';
                o.innerHTML = `
                    <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);color:#555;font-size:7px;letter-spacing:1px;text-transform:uppercase;">COMP SIZE</div>
                    <div id="rc-free-frame" style="
                        width:88%; height:50%;
                        background:rgba(6,182,212,0.1);
                        border:2px solid rgba(6,182,212,0.7);
                        border-radius:4px;
                        display:flex; flex-direction:column;
                        align-items:center; justify-content:center; gap:2px;
                        transition: width 0.65s cubic-bezier(0.175,0.885,0.32,1.275), height 0.65s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.35s ease, background 0.35s ease;
                        position:relative;
                    ">
                        <div id="rc-free-label" style="color:#22d3ee;font-size:9px;font-weight:700;letter-spacing:1px;transition:opacity 0.3s;">1920×1080</div>
                        <div id="rc-free-ratio" style="color:rgba(255,255,255,0.25);font-size:7px;">16:9</div>
                    </div>
                    <div id="rc-free-badge" style="position:absolute;bottom:8px;right:8px;background:rgba(0,230,118,0.15);border:1px solid rgba(0,230,118,0.5);color:#00e676;font-size:7px;font-weight:700;padding:2px 6px;border-radius:3px;opacity:0;transition:opacity 0.4s;">✓ Done</div>
                `;
                if (window._rcFreeInt) clearInterval(window._rcFreeInt);
                const sizes = [
                    { w: '88%', h: '50%', label: '1920×1080', ratio: '16:9', bc: 'rgba(6,182,212,0.7)', bg: 'rgba(6,182,212,0.1)', lc: '#22d3ee' },
                    { w: '42%', h: '72%', label: '1080×1920', ratio: '9:16', bc: 'rgba(124,58,237,0.7)', bg: 'rgba(124,58,237,0.1)', lc: '#a78bfa' },
                    { w: '55%', h: '55%', label: '1080×1080', ratio: '1:1', bc: 'rgba(245,158,11,0.7)', bg: 'rgba(245,158,11,0.1)', lc: '#fbbf24' },
                    { w: '50%', h: '62%', label: '1080×1350', ratio: '4:5', bc: 'rgba(236,72,153,0.7)', bg: 'rgba(236,72,153,0.1)', lc: '#f472b6' },
                ];
                let si = 0;
                const frame = o.querySelector('#rc-free-frame');
                const label = o.querySelector('#rc-free-label');
                const ratio = o.querySelector('#rc-free-ratio');
                const badge = o.querySelector('#rc-free-badge');
                window._rcFreeInt = setInterval(() => {
                    si = (si + 1) % sizes.length;
                    const s = sizes[si];
                    if (!frame || !label) return;
                    label.style.opacity = '0';
                    setTimeout(() => {
                        if (!frame || !label) return;
                        frame.style.width = s.w;
                        frame.style.height = s.h;
                        frame.style.borderColor = s.bc;
                        frame.style.background = s.bg;
                        label.textContent = s.label;
                        label.style.color = s.lc;
                        if (ratio) ratio.textContent = s.ratio;
                        label.style.opacity = '1';
                        if (badge) { badge.style.opacity = '1'; setTimeout(() => { if (badge) badge.style.opacity = '0'; }, 700); }
                    }, 250);
                }, 1800);
            },
            steps: [{
                before: () => createLayer(1, 'Comp: 1920×1080 (16:9)', C.teal, '0%', '100%', false, true),
                after: () => createLayer(1, 'Resized → 1080×1920 (9:16)', C.purple, '0%', '100%', true),
                timeBefore: '0;00;00;00', timeAfter: '0;00;00;01'
            }]
        },
        'TEXT_EXPLODE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="font-size:24px; color:#fff; font-weight:800; text-transform:uppercase; letter-spacing:2px;">EXPLODE!</div>`;
            },
            steps: [{
                before: () => createLayer(1, 'EXPLODE!', C.purple, '0%', '100%', false, true),
                after: () => {
                    compObject.innerHTML = `
                    <div style="display:flex; gap:4px">
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(-30px, -20px) rotate(-15deg); opacity:0.8;">E</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(-15px, -35px) rotate(10deg); opacity:0.8;">X</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(0, -45px) rotate(-5deg); opacity:0.8;">P</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(15px, -35px) rotate(20deg); opacity:0.8;">L</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(30px, -20px) rotate(-10deg); opacity:0.8;">O</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(45px, -40px) rotate(5deg); opacity:0.8;">D</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(60px, -25px) rotate(-15deg); opacity:0.8;">E</span>
                    </div>`;
                    return createLayer(1, 'E', C.pink, '0%', '10%', true) + createLayer(2, 'X', C.pink, '10%', '10%', true) + createLayer(3, 'P', C.pink, '20%', '10%', true) + createLayer(4, 'L', C.pink, '30%', '10%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_REFRESH': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-sync fa-spin fa-3x" style="color:#2979ff;"></i>
                    <span>Scanning Compositions for Fonts...</span>
                </div>`;
            },
            steps: [{
                before: () => '',
                after: () => {
                    return createLayer(1, 'Font List Refreshed', C.blue, '0%', '100%', true);
                },
                timeBefore: '1000', timeAfter: ''
            }]
        },
        'FONT_LIST_ITEM': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="display:flex; flex-direction:column; gap:15px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                    <div style="font-family:sans-serif; font-size:24px; color:#fff; font-weight:bold; border:2px solid #fff; padding:10px 20px; border-radius:4px; text-transform:uppercase;">Montserrat Bold</div>
                    <div style="font-family:sans-serif; font-size:14px; color:#aaa;">(Used in 3 layers)</div>
                </div>`;
            },
            steps: [{
                before: () => '', after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_ADD': {
            useViewer: false,
            steps: [{
                before: () => createLayer(1, 'Selected Font: Montserrat-Bold', C.purple, '0%', '100%', false, true),
                after: () => createLayer(1, 'Added to Replacement List', C.green, '0%', '100%', true),
                timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_REPLACE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:20px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                        <div class="font-target" style="font-family:'Space Grotesk', sans-serif; font-size:28px; color:#fff; font-weight:700; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); text-transform:uppercase;">Design Studio</div>
                        <div class="font-target" style="font-family:'Space Grotesk', sans-serif; font-size:16px; color:#2979ff; letter-spacing:4px; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); text-transform:uppercase;">Creative</div>
                    </div>
                `;
            },
            steps: [{
                before: () => {
                    const targets = document.querySelectorAll('.font-target');
                    targets.forEach(t => {
                        t.style.fontFamily = "'Space Grotesk', sans-serif";
                    });
                    return createLayer(1, 'Source Font: Montserrat-Bold', C.orange, '0%', '100%', false, true);
                },
                after: () => {
                    const targets = document.querySelectorAll('.font-target');
                    targets.forEach(t => {
                        t.style.fontFamily = "'Inter', sans-serif";
                        t.style.color = '#fff';
                        t.style.letterSpacing = '0px';
                        t.animate([
                            { transform: 'scale(1.1)', filter: 'blur(2px)' },
                            { transform: 'scale(1)', filter: 'blur(0)' }
                        ], { duration: 300, easing: 'ease-out' });
                    });
                    return createLayer(1, 'Replaced with Inter-Regular', C.green, '0%', '100%', true);
                },
                timeBefore: '800', timeAfter: ''
            }]
        },
        'FONT_REMOVE': {
            useViewer: false,
            steps: [{
                before: () => createLayer(1, 'Selected Font: Montserrat-Bold', C.red, '0%', '100%', false, true),
                after: () => createLayer(1, 'Removed from List', C.orange, '0%', '100%', true),
                timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_FAV': {
            useViewer: false,
            steps: [{
                before: () => createLayer(1, 'Marking Font as Favorite', C.yellow, '0%', '100%', false, true),
                after: () => createLayer(1, 'Added to Favorites ★', C.yellow, '0%', '100%', true),
                timeBefore: '', timeAfter: ''
            }]
        }
    };

    let currentActionName = null;

    const runGenericSequence = () => {
        if (!currentActionName || !ACTION_SCENARIOS[currentActionName]) return;
        const scenarioDef = ACTION_SCENARIOS[currentActionName];

        let step = scenarioDef.steps[scenarioIndex];

        const timelineBody = document.querySelector('.timeline-body');

        // Before State Setup
        if (scenarioDef.useViewer) {
            if (compViewer) compViewer.style.display = 'flex';
            if (scenarioDef.setupViewer) {
                scenarioDef.setupViewer(compViewer, compObject, step);
                // Force layout reflow to ensure CSS transitions execute correctly
                void compObject.offsetWidth;
            }
        } else {
            if (compViewer) compViewer.style.display = 'none';
        }

        if (scenarioDef.hideTimeline) {
            if (timelineBody) timelineBody.style.display = 'none';
            if (step.before) step.before();
        } else {
            if (timelineBody) timelineBody.style.display = 'flex';

            if (timelinePlayhead) {
                if (step.playheadBefore) {
                    timelinePlayhead.style.display = 'block';
                    timelinePlayhead.style.transition = 'none';
                    timelinePlayhead.style.left = step.playheadBefore;
                    void timelinePlayhead.offsetWidth; // force reflow
                } else {
                    timelinePlayhead.style.display = 'none';
                }
            }
            layersList.innerHTML = step.before();
            if (timelineTime) timelineTime.textContent = step.timeBefore;
        }
        if (timelineTime) timelineTime.textContent = step.timeBefore;

        const actionAtStart = currentActionName;
        // Action Exec
        sequenceTimer = setTimeout(() => {
            if (currentActionName !== actionAtStart) return; // Action changed mid-flight

            if (!scenarioDef.hideTimeline) {
                if (timelinePlayhead && step.playheadAfter) {
                    if (step.playheadBefore !== step.playheadAfter) {
                        timelinePlayhead.style.transition = 'left 0.8s linear';
                    } else {
                        timelinePlayhead.style.transition = 'none';
                    }
                    timelinePlayhead.style.left = step.playheadAfter;
                }

                layersList.innerHTML = step.after();
                if (timelineTime) timelineTime.textContent = step.timeAfter;
            } else if (step.after) {
                // Allows the viewer-only steps to trigger their 'after' functions (like moving the anchor/align box)
                step.after();
            }

            scenarioIndex = (scenarioIndex + 1) % scenarioDef.steps.length;

            // Loop Back
            const delay = step.loopDelay !== undefined ? step.loopDelay : 2000;
            sequenceTimer = setTimeout(() => {
                runGenericSequence();
            }, delay);
        }, step.actionDuration !== undefined ? step.actionDuration : 800);
    };

    const setDefaultState = () => {
        currentActionName = null;
        if (sequenceTimer) clearTimeout(sequenceTimer);
        if (window.numCountInt) clearInterval(window.numCountInt);
        if (window.numSeqTo) clearTimeout(window.numSeqTo);
        if (window._srtViewerInterval) clearInterval(window._srtViewerInterval);
        if (window._srtFreeInt) clearInterval(window._srtFreeInt);
        if (window._rcInterval) clearInterval(window._rcInterval);
        if (window._rcFreeInt) clearInterval(window._rcFreeInt);
        // Hide the panel — only shows on button hover
        if (timelinePreview) timelinePreview.classList.remove('preview-active');
        scenarioIndex = 0;
        const timelineBody = document.querySelector('.timeline-body');
        if (timelineBody) timelineBody.style.display = 'flex';
        layersList.innerHTML = createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false);
        if (timelineTime) timelineTime.textContent = `0;00;00;00`;
        if (timelinePlayhead) timelinePlayhead.style.display = 'none';
        if (compViewer) compViewer.style.display = 'none';
        if (compObject) {
            compObject.className = 'comp-object';
            compObject.style.cssText = '';
            compObject.textContent = '';
        }
    };

    // Initialize the default visual
    setDefaultState();

    previewButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const action = btn.getAttribute('data-preview');
            if (action && ACTION_SCENARIOS[action]) {
                if (sequenceTimer) clearTimeout(sequenceTimer);
                scenarioIndex = 0;
                currentActionName = action;
                // Show the panel only when hovering a valid button
                if (timelinePreview) timelinePreview.classList.add('preview-active');
                runGenericSequence();
            }
        });

        // When mouse leaves the button, revert back to normal state
        btn.addEventListener('mouseleave', () => {
            setDefaultState();
        });
    });

    // ===== MOCKUP FONT REPLACER INTERACTIVITY =====
    function initFontInteractivity() {
        const fontPanel = document.querySelector('.mockup-panel[data-panel="font"]');
        if (!fontPanel) return;

        const items = fontPanel.querySelectorAll('.ew-list-item');
        const refreshBtn = fontPanel.querySelector('[data-preview="FONT_REFRESH"]');
        const favoriteBtn = fontPanel.querySelector('[data-preview="FONT_FAV"]');
        const addBtn = fontPanel.querySelector('[data-preview="FONT_ADD"]');
        const replaceBtn = fontPanel.querySelector('[data-preview="FONT_REPLACE"]');

        // Selection logic
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                // Visual feedback for selection
                const fontName = item.querySelector('span:first-child').textContent;
                console.log('Selected font:', fontName);
            });
        });

        // Add to List logic
        addBtn?.addEventListener('click', () => {
            const selected = fontPanel.querySelector('.ew-list-item.selected');
            if (selected) {
                const name = selected.querySelector('span:first-child').textContent;
                showToast(`Font <b>${name}</b> added to the replacement list!`, 'success');
            } else {
                showToast('Please select a font from the list first.', 'error');
            }
        });

        // Favorite logic
        favoriteBtn?.addEventListener('click', () => {
            const selected = fontPanel.querySelector('.ew-list-item.selected');
            if (selected) {
                const name = selected.querySelector('span:first-child').textContent;
                showToast(`<b>${name}</b> added to your favorite fonts! ★`, 'success');
                selected.style.color = '#f59e0b';
            }
        });

        // Refresh logic
        refreshBtn?.addEventListener('click', () => {
            showToast('Scanning your After Effects composition for text layers...', 'success');
            // Simulate refresh by blinking items
            items.forEach((item, idx) => {
                item.style.opacity = '0.3';
                setTimeout(() => {
                    item.style.opacity = '1';
                    // Randomize counts for effect
                    const badge = item.querySelector('.ew-badge');
                    if (badge) badge.textContent = `${Math.floor(Math.random() * 8) + 1} layer${idx === 1 ? '' : 's'}`;
                }, 100 * idx);
            });
        });

        // Replace Button logic
        replaceBtn?.addEventListener('click', () => {
            const selected = fontPanel.querySelector('.ew-list-item.selected');
            if (selected) {
                showToast('Searching for layers with source font and replacing...', 'success');
            }
        });
    }

    // Initialize Font Interactivity
    initFontInteractivity();

    // ===== GRAPH TAB INTERACTIVITY (SYNCED) =====
    const initGraphInteractivity = () => {
        const graphPanel = document.querySelector('.mockup-panel[data-panel="graph"]');
        if (!graphPanel) return;

        const modeBtns = graphPanel.querySelectorAll('button'); // Select buttons inside the left column
        const presetItems = graphPanel.querySelectorAll('.preset-box-sync');

        // Mode Switching
        modeBtns.forEach(btn => {
            if (btn.textContent === 'APPLY EASING') return; // Skip apply btn
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => {
                    b.style.background = '#222';
                    b.style.borderColor = '#333';
                    b.style.color = '#aaa';
                });
                btn.style.background = '#3A82F6';
                btn.style.borderColor = '#3A82F6';
                btn.style.color = 'white';
            });
        });

        // Preset Selection
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                presetItems.forEach(i => {
                    i.style.opacity = '0.6';
                    if (i.querySelector('.preset-label-sync')) i.querySelector('.preset-label-sync').style.color = '#888';
                    if (i.querySelector('path')) i.querySelector('path').setAttribute('stroke', '#aaa');
                });

                item.style.opacity = '1';
                const labelEl = item.querySelector('.preset-label-sync');
                const pathEl = item.querySelector('path');
                if (labelEl) labelEl.style.color = 'white';
                if (pathEl) pathEl.setAttribute('stroke', 'white');

                // Update the main graph SVG preview with the chosen preset
                const mainPath = graphPanel.querySelector('#bezier-svg-sync path');
                if (mainPath && labelEl) {
                    const label = labelEl.textContent.toLowerCase();

                    let newD = "M 0,100 C 30,100 70,0 100,0"; // default ease

                    if (label === 'linear') newD = "M 0,100 L 100,0";
                    else if (label === 'easein') newD = "M 0,100 C 60,100 100,60 100,0";
                    else if (label === 'easeout') newD = "M 0,100 C 0,40 40,0 100,0";
                    else if (label === 'ease') newD = "M 0,100 C 30,100 70,0 100,0";

                    mainPath.setAttribute('d', newD);

                    // Update values display (mockup functionality)
                    const valsEl = graphPanel.querySelector('div[style*="text-align:right; color:#bbb"]');
                    if (valsEl) {
                        if (label === 'linear') valsEl.textContent = "0.00, 0.00, 1.00, 1.00";
                        else if (label === 'ease') valsEl.textContent = "0.25, 0.10, 0.25, 1.00";
                        else if (label.includes('in')) valsEl.textContent = "0.42, 0.00, 1.00, 1.00";
                        else if (label.includes('out')) valsEl.textContent = "0.00, 0.00, 0.58, 1.00";
                    }
                }
            });
        });

        // Apply Button Feedback
        const applyBtn = Array.from(graphPanel.querySelectorAll('button')).find(b => b.textContent.includes('APPLY'));
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const originalText = applyBtn.textContent;
                applyBtn.innerHTML = '<i class="fa-solid fa-check"></i> EASING APPLIED';
                applyBtn.style.background = '#059669';
                setTimeout(() => {
                    applyBtn.textContent = originalText;
                    applyBtn.style.background = '#3A82F6';
                }, 1500);
            });
        }
    };

    initGraphInteractivity();
});

// ===== LEGAL MODAL LOGIC =====
window.openLegalModal = function () {
    const modal = document.getElementById('legalModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
};

window.closeLegalModal = function () {
    const modal = document.getElementById('legalModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
};

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLegalModal();
    }
});


