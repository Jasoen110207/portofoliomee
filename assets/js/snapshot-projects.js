/**
 * snapshot-projects.js
 * ------------------------------------------------------------------
 * Kartu "Projects" di Snapshot Bar.
 * Mengambil data dari Supabase (tabel "projects") + Realtime Update.
 * ------------------------------------------------------------------
 */

(function () {
    const CARD_HTML = `
        <button type="button" data-open-project-modal class="group text-left rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-sky-300 dark:hover:border-sky-800 hover:shadow-sm transition cursor-pointer">
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-diagram-project text-sky-500 text-sm"></i>
                <span id="snapshot-projects-count" class="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">0</span>
            </div>
            <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1" data-i18n="snapshot_projects">Projects</p>
        </button>
    `;

    let modalLoaded = false;
    let isSubscribed = false;

    function updateCount(count) {
        const countEl = document.getElementById('snapshot-projects-count');
        if (countEl) {
            countEl.textContent = count;
        }
    }

    function openOverlay() {
        const overlay = document.getElementById('project-modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    function closeOverlay() {
        const overlay = document.getElementById('project-modal-overlay');
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

    // Render 1 item project
    function buildProjectCard(item) {
        const title = escapeHtml(item.title);
        const description = escapeHtml(item.description);
        const techStack = escapeHtml(item.tech_stack);
        const thumbnail = item.thumbnail;

        const thumbnailBlock = thumbnail
            ? `
                <div class="pt-2">
                    <div class="rounded-2xl overflow-hidden bg-zinc-900 dark:bg-zinc-900/80 p-2 shadow-md max-w-lg border border-zinc-800">
                        <img src="${escapeHtml(thumbnail)}" alt="${title}" class="rounded-xl w-full h-48 object-contain" loading="lazy">
                    </div>
                </div>
            `
            : '';

        return `
            <div class="project-item space-y-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/40">
                <div>
                    <h3 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">${title}</h3>
                    ${techStack ? `<p class="text-xs font-medium text-sky-600 dark:text-sky-400 mt-0.5">${techStack}</p>` : ''}
                </div>
                <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">${description}</p>
                ${thumbnailBlock}
            </div>
        `;
    }

    // Ambil data project dari Supabase & render ke grid
    async function loadProjects() {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;

        if (!window.supabaseClient) {
            console.error('snapshot-projects.js: window.supabaseClient belum dimuat.');
            return;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('projects')
                .select('id, title, description, tech_stack, thumbnail, status')
                .eq('status', 'Published')
                .order('id', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                grid.innerHTML = '<p class="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">Belum ada project.</p>';
                updateCount(0);
                return;
            }

            grid.innerHTML = data.map(buildProjectCard).join('');
            updateCount(data.length);
        } catch (err) {
            console.error('snapshot-projects.js Error:', err);
            grid.innerHTML = `<p class="text-sm text-red-500 text-center py-8">Gagal memuat data project: ${err.message}</p>`;
        }
    }

    // Aktifkan Supabase Realtime untuk tabel projects
    function setupRealtime() {
        if (isSubscribed || !window.supabaseClient) return;

        window.supabaseClient
            .channel('public:projects')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                (payload) => {
                    console.log('Perubahan data Projects terdeteksi:', payload);
                    loadProjects(); // Re-fetch otomatis saat data di Supabase berubah
                }
            )
            .subscribe();

        isSubscribed = true;
    }

    function bindCloseEvents() {
        const overlay = document.getElementById('project-modal-overlay');
        const closeBtn = document.getElementById('project-modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeOverlay);
        }
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeOverlay();
            });
        }
    }

    function loadProjectModal(callback) {
        if (modalLoaded) {
            loadProjects().then(() => {
                if (callback) callback();
            });
            return;
        }

        const placeholder = document.getElementById('project-modal-placeholder');
        if (!placeholder) return;

        fetch('project.html')
            .then((res) => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(async (html) => {
                placeholder.innerHTML = html;
                modalLoaded = true;
                bindCloseEvents();
                await loadProjects();
                setupRealtime();
                if (callback) callback();
            })
            .catch((err) => {
                console.error('snapshot-projects.js: Gagal memuat project.html', err);
            });
    }

    function renderCard() {
        const container = document.getElementById('snapshot-container');
        if (!container) return;

        container.insertAdjacentHTML('beforeend', CARD_HTML);

        container.querySelectorAll('[data-open-project-modal]').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                loadProjectModal(openOverlay);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderCard();
        loadProjectModal();
    });
})();