document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const spinnerIcon = document.getElementById('spinner-icon');
    const searchInput = document.getElementById('search-input');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const feedContainer = document.getElementById('releases-feed');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const emptyState = document.getElementById('empty-state');
    const errorMessage = document.getElementById('error-message');
    const btnRetry = document.getElementById('btn-retry');

    // Tweet Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const btnShareTweet = document.getElementById('btn-share-tweet');

    // App State
    let allReleases = [];
    let activeTypeFilter = 'all';

    // Parse the HTML content from the feed to separate individual update blocks
    function parseReleaseContent(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        const updates = [];
        let currentType = 'other';
        let currentContentHTML = '';

        Array.from(tempDiv.childNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'h3') {
                // Save previous update if it exists
                if (currentContentHTML.trim()) {
                    updates.push({
                        type: currentType,
                        content: currentContentHTML
                    });
                }
                // Start a new update block
                currentType = node.textContent.trim().toLowerCase();
                currentContentHTML = '';
            } else {
                // Keep appending elements/text
                currentContentHTML += node.outerHTML || node.textContent;
            }
        });

        // Add the last block
        if (currentContentHTML.trim()) {
            updates.push({
                type: currentType,
                content: currentContentHTML
            });
        }

        // If no <h3> was present in the feed entry, treat everything as "other"
        if (updates.length === 0 && htmlContent.trim()) {
            updates.push({
                type: 'other',
                content: htmlContent
            });
        }

        return updates;
    }

    // Fetch releases from server API
    async function loadReleases() {
        showState('loading');
        btnRefresh.disabled = true;
        spinnerIcon.classList.add('spin');

        try {
            const response = await fetch('/api/releases');
            const data = await response.json();
            
            if (data.success) {
                // Process and restructure releases
                allReleases = data.releases.map(release => {
                    return {
                        date: release.title,
                        link: release.link,
                        rawContent: release.content,
                        items: parseReleaseContent(release.content)
                    };
                });
                renderFeed();
            } else {
                showState('error');
                errorMessage.textContent = data.error || 'Server returned a failure status.';
            }
        } catch (err) {
            showState('error');
            errorMessage.textContent = 'Failed to connect to backend server. Make sure the Flask app is running.';
            console.error('Error fetching release notes:', err);
        } finally {
            btnRefresh.disabled = false;
            spinnerIcon.classList.remove('spin');
        }
    }

    // Render feed to screen
    function renderFeed() {
        const query = searchInput.value.toLowerCase().trim();
        feedContainer.innerHTML = '';
        let matchCount = 0;

        allReleases.forEach((dayGroup, index) => {
            // Filter sub-items
            const filteredItems = dayGroup.items.filter(item => {
                const typeMatches = (activeTypeFilter === 'all' || item.type === activeTypeFilter);
                
                // Temporary text parsing to do clean text searching
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.content;
                const textContent = tempDiv.textContent.toLowerCase();
                
                const searchMatches = (!query || textContent.includes(query));
                return typeMatches && searchMatches;
            });

            if (filteredItems.length > 0) {
                matchCount += filteredItems.length;

                // Create date header
                const dateGroupDiv = document.createElement('div');
                dateGroupDiv.className = 'date-group';
                dateGroupDiv.style.animationDelay = `${index * 0.05}s`;

                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.innerHTML = `
                    <h2 class="date-title">${dayGroup.date}</h2>
                    <div class="date-line"></div>
                `;
                dateGroupDiv.appendChild(dateHeader);

                // Add individual update cards
                filteredItems.forEach(item => {
                    const card = document.createElement('div');
                    card.className = `update-card ${item.type}`;
                    
                    // Header inside card
                    const header = document.createElement('div');
                    header.className = 'card-header';
                    
                    const tag = document.createElement('span');
                    tag.className = 'type-tag';
                    tag.textContent = item.type;
                    
                    const actions = document.createElement('div');
                    actions.className = 'card-actions';
                    
                    // Tweet Button
                    const tweetBtn = document.createElement('button');
                    tweetBtn.className = 'btn-action btn-action-tweet';
                    tweetBtn.title = 'Tweet about this update';
                    tweetBtn.innerHTML = '<i class="fa-brands fa-x-twitter"></i>';
                    tweetBtn.addEventListener('click', () => openTweetComposer(item, dayGroup.date));
                    
                    // Link Button
                    const linkBtn = document.createElement('a');
                    linkBtn.className = 'btn-action';
                    linkBtn.title = 'View release notes on Google Cloud';
                    linkBtn.href = dayGroup.link;
                    linkBtn.target = '_blank';
                    linkBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';

                    actions.appendChild(tweetBtn);
                    actions.appendChild(linkBtn);
                    
                    header.appendChild(tag);
                    header.appendChild(actions);
                    
                    // Content inside card
                    const content = document.createElement('div');
                    content.className = 'card-content';
                    content.innerHTML = item.content;

                    card.appendChild(header);
                    card.appendChild(content);
                    dateGroupDiv.appendChild(card);
                });

                feedContainer.appendChild(dateGroupDiv);
            }
        });

        if (matchCount === 0) {
            showState('empty');
        } else {
            showState('feed');
        }
    }

    // Switch between view states
    function showState(state) {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
        feedContainer.classList.add('hidden');

        if (state === 'loading') {
            loadingState.classList.remove('hidden');
        } else if (state === 'error') {
            errorState.classList.remove('hidden');
        } else if (state === 'empty') {
            emptyState.classList.remove('hidden');
        } else if (state === 'feed') {
            feedContainer.classList.remove('hidden');
        }
    }

    // Open Tweet Composer Modal
    function openTweetComposer(item, date) {
        // Strip HTML to get plain text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.content;
        
        let plainText = tempDiv.textContent
            .replace(/\s+/g, ' ')
            .trim();
        
        // Truncate to make space for hashtags and date
        const typePrefix = item.type.toUpperCase();
        const baseTweet = `[BigQuery Release - ${date}] ${typePrefix}: ${plainText}`;
        const suffix = "\n\n#BigQuery #GoogleCloud";
        
        let finalTweet = baseTweet;
        const limit = 280 - suffix.length;
        
        if (finalTweet.length > limit) {
            finalTweet = finalTweet.substring(0, limit - 3) + "...";
        }
        
        tweetTextarea.value = finalTweet + suffix;
        updateCharCount();
        
        tweetModal.classList.remove('hidden');
        tweetTextarea.focus();
    }

    // Close Modal
    function closeModal() {
        tweetModal.classList.add('hidden');
    }

    // Update Tweet Character Counter
    function updateCharCount() {
        const remaining = 280 - tweetTextarea.value.length;
        charCounter.textContent = remaining;
        
        charCounter.className = '';
        if (remaining < 20 && remaining >= 0) {
            charCounter.classList.add('warning');
        } else if (remaining < 0) {
            charCounter.classList.add('danger');
        }
    }

    // Share/Post to X (formerly Twitter) using Web Intent
    function shareToX() {
        const text = tweetTextarea.value;
        const encodedText = encodeURIComponent(text);
        const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        window.open(url, '_blank');
        closeModal();
    }

    // Event Listeners
    btnRefresh.addEventListener('click', loadReleases);
    btnRetry.addEventListener('click', loadReleases);
    
    searchInput.addEventListener('input', renderFeed);
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Remove active class
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            activeTypeFilter = tab.getAttribute('data-type');
            renderFeed();
        });
    });

    btnCloseModal.addEventListener('click', closeModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeModal();
    });

    tweetTextarea.addEventListener('input', updateCharCount);
    btnShareTweet.addEventListener('click', shareToX);

    // Initial load
    loadReleases();
});
