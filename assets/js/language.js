document.addEventListener("DOMContentLoaded", () => {
    const btnEN = document.getElementById("btn-lang-en");
    const btnID = document.getElementById("btn-lang-id");

    const translations = {
        en: {
            nav_about: "About",
            location: "Indonesia/Bandung",
            badge_student: "Student",
            badge_freelancer: "Freelancer",
            badge_developer: "Developer",
            badge_programmer: "Programmer",
            schedule_btn: "Schedule a Call",
            role_title: "Software Engineer",
            bio_text: "Hi, I'm Barka — a web developer and streetwear enthusiast focused on building modern digital solutions, robust backend architecture, and efficient e-commerce systems.",
            title_experience: "Work Experience",
            exp1_desc: "Handled digital marketing activities for CV Martha Jaya while designing and developing the company's responsive company profile website using HTML, CSS, and JavaScript.",
            title_studies: "Studies",
            study_bsi: "Information Systems Student",
            study_btf: "Studied online marketing and personal branding."
        },

        id: {
            nav_about: "Tentang",
            location: "Indonesia/Bandung",
            badge_student: "Mahasiswa",
            badge_freelancer: "Freelancer",
            badge_developer: "Developer",
            badge_programmer: "Programmer",
            schedule_btn: "Jadwalkan Panggilan",
            role_title: "Software Engineer",
            bio_text: "Halo, saya Barka — seorang web developer yang berfokus membangun solusi digital modern, arsitektur backend yang kuat, dan sistem e-commerce yang efisien.",
            title_experience: "Pengalaman Bekerja",
            exp1_desc: "Menangani aktivitas digital marketing di CV Martha Jaya sekaligus merancang dan mengembangkan website company profile yang responsif menggunakan HTML, CSS, dan JavaScript.",
            title_studies: "Pendidikan",
            study_bsi: "Mahasiswa Sistem Informasi",
            study_btf: "Mempelajari online marketing dan personal branding."
        }
    };

    function setLanguage(lang) {
        document.documentElement.lang = lang;

        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        localStorage.setItem("language", lang);

        if (lang === "en") {
            btnEN.classList.replace("bg-zinc-100", "bg-zinc-200");
            btnID.classList.replace("bg-zinc-200", "bg-zinc-100");
        } else {
            btnID.classList.replace("bg-zinc-100", "bg-zinc-200");
            btnEN.classList.replace("bg-zinc-200", "bg-zinc-100");
        }
    }

    btnEN.addEventListener("click", () => setLanguage("en"));
    btnID.addEventListener("click", () => setLanguage("id"));

    setLanguage(localStorage.getItem("language") || "en");
});