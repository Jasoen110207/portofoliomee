/**
 * snapshot-certificates.js
 * ------------------------------------------------------------------
 * Kartu "Certificates" di Snapshot Bar.
 * Mengambil data dari Supabase (tabel "certificate") + Realtime Update.
 * ------------------------------------------------------------------
 */

(function () {
    const CARD_HTML = `
        <button type="button" data-open-cert-modal class="group text-left rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-sky-300 dark:hover:border-sky-800 hover:shadow-sm transition cursor-pointer">
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-certificate text-sky-500 text-sm"></i>
                <span id="snapshot-certs-count" class="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">0</span>
            </div>
            <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1" data-i18n="snapshot_certs">Certificates</p>
        </button>
    `;

    let modalLoaded = false;
    let isSubscribed = false;

    function updateCount(count) {
        const countEl = document.getElementById('snapshot-certs-count');
        if (countEl) {
            countEl.textContent = count;
        }
    }

    function openOverlay() {
        const overlay = document.getElementById('cert-modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    function closeOverlay() {
        const overlay = document.getElementById('cert-modal-overlay');
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

    // Bangun 1 blok <a> sertifikat dari 1 baris data Supabase
    function buildCertCard(item) {
        const title = escapeHtml(item.title);
        const issuer = escapeHtml(item.issuer);
        const year = escapeHtml(item.year);
        const category = escapeHtml(item.category);
        const description = escapeHtml(item.description);
        const imageUrl = item.image_url;
        const linkUrl = item.credential_url || item.image_url;

        const imageBlock = imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden'); this.nextElementSibling.classList.add('flex');">`
            : '';

        const categoryBadge = item.category
            ? `<span class="inline-block text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 rounded-full px-2 py-0.5 mb-1">${category}</span><br>`
            : '';

        const descriptionBlock = item.description
            ? `<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">${description}</p>`
            : '';

        return `
            <a href="${linkUrl ? escapeHtml(linkUrl) : 'javascript:void(0)'}" target="_blank" rel="noopener noreferrer" class="group block rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
                <div class="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
                    ${imageBlock}
                    <div class="cert-fallback ${imageUrl ? 'hidden' : 'flex'} absolute inset-0 flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
                        <i class="fa-solid fa-certificate text-3xl"></i>
                        <span class="text-xs font-medium">Belum diunggah</span>
                    </div>
                </div>
                <div class="p-3">
                    ${categoryBadge}
                    <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">${title}</p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">${issuer}${year ? ' — Tahun ' + year : ''}</p>
                    ${descriptionBlock}
                </div>
            </a>
        `;
    }

    // Ambil data sertifikat dari Supabase dan render ke #certificates-grid
    async function loadCertificates() {
        const grid = document.getElementById('certificates-grid');
        if (!grid) return;

        if (!window.supabaseClient) {
            console.error('snapshot-certificates.js: window.supabaseClient belum ada.');
            return;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('certificate')
                .select('id, title, issuer, year, category, image_url, credential_url, description, sort_order, is_active')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                grid.innerHTML = '<p class="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8 col-span-full">Belum ada sertifikat.</p>';
                updateCount(0);
                return;
            }

            grid.innerHTML = data.map(buildCertCard).join('');
            updateCount(data.length);
        } catch (err) {
            console.error('snapshot-certificates.js: gagal memuat data sertifikat dari Supabase', err);
            grid.innerHTML = `<p class="text-sm text-red-500 text-center py-8 col-span-full">Gagal memuat data sertifikat: ${err.message}</p>`;
        }
    }

    // Aktifkan Supabase Realtime untuk tabel certificate
    function setupRealtime() {
        if (isSubscribed || !window.supabaseClient) return;

        window.supabaseClient
            .channel('realtime-certificate-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'certificate' },
                (payload) => {
                    console.log('⚡ Realtime Update Certificate:', payload);
                    loadCertificates(); // Re-fetch otomatis saat data di Supabase berubah
                }
            )
            .subscribe();

        isSubscribed = true;
    }

    function bindCloseEvents() {
        const overlay = document.getElementById('cert-modal-overlay');
        const closeBtn = document.getElementById('cert-modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeOverlay);
        }
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeOverlay();
            });
        }
    }

    function loadCertModal(callback) {
        if (modalLoaded) {
            loadCertificates().then(() => {
                if (callback) callback();
            });
            return;
        }

        const placeholder = document.getElementById('sertifikat-modal-placeholder');
        if (!placeholder) return;

        fetch('sertifikat.html')
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(async function (html) {
                placeholder.innerHTML = html;
                modalLoaded = true;
                bindCloseEvents();
                await loadCertificates();
                setupRealtime();
                if (callback) callback();
            })
            .catch(function (err) {
                console.error('snapshot-certificates.js: gagal memuat sertifikat.html', err);
            });
    }

    function renderCard() {
        const container = document.getElementById('snapshot-container');
        if (!container) return;

        container.insertAdjacentHTML('beforeend', CARD_HTML);

        container.querySelectorAll('[data-open-cert-modal]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                loadCertModal(openOverlay);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCard();
        loadCertModal();
        setupRealtime();
    });
})();