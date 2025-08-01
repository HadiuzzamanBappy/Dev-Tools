// font.js

export function initializeFontPreviewer() {
    const page = document.getElementById('font-previewer');
    if (!page) return; // Only run if the font previewer page exists

    const gridContainer = page.querySelector('.font-grid-container');
    const sampleTextInput = page.querySelector('#font-sample-text');

    const fontsToLoad = [
        { name: 'Roboto', family: 'Roboto', weights: [100, 300, 400, 500, 700, 900], defaultWeight: 400 },
        { name: 'Open Sans', family: 'Open+Sans', weights: [300, 400, 600, 700, 800], defaultWeight: 400 },
        { name: 'Lato', family: 'Lato', weights: [100, 300, 400, 700, 900], defaultWeight: 400 },
        { name: 'Montserrat', family: 'Montserrat', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
        { name: 'Poppins', family: 'Poppins', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
        { name: 'Noto Sans JP', family: 'Noto+Sans+JP', weights: [100, 300, 400, 500, 700, 900], defaultWeight: 400 },
    ];

    // Function to dynamically load fonts from Google Fonts
    function loadGoogleFont(font) {
        const fontUrl = `https://fonts.googleapis.com/css2?family=${font.family}:wght@${font.weights.join(';')}&display=swap`;
        const linkId = `font-link-${font.family}`;
        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = fontUrl;
            document.head.appendChild(link);
        }
    }

    // Render all font cards
    function renderCards() {
        gridContainer.innerHTML = '';
        fontsToLoad.forEach(font => {
            loadGoogleFont(font);
            const card = document.createElement('div');
            card.className = 'font-card';

            const weightOptions = font.weights.map(w => `<option value="${w}" ${w === font.defaultWeight ? 'selected' : ''}>${w}</option>`).join('');

            card.innerHTML = `
                <div class="font-card-header">
                    <h5>${font.name}</h5>
                </div>
                <div class="font-card-body">
                    <div class="font-preview-text" style="font-family: '${font.name}', sans-serif; font-weight: ${font.defaultWeight};">
                        ${sampleTextInput.value}
                    </div>
                    <div class="font-controls">
                        <input type="range" class="form-range font-size-slider" min="16" max="72" value="28">
                        <select class="form-select form-select-sm font-weight-select">${weightOptions}</select>
                    </div>
                </div>
            `;
            gridContainer.appendChild(card);

            // Add event listeners for controls on this specific card
            const previewText = card.querySelector('.font-preview-text');
            card.querySelector('.font-size-slider').addEventListener('input', (e) => {
                previewText.style.fontSize = `${e.target.value}px`;
            });
            card.querySelector('.font-weight-select').addEventListener('change', (e) => {
                previewText.style.fontWeight = e.target.value;
            });
        });
    }
    
    // Update all preview text areas when the main input changes
    sampleTextInput.addEventListener('input', () => {
        document.querySelectorAll('.font-preview-text').forEach(el => {
            el.textContent = sampleTextInput.value;
        });
    });

    // Initial render
    renderCards();
}