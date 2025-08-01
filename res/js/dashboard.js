// dashboard.js

export function initializeDashboard() {
    const page = document.getElementById('dashboard');
    if (!page) return;

    // --- DOM Elements ---
    const elements = {
        latestSnippetTitle: page.querySelector('#latest-snippet-title'),
        latestSnippetCode: page.querySelector('#latest-snippet-code'),
        copySnippetBtn: page.querySelector('#copy-latest-snippet'),
        latestPaletteTitle: page.querySelector('#latest-palette-title'),
        latestPaletteSwatches: page.querySelector('#latest-palette-swatches'),
        newsFeedList: page.querySelector('#news-feed-list'),
    };

    // --- 1. Load Latest Snippet ---
    const loadLatestSnippet = () => {
        const snippets = JSON.parse(localStorage.getItem('cssSnippets')) || [];
        if (snippets.length > 0) {
            const latest = snippets[snippets.length - 1]; // Get the last saved one
            elements.latestSnippetTitle.textContent = latest.title;
            elements.latestSnippetCode.textContent = latest.code;
            elements.copySnippetBtn.style.display = 'block';
        } else {
            elements.latestSnippetTitle.textContent = 'No Snippets Yet';
            elements.latestSnippetCode.textContent = 'Go to the CSS Snippet tool to save your first one!';
            elements.copySnippetBtn.style.display = 'none';
        }
    };

    // --- 2. Load Latest Palette ---
    const loadLatestPalette = () => {
        const palettes = JSON.parse(localStorage.getItem('colorPalettes_v5')) || [];
        if (palettes.length > 0) {
            const latest = palettes[palettes.length - 1];
            elements.latestPaletteTitle.textContent = latest.name;
            elements.latestPaletteSwatches.innerHTML = '';
            const allColors = latest.groups.flatMap(g => g.colors.map(c => c.hex));
            allColors.slice(0, 5).forEach(hex => { // Show first 5 colors
                const swatch = document.createElement('div');
                swatch.className = 'swatch';
                swatch.style.backgroundColor = hex;
                elements.latestPaletteSwatches.appendChild(swatch);
            });
        } else {
            elements.latestPaletteTitle.textContent = 'No Palettes Yet';
        }
    };

    // --- 3. Fetch Frontend News ---
    const fetchNews = async () => {
        // Using a free RSS-to-JSON proxy
        const rssFeedUrl = 'https://www.smashingmagazine.com/feed/';
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;
        
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            if (data.status === 'ok' && data.items) {
                elements.newsFeedList.innerHTML = '';
                data.items.slice(0, 4).forEach(item => { // Show latest 4 articles
                    const listItem = document.createElement('li');
                    listItem.className = 'news-item';
                    const pubDate = new Date(item.pubDate).toLocaleDateString();
                    listItem.innerHTML = `
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                        <small>${pubDate} - ${item.author}</small>`;
                    elements.newsFeedList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error("Error fetching news feed:", error);
            elements.newsFeedList.innerHTML = `<li class="text-secondary small">Could not load news feed.</li>`;
        }
    };

    // --- Event Listeners ---
    elements.copySnippetBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.latestSnippetCode.textContent).then(() => {
            const originalIcon = elements.copySnippetBtn.innerHTML;
            elements.copySnippetBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => { elements.copySnippetBtn.innerHTML = originalIcon; }, 1500);
        });
    });

    // --- Initial Load ---
    loadLatestSnippet();
    loadLatestPalette();
    fetchNews();
}