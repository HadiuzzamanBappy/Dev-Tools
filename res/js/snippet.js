export function initializeSnippetApp() {
    const snippetGrid = document.getElementById('snippet-grid');
    if (!snippetGrid) return; // Exit if we're not on the snippet page

    // Get all required elements
    const snippetForm = document.getElementById('snippet-form');
    const snippetModalEl = document.getElementById('snippet-modal');
    const snippetModal = new bootstrap.Modal(snippetModalEl);
    const snippetModalLabel = document.getElementById('snippetModalLabel');
    const viewSnippetModalEl = document.getElementById('view-snippet-modal');
    const viewSnippetModal = new bootstrap.Modal(viewSnippetModalEl);
    const viewSnippetTitle = document.getElementById('view-snippet-title');
    const viewSnippetTags = document.getElementById('view-snippet-tags');
    const viewSnippetCode = document.getElementById('view-snippet-code');
    const searchInput = document.getElementById('search-input');
    const noSnippetsMessage = document.getElementById('no-snippets-message');
    const addSnippetBtn = document.getElementById('add-snippet-btn');
    const snippetId = document.getElementById('snippet-id');
    const snippetTitle = document.getElementById('snippet-title');
    const snippetCode = document.getElementById('snippet-code');
    const snippetTagsInput = document.getElementById('snippet-tags');
    const tagFilterInput = document.getElementById('tag-filter-input');
    
    // Initialize Tagify
    const tagsInput = new Tagify(snippetTagsInput, { dropdown: { maxItems: 20, classname: "tags-look", enabled: 0, closeOnSelect: false } });
    const tagsFilter = new Tagify(tagFilterInput, { mode: 'select', whitelist: [], dropdown: { enabled: 1 }, placeholder: "Filter by tags..." });

    // Data Management
    let snippets = JSON.parse(localStorage.getItem('cssSnippets')) || [];
    const saveSnippets = () => localStorage.setItem('cssSnippets', JSON.stringify(snippets));

    // Render Function
    const renderSnippets = () => {
        snippetGrid.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        const filterTags = tagsFilter.value.length > 0 ? tagsFilter.value.map(t => t.value) : [];

        const filteredSnippets = snippets.filter(snippet => {
            const titleMatch = snippet.title.toLowerCase().includes(searchTerm);
            const codeMatch = snippet.code.toLowerCase().includes(searchTerm);
            const tagsMatch = filterTags.length === 0 || filterTags.every(ft => snippet.tags.some(st => st.value === ft));
            return (titleMatch || codeMatch) && tagsMatch;
        });

        noSnippetsMessage.style.display = filteredSnippets.length === 0 ? 'block' : 'none';

        filteredSnippets.forEach(snippet => {
            const highlightedCode = Prism.highlight(snippet.code, Prism.languages.css, 'css');
            const snippetEl = document.createElement('div');
            // We no longer need column classes, the grid container handles it
            snippetEl.className = 'snippet-card-wrapper'; 
            snippetEl.innerHTML = `
                <div class="card snippet-card">
                    <div class="card-body snippet-card-body">
                        <h5 class="card-title">${snippet.title}</h5>
                        <div class="snippet-code-wrapper mb-3">
                            <pre><code class="language-css">${highlightedCode}</code></pre>
                            <button class="btn btn-sm copy-code-btn" data-id="${snippet.id}"><i class="fa-regular fa-copy"></i> Copy</button>
                        </div>
                        <div class="snippet-tags">${snippet.tags.map(tag => `<span class="badge bg-secondary me-1">${tag.value}</span>`).join('')}</div>
                    </div>
                    <div class="card-footer d-flex justify-content-end gap-2">
                        <!-- THE KEY CHANGE: Eye icon for view button -->
                        <button class="btn btn-sm btn-outline-info view-btn" data-id="${snippet.id}" title="View Snippet">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${snippet.id}" title="Edit Snippet">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${snippet.id}" title="Delete Snippet">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>`;
            snippetGrid.appendChild(snippetEl);
        });
        updateTagSuggestions();
    };

    const updateTagSuggestions = () => {
        const allTags = [...new Set(snippets.flatMap(s => s.tags.map(t => t.value)))];
        tagsInput.settings.whitelist = allTags;
        tagsFilter.settings.whitelist = allTags;
    };

    // --- Event Handlers (no change to the logic, just the button icons) ---
    snippetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = snippetId.value;
        const newSnippet = { id: id || Date.now().toString(), title: snippetTitle.value, code: snippetCode.value, tags: tagsInput.value };
        snippets = id ? snippets.map(s => s.id === id ? newSnippet : s) : [...snippets, newSnippet];
        saveSnippets();
        renderSnippets();
        snippetModal.hide();
    });

    snippetGrid.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        const snippet = snippets.find(s => s.id === id);
        if (!snippet) return;

        if (target.classList.contains('view-btn')) {
            viewSnippetTitle.textContent = snippet.title;
            viewSnippetTags.innerHTML = snippet.tags.map(tag => `<span class="badge bg-info me-1">${tag.value}</span>`).join('');
            viewSnippetCode.innerHTML = Prism.highlight(snippet.code, Prism.languages.css, 'css');
            viewSnippetModal.show();
        }
        
        if (target.classList.contains('edit-btn')) {
            snippetId.value = snippet.id;
            snippetTitle.value = snippet.title;
            snippetCode.value = snippet.code;
            tagsInput.loadOriginalValues(snippet.tags);
            snippetModalLabel.textContent = 'Edit Snippet';
            snippetModal.show();
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this snippet?')) {
                snippets = snippets.filter(s => s.id !== id);
                saveSnippets();
                renderSnippets();
            }
        }
        
        if (target.classList.contains('copy-code-btn')) {
            navigator.clipboard.writeText(snippet.code).then(() => {
                target.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => { target.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000);
            });
        }
    });

    addSnippetBtn.addEventListener('click', () => {
        snippetForm.reset();
        snippetId.value = '';
        tagsInput.removeAllTags();
        snippetModalLabel.textContent = 'Add New Snippet';
    });

    searchInput.addEventListener('input', renderSnippets);
    tagsFilter.on('change', renderSnippets);
    
    // Initial Render
    renderSnippets();
}