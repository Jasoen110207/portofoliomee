/**
 * modal.js
 * ------------------------------------------------------------------
 * Mengurus PENUTUPAN modal (Projects, Skills, Certificates, Talent):
 * - Klik tombol silang (X)
 * - Klik di area gelap di luar panel
 * - Tekan tombol Escape
 *
 * Pakai EVENT DELEGATION (listener dipasang di document, bukan
 * langsung ke elemen modal) supaya tetap berfungsi walau markup
 * modal baru disuntik ke DOM belakangan lewat fetch() di
 * snapshot-projects.js / snapshot-skills.js / snapshot-certificates.js
 * / talent.js.
 *
 * Logic MEMBUKA modal ada di masing-masing file snapshot-*.js /
 * talent.js supaya tiap kartu Snapshot Bar tetap mandiri.
 * ------------------------------------------------------------------
 */

(function () {
    // Daftar modal yang perlu ditangani: [id overlay, id tombol close]
    // 'talent-modal-overlay' aman didaftarkan walau elemennya belum ada —
    // getElementById cuma akan balikin null dan dilewati saja.
    const MODALS = [
        ['project-modal-overlay', 'project-modal-close'],
        ['skills-modal-overlay', 'skills-modal-close'],
        ['cert-modal-overlay', 'cert-modal-close'],
        ['talent-modal-overlay', 'talent-modal-close'],
        ['gpa-modal-overlay', 'gpa-modal-close'],
        ['work-modal-overlay', 'work-modal-close'],
    ];

    function closeOverlay(overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    }

    // 1. Klik tombol silang (X) ATAU klik area gelap di luar panel
    //    Dicek ulang tiap klik (bukan sekali di awal) supaya modal
    //    yang baru datang dari fetch() ikut kebaca.
    document.addEventListener('click', function (e) {
        MODALS.forEach(function ([overlayId, closeBtnId]) {
            const overlay = document.getElementById(overlayId);
            if (!overlay) return;

            const closeBtn = document.getElementById(closeBtnId);
            const clickedCloseBtn = closeBtn && closeBtn.contains(e.target);
            const clickedBackdrop = e.target === overlay;

            if (clickedCloseBtn || clickedBackdrop) {
                closeOverlay(overlay);
            }
        });
    });

    // 2. Tombol Escape menutup modal mana pun yang sedang terbuka
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        MODALS.forEach(function ([overlayId]) {
            const overlay = document.getElementById(overlayId);
            if (overlay) closeOverlay(overlay);
        });
    });
    document.addEventListener("DOMContentLoaded", () => {
    const modalOverlay = document.getElementById("gpa-modal-overlay");
    const openBtn = document.getElementById("gpa-trigger-btn"); // Beri ID ini pada tombol/bar GPA di UI
    const closeBtn = document.getElementById("gpa-modal-close");

    if (openBtn && modalOverlay) {
        openBtn.addEventListener("click", () => {
            modalOverlay.classList.remove("hidden");
            modalOverlay.classList.add("flex");
            
            // Jalankan pencarian data Supabase saat modal dibuka
            if (typeof window.loadKHS === "function") {
                window.loadKHS();
            }
        });
    }

    if (closeBtn && modalOverlay) {
        closeBtn.addEventListener("click", () => {
            modalOverlay.classList.add("hidden");
            modalOverlay.classList.remove("flex");
        });
    }
});
})();
