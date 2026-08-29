/**
 * work.js
 * Fetch data Supabase & Render dengan Custom CSS Class + Live Realtime
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function loadWork() {
  const grid = document.getElementById("work-grid");
  if (!grid) return;

  if (!window.supabaseClient) {
    console.error("work.js: window.supabaseClient belum dimuat.");
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("work")
      .select('*')
      .eq("status", "Published")
      .order("id", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = `<p style="color: #71717a; font-size: 0.875rem; padding: 1rem 0;">No work experience found.</p>`;
      return;
    }

    grid.innerHTML = data.map(item => {
      const title = escapeHtml(item.title);
      const companyName = escapeHtml(item.company || item.Company || '');
      const location = escapeHtml(item.location);
      const description = escapeHtml(item.description);
      const image = item.image;
      
      const techList = item.technologies 
        ? item.technologies.split(",").filter(Boolean)
        : [];

      return `
        <article class="work-card">
          
          ${image ? `
            <div class="work-image-wrapper">
              <img src="${escapeHtml(image)}" alt="${title}" loading="lazy">
            </div>
          ` : ''}

          <div class="work-content">
            
            <div class="work-header">
              <div>
                <h3 class="work-title">${title}</h3>
                <div class="work-company">${companyName}</div>
              </div>

              ${location ? `
                <span class="work-location">
                  📍 ${location}
                </span>
              ` : ''}
            </div>

            <p class="work-description">
              ${description}
            </p>

            ${techList.length > 0 ? `
              <div class="work-tech-container">
                ${techList.map(t => `<span class="work-tech-chip">${escapeHtml(t.trim())}</span>`).join('')}
              </div>
            ` : ''}

          </div>

        </article>
      `;
    }).join("");

  } catch (err) {
    console.error("Work Error:", err);
    grid.innerHTML = `<p style="color: #ef4444; font-size: 0.875rem; padding: 1rem 0;">Error loading data: ${err.message}</p>`;
  }
}

// Inisialisasi & Realtime Listener
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("work-grid");
  if (grid) {
    grid.innerHTML = `<p style="color: #71717a; font-size: 0.875rem; padding: 1rem 0;">Loading work experience...</p>`;
  }

  // 1. Fetch data saat halaman pertama kali dibuka
  loadWork();

  // 2. Cek update tiap kali kamu kembali ke tab portofolio dari dashboard Supabase
  window.addEventListener("focus", () => {
    loadWork();
  });

  // 3. (Opsional) Auto-refresh data setiap 5 detik secara silent
  setInterval(() => {
    loadWork();
  }, 5000);
});