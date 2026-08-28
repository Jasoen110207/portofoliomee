/**
 * supabase-client.js
 * ------------------------------------------------------------------
 * Satu Supabase client yang dipakai bersama oleh semua file
 * snapshot-*.js (projects, skills, certificates, gpa).
 *
 * PENTING: taruh <script> file ini SETELAH library supabase-js
 * dan SEBELUM semua snapshot-*.js di index.html, contoh:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="assets/js/supabase-client.js"></script>
 *   <script src="assets/js/snapshot-projects.js"></script>
 *   <script src="assets/js/snapshot-skills.js"></script>
 *   <script src="assets/js/snapshot-certificates.js"></script>
 *   <script src="assets/js/snapshot-gpa.js"></script>
 * ------------------------------------------------------------------
 */

const SUPABASE_URL = "https://hleyxofotvllaoejjjqs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H15p2_sb5Cueq5A5BUDNQ_Ste80l28";
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);