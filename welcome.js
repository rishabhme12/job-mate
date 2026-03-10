document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const ctaBtn = document.getElementById('ctaBtn');

    // Dynamically inject Manifest Data
    const manifest = chrome.runtime.getManifest();
    const extName = manifest.name || "Jobs Hero";
    const extDesc = manifest.description || "Filter promoted, applied, and irrelevant LinkedIn jobs so you can focus on better opportunities faster.";

    // Fallback logic for icons
    const iconPath = (manifest.icons && manifest.icons['128'])
        ? manifest.icons['128']
        : (manifest.icons && manifest.icons['48'] ? manifest.icons['48'] : 'icons/icon128.png');

    // Populate the global header
    const dynamicIcon = document.getElementById('dynamic-ext-icon');
    if (dynamicIcon) dynamicIcon.src = iconPath;

    const dynamicTitle = document.getElementById('dynamic-ext-title');
    if (dynamicTitle) dynamicTitle.textContent = "Welcome to " + extName;

    const dynamicDesc = document.getElementById('dynamic-ext-desc');
    if (dynamicDesc) dynamicDesc.textContent = extDesc;

    let currentSlideIndex = 0;
    const totalSlides = slides.length;

    function updateUI() {
        // Update slides array
        slides.forEach((slide, index) => {
            if (index === currentSlideIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Update dots
        dots.forEach((dot, index) => {
            if (index === currentSlideIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Toggle button visibility based on the slide index
        if (currentSlideIndex === 0) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }

        // On the very last slide, swap Next button for CTA
        if (currentSlideIndex === totalSlides - 1) {
            nextBtn.classList.add('hide-btn');
            ctaBtn.classList.remove('hide-btn');
        } else {
            nextBtn.classList.remove('hide-btn');
            ctaBtn.classList.add('hide-btn');
        }
    }

    nextBtn.addEventListener('click', () => {
        if (currentSlideIndex < totalSlides - 1) {
            currentSlideIndex++;
            updateUI();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            updateUI();
        }
    });

    // Close window if CTA is clicked, though it's already an anchor tag 
    // with target=_blank, it's nice to close the welcome page tab to keep things clean.
    ctaBtn.addEventListener('click', (e) => {
        // give it a brief moment to open the link, then close this tab.
        setTimeout(() => {
            window.close();
        }, 100);
    });

    // Option to click dots to navigate directly
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlideIndex = index;
            updateUI();
        });
    });

    // Initial setup
    updateUI();
});
