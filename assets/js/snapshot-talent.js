/**
 * snapshot-talent.js
 * Talent Showcase - CV Martha Jaya Creative Works
 * Sumber data: Supabase (tabel "content") + Realtime Updates
 */

(function () {

    // ==== KONFIGURASI SUPABASE ====
    const SUPABASE_URL = "https://hleyxofotvllaoejjjqs.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable__H15p2_sb5Cueq5A5BUDNQ_Ste80l28";
    const SUPABASE_TABLE = "content";
    // ================================

    const CARD_HTML = `
        <button type="button"
            data-open-talent-modal
            class="group text-left rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 hover:border-sky-300 dark:hover:border-sky-800 hover:shadow-sm transition cursor-pointer">

            <div class="flex items-center justify-between">
                <i class="fa-solid fa-star text-sky-500 text-sm"></i>
                <span id="snapshot-talent-count"
                    class="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                    0
                </span>
            </div>

            <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                Talent
            </p>

        </button>
    `;

    let modalLoaded = false;
    let isSubscribed = false;

    function openOverlay() {
        const overlay = document.getElementById("talent-modal-overlay");
        if (!overlay) return;

        overlay.classList.remove("hidden");
        overlay.classList.add("flex");
        document.body.classList.add("overflow-hidden");
    }

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function updateCount(total) {
        const el = document.getElementById("snapshot-talent-count");
        if (el) el.textContent = total;
    }

    function showGridMessage(message) {
        const grid = document.getElementById("talent-grid");
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-span-full text-center py-10 text-zinc-400">
                ${message}
            </div>
        `;
    }

    function isUrl(value) {
        return /^https?:\/\//i.test(String(value || "").trim());
    }

    // ---- Ambil data dari Supabase REST API ----
    async function fetchTalentRows() {
        const endpoint =
            `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}` +
            `?select=id,title,platform,url,thumbnail,status,date` +
            `&status=eq.Published` +
            `&order=id.asc`;

        const res = await fetch(endpoint, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!res.ok) {
            throw new Error("Supabase HTTP " + res.status);
        }

        const rows = await res.json();

        return rows.map(r => ({
            Kode: r.id,
            Title: r.title,
            Platform: r.platform || "TikTok",
            Link: r.url,
            Thumbnail: r.thumbnail || ""
        }));
    }

    // ---- Thumbnail otomatis via TikTok oEmbed ----
    const THUMB_CACHE_KEY = "talentThumbCache";

    function loadThumbCache() {
        try {
            return JSON.parse(localStorage.getItem(THUMB_CACHE_KEY) || "{}");
        } catch (e) {
            return {};
        }
    }

    function saveThumbCache(cache) {
        try {
            localStorage.setItem(THUMB_CACHE_KEY, JSON.stringify(cache));
        } catch (e) {}
    }

    async function fetchOEmbedThumb(url) {
        const res = await fetch(
            "https://www.tiktok.com/oembed?url=" + encodeURIComponent(url)
        );
        if (!res.ok) throw new Error("oEmbed HTTP " + res.status);
        const data = await res.json();
        return data.thumbnail_url || null;
    }

    function setCardThumb(code, thumbUrl) {
        const holder = document.querySelector(`[data-thumb-holder="${code}"]`);
        if (!holder || !thumbUrl) return;

        holder.innerHTML = `
            <img src="${thumbUrl}" alt="${code}"
                 class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
        `;
    }

    function fetchMissingThumbnails(rows) {
        const cache = loadThumbCache();

        rows.forEach(row => {
            const code = row.Kode;
            const hasThumb = isUrl(row.Thumbnail) || (row.Thumbnail && row.Thumbnail.trim() !== "");

            if (hasThumb) return;

            if (cache[row.Link]) {
                setCardThumb(code, cache[row.Link]);
                return;
            }

            fetchOEmbedThumb(row.Link)
                .then(thumbUrl => {
                    if (!thumbUrl) return;
                    cache[row.Link] = thumbUrl;
                    saveThumbCache(cache);
                    setCardThumb(code, thumbUrl);
                })
                .catch(err => {
                    console.warn("Gagal ambil thumbnail TikTok untuk", row.Link, err);
                });
        });
    }

    // ---- Render kartu ----
    function cardForRow(row) {
        const code = row.Kode || `CW-${String(Math.random()).slice(2, 5)}`;
        const title = escapeHtml(row.Title || code);
        const link = row.Link;
        const platform = row.Platform || "TikTok";
        const hasThumb = isUrl(row.Thumbnail) || (row.Thumbnail && row.Thumbnail.trim() !== "");

        const iconClass = platform.toLowerCase() === "tiktok"
            ? "fa-brands fa-tiktok"
            : platform.toLowerCase() === "instagram"
                ? "fa-brands fa-instagram"
                : "fa-brands fa-youtube";

        const media = hasThumb
            ? `<img src="${row.Thumbnail}" alt="${code}"
                 class="w-full h-full object-cover group-hover:scale-105 transition duration-500">`
            : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                 <i class="${iconClass} text-white/30 text-5xl"></i>
               </div>`;

        return `
        <a href="${link}"
           target="_blank"
           rel="noopener noreferrer"
           class="group block rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-800 shadow hover:shadow-xl transition duration-300 hover:-translate-y-1">

            <div class="relative aspect-[9/16] overflow-hidden" data-thumb-holder="${code}">
                ${media}
            </div>

            <div class="relative -mt-24 pointer-events-none">
                <div class="absolute inset-0 bg-black/20"></div>
                <div class="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
                    <i class="${iconClass} text-white text-lg"></i>
                </div>
                <div class="absolute bottom-4 left-4 right-4">
                    <h3 class="text-white font-bold text-sm leading-snug drop-shadow">${title}</h3>
                </div>
            </div>

        </a>
        `;
    }

    function loadTalentData(callback) {
        fetchTalentRows()
            .then(rows => {
                const grid = document.getElementById("talent-grid");

                if (grid) {
                    grid.innerHTML = rows.length
                        ? rows.map(cardForRow).join("")
                        : `<div class="col-span-full text-center py-10 text-zinc-400">
                            Belum ada konten.
                        </div>`;

                    fetchMissingThumbnails(rows);
                }

                updateCount(rows.length);
                callback && callback();
            })
            .catch(err => {
                console.error(err);
                showGridMessage("Gagal memuat data dari Supabase.");
            });
    }

    // ---- Setup Supabase Realtime Listener ----
    function setupRealtime() {
        if (isSubscribed || !window.supabaseClient) return;

        window.supabaseClient
            .channel('realtime-talent-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: SUPABASE_TABLE },
                (payload) => {
                    console.log('⚡ Realtime Update Talent (Content):', payload);
                    loadTalentData();
                }
            )
            .subscribe();

        isSubscribed = true;
    }

    function loadTalentModal(callback) {
        if (modalLoaded) {
            loadTalentData(callback);
            return;
        }

        const placeholder = document.getElementById("talent-modal-placeholder");

        if (!placeholder) return;

        fetch("./talenta.html")
            .then(r => {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
                modalLoaded = true;
                loadTalentData(callback);
                setupRealtime();
            })
            .catch(console.error);
    }

    function renderCard() {
        const container = document.getElementById("snapshot-container");

        if (!container) return;

        container.insertAdjacentHTML("beforeend", CARD_HTML);

        container
            .querySelector("[data-open-talent-modal]")
            ?.addEventListener("click", e => {
                e.preventDefault();
                loadTalentModal(openOverlay);
            });
    }

    window.closeTalentModal = function () {
        const overlay = document.getElementById("talent-modal-overlay");
        if (!overlay) return;

        overlay.classList.add("hidden");
        overlay.classList.remove("flex");

        document.body.classList.remove("overflow-hidden");
    };

    document.addEventListener("DOMContentLoaded", () => {
        renderCard();
        loadTalentModal();
        setupRealtime();
    });

})();