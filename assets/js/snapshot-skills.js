/**
 * snapshot-skills.js
 * ------------------------------------------------------------------
 * Kartu "Skills" di Snapshot Bar.
 * Mengambil data dari Supabase (tabel "skils") + Realtime Update.
 * ------------------------------------------------------------------
 */

(function () {
    const CARD_HTML = `
        <button type="button" data-open-skills-modal class="group text-left rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-sky-300 dark:hover:border-sky-800 hover:shadow-sm transition cursor-pointer">
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-code text-sky-500 text-sm"></i>
                <span id="snapshot-skills-count" class="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">0</span>
            </div>
            <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1" data-i18n="snapshot_skills">Skills</p>
        </button>
    `;

    let modalLoaded = false;
    let isSubscribed = false;

    function updateCount(count) {
        const countEl = document.getElementById('snapshot-skills-count');
        if (countEl) {
            countEl.textContent = count;
        }
    }

    function openOverlay() {
        const overlay = document.getElementById('skills-modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    function closeOverlay() {
        const overlay = document.getElementById('skills-modal-overlay');
        if (!overlay) return;
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    }

    // Bangun 1 badge skill (icon + nama) dari 1 baris data Supabase
    function buildSkillCard(item) {
        const name = escapeHtml(item.name);
        const icon = escapeHtml(item.icon || 'fa-solid fa-code');

        return `
            <div class="skill-item flex flex-col items-center justify-center gap-2 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-sky-300 dark:hover:border-sky-800 hover:shadow-sm transition">
                <i class="${icon} text-3xl text-sky-500"></i>
                <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">${name}</span>
            </div>
        `;
    }

    // Ambil data skill dari Supabase dan render ke #skills-grid
    async function loadSkills() {
        const grid = document.getElementById('skills-grid');
        if (!grid) return;

        if (!window.supabaseClient) {
            console.error('snapshot-skills.js: window.supabaseClient belum ada.');
            return;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('skils')
                .select('id, name, icon')
                .order('id', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                grid.innerHTML = '<p class="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8 col-span-full">Belum ada skill.</p>';
                updateCount(0);
                return;
            }

            grid.innerHTML = data.map(buildSkillCard).join('');
            updateCount(data.length);
        } catch (err) {
            console.error('snapshot-skills.js: gagal memuat data skill dari Supabase', err);
            grid.innerHTML = `<p class="text-sm text-red-500 text-center py-8 col-span-full">Gagal memuat data skill: ${err.message}</p>`;
        }
    }

    // Aktifkan Supabase Realtime untuk tabel skils
    function setupRealtime() {
        if (isSubscribed || !window.supabaseClient) return;

        window.supabaseClient
            .channel('realtime-skills-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'skils' },
                (payload) => {
                    console.log('⚡ Realtime Update Skills:', payload);
                    loadSkills(); // Re-fetch otomatis saat data di Supabase berubah
                }
            )
            .subscribe();

        isSubscribed = true;
    }

    function bindCloseEvents() {
        const overlay = document.getElementById('skills-modal-overlay');
        const closeBtn = document.getElementById('skills-modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeOverlay);
        }
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeOverlay();
            });
        }
    }

    function loadSkillsModal(callback) {
        if (modalLoaded) {
            loadSkills().then(() => {
                if (callback) callback();
            });
            return;
        }

        const placeholder = document.getElementById('skills-modal-placeholder');
        if (!placeholder) return;

        fetch('skils.html')
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(async function (html) {
                placeholder.innerHTML = html;
                modalLoaded = true;
                bindCloseEvents();
                await loadSkills();
                setupRealtime();
                if (callback) callback();
            })
            .catch(function (err) {
                console.error('snapshot-skills.js: gagal memuat skils.html', err);
            });
    }

    function renderCard() {
        const container = document.getElementById('snapshot-container');
        if (!container) return;

        container.insertAdjacentHTML('beforeend', CARD_HTML);

        container.querySelectorAll('[data-open-skills-modal]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                loadSkillsModal(openOverlay);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCard();
        loadSkillsModal();
        setupRealtime();
    });
})();