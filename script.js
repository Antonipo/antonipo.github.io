let currentLang = 'en';
let currentData = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Initialization
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Attach toggle listeners
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('lang-toggle').addEventListener('click', toggleLang);

    // Tab Listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });

    // 2. Fetch and render initial data
    loadData(currentLang);
});

function loadData(lang) {
    const file = lang === 'es' ? 'data.json' : 'data-en.json';
    fetch(file)
        .then(response => response.json())
        .then(data => {
            currentData = data;
            renderAll(data);
        })
        .catch(err => console.error("Error loading portfolio data:", err));
}

function renderAll(data) {
    renderNav(data.ui);
    renderTicker(data.skills);
    renderHero(data.hero, data.contact);
    renderExperience(data.experience, data.ui);
    renderSkills(data.skills, data.ui);
    renderProjects(data.projects, data.ui);
    renderPackages(data.packages, data.ui);
    renderModals(data.projects, data.packages);

    // Re-attach Modal Logic after DOM is rebuilt
    attachModalLogic();

    // Restore state from URL hash (after all content is rendered)
    restoreFromHash();
}

function toggleTheme() {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function toggleLang() {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    document.getElementById('lang-toggle').innerText = currentLang === 'es' ? 'ES/EN' : 'EN/ES';
    loadData(currentLang);
}

function handleTabClick(e) {
    // Remove active from all tabs and views
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(v => {
        v.classList.remove('active-view');
        v.classList.add('hidden-view');
    });

    // Set active to clicked tab and corresponding view
    const targetId = e.target.getAttribute('data-target');
    e.target.classList.add('active');
    const targetView = document.getElementById(targetId);
    targetView.classList.remove('hidden-view');
    targetView.classList.add('active-view');

    // Update URL hash for shareability
    const hashMap = { 'projects-view': 'projects', 'packages-view': 'packages' };
    history.replaceState(null, '', '#' + (hashMap[targetId] || targetId));
}

// ── Hash-based deep linking ──────────────────────────────────────────────────

/**
 * Read the current URL hash and restore the corresponding UI state.
 * Called after all content has been rendered.
 */
function restoreFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    // Tab switching
    if (hash === 'packages') {
        const btn = document.querySelector('[data-target="packages-view"]');
        if (btn) btn.click();
        return;
    }
    if (hash === 'projects') {
        const btn = document.querySelector('[data-target="projects-view"]');
        if (btn) btn.click();
        return;
    }

    // Section scroll (experience / skills)
    if (hash === 'experience' || hash === 'skills') {
        const targetEl = document.querySelector('.' + hash + '-panel');
        if (targetEl) {
            setTimeout(() => {
                const header = document.querySelector('.top-header');
                const headerHeight = header ? header.offsetHeight : 0;
                const rect = targetEl.getBoundingClientRect();
                const scrollTop = window.pageYOffset + rect.top - headerHeight - 4;
                window.scrollTo({ top: scrollTop, behavior: 'smooth' });
            }, 100);
        }
        return;
    }

    // Modal opening: e.g. #modal-proj-0, #modal-pkg-1, #modal-exp-0
    if (hash.startsWith('modal-')) {
        const modal = document.getElementById(hash);
        if (modal) {
            setTimeout(() => {
                document.getElementById('modal-overlay').style.display = 'block';
                modal.style.display = 'block';
            }, 150);
        }
    }
}

function renderNav(ui) {
    document.getElementById('nav-container').innerHTML = `
        <span class="nav-item active-nav" data-target="center-panel">${ui.nav_projects}</span>
        <span class="nav-item" data-target="experience-panel">${ui.nav_experience}</span>
        <span class="nav-item" data-target="skills-panel">${ui.nav_skills}</span>
    `;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active from all nav items
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
            e.target.classList.add('active-nav');

            const targetClass = e.target.getAttribute('data-target');
            const targetEl = document.querySelector('.' + targetClass);
            if (targetEl) {
                const isDesktop = window.innerWidth > 1024;

                // Map target class to a clean hash
                const navHashMap = {
                    'center-panel': 'projects',
                    'experience-panel': 'experience',
                    'skills-panel': 'skills'
                };
                const hashVal = navHashMap[targetClass] || targetClass;

                if (isDesktop && (targetClass === 'experience-panel' || targetClass === 'skills-panel')) {
                    // Desktop: show modal overlay
                    const modalId = targetClass === 'experience-panel' ? 'modal-exp-all' : 'modal-skills-all';
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        document.getElementById('modal-overlay').style.display = 'block';
                        modal.style.display = 'block';
                        history.replaceState(null, '', '#' + hashVal);
                    }
                } else {
                    // Tablet / Mobile: scroll with offset to account for sticky header
                    const header = document.querySelector('.top-header');
                    const headerHeight = header ? header.offsetHeight : 0;
                    const rect = targetEl.getBoundingClientRect();
                    const scrollTop = window.pageYOffset + rect.top - headerHeight - 4;

                    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                    history.replaceState(null, '', '#' + hashVal);

                    // Brief visual highlight feedback
                    targetEl.style.transition = 'background-color 0.3s';
                    const prevBg = targetEl.style.backgroundColor;
                    targetEl.style.backgroundColor = 'var(--bg-panel)';
                    setTimeout(() => { targetEl.style.backgroundColor = prevBg; }, 400);
                }
            }
        });
    });

    document.getElementById('tab-projects').innerText = ui.nav_projects;
    document.getElementById('tab-packages').innerText = ui.nav_packages;
}

function renderTicker(skillsArray) {
    // Extract individual skill items for the ticker
    let allSkills = [];
    skillsArray.forEach(cat => {
        allSkills = allSkills.concat(cat.items.split(',').map(s => s.trim()));
    });

    // Duplicate just twice for seamless looping
    const tickerItems = [...allSkills, ...allSkills];

    const container = document.getElementById('ticker-container');
    container.innerHTML = tickerItems.map((skill, index) => {
        // Randomly assign up/down color for aesthetic
        const isUp = index % 3 !== 0;
        const colorClass = isUp ? 'tick-up' : 'tick-down';
        const symbol = isUp ? '▲' : '▼';
        // Random fake "price/volume" numbers for terminal feel
        const fakeNum = (Math.random() * 100).toFixed(2);

        return `
            <div class="tick-item">
                <span class="tick-label">${skill}</span>
                <span class="tick-val ${colorClass}">${symbol} ${fakeNum}</span>
            </div>
        `;
    }).join('');
}

function renderHero(hero, contact) {
    const container = document.getElementById('hero-section');
    container.innerHTML = `
        <div class="hero-content">
            <h1>> ${hero.name}</h1>
            <span class="subtitle">[ ${hero.subtitle} ]</span>
            <p>${hero.description}</p>
        </div>
    `;

    const contactContainer = document.getElementById('contact-container');
    // Using contact data passed in
    contactContainer.innerHTML = `
        <div class="contact-info">
            <p><strong>LOC:</strong> ${contact.location}</p>
            <p><strong>EML:</strong> <a href="mailto:${contact.email}" style="color:var(--text-main); text-decoration:none;">${contact.email}</a></p>
            <div class="contact-links">
                <a href="${contact.linkedin}" target="_blank">LINKEDIN</a>
                <a href="${contact.github}" target="_blank">GITHUB</a>
            </div>
        </div>
    `;
}

function renderExperience(expArray, ui) {
    document.getElementById('title-experience').innerText = ui.title_experience;
    const container = document.getElementById('experience-container');
    
    // Add IDs to experiences for modals
    currentData.experienceWithIds = expArray.map((exp, index) => ({...exp, id: 'exp-' + index}));
    
    container.innerHTML = currentData.experienceWithIds.map(exp => `
        <div class="exp-item trigger-modal" data-modal="${exp.id}" style="cursor: pointer; transition: background 0.2s; padding-top: 0.5rem; padding-bottom: 0.5rem;" onmouseover="this.style.backgroundColor='var(--bg-panel)'" onmouseout="this.style.backgroundColor='transparent'">
            <div class="exp-role" style="transition: color 0.2s;">${exp.role}</div>
            <span class="exp-meta">${exp.company} // ${exp.period}</span>
            <div style="font-size: 0.75rem; color: var(--color-active); margin-top: 0.5rem; letter-spacing: 1px;">>> ${ui.btn_sys_details || 'DETALLES'}</div>
        </div>
    `).join('');
}

function renderSkills(skillsArray, ui) {
    document.getElementById('title-skills').innerText = ui.title_skills;
    const container = document.getElementById('skills-container');
    container.innerHTML = skillsArray.map(skill => `
        <div class="skill-item">
            <span class="skill-cat">[ ${skill.category} ]</span>
            <div class="skill-desc">${skill.items}</div>
        </div>
    `).join('');
}

function renderProjects(projectsArray, ui) {
    document.getElementById('desc-projects').innerText = ui.desc_projects;
    const container = document.getElementById('projects-container');
    container.innerHTML = projectsArray.map(proj => `
        <div class="data-card project-card" data-modal="${proj.id}">
            <h3>${proj.title}</h3>
            <p>${proj.short_desc}</p>
            <button class="card-action trigger-modal">>> ${ui.btn_sys_details}</button>
        </div>
    `).join('');
}

function renderPackages(packagesArray, ui) {
    document.getElementById('desc-packages').innerText = ui.desc_packages;
    const container = document.getElementById('packages-container');
    container.innerHTML = packagesArray.map(pkg => `
        <div class="data-card project-card" data-modal="${pkg.id}">
            <h3>${pkg.title}</h3>
            <p>${pkg.short_desc}</p>
            <button class="card-action trigger-modal">>> ${ui.btn_view_docs}</button>
        </div>
    `).join('');
}

function renderModals(projects, packages) {
    const container = document.getElementById('modals-container');

    const ui = currentData.ui;
    const experiences = currentData.experienceWithIds || [];

    const renderProjectModal = (proj) => `
        <div id="modal-${proj.id}" class="terminal-modal">
            <div class="modal-header">
                <h2>PROCESS: ${proj.title}</h2>
                <button class="close-modal">KILL [X]</button>
            </div>
            <div class="modal-body">
                <div class="modal-tags">
                    ${proj.tags ? proj.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
                <p><strong>> ${currentLang === 'es' ? 'OBJETIVO' : 'OBJECTIVE'}:</strong><br>${proj.what_it_does}</p>
                <p><strong>> ${currentLang === 'es' ? 'OPERACIÓN' : 'OPERATION'}:</strong><br>${proj.how_it_works}</p>
                ${proj.infrastructure ? `<p><strong>> ${currentLang === 'es' ? 'INFRAESTRUCTURA' : 'INFRASTRUCTURE'}:</strong><br>${proj.infrastructure}</p>` : ''}
            </div>
        </div>
    `;

    const renderPackageModal = (pkg) => `
        <div id="modal-${pkg.id}" class="terminal-modal">
            <div class="modal-header">
                <h2>PACKAGE: ${pkg.title}</h2>
                <button class="close-modal">KILL [X]</button>
            </div>
            <div class="modal-body">
                <p><strong>> ${currentLang === 'es' ? 'OBJETIVO' : 'OBJECTIVE'}:</strong><br>${pkg.what_it_does}</p>
                <p><strong>> ${currentLang === 'es' ? 'OPERACIÓN' : 'OPERATION'}:</strong><br>${pkg.how_it_works}</p>
                <p><strong>> ${currentLang === 'es' ? 'INSTALACIÓN' : 'INSTALL'}:</strong></p>
                <pre><code>$ ${pkg.install_cmd}</code></pre>
                <br>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${pkg.link ? `<a href="${pkg.link}" class="card-action" target="_blank" style="text-decoration:none; display:inline-block;">>> ${currentLang === 'es' ? 'ENLACE DEL PAQUETE' : 'PACKAGE LINK'}</a>` : ''}
                    ${pkg.repository ? `<a href="${pkg.repository}" class="card-action" target="_blank" style="text-decoration:none; display:inline-block;">>> REPOSITORY</a>` : ''}
                </div>
            </div>
        </div>
    `;

    const renderExperienceModal = (exp) => `
        <div id="modal-${exp.id}" class="terminal-modal">
            <div class="modal-header">
                <h2>EXPERIENCE: ${exp.company}</h2>
                <button class="close-modal">KILL [X]</button>
            </div>
            <div class="modal-body">
                <p><strong>> ROLE:</strong> ${exp.role}</p>
                <p><strong>> PERIOD:</strong> ${exp.period}</p>
                <br>
                <p><strong>> HIGHLIGHTS:</strong></p>
                <ul class="exp-details" style="margin-top: 1rem; list-style: none; padding-left: 0;">
                    ${exp.highlights.map(h => `<li style="margin-bottom: 0.8rem; position: relative; padding-left: 1.2rem;"><span style="position: absolute; left: 0; color: var(--color-active);">></span>${h}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    const renderAllExpModal = () => `
        <div id="modal-exp-all" class="terminal-modal">
            <div class="modal-header">
                <h2>${currentLang === 'es' ? 'TODA LA EXPERIENCIA' : 'ALL EXPERIENCE'}</h2>
                <button class="close-modal">KILL [X]</button>
            </div>
            <div class="modal-body">
                <div class="timeline-list">
                    ${experiences.map(exp => `
                        <div class="exp-item" style="margin-bottom: 1.5rem;">
                            <div class="exp-role">${exp.role}</div>
                            <span class="exp-meta">${exp.company} // ${exp.period}</span>
                            <ul class="exp-details" style="margin-top: 0.8rem; list-style: none; padding-left: 0;">
                                ${exp.highlights.map(h => `<li style="margin-bottom: 0.4rem; position: relative; padding-left: 1.2rem;"><span style="position: absolute; left: 0; color: var(--text-muted);">></span>${h}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    const renderAllSkillsModal = () => `
        <div id="modal-skills-all" class="terminal-modal">
            <div class="modal-header">
                <h2>${currentLang === 'es' ? 'TODAS LAS COMPETENCIAS' : 'ALL SKILLS'}</h2>
                <button class="close-modal">KILL [X]</button>
            </div>
            <div class="modal-body">
                <div class="list-grid" style="grid-template-columns: 1fr;">
                    ${currentData.skills.map(skill => `
                        <div class="skill-item" style="margin-bottom: 1.5rem;">
                            <span class="skill-cat" style="color: var(--color-warn); font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">[ ${skill.category} ]</span>
                            <div class="skill-desc" style="line-height: 1.6;">${skill.items}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = `
        ${projects.map(renderProjectModal).join('')}
        ${packages.map(renderPackageModal).join('')}
        ${experiences.map(renderExperienceModal).join('')}
        ${renderAllExpModal()}
        ${renderAllSkillsModal()}
    `;
}

function attachModalLogic() {
    const triggerButtons = document.querySelectorAll('.trigger-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const overlay = document.getElementById('modal-overlay');

    triggerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card') || e.target.closest('.exp-item');
            if (card) {
                const modalId = card.getAttribute('data-modal');
                const modal = document.getElementById(`modal-${modalId}`);
                if (modal) {
                    overlay.style.display = 'block';
                    modal.style.display = 'block';
                    // Update hash so this modal can be linked directly
                    history.replaceState(null, '', `#modal-${modalId}`);
                }
            }
        });
    });

    const closeModals = () => {
        document.querySelectorAll('.terminal-modal').forEach(m => m.style.display = 'none');
        overlay.style.display = 'none';
        // Restore hash to the currently active tab
        const activeTab = document.querySelector('.tab-btn.active');
        const tabTarget = activeTab ? activeTab.getAttribute('data-target') : null;
        const hashMap = { 'projects-view': 'projects', 'packages-view': 'packages' };
        const restoredHash = tabTarget ? (hashMap[tabTarget] || tabTarget) : 'projects';
        history.replaceState(null, '', '#' + restoredHash);
    };

    closeButtons.forEach(btn => btn.addEventListener('click', closeModals));
    overlay.addEventListener('click', closeModals);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModals();
    });
}
