// meta.js

export function initializeMetaTagPreviewer() {
    const page = document.getElementById('meta-tag-preview');
    if (!page) return;

    // --- Recommended Lengths ---
    const TITLE_LIMIT = 60;
    const DESC_LIMIT = 160;

    // --- DOM Elements ---
    const elements = {
        urlInput: page.querySelector('#meta-url-input'),
        fetchBtn: page.querySelector('#fetch-meta-btn'),
        applyBtn: page.querySelector('#apply-manual-changes-btn'),
        titleInput: page.querySelector('#meta-title-input'),
        descInput: page.querySelector('#meta-desc-input'),
        imageInput: page.querySelector('#meta-image-input'),
        titleCounter: page.querySelector('#title-counter'),
        descCounter: page.querySelector('#desc-counter'),
        previews: {
            google: { favicon: page.querySelector('.google-favicon'), title: page.querySelector('.google-title'), url: page.querySelector('.google-url'), desc: page.querySelector('.google-description') },
            twitter: { title: page.querySelector('.twitter-title'), url: page.querySelector('.twitter-url'), desc: page.querySelector('.twitter-description'), image: page.querySelector('.twitter-image') },
            facebook: { image: page.querySelector('.facebook-image'), title: page.querySelector('.facebook-title'), url: page.querySelector('.facebook-url'), desc: page.querySelector('.facebook-description') }
        }
    };

    // --- Core Logic ---
    const updateCounters = () => {
        const titleLength = elements.titleInput.value.length;
        const descLength = elements.descInput.value.length;
        
        elements.titleCounter.textContent = `${titleLength} characters / ${TITLE_LIMIT} recommended`;
        elements.descCounter.textContent = `${descLength} characters / ${DESC_LIMIT} recommended`;
        
        elements.titleCounter.classList.toggle('is-over', titleLength > TITLE_LIMIT);
        elements.descCounter.classList.toggle('is-over', descLength > DESC_LIMIT);
    };

    const updatePreviews = () => {
        const title = elements.titleInput.value || "Meta Title Appears Here";
        const description = elements.descInput.value || "Your compelling meta description will be displayed here. Make it interesting to attract more clicks!";
        const imageURL = elements.imageInput.value.trim();
        let displayUrl = "example.com";
        try {
            const url = elements.urlInput.value || "https://example.com";
            displayUrl = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        } catch (e) { /* Use fallback */ }

        // Update Google
        elements.previews.google.favicon.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${displayUrl}`;
        elements.previews.google.title.textContent = title;
        elements.previews.google.url.textContent = displayUrl;
        elements.previews.google.desc.textContent = description;

        // Update Twitter
        elements.previews.twitter.title.textContent = title;
        elements.previews.twitter.url.textContent = displayUrl;
        elements.previews.twitter.desc.textContent = description;
        elements.previews.twitter.image.style.backgroundImage = imageURL ? `url(${imageURL})` : 'none';
        elements.previews.twitter.image.innerHTML = imageURL ? '' : '<i class="fa-regular fa-image fa-2x"></i>';
        
        // Update Facebook
        elements.previews.facebook.title.textContent = title;
        elements.previews.facebook.url.textContent = displayUrl.toUpperCase();
        elements.previews.facebook.desc.textContent = description;
        elements.previews.facebook.image.style.backgroundImage = imageURL ? `url(${imageURL})` : 'none';

        updateCounters();
    };

    const fetchMetadata = async () => {
        let url = elements.urlInput.value.trim();
        if (!url) { alert("Please enter a URL."); return; }
        if (!url.startsWith('http')) url = `https://${url}`;
        elements.urlInput.value = url;

        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        elements.fetchBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
        elements.fetchBtn.disabled = true;

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const getMeta = (prop) => doc.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`)?.getAttribute('content') || '';
            
            elements.titleInput.value = getMeta('og:title') || doc.querySelector('title')?.textContent || '';
            elements.descInput.value = getMeta('og:description') || getMeta('description') || '';
            elements.imageInput.value = getMeta('og:image') || getMeta('twitter:image') || '';
            
            updatePreviews();
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Could not fetch metadata. The site may be blocking requests or the URL is invalid. You can still enter details manually.");
        } finally {
            elements.fetchBtn.innerHTML = `<i class="fa-solid fa-sync me-2"></i>Fetch`;
            elements.fetchBtn.disabled = false;
        }
    };
    
    // --- EVENT LISTENERS ---
    elements.fetchBtn.addEventListener('click', fetchMetadata);
    elements.urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchMetadata(); });
    elements.applyBtn.addEventListener('click', updatePreviews);
    elements.titleInput.addEventListener('input', updateCounters);
    elements.descInput.addEventListener('input', updateCounters);
    
    // The dark mode toggle in the right column has been removed,
    // so this specific event listener is no longer needed.
    // The previews will now react automatically to the main dashboard theme toggle.

    // --- INITIALIZATION ---
    updatePreviews();
}