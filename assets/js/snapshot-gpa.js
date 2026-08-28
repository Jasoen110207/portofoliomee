/**
 * snapshot-gpa.js
 * Kartu "GPA / IPK" di Snapshot Bar + Realtime Update dari Supabase.
 */

(function () {
    const CARD_HTML = `
        <button type="button" data-open-gpa-modal class="group text-left rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-sky-300 dark:hover:border-sky-800 hover:shadow-sm transition cursor-pointer">
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-graduation-cap text-sky-500 text-sm"></i>
                <span id="snapshot-gpa-count" class="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">0</span>
            </div>
            <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">GPA / KHS</p>
        </button>
    `;

    let modalLoaded = false;
    let isSubscribed = false;

    function updateCount(count) {
        const countEl = document.getElementById('snapshot-gpa-count');
        if (countEl) countEl.textContent = count;
    }

    function openOverlay() {
        const overlay = document.getElementById('gpa-modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    function closeModal() {
        const overlay = document.getElementById('gpa-modal-overlay');
        if (!overlay) return;
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    }

    function escapeAttribute(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    }

    async function loadKHS() {
        const gpaGrid = document.getElementById('gpa-grid');
        const gpaLoading = document.getElementById('gpa-loading');
        const gpaEmpty = document.getElementById('gpa-empty');
        const gpaError = document.getElementById('gpa-error');

        if (!window.supabaseClient) return;

        try {
            const { data, error } = await window.supabaseClient
                .from('IPK')
                .select('id, semester, image_url')
                .order('semester', { ascending: true });

            if (error) throw error;

            const total = data ? data.length : 0;
            updateCount(total);

            if (!gpaGrid) return;

            if (!data || total === 0) {
                if (gpaLoading) gpaLoading.classList.add('hidden');
                if (gpaError) gpaError.classList.add('hidden');
                gpaGrid.classList.add('hidden');
                if (gpaEmpty) gpaEmpty.classList.remove('hidden');
                return;
            }

            gpaGrid.innerHTML = '';
            if (gpaEmpty) gpaEmpty.classList.add('hidden');
            if (gpaError) gpaError.classList.add('hidden');

            data.forEach((item) => {
                const semester = Number(item.semester);
                const card = document.createElement('a');
                card.className = 'group block rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition';

                if (item.image_url) {
                    card.href = item.image_url;
                    card.target = '_blank';
                    card.rel = 'noopener noreferrer';
                } else {
                    card.href = 'javascript:void(0)';
                    card.style.cursor = 'default';
                }

                card.innerHTML = `
                    <div class="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
                        ${
                            item.image_url
                                ? `<img src="${escapeAttribute(item.image_url)}" alt="KHS Semester ${semester}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">`
                                : ''
                        }
                        <div class="khs-fallback ${item.image_url ? 'hidden' : 'flex'} absolute inset-0 flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
                            <i class="fa-solid fa-graduation-cap text-3xl"></i>
                            <span class="text-xs font-medium">Belum diunggah</span>
                        </div>
                    </div>
                    <div class="p-3">
                        <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Semester ${semester}</p>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400">Klik untuk lihat detail nilai</p>
                    </div>
                `;

                gpaGrid.appendChild(card);
            });

            if (gpaLoading) gpaLoading.classList.add('hidden');
            gpaGrid.classList.remove('hidden');

        } catch (error) {
            console.error('snapshot-gpa.js Error:', error);
            if (gpaLoading) gpaLoading.classList.add('hidden');
            if (gpaError) gpaError.classList.remove('hidden');
        }
    }

    function setupRealtime() {
        if (isSubscribed || !window.supabaseClient) return;

        window.supabaseClient
            .channel('realtime-ipk-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'IPK' },
                (payload) => {
                    console.log('⚡ Realtime Update IPK:', payload);
                    loadKHS();
                }
            )
            .subscribe();

        isSubscribed = true;
    }

    function bindCloseEvents() {
        const overlay = document.getElementById('gpa-modal-overlay');
        const closeBtn = document.getElementById('gpa-modal-close');

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });
        }
    }

    function loadGPAModal(callback) {
        if (modalLoaded) {
            loadKHS().then(() => {
                if (callback) callback();
            });
            return;
        }

        const placeholder = document.getElementById('gpa-modal-placeholder');
        if (!placeholder) return;

        fetch('gpa.html')
            .then((res) => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(async (html) => {
                placeholder.innerHTML = html;
                modalLoaded = true;
                bindCloseEvents();
                await loadKHS();
                setupRealtime();
                if (callback) callback();
            })
            .catch((err) => {
                console.error('snapshot-gpa.js: Gagal memuat gpa.html', err);
            });
    }

    function renderCard() {
        const container = document.getElementById('snapshot-container');
        if (!container) {
            console.warn('snapshot-gpa.js: #snapshot-container belum ada di DOM');
            return;
        }

        // Jangan render ganda jika kartu sudah ada
        if (container.querySelector('[data-open-gpa-modal]')) return;

        container.insertAdjacentHTML('beforeend', CARD_HTML);

        container.querySelectorAll('[data-open-gpa-modal]').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                loadGPAModal(openOverlay);
            });
        });
    }

    function init() {
        renderCard();
        loadGPAModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();   