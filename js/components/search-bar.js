/**
 * Search Bar Component
 * Fuzzy search with dropdown suggestions.
 */

import { search, highlight } from '../search.js';
import { navigate } from '../router.js';
import { t } from '../i18n.js';
import { debounce, $ } from '../utils/dom.js';

let isOpen = false;
let lastQuery = '';

export function init() {
  bindToggle();
}

function bindToggle() {
  const toggleBtn = $('#search-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      // If on home page, focus the main search
      const mainSearch = $('#hero-search');
      if (mainSearch) {
        mainSearch.focus();
      } else {
        // Navigate to home and focus search
        navigate('/');
        setTimeout(() => {
          const s = $('#hero-search');
          if (s) s.focus();
        }, 100);
      }
    });
  }
}

/**
 * Create a search bar HTML string for embedding in pages.
 */
export function createSearchBar(options = {}) {
  const { id = 'search-input', placeholder = 'searchPlaceholder', large = false } = options;

  return `
    <div class="search-bar ${large ? 'search-bar--lg' : ''}" role="combobox" aria-expanded="false" aria-haspopup="listbox" id="search-wrapper-${id}">
      <span class="search-bar__icon">
        <span class="material-symbols-rounded" aria-hidden="true">search</span>
      </span>
      <input
        type="search"
        id="${id}"
        class="search-bar__input"
        placeholder="${t(placeholder)}"
        autocomplete="off"
        aria-label="${t(placeholder)}"
        aria-autocomplete="list"
        aria-controls="suggestions-${id}"
        role="searchbox"
      >
      <button class="search-bar__clear icon-btn" aria-label="Clear search" style="width:32px;height:32px">
        <span class="material-symbols-rounded" aria-hidden="true" style="font-size:18px">close</span>
      </button>
      <div class="search-suggestions" id="suggestions-${id}" role="listbox"></div>
    </div>
  `;
}

/**
 * Attach event listeners to a search bar instance.
 */
export function attachSearchListeners(inputId, onSelect) {
  const input = document.getElementById(inputId);
  const wrapper = document.getElementById(`search-wrapper-${inputId}`);
  const suggestions = document.getElementById(`suggestions-${inputId}`);
  const clearBtn = wrapper?.querySelector('.search-bar__clear');

  if (!input || !suggestions) return;

  const handleSearch = debounce((query) => {
    lastQuery = query;
    if (query.trim().length < 2) {
      closeSuggestions();
      return;
    }

    const results = search(query, { limit: 8 });
    renderSuggestions(results, query, suggestions, inputId, onSelect);
  }, 200);

  input.addEventListener('input', (e) => handleSearch(e.target.value));

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      handleSearch(input.value);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSuggestions();
      input.blur();
    }
    if (e.key === 'Enter') {
      closeSuggestions();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const first = suggestions.querySelector('[role="option"]');
      if (first) first.focus();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      closeSuggestions();
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper?.contains(e.target)) {
      closeSuggestions();
    }
  });

  function closeSuggestions() {
    suggestions.classList.remove('open');
    suggestions.innerHTML = '';
    wrapper?.setAttribute('aria-expanded', 'false');
    isOpen = false;
  }

  // Expose close function
  input._closeSuggestions = closeSuggestions;
}

function renderSuggestions(results, query, container, inputId, onSelect) {
  if (results.length === 0) {
    container.innerHTML = `
      <div style="padding:var(--space-4);text-align:center;color:var(--text-secondary);font-size:var(--text-sm)">
        <span class="material-symbols-rounded" aria-hidden="true" style="font-size:32px;display:block;margin-bottom:var(--space-2);color:var(--text-tertiary)">search_off</span>
        <span data-i18n="noResults">No results found for "${query}"</span>
      </div>
    `;
    container.classList.add('open');
    return;
  }

  const typeLabels = {
    service: t('search.service'),
    department: t('search.department'),
    faq: t('search.faq'),
    glossary: t('search.glossary'),
    'life-event': t('search.lifeEvent'),
  };

  container.innerHTML = results.map(r => `
    <a href="${r.route}" class="search-suggestion" role="option" data-route="${r.route}">
      <span class="search-suggestion-icon">
        <span class="material-symbols-rounded" aria-hidden="true" style="font-size:20px">${r.icon}</span>
      </span>
      <div class="search-suggestion-text">
        <div class="search-suggestion-title">${highlight(r.title, query)}</div>
        <div class="search-suggestion-category">${typeLabels[r.type] || r.type}</div>
      </div>
    </a>
  `).join('');

  container.classList.add('open');

  // Handle clicks
  container.querySelectorAll('.search-suggestion').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.dataset.route;
      if (onSelect) {
        onSelect(route);
      } else {
        navigate(route.replace('#', ''));
      }
      const input = document.getElementById(inputId);
      if (input?.closeSuggestions) input._closeSuggestions();
      else {
        container.classList.remove('open');
        container.innerHTML = '';
      }
    });
  });

  // Keyboard navigation
  container.querySelectorAll('[role="option"]').forEach((opt, i, all) => {
    opt.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        all[i + 1]?.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i === 0) document.getElementById(inputId)?.focus();
        else all[i - 1]?.focus();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        opt.click();
      }
      if (e.key === 'Escape') {
        document.getElementById(inputId)?.focus();
        container.classList.remove('open');
      }
    });
  });
}
