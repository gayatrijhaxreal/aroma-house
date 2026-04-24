document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) || '';
    const withBase = (path) => `${apiBaseUrl}${path}`;

    // Set Current Year in Footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });

    // Close mobile menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    });

    // Sticky Header
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Scroll Animation - Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to animate
    const animateElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
    animateElements.forEach(el => observer.observe(el));

    // Backend-driven content
    loadSiteContent();

    // Inquiry form handler
    const inquiryForm = document.getElementById('inquiry-form');
    const inquiryStatus = document.getElementById('inquiry-status');

    if (inquiryForm && inquiryStatus) {
        inquiryForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            inquiryStatus.classList.remove('success', 'error');
            inquiryStatus.textContent = 'Submitting your inquiry...';

            const formData = new FormData(inquiryForm);
            const payload = {
                name: String(formData.get('name') || '').trim(),
                phone: String(formData.get('phone') || '').trim(),
                message: String(formData.get('message') || '').trim()
            };

            try {
                const response = await fetch(withBase('/api/inquiries'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to submit inquiry');
                }

                inquiryForm.reset();
                inquiryStatus.classList.add('success');
                inquiryStatus.textContent = 'Thank you! We received your inquiry and will call you shortly.';
            } catch (error) {
                inquiryStatus.classList.add('error');
                inquiryStatus.textContent = error.message || 'Something went wrong. Please try again.';
            }
        });
    }

    async function loadSiteContent() {
        const menuGrid = document.getElementById('menu-grid');
        const reviewsGrid = document.getElementById('reviews-grid');

        if (!menuGrid && !reviewsGrid) {
            return;
        }

        try {
            const response = await fetch(withBase('/api/site-content'));
            if (!response.ok) {
                throw new Error('Failed to load site content');
            }

            const data = await response.json();

            if (menuGrid && Array.isArray(data.menu) && data.menu.length > 0) {
                menuGrid.innerHTML = data.menu.map((item, index) => {
                    const safeTitle = escapeHtml(item.title || 'Special Dish');
                    const safeDescription = escapeHtml(item.description || '');
                    const safePrice = escapeHtml(item.priceTier || '₹₹');
                    const imageClass = escapeHtml(item.imageClass || 'biryani-img');
                    const delay = (index % 4) + 1;

                    return `
                        <div class="menu-card fade-in-up delay-${delay}">
                            <div class="menu-card-img ${imageClass}"></div>
                            <div class="menu-card-content">
                                <div class="menu-header">
                                    <h3>${safeTitle}</h3>
                                    <span class="price-indicator">${safePrice}</span>
                                </div>
                                <p>${safeDescription}</p>
                                <a href="#contact" class="btn btn-sm btn-primary mt-3 w-100">Order Now</a>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            if (reviewsGrid && Array.isArray(data.reviews) && data.reviews.length > 0) {
                reviewsGrid.innerHTML = data.reviews.map((review, index) => {
                    const safeName = escapeHtml(review.name || 'Guest');
                    const safeRole = escapeHtml(review.role || 'Customer');
                    const safeText = escapeHtml(review.text || 'Great experience!');
                    const rating = Number(review.rating) || 5;
                    const stars = `${'★'.repeat(Math.max(0, Math.min(5, rating)))}${'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, rating))))}`;
                    const avatar = safeName.charAt(0).toUpperCase();
                    const delay = (index % 4) + 1;

                    return `
                        <div class="review-card fade-in-up delay-${delay}">
                            <div class="stars">${stars}</div>
                            <p class="review-text">"${safeText}"</p>
                            <div class="reviewer">
                                <div class="avatar">${avatar}</div>
                                <div>
                                    <h5>${safeName}</h5>
                                    <span>${safeRole}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            const refreshedAnimateElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
            refreshedAnimateElements.forEach((el) => observer.observe(el));
        } catch (_error) {
            // Keep static fallback content if backend content load fails.
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
});
