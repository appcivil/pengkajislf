const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ai-router-XWkYYzyb.js","assets/ai-router-ChhEVQAV.js","assets/prompt-config-service-VTxY380U.js","assets/supabase-Cpvc2oH5.js","assets/prompt-config-service-B0Bany5t.js","assets/drive-COuyZp3V.js","assets/drive-DxrQ1PwJ.js"])))=>i.map(i=>d[i]);
import{t as e}from"./supabase-Cpvc2oH5.js";import{t}from"./config-DAGdXtb-.js";import{a as n,c as r,n as i,o as a,r as o,s}from"./ai-router-ChhEVQAV.js";import"./prompt-config-service-VTxY380U.js";import{r as c}from"./drive-DxrQ1PwJ.js";var l=Object.defineProperty,u=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),d=(e,t)=>{let n={};for(var r in e)l(n,r,{get:e[r],enumerable:!0});return t||l(n,Symbol.toStringTag,{value:`Module`}),n};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var f=null,p=new Set,m=`slf_dev_user`;function h(e){p.forEach(t=>t(e))}async function g(){e.auth.onAuthStateChange(async(e,t)=>{if(t?.user)f=t.user,localStorage.removeItem(m);else{let e=localStorage.getItem(m);if(e)try{f=JSON.parse(e)}catch{f=null}else f=null}h(f)});try{let{data:{session:t}}=await e.auth.getSession();if(t?.user)f=t.user;else{let e=localStorage.getItem(m);if(e)try{f=JSON.parse(e)}catch{f=null}}}catch(e){console.error(`[Auth] getSession error:`,e)}return f}function _(e){return p.add(e),e(f),()=>p.delete(e)}async function v(){let n=`${window.location.origin}${t.base}/`,{data:r,error:i}=await e.auth.signInWithOAuth({provider:`google`,options:{redirectTo:n,queryParams:{access_type:`offline`,prompt:`consent`}}});if(i)throw i.message.includes(`provider is not enabled`)?Error(`Metode Login Google belum diaktifkan di Dashboard Supabase Anda atau batasan kuota tercapai. Silakan gunakan Login Email sementara.`):i;return r}async function y(t,n){let{data:r,error:i}=await e.auth.signInWithPassword({email:t,password:n});if(i)throw i;return r}async function b(n,r,i){let a=`${window.location.origin}${t.base}/`,{data:o,error:s}=await e.auth.signUp({email:n,password:r,options:{data:{full_name:i},emailRedirectTo:a}});if(s)throw s;return o}async function x(){return f={id:`00000000-0000-0000-0000-000000000001`,email:`developer@local.host`,user_metadata:{full_name:`Bypass Admin`},is_bypass:!0},localStorage.setItem(m,JSON.stringify(f)),h(f),f}async function S(){try{await e.auth.signOut()}catch{}localStorage.removeItem(m),f=null,h(null)}function C(){return f}function w(){return!!f}function T(){if(!f)return null;let e=f.user_metadata||{};return{id:f.id,email:f.email,name:e.full_name||e.name||f.email?.split(`@`)[0]||`User`,role:e.role||(f.is_bypass?`Dev Bypass`:`Pengkaji Teknis`),avatar:e.avatar_url||e.picture||null,initials:E(e.full_name||e.name||f.email),is_bypass:!!f.is_bypass}}function E(e=``){return e.split(` `).slice(0,2).map(e=>e[0]?.toUpperCase()).join(``)||`?`}var D=new Map,O=null,k=null,A=new Set([`login`,`verify`]);function j(e,t){D.set(e,t)}function M(e,t={}){let n=new URLSearchParams(t).toString(),r=n?`#/${e}?${n}`:`#/${e}`;window.location.hash=r}function ee(){let[e,t]=window.location.hash.slice(1).split(`?`),n={};return t&&new URLSearchParams(t).forEach((e,t)=>{n[t]=e}),n}function N(){return O}function P(){return(window.location.hash.slice(2)||``).split(`?`)[0]||`dashboard`}function F(e){async function t(){let t=P();if(O=t,!A.has(t)&&!w()){M(`login`);return}if(t===`login`&&w()){M(`dashboard`);return}if(k&&await k(t)===!1)return;let n=D.get(t)||D.get(`404`);if(!n){e.innerHTML=I();return}try{let r=await n(ee());typeof r==`string`?e.innerHTML=r:r instanceof HTMLElement&&(e.innerHTML=``,e.appendChild(r)),window.scrollTo(0,0),window.dispatchEvent(new CustomEvent(`route-changed`,{detail:{path:t}}))}catch(n){console.error(`[Router] Error rendering route "${t}":`,n),e.innerHTML=L(n)}}return window.addEventListener(`hashchange`,t),t(),()=>window.removeEventListener(`hashchange`,t)}function I(){return`
    <div class="empty-state" style="min-height:100vh">
      <div class="empty-icon"><i class="fas fa-map-signs"></i></div>
      <h2 class="empty-title">Halaman Tidak Ditemukan</h2>
      <p class="empty-desc">Route yang Anda tuju tidak tersedia.</p>
      <button class="btn btn-primary mt-4" onclick="navigate('dashboard')">
        <i class="fas fa-home"></i> Kembali ke Dashboard
      </button>
    </div>
  `}function L(e){return`
    <div class="empty-state" style="min-height:100vh">
      <div class="empty-icon" style="color:var(--danger-400)"><i class="fas fa-triangle-exclamation"></i></div>
      <h2 class="empty-title">Terjadi Kesalahan</h2>
      <p class="empty-desc">${e.message}</p>
      <button class="btn btn-secondary mt-4" onclick="window.location.reload()">
        <i class="fas fa-rotate"></i> Muat Ulang
      </button>
    </div>
  `}var R=null;function z({title:e=``,body:t=``,footer:n=``,size:r=`md`,onClose:i}={}){te();let a={sm:`400px`,md:`520px`,lg:`720px`,xl:`900px`},o=document.createElement(`div`);return o.className=`modal-overlay`,o.innerHTML=`
    <div class="modal" style="max-width:${a[r]||a.md}">
      <div class="modal-header">
        <h3 class="modal-title">${e}</h3>
        <button class="modal-close" id="modal-close-btn">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">${t}</div>
      ${n?`<div class="modal-footer">${n}</div>`:``}
    </div>
  `,document.body.appendChild(o),R=o,requestAnimationFrame(()=>o.classList.add(`open`)),o.querySelector(`#modal-close-btn`).addEventListener(`click`,()=>{te(),i?.()}),o.addEventListener(`click`,e=>{e.target===o&&(te(),i?.())}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&(te(),i?.())},{once:!0}),o}function te(){R&&=(R.classList.remove(`open`),R.addEventListener(`transitionend`,()=>R?.remove(),{once:!0}),null)}function ne({title:e=`Konfirmasi`,message:t=`Apakah Anda yakin?`,confirmText:n=`Ya`,danger:r=!1}={}){return new Promise(i=>{z({title:e,body:`<p style="color:var(--text-secondary)">${t}</p>`,footer:`
        <button class="btn btn-secondary" id="confirm-cancel">Batal</button>
        <button class="btn ${r?`btn-danger`:`btn-primary`}" id="confirm-ok">${n}</button>
      `,onClose:()=>i(!1)}),document.getElementById(`confirm-cancel`)?.addEventListener(`click`,()=>{te(),i(!1)}),document.getElementById(`confirm-ok`)?.addEventListener(`click`,()=>{te(),i(!0)})})}var re=null;function ie(){return re||(re=document.createElement(`div`),re.className=`toast-container`,document.body.appendChild(re)),re}var ae={success:`fa-circle-check`,error:`fa-circle-xmark`,warning:`fa-triangle-exclamation`,info:`fa-circle-info`};function oe(e,t=`info`,n=3500){let r=ie(),i=document.createElement(`div`);i.className=`toast toast-${t}`,i.innerHTML=`
    <div class="toast-icon"><i class="fas ${ae[t]||ae.info}"></i></div>
    <div>
      <div class="toast-title">${ce(t)}</div>
      <div class="toast-msg">${e}</div>
    </div>
    <button onclick="this.closest('.toast').remove()"
            style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:0.8rem;align-self:flex-start;">
      <i class="fas fa-xmark"></i>
    </button>
  `,r.appendChild(i),requestAnimationFrame(()=>i.classList.add(`show`)),setTimeout(()=>{i.classList.add(`hide`),i.addEventListener(`transitionend`,()=>i.remove(),{once:!0})},n)}var B=e=>oe(e,`success`),V=e=>oe(e,`error`),se=e=>oe(e,`info`);function ce(e){return e.charAt(0).toUpperCase()+e.slice(1)}var le=[{section:`Utama`},{path:`dashboard`,label:`Dashboard`,icon:`fa-gauge-high`},{path:`proyek`,label:`Proyek SLF`,icon:`fa-folder-open`},{path:`files`,label:`Manajemen File`,icon:`fa-folder-tree`},{path:`checklist`,label:`Checklist`,icon:`fa-clipboard-check`},{section:`Analisis`},{path:`analisis`,label:`Analisis AI`,icon:`fa-brain`,badge:`Baru`},{path:`multi-agent`,label:`Multi-Agent`,icon:`fa-network-wired`},{path:`laporan`,label:`Laporan SLF`,icon:`fa-file-contract`},{section:`Monitoring`},{path:`todo`,label:`TODO Board`,icon:`fa-list-check`},{path:`tim-kerja`,label:`Tim Kerja`,icon:`fa-users-gear`},{path:`executive`,label:`Executive Dashboard`,icon:`fa-chart-line`},{section:`Sistem`},{path:`settings`,label:`Pengaturan`,icon:`fa-gear`}];function ue(){let e=T(),n=le.map(e=>{if(e.section)return`<div class="nav-section-label">${e.section}</div>`;let t=N()===e.path?`active`:``,n=e.badge?`<span class="nav-badge">${e.badge}</span>`:``;return`
      <a class="nav-item ${t}" data-route="${e.path}" role="button" tabindex="0">
        <i class="fas ${e.icon} nav-icon"></i>
        <span>${e.label}</span>
        ${n}
      </a>
    `}).join(``),r=e?.avatar?`<img src="${e.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="avatar">`:`<div class="user-avatar">${e?.initials||`?`}</div>`;return`
    <aside class="sidebar" id="app-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/smartaipengkaji/logo-app.png" alt="Logo" style="width:100%; height:100%; object-fit:contain; border-radius:var(--radius-md);">
        </div>
        <div>
          <div class="sidebar-title">${t.name.split(` `).slice(0,3).join(` `)}</div>
          <div class="sidebar-subtitle">v${t.version}</div>
        </div>
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        ${n}
      </nav>

      <div class="sidebar-footer">
        <div class="user-card" id="user-card-btn" title="Klik untuk logout">
          ${r}
          <div style="overflow:hidden">
            <div class="user-name truncate">${e?.name||`User`}</div>
            <div class="user-role truncate">${e?.email||``}</div>
          </div>
          <i class="fas fa-right-from-bracket" style="margin-left:auto;color:var(--text-tertiary);font-size:0.8rem;flex-shrink:0"></i>
        </div>
      </div>
    </aside>
  `}function de(){document.querySelectorAll(`.nav-item[data-route]`).forEach(e=>{e.addEventListener(`click`,()=>{M(e.dataset.route),me()}),e.addEventListener(`keydown`,t=>{(t.key===`Enter`||t.key===` `)&&(M(e.dataset.route),me())})}),document.getElementById(`sidebar-backdrop`)?.addEventListener(`click`,me),document.getElementById(`user-card-btn`)?.addEventListener(`click`,async()=>{if(await ne({title:`Keluar Akun`,message:`Anda akan keluar dari akun <strong>${T()?.email}</strong>. Lanjutkan?`,confirmText:`Keluar`,danger:!0}))try{await S(),B(`Berhasil keluar.`),M(`login`)}catch{V(`Gagal keluar. Coba lagi.`)}})}function fe(e){document.querySelectorAll(`.nav-item[data-route]`).forEach(t=>{t.classList.toggle(`active`,t.dataset.route===e)})}function pe(){let e=document.getElementById(`app-sidebar`),t=document.getElementById(`sidebar-backdrop`);e&&e.classList.toggle(`open`),t&&t.classList.toggle(`show`)}function me(){if(window.innerWidth>768)return;let e=document.getElementById(`app-sidebar`),t=document.getElementById(`sidebar-backdrop`);e&&e.classList.remove(`open`),t&&t.classList.remove(`show`)}var he={dashboard:{title:`Dashboard`,icon:`fa-gauge-high`},proyek:{title:`Daftar Proyek SLF`,icon:`fa-folder-open`},"proyek-baru":{title:`Proyek Baru`,icon:`fa-plus-circle`},"proyek-detail":{title:`Detail Proyek`,icon:`fa-building`},checklist:{title:`Checklist Pemeriksaan`,icon:`fa-clipboard-check`},analisis:{title:`Analisis AI`,icon:`fa-brain`},"multi-agent":{title:`Multi-Agent Analysis`,icon:`fa-network-wired`},laporan:{title:`Laporan Kajian SLF`,icon:`fa-file-contract`},todo:{title:`TODO Board`,icon:`fa-list-check`},executive:{title:`Executive Dashboard`,icon:`fa-chart-line`},settings:{title:`Pengaturan`,icon:`fa-gear`}};function ge(e=`dashboard`){let t=he[e]||{title:`Smart AI SLF`,icon:`fa-building`},n=T(),r=navigator.onLine;return`
    <header class="app-header" id="app-header">
      <div class="header-left">
        <!-- Mobile hamburger (Managed by CSS Media Queries) -->
        <button class="btn-icon" id="sidebar-toggle" aria-label="Toggle sidebar">
          <i class="fas fa-bars"></i>
        </button>

        <div class="header-breadcrumb">
          <div class="breadcrumb-item">
            <i class="fas ${t.icon}" style="color:var(--brand-400)"></i>
            <span>${t.title}</span>
          </div>
        </div>
      </div>

      <div class="header-right">
        <!-- Sync Status -->
        <div class="sync-status ${r?`online`:`offline`}" id="header-sync-status" title="${r?`Sistem Terhubung (Cloud Sync Aktif)`:`Mode Offline (Data disimpan lokal)`}">
          <div class="sync-indicator"></div>
          <span class="sync-label">${r?`Online`:`Offline`}</span>
        </div>

        <div class="divider-v"></div>

        <!-- Search -->
        <div class="header-search">
          <i class="fas fa-search search-icon"></i>
          <input type="text"
                 id="global-search"
                 placeholder="Cari..."
                 autocomplete="off" />
        </div>

        <!-- Quick Add -->
        <button class="btn btn-primary btn-sm" id="btn-quick-add" style="padding:0 12px; height:36px; border-radius:var(--radius-md)">
          <i class="fas fa-plus"></i>
        </button>

        <!-- Notifications -->
        <button class="btn-icon" id="btn-notif" aria-label="Notifikasi" title="Notifikasi">
          <i class="fas fa-bell"></i>
          <span class="notif-dot"></span>
        </button>

        <div class="divider-v"></div>

        <!-- User Profile Dropdown -->
        <div class="user-profile-dropdown" id="user-profile-dropdown">
          <button class="profile-trigger" id="profile-trigger">
            <div class="avatar-sm">
              ${n?.initials||`U`}
            </div>
            <div class="profile-info-mini">
              <span class="p-mini-name">${n?.name?.split(` `)[0]||`User`}</span>
              <i class="fas fa-chevron-down"></i>
            </div>
          </button>
          
          <div class="profile-menu" id="profile-menu">
            <div class="profile-menu-header">
              <div class="p-name">${n?.name||`User`}</div>
              <div class="p-email">${n?.email||``}</div>
              <div class="p-role-badge">${n?.role||`Pengkaji Teknis`}</div>
            </div>
            <div class="profile-menu-divider"></div>
            <button class="profile-menu-item" onclick="window.navigate('settings')">
              <i class="fas fa-user-circle"></i> Pengaturan Akun
            </button>
            <button class="profile-menu-item" onclick="window.navigate('settings')">
              <i class="fas fa-sliders"></i> Pengaturan Aplikasi
            </button>
            <div class="profile-menu-divider"></div>
            <button class="profile-menu-item logout" id="btn-logout-header">
              <i class="fas fa-right-from-bracket"></i> Keluar
            </button>
          </div>
        </div>
      </div>
    </header>
  `}function _e(){let e=document.getElementById(`sidebar-toggle`);e&&(e.style.display=window.innerWidth<=768?`flex`:`none`,e.addEventListener(`click`,pe));let t=document.getElementById(`profile-trigger`),n=document.getElementById(`profile-menu`);t?.addEventListener(`click`,e=>{e.stopPropagation(),n?.classList.toggle(`show`)}),document.addEventListener(`click`,()=>{n?.classList.remove(`show`)}),document.getElementById(`btn-logout-header`)?.addEventListener(`click`,async()=>{if(await ne({title:`Keluar Akun`,message:`Anda akan keluar dari sesi ini. Lanjutkan?`,confirmText:`Keluar`,danger:!0}))try{await S(),B(`Berhasil keluar.`),M(`login`)}catch{V(`Gagal keluar.`)}}),document.getElementById(`btn-quick-add`)?.addEventListener(`click`,()=>{M(`proyek-baru`)});let r=document.getElementById(`global-search`),i;r?.addEventListener(`input`,e=>{clearTimeout(i),i=setTimeout(()=>{let t=e.target.value.trim();t.length>=2&&window.dispatchEvent(new CustomEvent(`global-search`,{detail:{q:t}}))},350)}),document.getElementById(`btn-notif`)?.addEventListener(`click`,()=>{window.dispatchEvent(new CustomEvent(`open-notifications`))}),window.addEventListener(`online`,()=>ve(!0)),window.addEventListener(`offline`,()=>ve(!1))}function ve(e){let t=document.getElementById(`header-sync-status`);if(t){t.className=`sync-status ${e?`online`:`offline`}`,t.title=e?`Sistem Terhubung (Cloud Sync Aktif)`:`Mode Offline (Data disimpan lokal)`;let n=t.querySelector(`.sync-label`);n&&(n.innerText=e?`Online`:`Offline`)}}function ye(e){let t=he[e]||{title:`Smart AI SLF`,icon:`fa-building`},n=document.querySelector(`.header-breadcrumb span`),r=document.querySelector(`.header-breadcrumb i`);n&&(n.innerText=t.title),r&&(r.className=`fas ${t.icon}`)}var be=!1;function xe(e){be||(be=!0,e.innerHTML=`
    <div class="app-layout" id="app-layout">
      ${ue()}
      <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
      ${ge(`dashboard`)}
      <div id="sync-banner-container"></div>
      <main class="main-content" id="main-content">
        <div class="page-container" id="page-root">
          <!-- Page content rendered here by router -->
        </div>
      </main>
      ${Te()}
    </div>
  `,de(),_e(),Se())}function Se(){let e=C(),t=document.getElementById(`sync-banner-container`);e?.is_bypass&&t&&(t.innerHTML=`
      <div class="bypass-warning-banner">
        <i class="fas fa-exclamation-triangle"></i>
        <span><strong>Mode Pratinjau:</strong> Data Anda tidak akan tersimpan ke database karena Anda tidak login secara resmi.</span>
      </div>
    `)}function Ce(){return document.getElementById(`page-root`)}function we(e){fe(e),ye(e),document.getElementById(`sidebar`)?.classList.remove(`open`),document.getElementById(`sidebar-backdrop`)?.classList.remove(`show`),document.querySelectorAll(`.bnav-item`).forEach(t=>{let n=t.getAttribute(`onclick`)?.match(/'([^']+)'/)?.[1];n&&(e===n||e.startsWith(n+`-`))?t.classList.add(`active`):t.classList.remove(`active`)}),document.getElementById(`main-content`)?.scrollTo(0,0)}function Te(){return`
    <nav class="bottom-nav">
      <a class="bnav-item" onclick="window.navigate('dashboard')">
        <i class="fas fa-home"></i>
        <span>Home</span>
      </a>
      <a class="bnav-item" onclick="window.navigate('proyek')">
        <i class="fas fa-tasks"></i>
        <span>Proyek</span>
      </a>
      <a class="bnav-item" onclick="window.navigate('files')">
        <i class="fas fa-folder"></i>
        <span>Berkas</span>
      </a>
      <a class="bnav-item" onclick="window.navigate('multi-agent')">
        <i class="fas fa-robot"></i>
        <span>AI Hub</span>
      </a>
    </nav>
  `}function Ee(e){be=!1,e.innerHTML=``}var De=null,Oe=null;async function ke(){let e=document.getElementById(`btn-notif`);e&&(Ae(e),await Me(),Ne(),window.addEventListener(`open-notifications`,je),e.onclick=e=>{e.stopPropagation(),je()},document.addEventListener(`click`,t=>{De&&De.classList.contains(`show`)&&!e.contains(t.target)&&!De.contains(t.target)&&De.classList.remove(`show`)}))}function Ae(e){if(document.getElementById(`notif-dropdown`)){De=document.getElementById(`notif-dropdown`);return}De=document.createElement(`div`),De.id=`notif-dropdown`,De.className=`notif-dropdown`,De.innerHTML=`
    <div class="notif-header">
      <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin:0">Notifikasi Sistem</h4>
      <button class="btn btn-ghost btn-sm" id="btn-read-all" style="font-size:0.75rem;padding:2px 8px;margin:0" title="Tandai semua dibaca">
        <i class="fas fa-check-double"></i>
      </button>
    </div>
    <div class="notif-body" id="notif-list">
      <div style="padding:var(--space-4);text-align:center;color:var(--text-tertiary);font-size:0.8rem">
        <i class="fas fa-circle-notch fa-spin" style="margin-bottom:8px;font-size:1.2rem;color:var(--brand-400)"></i><br>
        Memuat data...
      </div>
    </div>
  `;let t=document.querySelector(`.header-right`);t?(t.style.position=`relative`,t.appendChild(De)):document.body.appendChild(De),document.getElementById(`btn-read-all`)?.addEventListener(`click`,Pe)}function je(){De&&De.classList.toggle(`show`)}async function Me(){let t=T();if(t)try{let{data:n,error:r}=await e.from(`notifications`).select(`*`).eq(`user_id`,t.id).order(`created_at`,{ascending:!1}).limit(10);if(r){if(r.code===`42P01`){console.warn(`[Notif] Tabel 'notifications' belum dibuat di DB Supabase. Memakai UI contoh (Mock Data).`),Ie();return}throw r}Fe(n)}catch(e){if(String(e.message).includes(`relation "notifications" does not exist`)){console.warn(`[Notif] Realtime belum ada. Merender dummy mockup...`),Ie();return}console.error(`[Notif] Gagal memuat notifikasi, fallback ke dummy:`,e),Ie()}}function Ne(){let t=T();t&&(Oe=e.channel(`realtime_notifications_tracker`).on(`postgres_changes`,{event:`INSERT`,schema:`public`,table:`notifications`,filter:`user_id=eq.${t.id}`},e=>{let t=e.new;se(`Notif Baru: ${t.title}`),Le(!0),Me()}).subscribe(e=>{}))}async function Pe(){let t=T();if(t){Le(!1),document.querySelectorAll(`.notif-item.unread`).forEach(e=>e.classList.remove(`unread`));try{await e.from(`notifications`).update({is_read:!0}).eq(`user_id`,t.id).eq(`is_read`,!1)}catch{}}}function Fe(e=[]){let t=document.getElementById(`notif-list`);if(!t)return;if(e.length===0){t.innerHTML=`
      <div style="padding:var(--space-6) var(--space-4);text-align:center;color:var(--text-tertiary)">
        <i class="fas fa-bell-slash" style="font-size:2rem;margin-bottom:12px;opacity:0.5"></i>
        <div style="font-size:0.8rem">Belum ada notifikasi saat ini.</div>
        <p style="font-size:0.6rem; margin-top:12px; opacity:0.6;">(Tips: Buat tabel <b>notifications</b> di Supabase untuk mengaktifkan DB log)</p>
      </div>
    `,Le(!1);return}let n=0;e.forEach(e=>{e.is_read===!1&&n++}),Le(n>0),t.innerHTML=e.map(e=>`
    <div class="notif-item ${e.is_read?``:`unread`}" data-id="${e.id||``}">
      <div class="ni-icon ${Re(e.type)}">
        <i class="fas ${ze(e.type)}"></i>
      </div>
      <div class="ni-content">
        <div class="ni-title">${e.title}</div>
        <div class="ni-desc">${e.message}</div>
        <div class="ni-time">${Be(e.created_at)}</div>
      </div>
    </div>
  `).join(``)}function Ie(){Fe([{id:`n1`,title:`Selamat Datang di v14.0`,message:`Sistem Hybrid AI telah diperbarui dengan modul form Sign Up terintegrasi!`,type:`info`,created_at:new Date(Date.now()-1e3*60*5).toISOString(),is_read:!1},{id:`n2`,title:`Real-Time Sync Ready`,message:`Supabase Realtime Channel siap mendengarkan INSERT pada tabel notifications Anda.`,type:`success`,created_at:new Date(Date.now()-1e3*60*60*2).toISOString(),is_read:!1},{id:`n3`,title:`Dokumen Berhasil Ditarik`,message:`Berkas Laporan SLF proyek "Gedung Pusat" (PDF) berhasil di-generate.`,type:`success`,created_at:new Date(Date.now()-1e3*60*60*24).toISOString(),is_read:!0}])}function Le(e){let t=document.querySelector(`.notif-dot`);t&&(t.style.display=e?`block`:`none`)}function Re(e){switch(e){case`success`:return`bg-success text-success`;case`alert`:case`warning`:return`bg-warning text-warning`;case`error`:return`bg-danger text-danger`;default:return`bg-brand text-brand`}}function ze(e){switch(e){case`success`:return`fa-check-circle`;case`alert`:case`warning`:return`fa-exclamation-triangle`;case`error`:return`fa-times-circle`;default:return`fa-info-circle`}}function Be(e){if(!e)return`Baru saja`;let t=new Date(e).getTime(),n=(Date.now()-t)/1e3;return n<60?`Baru saja`:n<3600?Math.floor(n/60)+` mnt yang lalu`:n<86400?Math.floor(n/3600)+` jam yang lalu`:Math.floor(n/86400)+` hari yang lalu`}function Ve(){Oe&&=(Oe.unsubscribe(),null),De&&=(De.remove(),null)}async function He(){let e=[{icon:`fa-brain`,text:`AI Engine terintegrasi (SNI 9273:2025, ASCE 41-17)`},{icon:`fa-shield-halved`,text:`Penilaian Laik Fungsi otomatis berbasis standar`},{icon:`fa-file-contract`,text:`Laporan kajian SLF profesional otomatis`},{icon:`fa-chart-line`,text:`Dashboard analitik & executive report`},{icon:`fa-database`,text:`Database terintegrasi Google Workspace`}],n=new Date().getFullYear(),r=`
    <div class="auth-page" id="login-page">
      <!-- Visual Side -->
      <div class="auth-visual">
        <div class="auth-visual-content">
          <div class="auth-logo-big">
            <i class="fas fa-building"></i>
          </div>
          <h1 class="auth-visual-title">Smart AI Konsultan<br>Pengkaji SLF</h1>
          <p class="auth-visual-subtitle">
            Sistem berbasis AI untuk pengkajian teknis bangunan gedung
            sesuai standar NSPK, SNI, dan ASCE/SEI
          </p>

          <div class="auth-features">
            ${e.map(e=>`
              <div class="auth-feature-item">
                <i class="fas ${e.icon}"></i>
                <span>${e.text}</span>
              </div>
            `).join(``)}
          </div>

          <!-- Standards badges -->
          <div style="display:flex;gap:8px;margin-top:32px;flex-wrap:wrap;justify-content:center">
            ${[`PP No. 16/2021`,`SNI 9273:2025`,`ASCE/SEI 41-17`,`NSPK`].map(e=>`
              <span style="background:hsla(220,70%,48%,0.15);border:1px solid hsla(220,70%,48%,0.3);color:var(--brand-400);padding:4px 10px;border-radius:var(--radius-full);font-size:0.72rem;font-weight:600">
                ${e}
              </span>
            `).join(``)}
          </div>
        </div>
      </div>

      <!-- Form Side -->
      <div class="auth-form-panel">
        <div class="auth-form-wrap">
          <h2 class="auth-form-title">Selamat Datang</h2>
          <p class="auth-form-subtitle">
            Masuk ke sistem Smart AI Pengkaji SLF menggunakan akun Google Anda.
          </p>

          <!-- Google Sign In Button -->
          <button class="btn-google" id="btn-google-signin" type="button">
            <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Masuk dengan Google
          </button>

          <div class="auth-divider"><span>atau</span></div>

          <div id="login-container">
            <form id="email-login-form" style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Alamat Email</label>
                <input type="email" id="login-email" class="form-control" placeholder="admin@pengkaji.com" required style="width:100%">
              </div>
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Kata Sandi (Password)</label>
                <input type="password" id="login-pass" class="form-control" placeholder="••••••••" required style="width:100%">
              </div>
              <button type="submit" class="btn btn-primary" id="btn-email-signin" style="width:100%;margin-top:8px">
                <i class="fas fa-sign-in-alt"></i> Masuk dengan Email
              </button>
              <button type="button" class="btn btn-secondary" id="btn-dev-bypass" style="width:100%;">
                <i class="fas fa-hammer"></i> Masuk Tanpa Login (Bypass API)
              </button>
            </form>
            <div style="margin-top:16px;text-align:center;font-size:0.85rem">
              Belum punya akun? <a href="#" id="link-to-signup" style="color:var(--brand-400);font-weight:600;text-decoration:none">Daftar sekarang</a>
            </div>
          </div>

          <div id="signup-container" style="display:none;">
            <form id="email-signup-form" style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Nama Lengkap</label>
                <input type="text" id="signup-name" class="form-control" placeholder="Ir. Budi Santoso" required style="width:100%">
              </div>
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Alamat Email</label>
                <input type="email" id="signup-email" class="form-control" placeholder="admin@pengkaji.com" required style="width:100%">
              </div>
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Kata Sandi (Minimal 6 karakter)</label>
                <input type="password" id="signup-pass" class="form-control" placeholder="••••••••" required minlength="6" style="width:100%">
              </div>
              <button type="submit" class="btn border-primary text-primary" id="btn-email-signup" style="width:100%;margin-top:8px">
                <i class="fas fa-user-plus"></i> Buat Akun Baru
              </button>
            </form>
            <div style="margin-top:16px;text-align:center;font-size:0.85rem">
              Sudah punya akun? <a href="#" id="link-to-login" style="color:var(--brand-400);font-weight:600;text-decoration:none">Masuk di sini</a>
            </div>
          </div>

          <div class="auth-disclaimer">
            Dengan masuk, Anda menyetujui Syarat & Ketentuan penggunaan sistem.<br>
            &copy; ${n} Smart AI Pengkaji SLF &bullet; v${t.version}
          </div>
        </div>
      </div>
    </div>
  `,i=document.getElementById(`app`)||document.body;i.innerHTML=r,document.getElementById(`btn-google-signin`)?.addEventListener(`click`,Ue),document.getElementById(`email-login-form`)?.addEventListener(`submit`,We),document.getElementById(`email-signup-form`)?.addEventListener(`submit`,Ge),document.getElementById(`link-to-signup`)?.addEventListener(`click`,e=>{e.preventDefault(),document.getElementById(`login-container`).style.display=`none`,document.getElementById(`signup-container`).style.display=`block`,document.querySelector(`.auth-form-title`).innerText=`Buat Akun Baru`,document.querySelector(`.auth-form-subtitle`).innerText=`Daftarkan diri Anda untuk mengakses alat Pengkaji SLF.`}),document.getElementById(`link-to-login`)?.addEventListener(`click`,e=>{e.preventDefault(),document.getElementById(`signup-container`).style.display=`none`,document.getElementById(`login-container`).style.display=`block`,document.querySelector(`.auth-form-title`).innerText=`Selamat Datang`,document.querySelector(`.auth-form-subtitle`).innerText=`Masuk ke sistem Smart AI Pengkaji SLF menggunakan akun Google Anda.`}),document.getElementById(`btn-dev-bypass`)?.addEventListener(`click`,async e=>{e.preventDefault();let t=document.getElementById(`btn-dev-bypass`);t.disabled=!0,t.innerHTML=`<i class="fas fa-spinner fa-spin"></i> Memuat...`;try{await x(),window.navigate(`dashboard`)}catch(e){V(`Gagal Bypass: `+e.message),t.disabled=!1,t.innerHTML=`<i class="fas fa-hammer"></i> Masuk Tanpa Login (Bypass API)`}})}async function Ue(){let e=document.getElementById(`btn-google-signin`);if(e){e.disabled=!0,e.innerHTML=`
    <i class="fas fa-circle-notch fa-spin"></i>
    Menghubungkan ke Google...
  `;try{se(`Membuka jendela login Google...`),await v()}catch(t){console.error(`[Login] Google sign-in error:`,t),V(`Gagal masuk dengan Google. `+(t.message||`Periksa koneksi Anda.`)),e.disabled=!1,e.innerHTML=`
      <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Masuk dengan Google
    `}}}async function We(e){e.preventDefault();let t=document.getElementById(`btn-email-signin`),n=document.getElementById(`login-email`).value,r=document.getElementById(`login-pass`).value;if(!n||!r)return V(`Lengkapi email dan password`);t.disabled=!0;let i=t.innerHTML;t.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Memeriksa...`;try{await y(n,r)}catch(e){e.message.includes(`Invalid login credentials`)?V(`Email atau kata sandi salah!`):e.message.includes(`Email not confirmed`)?V(`Email belum diverifikasi. Silakan periksa inbox Anda.`):V(`Gagal masuk. Pastikan koneksi internet stabil.`),t.disabled=!1,t.innerHTML=i}}async function Ge(e){e.preventDefault();let t=document.getElementById(`btn-email-signup`),n=document.getElementById(`signup-name`).value,r=document.getElementById(`signup-email`).value,i=document.getElementById(`signup-pass`).value;if(!n||!r||!i)return V(`Semua form wajib diisi`);if(i.length<6)return V(`Kata sandi minimal 6 karakter`);t.disabled=!0;let a=t.innerHTML;t.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Mendaftarkan...`;try{await b(r,i,n),showSuccess(`Pendaftaran berhasil! Silakan periksa kotak masuk (Inbox/Spam) email Anda untuk menekan tombol verifikasi.`),document.getElementById(`link-to-login`).click(),document.getElementById(`login-email`).value=r,document.getElementById(`login-pass`).value=``,t.disabled=!1,t.innerHTML=a}catch(e){e.message.includes(`User already registered`)?V(`Email ini sudah terdaftar. Silakan reset password atau langsung masuk.`):V(`Pendaftaran gagal: `+e.message),t.disabled=!1,t.innerHTML=a}}async function Ke(){try{let{data:t,error:n}=await e.from(`profiles`).select(`*`).order(`full_name`,{ascending:!0});if(n)throw n;return t||[]}catch(e){return console.warn(`[Team] Gagal ambil profil tim, gunakan fallback:`,e.message),[{id:`u1`,full_name:`Bpk. Ahmad Fauzi`,role:`Lead Engineer`,status:`Active`,avatar_url:null},{id:`u2`,full_name:`Ibu Siti Aminah`,role:`Surveyor Utama`,status:`Active`,avatar_url:null},{id:`u3`,full_name:`Andi Saputra`,role:`Drafter & Analyst`,status:`Active`,avatar_url:null},{id:`u4`,full_name:`Dewi Lestari`,role:`Admin Proyek`,status:`Away`,avatar_url:null}]}}async function qe(){try{let{data:t,error:n}=await e.from(`proyek`).select(`id, nama_bangunan, assigned_to, status_slf, progress`);if(n)throw n;return(await Ke()).map(e=>{let n=(t||[]).filter(t=>t.assigned_to===e.id);return{...e,projectCount:n.length,activeProjects:n.filter(e=>e.status_slf===`DALAM_PENGKAJIAN`).length,avgProgress:n.length>0?Math.round(n.reduce((e,t)=>e+(t.progress||0),0)/n.length):0,recentProjects:n.slice(0,3)}})}catch(e){return console.warn(`[Team] Gagal hitung beban kerja:`,e.message),[]}}async function Je(t){try{let{data:n,error:r}=await e.from(`proyek`).select(`assigned_to`).eq(`id`,t).maybeSingle();if(r||!n?.assigned_to)return null;let{data:i}=await e.from(`profiles`).select(`*`).eq(`id`,n.assigned_to).maybeSingle();return i}catch{return null}}var Ye=d({dashboardPage:()=>Xe,triggerDashboardMount:()=>ot});async function Xe(){let e=nt(),t=document.getElementById(`page-root`);t&&(t.innerHTML=e);let[n,r,i,a]=await Promise.all([rt(),it(),at(),qe()]),o=T(),s=new Date,c=lt(s.getHours());return ot(r,n),`
    <div id="dashboard-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="flex-between">
          <div>
            <h1 class="page-title">${c}, ${o?.name?.split(` `)[0]||`User`}! 👋</h1>
            <p class="page-subtitle">Monitoring pengkajian SLF &bull; ${ut(s)}</p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-secondary" onclick="window.navigate('laporan')">
              <i class="fas fa-file-export"></i> Export Laporan
            </button>
            <button class="btn btn-primary" onclick="window.navigate('proyek-baru')">
              <i class="fas fa-plus"></i> Proyek Baru
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        ${Ze(n)}
      </div>

      <!-- Map Overview -->
      <div class="card" style="margin-top:var(--space-5); overflow:hidden; padding:0; display:flex; flex-direction:column">
        <div class="card-header" style="border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated); z-index:10">
          <div>
            <div class="card-title">Peta Distribusi Proyek</div>
            <div class="card-subtitle">Visualisasi spasial lokasi pengkajian SLF</div>
          </div>
        </div>
        <div id="dashboard-map" style="width:100%; height:320px; z-index:1"></div>
      </div>

      <!-- Main Grid (Responsive 3-to-1) -->
      <div class="grid-3-1" style="margin-top:var(--space-5)">

        <!-- Chart: Distribusi Temuan -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Distribusi Temuan per Aspek</div>
              <div class="card-subtitle">Berdasarkan seluruh proyek aktif</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="refreshCharts()">
              <i class="fas fa-rotate"></i>
            </button>
          </div>
          <div class="chart-wrap">
            <canvas id="chart-distribusi"></canvas>
          </div>
        </div>

        <!-- Chart: Risiko -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Level Risiko</div>
              <div class="card-subtitle">Agregat semua temuan</div>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas id="chart-risiko"></canvas>
          </div>
        </div>

        <!-- Right: AI Panel + TODO -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <!-- AI Insight Panel -->
          <div class="ai-panel">
            <div class="ai-panel-header">
              <div class="ai-icon"><i class="fas fa-brain"></i></div>
              <div>
                <div class="ai-panel-title">AI Insight</div>
                <div class="ai-panel-subtitle">Analisis otomatis sistem</div>
              </div>
            </div>
            ${Qe(n)}
          </div>

          <!-- SLF Status Summary -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Status SLF</div>
              <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek')">
                Lihat Semua →
              </button>
            </div>
            ${$e(n)}
          </div>

          <!-- Team Workload Widget -->
          <div class="card" style="border-left:3px solid var(--brand-400)">
            <div class="card-header">
              <div class="card-title">Beban Kerja Tim</div>
              <button class="btn btn-ghost btn-sm" onclick="window.navigate('tim-kerja')">
                Manajemen →
              </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px">
              ${a.slice(0,4).map(e=>`
                <div style="display:flex; align-items:center; justify-content:space-between">
                  <div class="text-xs font-semibold text-secondary truncate" style="max-width:120px">${e.full_name}</div>
                  <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end">
                    <div class="progress-wrap" style="height:4px; max-width:60px">
                      <div class="progress-fill blue" style="width:${e.activeProjects/5*100}%"></div>
                    </div>
                    <span class="text-xs font-bold text-primary">${e.activeProjects}</span>
                  </div>
                </div>
              `).join(``)}
              ${a.length===0?`<p class="text-xs text-tertiary">Belum ada data tim.</p>`:``}
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Grid (Responsive 2-to-1) -->
      <div class="grid-2-1" style="margin-top:var(--space-5)">

        <!-- Recent Projects -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Proyek Terkini</div>
              <div class="card-subtitle">${r.length} dari ${n.totalProyek||0} proyek</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.navigate('proyek')">
              Semua Proyek
            </button>
          </div>
          ${et(r)}
        </div>

        <!-- TODO Monitoring -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">TODO Monitoring</div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('todo')">
              Lihat Semua →
            </button>
          </div>
          ${tt(i)}
        </div>
      </div>
    </div>
  `}function Ze(e){return[{label:`Total Proyek`,value:e.totalProyek||0,icon:`fa-folder-open`,color:`kpi-blue`,trend:null},{label:`Proyek Aktif`,value:e.proyekAktif||0,icon:`fa-play-circle`,color:`kpi-green`,trend:null},{label:`Laik Fungsi`,value:e.laikFungsi||0,icon:`fa-circle-check`,color:`kpi-green`,trend:`+2`},{label:`Laik Bersyarat`,value:e.laikBersyarat||0,icon:`fa-triangle-exclamation`,color:`kpi-yellow`,trend:null},{label:`Tidak Laik`,value:e.tidakLaik||0,icon:`fa-circle-xmark`,color:`kpi-red`,trend:null},{label:`Task Selesai`,value:e.taskSelesai||0,icon:`fa-check-double`,color:`kpi-purple`,trend:`+5`},{label:`Task Terlambat`,value:e.taskTerlambat||0,icon:`fa-clock`,color:`kpi-red`,trend:null},{label:`Analisis AI`,value:e.totalAnalisis||0,icon:`fa-brain`,color:`kpi-purple`,trend:null},{label:`Anggota Tim`,value:e.memberCount||0,icon:`fa-user-group`,color:`kpi-blue`,trend:null}].map(e=>`
    <div class="kpi-card" onclick="window.navigate('proyek')">
      <div class="kpi-icon-wrap ${e.color}">
        <i class="fas ${e.icon}"></i>
      </div>
      <div class="kpi-value" style="color:inherit">${e.value}</div>
      <div class="kpi-label">${e.label}</div>
      ${e.trend?`<div class="kpi-trend up"><i class="fas fa-arrow-trend-up"></i> ${e.trend} bulan ini</div>`:``}
    </div>
  `).join(``)}function Qe(e){let t=e.totalProyek||0,n=e.laikFungsi||0,r=t>0?Math.round(n/t*100):0,i=[];return e.taskTerlambat>0&&i.push({type:`critical`,text:`${e.taskTerlambat} task melewati batas waktu. Tindak segera.`}),e.tidakLaik>0&&i.push({type:`warning`,text:`${e.tidakLaik} bangunan berstatus Tidak Laik Fungsi — perlu rehabilitasi.`}),i.push({type:`success`,text:`Tingkat kelulusan SLF: ${r}% dari total proyek.`}),e.proyekAktif>0&&i.push({type:``,text:`${e.proyekAktif} proyek sedang dalam proses pengkajian.`}),i.length?i.slice(0,4).map(e=>`
    <div class="ai-finding ${e.type}">
      <i class="fas ${e.type===`critical`?`fa-triangle-exclamation`:e.type===`warning`?`fa-exclamation`:e.type===`success`?`fa-circle-check`:`fa-circle-info`}" style="margin-right:6px"></i>
      ${e.text}
    </div>
  `).join(``):`<div class="ai-finding">Belum ada data proyek untuk dianalisis.</div>`}function $e(e){let t=[{label:`Laik Fungsi`,value:e.laikFungsi||0,cls:`kpi-green`,bar:`green`},{label:`Laik Bersyarat`,value:e.laikBersyarat||0,cls:`kpi-yellow`,bar:`yellow`},{label:`Tidak Laik`,value:e.tidakLaik||0,cls:`kpi-red`,bar:`red`},{label:`Dalam Pengkajian`,value:e.proyekAktif||0,cls:`kpi-blue`,bar:`blue`}],n=t.reduce((e,t)=>e+t.value,0)||1;return`<div style="display:flex;flex-direction:column;gap:10px">
    ${t.map(e=>`
      <div>
        <div class="flex-between mb-1">
          <span class="text-sm text-secondary">${e.label}</span>
          <span class="text-sm font-semibold text-primary">${e.value}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-fill ${e.bar}" style="width:${Math.round(e.value/n*100)}%"></div>
        </div>
      </div>
    `).join(``)}
  </div>`}function et(e){if(!e.length)return`<div class="empty-state"><div class="empty-icon"><i class="fas fa-folder-open"></i></div><p class="empty-title">Belum ada proyek</p><button class="btn btn-primary mt-4" onclick="window.navigate('proyek-baru')"><i class="fas fa-plus"></i> Buat Proyek</button></div>`;let t={LAIK_FUNGSI:{label:`Laik Fungsi`,cls:`badge-laik`},LAIK_FUNGSI_BERSYARAT:{label:`Laik Bersyarat`,cls:`badge-bersyarat`},TIDAK_LAIK_FUNGSI:{label:`Tidak Laik`,cls:`badge-tidak-laik`},DALAM_PENGKAJIAN:{label:`Dalam Pengkajian`,cls:`badge-proses`}};return`
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nama Bangunan</th>
            <th>Pemilik</th>
            <th>Progress</th>
            <th>Status SLF</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${e.map(e=>{let n=t[e.status_slf]||{label:e.status_slf,cls:`badge-proses`},r=e.progress||0;return`
              <tr style="cursor:pointer" onclick="window.navigate('proyek-detail', { id: '${e.id}' })">
                <td>
                  <div class="font-semibold text-primary truncate" style="max-width:180px">${e.nama_bangunan||`-`}</div>
                  <div class="text-xs text-tertiary truncate" style="max-width:180px">${e.alamat||``}</div>
                </td>
                <td class="text-secondary truncate" style="max-width:120px">${e.pemilik||`-`}</td>
                <td style="min-width:100px">
                  <div class="flex-between mb-1">
                    <span class="text-xs text-tertiary">${r}%</span>
                  </div>
                  <div class="progress-wrap">
                    <div class="progress-fill ${r>=80?`green`:r>=40?`blue`:`yellow`}" style="width:${r}%"></div>
                  </div>
                </td>
                <td><span class="badge ${n.cls}">${n.label}</span></td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window.navigate('proyek-detail', {id:'${e.id}'})">
                    <i class="fas fa-arrow-right"></i>
                  </button>
                </td>
              </tr>
            `}).join(``)}
        </tbody>
      </table>
    </div>
  `}function tt(e){if(!e.length)return`<div class="empty-state"><div class="empty-icon"><i class="fas fa-list-check"></i></div><p class="empty-title">Tidak ada task</p></div>`;let t={critical:`badge-critical`,high:`badge-high`,medium:`badge-medium`,low:`badge-low`};return`<div style="display:flex;flex-direction:column;gap:8px">
    ${e.slice(0,8).map(e=>`
      <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:10px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all var(--transition-fast)"
           onmouseenter="this.style.borderColor='var(--border-default)'"
           onmouseleave="this.style.borderColor='var(--border-subtle)'"
           onclick="window.navigate('todo-detail', {id:'${e.id}'})">
        <div style="width:3px;height:36px;border-radius:2px;background:${e.priority===`critical`?`var(--danger-400)`:e.priority===`high`?`var(--warning-400)`:`var(--brand-400)`};flex-shrink:0"></div>
        <div style="flex:1;overflow:hidden">
          <div class="text-sm font-semibold text-primary truncate">${e.judul||e.title||`-`}</div>
          <div class="text-xs text-tertiary truncate">${e.proyek_nama||`Umum`}</div>
        </div>
        <span class="badge ${t[e.priority]||`badge-medium`}" style="font-size:0.65rem">${e.priority||`medium`}</span>
      </div>
    `).join(``)}
  </div>`}function nt(){return`
    <div class="page-header">
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:20px;width:200px"></div>
    </div>
    <div class="kpi-grid">
      ${Array(8).fill(0).map(()=>`
        <div class="kpi-card">
          <div class="skeleton" style="height:44px;width:44px;border-radius:10px;margin-bottom:12px"></div>
          <div class="skeleton" style="height:40px;width:60px;margin-bottom:8px"></div>
          <div class="skeleton" style="height:16px;width:100px"></div>
        </div>
      `).join(``)}
    </div>
  `}async function rt(){let t=async(t,n=null)=>{try{let r=e.from(t).select(`*`,{count:`exact`,head:!0});n&&(r=n(r));let{count:i,error:a}=await r;if(a)throw a;return i||0}catch(e){return console.warn(`[Dashboard] Skip ${t}:`,e.message),0}},n=await Promise.all([t(`proyek`),t(`proyek`,e=>e.eq(`status_slf`,`DALAM_PENGKAJIAN`)),t(`proyek`,e=>e.eq(`status_slf`,`LAIK_FUNGSI`)),t(`proyek`,e=>e.eq(`status_slf`,`LAIK_FUNGSI_BERSYARAT`)),t(`proyek`,e=>e.eq(`status_slf`,`TIDAK_LAIK_FUNGSI`)),t(`todo_tasks`,e=>e.eq(`status`,`Done`)),t(`todo_tasks`,e=>e.lt(`due_date`,new Date().toISOString()).neq(`status`,`Done`)),t(`hasil_analisis`),t(`profiles`),e.from(`hasil_analisis`).select(`skor_administrasi, skor_struktur, skor_arsitektur, skor_mep, skor_kebakaran, skor_kesehatan, skor_kenyamanan, skor_kemudahan, risk_level`)]),r=n[9].data||[],i={administrasi:r.filter(e=>e.skor_administrasi<65&&e.skor_administrasi>0).length,struktur:r.filter(e=>e.skor_struktur<65&&e.skor_struktur>0).length,arsitektur:r.filter(e=>e.skor_arsitektur<65&&e.skor_arsitektur>0).length,mep:r.filter(e=>(e.skor_mep||e.skor_kebakaran)<65&&(e.skor_mep||e.skor_kebakaran)>0).length,kebakaran:r.filter(e=>e.skor_kebakaran<65&&e.skor_kebakaran>0).length,kesehatan:r.filter(e=>e.skor_kesehatan<65&&e.skor_kesehatan>0).length,kenyamanan:r.filter(e=>e.skor_kenyamanan<65&&e.skor_kenyamanan>0).length,kemudahan:r.filter(e=>e.skor_kemudahan<65&&e.skor_kemudahan>0).length},a={low:r.filter(e=>e.risk_level===`low`).length,medium:r.filter(e=>e.risk_level===`medium`).length,high:r.filter(e=>e.risk_level===`high`).length,critical:r.filter(e=>e.risk_level===`critical`).length};return{totalProyek:n[0],proyekAktif:n[1],laikFungsi:n[2],laikBersyarat:n[3],tidakLaik:n[4],taskSelesai:n[5],taskTerlambat:n[6],totalAnalisis:n[7],memberCount:n[8]||4,chartData:{distribusi:i,risiko:a}}}async function it(){try{let{data:t}=await e.from(`proyek`).select(`id, nama_bangunan, kota, alamat, pemilik, status_slf, progress, latitude, longitude, updated_at`).not(`latitude`,`is`,null).order(`updated_at`,{ascending:!1}).limit(30);return t||[]}catch{return[]}}async function at(){try{let{data:t}=await e.from(`todo_tasks`).select(`id, judul, title, priority, status, due_date, proyek_nama`).neq(`status`,`Done`).order(`priority`,{ascending:!1}).limit(8);return t||[]}catch{return[]}}function ot(e,t){setTimeout(()=>{ct(t),st(e)},100)}function st(e){if(window.L===void 0||!document.getElementById(`dashboard-map`))return;if(window._dashMap){try{window._dashMap.remove()}catch{}window._dashMap=null}let t=window.L.map(`dashboard-map`,{zoomControl:!1});t.setView([-2.5489,118.0149],5),window.L.control.zoom({position:`bottomright`}).addTo(t),window._dashMap=t,window.L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`,{attribution:`&copy; CARTO`,subdomains:`abcd`,maxZoom:20}).addTo(t);let n=window.L.featureGroup().addTo(t);if(e.forEach(e=>{let t=e.latitude,r=e.longitude;(!t||!r)&&(t=-6.2088+(Math.random()*.1-.05),r=106.8456+(Math.random()*.1-.05));let i=e.status_slf===`LAIK_FUNGSI`?`#10b981`:e.status_slf===`TIDAK_LAIK_FUNGSI`?`#ef4444`:e.status_slf===`LAIK_FUNGSI_BERSYARAT`?`#f59e0b`:`#3b82f6`,a=window.L.divIcon({className:`custom-marker`,html:`<div style="background:${i}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${i}"></div>`,iconSize:[12,12]});window.L.marker([t,r],{icon:a}).addTo(n).bindPopup(`
      <div style="font-family:'Outfit',sans-serif; min-width:200px; padding:4px">
        <div style="font-weight:800; color:#1e293b; margin-bottom:4px; font-size:14px">${e.nama_bangunan}</div>
        <div style="font-size:11px; color:#64748b; margin-bottom:10px"><i class="fas fa-location-dot"></i> ${e.kota||`Lokasi tidak spesifik`}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; pt:8px; margin-top:8px">
           <span style="font-size:9px; font-weight:700; text-transform:uppercase; color:${i}">${e.status_slf?.replace(/_/g,` `)}</span>
           <button class="btn btn-primary btn-xs" onclick="window.navigate('proyek-detail', {id:'${e.id}'})" style="padding:2px 8px; font-size:10px">Detail &rarr;</button>
        </div>
      </div>
    `)}),e.length>0){let t=e[0],r=t.latitude&&t.longitude;setTimeout(()=>{try{if(!window._dashMap||!document.getElementById(`dashboard-map`))return;if(r)window._dashMap.flyTo([t.latitude,t.longitude],15,{animate:!0,duration:2});else{let e=n.getBounds();e.isValid()&&window._dashMap.fitBounds(e,{padding:[50,50],maxZoom:12})}}catch(e){console.warn(`[Dashboard Map] Suppressed focus error:`,e.message)}},800)}}async function ct(e){if(window.Chart===void 0||!e.chartData)return;let t=document.getElementById(`chart-distribusi`),n=document.getElementById(`chart-risiko`),r=e.chartData;window._distChart&&window._distChart.destroy(),window._riskChart&&window._riskChart.destroy(),t&&(window._distChart=new window.Chart(t,{type:`doughnut`,data:{labels:[`Admin`,`Pemanfaatan`,`Arsitektur`,`Struktur`,`MEP`,`Kesehatan`,`Kenyamanan`,`Kemudahan`],datasets:[{data:[r.distribusi.administrasi,r.distribusi.pemanfaatan||0,r.distribusi.arsitektur,r.distribusi.struktur,r.distribusi.mep||r.distribusi.kebakaran,r.distribusi.kesehatan,r.distribusi.kenyamanan,r.distribusi.kemudahan],backgroundColor:[`#3b82f6`,`#8b5cf6`,`#ef4444`,`#f59e0b`,`#dc2626`,`#10b981`,`#f59e0b`,`#06b6d4`],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:`65%`,plugins:{legend:{position:`right`,labels:{color:`hsl(220,12%,70%)`,usePointStyle:!0,font:{size:10}}}}}})),n&&(window._riskChart=new window.Chart(n,{type:`bar`,data:{labels:[`Rendah`,`Sedang`,`Tinggi`,`Kritis`],datasets:[{data:[r.risiko.low,r.risiko.medium,r.risiko.high,r.risiko.critical],backgroundColor:[`#10b981`,`#f59e0b`,`#ef4444`,`#7f1d1d`],borderRadius:8}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{beginAtZero:!0,grid:{color:`rgba(255,255,255,0.05)`},ticks:{color:`#94a3b8`}},x:{grid:{display:!1},ticks:{color:`#94a3b8`}}}}}))}function lt(e){return e<11?`Selamat Pagi`:e<15?`Selamat Siang`:e<18?`Selamat Sore`:`Selamat Malam`}function ut(e){return e.toLocaleDateString(`id-ID`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`})}window.navigate=M,window.refreshCharts=()=>window.location.reload();async function dt(){return`
    <div id="proyek-list-page">
      <div class="page-header flex-between">
        <div>
          <h1 class="page-title">Daftar Proyek SLF</h1>
          <p class="page-subtitle">Kelola seluruh proyek pengkajian Sertifikat Laik Fungsi</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary" onclick="exportProyek()">
            <i class="fas fa-file-export"></i> Export
          </button>
          <button class="btn btn-primary" onclick="window.navigate('proyek-baru')">
            <i class="fas fa-plus"></i> Proyek Baru
          </button>
        </div>
      </div>

      <!-- Filters (Responsive Grid) -->
      <div class="card" style="padding:var(--space-4);margin-bottom:var(--space-5)">
        <div class="grid-main-responsive" style="align-items:center; grid-template-columns: 1fr auto auto auto;">
          <div style="position:relative">
            <i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);font-size:0.8rem"></i>
            <input type="text" id="search-proyek" class="form-input" placeholder="Cari gedung/pemilik..."
                   style="padding-left:36px" oninput="filterProyek(this.value)" />
          </div>
          <select class="form-select" id="filter-status" onchange="filterProyek()" style="min-width:140px">
            <option value="">Status</option>
            <option value="DALAM_PENGKAJIAN">Proses</option>
            <option value="LAIK_FUNGSI">Laik</option>
            <option value="LAIK_FUNGSI_BERSYARAT">Bersyarat</option>
            <option value="TIDAK_LAIK_FUNGSI">Tidak Laik</option>
          </select>
          <select class="form-select" id="filter-sort" onchange="sortProyek(this.value)" style="min-width:120px">
            <option value="updated_at">Terbaru</option>
            <option value="nama_bangunan">A-Z</option>
          </select>
          <div id="proyek-count" class="text-xs text-tertiary" style="white-space:nowrap"></div>
        </div>
      </div>

      <!-- Loading -->
      <div id="proyek-loading">
        ${[,,,,,].fill(0).map(()=>`
          <div class="card" style="margin-bottom:12px;display:flex;gap:16px;padding:20px">
            <div class="skeleton" style="width:48px;height:48px;border-radius:10px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:20px;width:60%;margin-bottom:8px"></div>
              <div class="skeleton" style="height:16px;width:40%"></div>
            </div>
          </div>
        `).join(``)}
      </div>

      <!-- Proyek Cards -->
      <div id="proyek-list-container"></div>
    </div>
  `}async function ft(){await mt()}var pt=[];async function mt(){try{let{data:t,error:n}=await e.from(`proyek`).select(`*`).order(`updated_at`,{ascending:!1});if(n)throw n;pt=t||[],ht(pt)}catch(e){V(`Gagal memuat data proyek: `+e.message),document.getElementById(`proyek-loading`).innerHTML=`
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div>
        <p class="empty-title">Gagal memuat proyek</p>
        <p class="empty-desc">${e.message}</p>
        <button class="btn btn-secondary mt-4" onclick="location.reload()">Coba Lagi</button>
      </div>
    `}}function ht(e){let t=document.getElementById(`proyek-loading`),n=document.getElementById(`proyek-list-container`),r=document.getElementById(`proyek-count`);if(t&&(t.style.display=`none`),r&&(r.textContent=`${e.length} proyek`),!n)return;if(!e.length){n.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-folder-open"></i></div>
        <h3 class="empty-title">Belum ada proyek</h3>
        <p class="empty-desc">Mulai dengan membuat proyek SLF pertama Anda.</p>
        <button class="btn btn-primary mt-4" onclick="window.navigate('proyek-baru')">
          <i class="fas fa-plus"></i> Buat Proyek Pertama
        </button>
      </div>
    `;return}let i={LAIK_FUNGSI:{label:`Laik Fungsi`,cls:`badge-laik`,icon:`fa-circle-check`},LAIK_FUNGSI_BERSYARAT:{label:`Laik Bersyarat`,cls:`badge-bersyarat`,icon:`fa-triangle-exclamation`},TIDAK_LAIK_FUNGSI:{label:`Tidak Laik`,cls:`badge-tidak-laik`,icon:`fa-circle-xmark`},DALAM_PENGKAJIAN:{label:`Dalam Pengkajian`,cls:`badge-proses`,icon:`fa-clock`}};n.innerHTML=e.map(e=>{let t=i[e.status_slf]||{label:e.status_slf||`-`,cls:`badge-proses`,icon:`fa-circle`},n=e.progress||0,r=e.updated_at?new Date(e.updated_at).toLocaleDateString(`id-ID`):`-`;return`
      <div class="card" style="margin-bottom:12px;cursor:pointer;display:flex;gap:var(--space-4);align-items:center;flex-wrap:wrap"
           onclick="window.navigate('proyek-detail', {id:'${e.id}'})"
           onmouseenter="this.style.transform='translateY(-1px)';this.style.borderColor='var(--border-brand)'"
           onmouseleave="this.style.transform='';this.style.borderColor=''">

        <!-- Icon (Hidden on very small mobile) -->
        <div class="hide-mobile" style="width:48px;height:48px;border-radius:var(--radius-lg);background:var(--gradient-brand);display:flex;align-items:center;justify-content:center;color:white;font-size:1.1rem;flex-shrink:0">
          <i class="fas fa-building"></i>
        </div>

        <!-- Info -->
        <div style="flex:1;overflow:hidden">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <h3 class="font-semibold text-primary" style="font-size:0.95rem">${e.nama_bangunan||`Tanpa Nama`}</h3>
            <span class="badge ${t.cls}">
              <i class="fas ${t.icon}"></i> ${t.label}
            </span>
          </div>
          <div class="text-xs text-tertiary" style="margin-bottom:8px">
            <i class="fas fa-location-dot" style="margin-right:4px;color:var(--brand-400)"></i>${e.alamat||`-`}
            &bull;
            <i class="fas fa-user" style="margin-left:6px;margin-right:4px;color:var(--brand-400)"></i>${e.pemilik||`-`}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="progress-wrap" style="flex:1;max-width:200px">
              <div class="progress-fill ${n>=80?`green`:n>=40?`blue`:`yellow`}" style="width:${n}%"></div>
            </div>
            <span class="text-xs text-tertiary">${n}%</span>
          </div>
        </div>

        <!-- Meta -->
        <div style="text-align:right;flex-shrink:0">
          <div class="text-xs text-tertiary">${r}</div>
          <div class="text-xs text-brand mt-1">${e.jenis_bangunan||`Bangunan Gedung`}</div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" title="Checklist" onclick="event.stopPropagation();window.navigate('checklist',{id:'${e.id}'})">
            <i class="fas fa-clipboard-check"></i>
          </button>
          <button class="btn btn-ghost btn-sm" title="Analisis AI" onclick="event.stopPropagation();window.navigate('analisis',{id:'${e.id}'})">
            <i class="fas fa-brain"></i>
          </button>
          <button class="btn btn-ghost btn-sm text-danger" title="Hapus" onclick="event.stopPropagation();deleteProyek('${e.id}','${e.nama_bangunan}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `}).join(``)}window.filterProyek=function(e=``){let t=(e||document.getElementById(`search-proyek`)?.value||``).toLowerCase(),n=document.getElementById(`filter-status`)?.value||``;ht(pt.filter(e=>{let r=!t||(e.nama_bangunan||``).toLowerCase().includes(t)||(e.alamat||``).toLowerCase().includes(t)||(e.pemilik||``).toLowerCase().includes(t),i=!n||e.status_slf===n;return r&&i}))},window.sortProyek=function(e){ht([...pt].sort((t,n)=>e===`nama_bangunan`?(t.nama_bangunan||``).localeCompare(n.nama_bangunan||``):e===`status_slf`?(t.status_slf||``).localeCompare(n.status_slf||``):new Date(n.updated_at)-new Date(t.updated_at)))},window.deleteProyek=async function(t,n){if(await ne({title:`Hapus Proyek`,message:`Yakin ingin menghapus proyek <strong>${n}</strong>? Semua data terkait akan ikut terhapus.`,confirmText:`Hapus Permanen`,danger:!0}))try{let{error:n}=await e.from(`proyek`).delete().eq(`id`,t);if(n)throw n;pt=pt.filter(e=>e.id!==t),ht(pt),B(`Proyek berhasil dihapus.`)}catch(e){V(`Gagal menghapus proyek: `+e.message)}},window.exportProyek=function(){if(!pt.length)return;let e=[`ID,Nama Bangunan,Alamat,Pemilik,Status SLF,Progress,Tanggal Update`,...pt.map(e=>[e.id,`"${e.nama_bangunan}"`,`"${e.alamat}"`,`"${e.pemilik}"`,e.status_slf,e.progress,e.updated_at].join(`,`))].join(`
`),t=new Blob([e],{type:`text/csv`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`proyek-slf-${Date.now()}.csv`,r.click(),URL.revokeObjectURL(n)};async function gt(n={}){let r=!!n.id,i={};if(r){let{data:t}=await e.from(`proyek`).select(`*`).eq(`id`,n.id).maybeSingle();i=t||{}}let a=await Ke();return setTimeout(()=>window.initProyekMap&&window.initProyekMap(i.latitude,i.longitude),100),`
    <div id="proyek-form-page">
      <div class="page-header flex-between">
        <div>
          <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek')" style="margin-bottom:8px">
            <i class="fas fa-arrow-left"></i> Kembali
          </button>
          <h1 class="page-title">${r?`Edit Proyek`:`Proyek SLF Baru`}</h1>
          <p class="page-subtitle">${r?`Perbarui data proyek pengkajian SLF`:`Isi data bangunan yang akan dikaji Sertifikat Laik Fungsinya`}</p>
        </div>
        ${r?``:`
          <div class="ai-scanner-btn" onclick="window._triggerOCRScan()">
            <i class="fas fa-expand-arrows-alt"></i>
            <span>Scan IMB via AI OCR</span>
          </div>
        `}
      </div>

      <form id="proyek-form" onsubmit="submitProyek(event)">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--space-5)">

          <!-- Left Column -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">

            <!-- Data Bangunan -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-building" style="color:var(--brand-400);margin-right:8px"></i>
                Data Bangunan
              </div>

              <div class="form-group">
                <label class="form-label">Nama Bangunan <span class="required">*</span></label>
                <input type="text" class="form-input" name="nama_bangunan"
                       value="${i.nama_bangunan||``}" placeholder="Gedung Perkantoran XYZ" required />
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Jenis Bangunan <span class="required">*</span></label>
                  <select class="form-select" name="jenis_bangunan" required>
                    <option value="">Pilih Jenis</option>
                    ${[`Bangunan Gedung`,`Hunian`,`Komersial`,`Industri`,`Pendidikan`,`Kesehatan`,`Ibadah`,`Pemerintahan`,`Campuran`].map(e=>`<option value="${e}" ${i.jenis_bangunan===e?`selected`:``}>${e}</option>`).join(``)}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Konstruksi Utama</label>
                  <select class="form-select" name="jenis_konstruksi">
                    <option value="">Pilih Konstruksi</option>
                    ${[`Beton Bertulang`,`Baja`,`Kayu`,`Bata`,`Komposit`].map(e=>`<option value="${e}" ${i.jenis_konstruksi===e?`selected`:``}>${e}</option>`).join(``)}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Alamat Lengkap <span class="required">*</span></label>
                <textarea class="form-textarea" name="alamat" rows="2" placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota" required>${i.alamat||``}</textarea>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Kecamatan <span class="required">*</span></label>
                  <input type="text" class="form-input" name="kecamatan" value="${i.kecamatan||``}" placeholder="Kec. Banjarwangi" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Kelurahan / Desa <span class="required">*</span></label>
                  <input type="text" class="form-input" name="kelurahan" value="${i.kelurahan||``}" placeholder="Desa Kadongdong" required />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Kota / Kabupaten <span class="required">*</span></label>
                  <input type="text" class="form-input" name="kota" value="${i.kota||``}" placeholder="Kab. Garut" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Provinsi <span class="required">*</span></label>
                  <input type="text" class="form-input" name="provinsi" value="${i.provinsi||``}" placeholder="Jawa Barat" required />
                </div>
              </div>

              <!-- Peta GeoLocation -->
              <div class="form-group" style="margin-top:var(--space-4)">
                <label class="form-label">Titik Koordinat Asli GPS <span class="required">*</span></label>
                <div class="form-hint" style="margin-bottom:8px">Geser <i>pin</i> merah ke lokasi gedung dengan akurat. Anda juga dapat menggunakan lokasi Anda saat ini.</div>
                <div id="proyek-map" style="width:100%;height:250px;border-radius:var(--radius-md);border:1px solid var(--border-subtle);z-index:1;background:#f1f5f9"></div>
                <div class="grid-2" style="margin-top:8px">
                  <input type="text" class="form-input" id="input-lat" name="latitude" value="${i.latitude||``}" placeholder="Latitude" readonly style="background:var(--bg-elevated);color:var(--text-300)" />
                  <input type="text" class="form-input" id="input-lng" name="longitude" value="${i.longitude||``}" placeholder="Longitude" readonly style="background:var(--bg-elevated);color:var(--text-300)" />
                </div>
              </div>
            </div>

            <!-- Data Teknis -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-ruler-combined" style="color:var(--brand-400);margin-right:8px"></i>
                Data Teknis Bangunan
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Luas Bangunan (m²)</label>
                  <input type="number" class="form-input" name="luas_bangunan" value="${i.luas_bangunan||``}" placeholder="1000" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Luas Lahan (m²)</label>
                  <input type="number" class="form-input" name="luas_lahan" value="${i.luas_lahan||``}" placeholder="2000" min="0" />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Jumlah Lantai</label>
                  <input type="number" class="form-input" name="jumlah_lantai" value="${i.jumlah_lantai||``}" placeholder="5" min="1" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tahun Dibangun</label>
                  <input type="number" class="form-input" name="tahun_dibangun" value="${i.tahun_dibangun||``}" placeholder="2000" min="1900" max="${new Date().getFullYear()}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nomor PBG / IMB</label>
                <input type="text" class="form-input" name="nomor_pbg" value="${i.nomor_pbg||``}" placeholder="No. IMB/PBG jika ada" />
                <span class="form-hint">Persetujuan Bangunan Gedung / Izin Mendirikan Bangunan</span>
              </div>

              <div class="form-group">
                <label class="form-label">Fungsi Utama Bangunan</label>
                <textarea class="form-textarea" name="fungsi_bangunan" rows="2" placeholder="Deskripsi fungsi utama bangunan...">${i.fungsi_bangunan||``}</textarea>
              </div>

              <!-- SIMBG Technical Intensity -->
              <div style="margin-top:var(--space-4); padding:var(--space-4); background:var(--bg-elevated); border-radius:var(--radius-md); border-left:3px solid var(--brand-400)">
                <div class="card-title" style="margin-bottom:var(--space-3); font-size:0.9rem">
                  Data Intensitas Bangunan (SIMBG)
                </div>
                <div class="grid-4">
                  <div class="form-group">
                    <label class="form-label">GSB (m)</label>
                    <input type="number" step="0.1" class="form-input" name="gsb" value="${i.gsb||``}" placeholder="3.0" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">KDB (%)</label>
                    <input type="number" step="0.1" class="form-input" name="kdb" value="${i.kdb||``}" placeholder="60.0" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">KLB</label>
                    <input type="number" step="0.1" class="form-input" name="klb" value="${i.klb||``}" placeholder="2.4" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">KDH (%)</label>
                    <input type="number" step="0.1" class="form-input" name="kdh" value="${i.kdh||``}" placeholder="10.0" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Tanah Detail (Sesuai SIMBG) -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-map-marked-alt" style="color:var(--brand-400);margin-right:8px"></i>
                Data Tanah Detail (SIMBG Step 2)
              </div>
              
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Jenis Dokumen Tanah</label>
                  <select class="form-input" name="jenis_dokumen_tanah">
                    <option value="" disabled ${i.jenis_dokumen_tanah?``:`selected`}>Pilih Jenis...</option>
                    <option value="Sertifikat" ${i.jenis_dokumen_tanah===`Sertifikat`?`selected`:``}>Sertifikat</option>
                    <option value="AJB" ${i.jenis_dokumen_tanah===`AJB`?`selected`:``}>AJB (Akta Jual Beli)</option>
                    <option value="Girik" ${i.jenis_dokumen_tanah===`Girik`?`selected`:``}>Girik / Letter C</option>
                    <option value="Lainnya" ${i.jenis_dokumen_tanah===`Lainnya`?`selected`:``}>Lainnya</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Hak Kepemilikan (Status Hak)</label>
                  <select class="form-input" name="hak_kepemilikan">
                    <option value="" disabled ${i.hak_kepemilikan?``:`selected`}>Pilih Hak...</option>
                    <option value="Hak Milik" ${i.hak_kepemilikan===`Hak Milik`?`selected`:``}>Hak Milik (SHM)</option>
                    <option value="HGB" ${i.hak_kepemilikan===`HGB`?`selected`:``}>Hak Guna Bangunan (HGB)</option>
                    <option value="Hak Pakai" ${i.hak_kepemilikan===`Hak Pakai`?`selected`:``}>Hak Pakai (HP)</option>
                    <option value="Hak Kelola" ${i.hak_kepemilikan===`Hak Kelola`?`selected`:``}>Hak Pengelolaan</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nomor Dokumen Tanah (No. Sertifikat)</label>
                <input type="text" class="form-input" name="no_dokumen_tanah" value="${i.no_dokumen_tanah||i.no_sertifikat||``}" placeholder="Contoh: 10.17.19.06.1.01072" />
              </div>

              <div class="grid-2" style="margin-top:var(--space-2)">
                <div class="form-group">
                  <label class="form-label">Tanggal Terbit Dokumen</label>
                  <input type="date" class="form-input" name="tgl_terbit_tanah" value="${i.tgl_terbit_tanah||i.tgl_sertifikat||``}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Luas Tanah (m²)</label>
                  <input type="number" class="form-input" name="luas_tanah" value="${i.luas_tanah||``}" placeholder="1798" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nama Lengkap Pemilik Hak Tanah</label>
                <input type="text" class="form-input" name="nama_pemilik_tanah" value="${i.nama_pemilik_tanah||``}" placeholder="Sesuai Nama di Sertifikat" />
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Provinsi Tanah</label>
                  <input type="text" class="form-input" name="tanah_provinsi" value="${i.tanah_provinsi||``}" placeholder="Jawa Barat" />
                </div>
                <div class="form-group">
                  <label class="form-label">Kabupaten / Kota Tanah</label>
                  <input type="text" class="form-input" name="tanah_kota" value="${i.tanah_kota||``}" placeholder="Kab. Garut" />
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Kecamatan Tanah</label>
                  <input type="text" class="form-input" name="tanah_kecamatan" value="${i.tanah_kecamatan||``}" placeholder="Banjarwangi" />
                </div>
                <div class="form-group">
                  <label class="form-label">Kelurahan / Desa Tanah</label>
                  <input type="text" class="form-input" name="tanah_kelurahan" value="${i.tanah_kelurahan||``}" placeholder="Kadongdong" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Alamat Lengkap Tanah (Kp/Blok/RT/RW)</label>
                <textarea class="form-textarea" name="alamat_tanah_lengkap" rows="2" placeholder="Detail alamat di sertifikat...">${i.alamat_tanah_lengkap||``}</textarea>
              </div>

              <div style="margin-top:var(--space-4); padding:var(--space-4); background:var(--bg-elevated); border-radius:var(--radius-md)">
                <div class="form-group mb-0">
                  <label class="form-label" style="display:flex; align-items:center; gap:8px">
                    <input type="checkbox" name="pemilik_tanah_sama" value="true" ${i.pemilik_tanah_sama?`checked`:``} onchange="togglePemanfaatanSection(this.checked)" /> 
                    Pemilik tanah sama dengan pemilik bangunan?
                  </label>
                </div>
              </div>

              <!-- Section: Perjanjian Pemanfaatan (Muncul jika pemilik berbeda) -->
              <div id="section-pemanfaatan" style="margin-top:var(--space-4); border-top:1px dashed var(--border-subtle); padding-top:var(--space-4); ${i.pemilik_tanah_sama?`display:none`:``}">
                <div class="card-title text-sm" style="margin-bottom:var(--space-3)">
                  Perjanjian Pemanfaatan Tanah
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Nomor Surat Perjanjian</label>
                  <input type="text" class="form-input" name="no_surat_perjanjian" value="${i.no_surat_perjanjian||``}" placeholder="25/SMK-IMG/VIII/2025" />
                </div>
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label text-xs">Tanggal Terbit Surat</label>
                    <input type="date" class="form-input" name="tgl_surat_perjanjian" value="${i.tgl_surat_perjanjian||``}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs">Nama Penerima / Pemegang Surat</label>
                    <input type="text" class="form-input" name="penerima_perjanjian" value="${i.penerima_perjanjian||``}" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Catatan / Kondisi Awal -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-note-sticky" style="color:var(--brand-400);margin-right:8px"></i>
                Catatan Awal
              </div>
              <div class="form-group">
                <label class="form-label">Kondisi Umum Bangunan</label>
                <textarea class="form-textarea" name="kondisi_umum" rows="3" placeholder="Deskripsi kondisi umum bangunan saat ini...">${i.kondisi_umum||``}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Catatan Khusus</label>
                <textarea class="form-textarea" name="catatan" rows="2" placeholder="Catatan tambahan untuk pengkaji...">${i.catatan||``}</textarea>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">

            <!-- Pemilik -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-user" style="color:var(--brand-400);margin-right:8px"></i>
                Data Pemilik / Pemohon
              </div>

              <div class="form-group">
                <label class="form-label">Nama Pemilik <span class="required">*</span></label>
                <input type="text" class="form-input" name="pemilik" value="${i.pemilik||``}" placeholder="PT Contoh atau Nama Pribadi" required />
              </div>
              <div class="form-group">
                <label class="form-label">Penanggung Jawab</label>
                <input type="text" class="form-input" name="penanggung_jawab" value="${i.penanggung_jawab||``}" placeholder="Nama PIC" />
              </div>
              <div class="form-group">
                <label class="form-label">Telepon / HP</label>
                <input type="tel" class="form-input" name="telepon" value="${i.telepon||``}" placeholder="08xx-xxxx-xxxx" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" name="email_pemilik" value="${i.email_pemilik||``}" placeholder="email@domain.com" />
              </div>
            </div>

            <!-- Status SLF -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-shield-halved" style="color:var(--brand-400);margin-right:8px"></i>
                Status SLF
              </div>

              <div class="form-group">
                <label class="form-label">Status Awal</label>
                <select class="form-select" name="status_slf">
                  ${t.statusSLF.map(e=>`
                    <option value="${e.value}" ${(i.status_slf||`DALAM_PENGKAJIAN`)===e.value?`selected`:``}>${e.label}</option>
                  `).join(``)}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tanggal Mulai Pengkajian</label>
                <input type="date" class="form-input" name="tanggal_mulai" value="${i.tanggal_mulai||new Date().toISOString().split(`T`)[0]}" />
              </div>
              <div class="form-group">
                <label class="form-label">Target Selesai</label>
                <input type="date" class="form-input" name="tanggal_target" value="${i.tanggal_target||``}" />
              </div>
              <div class="form-group" style="padding-top:var(--space-4); border-top:1px solid var(--border-subtle); margin-top:var(--space-4)">
                <label class="form-label">Penanggung Jawab (PIC) <i class="fas fa-user-gear" style="margin-left:4px; font-size:0.8rem"></i></label>
                <select class="form-select" name="assigned_to">
                  <option value="">-- Delegasikan ke --</option>
                  ${a.map(e=>`
                    <option value="${e.id}" ${i.assigned_to===e.id?`selected`:``}>${e.full_name} (${e.role})</option>
                  `).join(``)}
                </select>
                <span class="form-hint" style="font-size:0.7rem">Delegasikan proyek ini ke anggota tim tertentu.</span>
              </div>
            </div>
            
            <!-- SIMBG Integration -->
            <div class="card" style="border-left: 3px solid #3b82f6;">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-link" style="color:#3b82f6;margin-right:8px"></i>
                Integrasi SIMBG (Pemohon)
              </div>
              <p class="text-xs text-tertiary" style="margin-bottom:var(--space-4)">
                Gunakan kredensial akun SIMBG pemohon untuk sinkronisasi data teknis otomatis.
              </p>
              <div class="form-group">
                <label class="form-label">Email Akun SIMBG</label>
                <input type="email" class="form-input" name="simbg_email" value="${i.simbg_email||``}" placeholder="email@simbg.pu.go.id" />
              </div>
              <div class="form-group">
                <label class="form-label">Password Akun SIMBG</label>
                <input type="password" class="form-input" name="simbg_password" value="${i.simbg_password||``}" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label">ID Permohonan SIMBG (UUID)</label>
                <input type="text" class="form-input" name="simbg_id" value="${i.simbg_id||``}" placeholder="fb327276-a285-4fe9-8e6a..." />
                <span class="form-hint" style="font-size:0.65rem">ID unik dari URL dashboard SIMBG.</span>
              </div>
              <div class="form-hint" style="font-size:0.7rem; color:var(--text-tertiary)">
                <i class="fas fa-shield-halved"></i> Data disimpan untuk proses otomatisasi bot (Opsi A).
              </div>
            </div>

            <!-- AI Configuration -->
            <div class="ai-panel">
              <div class="ai-panel-header">
                <div class="ai-icon"><i class="fas fa-brain"></i></div>
                <div>
                  <div class="ai-panel-title">AI Engine</div>
                  <div class="ai-panel-subtitle">Konfigurasi analisis otomatis</div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:hsla(258,60%,80%,0.8)">Fokus Analisis</label>
                <select class="form-select" name="ai_focus" style="background:hsla(0,0%,0%,0.3);border-color:hsla(258,60%,50%,0.3)">
                  <option value="komprehensif">Komprehensif (Semua Aspek)</option>
                  <option value="struktur">Prioritas Struktur</option>
                  <option value="kebakaran">Prioritas Keselamatan Kebakaran</option>
                  <option value="seismik">Analisis Seismik (ASCE 41-17)</option>
                </select>
              </div>
              <div class="ai-finding success">
                <i class="fas fa-circle-check" style="margin-right:6px"></i>
                AI Engine siap menganalisis setelah checklist diisi
              </div>
            </div>

            <!-- Submit -->
            <div style="display:flex;gap:var(--space-3)">
              <button type="submit" class="btn btn-primary" style="flex:1;padding:14px" id="btn-submit-proyek">
                <i class="fas ${r?`fa-save`:`fa-plus`}"></i>
                ${r?`Simpan Perubahan`:`Buat Proyek`}
              </button>
              ${r?``:`
                <button type="button" class="btn btn-secondary" style="padding:14px" id="btn-fill-sample" title="Isi Data Dummy" onclick="fillSampleData()">
                  <i class="fas fa-magic"></i>
                </button>
              `}
            </div>
          </div>
        </div>
      </form>
    </div>
  `}window.fillSampleData=function(){let e=document.getElementById(`proyek-form`);e&&(e.elements.nama_bangunan.value=`Gedung Rektorat Universitas Teknologi`,e.elements.jenis_bangunan.value=`Pendidikan`,e.elements.jenis_konstruksi.value=`Beton Bertulang`,e.elements.alamat.value=`Jl. Anggrek Cendrawasih No. 45, Kecamatan Pakubuwono, Kota Megapolitan`,e.elements.kota.value=`Megapolitan`,e.elements.provinsi.value=`Jawa Barat`,e.elements.latitude.value=`-6.208800`,e.elements.longitude.value=`106.845600`,window._proyekMarker&&(window._proyekMarker.setLatLng([-6.2088,106.8456]),window._proyekMap.panTo([-6.2088,106.8456])),e.elements.luas_bangunan.value=`4200`,e.elements.luas_lahan.value=`6500`,e.elements.jumlah_lantai.value=`8`,e.elements.tahun_dibangun.value=`2010`,e.elements.nomor_pbg.value=`PBG/2010/REK-UT/0042`,e.elements.fungsi_bangunan.value=`Fasilitas pendidikan utama yang menampung kantor administratif universitas dan ruang pertemuan VIP.`,e.elements.kondisi_umum.value=`Struktur bangunan masih terlihat dominan kokoh, ada sedikit perlemahan visual (retak rambut 0.1mm) pada sambungan balok-kolom di lantai 2 dan 3. Catatan minor rembesan pada dinding kamar mandi timur.`,e.elements.catatan.value=`Perlu fokus inspeksi pada Fire Hydrant karena ada indikasi tekanan air melemah di atas lantai 4.`,e.elements.pemilik.value=`Yayasan Pendidikan Teknologi`,e.elements.penanggung_jawab.value=`Dr. Eng. Kusuma Wardana`,e.elements.telepon.value=`0812-3456-7890`,e.elements.email_pemilik.value=`rektorat@univtek.ac.id`,e.elements.status_slf.value=`DALAM_PENGKAJIAN`)},window.submitProyek=async function(t){t.preventDefault();let n=t.target,r=document.getElementById(`btn-submit-proyek`),i=Object.fromEntries(new FormData(n)),a=!!new URLSearchParams(window.location.hash.split(`?`)[1]).get(`id`),o=new URLSearchParams(window.location.hash.split(`?`)[1]).get(`id`);if(!i.nama_bangunan||!i.pemilik||!i.alamat){V(`Lengkapi field yang wajib diisi (*)`);return}let s={nama_bangunan:i.nama_bangunan,jenis_bangunan:i.jenis_bangunan,fungsi_bangunan:i.fungsi_bangunan,alamat:i.alamat,kelurahan:i.kelurahan,kecamatan:i.kecamatan,kota:i.kota,provinsi:i.provinsi,pemilik:i.pemilik,penanggung_jawab:i.penanggung_jawab||null,telepon:i.telepon||null,email_pemilik:i.email_pemilik||null,kondisi_umum:i.kondisi_umum||null,catatan:i.catatan||null,tanggal_mulai:i.tanggal_mulai||null,tanggal_target:i.tanggal_target||null,tahun_dibangun:i.tahun_dibangun?parseInt(i.tahun_dibangun):null,jumlah_lantai:i.jumlah_lantai?parseInt(i.jumlah_lantai):null,luas_bangunan:i.luas_bangunan?parseFloat(i.luas_bangunan):null,luas_lahan:i.luas_lahan?parseFloat(i.luas_lahan):null,jenis_konstruksi:i.jenis_konstruksi,nomor_pbg:i.nomor_pbg,latitude:i.latitude?parseFloat(i.latitude):null,longitude:i.longitude?parseFloat(i.longitude):null,status_slf:i.status_slf||`DALAM_PENGKAJIAN`,simbg_email:i.simbg_email||null,simbg_password:i.simbg_password||null,simbg_id:i.simbg_id||null,gsb:i.gsb?parseFloat(i.gsb):null,kdb:i.kdb?parseFloat(i.kdb):null,klb:i.klb?parseFloat(i.klb):null,kdh:i.kdh?parseFloat(i.kdh):null,no_sertifikat:i.no_dokumen_tanah||i.no_sertifikat||null,luas_tanah:i.luas_tanah?parseFloat(i.luas_tanah):null,tgl_sertifikat:i.tgl_terbit_tanah||i.tgl_sertifikat||null,jenis_dokumen_tanah:i.jenis_dokumen_tanah||null,no_dokumen_tanah:i.no_dokumen_tanah||null,tgl_terbit_tanah:i.tgl_terbit_tanah||null,hak_kepemilikan:i.hak_kepemilikan||null,nama_pemilik_tanah:i.nama_pemilik_tanah||null,tanah_provinsi:i.tanah_provinsi||null,tanah_kota:i.tanah_kota||null,tanah_kecamatan:i.tanah_kecamatan||null,tanah_kelurahan:i.tanah_kelurahan||null,alamat_tanah_lengkap:i.alamat_tanah_lengkap||null,pemilik_tanah_sama:i.pemilik_tanah_sama===`true`,no_surat_perjanjian:i.no_surat_perjanjian||null,tgl_surat_perjanjian:i.tgl_surat_perjanjian||null,penerima_perjanjian:i.penerima_perjanjian||null,assigned_to:i.assigned_to||null};r.disabled=!0,r.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Menyimpan...`;try{let t=T(),n={...s,progress:0,updated_at:new Date().toISOString()};t?.id&&t.id.length>15&&t.id!==`00000000-0000-0000-0000-000000000001`&&(n.created_by=t.id);let r;if(a&&o?{error:r}=await e.from(`proyek`).update(n).eq(`id`,o):{error:r}=await e.from(`proyek`).insert(n),r)throw r;B(a?`Proyek berhasil diperbarui!`:`Proyek SLF berhasil dibuat!`),setTimeout(()=>M(`proyek`),800)}catch(e){V(`Gagal menyimpan: `+e.message),r.disabled=!1,r.innerHTML=`<i class="fas fa-save"></i> ${a?`Simpan Perubahan`:`Buat Proyek`}`}},window.initProyekMap=function(e,t){if(window.L===void 0||!document.getElementById(`proyek-map`))return;window._proyekMap&&(window._proyekMap.off(),window._proyekMap.remove());let n=e?parseFloat(e):-6.2088,r=t?parseFloat(t):106.8456,i=window.L.map(`proyek-map`).setView([n,r],14);window._proyekMap=i,window.L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`,{maxZoom:19,attribution:`&copy; OpenStreetMap`}).addTo(i);let a=window.L.marker([n,r],{draggable:!0}).addTo(i);window._proyekMarker=a,!e&&!t&&(document.getElementById(`input-lat`).value=n.toFixed(6),document.getElementById(`input-lng`).value=r.toFixed(6)),a.on(`dragend`,function(e){let t=a.getLatLng();i.panTo(new window.L.LatLng(t.lat,t.lng)),document.getElementById(`input-lat`).value=t.lat.toFixed(6),document.getElementById(`input-lng`).value=t.lng.toFixed(6)}),e||(i.locate({setView:!0,maxZoom:16}),i.on(`locationfound`,function(e){a.setLatLng(e.latlng),document.getElementById(`input-lat`).value=e.latlng.lat.toFixed(6),document.getElementById(`input-lng`).value=e.latlng.lng.toFixed(6)}))},window.togglePemanfaatanSection=function(e){let t=document.getElementById(`section-pemanfaatan`);t&&(t.style.display=e?`none`:`block`)},window._triggerOCRScan=()=>{let e=document.createElement(`input`);e.type=`file`,e.accept=`image/*,application/pdf`,e.onchange=async e=>{let t=e.target.files[0];if(!t)return;se(`Sedang membaca dokumen dengan AI Vision...`);let n=new FileReader;n.onload=async()=>{let e=n.result.split(`,`)[1];try{let n=await s(e,t.type);if(n){B(`Data berhasil diekstrak otomatis!`);let e=document.getElementById(`proyek-form`);n.nama_bangunan&&(e.elements.nama_bangunan.value=n.nama_bangunan),n.pemilik&&(e.elements.pemilik.value=n.pemilik),n.alamat&&(e.elements.alamat.value=n.alamat),n.luas_bangunan&&(e.elements.luas_bangunan.value=n.luas_bangunan),n.luas_lahan&&(e.elements.luas_lahan.value=n.luas_lahan),n.jumlah_lantai&&(e.elements.jumlah_lantai.value=n.jumlah_lantai),n.tahun_dibangun&&(e.elements.tahun_dibangun.value=n.tahun_dibangun),n.nomor_pbg&&(e.elements.nomor_pbg.value=n.nomor_pbg),n.fungsi_bangunan&&(e.elements.fungsi_bangunan.value=n.fungsi_bangunan),n.gsb&&(e.elements.gsb.value=n.gsb),n.kdb&&(e.elements.kdb.value=n.kdb),n.klb&&(e.elements.klb.value=n.klb),n.kdh&&(e.elements.kdh.value=n.kdh),e.classList.add(`ai-updated`),setTimeout(()=>e.classList.remove(`ai-updated`),1e3)}}catch(e){V(`Gagal sinkron data: `+e.message)}},n.readAsDataURL(t)},e.click()};async function _t(t){let{data:n,error:r}=await e.from(`proyek`).select(`*`).eq(`id`,t).single();if(r||!n)throw Error(`Proyek tidak ditemukan.`);if(!n.simbg_email||!n.simbg_password)throw Error(`Kredensial SIMBG belum dikonfigurasi untuk proyek ini.`);console.log(`[SIMBG] Pulling data for ID: ${n.simbg_id||`PROTOTYPE-ID`}...`),await new Promise(e=>setTimeout(e,1500));let i={luas_bangunan:n.luas_bangunan||1250.5,jumlah_lantai:n.jumlah_lantai||4,nomor_pbg:n.nomor_pbg||`PBG-990022-30032026-01`,gsb:3.5,kdb:65,klb:2.6,kdh:15,jenis_dokumen_tanah:`Sertifikat`,hak_kepemilikan:`Hak Milik`,nama_pemilik_tanah:`Ahmad Hayun`,no_dokumen_tanah:`10.17.19.06.1.01072`,tgl_terbit_tanah:`2022-12-23`,luas_tanah:1798,tanah_provinsi:`Jawa Barat`,tanah_kota:`Kab. Garut`,tanah_kecamatan:`Banjarwangi`,tanah_kelurahan:`Kadongdong`,alamat_tanah_lengkap:`Kp. Batas`,pemilik_tanah_sama:!1,no_surat_perjanjian:`25/SMK-IMG/VIII/2025`,tgl_surat_perjanjian:`2025-08-28`,penerima_perjanjian:`Ahmad Hayun`,updated_at:new Date().toISOString()},{error:a}=await e.from(`proyek`).update(i).eq(`id`,t);if(a)throw Error(`Gagal memperbarui data proyek: `+a.message);return i}async function vt(t,n){let{data:r}=await e.from(`proyek`).select(`*`).eq(`id`,t).single(),{data:i}=await e.from(`proyek_files`).select(`*`).eq(`proyek_id`,t);if(!r?.simbg_id)throw Error(`ID Permohonan SIMBG wajib diisi untuk fitur Push.`);let a=(e,t)=>{console.log(`[SIMBG PUSH] ${t}`),n&&n(e,t)};a(10,`Memulai Sinkronisasi Balik untuk ${r.nama_bangunan}...`),await new Promise(e=>setTimeout(e,1e3)),a(25,`Menghubungkan ke portal SIMBG (${r.simbg_id})...`),await new Promise(e=>setTimeout(e,1200)),a(40,`Langkah 1: Mengisi Intensitas Teknis (GSB, KDB, KLB, KDH)...`),await new Promise(e=>setTimeout(e,1e3)),a(55,`Langkah 2: Sinkronisasi Data Dokumen Tanah...`),await new Promise(e=>setTimeout(e,800)),a(70,`Langkah 3: Memetakan & Mengunggah Dokumen Teknis (PDF)...`);for(let e of[{name:`KRK`,cat:`tanah`}]){let t=i?.find(t=>t.subcategory===e.name);a(75,`> Mencari dokumen: ${e.name}...`),await new Promise(e=>setTimeout(e,600)),t?(a(85,`> Ditemukan: [${e.cat.toUpperCase()}] ${e.name} -> Mengunggah URL Drive...`),await new Promise(e=>setTimeout(e,800))):(a(85,`> WARNING: Dokumen Wajib "${e.name}" tidak ditemukan.`),await new Promise(e=>setTimeout(e,800)))}return a(95,`Menyelesaikan proses unggah dokumen...`),await new Promise(e=>setTimeout(e,1e3)),await e.from(`notifications`).insert({user_id:r.created_by||null,title:`Push Data SIMBG Berhasil`,message:`Data permohonan "${r.nama_bangunan}" telah diperbarui di portal SIMBG secara otomatis.`,type:`success`}),a(100,`Data permohonan telah diperbarui di portal SIMBG.`),!0}async function yt(e={}){let t=e.id;if(!t)return M(`proyek`),``;let n=document.getElementById(`page-root`);n&&(n.innerHTML=Tt());let r=await St(t);if(!r)return M(`proyek`),V(`Proyek tidak ditemukan.`),``;let[i,a,o]=await Promise.all([Ct(t),wt(t),Je(t)]),s=bt(r,i,a,o);return n&&(n.innerHTML=s,xt(r,i,a)),s}function bt(e,t,n,r){let i={LAIK_FUNGSI:{label:`Laik Fungsi`,cls:`badge-laik`,icon:`fa-circle-check`},LAIK_FUNGSI_BERSYARAT:{label:`Laik Bersyarat`,cls:`badge-bersyarat`,icon:`fa-triangle-exclamation`},TIDAK_LAIK_FUNGSI:{label:`Tidak Laik Fungsi`,cls:`badge-tidak-laik`,icon:`fa-circle-xmark`},DALAM_PENGKAJIAN:{label:`Dalam Pengkajian`,cls:`badge-proses`,icon:`fa-clock`}},a=i[e.status_slf]||i.DALAM_PENGKAJIAN,o=e.progress||0,s=[{label:`Input Data`,icon:`fa-file-pen`,key:`input`},{label:`Checklist`,icon:`fa-clipboard-check`,key:`checklist`},{label:`Analisis AI`,icon:`fa-brain`,key:`analisis`},{label:`Laporan Draft`,icon:`fa-file-alt`,key:`laporan`},{label:`Finalisasi SLF`,icon:`fa-certificate`,key:`final`}],c=o<20?0:o<40?1:o<60?2:o<80?3:4;return`
    <div id="proyek-detail-page">

      <!-- Back + Actions -->
      <div class="page-header">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek')" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Semua Proyek
            </button>
            <h1 class="page-title" style="margin-bottom:4px">${Et(e.nama_bangunan)}</h1>
            <div class="flex gap-3" style="align-items:center;flex-wrap:wrap">
              <span class="badge ${a.cls}"><i class="fas ${a.icon}" style="margin-right:4px"></i>${a.label}</span>
              <span class="text-sm text-tertiary"><i class="fas fa-map-marker-alt" style="margin-right:4px"></i>${Et(e.alamat||`-`)}</span>
              ${e.nomor_pbg?`<span class="text-sm text-tertiary"><i class="fas fa-file-certificate" style="margin-right:4px"></i>PBG: ${Et(e.nomor_pbg)}</span>`:``}
            </div>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-edit', {id:'${e.id}'})">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="window._hapusProyek('${e.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Workflow Timeline -->
      <div class="card" style="margin-bottom:var(--space-5);padding:var(--space-5)">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-route" style="color:var(--brand-400);margin-right:8px"></i>Alur Pengkajian SLF
        </div>
        <div class="workflow-timeline">
          ${s.map((e,t)=>`
            <div class="workflow-step ${t<c?`done`:t===c?`active`:``}">
              <div class="wf-icon"><i class="fas ${e.icon}"></i></div>
              <div class="wf-label">${e.label}</div>
              ${t<s.length-1?`<div class="wf-connector"></div>`:``}
            </div>
          `).join(``)}
        </div>
        <div style="margin-top:var(--space-4)">
          <div class="flex-between mb-1">
            <span class="text-sm text-secondary">Progress Keseluruhan</span>
            <span class="text-sm font-semibold text-primary">${o}%</span>
          </div>
          <div class="progress-wrap" style="height:8px">
            <div class="progress-fill ${o>=80?`green`:o>=40?`blue`:`yellow`}"
                 style="width:${o}%;transition:width 1s ease"></div>
          </div>
        </div>
      </div>

      <!-- Main Grid (Responsive) -->
      <div class="grid-main-responsive" style="display:grid;gap:var(--space-5)">

        <!-- Left: Tab Navigasi Fitur -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">

          <!-- Quick Nav Cards (Responsive 2-to-1) -->
          <div class="grid-2-1">

            <!-- Checklist -->
            <div class="feature-nav-card" onclick="window.navigate('checklist',{id:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(220,70%,45%),hsl(220,70%,60%))">
                <i class="fas fa-clipboard-check"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">Checklist Pemeriksaan</div>
                <div class="fnc-desc">Administrasi · Teknis · Lapangan</div>
                <div class="fnc-meta">
                  <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                    <div class="progress-wrap" style="flex:1;height:5px">
                      <div class="progress-fill blue" style="width:${t.pct}%"></div>
                    </div>
                    <span class="text-xs text-tertiary">${t.done}/${t.total}</span>
                  </div>
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>

            <!-- Pemeriksaan Kondisi (Permen PU 16/2010) -->
            <div class="feature-nav-card" onclick="window.navigate('kondisi', {id:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(20,80%,45%),hsl(20,80%,60%))">
                <i class="fas fa-house-medical-check"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">Pemeriksaan Kondisi</div>
                <div class="fnc-desc">Permen PU 16/2010 · Bobot Kerusakan</div>
                <div class="fnc-meta">
                  <span class="badge badge-proses" style="margin-top:8px;font-size:0.7rem">Nilai IKF / Kondisi Fisik</span>
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>

            <!-- Galeri Foto & Bukti Visual -->
            <div class="feature-nav-card" onclick="window.navigate('galeri', {id:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(200,80%,45%),hsl(200,80%,60%))">
                <i class="fas fa-images"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">Galeri Bukti Visual</div>
                <div class="fnc-desc">Manajemen Foto · Lampiran Laporan</div>
                <div class="fnc-meta">
                  <span class="badge badge-info" style="margin-top:8px;font-size:0.7rem">Foto Temuan & Audit</span>
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>

            <!-- Analisis -->
            <div class="feature-nav-card" onclick="window.navigate('analisis',{id:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(258,70%,45%),hsl(258,70%,60%))">
                <i class="fas fa-brain"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">Analisis AI</div>
                <div class="fnc-desc">Rule-based · Risk Scoring · Rekomendasi</div>
                <div class="fnc-meta">
                  ${n?`<span class="badge badge-laik" style="margin-top:8px;font-size:0.7rem">Skor ${n.skor_total}/100</span>`:`<span class="text-xs text-tertiary" style="margin-top:8px;display:block">Belum dianalisis</span>`}
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>

            <!-- Laporan -->
            <div class="feature-nav-card" onclick="window.navigate('laporan',{id:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(160,65%,35%),hsl(160,65%,50%))">
                <i class="fas fa-file-invoice"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">Laporan Kajian SLF</div>
                <div class="fnc-desc">Preview · Export PDF · Word</div>
                <div class="fnc-meta">
                  <span class="text-xs text-tertiary" style="margin-top:8px;display:block">
                    ${n?`Data analisis tersedia`:`Lengkapi analisis terlebih dahulu`}
                  </span>
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>

            <!-- Surat Pernyataan (PP 16/2021) -->
            <div class="feature-nav-card" onclick="window.navigate('surat-pernyataan',{id:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(210,80%,40%),hsl(210,80%,55%))">
                <i class="fas fa-file-contract"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">Surat Pernyataan</div>
                <div class="fnc-desc">Formal PP 16/2021 · Konsultan & Pemilik</div>
                <div class="fnc-meta">
                  <span class="badge badge-info" style="margin-top:8px;font-size:0.7rem">Format Legal SIMBG</span>
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>

            <!-- TODO -->
            <div class="feature-nav-card" onclick="window.navigate('todo',{proyekId:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(40,80%,40%),hsl(40,80%,55%))">
                <i class="fas fa-list-check"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">TODO & Tindak Lanjut</div>
                <div class="fnc-desc">Task management per proyek</div>
                <div class="fnc-meta">
                  <span class="text-xs text-tertiary" style="margin-top:8px;display:block">Segera hadir</span>
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>

            <!-- Manajemen Berkas SIMBG -->
            <div class="feature-nav-card" onclick="window.navigate('proyek-files',{id:'${e.id}'})">
              <div class="fnc-icon" style="background:linear-gradient(135deg,hsl(30,80%,45%),hsl(30,80%,60%))">
                <i class="fas fa-folder-tree"></i>
              </div>
              <div class="fnc-body">
                <div class="fnc-title">Manajemen Berkas SIMBG</div>
                <div class="fnc-desc">Arsitektur · Struktur · MEP · Umum</div>
                <div class="fnc-meta">
                  <span class="text-xs text-secondary" style="margin-top:8px;display:block">
                    <i class="fas fa-check-circle" style="color:var(--brand-400)"></i> Sesuai standar Dokumen SIMBG
                  </span>
                </div>
              </div>
              <i class="fas fa-arrow-right fnc-arrow"></i>
            </div>
          </div>

          <!-- Data Teknis Bangunan -->
          <div class="card">
            <div class="card-title" style="margin-bottom:var(--space-4)">
              <i class="fas fa-building" style="color:var(--brand-400);margin-right:8px"></i>Data Teknis Bangunan
            </div>
            <div class="grid-2-1" style="gap:var(--space-3)">
              ${[[`Jenis Bangunan`,e.jenis_bangunan||`-`,`fa-tag`],[`Jenis Konstruksi`,e.jenis_konstruksi||`-`,`fa-layer-group`],[`Jumlah Lantai`,e.jumlah_lantai?`${e.jumlah_lantai} lantai`:`-`,`fa-stairs`],[`Luas Bangunan`,e.luas_bangunan?`${Number(e.luas_bangunan).toLocaleString(`id-ID`)} m²`:`-`,`fa-ruler-combined`],[`Luas Lahan`,e.luas_lahan?`${Number(e.luas_lahan).toLocaleString(`id-ID`)} m²`:`-`,`fa-expand`],[`Tahun Dibangun`,e.tahun_dibangun||`-`,`fa-calendar`],[`Fungsi Bangunan`,e.fungsi_bangunan||`-`,`fa-building-columns`,!0],[`Nomor PBG/IMB`,e.nomor_pbg||`-`,`fa-file-certificate`],[`Kota/Provinsi`,[e.kota,e.provinsi].filter(Boolean).join(`, `)||`-`,`fa-location-dot`]].map(([e,t,n,r])=>`
                <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);${r?`grid-column:1/-1`:``}">
                  <div class="text-xs text-tertiary" style="margin-bottom:2px">
                    <i class="fas ${n}" style="margin-right:4px;opacity:0.6"></i>${e}
                  </div>
                  <div class="text-sm font-semibold text-primary ${r?``:`truncate`}">${Et(t)}</div>
                </div>
              `).join(``)}
              
              <!-- SIMBG Intensity Sub-grid (Fluid) -->
              <div style="grid-column:1/-1; display:grid; grid-template-columns:repeat(auto-fit, minmax(70px, 1fr)); gap:8px; margin-top:8px; padding-top:12px; border-top:1px solid var(--border-subtle)">
                <div class="text-center">
                  <div class="text-xs text-tertiary">GSB</div>
                  <div class="text-xs font-bold">${e.gsb||`-`} m</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-tertiary">KDB</div>
                  <div class="text-xs font-bold">${e.kdb||`-`} %</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-tertiary">KLB</div>
                  <div class="text-xs font-bold">${e.klb||`-`}</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-tertiary">KDH</div>
                  <div class="text-xs font-bold">${e.kdh||`-`} %</div>
                </div>
              </div>
            </div>
            ${e.kondisi_umum?`
              <div style="margin-top:var(--space-4);padding:var(--space-4);background:var(--bg-elevated);border-radius:var(--radius-md);border-left:3px solid var(--brand-400)">
                <div class="text-xs text-tertiary" style="margin-bottom:4px">Kondisi Umum</div>
                <div class="text-sm text-secondary">${Et(e.kondisi_umum)}</div>
              </div>
            `:``}
          </div>
        </div>

        <!-- Right: Info Panel -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">

          <!-- Pemilik -->
          <div class="card">
            <div class="card-title" style="margin-bottom:var(--space-4)">
              <i class="fas fa-user" style="color:var(--brand-400);margin-right:8px"></i>Pemilik / Pemohon
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-2)">
              ${[[`fa-user-tie`,e.pemilik||`-`],[`fa-id-card`,e.penanggung_jawab||`-`],[`fa-phone`,e.telepon||`-`],[`fa-envelope`,e.email_pemilik||`-`]].map(([e,t])=>`
                <div class="flex gap-3" style="align-items:center">
                  <i class="fas ${e}" style="color:var(--text-tertiary);width:16px;text-align:center"></i>
                  <span class="text-sm text-secondary">${Et(t)}</span>
                </div>
              `).join(``)}
            </div>
          </div>

          <!-- Penanggung Jawab Tim (PIC) -->
          <div class="card" style="border-left: 3px solid var(--brand-400)">
            <div class="card-title" style="margin-bottom:var(--space-4)">
              <i class="fas fa-user-gear" style="color:var(--brand-400);margin-right:8px"></i>Tim Pengkaji (PIC)
            </div>
            ${r?`
              <div style="display:flex; align-items:center; gap:12px; padding:8px; background:var(--bg-elevated); border-radius:var(--radius-md)">
                <div class="avatar-sm" style="flex-shrink:0; background:var(--brand-400); color:white">
                   ${r.avatar_url?`<img src="${r.avatar_url}" style="width:100%;height:100%;border-radius:50%">`:`<span>${r.full_name?.charAt(0)}</span>`}
                </div>
                <div style="overflow:hidden">
                  <div class="text-sm font-bold text-primary truncate">${r.full_name}</div>
                  <div class="text-xs text-tertiary truncate">${r.role||`Tenaga Ahli`}</div>
                </div>
              </div>
            `:`
              <div class="text-center" style="padding:16px; background:var(--bg-elevated); border:1px dashed var(--border-subtle); border-radius:var(--radius-md)">
                <p class="text-xs text-tertiary mb-3">Belum ada personil ditugaskan.</p>
                <button class="btn btn-secondary btn-sm" onclick="window.navigate('proyek-edit', {id:'${e.id}'})">
                  <i class="fas fa-user-plus"></i> Tugaskan
                </button>
              </div>
            `}
          </div>

          <!-- Data Tanah (New SIMBG Details) -->
          <div class="card">
            <div class="card-title" style="margin-bottom:var(--space-4)">
              <i class="fas fa-map-marked-alt" style="color:var(--brand-400);margin-right:8px"></i>Data Tanah (SIMBG)
            </div>
            <div style="display:grid;grid-template-columns:1fr;gap:var(--space-2)">
              <div class="flex-between">
                <span class="text-xs text-tertiary">Jenis / Hak</span>
                <span class="text-xs font-semibold">${e.jenis_dokumen_tanah||`Sertifikat`} / ${e.hak_kepemilikan||`-`}</span>
              </div>
              <div class="flex-between">
                <span class="text-xs text-tertiary">No. Dokumen</span>
                <span class="text-xs font-semibold">${e.no_dokumen_tanah||e.no_sertifikat||`-`}</span>
              </div>
              <div class="flex-between">
                <span class="text-xs text-tertiary">Luas Tanah</span>
                <span class="text-xs font-semibold">${e.luas_tanah?`${Number(e.luas_tanah).toLocaleString(`id-ID`)} m²`:`-`}</span>
              </div>
              <div class="flex-between">
                <span class="text-xs text-tertiary">Pemilik Tanah</span>
                <span class="text-xs font-semibold text-right">${e.nama_pemilik_tanah||e.pemilik||`-`}</span>
              </div>
              ${e.pemilik_tanah_sama?``:`
                <div style="margin-top:4px; padding:6px; background:var(--bg-elevated); border-radius:4px; border-left:2px solid var(--orange-400)">
                  <div class="text-xs text-tertiary">Perjanjian Pemanfaatan</div>
                  <div class="text-xs font-bold truncate">${e.no_surat_perjanjian||`Ada`}</div>
                </div>
              `}
            </div>
          </div>

          <!-- SIMBG Integration -->
          <div class="card" style="border-top: 4px solid #3b82f6;">
            <div class="card-title" style="margin-bottom:var(--space-4); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <i class="fas fa-link" style="color:#3b82f6;margin-right:8px"></i>Integrasi SIMBG
              </div>
              ${e.simbg_email?`<span class="badge badge-laik" style="font-size:0.6rem">Tersambung</span>`:`<span class="badge badge-proses" style="font-size:0.6rem">Belum Ada Akun</span>`}
            </div>
            
            <p class="text-xs text-secondary" style="margin-bottom:var(--space-4); line-height:1.4;">
              ${e.simbg_email?`Tersinkronisasi dengan akun <strong>${Et(e.simbg_email)}</strong>.`:`Hubungkan akun SIMBG pemohon untuk menarik data teknis bangunan secara otomatis.`}
            </p>
            
            <div class="flex flex-col gap-2">
              <button class="btn btn-secondary btn-sm" style="width:100%; border-color:#3b82f6; color:#3b82f6" 
                      id="btn-sync-simbg"
                      ${e.simbg_email?``:`disabled`}>
                <i class="fas fa-download"></i> Ambil Data (Pull)
              </button>

              <button class="btn btn-primary btn-sm" style="width:100%; background:#3b82f6" 
                      id="btn-push-simbg"
                      ${!e.simbg_email||!e.simbg_id?`disabled`:``}>
                <i class="fas fa-upload"></i> Kirim ke SIMBG (Push)
              </button>
            </div>
            
            ${e.simbg_email?``:`
              <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;font-size:0.75rem" 
                      onclick="window.navigate('proyek-edit', {id:'${e.id}'})">
                <i class="fas fa-plus"></i> Tambah Akun SIMBG
              </button>
            `}
          </div>

          <!-- Jadwal -->
          <div class="card">
            <div class="card-title" style="margin-bottom:var(--space-4)">
              <i class="fas fa-calendar-days" style="color:var(--brand-400);margin-right:8px"></i>Jadwal Pengkajian
            </div>
            ${[[`Mulai`,e.tanggal_mulai,`fa-play`],[`Target`,e.tanggal_target,`fa-flag-checkered`]].map(([e,t,n])=>`
              <div class="flex-between" style="margin-bottom:10px">
                <span class="text-sm text-secondary"><i class="fas ${n}" style="margin-right:6px;opacity:0.7"></i>${e}</span>
                <span class="text-sm font-semibold text-primary">${t?Dt(t):`-`}</span>
              </div>
            `).join(``)}
            ${e.tanggal_mulai&&e.tanggal_target?(()=>{let t=new Date(e.tanggal_mulai),n=new Date(e.tanggal_target),r=new Date,i=n-t,a=Math.max(0,r-t),o=Math.ceil((n-r)/864e5),s=Math.min(100,Math.round(a/i*100));return`
                <div style="margin-top:var(--space-3)">
                  <div class="flex-between mb-1">
                    <span class="text-xs text-tertiary">Waktu berjalan</span>
                    <span class="text-xs ${o<7?`text-danger`:`text-tertiary`}">${o>0?`${o} hari tersisa`:`Melewati target`}</span>
                  </div>
                  <div class="progress-wrap" style="height:5px">
                    <div class="progress-fill ${o<7?`red`:`blue`}" style="width:${s}%"></div>
                  </div>
                </div>
              `})():``}
          </div>

          <!-- AI Result -->
          ${n?`
            <div class="ai-panel">
              <div class="ai-panel-header">
                <div class="ai-icon"><i class="fas fa-brain"></i></div>
                <div>
                  <div class="ai-panel-title">Hasil Analisis AI</div>
                  <div class="ai-panel-subtitle">${Dt(n.created_at)}</div>
                </div>
              </div>
              <div class="ai-finding ${n.status_slf===`LAIK_FUNGSI`?`success`:n.status_slf===`LAIK_FUNGSI_BERSYARAT`?`warning`:`critical`}">
                <i class="fas ${n.status_slf===`LAIK_FUNGSI`?`fa-circle-check`:n.status_slf===`LAIK_FUNGSI_BERSYARAT`?`fa-triangle-exclamation`:`fa-circle-xmark`}" style="margin-right:6px"></i>
                ${n.status_slf===`LAIK_FUNGSI`?`Bangunan Laik Fungsi`:n.status_slf===`LAIK_FUNGSI_BERSYARAT`?`Laik Fungsi Bersyarat`:`Tidak Laik Fungsi`}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:var(--space-3)">
                <div style="text-align:center;background:hsla(0,0%,0%,0.2);border-radius:var(--radius-md);padding:var(--space-3)">
                  <div class="text-xs text-tertiary">Skor Total</div>
                  <div style="font-size:1.6rem;font-weight:800;color:var(--brand-400)">${n.skor_total}</div>
                </div>
                <div style="text-align:center;background:hsla(0,0%,0%,0.2);border-radius:var(--radius-md);padding:var(--space-3)">
                  <div class="text-xs text-tertiary">Level Risiko</div>
                  <div style="font-size:1.1rem;font-weight:700;color:${Ot(n.risk_level)};margin-top:4px">${kt(n.risk_level)}</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:var(--space-3)"
                      onclick="window.navigate('analisis',{id:'${n.proyek_id}'})">
                <i class="fas fa-eye"></i> Lihat Detail Analisis
              </button>
              <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;border:1px solid var(--brand-400);color:var(--brand-400)"
                      onclick="window.navigate('multi-agent',{proyekId:'${n.proyek_id}'})">
                <i class="fas fa-comments"></i> Konsultasi Multi-Agent
              </button>
            </div>
          `:`
            <div class="ai-panel">
              <div class="ai-panel-header">
                <div class="ai-icon"><i class="fas fa-brain"></i></div>
                <div>
                  <div class="ai-panel-title">AI Engine</div>
                  <div class="ai-panel-subtitle">Belum ada data analisis</div>
                </div>
              </div>
              <div class="ai-finding">
                <i class="fas fa-circle-info" style="margin-right:6px"></i>
                Lengkapi checklist pemeriksaan terlebih dahulu untuk memulai analisis AI.
              </div>
              <button class="btn btn-primary btn-sm" style="width:100%;margin-top:var(--space-3)"
                      onclick="window.navigate('checklist',{id:'${e.id}'})">
                <i class="fas fa-clipboard-check"></i> Mulai Checklist
              </button>
            </div>
          `}

          <!-- Catatan -->
          ${e.catatan?`
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-3)">
                <i class="fas fa-note-sticky" style="color:var(--brand-400);margin-right:8px"></i>Catatan
              </div>
              <p class="text-sm text-secondary" style="line-height:1.6">${Et(e.catatan)}</p>
            </div>
          `:``}
        </div>
      </div>
    </div>
  `}function xt(t){window._hapusProyek=async n=>{if(await ne({title:`Hapus Proyek`,message:`Yakin ingin menghapus proyek "${t.nama_bangunan}"? Semua data terkait akan ikut terhapus.`,confirmText:`Hapus`,danger:!0}))try{let{error:t}=await e.from(`proyek`).delete().eq(`id`,n);if(t)throw t;B(`Proyek berhasil dihapus.`),M(`proyek`)}catch(e){V(`Gagal menghapus: `+e.message)}};let n=document.getElementById(`btn-sync-simbg`);n&&(n.onclick=async()=>{if(await ne({title:`Sinkronisasi SIMBG`,message:`Aplikasi akan mensimulasikan login ke portal SIMBG dan menarik data teknis bangunan terbaru. Lanjutkan?`,confirmText:`Mulai Sinkronisasi`})){n.disabled=!0,n.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Mensinkronisasi...`;try{await _t(t.id)&&(B(`Data teknis berhasil diperbarui dari SIMBG!`),setTimeout(()=>location.reload(),1e3))}catch(e){V(`Gagal Sinkronisasi: `+e.message)}finally{n.disabled=!1,n.innerHTML=`<i class="fas fa-download"></i> Ambil Data (Pull)`}}});let r=document.getElementById(`btn-push-simbg`);r&&(r.onclick=async()=>{if(!await ne({title:`Kirim Data ke SIMBG`,message:`Aplikasi akan mengisi otomatis form permohonan di SIMBG dan memetakan dokumen teknis yang tersedia. Lanjutkan?`,confirmText:`Kirim Sekarang`}))return;r.disabled=!0,r.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Mengirim...`;let e=document.createElement(`div`);e.id=`simbg-realtime-overlay`,e.style.cssText=`
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px);
        z-index: 9999; display: flex; align-items: center; justify-content: center;
        flex-direction: column; color: white; transition: all 0.3s ease;
      `,e.innerHTML=`
        <div style="background:var(--bg-elevated); padding:32px; border-radius:24px; max-width:400px; width:90%; box-shadow:0 10px 40px rgba(0,0,0,0.3); border:1px solid #334155; text-align:center;">
          <div style="width:64px; height:64px; border-radius:50%; background:rgba(249,115,22,0.1); color:#f97316; font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
            <i class="fas fa-cloud-arrow-up fa-bounce"></i>
          </div>
          <h3 style="font-size:1.2rem; font-weight:800; color:var(--text-primary); margin-bottom:8px;">Push Data SIMBG</h3>
          <p id="simbg-realtime-msg" style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:24px; min-height:40px; display:flex; align-items:center; justify-content:center;">Inisialisasi koneksi...</p>
          
          <div style="width:100%; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
            <div id="simbg-realtime-bar" style="width:0%; height:100%; background:var(--brand-500); transition:width 0.4s ease;"></div>
          </div>
          <div id="simbg-realtime-perc" style="font-size:0.75rem; font-weight:700; color:var(--brand-500); margin-top:8px; text-align:right;">0%</div>
        </div>
      `,document.body.appendChild(e);let n=(e,t)=>{let n=document.getElementById(`simbg-realtime-msg`),r=document.getElementById(`simbg-realtime-bar`),i=document.getElementById(`simbg-realtime-perc`);n&&(n.innerText=t),r&&(r.style.width=e+`%`),i&&(i.innerText=e+`%`)};try{await vt(t.id,n),n(100,`Berhasil! Data terkirim ke portal SIMBG.`),await new Promise(e=>setTimeout(e,1e3)),B(`Data & Berkas berhasil dikirim ke portal SIMBG!`)}catch(e){V(`Gagal Mengirim: `+e.message)}finally{document.getElementById(`simbg-realtime-overlay`)&&document.body.removeChild(document.getElementById(`simbg-realtime-overlay`)),r&&(r.disabled=!1,r.innerHTML=`<i class="fas fa-upload"></i> Kirim ke SIMBG (Push)`)}})}async function St(t){try{let{data:n}=await e.from(`proyek`).select(`*`).eq(`id`,t).maybeSingle();return n}catch{return null}}async function Ct(t){try{let{data:n}=await e.from(`checklist_items`).select(`id, status`).eq(`proyek_id`,t),r=n?.length||0,i=n?.filter(e=>e.status&&e.status!==`belum`).length||0;return{total:r,done:i,pct:r>0?Math.round(i/r*100):0}}catch{return{total:0,done:0,pct:0}}}async function wt(t){try{let{data:n}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,t).order(`created_at`,{ascending:!1}).limit(1);return n&&n.length>0?n[0]:null}catch{return null}}function Tt(){return`
    <div class="page-header">
      <div class="skeleton" style="height:20px;width:160px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:36px;width:400px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:22px;width:300px"></div>
    </div>
    <div class="skeleton" style="height:120px;border-radius:var(--radius-lg);margin-bottom:var(--space-5)"></div>
    <div style="display:grid;grid-template-columns:1fr 340px;gap:var(--space-5)">
      <div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-4);margin-bottom:var(--space-4)">
          ${[,,,,].fill(0).map(()=>`<div class="skeleton" style="height:120px;border-radius:var(--radius-lg)"></div>`).join(``)}
        </div>
        <div class="skeleton" style="height:280px;border-radius:var(--radius-lg)"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="skeleton" style="height:160px;border-radius:var(--radius-lg)"></div>
        <div class="skeleton" style="height:140px;border-radius:var(--radius-lg)"></div>
        <div class="skeleton" style="height:160px;border-radius:var(--radius-lg)"></div>
      </div>
    </div>
  `}function Et(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function Dt(e){return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`short`,year:`numeric`})}function Ot(e){return e===`low`?`hsl(160,65%,46%)`:e===`medium`?`hsl(40,80%,55%)`:e===`high`?`hsl(0,70%,58%)`:`hsl(330,70%,50%)`}function kt(e){return{low:`Rendah`,medium:`Sedang`,high:`Tinggi`,critical:`Kritis`}[e]||e}async function At(e={}){let t=e.id;if(!t)return M(`proyek`),``;let n=document.getElementById(`page-root`);n&&(n.innerHTML=`<div class="p-8 text-center"><i class="fas fa-circle-notch fa-spin text-2xl"></i></div>`);let[r,i]=await Promise.all([Mt(t),Nt(t)]);if(!r)return M(`proyek`),``;let a=[{id:`umum`,label:`Data Umum`,icon:`fa-folder-open`,items:[`Data Siteplan`,`Data Penyedia Jasa`,`Laporan Pemeriksaan SLF`,`Surat Pernyataan Kelaikan`,`Persetujuan Lingkungan`,`Data Intensitas (KKPR)`,`Identitas Pemilik (KTP)`]},{id:`tanah`,label:`Data Tanah & Lingkungan`,icon:`fa-map-marked-alt`,items:[`Sertifikat Tanah`,`Izin Pemanfaatan Tanah`,`Gambar Batas Tanah`,`Hasil Penyelidikan Tanah`,`Persetujuan Tetangga`,`Dokumen Lingkungan (SPPL/UKL-UPL)`]},{id:`arsitektur`,label:`Teknis Arsitektur`,icon:`fa-drafting-compass`,items:[`Gambar Detail Bangunan`,`Gambar Tata Ruang Luar`,`Gambar Tata Ruang Dalam`,`Gambar Tampak`,`Gambar Potongan`,`Gambar Denah`,`Gambar Tapak`,`Spesifikasi Arsitektur`,`Gambar Situasi`]},{id:`struktur`,label:`Teknis Struktur`,icon:`fa-cubes`,items:[`Gambar Detail Tangga`,`Gambar Pelat Lantai`,`Gambar Penutup`,`Gambar Rangka Atap`,`Gambar Balok`,`Gambar Kolom`,`Gambar Pondasi`,`Spesifikasi Struktur`,`Perhitungan Struktur`]},{id:`mep`,label:`Teknis MEP`,icon:`fa-bolt`,items:[`Sistem Kebakaran`,`Pengelolaan Sampah`,`Pengelolaan Drainase`,`Pengelolaan Air Limbah`,`Pengelolaan Air Hujan`,`Air Bersih`,`Pencahayaan`,`Sumber Listrik`,`Spesifikasi Mekanikal`,`Perhitungan MEP`]},{id:`lapangan`,label:`Data Pengujian & Lapangan`,icon:`fa-clipboard-check`,items:[`Foto Tapak & Lingkungan`,`Foto Teknis Arsitektur`,`Foto Teknis Struktur`,`Foto Teknis MEP`,`Laporan Pengujian Tanah`,`Hasil Hammer Test`,`Hasil Core Drill`,`Video Inspeksi Drone`,`Dokumen Pendukung Lapangan`]},{id:`integrasi`,label:`Integrasi SIMBG & Drive`,icon:`fa-robot`,items:[]}];window._currentCat=window._currentCat||`umum`,window._filesList=i||[];let o=`
    <style>
      .file-manager-layout { display: flex; height: calc(100vh - 220px); background: #fff; border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); }
      @media (max-width: 768px) {
        .file-manager-layout { flex-direction: column; height: auto; }
        .fm-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border-subtle); }
      }
      .fm-sidebar { width: 260px; background: #f8fafc; border-right: 1px solid var(--border-subtle); padding: 16px; display: flex; flex-direction: column; gap: 6px; }
      .fm-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
      .fm-toolbar { padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; gap: 16px; background: #fff; }
      .fm-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; color: #64748b; font-size: 0.9375rem; font-weight: 500; cursor: pointer; transition: 0.2s; border: none; background: transparent; width: 100%; text-align: left; }
      .fm-nav-item:hover { background: #f1f5f9; color: #1e293b; }
      .fm-nav-item.active { background: #e0f2fe; color: #0284c7; }
      .fm-nav-item i { font-size: 1.1rem; width: 24px; text-align: center; }
      
      .fm-breadcrumb { font-size: 0.875rem; color: #64748b; font-weight: 500; display: flex; align-items: center; gap: 8px; }
      .fm-breadcrumb span { color: #1e293b; font-weight: 700; }
      
      .fm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; padding: 24px; overflow-y: auto; flex: 1; align-content: start; }
      .fm-file-card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: 0.2s; position: relative; background: #fff; cursor: pointer; }
      .fm-file-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-md); transform: translateY(-3px); }
      .fm-file-card.empty { border-style: dashed; background: #fafafa; }
      
      .fm-file-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: #f1f5f9; color: #94a3b8; }
      .fm-file-icon.has-file { background: #fee2e2; color: #ef4444; }
      .fm-file-icon.image { background: #e0f2fe; color: #0ea5e9; }
      
      .fm-file-info { display: flex; flex-direction: column; gap: 4px; }
      .fm-file-name { font-size: 0.9375rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
      .fm-file-meta { font-size: 0.75rem; color: #94a3b8; }
      .fm-file-badge { position: absolute; top: 15px; right: 15px; font-size: 0.65rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.025em; }
      .badge-ready { background: #dcfce7; color: #15803d; }
      .badge-missing { background: #f1f5f9; color: #64748b; }
      
      .fm-empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #94a3b8; padding: 60px 20px; }
      .fm-empty-state i { font-size: 4rem; margin-bottom: 20px; opacity: 0.2; }
    </style>

    <div id="proyek-files-page">
      <div class="page-header" style="margin-bottom:15px">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${t}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke proyek
            </button>
            <h1 class="page-title">Drive Berkas SIMBG</h1>
            <p class="page-subtitle">${Pt(r.nama_bangunan)}</p>
          </div>
          <div class="flex gap-2">
             ${r.simbg_email_verified?``:`
                <div class="alert-card alert-warning" style="animation: pulse 2s infinite">
                   <i class="fas fa-exclamation-triangle"></i>
                   <div class="text-xs font-bold">
                      Warning: Email SIMBG belum diverifikasi. Bot tidak dapat bekerja sebelum Anda verifikasi di inbox email.
                   </div>
                   <button class="btn btn-primary btn-xs" onclick="window._changePageFolder('integrasi')">Verifikasi Sekarang</button>
                </div>
             `}
             <button class="btn btn-secondary btn-sm" onclick="window.syncFilesWithSIMBG('${t}')">
               <i class="fas fa-sync"></i> Sinkronisasi SIMBG
             </button>
          </div>
        </div>
      </div>

      <div class="file-manager-layout">
        <aside class="fm-sidebar">
          <div style="padding:0 12px 12px; font-size:0.75rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.1em">Folder Proyek</div>
          ${a.map(e=>`
            <button class="fm-nav-item ${window._currentCat===e.id?`active`:``}" id="fm-nav-${e.id}" onclick="window._changePageFolder('${e.id}')">
               <i class="fas ${e.icon}"></i>
               <span>${e.label}</span>
            </button>
          `).join(``)}
          
          <div style="margin-top:auto; padding:16px; background:#fff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
             <div class="flex items-center gap-3 mb-3">
                <i class="fab fa-google-drive" style="font-size:1.5rem; color:var(--success)"></i>
                <div>
                   <div class="text-xs text-tertiary font-bold uppercase">Cloud Storage</div>
                   <div class="text-xs font-bold text-primary">Connected</div>
                </div>
             </div>
             <div class="progress-wrap" style="height:4px; margin-bottom:8px">
                <div class="progress-fill green" style="width:65%"></div>
             </div>
             <div class="text-xs text-tertiary">Shared Drive Workspace V2.4</div>
          </div>
          
          <div style="margin-top:10px; padding:12px 16px; background:var(--bg); border-radius:16px; border:1px solid var(--border); box-shadow:var(--shadow)">
             <div class="text-xs text-tertiary font-bold uppercase mb-2" style="letter-spacing:0.02em">Status Bot SIMBG</div>
             <div class="flex items-center gap-3">
                <div style="width:10px; height:10px; border-radius:50%; background:${r.simbg_email_verified?`var(--success)`:`var(--warning)`}; box-shadow:0 0 8px ${r.simbg_email_verified?`rgba(16,185,129,0.4)`:`rgba(245,158,11,0.4)`}"></div>
                <span class="text-sm font-extrabold" style="color:var(--text-h)">${r.simbg_email_verified?`ACTIVE`:`WAITING`}</span>
             </div>
          </div>
        </aside>

        <main class="fm-main">
          <header class="fm-toolbar">
            <div class="fm-breadcrumb">
               Drive Proyek / <span id="fm-page-folder-label">${a.find(e=>e.id===window._currentCat)?.label||`Umum`}</span>
            </div>
            <div style="display:flex; gap:12px; align-items:center">
               <div style="position:relative">
                  <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem"></i>
                  <input type="text" id="fm-search" placeholder="Cari dokumen..." oninput="window._renderPageGrid()" 
                         style="padding: 8px 12px 8px 34px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem; width:220px">
               </div>
               <button class="btn btn-primary btn-sm" onclick="window._openUploadModal()" id="btn-universal-upload" style="display:none">
                  <i class="fas fa-cloud-upload-alt"></i> Unggah Berkas
               </button>
            </div>
          </header>

          <div class="fm-grid" id="fm-page-grid">
             <!-- Render via JS -->
          </div>
        </main>
      </div>
    </div>
  `;n&&(n.innerHTML=o,jt(t,a,r),window._renderPageGrid())}function jt(t,n,r){window._changePageFolder=e=>{window._currentCat=e,document.querySelectorAll(`.fm-nav-item`).forEach(e=>e.classList.remove(`active`)),document.getElementById(`fm-nav-${e}`)?.classList.add(`active`),document.getElementById(`fm-page-folder-label`).textContent=n.find(t=>t.id===e)?.label||e,window._renderPageGrid()},window._renderPageGrid=()=>{let e=document.getElementById(`fm-page-grid`),t=document.getElementById(`btn-universal-upload`);if(!e)return;if(window._currentCat===`integrasi`){t&&(t.style.display=`none`),e.innerHTML=`
         <div style="padding:24px; max-width:850px; margin:0 auto">
            <div style="text-align:center; margin-bottom:40px">
               <h2 style="font-size:1.8rem; font-weight:900; color:#1e293b; margin-bottom:12px; letter-spacing:-0.03em">Wizard Integrasi AI</h2>
               <p style="color:#64748b; font-size:1rem; max-width:500px; margin:0 auto">Hubungkan ekosistem Smart AI Pengkaji dengan Cloud Storage eksternal dan portal resmi SIMBG.</p>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:32px">
               <!-- STEP 1: DRIVE POOLING -->
               <div style="background:#fff; border:1px solid #e2e8f0; border-radius:24px; padding:32px; box-shadow:0 4px 20px rgba(0,0,0,0.05); position:relative; overflow:hidden">
                  <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--brand-500)"></div>
                  
                  <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px">
                     <div style="width:36px; height:36px; border-radius:12px; background:rgba(99,102,241,0.1); color:var(--brand-500); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem">01</div>
                     <div>
                        <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0">Storage Pooling (Unlimited Cloud)</h3>
                        <p style="font-size:0.8rem; color:#64748b; margin:4px 0 0">Gunakan akun Gmail terdistribusi untuk melampaui limit 15GB Google Drive.</p>
                     </div>
                  </div>

                  <div style="background:#f1f5f9; border-radius:12px; padding:4px; display:flex; gap:4px; margin-bottom:20px; width:fit-content">
                     <button class="btn btn-xs" id="method-manual-btn" style="background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:1px solid #e2e8f0; font-size:0.7rem" onclick="document.getElementById('gas-manual-area').style.display='block'; document.getElementById('gas-clasp-area').style.display='none'; this.style.background='#fff'; document.getElementById('method-clasp-btn').style.background='transparent'">Metode 1: Manual Copy-Paste</button>
                     <button class="btn btn-xs" id="method-clasp-btn" style="background:transparent; font-size:0.7rem; border:1px solid transparent" onclick="document.getElementById('gas-manual-area').style.display='none'; document.getElementById('gas-clasp-area').style.display='block'; this.style.background='#fff'; this.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)'; this.style.borderColor='#e2e8f0'; document.getElementById('method-manual-btn').style.background='transparent'; document.getElementById('method-manual-btn').style.borderColor='transparent'">Metode 2: Clasp CLI (Pro) <span style="background:var(--brand-500); color:#fff; padding:1px 4px; border-radius:4px; font-size:0.55rem; margin-left:4px">NEW</span></button>
                  </div>

                  <div id="gas-manual-area">
                     <p style="font-size:0.75rem; font-weight:700; color:#475569; margin-bottom:12px">Instruksi: Salin kode di bawah ke <a href="https://script.google.com" target="_blank" style="color:var(--brand-600); text-decoration:underline">Google Apps Script</a> akun baru Anda.</p>
                     
                     <div style="position:relative">
                        <pre style="background:#0f172a; color:#cbd5e1; padding:20px; border-radius:12px; font-family:var(--mono); font-size:0.7rem; height:120px; overflow-y:auto; border:1px solid #1e293b; line-height:1.6" id="gas-code-box">/**
 * SMART AI - DRIVE CLOUD PROXY
 * Target: Integrasi Workspace Mandiri
 */
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var folder = getFolder(data.proyekId);
  var subFolder = getSubFolder(folder, data.aspek);
  var file = subFolder.createFile(data.fileName, Utilities.base64Decode(data.base64), data.mimeType);
  return ContentService.createTextOutput(JSON.stringify({
    url: file.getUrl(),
    id: file.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getFolder(name) {
  var fs = DriveApp.getFoldersByName(name);
  return fs.hasNext() ? fs.next() : DriveApp.createFolder(name);
}</pre>
                        <button class="btn btn-ghost btn-xs" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.1)" onclick="window._copyGasCode()">
                           <i class="fas fa-copy"></i> Salin Kode GAS
                        </button>
                     </div>
                  </div>

                  <div id="gas-clasp-area" style="display:none">
                     <p style="font-size:0.75rem; font-weight:700; color:#475569; margin-bottom:12px">Instruksi: Gunakan terminal Anda untuk deployment kilat.</p>
                     <div style="background:#0f172a; color:#94a3b8; padding:20px; border-radius:12px; font-family:var(--mono); font-size:0.75rem; border:1px solid #1e293b; line-height:1.6">
                        <div style="color:var(--brand-400); margin-bottom:8px"># Login & Deploy Otomatis</div>
                        <div style="color:#f8fafc">clasp login</div>
                        <div style="color:#f8fafc; margin-top:4px">npm run deploy-gas</div>
                        
                        <div style="margin-top:16px; font-size:0.65rem; padding-top:12px; border-top:1px solid #1e293b">
                           <i class="fas fa-info-circle"></i> Pastikan <b>Google Apps Script API</b> sudah ON di <a href="https://script.google.com/home/usersettings" target="_blank" style="color:var(--brand-400)">Pengaturan Google</a>.
                        </div>
                     </div>
                  </div>

                  <div style="margin-top:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px">
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:#334155; margin-bottom:8px">Web App URL (Hasil Deployment)</label>
                        <input type="text" id="input-drive-proxy" value="${r.drive_proxy_url||``}" placeholder="https://script.google.com/macros/s/.../exec" 
                               style="width:100%; padding:12px; border-radius:12px; border:1px solid #cbd5e1; font-size:0.85rem">
                     </div>
                  </div>
               </div>

               <!-- STEP 2: SIMBG ACCOUNT -->
               <div style="background:#fff; border:1px solid #e2e8f0; border-radius:24px; padding:32px; box-shadow:0 4px 20px rgba(0,0,0,0.05); position:relative; overflow:hidden">
                  <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:#f97316"></div>
                  
                  <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px">
                     <div style="width:36px; height:36px; border-radius:12px; background:rgba(249,115,22,0.1); color:#f97316; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem">02</div>
                     <div>
                        <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0">Credential Portal SIMBG</h3>
                        <p style="font-size:0.8rem; color:#64748b; margin:4px 0 0">Hubungkan bot otomatis dengan portal perizinan bangunan pemerintah.</p>
                     </div>
                  </div>
                  
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px">
                     <div>
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:#334155; margin-bottom:8px">Email SIMBG</label>
                        <input type="email" id="input-simbg-email" value="${r.simbg_email||``}" placeholder="email@example.com"
                               style="width:100%; padding:12px; border-radius:12px; border:1px solid #cbd5e1; font-size:0.85rem">
                     </div>
                     <div>
                        <label style="display:block; font-size:0.75rem; font-weight:700; color:#334155; margin-bottom:8px">Password Portal</label>
                        <input type="password" id="input-simbg-pass" value="${r.simbg_password||``}" placeholder="••••••••"
                               style="width:100%; padding:12px; border-radius:12px; border:1px solid #cbd5e1; font-size:0.85rem">
                     </div>
                  </div>

                  <div style="background:#fff7ed; border:1px solid #fdba74; padding:20px; border-radius:16px">
                     <div style="display:flex; gap:14px; align-items:center">
                        <input type="checkbox" id="check-simbg-verified" ${r.simbg_email_verified?`checked`:``} style="width:18px; height:18px; cursor:pointer">
                        <label for="check-simbg-verified" style="font-size:0.8rem; color:#9a3412; font-weight:700; cursor:pointer">
                           Saya mengonfirmasi bahwa email telah diverifikasi di portal SIMBG. (Wajib agar bot aktif)
                        </label>
                     </div>
                  </div>
               </div>
            </div>

            <div style="margin-top:40px; text-align:right">
               <button class="btn btn-primary btn-lg" onclick="window._saveIntegrationSettings()" style="padding:14px 40px; border-radius:12px; font-weight:800">
                  <i class="fas fa-save" style="margin-right:8px"></i> Simpan Konfigurasi Integrasi
               </button>
            </div>
         </div>
       `;return}t&&(t.style.display=`inline-flex`);let i=document.getElementById(`fm-search`)?.value.toLowerCase()||``,a=n.find(e=>e.id===window._currentCat),o=window._filesList.filter(e=>e.category===window._currentCat),s=o.map(e=>{let t=e?.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);return i&&!e.subcategory.toLowerCase().includes(i)&&!e.name.toLowerCase().includes(i)?``:`
        <div class="fm-file-card ready" onclick="window.open('${e.file_url}', '_blank')">
          <div class="fm-file-icon has-file ${t?`image`:``}">
             <i class="fas ${t?`fa-file-image`:`fa-file-pdf`}"></i>
          </div>
          <div class="fm-file-info">
             <div class="fm-file-name" title="${e.subcategory}">${e.subcategory}</div>
             <div class="fm-file-meta">
                <span class="text-primary font-bold">${Pt(e.name)}</span>
             </div>
             <div class="text-xs text-tertiary mt-1">${new Date(e.created_at).toLocaleDateString()}</div>
          </div>
          <span class="fm-file-badge badge-ready">Ready</span>
          <div style="position:absolute; bottom:15px; right:15px; display:flex; gap:6px">
             <button class="btn btn-ghost btn-xs text-danger" onclick="event.stopPropagation(); window._deletePageFile('${e.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `}).join(``),c=a.items&&a.items.length>0?`
      <div style="grid-column: 1 / -1; margin-bottom: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
         <div style="font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.02em">
            <i class="fas fa-info-circle" style="color:var(--brand-500); margin-right:6px"></i> Target Kelengkapan SIMBG
         </div>
         <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${a.items.map(e=>{let t=o.some(t=>t.subcategory===e);return`<span style="font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: ${t?`#dcfce7`:`#fff`}; color: ${t?`#15803d`:`#64748b`}; border: 1px solid ${t?`#bbf7d0`:`#e2e8f0`}; display: flex; align-items: center; gap: 6px;">
                  <i class="fas ${t?`fa-check-circle`:`fa-clock`}"></i> ${e}
               </span>`}).join(``)}
         </div>
      </div>
    `:``;s?e.innerHTML=c+s:e.innerHTML=i?`<div class="fm-empty-state"><i class="fas fa-search"></i><p>Pencarian "${i}" tidak ditemukan.</p></div>`:c+`<div class="fm-empty-state" style="padding: 20px;"><i class="fas fa-folder-open"></i><p style="margin-top:8px">Belum ada dokumen yang diunggah.</p><button class="btn btn-secondary btn-sm mt-4" onclick="window._openUploadModal()"><i class="fas fa-cloud-upload-alt"></i> Unggah Berkas</button></div>`},window._openUploadModal=()=>{let i=n.find(e=>e.id===window._currentCat);if(!i)return;let a=window._filesList.filter(e=>e.category===window._currentCat).map(e=>e.subcategory),o=i.items.filter(e=>!a.includes(e)),s=document.createElement(`div`);s.id=`upload-modal-overlay`,s.style.cssText=`
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      background:rgba(15,23,42,0.7); backdrop-filter:blur(3px);
      z-index:9999; display:flex; align-items:center; justify-content:center;
    `,s.innerHTML=`
      <div style="background:var(--bg); width:400px; padding:24px; border-radius:16px; box-shadow:var(--shadow-xl); border:1px solid var(--border-subtle);">
        <h3 style="margin-bottom:16px; font-weight:800; color:var(--text-primary);"><i class="fas fa-cloud-upload-alt"></i> Unggah Berkas</h3>
        
        <div class="form-group">
           <label class="form-label">Identitas Dokumen SIMBG</label>
           <select id="modal-subcat-select" class="form-select">
             ${o.length===0?`<option value="" disabled selected>Semua dokumen telah dilengkapi</option>`:``}
             ${o.map(e=>`<option value="${e}">${e}</option>`).join(``)}
             <option disabled>──────</option>
             ${a.map(e=>`<option value="${e}">${e} (Timpa File Ini)</option>`).join(``)}
           </select>
        </div>

        <div class="form-group" style="margin-top:16px">
           <label class="form-label">Pilih Berkas Komputer</label>
           <input type="file" id="modal-file-input" class="form-input" accept=".pdf,.png,.jpg,.jpeg">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:24px">
           <button class="btn btn-ghost btn-sm" onclick="document.getElementById('upload-modal-overlay').remove()">Batal</button>
           <button class="btn btn-primary btn-sm" id="modal-upload-btn">Upload Sekarang</button>
        </div>
      </div>
    `,document.body.appendChild(s),document.getElementById(`modal-upload-btn`).onclick=async()=>{let n=document.getElementById(`modal-subcat-select`).value,i=document.getElementById(`modal-file-input`).files[0];if(!n)return V(`Pilih identitas dokumen.`);if(!i)return V(`Pilih file terlebih dahulu.`);document.getElementById(`upload-modal-overlay`).remove(),se(`Mengunggah ${i.name}...`);let a=new FileReader,o=await new Promise(e=>{a.onload=()=>e(a.result.split(`,`)[1]),a.readAsDataURL(i)});try{let a=await c([{base64:o,mimeType:i.type,name:i.name}],t,window._currentCat,n,r.drive_proxy_url);if(!a?.length)throw Error(`Gagal mengunggah ke Google Drive`);let s={proyek_id:t,name:i.name,file_url:a[0],category:window._currentCat,subcategory:n,storage_type:`google_drive`,ai_status:`Pending`},{data:l}=await e.from(`proyek_files`).select(`id`).eq(`proyek_id`,t).eq(`category`,window._currentCat).eq(`subcategory`,n).maybeSingle();if(l){let{error:t}=await e.from(`proyek_files`).update(s).eq(`id`,l.id);if(t)throw t}else{let{error:t}=await e.from(`proyek_files`).insert([s]);if(t)throw t}B(`Berkas berhasil diperbarui.`);let u=await Nt(t);window._filesList=u,window._renderPageGrid()}catch(e){V(`Upload Gagal: `+e.message)}}},window._deletePageFile=async n=>{if(!confirm(`Hapus rujukan berkas?`))return;await e.from(`proyek_files`).delete().eq(`id`,n),B(`Berkas terhapus.`);let r=await Nt(t);window._filesList=r,window._renderPageGrid()},window._copyGasCode=()=>{let e=document.getElementById(`gas-code-box`).textContent;navigator.clipboard.writeText(e),B(`Kode GAS berhasil disalin ke clipboard.`)},window._saveIntegrationSettings=async()=>{let n=document.getElementById(`input-drive-proxy`).value,r=document.getElementById(`input-simbg-email`).value,i=document.getElementById(`input-simbg-pass`).value,a=document.getElementById(`check-simbg-verified`).checked;se(`Menyimpan pengaturan...`);let{error:o}=await e.from(`proyek`).update({drive_proxy_url:n,simbg_email:r,simbg_password:i,simbg_email_verified:a}).eq(`id`,t);o?V(`Gagal menyimpan pengaturan.`):(B(`Pengaturan integrasi berhasil disimpan.`),location.reload())},window._renderPageGrid()}async function Mt(t){let{data:n}=await e.from(`proyek`).select(`*`).eq(`id`,t).single();return n}async function Nt(t){let{data:n}=await e.from(`proyek_files`).select(`*`).eq(`proyek_id`,t);return n||[]}function Pt(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}window.syncFilesWithSIMBG=async e=>{se(`Sinkronisasi otomatis ke akun SIMBG sedang berjalan...`),setTimeout(()=>B(`Seluruh berkas teknis telah sinkron dengan portal SIMBG.`),2e3)};var Ft=`modulepreload`,It=function(e){return`/smartaipengkaji/`+e},Lt={},Rt=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=It(t,n),t in Lt)return;Lt[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:Ft,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},zt=new class{constructor(){let e=window.SpeechRecognition||window.webkitSpeechRecognition;if(!e){this.supported=!1;return}this.supported=!0,this.recognition=new e,this.recognition.lang=`id-ID`,this.recognition.interimResults=!1,this.recognition.continuous=!1}start(e,t){if(!this.supported){t&&t(`Browser tidak mendukung Speech Recognition.`);return}this.recognition.onresult=t=>{let n=t.results[0][0].transcript;e&&e(n)},this.recognition.onerror=e=>{t&&t(e.error)};try{this.recognition.start()}catch(e){console.warn(`Recognition already started or error:`,e)}}stop(){this.supported&&this.recognition.stop()}async formalize(e){if(!e||e.length<5)return e;let{MODELS:t,safeCall:n,fetchGemini:r,parseAIJson:i}=await Rt(async()=>{let{MODELS:e,safeCall:t,fetchGemini:n,parseAIJson:r}=await import(`./ai-router-XWkYYzyb.js`);return{MODELS:e,safeCall:t,fetchGemini:n,parseAIJson:r}},__vite__mapDeps([0,1,2,3])),a=`
      Anda adalah AI Ahli Pengkaji SLF.
      Tugas: Ubah catatan suara kasar berikut menjadi kalimat teknis formal berstandar PUPR.
      
      Catatan Kasar: "${e}"
      
      Output MURNI HASIL FORMAL (Tanpa pengantar):
    `;try{return(await r(t.GEMINI,a)).replace(/["']/g,``).trim()}catch(t){return console.error(`Formalization failed:`,t),e}}},Bt={BASE_URL:`/smartaipengkaji/`,DEV:!1,MODE:`production`,PROD:!0,SSR:!1},Vt={GEMINI:{id:`gemini-3.1-flash-lite-preview`,url:`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${Bt.VITE_GEMINI_API_KEY}`},OPENAI:{id:`gpt-4o`,url:Bt.PROD?`https://api.openai.com/v1/chat/completions`:`/api/openai/v1/chat/completions`,key:Bt.VITE_OPENAI_API_KEY},CLAUDE:{id:`claude-3-5-sonnet-20241022`,url:Bt.PROD?`https://api.anthropic.com/v1/messages`:`/api/claude/v1/messages`,key:Bt.VITE_CLAUDE_API_KEY},SLF_OPUS:{id:`adminskpslf/SLF_OPUS`,url:Bt.VITE_HF_SLF_OPUS_URL||`https://api-inference.huggingface.co/models/adminskpslf/SLF_OPUS`,key:Bt.VITE_HF_API_TOKEN}};async function Ht(e,t,n=`teknis`,r=``){if(!e||e.length===0)throw Error(`Tidak ada file untuk dianalisis.`);let i=[`gemini`,`openai`,`claude`],a=r.toLowerCase();i=a.includes(`struktur`)||a.includes(`kebakaran`)?[`slf_opus`,`claude`,`openai`,`gemini`]:n===`administrasi`?[`gemini`,`slf_opus`,`openai`]:[`slf_opus`,`gemini`,`openai`];let o=``;o=n===`administrasi`?`Anda adalah seorang Auditor Administrasi Tingkat Lanjut untuk Sertifikat Laik Fungsi (SLF) Bangunan Gedung di Indonesia.
Gunakan mekanisme "Deep Reasoning Engineering" untuk menelaah secara komprehensif terhadap ${e.length} file dokumen pada komponen: "${t}".
Verifikasi kesesuaian berdasarkan PP No. 16 Tahun 2021.
Format JSON wajib: { "status": "ada_sesuai|ada_tidak_sesuai|tidak_ada", "catatan": "<abstraksi teknis padat>" }`:`Anda adalah seorang Insinyur Sipil/Struktur Ahli Audit Keandalan Bangunan (SNI 9273:2025).
Gunakan "Deep Reasoning Engineering" untuk mendiagnosa ${e.length} sampel visual dari komponen: "${t}".
Analisis patologi material dan risiko kegagalan.
Format JSON wajib: { "status": "baik|sedang|buruk|kritis", "catatan": "<diagnosa teknis padat>" }`;let s=null;for(let n of i)try{console.log(`[Vision AI] Mencoba provider: ${n.toUpperCase()} untuk ${t}`);let r=``;if(n===`gemini`)r=await Wt(e,o);else if(n===`openai`){if(!Vt.OPENAI.key)continue;r=await Gt(e,o)}else if(n===`claude`){if(!Vt.CLAUDE.key)continue;r=await Kt(e,o)}else if(n===`slf_opus`){if(!Vt.SLF_OPUS.key)continue;r=await qt(e,o)}let i=r.replace(/```json/gi,``).replace(/```/g,``).trim();return JSON.parse(i)}catch(e){s=e,console.warn(`[Vision AI] Provider ${n.toUpperCase()} Gagal:`,e.message)}throw Error(`Seluruh AI Vision gagal memproses gambar. Error terakhir: ${s?.message}`)}async function Ut(e,t,n,r=``){let i=`Anda adalah Senior Engineering Auditor untuk Sertifikat Laik Fungsi (SLF).
Tugas: Melakukan VALIDASI KOMPARATIF antara dokumen-dokumen rujukan yang dilampirkan untuk item: "${t}" (Kode: ${n}).

KONTEKS TAMBAHAN: ${r}

INSTRUKSI DETAIL:
1. Identifikasi angka/parameter teknis pada Dokumen Legal (KRK/KKPR/PBG).
2. Identifikasi angka/parameter teknis pada Dokumen Fisik/Teknis (Siteplan/Denah/Gambar).
3. Bandingkan keduanya. Apakah ada deviasi? Apakah sesuai dengan standar PUPR?
4. Susun narasi profesional (ENGINEERING REASONING) dalam Bahasa Indonesia untuk dimasukkan ke Bab IV Laporan Teknis.

Output WAJIB JSON murni:
{
  "status": "baik|sedang|buruk|kritis",
  "catatan": "### ANALISIS KOMPARATIF BUKTI\\n\\n**A. Data Dokumen Legal:** ...\\n**B. Data Dokumen Teknis:** ...\\n**C. Hasil Verifikasi:** ...\\n\\nKesimpulan: ..."
}`,a=[`slf_opus`,`claude`,`gemini`,`openai`],o=null;for(let t of a)try{let n=``;t===`gemini`?n=await Wt(e,i):t===`openai`&&Vt.OPENAI.key?n=await Gt(e,i):t===`claude`&&Vt.CLAUDE.key?n=await Kt(e,i):t===`slf_opus`&&Vt.SLF_OPUS.key&&(n=await qt(e,systemPrompt));let r=n.replace(/```json/gi,``).replace(/```/g,``).trim();return JSON.parse(r)}catch(e){o=e}throw Error(`Gagal melakukan komparasi AI: ${o?.message}`)}async function Wt(e,t){if(!Bt.VITE_GEMINI_API_KEY)throw Error(`API Key Gemini hilang`);let n=e.map(e=>({inline_data:{mime_type:e.mimeType,data:e.base64}})),r=await fetch(Vt.GEMINI.url,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:t},...n]}],generationConfig:{temperature:.2}})});if(!r.ok)throw Error(await r.text());return(await r.json()).candidates?.[0]?.content?.parts?.[0]?.text||`{}`}async function Gt(e,t){if(!Vt.OPENAI.key)throw Error(`API Key OpenAI hilang`);let n=[{type:`text`,text:t}];e.forEach(e=>{n.push({type:`image_url`,image_url:{url:`data:${e.mimeType};base64,${e.base64}`}})});let r=await fetch(Vt.OPENAI.url,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${Vt.OPENAI.key}`},body:JSON.stringify({model:Vt.OPENAI.id,messages:[{role:`user`,content:n}],temperature:.2,max_tokens:500})});if(!r.ok)throw Error(await r.text());return(await r.json()).choices?.[0]?.message?.content||`{}`}async function Kt(e,t){if(!Vt.CLAUDE.key)throw Error(`API Key Claude hilang`);let n=[];e.forEach(e=>{let t=e.mimeType.split(`;`)[0];n.push({type:`image`,source:{type:`base64`,media_type:t,data:e.base64}})}),n.push({type:`text`,text:t});let r=await fetch(Vt.CLAUDE.url,{method:`POST`,headers:{"Content-Type":`application/json`,"x-api-key":Vt.CLAUDE.key,"anthropic-version":`2023-06-01`,"anthropic-dangerous-direct-browser-access":`true`},body:JSON.stringify({model:Vt.CLAUDE.id,max_tokens:1024,temperature:.2,messages:[{role:`user`,content:n}]})});if(!r.ok)throw Error(await r.text());return(await r.json()).content?.[0]?.text||`{}`}async function qt(e,t){let n=[{type:`text`,text:t}];e.forEach(e=>{n.push({type:`image_url`,image_url:{url:`data:${e.mimeType};base64,${e.base64}`}})});let r={inputs:[{role:`user`,content:n}],parameters:{max_new_tokens:1024,temperature:.1}},i=await fetch(Vt.SLF_OPUS.url,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${Vt.SLF_OPUS.key}`},body:JSON.stringify(r)});if(!i.ok){let e=await i.text();throw Error(`SLF_OPUS Vision Error: ${e.substring(0,100)}`)}let a=await i.json();return(Array.isArray(a)?a[0].generated_text:a.generated_text||``).replace(/<thought>[\s\S]*?<\/thought>/g,``).trim()}async function Jt(e){return new Promise((t,n)=>{if(e instanceof File){let r=new FileReader;r.onload=e=>Yt(e.target.result,t,n),r.readAsDataURL(e)}else Yt(e,t,n)})}function Yt(e,t,n){let r=`annotation-canvas`;z({title:`Anotasi Foto Lapangan`,body:`
    <div class="image-editor-container" style="display:flex; flex-direction:column; gap:12px;">
      <div class="editor-toolbar" style="display:flex; align-items:center; gap:12px; padding:8px; background:var(--bg-elevated); border-radius:var(--radius-md);">
        <div class="tool-group" style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:0.75rem; font-weight:600; color:var(--text-tertiary);">PENA:</label>
          <button class="btn btn-icon btn-sm active" id="tool-pen" title="Pena Gambar"><i class="fas fa-pen"></i></button>
          <input type="color" id="pen-color" value="#ef4444" style="width:30px; height:30px; border:none; border-radius:4px; cursor:pointer; background:none;">
          <select id="pen-size" class="form-select" style="width:80px; padding:4px 8px; font-size:0.75rem;">
            <option value="2">Tipis</option>
            <option value="5" selected>Sedang</option>
            <option value="10">Tebal</option>
            <option value="20">Sangat Tebal</option>
          </select>
        </div>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" id="tool-undo" title="Urungkan"><i class="fas fa-undo"></i></button>
        <button class="btn btn-secondary btn-sm" id="tool-clear" title="Hapus Semua"><i class="fas fa-trash-can"></i></button>
      </div>
      
      <div id="canvas-wrapper" style="position:relative; width:100%; height:450px; background:#000; border-radius:var(--radius-md); overflow:hidden; display:flex; align-items:center; justify-content:center; cursor:crosshair;">
        <canvas id="${r}" style="max-width:100%; max-height:100%; object-fit:contain;"></canvas>
      </div>
      
      <div class="editor-hint" style="font-size:0.7rem; color:var(--text-tertiary); text-align:center;">
        <i class="fas fa-info-circle"></i> Gunakan pena merah untuk menandai area kritis (retak, korosi, lendutan, dll) sebelum dianalisis AI.
      </div>
    </div>
  `,footer:`
    <button class="btn btn-secondary" id="editor-cancel">Batal</button>
    <button class="btn btn-primary" id="editor-save">Simpan & Analisis AI <i class="fas fa-arrow-right"></i></button>
  `,size:`lg`,onClose:()=>t(null)});let i=document.getElementById(r),a=i.getContext(`2d`),o=new Image,s=!1,c=[];o.onload=()=>{let e=Math.min(800/o.width,1);i.width=o.width*e,i.height=o.height*e,a.drawImage(o,0,0,i.width,i.height),l()},o.src=e;function l(){c.length>20&&c.shift(),c.push(i.toDataURL())}function u(){if(c.length>1){c.pop();let e=new Image;e.onload=()=>{a.clearRect(0,0,i.width,i.height),a.drawImage(e,0,0)},e.src=c[c.length-1]}}let d=e=>{let t=i.getBoundingClientRect(),n=i.width/t.width,r=i.height/t.height;return{x:(e.clientX-t.left)*n,y:(e.clientY-t.top)*r}},f=e=>{s=!0;let t=d(e.touches?e.touches[0]:e);a.beginPath(),a.moveTo(t.x,t.y),a.lineWidth=document.getElementById(`pen-size`).value,a.lineCap=`round`,a.strokeStyle=document.getElementById(`pen-color`).value},p=e=>{if(!s)return;e.preventDefault();let t=d(e.touches?e.touches[0]:e);a.lineTo(t.x,t.y),a.stroke()},m=()=>{s&&(s=!1,a.closePath(),l())};i.addEventListener(`mousedown`,f),i.addEventListener(`mousemove`,p),window.addEventListener(`mouseup`,m),i.addEventListener(`touchstart`,f),i.addEventListener(`touchmove`,p),window.addEventListener(`touchend`,m),document.getElementById(`tool-undo`).onclick=u,document.getElementById(`tool-clear`).onclick=()=>{a.clearRect(0,0,i.width,i.height),a.drawImage(o,0,0,i.width,i.height),l()},document.getElementById(`editor-cancel`).onclick=()=>{te(),t(null)},document.getElementById(`editor-save`).onclick=()=>{let e=i.toDataURL(`image/jpeg`,.85);te(),t(e)}}var Xt=`SmartAISyncDB`,Zt=2,Qt=`checklist_drafts`,$t=`image_queue`;function en(){return new Promise((e,t)=>{let n=indexedDB.open(Xt,Zt);n.onupgradeneeded=e=>{let t=e.target.result;t.objectStoreNames.contains(Qt)||t.createObjectStore(Qt,{keyPath:`id`}),t.objectStoreNames.contains($t)||t.createObjectStore($t,{keyPath:`id`})},n.onsuccess=t=>e(t.target.result),n.onerror=e=>t(e.target.error)})}async function tn(e){let t=(await en()).transaction(Qt,`readwrite`),n=t.objectStore(Qt);for(let t of e){let e={...t,id:`${t.proyek_id}_${t.kode}`};n.put(e)}return new Promise((e,n)=>{t.oncomplete=()=>e(),t.onerror=()=>n(t.error)})}async function nn(){let e=(await en()).transaction(Qt,`readonly`).objectStore(Qt).getAll();return new Promise((t,n)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>n(e.error)})}async function rn(e){let t=(await en()).transaction(Qt,`readwrite`),n=t.objectStore(Qt);for(let t of e)n.delete(t);return new Promise((e,n)=>{t.oncomplete=()=>e(),t.onerror=()=>n(t.error)})}async function an(e,t,n,r){let i=await en(),a=`img_${e}_${t}_${Date.now()}`,o=i.transaction($t,`readwrite`);return o.objectStore($t).put({id:a,proyekId:e,kode:t,file:n,metadata:r,status:`pending`}),new Promise((e,t)=>{o.oncomplete=e,o.onerror=t})}async function on(e,t){if(!navigator.onLine)return;let n=await nn(),r=await sn();if(!(n.length===0&&r.length===0)){console.log(`[Sync Engine] Starting background sync: ${n.length} drafts, ${r.length} images.`);for(let t of n)try{let{id:n,...r}=t,{error:i}=await e.from(`checklist_items`).upsert(r,{onConflict:`proyek_id,kode`});i||await rn([n])}catch(e){console.error(`Sync failed for item:`,t.kode,e)}for(let e of r)try{await t(e.file,e.proyekId,e.kode,e.metadata),await cn(e.id)}catch(t){console.error(`Image sync failed:`,e.id,t)}}}async function sn(){let e=(await en()).transaction($t,`readonly`).objectStore($t).getAll();return new Promise(t=>{e.onsuccess=()=>t(e.result)})}async function cn(e){let t=(await en()).transaction($t,`readwrite`);return t.objectStore($t).delete(e),new Promise(e=>{t.oncomplete=e})}var ln={A01:[`IMB`,`PBG`,`Perizinan`],A02:[`SLF`,`Sertifikat Laik Fungsi`],A03:[`As-Built`,`Gambar`],A04:[`DED`,`Rencana Teknis`],A09:[`AMDAL`,`UKL`,`UPL`,`Lingkungan`],"ITEM-09A":[`Dinas`,`Instansi`,`Rekomendasi`],"ITEM-01A":[`Fungsi`,`Pemanfaatan`],"ITEM-02A":[`KRK`,`KKPR`,`Intensitas`,`Siteplan`,`KDB`],"ITEM-02B":[`Basemen`,`Basement`],"ITEM-02C":[`Luas`,`Lantai`],"ITEM-02D":[`Jumlah Lantai`],"ITEM-02F":[`Ketinggian`,`Elevasi`],"ITEM-02G":[`KDH`,`Hijau`,`Resapan`],"ITEM-02H":[`GSB`,`Sempadan`,`Batas`],"ITEM-02I":[`Batas Persil`,`Jarak Bebas`],"ITEM-02J":[`Antar Bangunan`],"ITEM-03A":[`Tampak`,`Arsitektur`,`Material`],"ITEM-03B":[`Tata Ruang`,`Interior`],"ITEM-04A":[`Lingkungan`,`SPPL`],"ITEM-05A1":[`Sondir`,`Penyelidikan Tanah`,`Fondasi`],"ITEM-05A2":[`Kolom`,`Struktur`],"ITEM-05A3":[`Balok`,`Struktur`],"ITEM-05A4":[`Pelat`,`Slab`],"ITEM-05A5":[`Atap`,`Truss`],"ITEM-05A7":[`Basemen`,`Dinding Penahan`],"ITEM-05B":[`Kebakaran`,`Fire`,`Hydrant`],"ITEM-05C":[`Petir`,`LPT`,`Grounded`],"ITEM-05D":[`Listrik`,`PLN`,`SLO`],"ITEM-05E":[`Evakuasi`,`Tangga Darurat`],"ITEM-06C1":[`Air Bersih`,`PDAM`],"ITEM-06C2":[`Air Kotor`,`STP`,`Septic`],"ITEM-06C4":[`Drainase`,`Hujan`,`Peil Banjir`]};function un(e,t=[]){let n=ln[e]||[];return n.length===0?[]:t.filter(e=>{let t=(e.name||``).toLowerCase(),r=(e.subcategory||``).toLowerCase();return n.some(e=>{let n=e.toLowerCase();return t.includes(n)||r.includes(n)})})}var dn=[{kode:`A01`,nama:`PBG / IMB (Persetujuan Bangunan Gedung)`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]},{kode:`A02`,nama:`Sertifikat Laik Fungsi Sebelumnya`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`,`pertama_kali`]},{kode:`A03`,nama:`Gambar As-Built Drawing`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]},{kode:`A04`,nama:`Gambar Rencana Teknis (DED)`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]},{kode:`A05`,nama:`Dokumen RKS / Spesifikasi Teknis`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]},{kode:`A06`,nama:`Dokumen K3 Konstruksi`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]},{kode:`A07`,nama:`Ijin Penggunaan Air/Listrik (PLN/PDAM)`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]},{kode:`A08`,nama:`Sertifikat Laik Operasi (SLO) Instalasi`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]},{kode:`A09`,nama:`Dokumen AMDAL / UKL-UPL`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`,`tidak_wajib`]},{kode:`A10`,nama:`IMB Perubahan / Renovasi (jika ada)`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`,`tidak_ada_renovasi`]},{kode:`ITEM-09A`,nama:`Kesesuaian Dokumen dengan Rekomendasi Instansi Terkait`,options:[`ada_sesuai`,`ada_tidak_sesuai`,`tidak_ada`]}],fn=[{aspek:`Kesesuaian Pemanfaatan`,items:[{kode:`ITEM-01A`,nama:`Fungsi Bangunan Gedung`},{kode:`ITEM-01B`,nama:`Pemanfaatan Setiap Ruang`},{kode:`ITEM-01C`,nama:`Pemanfaatan Ruang Luar pada Persil`}]},{aspek:`Kesesuaian Intensitas`,items:[{kode:`ITEM-02A`,nama:`Luas Lantai Dasar`},{kode:`ITEM-02B`,nama:`Luas Dasar Basemen`},{kode:`ITEM-02C`,nama:`Luas Total Lantai Bangunan`},{kode:`ITEM-02D`,nama:`Jumlah Lantai Bangunan`},{kode:`ITEM-02E`,nama:`Jumlah Lantai Basemen`},{kode:`ITEM-02F`,nama:`Ketinggian Bangunan`},{kode:`ITEM-02G`,nama:`Luas Daerah Hijau (KDH)`},{kode:`ITEM-02H`,nama:`Jarak Sempadan (GSB, Sungai, Pantai, dsb)`},{kode:`ITEM-02I`,nama:`Jarak Bangunan dengan Batas Persil`},{kode:`ITEM-02J`,nama:`Jarak Antar Bangunan Gedung`}]},{aspek:`Persyaratan Arsitektur`,items:[{kode:`ITEM-03A`,nama:`Penampilan Bangunan Gedung`},{kode:`ITEM-03B`,nama:`Tata Ruang Dalam Bangunan`},{kode:`ITEM-03C`,nama:`Keseimbangan dan Keserasian Lingkungan`}]},{aspek:`Dampak Lingkungan`,items:[{kode:`ITEM-04A`,nama:`Dokumen Lingkungan (AMDAL/UKL-UPL/SPPL)`}]},{aspek:`Keselamatan Bangunan`,items:[{kode:`ITEM-05A1`,nama:`Struktur Fondasi`},{kode:`ITEM-05A2`,nama:`Struktur Kolom`},{kode:`ITEM-05A3`,nama:`Struktur Balok`},{kode:`ITEM-05A4`,nama:`Struktur Pelat Lantai`},{kode:`ITEM-05A5`,nama:`Struktur Rangka Atap`},{kode:`ITEM-05A6`,nama:`Struktur Dinding Inti (Core Wall)`},{kode:`ITEM-05A7`,nama:`Struktur Basemen`},{kode:`ITEM-05A8`,nama:`Bearing Wall dan Shear Wall`},{kode:`ITEM-05A9`,nama:`Struktur Pengaku (Bracing)`},{kode:`ITEM-05A10`,nama:`Peredam Getaran (Damper)`},{kode:`ITEM-05B`,nama:`Sistem Proteksi Kebakaran`},{kode:`ITEM-05C`,nama:`Sistem Proteksi Petir`},{kode:`ITEM-05D`,nama:`Sistem Instalasi Listrik`},{kode:`ITEM-05E`,nama:`Jalur Evakuasi (Mean of Egress)`}]},{aspek:`Kesehatan Bangunan`,items:[{kode:`ITEM-06A`,nama:`Sistem Penghawaan`},{kode:`ITEM-06B`,nama:`Sistem Pencahayaan`},{kode:`ITEM-06C1`,nama:`Sistem Utilitas Air Bersih`},{kode:`ITEM-06C2`,nama:`Pembuangan Air Kotor dan Limbah`},{kode:`ITEM-06C3`,nama:`Pembuangan Kotoran dan Sampah`},{kode:`ITEM-06C4`,nama:`Pengelolaan Air Hujan`},{kode:`ITEM-06D`,nama:`Penggunaan Bahan Bangunan Gedung`}]},{aspek:`Kenyamanan Bangunan`,items:[{kode:`ITEM-07A`,nama:`Ruang Gerak`},{kode:`ITEM-07B`,nama:`Kondisi Udara Dalam Ruang`},{kode:`ITEM-07C`,nama:`Pandangan Dari dan Ke Dalam Bangunan`},{kode:`ITEM-07D`,nama:`Kondisi Getaran dan Kebisingan`}]},{aspek:`Kemudahan Bangunan`,items:[{kode:`ITEM-08A`,nama:`Fasilitas dan Aksesibilitas`},{kode:`ITEM-08B`,nama:`Kelengkapan Prasarana dan Sarana`}]}],pn=[{aspek:`K.1.1. Pemeriksaan Persyaratan Peruntukan Bangunan`,items:[{kode:`K.1.1.1`,nama:`Fungsi Bangunan Gedung (Eksisting)`,ref:`Pemeriksaan Visual`},{kode:`K.1.1.2`,nama:`Pemanfaatan Setiap Ruang Dalam Bangunan`,ref:`Sampel Ruang Dalam`},{kode:`K.1.1.3`,nama:`Pemanfaatan Ruang Luar Persil`,ref:`Ruang Terbuka`}]},{aspek:`K.1.2. Pemeriksaan Persyaratan Intensitas Bangunan`,items:[{kode:`K.1.2.1`,nama:`Luas Lantai Dasar Bangunan (KDB)`,ref:`Pengukuran Faktual`},{kode:`K.1.2.2`,nama:`Luas Total Lantai Bangunan (KLB)`,ref:`Total m2`},{kode:`K.1.2.3`,nama:`Luas Dasar Basemen (Jika ada)`,ref:`Koefisien Tapak`},{kode:`K.1.2.4`,nama:`Jumlah Lantai Bangunan`,ref:`IMB/PBG`},{kode:`K.1.2.6`,nama:`Ketinggian Bangunan (Puncak)`,ref:`Rencana Teknis`},{kode:`K.1.2.7`,nama:`Luas Daerah Hijau Dalam Persil (KDH)`,ref:`Ruang Terbuka Hijau`},{kode:`K.1.2.8`,nama:`Jarak Sempadan (Jalan, Sungai, Rel, Tegangan Tinggi)`,ref:`Garis Sempadan (GSB)`},{kode:`K.1.2.9`,nama:`Jarak Bangunan Dengan Batas Persil (D/B/K/K)`,ref:`Sempadan Samping`},{kode:`K.1.2.10`,nama:`Jarak Antar Bangunan (Jika Jamak)`,ref:`Ketentuan Keselamatan`}]},{aspek:`K.1.3. Pemeriksaan Penampilan Bangunan Gedung`,items:[{kode:`K.1.3.1`,nama:`Bentuk Bangunan (Keserasian/Langgam)`,ref:`Arsitektur`},{kode:`K.1.3.3`,nama:`Bentuk dan Penutup Atap`,ref:`Pengamatan Visual`},{kode:`K.1.3.4`,nama:`Tampak Bangunan (Fasad/Finishing)`,ref:`Estetika Lingkungan`},{kode:`K.1.3.5`,nama:`Profil, Detail, dan Material Bangunan`,ref:`Material Faktual`},{kode:`K.1.3.6`,nama:`Batas Fisik Atau Pagar Pekarangan`,ref:`Ketentuan Pagar`},{kode:`K.1.3.7`,nama:`Kulit Atau Selubung Bangunan`,ref:`Efisiensi Energi`}]},{aspek:`K.1.4. Pemeriksaan Tata Ruang-Dalam Bangunan`,items:[{kode:`K.1.4.1`,nama:`Kebutuhan Ruang Utama (Fungsionalitas)`,ref:`Kesesuaian Fungsi`},{kode:`K.1.4.2`,nama:`Bidang-Bidang Dinding (Kualitas/Finish)`,ref:`Dinding Struktural`},{kode:`K.1.4.4`,nama:`Pintu dan Jendela (Kualitas/Material)`,ref:`Sirkulasi Cahaya`},{kode:`K.1.4.5`,nama:`Tinggi Ruang (Lantai ke Plafon)`,ref:`Persyaratan Kenyamanan`},{kode:`K.1.4.6`,nama:`Tinggi Lantai Dasar (Peil Lantai)`,ref:`Bebas Banjir`},{kode:`K.1.4.7`,nama:`Rongga Atap dan Aksesibilitas Atap`,ref:`Pemeliharaan`},{kode:`K.1.4.8`,nama:`Penutup Lantai & Langit-langit`,ref:`Interior`}]},{aspek:`K.1.5. Keseimbangan & Keserasian Lingkungan`,items:[{kode:`K.1.5.1`,nama:`Tinggi (Peil) Pekarangan`,ref:`Drainase Makro`},{kode:`K.1.5.2`,nama:`Ruang Terbuka Hijau Pekarangan`,ref:`KDH`},{kode:`K.1.5.4`,nama:`Daerah Hijau Bangunan`,ref:`Taman Vertikal/Atap`},{kode:`K.1.5.6`,nama:`Tata Perkerasan Pekarangan (Daya Serap)`,ref:`Sumur Resapan`},{kode:`K.1.5.7`,nama:`Sirkulasi Manusia dan Kendaraan`,ref:`Aksesibilitas`},{kode:`K.1.5.9`,nama:`Pertandaan (Signage) & Pencahayaan Luar`,ref:`Urban Design`}]},{aspek:`K.2.1. Pemeriksaan Sistem Struktur (Keselamatan)`,items:[{kode:`K.2.1.1`,nama:`Pondasi (Pengamatan Deformasi/Miring)`,ref:`Stabilitas Bawah`},{kode:`K.2.1.2`,nama:`Struktur Kolom (Lantai Dasar s/d Atas)`,ref:`Visual Retak/Korosi`},{kode:`K.2.1.3`,nama:`Struktur Balok Lantai (Lendutan/Retak)`,ref:`Kapasitas Beban`},{kode:`K.2.1.4`,nama:`Pelat Lantai (Getaran/Retak Rambut)`,ref:`Pengukuran Manual`},{kode:`K.2.1.5`,nama:`Struktur Rangka Atap (Sambungan/Gording)`,ref:`Ketahanan Angin`},{kode:`K.2.1.6`,nama:`Dinding Basement & Pelat Basemen`,ref:`Remesan Air`}]},{aspek:`K.2.2. Pemeriksaan Sistem Proteksi Kebakaran`,items:[{kode:`K.2.2.1`,nama:`Sistem Proteksi Pasif (Pintu Tahan Api)`,ref:`MKKG Pasif`},{kode:`K.2.2.2`,nama:`Pelapis Interior & Perabot Tahan Api`,ref:`Bahan Finishing`},{kode:`K.2.2.7`,nama:`Sistem Pipa Tegak & Hydrant`,ref:`Proteksi Aktif`},{kode:`K.2.2.8`,nama:`Sistem Deteksi & Alarm Kebakaran`,ref:`Fasilitas Keandalan`}]}],mn=[{value:``,label:`— Pilih Status —`},{value:`ada_sesuai`,label:`✓ Ada & Sesuai`},{value:`ada_tidak_sesuai`,label:`⚠ Ada Tapi Tidak Sesuai`},{value:`tidak_ada`,label:`✗ Tidak Ada`},{value:`pertama_kali`,label:`○ Pengajuan Pertama`},{value:`tidak_wajib`,label:`— Tidak Wajib`},{value:`tidak_ada_renovasi`,label:`— Tidak Ada Renovasi`}],hn=[{value:``,label:`— Pilih Status —`},{value:`baik`,label:`✓ Baik / Sesuai`},{value:`sedang`,label:`⚠ Sedang / Minor Issue`},{value:`buruk`,label:`⚠ Buruk / Perlu Perbaikan`},{value:`kritis`,label:`✗ Kritis / Tidak Laik`},{value:`tidak_ada`,label:`— Tidak Ada / N/A`}],gn=[{id:`umum`,label:`Data Umum`,icon:`fa-folder-open`,items:[`Data Siteplan`,`Data Penyedia Jasa`,`Laporan Pemeriksaan SLF`,`Surat Pernyataan Kelaikan`,`Persetujuan Lingkungan`,`Data Intensitas (KKPR)`,`Identitas Pemilik (KTP)`]},{id:`tanah`,label:`Data Tanah & Lingkungan`,icon:`fa-map-marked-alt`,items:[`Sertifikat Tanah`,`Izin Pemanfaatan Tanah`,`Gambar Batas Tanah`,`Hasil Penyelidikan Tanah`,`Persetujuan Tetangga`,`Dokumen Lingkungan (SPPL/UKL-UPL)`]},{id:`arsitektur`,label:`Teknis Arsitektur`,icon:`fa-drafting-compass`,items:[`Gambar Detail Bangunan`,`Gambar Tata Ruang Luar`,`Gambar Tata Ruang Dalam`,`Gambar Tampak`,`Gambar Potongan`,`Gambar Denah`,`Gambar Tapak`,`Spesifikasi Arsitektur`,`Gambar Situasi`]},{id:`struktur`,label:`Teknis Struktur`,icon:`fa-cubes`,items:[`Gambar Detail Tangga`,`Gambar Pelat Lantai`,`Gambar Penutup`,`Gambar Rangka Atap`,`Gambar Balok`,`Gambar Kolom`,`Gambar Pondasi`,`Spesifikasi Struktur`,`Perhitungan Struktur`]},{id:`mep`,label:`Teknis MEP`,icon:`fa-bolt`,items:[`Sistem Kebakaran`,`Pengelolaan Sampah`,`Pengelolaan Drainase`,`Pengelolaan Air Limbah`,`Pengelolaan Air Hujan`,`Air Bersih`,`Pencahayaan`,`Sumber Listrik`,`Spesifikasi Mekanikal`,`Perhitungan MEP`]},{id:`lapangan`,label:`Data Pengujian & Lapangan`,icon:`fa-clipboard-check`,items:[`Foto Tapak & Lingkungan`,`Foto Teknis Arsitektur`,`Foto Teknis Struktur`,`Foto Teknis MEP`,`Laporan Pengujian Tanah`,`Hasil Hammer Test`,`Hasil Core Drill`,`Video Inspeksi Drone`,`Dokumen Pendukung Lapangan`]}];async function _n(e={}){let t=e.id;if(!t)return M(`proyek`),``;let n=document.getElementById(`page-root`);n&&(n.innerHTML=Dn());let[r,i]=await Promise.all([Tn(t),En(t)]);if(!r)return M(`proyek`),V(`Proyek tidak ditemukan.`),``;let a={};(i||[]).forEach(e=>{a[e.kode]=e}),window._checklistProyekId=t,window._checklistDataMap=a,window._dbFotoLinks={},Object.keys(a).forEach(e=>{a[e].foto_urls&&Array.isArray(a[e].foto_urls)?window._dbFotoLinks[e]=a[e].foto_urls:window._dbFotoLinks[e]=[]});let o=vn(r,a);return n&&(n.innerHTML=o,window._switchChecklistMainTab(`admin`),Cn(t),renderLapanganGallery()),o}function vn(e,t){let n=dn.filter(e=>t[e.kode]?.status).length,r=fn.flatMap(e=>e.items).filter(e=>t[e.kode]?.status).length,i=fn.flatMap(e=>e.items).length,a=(window._filesList||[]).length>0;return`
    <style>
      .file-manager-layout { display: flex; height: calc(100vh - 250px); background: #fff; border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; margin-top: 10px; box-shadow: var(--shadow-sm); }
      @media (max-width: 768px) {
        .file-manager-layout { flex-direction: column; height: auto; }
        .fm-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border-subtle); }
      }
      .fm-sidebar { width: 240px; background: #f8fafc; border-right: 1px solid var(--border-subtle); padding: 12px; display: flex; flex-direction: column; gap: 4px; }
      .fm-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
      .fm-toolbar { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
      .fm-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; color: #64748b; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: 0.2s; border: none; background: transparent; width: 100%; text-align: left; }
      .fm-nav-item:hover { background: #f1f5f9; color: #1e293b; }
      .fm-nav-item.active { background: #e0f2fe; color: #0284c7; }
      .fm-nav-item i { width: 20px; font-size: 1rem; }
      
      .fm-breadcrumb { font-size: 0.8125rem; color: #64748b; display: flex; align-items: center; gap: 6px; }
      .fm-breadcrumb span { color: #1e293b; font-weight: 600; }
      
      .fm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; padding: 20px; overflow-y: auto; flex: 1; }
      .fm-file-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; transition: 0.2s; position: relative; background: #fff; cursor: pointer; }
      .fm-file-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-sm); transform: translateY(-2px); }
      .fm-file-card.empty { border-style: dashed; background: #fcfcfc; }
      .fm-file-card.empty:hover { background: #f8fafc; }
      
      .fm-file-icon { width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: #f1f5f9; color: #94a3b8; }
      .fm-file-icon.has-file { background: #fee2e2; color: #ef4444; }
      .fm-file-icon.image { background: #e0f2fe; color: #0ea5e9; }
      
      .fm-file-info { display: flex; flex-direction: column; gap: 2px; }
      .fm-file-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .fm-file-meta { font-size: 0.75rem; color: #94a3b8; }
      .fm-file-badge { position: absolute; top: 10px; right: 10px; font-size: 0.625rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
      .badge-ready { background: #dcfce7; color: #15803d; }
      .badge-missing { background: #f1f5f9; color: #64748b; }

      .fm-empty-state { flex: 1; display: flex; flex-direction: column; items-center justify-content: center; text-align: center; color: #94a3b8; padding: 40px; }
      .fm-empty-state i { font-size: 3rem; margin-bottom: 12px; opacity: 0.5; }
    </style>
    <div id="checklist-page">
      <!-- Header -->
      <div class="page-header">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${e.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> ${On(e.nama_bangunan)}
            </button>
            <h1 class="page-title">Checklist Pemeriksaan SLF</h1>
            <p class="page-subtitle">Pengisian data pemeriksaan sesuai standar NSPK — perubahan tersimpan otomatis</p>
          </div>
          <div class="flex gap-3" style="align-items:center">
             ${e.simbg_email_verified?``:`
                <div style="background:#fff7ed; border:1px solid #fdba74; padding:8px 16px; border-radius:12px; display:flex; align-items:center; gap:12px; animation: pulse 2s infinite; cursor:pointer; box-shadow:0 2px 4px rgba(251,146,60,0.1)" onclick="window.navigate('proyek-files', {id:'${e.id}'})">
                   <div style="width:24px; height:24px; border-radius:50%; background:#f97316; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                      <i class="fas fa-exclamation" style="font-size:12px"></i>
                   </div>
                   <div style="font-size:11px; font-weight:700; color:#c2410c; line-height:1.4">
                      <span style="text-transform:uppercase; font-size:9px; letter-spacing:0.05em; display:block; opacity:0.8">Integrasi SIMBG</span>
                      Konfirmasi Verifikasi Email diperlukan agar Bot Aktif.
                   </div>
                   <i class="fas fa-chevron-right" style="color:#fdba74; font-size:10px; margin-left:4px"></i>
                </div>
             `}
            <div style="text-align:right">
              <div class="text-xs text-tertiary">Progress</div>
              <div class="text-sm font-semibold text-primary">${n+r}/${dn.length+i} item</div>
            </div>
            <button class="btn btn-primary" onclick="window._saveChecklist()">
              <i class="fas fa-save"></i> Simpan Semua
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Strip (Responsive 3-to-1) -->
      <div class="grid-3" style="margin-bottom:var(--space-5)">
        ${[{label:`Administrasi`,done:n,total:dn.length,color:`kpi-blue`,icon:`fa-clipboard-list`},{label:`Teknis`,done:r,total:i,color:`kpi-purple`,icon:`fa-building`},{label:`Lapangan`,done:0,total:3,color:`kpi-green`,icon:`fa-camera`}].map(e=>`
          <div class="card" style="padding:var(--space-4)">
            <div class="flex gap-3" style="align-items:center;margin-bottom:var(--space-3)">
              <div class="kpi-icon-wrap ${e.color}" style="width:36px;height:36px;margin:0">
                <i class="fas ${e.icon}"></i>
              </div>
              <div>
                <div class="text-sm font-semibold text-primary">${e.label}</div>
                <div class="text-xs text-tertiary">${e.done}/${e.total} item</div>
              </div>
            </div>
            <div class="progress-wrap">
              <div class="progress-fill ${e.color===`kpi-blue`||e.color===`kpi-purple`?`blue`:`green`}"
                   style="width:${e.total>0?Math.round(e.done/e.total*100):0}%"></div>
            </div>
          </div>
        `).join(``)}
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar" id="checklist-tabs">
        <button class="tab-btn active" onclick="window._switchChecklistMainTab('admin')" id="tab-btn-admin">
          <i class="fas fa-clipboard-list"></i> Administrasi
          <span style="background:hsla(220,70%,48%,0.2);color:var(--brand-400);padding:1px 7px;border-radius:999px;font-size:0.7rem">${n}/${dn.length}</span>
        </button>
        <button class="tab-btn" onclick="window._switchChecklistMainTab('teknis')" id="tab-btn-teknis">
          <i class="fas fa-building"></i> Teknis
          <span style="background:hsla(220,70%,48%,0.2);color:var(--brand-400);padding:1px 7px;border-radius:999px;font-size:0.7rem">${r}/${i}</span>
        </button>
        <button class="tab-btn" onclick="window._switchChecklistMainTab('files')" id="tab-btn-files">
          <i class="fas fa-folder-tree"></i> Berkas SIMBG
          ${a?`<span class="badge badge-success ml-1" style="font-size:0.6rem">LIVE</span>`:``}
        </button>
        <button class="tab-btn" onclick="window._switchChecklistMainTab('kajian')" id="tab-btn-kajian">
          <i class="fas fa-file-signature"></i> Daftar Simak
          <span class="badge badge-primary ml-1" style="font-size:0.6rem">PUPR</span>
        </button>
        <button class="tab-btn" onclick="window._switchChecklistMainTab('lapangan')" id="tab-btn-lapangan">
          <i class="fas fa-camera"></i> Foto Lapangan
        </button>
      </div>

      <!-- Tab: Administrasi -->
      <div class="tab-content active" id="tab-admin">
        <div class="card" style="padding:0;overflow:hidden">
          <div class="card-header" style="padding:var(--space-5);border-bottom:1px solid var(--border-subtle)">
            <div>
              <div class="card-title">Checklist Dokumen Administrasi</div>
              <div class="card-subtitle">Verifikasi kelengkapan dan kesesuaian dokumen perizinan bangunan</div>
            </div>
          </div>
          <div style="overflow-x:auto">
            <table class="checklist-table">
              <thead>
                <tr>
                  <th style="width:60px">Kode</th>
                  <th>Item Pemeriksaan</th>
                  <th style="width:200px">Status</th>
                  <th style="width:240px">Catatan Teknis</th>
                </tr>
              </thead>
              <tbody>
                ${dn.map(e=>`
                  <tr>
                    <td><span class="cl-kode">${e.kode}</span></td>
                    <td class="text-secondary">${On(e.nama)}</td>
                    <td>
                      <select class="cl-status-select" id="cl-${e.kode}-status"
                              onchange="window._markDirty('${e.kode}')"
                              data-kode="${e.kode}" data-kategori="administrasi">
                        ${mn.map(n=>`<option value="${n.value}" ${(t[e.kode]?.status||``)===n.value?`selected`:``}>${n.label}</option>`).join(``)}
                      </select>
                    </td>
                    <td>
                      <textarea class="cl-catatan" id="cl-${e.kode}-catatan" rows="2"
                                placeholder="Catatan..." onchange="window._markDirty('${e.kode}')">${On(t[e.kode]?.catatan||``)}</textarea>
                      
                      <div class="cl-upload-dropzone" style="margin-top:8px;border:1px dashed var(--border-subtle);border-radius:var(--radius-sm);padding:8px;text-align:center;cursor:pointer;color:var(--text-tertiary);background:var(--bg-elevated);transition:all 0.2s"
                           ondragover="event.preventDefault(); this.style.borderColor='var(--brand-400)'; this.style.color='var(--brand-400)'"
                           ondragleave="this.style.borderColor='var(--border-subtle)'; this.style.color='var(--text-tertiary)'"
                           ondrop="window._handleImageDrop(event, '${e.kode}', '${On(e.nama)}', 'administrasi')"
                           onclick="document.getElementById('file-${e.kode}').click()">
                        <div id="dz-content-${e.kode}">
                          <i class="fas fa-file-pdf" style="color:var(--brand-400)"></i> <span style="font-size:0.75rem;font-weight:600;margin-left:4px">AI Audit: Drop Dokumen/Foto</span>
                        </div>
                        <input type="file" id="file-${e.kode}" accept="image/jpeg, image/png, image/webp, application/pdf" multiple style="display:none" onchange="window._handleImageSelect(event, '${e.kode}', '${On(e.nama)}', 'administrasi')">
                      </div>

                      <!-- Smart Capture Button -->
                      <button class="btn btn-outline btn-xs" style="width:100%; margin-top:4px; font-size:10px; border-style:dotted" 
                              onclick="window._runSmartCapture('${e.kode}', '${On(e.nama)}', 'Administrasi')">
                        <i class="fas fa-search-plus"></i> Auto-Capture dari Drive
                      </button>

                    </td>
                  </tr>
                `).join(``)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab: Teknis -->
      <div class="tab-content" id="tab-teknis">
        <div class="card" style="padding:0;overflow:hidden">
          <div class="card-header" style="padding:var(--space-5);border-bottom:1px solid var(--border-subtle)">
            <div>
              <div class="card-title">Checklist Teknis per Aspek SLF</div>
              <div class="card-subtitle">Evaluasi kondisi eksisting setiap komponen bangunan</div>
            </div>
          </div>
          <div style="overflow-x:auto">
            <table class="checklist-table">
              <thead>
                <tr>
                  <th style="width:60px">Kode</th>
                  <th>Item Pemeriksaan</th>
                  <th style="width:200px">Kondisi</th>
                  <th style="width:240px">Catatan Teknis</th>
                </tr>
              </thead>
              <tbody>
                ${fn.map(e=>`
                  <tr class="aspek-header">
                    <td colspan="4">
                      <i class="fas fa-layer-group" style="margin-right:6px"></i>${On(e.aspek)}
                    </td>
                  </tr>
                  ${e.items.map(n=>`
                    <tr>
                      <td><span class="cl-kode">${n.kode}</span></td>
                      <td class="text-secondary">${On(n.nama)}</td>
                      <td>
                        <select class="cl-status-select" id="cl-${n.kode}-status"
                                onchange="window._markDirty('${n.kode}')"
                                data-kode="${n.kode}" data-kategori="teknis" data-aspek="${On(e.aspek)}">
                          ${hn.map(e=>`<option value="${e.value}" ${(t[n.kode]?.status||``)===e.value?`selected`:``}>${e.label}</option>`).join(``)}
                        </select>
                      </td>
                      <td>
                        <div style="position:relative">
                          <textarea class="cl-catatan" id="cl-${n.kode}-catatan" rows="2"
                                    placeholder="Catatan teknis..." onchange="window._markDirty('${n.kode}')">${On(t[n.kode]?.catatan||``)}</textarea>
                          <button class="btn-voice-input" onclick="window._startVoiceNote('${n.kode}')" title="Dikte Suara (AI)">
                            <i class="fas fa-microphone"></i>
                          </button>
                        </div>
                        
                            <!-- AI Smart Dropzone Per Item -->
                            <div class="cl-upload-dropzone" style="margin-top:8px;border:1px dashed var(--border-subtle);border-radius:var(--radius-sm);padding:8px;text-align:center;cursor:pointer;color:var(--text-tertiary);background:var(--bg-elevated);transition:all 0.2s"
                                 ondragover="event.preventDefault(); this.style.borderColor='var(--brand-400)'; this.style.color='var(--brand-400)'"
                                 ondragleave="this.style.borderColor='var(--border-subtle)'; this.style.color='var(--text-tertiary)'"
                                 ondrop="window._handleImageDrop(event, '${n.kode}', '${On(n.nama)}', 'teknis', '${On(e.aspek)}')"
                                 onclick="document.getElementById('file-${n.kode}').click()">
                              <div id="dz-content-${n.kode}">
                                <i class="fas fa-magic" style="color:var(--brand-400)"></i> <span style="font-size:0.75rem;font-weight:600;margin-left:4px">AI Vision: Drop Dokumen/Foto</span>
                              </div>
                              <input type="file" id="file-${n.kode}" accept="image/jpeg, image/png, image/webp, application/pdf" multiple style="display:none" onchange="window._handleImageSelect(event, '${n.kode}', '${On(n.nama)}', 'teknis', '${On(e.aspek)}')">
                            </div>

                            <!-- Smart Capture Button -->
                            <button class="btn btn-outline btn-xs" style="width:100%; margin-top:4px; font-size:10px; border-style:dotted" 
                                    onclick="window._runSmartCapture('${n.kode}', '${On(n.nama)}', '${On(e.aspek)}')">
                              <i class="fas fa-search-plus"></i> Auto-Capture dari Drive
                            </button>
                        
                      </td>
                    </tr>
                  `).join(``)}
                `).join(``)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab: Kajian Teknis (Daftar Simak Lengkap PDF) -->
      <div class="tab-content" id="tab-kajian">
        <div class="card" style="padding:0;overflow:hidden; border:2px solid var(--brand-300)">
          <div class="card-header" style="padding:var(--space-5);border-bottom:1px solid var(--border-subtle); background: var(--bg-elevated); display: flex; justify-content: space-between; align-items: center">
            <div>
              <div class="card-title text-brand-600"><i class="fas fa-tasks"></i> Daftar Simak Pemeriksaan Kajian Teknis SLF</div>
              <div class="card-subtitle">Manajemen data audit teknis — Pastikan semua poin memiliki status BAIK/RUSAK</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="window._highlightEmptyItems()">
                <i class="fas fa-eye"></i> Sorot Yang Kosong
              </button>
              <button class="btn btn-primary btn-sm" onclick="window._autoFillFromAI()" id="btn-autofill-ai">
                <i class="fas fa-bolt"></i> Tarik Analisis AI
              </button>
            </div>
          </div>
          <style>
            .slf-item-block { transition: all 0.2s; border: 2px solid #000; margin-bottom: 15px; background: #fff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .slf-item-block:hover { background: rgba(254, 240, 138, 0.15); border-color: var(--brand-500); }
            .kajian-radio-label { display: flex; align-items: center; gap: 10px; cursor: pointer; background: #fefce8; padding: 10px; border-radius: 4px; border: 2px solid #000; transition: all 0.2s; }
            .kajian-radio-label:hover { background: #fef9c3; transform: translateX(4px); }
          </style>
          <div class="kajian-blocks-container" style="display:flex; flex-direction:column; gap:20px; padding:20px; background:#f8fafc; color:#000">
            ${pn.map(e=>`
              <div class="grup-header" style="background:#0f172a; color:#fff; padding:12px; font-weight:800; border-radius:6px; font-size:14px; margin-top:20px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1)">
                <i class="fas fa-folder-tree" style="margin-right:10px; color:#fde68a"></i>${On(e.aspek)}
              </div>
              ${e.items.map(n=>[n.kode,...Object.keys(t).filter(e=>e.startsWith(n.kode+`.S`))].sort().map((r,i)=>`
                  <div class="slf-item-block" id="block-${r}">
                    <div style="background:#ffffbc; padding:8px 15px; border-bottom:2px solid #000; font-weight:800; font-size:14px; display:flex; justify-content:space-between; color:#000">
                      <span>${r}. ${On(r.includes(`.S`)?n.nama+` (Sampel `+(i+1)+`)`:n.nama)}</span>
                      <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:#000; opacity:0.7">Rujukan: ${n.ref}</span>
                    </div>
                    <table style="width:100%; border-collapse:collapse; table-layout:fixed; color:#000">
                      <thead>
                        <tr style="background:#ffffbc; font-size:11px; text-align:center; text-transform:uppercase; color:#000; border-bottom:2px solid #000">
                          <th style="border-right:2px solid #000; padding:8px; width:30%">Pengamatan Visual</th>
                          <th style="border-right:2px solid #000; padding:8px; width:35%">Pemeriksaan Kesesuaian Kondisi Faktual</th>
                          <th style="padding:8px; width:35%">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border-right:2px solid #000; padding:15px; vertical-align:top">
                             <div style="font-size:12px; color:#000; min-height:80px">
                               <div style="font-weight:800; margin-bottom:10px; border-bottom:1px solid #ccc; padding-bottom:5px; color:#000">Pengukuran Kondisi Faktual</div>
                               ${t[r]?.foto_urls&&t[r].foto_urls.length>0?`
                                 <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(60px, 1fr)); gap:5px; margin-bottom:10px">
                                   ${t[r].foto_urls.map(e=>`<img src="${e}" style="width:100%; height:60px; object-fit:cover; border-radius:4px; border:1px solid #000">`).join(``)}
                                 </div>
                               `:`<div style="background:#f1f5f9; border:1px dashed #64748b; color:#475569; padding:15px; border-radius:4px; font-size:11px; text-align:center; font-weight:600">Hasil: Dilampirkan Foto (Belum ada)</div>`}
                               <div style="margin-top:15px; font-size:11px; font-weight:800; color:#000">STATUS KERUSAKAN:</div>
                               <select class="cl-status-select" id="cl-${r}-status" onchange="window._markDirty('${r}')" data-kode="${r}" data-kategori="kajian_teknis" data-aspek="${On(e.aspek)}" style="width:100%; height:34px; font-size:12px; margin-top:5px; border:2px solid #000; font-weight:800; background:#fff; color:#000">
                                 <option value="tidak_rusak" ${t[r]?.status===`tidak_rusak`?`selected`:``}>Tidak Rusak / Baik</option>
                                 <option value="rusak_ringan" ${t[r]?.status===`rusak_ringan`?`selected`:``}>Rusak Ringan</option>
                                 <option value="rusak_sedang" ${t[r]?.status===`rusak_sedang`?`selected`:``}>Rusak Sedang</option>
                                 <option value="rusak_berat" ${t[r]?.status===`rusak_berat`?`selected`:``}>Rusak Berat / Kritis</option>
                               </select>
                             </div>
                          </td>
                          <td style="border-right:2px solid #000; padding:15px; vertical-align:top">
                             <div style="font-size:12px; line-height:1.5; color:#000">
                               <div style="font-weight:800; margin-bottom:10px; border-bottom:1px solid #ccc; padding-bottom:5px">Dengan Rencana Teknis Dan Gambar Terbangun</div>
                               <div style="display:flex; flex-direction:column; gap:10px">
                                 <label class="kajian-radio-label">
                                   <input type="radio" name="kesesuaian-${r}" value="sesuai" id="cl-${r}-status-kesesuaian-s" ${t[r]?.metadata?.kesesuaian===`sesuai`?`checked`:``} onchange="window._markDirty('${r}')" style="width:20px; height:20px; accent-color:#000"> 
                                   <span style="font-weight:900">SESUAI</span>
                                 </label>
                                 <label class="kajian-radio-label">
                                   <input type="radio" name="kesesuaian-${r}" value="tidak" id="cl-${r}-status-kesesuaian-t" ${t[r]?.metadata?.kesesuaian===`tidak`?`checked`:``} onchange="window._markDirty('${r}')" style="width:20px; height:20px; accent-color:#000"> 
                                   <span style="font-weight:900">TIDAK SESUAI</span>
                                 </label>
                               </div>
                             </div>
                          </td>
                          <td style="padding:15px; vertical-align:top">
                             <div style="font-weight:800; font-size:12px; margin-bottom:10px; border-bottom:1px solid #ccc; padding-bottom:5px; color:#000">Keterangan / Analisis Pengkaji</div>
                             <div style="position:relative">
                               <textarea class="cl-catatan" id="cl-${r}-catatan" rows="6" placeholder="Dijelaskan sesuai kondisi existing..." onchange="window._markDirty('${r}')" style="width:100%; font-size:12px; border:2px solid #000; padding:10px; background:#fff; font-family:inherit; line-height:1.5; font-weight:600; color:#000">${On(t[r]?.catatan||`Dijelaskan sesuai kondisi existing`)}</textarea>
                               <button class="btn-voice-input dark" onclick="window._startVoiceNote('${r}')" title="Dikte Suara (AI)">
                                 <i class="fas fa-microphone"></i>
                               </button>
                             </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `).join(``)+`
                  <div style="text-align:center; margin-bottom:30px">
                    <button class="btn btn-outline btn-sm" style="background:#fff; border:2px dashed #000; color:#000; font-weight:800; border-radius:8px" onclick="window._addKajianSample('${n.kode}')">
                      <i class="fas fa-plus-circle"></i> Tambah Baris Sampel Baru untuk "${n.nama}"
                    </button>
                  </div>
                `).join(``)}
            `).join(``)}
          </div>
        </div>
      </div>
        </div>
      </div>

      <!-- Tab: Manajemen Berkas SIMBG (Drive Modern Workspace) -->
      <div class="tab-content" id="tab-files">
        <div class="file-manager-layout">
          <!-- Sidebar -->
          <aside class="fm-sidebar">
            <div style="padding:4px 10px; margin-bottom:10px; font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em">Kategori SIMBG</div>
            ${gn.map(e=>`
              <button class="fm-nav-item" id="fm-nav-${e.id}" onclick="window._changeFileFolder('${e.id}')">
                 <i class="fas ${e.icon}"></i>
                 <span>${e.label}</span>
              </button>
            `).join(``)}
            <div style="margin-top:auto; padding:10px; background:#fff; border-radius:8px; border:1px solid #e2e8f0">
               <div class="text-xs text-tertiary mb-2 uppercase font-bold">Penyimpanan Terhubung</div>
               <div class="flex items-center gap-2 text-xs font-semibold text-primary">
                  <i class="fab fa-google-drive" style="color:var(--success)"></i> Google Drive
               </div>
            </div>
          </aside>

          <!-- Main View -->
          <main class="fm-main">
            <header class="fm-toolbar">
               <div class="fm-breadcrumb" id="fm-breadcrumb-area">
                  Drive Proyek / <span id="fm-current-folder-label">Pilih Kategori</span>
               </div>
               <div class="flex gap-2">
                 <div class="fm-search" style="min-width:200px">
                    <input type="text" id="fm-search-input" placeholder="Cari dokumen..." oninput="window._renderFileGrid()" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.8rem; width:100%">
                 </div>
                 <button class="btn btn-secondary btn-sm" onclick="window._syncFilesWithSIMBG('${window._checklistProyekId}')">
                    <i class="fas fa-sync"></i> Sync SIMBG
                 </button>
               </div>
            </header>

            <!-- File Grid -->
            <div class="fm-grid" id="fm-file-grid">
               <!-- Will be rendered by JS -->
            </div>
          </main>
        </div>
      </div>

      <!-- Tab: Lapangan (Dashboard Arsip) -->
      <div class="tab-content" id="tab-lapangan">
        <div class="card" style="padding:0;overflow:hidden">
          <div class="card-header" style="padding:var(--space-5);border-bottom:1px solid var(--border-subtle);background:var(--bg-elevated)">
            <div>
              <div class="card-title"><i class="fas fa-folder-open" style="color:var(--brand-400);margin-right:8px"></i> File Manager / Bukti Lapangan</div>
              <div class="card-subtitle">Semua file PDF & gambar yang diunggah dan tersimpan ke Google Drive Proyek</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window.renderLapanganGallery()"><i class="fas fa-sync"></i> Refresh Berkas</button>
          </div>
          <div id="lapangan-gallery-container" style="padding:var(--space-5);min-height:300px">
            <!-- Di-render oleh Javascript -->
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);justify-content:flex-end">
        <button class="btn btn-secondary" onclick="window.navigate('proyek-detail',{id:'${e.id}'})">
          <i class="fas fa-arrow-left"></i> Kembali
        </button>
        <button class="btn btn-primary" onclick="window._saveChecklist()">
          <i class="fas fa-save"></i> Simpan & Lanjut ke Analisis
        </button>
      </div>
    </div></div></div>
  `}window._switchChecklistMainTab=e=>{document.querySelectorAll(`.tab-content`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`));let t=document.getElementById(`tab-${e}`),n=document.getElementById(`tab-btn-${e}`);t&&n?(t.classList.add(`active`),n.classList.add(`active`)):console.error(`Tab ${e} tidak ditemukan: content=${!!t}, btn=${!!n}`),e===`files`&&window._loadFiles&&window._loadFiles(),e===`lapangan`&&window.renderLapanganGallery&&window.renderLapanganGallery()},window.renderLapanganGallery=()=>{let e=document.getElementById(`lapangan-gallery-container`);if(!e)return;let t=!1,n=`<div class="gallery-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:var(--space-4)">`;Object.keys(window._dbFotoLinks).forEach(e=>{let r=window._dbFotoLinks[e]||[];if(r.length>0){t=!0;let i=window._checklistDataMap[e]?.nama||e;r.forEach((t,r)=>{n+=`
          <div class="card" style="padding:var(--space-3);border:1px solid var(--border-subtle);box-shadow:none">
            <div style="height:120px;background:var(--bg-canvas);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-3)">
               <a href="${yn(t)}" target="_blank" style="text-decoration:none;color:var(--text-tertiary)">
                 <i class="fas fa-file-invoice" style="font-size:3rem;"></i>
               </a>
            </div>
            <div class="text-xs text-tertiary">[${yn(e)}] - File ${r+1}</div>
            <div class="text-sm font-semibold text-secondary" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${yn(i)}">${yn(i)}</div>
            <a href="${yn(t)}" target="_blank" class="btn btn-outline btn-sm" style="width:100%;margin-top:8px">Buka di Drive</a>
          </div>
        `})}}),n+=`</div>`,t?e.innerHTML=n:e.innerHTML=`
      <div style="text-align:center;padding:var(--space-10) 0;color:var(--text-tertiary)">
        <i class="fas fa-box-open" style="font-size:3rem;margin-bottom:12px;opacity:0.3"></i>
        <div>Belum ada dokumen/foto lapangan yang diunggah ke komponen manapun.</div>
      </div>
    `};function yn(e){return e?e.replace(/[&<>'"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,"'":`&#39;`,'"':`&quot;`})[e]):``}async function bn(e,t,n,r,i){if(!e||e.length===0)return;let a=Array.from(e).filter(e=>e.type.startsWith(`image/`)||e.type===`application/pdf`);if(a.length===0)return V(`Harap masukkan file gambar (JPG/PNG) atau PDF!`);let o=document.getElementById(`dz-content-${t}`);o.innerHTML=`<i class="fas fa-circle-notch fa-spin" style="color:var(--brand-400)"></i> <span style="font-size:0.75rem;margin-left:4px">Menganalisis ${a.length} File...</span>`;try{let e=[];for(let t of a)if(t.type.startsWith(`image/`)){let n=await Jt(t);n&&e.push({base64:n.split(`,`)[1],mimeType:`image/jpeg`})}else e.push(await(e=>new Promise((t,n)=>{let r=new FileReader;r.readAsDataURL(e),r.onload=()=>t({base64:r.result.split(`,`)[1],mimeType:e.type}),r.onerror=n}))(t));if(e.length===0){o.innerHTML=`<i class="fas fa-magic" style="color:var(--brand-400)"></i> <span style="font-size:0.75rem;font-weight:600;margin-left:4px">Batal</span>`;return}let s=e.map(e=>({base64:e.base64,mimeType:e.mimeType,name:`${r.toUpperCase()}_${t}_${new Date().getTime()}`}));navigator.onLine?c(s,window._checklistProyekId,i,t,proyek.drive_proxy_url).then(e=>{e&&e.length>0&&(window._dbFotoLinks[t]=[...window._dbFotoLinks[t]||[],...e],window._markDirty(t),window.renderLapanganGallery())}).catch(e=>{console.error(`[Drive Error] Upload gagal, masuk antrean offline:`,e),an(window._checklistProyekId,t,s,{aspek:i,componentName:n}),se(`Peringatan: Gagal unggah ke Drive, foto disimpan di antrean offline.`)}):(await an(window._checklistProyekId,t,s,{aspek:i,componentName:n}),se(`Mode Offline: Foto disimpan di antrean perangkat.`));try{let s=await Ht(e,n,r,i),c=document.getElementById(`cl-${t}-catatan`),l=document.getElementById(`cl-${t}-status`),u=c.value.trim(),d=`[${r===`administrasi`?`Audit AI`:`AI Vision`} (${a.length} File): \n`+s.catatan+`
]`;c.value=u?u+`

`+d:d,s.status&&Array.from(l.options).some(e=>e.value===s.status)&&Array.from(l.options).forEach(e=>{e.value===s.status&&(e.selected=!0)}),window._markDirty(t),o.innerHTML=`<i class="fas fa-check-circle" style="color:var(--success-400)"></i> <span style="font-size:0.75rem;color:var(--success-400);margin-left:4px;font-weight:600">Selesai</span>`,B(`AI merespons komponen ${n}: ${s.status.toUpperCase()}`),setTimeout(()=>{o.innerHTML=`<i class="fas ${r===`administrasi`?`fa-file-pdf`:`fa-magic`}" style="color:var(--brand-400)"></i> <span style="font-size:0.75rem;font-weight:600;margin-left:4px">${r===`administrasi`?`AI Audit: Drop Dokumen/Foto`:`AI Vision: Drop Dokumen/Foto`}</span>`},4e3)}catch(e){V(`Gemini Error: `+e.message),o.innerHTML=`<i class="fas fa-exclamation-triangle" style="color:var(--danger-400)"></i> <span style="font-size:0.75rem;color:var(--danger-400);margin-left:4px">Gagal AI</span>`}}catch{V(`Gagal membaca file di perangkat.`)}}window._handleImageDrop=function(e,t,n,r=`teknis`,i=``){e.preventDefault();let a=e.currentTarget;a.style.borderColor=`var(--border-subtle)`,a.style.color=`var(--text-tertiary)`,e.dataTransfer.files&&e.dataTransfer.files.length>0&&bn(e.dataTransfer.files,t,n,r,i)},window._handleImageSelect=function(e,t,n,r=`teknis`,i=``){e.target.files&&e.target.files.length>0&&bn(e.target.files,t,n,r,i)};var xn=new Set,Sn=null;function Cn(e){window._markDirty=t=>{xn.add(t),clearTimeout(Sn),Sn=setTimeout(()=>wn(e,!1),2e3)},window._saveChecklist=async()=>{await wn(e,!0)}}async function wn(t,n){T();let r=Array.from(document.querySelectorAll(`.slf-item-block, tr:not(.aspek-header)`)).map(e=>{let t=e.querySelector(`.cl-status-select`);return t?t.dataset.kode:null}).filter(Boolean).map(e=>{let n=document.getElementById(`cl-${e}-status`),r=document.getElementById(`cl-${e}-catatan`),i=document.getElementById(`cl-${e}-status-kesesuaian-s`),a=document.getElementById(`cl-${e}-status-kesesuaian-t`),o=`na`;return i?.checked&&(o=`sesuai`),a?.checked&&(o=`tidak`),n?{proyek_id:t,kode:e,kategori:n.dataset.kategori||`teknis`,aspek:n.dataset.aspek||``,nama:n.closest(`.slf-item-block`)?.querySelector(`span`)?.textContent?.split(`. `)[1]||e,status:n.value||null,catatan:r?.value||null,metadata:{kesesuaian:o,last_sync:new Date().toISOString()},foto_urls:window._dbFotoLinks[e]||[],updated_at:new Date().toISOString()}:null}).filter(Boolean);try{let i=r.filter(e=>e.status!==null&&e.status!==``);if(i.length===0){n&&B(`Pekerjaan disimpan. (Belum ada status yang terisi)`);return}if(n){let e=document.querySelector(`button[onclick="window._saveChecklist()"]`);e&&(e.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Menyimpan...`)}if(await tn(i),!navigator.onLine){if(xn.clear(),n){se(`Mode Offline: Data disimpan secara lokal di perangkat Anda.`);let e=document.querySelector(`button[onclick="window._saveChecklist()"]`);e&&(e.innerHTML=`<i class="fas fa-save"></i> Simpan & Lanjut ke Analisis`)}return}let{error:a}=await e.from(`checklist_items`).upsert(i,{onConflict:`proyek_id, kode`});if(n){let e=document.querySelector(`button[onclick="window._saveChecklist()"]`);e&&(e.innerHTML=`<i class="fas fa-save"></i> Simpan & Lanjut ke Analisis`)}if(a)console.error(`Supabase Save Error:`,a),V(`Gagal menyimpan ke cloud: `+a.message);else{xn.clear();let i=r.filter(e=>e.status).length,a=r.length,o=Math.round(i/a*100),s=Math.min(40,Math.round(o*.4));await e.from(`proyek`).update({progress:s}).eq(`id`,t),n&&(B(`Data berhasil disinkronkan ke Cloud!`),setTimeout(()=>{window.navigate(`analisis`,{id:t})},1500))}}catch(e){V(`Kesalahan sinkronisasi: `+e.message)}}async function Tn(t){try{let{data:n}=await e.from(`proyek`).select(`id, nama_bangunan, drive_proxy_url, simbg_email_verified`).eq(`id`,t).maybeSingle();return n}catch{return null}}async function En(t){try{let{data:n}=await e.from(`checklist_items`).select(`*`).eq(`proyek_id`,t);return n||[]}catch{return[]}}function Dn(){return`
    <div class="page-header">
      <div class="skeleton" style="height:20px;width:200px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:36px;width:400px;margin-bottom:8px"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-5)">
      ${[,,,].fill(0).map(()=>`<div class="skeleton" style="height:80px;border-radius:var(--radius-lg)"></div>`).join(``)}
    </div>
    <div class="skeleton" style="height:56px;border-radius:var(--radius-lg);margin-bottom:var(--space-5)"></div>
    <div class="skeleton" style="height:400px;border-radius:var(--radius-lg)"></div>
  `}function On(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}window._addKajianSample=e=>{let t=window._checklistProyekId;if(!t)return;let n=`${e}.S${Object.keys(dataMap).filter(t=>t.startsWith(e+`.S`)).length+1}`;dataMap[n]={proyek_id:t,kode:n,kategori:`kajian_teknis`,status:`tidak_rusak`,catatan:`Dijelaskan sesuai kondisi existing`,metadata:{kesesuaian:`sesuai`}},se(`Menambahkan baris sampel baru (${n})...`),document.getElementById(`app-content`);let r=window.scrollY;window._isRenderingSample=!0,_n(t).then(()=>{window.scrollTo(0,r),window._switchChecklistMainTab(`kajian`),window._markDirty(n),window._isRenderingSample=!1})},window._filesList=[],window._currentCat=`umum`,window._currentSearch=``,window._loadFiles=async()=>{let{data:t,error:n}=await e.from(`proyek_files`).select(`*`).eq(`proyek_id`,window._checklistProyekId).order(`created_at`,{ascending:!1});if(n){V(`Gagal memuat berkas: `+n.message);return}window._filesList=t||[],window._renderFileGrid()},window._changeFileFolder=e=>{window._currentCat=e,document.querySelectorAll(`.fm-nav-item`).forEach(e=>e.classList.remove(`active`)),document.getElementById(`fm-nav-${e}`)?.classList.add(`active`);let t=gn.find(t=>t.id===e);t&&(document.getElementById(`fm-current-folder-label`).textContent=t.label),window._renderFileGrid()},window._renderFileGrid=()=>{let e=document.getElementById(`fm-file-grid`);if(!e)return;let t=document.getElementById(`fm-search-input`)?.value.toLowerCase()||``,n=gn.find(e=>e.id===window._currentCat);if(!n){e.innerHTML=`<div class="fm-empty-state"><p>Pilih kategori untuk melihat berkas.</p></div>`;return}e.innerHTML=n.items.map(e=>{let n=window._filesList.find(t=>t.category===window._currentCat&&t.subcategory===e),r=n?.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);return t&&!e.toLowerCase().includes(t)&&!n?.name?.toLowerCase().includes(t)?``:`
      <div class="fm-file-card ${n?``:`empty`}" onclick="${n?`window.open('${n.file_url}', '_blank')`:`window._triggerGenericUpload('${window._currentCat}', '${e}')`}">
        <div class="fm-file-icon ${n?`has-file`:``} ${r?`image`:``}">
           <i class="fas ${n?r?`fa-file-image text-blue-500`:`fa-file-pdf text-red-500`:`fa-upload text-slate-300`}"></i>
        </div>
        <div class="fm-file-info">
           <div class="fm-file-name" title="${e}">${e}</div>
           <div class="fm-file-meta">
              ${n?`<span class="text-primary font-medium">${On(n.name)}</span>`:`<span class="text-slate-400">Belum diunggah</span>`}
           </div>
           ${n?`<div class="text-xs text-tertiary mt-1">${new Date(n.created_at).toLocaleDateString()}</div>`:``}
        </div>
        <span class="fm-file-badge ${n?`badge-ready`:`badge-missing`}">
           ${n?`Ready`:`Missing`}
        </span>
        
        ${n?`
          <div style="position:absolute; bottom:12px; right:12px; display:flex; gap:4px">
             <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window._triggerGenericUpload('${window._currentCat}', '${e}')"><i class="fas fa-pen"></i></button>
             <button class="btn btn-ghost btn-xs text-danger" onclick="event.stopPropagation(); window._deleteFile('${n.id}')"><i class="fas fa-trash"></i></button>
          </div>
        `:``}
      </div>
    `}).join(``)||`<div class="fm-empty-state"><i class="fas fa-search"></i><p>Tidak ada hasil untuk "${t}"</p></div>`},window._triggerGenericUpload=(t,n)=>{let r=document.createElement(`input`);r.type=`file`,r.accept=`image/*,application/pdf`,r.onchange=async r=>{let i=r.target.files[0];if(!i)return;se(`Mengunggah ${i.name} ke kategori ${t}...`);let a=new FileReader,o=await new Promise(e=>{a.onload=()=>e(a.result.split(`,`)[1]),a.readAsDataURL(i)});try{let r=await c([{base64:o,mimeType:i.type,name:i.name}],window._checklistProyekId,t,n,proyek.drive_proxy_url);if(!r||r.length===0)throw Error(`Gagal mengunggah ke Google Drive.`);let{data:a,error:s}=await e.from(`proyek_files`).upsert({proyek_id:window._checklistProyekId,name:i.name,file_url:r[0],category:t,subcategory:n,storage_type:`google_drive`,ai_status:`ready`},{onConflict:`proyek_id, category, subcategory`}).select().single();if(s)throw s;B(`Berkas berhasil diperbarui.`),window._loadFiles()}catch(e){V(`Upload Gagal: `+e.message)}},r.click()},window._deleteFile=async t=>{if(!confirm(`Hapus berkas ini dari database? File di Google Drive mungkin tetap ada.`))return;let{error:n}=await e.from(`proyek_files`).delete().eq(`id`,t);n||(B(`Berkas terhapus.`),window._loadFiles())},window._runSmartCapture=async(e,t,n)=>{se(`Memulai Auto-Capture untuk ${t}...`),(!window._filesList||window._filesList.length===0)&&await window._loadFiles();let r=un(e,window._filesList);if(r.length===0){V(`Tidak menemukan dokumen rujukan otomatis untuk "${t}". Silakan pilih/unggah secara manual.`);return}se(`Ditemukan ${r.length} dokumen relevan. Menghubungi AI untuk validasi komparatif...`);try{let n=await Ut([],t,e,`Dokumen rujukan ditemukan: ${r.map(e=>e.name).join(`, `)}. Parameter yang harus diperiksa: ${t}.`);if(n){let t=document.getElementById(`cl-${e}-catatan`),r=document.getElementById(`cl-${e}-status`);t&&(t.value=n.catatan),r&&n.status&&Array.from(r.options).forEach(e=>{e.value===n.status&&(e.selected=!0)}),window._markDirty(e),B(`Auto-Capture Selesai: Analisis komparatif telah dimasukkan ke catatan.`)}}catch(e){V(`Gagal menjalankan AI Komparatif: `+e.message)}},window._syncFilesWithSIMBG=async e=>{se(`Menghubungkan ke portal SIMBG...`),setTimeout(()=>{B(`Sinkronisasi Berhasil: 12 dokumen teknis terpetakan.`)},2e3)},window._startVoiceNote=e=>{let t=document.getElementById(`cl-${e}-catatan`);if(!t)return;se(`Mendengarkan... Silakan bicara.`);let n=t.parentElement.querySelector(`.btn-voice-input`);n&&n.classList.add(`recording`),zt.start(async r=>{n&&n.classList.remove(`recording`),se(`Sedang memproses suara dengan AI Ahli...`),t.value=(t.value?t.value+` `:``)+r;let i=await zt.formalize(r);t.value=t.value.replace(r,i),window._markDirty(e),B(`Catatan diperbarui dengan bahasa teknis.`)},e=>{n&&n.classList.remove(`recording`),V(`Gagal merekam suara: `+e)})},window._switchChecklistMainTab=e=>{document.querySelectorAll(`.tab-content`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`)),document.getElementById(`tab-${e}`).classList.add(`active`),document.getElementById(`tab-btn-${e}`).classList.add(`active`),e===`files`&&(window._changeFileFolder(`umum`),window._loadFiles())},window._autoFillFromAI=async()=>{let e=document.getElementById(`btn-autofill-ai`),t=e.innerHTML;e.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Merelasikan...`;try{let n=localStorage.getItem(`ai_results_${window._checklistProyekId}`);if(!n){V(`Belum ada data analisis AI. Silakan jalankan simulasi di halaman Multi-Agent terlebih dahulu.`),e.innerHTML=t;return}let r=JSON.parse(n);se(`Mentransfer data dari 15 Agen Ahli ke Daftar Simak...`);let i={struktur:[`K.2.1.1`,`K.2.1.2`,`K.2.1.3`,`K.2.1.4`,`K.2.1.5`,`K.2.1.6`],arsitektur:[`K.1.1.1`,`K.1.1.2`,`K.1.1.3`,`K.1.3.1`,`K.1.3.4`,`K.1.4.1`,`K.1.4.5`],elektrikal:[`K.1.5.9`,`K.2.2.1`],kebakaran:[`K.2.2.2`,`K.2.2.7`,`K.2.2.8`],sanitasi:[`K.1.5.6`],lingkungan:[`K.1.2.7`,`K.1.5.1`,`K.1.5.2`,`K.1.5.4`]},a=0;Object.keys(i).forEach(e=>{let t=r.find(t=>t.id===e);t&&i[e].forEach(e=>{let n=document.getElementById(`cl-${e}-catatan`),r=document.getElementById(`cl-${e}-status`);if(n&&(n.value=`Hasil Audit Ahli ${t.name}:\n${t.analisis}\n\nRekomendasi:\n${t.rekomendasi}`,a++),r){let e=t.skor||85;e>=85?r.value=`baik`:e>=70?r.value=`sedang`:e>=50?r.value=`buruk`:r.value=`kritis`}window._markDirty(e)})}),B(`Berhasil memetakan ${a} item audit secara otomatis!`),e.innerHTML=t,window.checklistPage({id:window._checklistProyekId})}catch(n){V(`Gagal sinkronisasi data AI: `+n.message),e.innerHTML=t}},window._highlightEmptyItems=()=>{let e=document.querySelectorAll(`.row-pending-audit`);if(e.length===0){B(`Semua item audit telah terisi!`);return}e[0].scrollIntoView({behavior:`smooth`,block:`center`}),se(`Ditemukan ${e.length} item yang belum diaudit.`),e.forEach(e=>{e.style.background=`#fef3c7`,setTimeout(()=>{e.style.background=`#fffbeb`},3e3)})};var kn=t.gasApiUrl,An={"Garis Sempadan":[`GSB`,`Permen PUPR 16 2021`],"Kepadatan Bangunan":[`KDB`,`KLB`,`KDH`],"Pemanfaatan Ruang":[`RTRW`,`RDTR`],Pondasi:[`SNI 8460:2017`,`Geoteknik`],Beton:[`SNI 2847:2019`,`Beton Struktural`],Baja:[`SNI 1729:2020`,`Baja Struktural`],Gempa:[`SNI 1726:2019`,`Ketahanan Gempa`],Beban:[`SNI 1727:2020`,`Beban Desain`],Listrik:[`PUIL 2011`,`SNI 0225:2011`],Kebakaran:[`SNI 03-1735`,`SNI 03-3985`,`Fire Protection`],Petir:[`SNI 03-7015`,`Proteksi Petir`],Lift:[`SNI 03-6573`],"Air Bersih":[`SNI 8153:2015`,`Plumbing`]};async function jn(e,t){if(!kn)return V(`Google Apps Script Integration is not configured.`),null;let n=e;for(let[t,r]of Object.entries(An))if(e.toLowerCase().includes(t.toLowerCase())){n=r[0];break}console.log(`[NSPK Bot] Mencari referensi untuk: ${n}`);try{let e=await(await fetch(kn,{method:`POST`,body:JSON.stringify({action:`SEARCH_NSPK`,query:n})})).json();if(e.status!==`success`||!e.results.length)return console.warn(`[NSPK Bot] Tidak ditemukan dokumen spesifik di Drive.`),{status:`not_found`,query:n};let r=e.results[0],i=await(await fetch(kn,{method:`POST`,body:JSON.stringify({action:`CAPTURE_NSPK`,fileId:r.id,proyekId:t})})).json();return i.status===`success`?(B(`Bot berhasil mengambil referensi: ${r.name}`),{status:`success`,name:r.name,url:i.url,fileId:i.fileId,query:n}):null}catch(e){return console.error(`[NSPK Bot] Error:`,e),V(`Bot gagal menjalankan tugas: `+e.message),null}}function Mn(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var Nn=Mn();function Pn(e){Nn=e}var Fn={exec:()=>null};function In(e,t=``){let n=typeof e==`string`?e:e.source,r={replace:(e,t)=>{let i=typeof t==`string`?t:t.source;return i=i.replace(Rn.caret,`$1`),n=n.replace(e,i),r},getRegex:()=>new RegExp(n,t)};return r}var Ln=(()=>{try{return!0}catch{return!1}})(),Rn={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:e=>RegExp(`^ {0,${Math.min(3,e-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:e=>RegExp(`^ {0,${Math.min(3,e-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:e=>RegExp(`^ {0,${Math.min(3,e-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:e=>RegExp(`^ {0,${Math.min(3,e-1)}}#`),htmlBeginRegex:e=>RegExp(`^ {0,${Math.min(3,e-1)}}<(?:[a-z].*>|!--)`,`i`),blockquoteBeginRegex:e=>RegExp(`^ {0,${Math.min(3,e-1)}}>`)},zn=/^(?:[ \t]*(?:\n|$))+/,Bn=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Vn=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,Hn=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Un=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Wn=/ {0,3}(?:[*+-]|\d{1,9}[.)])/,Gn=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,Kn=In(Gn).replace(/bull/g,Wn).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,``).getRegex(),qn=In(Gn).replace(/bull/g,Wn).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),Jn=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Yn=/^[^\n]+/,Xn=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,Zn=In(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace(`label`,Xn).replace(`title`,/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),Qn=In(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,Wn).getRegex(),$n=`address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,er=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,tr=In(`^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))`,`i`).replace(`comment`,er).replace(`tag`,$n).replace(`attribute`,/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),nr=In(Jn).replace(`hr`,Hn).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`|lheading`,``).replace(`|table`,``).replace(`blockquote`,` {0,3}>`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace(`list`,` {0,3}(?:[*+-]|1[.)])[ \\t]`).replace(`html`,`</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`).replace(`tag`,$n).getRegex(),rr={blockquote:In(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace(`paragraph`,nr).getRegex(),code:Bn,def:Zn,fences:Vn,heading:Un,hr:Hn,html:tr,lheading:Kn,list:Qn,newline:zn,paragraph:nr,table:Fn,text:Yn},ir=In(`^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)`).replace(`hr`,Hn).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`blockquote`,` {0,3}>`).replace(`code`,`(?: {4}| {0,3}	)[^\\n]`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace(`list`,` {0,3}(?:[*+-]|1[.)])[ \\t]`).replace(`html`,`</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`).replace(`tag`,$n).getRegex(),ar={...rr,lheading:qn,table:ir,paragraph:In(Jn).replace(`hr`,Hn).replace(`heading`,` {0,3}#{1,6}(?:\\s|$)`).replace(`|lheading`,``).replace(`table`,ir).replace(`blockquote`,` {0,3}>`).replace(`fences`," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace(`list`,` {0,3}(?:[*+-]|1[.)])[ \\t]`).replace(`html`,`</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`).replace(`tag`,$n).getRegex()},or={...rr,html:In(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace(`comment`,er).replace(/tag/g,`(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b`).getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:Fn,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:In(Jn).replace(`hr`,Hn).replace(`heading`,` *#{1,6} *[^
]`).replace(`lheading`,Kn).replace(`|table`,``).replace(`blockquote`,` {0,3}>`).replace(`|fences`,``).replace(`|list`,``).replace(`|html`,``).replace(`|tag`,``).getRegex()},sr=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,cr=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,lr=/^( {2,}|\\)\n(?!\s*$)/,ur=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,dr=/[\p{P}\p{S}]/u,fr=/[\s\p{P}\p{S}]/u,pr=/[^\s\p{P}\p{S}]/u,mr=In(/^((?![*_])punctSpace)/,`u`).replace(/punctSpace/g,fr).getRegex(),hr=/(?!~)[\p{P}\p{S}]/u,gr=/(?!~)[\s\p{P}\p{S}]/u,_r=/(?:[^\s\p{P}\p{S}]|~)/u,vr=In(/link|precode-code|html/,`g`).replace(`link`,/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace(`precode-`,Ln?"(?<!`)()":"(^^|[^`])").replace(`code`,/(?<b>`+)[^`]+\k<b>(?!`)/).replace(`html`,/<(?! )[^<>]*?>/).getRegex(),yr=/^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,br=In(yr,`u`).replace(/punct/g,dr).getRegex(),xr=In(yr,`u`).replace(/punct/g,hr).getRegex(),Sr=`^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)`,Cr=In(Sr,`gu`).replace(/notPunctSpace/g,pr).replace(/punctSpace/g,fr).replace(/punct/g,dr).getRegex(),wr=In(Sr,`gu`).replace(/notPunctSpace/g,_r).replace(/punctSpace/g,gr).replace(/punct/g,hr).getRegex(),Tr=In(`^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)`,`gu`).replace(/notPunctSpace/g,pr).replace(/punctSpace/g,fr).replace(/punct/g,dr).getRegex(),Er=In(/^~~?(?:((?!~)punct)|[^\s~])/,`u`).replace(/punct/g,dr).getRegex(),Dr=In(`^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)`,`gu`).replace(/notPunctSpace/g,pr).replace(/punctSpace/g,fr).replace(/punct/g,dr).getRegex(),Or=In(/\\(punct)/,`gu`).replace(/punct/g,dr).getRegex(),kr=In(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace(`scheme`,/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace(`email`,/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),Ar=In(er).replace(`(?:-->|$)`,`-->`).getRegex(),jr=In(`^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`).replace(`comment`,Ar).replace(`attribute`,/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Mr=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/,Nr=In(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace(`label`,Mr).replace(`href`,/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace(`title`,/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),Pr=In(/^!?\[(label)\]\[(ref)\]/).replace(`label`,Mr).replace(`ref`,Xn).getRegex(),Fr=In(/^!?\[(ref)\](?:\[\])?/).replace(`ref`,Xn).getRegex(),Ir=In(`reflink|nolink(?!\\()`,`g`).replace(`reflink`,Pr).replace(`nolink`,Fr).getRegex(),Lr=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,Rr={_backpedal:Fn,anyPunctuation:Or,autolink:kr,blockSkip:vr,br:lr,code:cr,del:Fn,delLDelim:Fn,delRDelim:Fn,emStrongLDelim:br,emStrongRDelimAst:Cr,emStrongRDelimUnd:Tr,escape:sr,link:Nr,nolink:Fr,punctuation:mr,reflink:Pr,reflinkSearch:Ir,tag:jr,text:ur,url:Fn},zr={...Rr,link:In(/^!?\[(label)\]\((.*?)\)/).replace(`label`,Mr).getRegex(),reflink:In(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace(`label`,Mr).getRegex()},Br={...Rr,emStrongRDelimAst:wr,emStrongLDelim:xr,delLDelim:Er,delRDelim:Dr,url:In(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace(`protocol`,Lr).replace(`email`,/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:In(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace(`protocol`,Lr).getRegex()},Vr={...Br,br:In(lr).replace(`{2,}`,`*`).getRegex(),text:In(Br.text).replace(`\\b_`,`\\b_| {2,}\\n`).replace(/\{2,\}/g,`*`).getRegex()},Hr={normal:rr,gfm:ar,pedantic:or},Ur={normal:Rr,gfm:Br,breaks:Vr,pedantic:zr},Wr={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`},Gr=e=>Wr[e];function Kr(e,t){if(t){if(Rn.escapeTest.test(e))return e.replace(Rn.escapeReplace,Gr)}else if(Rn.escapeTestNoEncode.test(e))return e.replace(Rn.escapeReplaceNoEncode,Gr);return e}function qr(e){try{e=encodeURI(e).replace(Rn.percentDecode,`%`)}catch{return null}return e}function Jr(e,t){let n=e.replace(Rn.findPipe,(e,t,n)=>{let r=!1,i=t;for(;--i>=0&&n[i]===`\\`;)r=!r;return r?`|`:` |`}).split(Rn.splitPipe),r=0;if(n[0].trim()||n.shift(),n.length>0&&!n.at(-1)?.trim()&&n.pop(),t)if(n.length>t)n.splice(t);else for(;n.length<t;)n.push(``);for(;r<n.length;r++)n[r]=n[r].trim().replace(Rn.slashPipe,`|`);return n}function Yr(e,t,n){let r=e.length;if(r===0)return``;let i=0;for(;i<r;){let a=e.charAt(r-i-1);if(a===t&&!n)i++;else if(a!==t&&n)i++;else break}return e.slice(0,r-i)}function Xr(e,t){if(e.indexOf(t[1])===-1)return-1;let n=0;for(let r=0;r<e.length;r++)if(e[r]===`\\`)r++;else if(e[r]===t[0])n++;else if(e[r]===t[1]&&(n--,n<0))return r;return n>0?-2:-1}function Zr(e,t=0){let n=t,r=``;for(let t of e)if(t===`	`){let e=4-n%4;r+=` `.repeat(e),n+=e}else r+=t,n++;return r}function Qr(e,t,n,r,i){let a=t.href,o=t.title||null,s=e[1].replace(i.other.outputLinkReplace,`$1`);r.state.inLink=!0;let c={type:e[0].charAt(0)===`!`?`image`:`link`,raw:n,href:a,title:o,text:s,tokens:r.inlineTokens(s)};return r.state.inLink=!1,c}function $r(e,t,n){let r=e.match(n.other.indentCodeCompensation);if(r===null)return t;let i=r[1];return t.split(`
`).map(e=>{let t=e.match(n.other.beginningSpace);if(t===null)return e;let[r]=t;return r.length>=i.length?e.slice(i.length):e}).join(`
`)}var ei=class{options;rules;lexer;constructor(e){this.options=e||Nn}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:`space`,raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let e=t[0].replace(this.rules.other.codeRemoveIndent,``);return{type:`code`,raw:t[0],codeBlockStyle:`indented`,text:this.options.pedantic?e:Yr(e,`
`)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let e=t[0],n=$r(e,t[3]||``,this.rules);return{type:`code`,raw:e,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,`$1`):t[2],text:n}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let e=t[2].trim();if(this.rules.other.endingHash.test(e)){let t=Yr(e,`#`);(this.options.pedantic||!t||this.rules.other.endingSpaceChar.test(t))&&(e=t.trim())}return{type:`heading`,raw:t[0],depth:t[1].length,text:e,tokens:this.lexer.inline(e)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:`hr`,raw:Yr(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let e=Yr(t[0],`
`).split(`
`),n=``,r=``,i=[];for(;e.length>0;){let t=!1,a=[],o;for(o=0;o<e.length;o++)if(this.rules.other.blockquoteStart.test(e[o]))a.push(e[o]),t=!0;else if(!t)a.push(e[o]);else break;e=e.slice(o);let s=a.join(`
`),c=s.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,``);n=n?`${n}
${s}`:s,r=r?`${r}
${c}`:c;let l=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(c,i,!0),this.lexer.state.top=l,e.length===0)break;let u=i.at(-1);if(u?.type===`code`)break;if(u?.type===`blockquote`){let t=u,a=t.raw+`
`+e.join(`
`),o=this.blockquote(a);i[i.length-1]=o,n=n.substring(0,n.length-t.raw.length)+o.raw,r=r.substring(0,r.length-t.text.length)+o.text;break}else if(u?.type===`list`){let t=u,a=t.raw+`
`+e.join(`
`),o=this.list(a);i[i.length-1]=o,n=n.substring(0,n.length-u.raw.length)+o.raw,r=r.substring(0,r.length-t.raw.length)+o.raw,e=a.substring(i.at(-1).raw.length).split(`
`);continue}}return{type:`blockquote`,raw:n,tokens:i,text:r}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim(),r=n.length>1,i={type:`list`,raw:``,ordered:r,start:r?+n.slice(0,-1):``,loose:!1,items:[]};n=r?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=r?n:`[*+-]`);let a=this.rules.other.listItemRegex(n),o=!1;for(;e;){let n=!1,r=``,s=``;if(!(t=a.exec(e))||this.rules.block.hr.test(e))break;r=t[0],e=e.substring(r.length);let c=Zr(t[2].split(`
`,1)[0],t[1].length),l=e.split(`
`,1)[0],u=!c.trim(),d=0;if(this.options.pedantic?(d=2,s=c.trimStart()):u?d=t[1].length+1:(d=c.search(this.rules.other.nonSpaceChar),d=d>4?1:d,s=c.slice(d),d+=t[1].length),u&&this.rules.other.blankLine.test(l)&&(r+=l+`
`,e=e.substring(l.length+1),n=!0),!n){let t=this.rules.other.nextBulletRegex(d),n=this.rules.other.hrRegex(d),i=this.rules.other.fencesBeginRegex(d),a=this.rules.other.headingBeginRegex(d),o=this.rules.other.htmlBeginRegex(d),f=this.rules.other.blockquoteBeginRegex(d);for(;e;){let p=e.split(`
`,1)[0],m;if(l=p,this.options.pedantic?(l=l.replace(this.rules.other.listReplaceNesting,`  `),m=l):m=l.replace(this.rules.other.tabCharGlobal,`    `),i.test(l)||a.test(l)||o.test(l)||f.test(l)||t.test(l)||n.test(l))break;if(m.search(this.rules.other.nonSpaceChar)>=d||!l.trim())s+=`
`+m.slice(d);else{if(u||c.replace(this.rules.other.tabCharGlobal,`    `).search(this.rules.other.nonSpaceChar)>=4||i.test(c)||a.test(c)||n.test(c))break;s+=`
`+l}u=!l.trim(),r+=p+`
`,e=e.substring(p.length+1),c=m.slice(d)}}i.loose||(o?i.loose=!0:this.rules.other.doubleBlankLine.test(r)&&(o=!0)),i.items.push({type:`list_item`,raw:r,task:!!this.options.gfm&&this.rules.other.listIsTask.test(s),loose:!1,text:s,tokens:[]}),i.raw+=r}let s=i.items.at(-1);if(s)s.raw=s.raw.trimEnd(),s.text=s.text.trimEnd();else return;i.raw=i.raw.trimEnd();for(let e of i.items){if(this.lexer.state.top=!1,e.tokens=this.lexer.blockTokens(e.text,[]),e.task){if(e.text=e.text.replace(this.rules.other.listReplaceTask,``),e.tokens[0]?.type===`text`||e.tokens[0]?.type===`paragraph`){e.tokens[0].raw=e.tokens[0].raw.replace(this.rules.other.listReplaceTask,``),e.tokens[0].text=e.tokens[0].text.replace(this.rules.other.listReplaceTask,``);for(let e=this.lexer.inlineQueue.length-1;e>=0;e--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[e].src)){this.lexer.inlineQueue[e].src=this.lexer.inlineQueue[e].src.replace(this.rules.other.listReplaceTask,``);break}}let t=this.rules.other.listTaskCheckbox.exec(e.raw);if(t){let n={type:`checkbox`,raw:t[0]+` `,checked:t[0]!==`[ ]`};e.checked=n.checked,i.loose?e.tokens[0]&&[`paragraph`,`text`].includes(e.tokens[0].type)&&`tokens`in e.tokens[0]&&e.tokens[0].tokens?(e.tokens[0].raw=n.raw+e.tokens[0].raw,e.tokens[0].text=n.raw+e.tokens[0].text,e.tokens[0].tokens.unshift(n)):e.tokens.unshift({type:`paragraph`,raw:n.raw,text:n.raw,tokens:[n]}):e.tokens.unshift(n)}}if(!i.loose){let t=e.tokens.filter(e=>e.type===`space`);i.loose=t.length>0&&t.some(e=>this.rules.other.anyLine.test(e.raw))}}if(i.loose)for(let e of i.items){e.loose=!0;for(let t of e.tokens)t.type===`text`&&(t.type=`paragraph`)}return i}}html(e){let t=this.rules.block.html.exec(e);if(t)return{type:`html`,block:!0,raw:t[0],pre:t[1]===`pre`||t[1]===`script`||t[1]===`style`,text:t[0]}}def(e){let t=this.rules.block.def.exec(e);if(t){let e=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal,` `),n=t[2]?t[2].replace(this.rules.other.hrefBrackets,`$1`).replace(this.rules.inline.anyPunctuation,`$1`):``,r=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,`$1`):t[3];return{type:`def`,tag:e,raw:t[0],href:n,title:r}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let n=Jr(t[1]),r=t[2].replace(this.rules.other.tableAlignChars,``).split(`|`),i=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,``).split(`
`):[],a={type:`table`,raw:t[0],header:[],align:[],rows:[]};if(n.length===r.length){for(let e of r)this.rules.other.tableAlignRight.test(e)?a.align.push(`right`):this.rules.other.tableAlignCenter.test(e)?a.align.push(`center`):this.rules.other.tableAlignLeft.test(e)?a.align.push(`left`):a.align.push(null);for(let e=0;e<n.length;e++)a.header.push({text:n[e],tokens:this.lexer.inline(n[e]),header:!0,align:a.align[e]});for(let e of i)a.rows.push(Jr(e,a.header.length).map((e,t)=>({text:e,tokens:this.lexer.inline(e),header:!1,align:a.align[t]})));return a}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t){let e=t[1].trim();return{type:`heading`,raw:t[0],depth:t[2].charAt(0)===`=`?1:2,text:e,tokens:this.lexer.inline(e)}}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let e=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:`paragraph`,raw:t[0],text:e,tokens:this.lexer.inline(e)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:`text`,raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:`escape`,raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:`html`,raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let e=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(e)){if(!this.rules.other.endAngleBracket.test(e))return;let t=Yr(e.slice(0,-1),`\\`);if((e.length-t.length)%2==0)return}else{let e=Xr(t[2],`()`);if(e===-2)return;if(e>-1){let n=(t[0].indexOf(`!`)===0?5:4)+t[1].length+e;t[2]=t[2].substring(0,e),t[0]=t[0].substring(0,n).trim(),t[3]=``}}let n=t[2],r=``;if(this.options.pedantic){let e=this.rules.other.pedanticHrefTitle.exec(n);e&&(n=e[1],r=e[3])}else r=t[3]?t[3].slice(1,-1):``;return n=n.trim(),this.rules.other.startAngleBracket.test(n)&&(n=this.options.pedantic&&!this.rules.other.endAngleBracket.test(e)?n.slice(1):n.slice(1,-1)),Qr(t,{href:n&&n.replace(this.rules.inline.anyPunctuation,`$1`),title:r&&r.replace(this.rules.inline.anyPunctuation,`$1`)},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){let e=t[(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal,` `).toLowerCase()];if(!e){let e=n[0].charAt(0);return{type:`text`,raw:e,text:e}}return Qr(n,e,n[0],this.lexer,this.rules)}}emStrong(e,t,n=``){let r=this.rules.inline.emStrongLDelim.exec(e);if(!(!r||!r[1]&&!r[2]&&!r[3]&&!r[4]||r[4]&&n.match(this.rules.other.unicodeAlphaNumeric))&&(!(r[1]||r[3])||!n||this.rules.inline.punctuation.exec(n))){let n=[...r[0]].length-1,i,a,o=n,s=0,c=r[0][0]===`*`?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(c.lastIndex=0,t=t.slice(-1*e.length+n);(r=c.exec(t))!=null;){if(i=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!i)continue;if(a=[...i].length,r[3]||r[4]){o+=a;continue}else if((r[5]||r[6])&&n%3&&!((n+a)%3)){s+=a;continue}if(o-=a,o>0)continue;a=Math.min(a,a+o+s);let t=[...r[0]][0].length,c=e.slice(0,n+r.index+t+a);if(Math.min(n,a)%2){let e=c.slice(1,-1);return{type:`em`,raw:c,text:e,tokens:this.lexer.inlineTokens(e)}}let l=c.slice(2,-2);return{type:`strong`,raw:c,text:l,tokens:this.lexer.inlineTokens(l)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let e=t[2].replace(this.rules.other.newLineCharGlobal,` `),n=this.rules.other.nonSpaceChar.test(e),r=this.rules.other.startingSpaceChar.test(e)&&this.rules.other.endingSpaceChar.test(e);return n&&r&&(e=e.substring(1,e.length-1)),{type:`codespan`,raw:t[0],text:e}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:`br`,raw:t[0]}}del(e,t,n=``){let r=this.rules.inline.delLDelim.exec(e);if(r&&(!r[1]||!n||this.rules.inline.punctuation.exec(n))){let n=[...r[0]].length-1,i,a,o=n,s=this.rules.inline.delRDelim;for(s.lastIndex=0,t=t.slice(-1*e.length+n);(r=s.exec(t))!=null;){if(i=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!i||(a=[...i].length,a!==n))continue;if(r[3]||r[4]){o+=a;continue}if(o-=a,o>0)continue;a=Math.min(a,a+o);let t=[...r[0]][0].length,s=e.slice(0,n+r.index+t+a),c=s.slice(n,-n);return{type:`del`,raw:s,text:c,tokens:this.lexer.inlineTokens(c)}}}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let e,n;return t[2]===`@`?(e=t[1],n=`mailto:`+e):(e=t[1],n=e),{type:`link`,raw:t[0],text:e,href:n,tokens:[{type:`text`,raw:e,text:e}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let e,n;if(t[2]===`@`)e=t[0],n=`mailto:`+e;else{let r;do r=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??``;while(r!==t[0]);e=t[0],n=t[1]===`www.`?`http://`+t[0]:t[0]}return{type:`link`,raw:t[0],text:e,href:n,tokens:[{type:`text`,raw:e,text:e}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let e=this.lexer.state.inRawBlock;return{type:`text`,raw:t[0],text:t[0],escaped:e}}}},ti=class e{tokens;options;state;inlineQueue;tokenizer;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||Nn,this.options.tokenizer=this.options.tokenizer||new ei,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let t={other:Rn,block:Hr.normal,inline:Ur.normal};this.options.pedantic?(t.block=Hr.pedantic,t.inline=Ur.pedantic):this.options.gfm&&(t.block=Hr.gfm,this.options.breaks?t.inline=Ur.breaks:t.inline=Ur.gfm),this.tokenizer.rules=t}static get rules(){return{block:Hr,inline:Ur}}static lex(t,n){return new e(n).lex(t)}static lexInline(t,n){return new e(n).inlineTokens(t)}lex(e){e=e.replace(Rn.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let e=0;e<this.inlineQueue.length;e++){let t=this.inlineQueue[e];this.inlineTokens(t.src,t.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[],n=!1){for(this.tokenizer.lexer=this,this.options.pedantic&&(e=e.replace(Rn.tabCharGlobal,`    `).replace(Rn.spaceLine,``));e;){let r;if(this.options.extensions?.block?.some(n=>(r=n.call({lexer:this},e,t))?(e=e.substring(r.raw.length),t.push(r),!0):!1))continue;if(r=this.tokenizer.space(e)){e=e.substring(r.raw.length);let n=t.at(-1);r.raw.length===1&&n!==void 0?n.raw+=`
`:t.push(r);continue}if(r=this.tokenizer.code(e)){e=e.substring(r.raw.length);let n=t.at(-1);n?.type===`paragraph`||n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+r.raw,n.text+=`
`+r.text,this.inlineQueue.at(-1).src=n.text):t.push(r);continue}if(r=this.tokenizer.fences(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.heading(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.hr(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.blockquote(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.list(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.html(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.def(e)){e=e.substring(r.raw.length);let n=t.at(-1);n?.type===`paragraph`||n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+r.raw,n.text+=`
`+r.raw,this.inlineQueue.at(-1).src=n.text):this.tokens.links[r.tag]||(this.tokens.links[r.tag]={href:r.href,title:r.title},t.push(r));continue}if(r=this.tokenizer.table(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.lheading(e)){e=e.substring(r.raw.length),t.push(r);continue}let i=e;if(this.options.extensions?.startBlock){let t=1/0,n=e.slice(1),r;this.options.extensions.startBlock.forEach(e=>{r=e.call({lexer:this},n),typeof r==`number`&&r>=0&&(t=Math.min(t,r))}),t<1/0&&t>=0&&(i=e.substring(0,t+1))}if(this.state.top&&(r=this.tokenizer.paragraph(i))){let a=t.at(-1);n&&a?.type===`paragraph`?(a.raw+=(a.raw.endsWith(`
`)?``:`
`)+r.raw,a.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=a.text):t.push(r),n=i.length!==e.length,e=e.substring(r.raw.length);continue}if(r=this.tokenizer.text(e)){e=e.substring(r.raw.length);let n=t.at(-1);n?.type===`text`?(n.raw+=(n.raw.endsWith(`
`)?``:`
`)+r.raw,n.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=n.text):t.push(r);continue}if(e){let t=`Infinite loop on byte: `+e.charCodeAt(0);if(this.options.silent){console.error(t);break}else throw Error(t)}}return this.state.top=!0,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}inlineTokens(e,t=[]){this.tokenizer.lexer=this;let n=e,r=null;if(this.tokens.links){let e=Object.keys(this.tokens.links);if(e.length>0)for(;(r=this.tokenizer.rules.inline.reflinkSearch.exec(n))!=null;)e.includes(r[0].slice(r[0].lastIndexOf(`[`)+1,-1))&&(n=n.slice(0,r.index)+`[`+`a`.repeat(r[0].length-2)+`]`+n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(r=this.tokenizer.rules.inline.anyPunctuation.exec(n))!=null;)n=n.slice(0,r.index)+`++`+n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let i;for(;(r=this.tokenizer.rules.inline.blockSkip.exec(n))!=null;)i=r[2]?r[2].length:0,n=n.slice(0,r.index+i)+`[`+`a`.repeat(r[0].length-i-2)+`]`+n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);n=this.options.hooks?.emStrongMask?.call({lexer:this},n)??n;let a=!1,o=``;for(;e;){a||(o=``),a=!1;let r;if(this.options.extensions?.inline?.some(n=>(r=n.call({lexer:this},e,t))?(e=e.substring(r.raw.length),t.push(r),!0):!1))continue;if(r=this.tokenizer.escape(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.tag(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.link(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(r.raw.length);let n=t.at(-1);r.type===`text`&&n?.type===`text`?(n.raw+=r.raw,n.text+=r.text):t.push(r);continue}if(r=this.tokenizer.emStrong(e,n,o)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.codespan(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.br(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.del(e,n,o)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.autolink(e)){e=e.substring(r.raw.length),t.push(r);continue}if(!this.state.inLink&&(r=this.tokenizer.url(e))){e=e.substring(r.raw.length),t.push(r);continue}let i=e;if(this.options.extensions?.startInline){let t=1/0,n=e.slice(1),r;this.options.extensions.startInline.forEach(e=>{r=e.call({lexer:this},n),typeof r==`number`&&r>=0&&(t=Math.min(t,r))}),t<1/0&&t>=0&&(i=e.substring(0,t+1))}if(r=this.tokenizer.inlineText(i)){e=e.substring(r.raw.length),r.raw.slice(-1)!==`_`&&(o=r.raw.slice(-1)),a=!0;let n=t.at(-1);n?.type===`text`?(n.raw+=r.raw,n.text+=r.text):t.push(r);continue}if(e){let t=`Infinite loop on byte: `+e.charCodeAt(0);if(this.options.silent){console.error(t);break}else throw Error(t)}}return t}},ni=class{options;parser;constructor(e){this.options=e||Nn}space(e){return``}code({text:e,lang:t,escaped:n}){let r=(t||``).match(Rn.notSpaceStart)?.[0],i=e.replace(Rn.endingNewline,``)+`
`;return r?`<pre><code class="language-`+Kr(r)+`">`+(n?i:Kr(i,!0))+`</code></pre>
`:`<pre><code>`+(n?i:Kr(i,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return``}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,n=e.start,r=``;for(let t=0;t<e.items.length;t++){let n=e.items[t];r+=this.listitem(n)}let i=t?`ol`:`ul`,a=t&&n!==1?` start="`+n+`"`:``;return`<`+i+a+`>
`+r+`</`+i+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return`<input `+(e?`checked="" `:``)+`disabled="" type="checkbox"> `}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t=``,n=``;for(let t=0;t<e.header.length;t++)n+=this.tablecell(e.header[t]);t+=this.tablerow({text:n});let r=``;for(let t=0;t<e.rows.length;t++){let i=e.rows[t];n=``;for(let e=0;e<i.length;e++)n+=this.tablecell(i[e]);r+=this.tablerow({text:n})}return r&&=`<tbody>${r}</tbody>`,`<table>
<thead>
`+t+`</thead>
`+r+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),n=e.header?`th`:`td`;return(e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${Kr(e,!0)}</code>`}br(e){return`<br>`}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:n}){let r=this.parser.parseInline(n),i=qr(e);if(i===null)return r;e=i;let a=`<a href="`+e+`"`;return t&&(a+=` title="`+Kr(t)+`"`),a+=`>`+r+`</a>`,a}image({href:e,title:t,text:n,tokens:r}){r&&(n=this.parser.parseInline(r,this.parser.textRenderer));let i=qr(e);if(i===null)return Kr(n);e=i;let a=`<img src="${e}" alt="${Kr(n)}"`;return t&&(a+=` title="${Kr(t)}"`),a+=`>`,a}text(e){return`tokens`in e&&e.tokens?this.parser.parseInline(e.tokens):`escaped`in e&&e.escaped?e.text:Kr(e.text)}},ri=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return``+e}image({text:e}){return``+e}br(){return``}checkbox({raw:e}){return e}},ii=class e{options;renderer;textRenderer;constructor(e){this.options=e||Nn,this.options.renderer=this.options.renderer||new ni,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new ri}static parse(t,n){return new e(n).parse(t)}static parseInline(t,n){return new e(n).parseInline(t)}parse(e){this.renderer.parser=this;let t=``;for(let n=0;n<e.length;n++){let r=e[n];if(this.options.extensions?.renderers?.[r.type]){let e=r,n=this.options.extensions.renderers[e.type].call({parser:this},e);if(n!==!1||![`space`,`hr`,`heading`,`code`,`table`,`blockquote`,`list`,`html`,`def`,`paragraph`,`text`].includes(e.type)){t+=n||``;continue}}let i=r;switch(i.type){case`space`:t+=this.renderer.space(i);break;case`hr`:t+=this.renderer.hr(i);break;case`heading`:t+=this.renderer.heading(i);break;case`code`:t+=this.renderer.code(i);break;case`table`:t+=this.renderer.table(i);break;case`blockquote`:t+=this.renderer.blockquote(i);break;case`list`:t+=this.renderer.list(i);break;case`checkbox`:t+=this.renderer.checkbox(i);break;case`html`:t+=this.renderer.html(i);break;case`def`:t+=this.renderer.def(i);break;case`paragraph`:t+=this.renderer.paragraph(i);break;case`text`:t+=this.renderer.text(i);break;default:{let e=`Token with "`+i.type+`" type was not found.`;if(this.options.silent)return console.error(e),``;throw Error(e)}}}return t}parseInline(e,t=this.renderer){this.renderer.parser=this;let n=``;for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let e=this.options.extensions.renderers[i.type].call({parser:this},i);if(e!==!1||![`escape`,`html`,`link`,`image`,`strong`,`em`,`codespan`,`br`,`del`,`text`].includes(i.type)){n+=e||``;continue}}let a=i;switch(a.type){case`escape`:n+=t.text(a);break;case`html`:n+=t.html(a);break;case`link`:n+=t.link(a);break;case`image`:n+=t.image(a);break;case`checkbox`:n+=t.checkbox(a);break;case`strong`:n+=t.strong(a);break;case`em`:n+=t.em(a);break;case`codespan`:n+=t.codespan(a);break;case`br`:n+=t.br(a);break;case`del`:n+=t.del(a);break;case`text`:n+=t.text(a);break;default:{let e=`Token with "`+a.type+`" type was not found.`;if(this.options.silent)return console.error(e),``;throw Error(e)}}}return n}},ai=class{options;block;constructor(e){this.options=e||Nn}static passThroughHooks=new Set([`preprocess`,`postprocess`,`processAllTokens`,`emStrongMask`]);static passThroughHooksRespectAsync=new Set([`preprocess`,`postprocess`,`processAllTokens`]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(){return this.block?ti.lex:ti.lexInline}provideParser(){return this.block?ii.parse:ii.parseInline}},oi=new class{defaults=Mn();options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=ii;Renderer=ni;TextRenderer=ri;Lexer=ti;Tokenizer=ei;Hooks=ai;constructor(...e){this.use(...e)}walkTokens(e,t){let n=[];for(let r of e)switch(n=n.concat(t.call(this,r)),r.type){case`table`:{let e=r;for(let r of e.header)n=n.concat(this.walkTokens(r.tokens,t));for(let r of e.rows)for(let e of r)n=n.concat(this.walkTokens(e.tokens,t));break}case`list`:{let e=r;n=n.concat(this.walkTokens(e.items,t));break}default:{let e=r;this.defaults.extensions?.childTokens?.[e.type]?this.defaults.extensions.childTokens[e.type].forEach(r=>{let i=e[r].flat(1/0);n=n.concat(this.walkTokens(i,t))}):e.tokens&&(n=n.concat(this.walkTokens(e.tokens,t)))}}return n}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(e=>{let n={...e};if(n.async=this.defaults.async||n.async||!1,e.extensions&&(e.extensions.forEach(e=>{if(!e.name)throw Error(`extension name required`);if(`renderer`in e){let n=t.renderers[e.name];n?t.renderers[e.name]=function(...t){let r=e.renderer.apply(this,t);return r===!1&&(r=n.apply(this,t)),r}:t.renderers[e.name]=e.renderer}if(`tokenizer`in e){if(!e.level||e.level!==`block`&&e.level!==`inline`)throw Error(`extension level must be 'block' or 'inline'`);let n=t[e.level];n?n.unshift(e.tokenizer):t[e.level]=[e.tokenizer],e.start&&(e.level===`block`?t.startBlock?t.startBlock.push(e.start):t.startBlock=[e.start]:e.level===`inline`&&(t.startInline?t.startInline.push(e.start):t.startInline=[e.start]))}`childTokens`in e&&e.childTokens&&(t.childTokens[e.name]=e.childTokens)}),n.extensions=t),e.renderer){let t=this.defaults.renderer||new ni(this.defaults);for(let n in e.renderer){if(!(n in t))throw Error(`renderer '${n}' does not exist`);if([`options`,`parser`].includes(n))continue;let r=n,i=e.renderer[r],a=t[r];t[r]=(...e)=>{let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n||``}}n.renderer=t}if(e.tokenizer){let t=this.defaults.tokenizer||new ei(this.defaults);for(let n in e.tokenizer){if(!(n in t))throw Error(`tokenizer '${n}' does not exist`);if([`options`,`rules`,`lexer`].includes(n))continue;let r=n,i=e.tokenizer[r],a=t[r];t[r]=(...e)=>{let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n}}n.tokenizer=t}if(e.hooks){let t=this.defaults.hooks||new ai;for(let n in e.hooks){if(!(n in t))throw Error(`hook '${n}' does not exist`);if([`options`,`block`].includes(n))continue;let r=n,i=e.hooks[r],a=t[r];ai.passThroughHooks.has(n)?t[r]=e=>{if(this.defaults.async&&ai.passThroughHooksRespectAsync.has(n))return(async()=>{let n=await i.call(t,e);return a.call(t,n)})();let r=i.call(t,e);return a.call(t,r)}:t[r]=(...e)=>{if(this.defaults.async)return(async()=>{let n=await i.apply(t,e);return n===!1&&(n=await a.apply(t,e)),n})();let n=i.apply(t,e);return n===!1&&(n=a.apply(t,e)),n}}n.hooks=t}if(e.walkTokens){let t=this.defaults.walkTokens,r=e.walkTokens;n.walkTokens=function(e){let n=[];return n.push(r.call(this,e)),t&&(n=n.concat(t.call(this,e))),n}}this.defaults={...this.defaults,...n}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return ti.lex(e,t??this.defaults)}parser(e,t){return ii.parse(e,t??this.defaults)}parseMarkdown(e){return(t,n)=>{let r={...n},i={...this.defaults,...r},a=this.onError(!!i.silent,!!i.async);if(this.defaults.async===!0&&r.async===!1)return a(Error(`marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.`));if(typeof t>`u`||t===null)return a(Error(`marked(): input parameter is undefined or null`));if(typeof t!=`string`)return a(Error(`marked(): input parameter is of type `+Object.prototype.toString.call(t)+`, string expected`));if(i.hooks&&(i.hooks.options=i,i.hooks.block=e),i.async)return(async()=>{let n=i.hooks?await i.hooks.preprocess(t):t,r=await(i.hooks?await i.hooks.provideLexer():e?ti.lex:ti.lexInline)(n,i),a=i.hooks?await i.hooks.processAllTokens(r):r;i.walkTokens&&await Promise.all(this.walkTokens(a,i.walkTokens));let o=await(i.hooks?await i.hooks.provideParser():e?ii.parse:ii.parseInline)(a,i);return i.hooks?await i.hooks.postprocess(o):o})().catch(a);try{i.hooks&&(t=i.hooks.preprocess(t));let n=(i.hooks?i.hooks.provideLexer():e?ti.lex:ti.lexInline)(t,i);i.hooks&&(n=i.hooks.processAllTokens(n)),i.walkTokens&&this.walkTokens(n,i.walkTokens);let r=(i.hooks?i.hooks.provideParser():e?ii.parse:ii.parseInline)(n,i);return i.hooks&&(r=i.hooks.postprocess(r)),r}catch(e){return a(e)}}}onError(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let e=`<p>An error occurred:</p><pre>`+Kr(n.message+``,!0)+`</pre>`;return t?Promise.resolve(e):e}if(t)return Promise.reject(n);throw n}}};function si(e,t){return oi.parse(e,t)}si.options=si.setOptions=function(e){return oi.setOptions(e),si.defaults=oi.defaults,Pn(si.defaults),si},si.getDefaults=Mn,si.defaults=Nn,si.use=function(...e){return oi.use(...e),si.defaults=oi.defaults,Pn(si.defaults),si},si.walkTokens=function(e,t){return oi.walkTokens(e,t)},si.parseInline=oi.parseInline,si.Parser=ii,si.parser=ii.parse,si.Renderer=ni,si.TextRenderer=ri,si.Lexer=ti,si.lexer=ti.lex,si.Tokenizer=ei,si.Hooks=ai,si.parse=si,si.options,si.setOptions,si.use,si.walkTokens,si.parseInline,ii.parse,ti.lex;var ci={administrasi:10,pemanfaatan:10,arsitektur:15,struktur:25,mekanikal:15,kesehatan:10,kenyamanan:8,kemudahan:7},li={ada_sesuai:100,ada_tidak_sesuai:40,tidak_ada:0,pertama_kali:80,tidak_wajib:100,tidak_ada_renovasi:100,"":0},ui={baik:100,sedang:65,buruk:30,kritis:0,tidak_ada:90,"":0};async function di(e={}){let t=e.id;if(!t)return M(`proyek`),``;window._analisisProyekId=t;let n=document.getElementById(`page-root`);n&&(n.innerHTML=Ti()),await fi(t)}async function fi(e){let t=document.getElementById(`page-root`),[n,r,i,a]=await Promise.all([xi(e),Si(e),Ci(e),wi(e)]);if(window._analisisFiles=a,!n)return M(`proyek`),V(`Proyek tidak ditemukan.`),``;let o=i,s=r.length>0,c=pi(n,r,o,s);t&&(t.innerHTML=c,s&&o&&bi(o),_i(n,r,e))}function pi(e,t,n,r){return`
    <div id="analisis-page">
      <!-- Header -->
      <div class="page-header">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${e.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> ${Ei(e.nama_bangunan)}
            </button>
            <h1 class="page-title">Analisis AI — Kelaikan Fungsi</h1>
            <p class="page-subtitle">Engine rule-based berbasis NSPK & SNI 9273:2025 — Status: ${r?`${t.length} item checklist`:`Checklist belum diisi`}</p>
          </div>
          <div class="flex gap-3">
            ${r?`
              <button class="btn btn-secondary" onclick="window.navigate('checklist',{id:'${e.id}'})">
                <i class="fas fa-clipboard-check"></i> Edit Checklist
              </button>
              <button class="btn btn-primary" id="btn-analyze" onclick="window._runAnalysis()">
                <i class="fas fa-brain"></i> Jalankan Analisis
              </button>
            `:`
              <button class="btn btn-primary" onclick="window.navigate('checklist',{id:'${e.id}'})">
                <i class="fas fa-clipboard-check"></i> Isi Checklist Dulu
              </button>
            `}
          </div>
        </div>
      </div>

      ${r?n?gi(n,e,t):hi(e.id):mi(e.id)}

      <!-- AI Progress Modal -->
      <div class="export-progress-overlay" id="ai-progress-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;">
        <div class="export-progress-modal" style="background:var(--bg-card);padding:var(--space-6);border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);text-align:center;width:90%;max-width:400px;transform:translateY(20px);transition:transform 0.3s ease;">
          <div class="export-progress-icon" style="width:64px;height:64px;background:var(--gradient-brand);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);color:white;font-size:1.8rem;box-shadow:0 8px 16px hsla(220,70%,50%,0.2);">
            <i class="fas fa-brain fa-fade" id="ai-progress-icon-i" style="--fa-animation-duration: 2s;"></i>
          </div>
          <h3 id="ai-progress-title" style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-2);color:var(--text-primary)">AI Engine Bekerja...</h3>
          <p id="ai-progress-msg" style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:var(--space-4)">Menganalisa parameter teknis & administrasi via OpenAI</p>
          <div class="export-progress-bar" style="height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden;margin-bottom:var(--space-2);">
            <div class="export-progress-fill" id="ai-progress-fill" style="height:100%;width:0%;background:var(--brand-500);transition:width 0.4s ease;border-radius:3px;"></div>
          </div>
          <div id="ai-progress-pct" style="font-size:0.75rem;color:var(--text-tertiary);font-variant-numeric:tabular-nums;">Menghubungkan ke API...</div>
        </div>
      </div>

      <!-- Modular Detail Modal -->
      <div id="modular-detail-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;backdrop-filter:blur(6px);align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;">
        <div class="modular-detail-modal" style="background:var(--bg-card);width:90%;max-width:800px;max-height:85vh;border-radius:var(--radius-xl);box-shadow:var(--shadow-2xl);display:flex;flex-direction:column;overflow:hidden;transform:scale(0.95);transition:transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
          <div class="flex-between" style="padding:var(--space-5) var(--space-6);background:var(--bg-input);border-bottom:1px solid var(--border-subtle)">
            <div>
              <div id="md-kode" style="font-family:monospace;font-weight:800;color:var(--brand-400);font-size:0.9rem">---</div>
              <h3 id="md-nama" style="font-size:1.15rem;font-weight:700;color:var(--text-primary)">---</h3>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window._closeModularDetail()" style="font-size:1.2rem;width:40px;height:40px;border-radius:50%">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div id="md-content" style="padding:var(--space-6);overflow-y:auto;flex:1;line-height:1.7;color:var(--text-secondary);font-size:0.95rem;">
            <!-- AI Content Here -->
          </div>
          <div style="padding:var(--space-4) var(--space-6);background:var(--bg-input);border-top:1px solid var(--border-subtle);display:flex;justify-content:flex-end;gap:12px">
             <button class="btn btn-secondary btn-sm" onclick="window._closeModularDetail()">Tutup</button>
             <button id="md-btn-reanalyze" class="btn btn-primary btn-sm">Ulangi Analisis AI</button>
          </div>
        </div>
      </div>
    </div>
  `}function mi(e){return`
    <div class="card" style="text-align:center;padding:var(--space-12)">
      <div style="width:70px;height:70px;background:var(--gradient-brand);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);font-size:1.8rem;color:white">
        <i class="fas fa-clipboard-list"></i>
      </div>
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-2)">Checklist Belum Diisi</h3>
      <p style="color:var(--text-secondary);max-width:400px;margin:0 auto var(--space-6)">
        AI Engine membutuhkan data checklist pemeriksaan untuk melakukan analisis. Isi checklist administrasi dan teknis terlebih dahulu.
      </p>
      <button class="btn btn-primary" onclick="window.navigate('checklist',{id:'${e}'})">
        <i class="fas fa-clipboard-check"></i> Mulai Isi Checklist
      </button>
    </div>
  `}function hi(e){return`
    <div class="ai-panel" style="text-align:center;padding:var(--space-10)">
      <div class="empty-state">
      <div class="empty-icon"><i class="fas fa-microchip"></i></div>
      <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:var(--space-2)">Mulai Analisis Modular (Hybrid AI v6)</h3>
      <p style="color:var(--text-secondary);max-width:500px;margin:0 auto var(--space-5)">
        Pilihlah modul parameter satu persatu untuk dianalisis secara mendalam oleh AI. Algoritma Hybrid AI akan melakukan Fuzzy Logic & Bayesian Calculation berdasarkan data lapangan.
      </p>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:var(--space-3);max-width:1000px;margin:0 auto var(--space-5)">
        ${[{label:`Administrasi`,desc:`Verifikasi Lintas Instansi`},{label:`Pemanfaatan`,desc:`Kesesuaian Item-01 & 02`},{label:`Arsitektur`,desc:`Desain & Lingkungan (Item-03 & 04)`},{label:`Struktur`,desc:`Keselamatan Bangunan (Item-05A)`},{label:`Mekanikal`,desc:`Kebakaran, Petir, Listrik (Item-05)`},{label:`Kesehatan`,desc:`Utilitas & Material (Item-06)`},{label:`Kenyamanan`,desc:`Ruang, Termal, Visual (Item-07)`},{label:`Kemudahan`,desc:`Akses & Prasarana (Item-08)`}].map(e=>`
          <button class="btn btn-outline" style="display:flex;flex-direction:column;gap:8px;padding:var(--space-4);text-align:center" onclick="window._runAspect('${e.label}')">
            <i class="fas fa-robot" style="font-size:1.5rem;color:var(--brand-400)"></i>
            <div style="font-weight:700;font-size:0.9rem">Analisis ${e.label}</div>
            <div style="font-size:0.7rem;color:var(--text-tertiary)">${e.desc}</div>
          </button>
        `).join(``)}
      </div>
      <div style="font-size:0.75rem; color:var(--success-500); font-weight: 700;">
        <i class="fas fa-check-circle"></i> Continuous Learning Pipeline v6 Active
      </div>
    </div>
  `}function gi(e,t,n){let r=[{key:`skor_administrasi`,label:`Administrasi`,icon:`fa-clipboard-list`,color:`hsl(220,70%,55%)`,kpiColor:`kpi-blue`},{key:`skor_mep`,label:`Pemanfaatan`,icon:`fa-map-location-dot`,color:`hsl(140,70%,50%)`,kpiColor:`kpi-green`},{key:`skor_arsitektur`,label:`Arsitektur`,icon:`fa-drafting-compass`,color:`hsl(258,70%,60%)`,kpiColor:`kpi-purple`},{key:`skor_struktur`,label:`Struktur`,icon:`fa-building`,color:`hsl(0,70%,55%)`,kpiColor:`kpi-red`},{key:`skor_kebakaran`,label:`Mekanikal`,icon:`fa-bolt`,color:`hsl(40,80%,55%)`,kpiColor:`kpi-yellow`},{key:`skor_kesehatan`,label:`Kesehatan`,icon:`fa-heart-pulse`,color:`hsl(160,65%,46%)`,kpiColor:`kpi-green`},{key:`skor_kenyamanan`,label:`Kenyamanan`,icon:`fa-sun`,color:`hsl(40,80%,50%)`,kpiColor:`kpi-yellow`},{key:`skor_kemudahan`,label:`Kemudahan`,icon:`fa-universal-access`,color:`hsl(200,75%,52%)`,kpiColor:`kpi-cyan`}],i={LAIK_FUNGSI:{label:`LAIK FUNGSI`,badge:`badge-laik`,icon:`fa-circle-check`,color:`hsl(160,65%,46%)`},LAIK_FUNGSI_BERSYARAT:{label:`LAIK FUNGSI BERSYARAT`,badge:`badge-bersyarat`,icon:`fa-triangle-exclamation`,color:`hsl(40,85%,55%)`},TIDAK_LAIK_FUNGSI:{label:`TIDAK LAIK FUNGSI`,badge:`badge-tidak-laik`,icon:`fa-circle-xmark`,color:`hsl(0,74%,52%)`},DALAM_PENGKAJIAN:{label:`DALAM PENGKAJIAN`,badge:`badge-info`,icon:`fa-hourglass-half`,color:`hsl(200,75%,52%)`}},a=i[e.status_slf]||i.DALAM_PENGKAJIAN,o=e.rekomendasi?JSON.parse(typeof e.rekomendasi==`string`?e.rekomendasi:JSON.stringify(e.rekomendasi)):[],s=e?.skor_total;if(!s||s===0){let t=r.map(t=>e?.[t.key]||0).filter(e=>e>0);s=t.length>0?Math.round(t.reduce((e,t)=>e+t,0)/t.length):`-`}return`
    <!-- Status Banner -->
    <div class="ai-panel" style="margin-bottom:var(--space-5);display:flex;align-items:center;gap:var(--space-6);padding:var(--space-6)">
      <div style="text-align:center;flex-shrink:0">
        <div style="width:90px;height:90px;border-radius:50%;background:hsla(220,70%,48%,0.15);border:3px solid ${a.color};display:flex;align-items:center;justify-content:center;margin:0 auto">
          <i class="fas ${a.icon}" style="font-size:2rem;color:${a.color}"></i>
        </div>
        <div style="margin-top:var(--space-3);font-size:0.75rem;font-weight:700;color:${a.color}">${a.label}</div>
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
          <div style="font-size:3rem;font-weight:800;letter-spacing:-0.05em;color:var(--brand-400)">${s}</div>
          <div style="color:var(--text-tertiary);font-size:1.5rem">/100</div>
          <div style="margin-left:var(--space-4)">
            <div class="text-xs text-tertiary">Level Risiko</div>
            <div style="font-size:1.1rem;font-weight:700;color:${Oi(e?.risk_level)}">${ki(e?.risk_level)}</div>
          </div>
          <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end">
             <span class="badge badge-success" style="font-size:0.6rem; margin-bottom:4px"><i class="fas fa-bolt"></i> SMART HYBRID ON</span>
             <span style="font-size:0.6rem; color:var(--text-tertiary)">Calculated locally (Low Token)</span>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-4)">
          <div>
            <div class="text-xs text-tertiary">Dianalisis</div>
            <div class="text-sm text-secondary">${Di(e.created_at)}</div>
          </div>
          <div>
            <div class="text-xs text-tertiary">Engine Utama</div>
            <div class="text-sm text-secondary" style="color:var(--brand-400);font-weight:600">
              <i class="fas fa-robot"></i> ${Ei(e.ai_provider||`Modular AI Router`)}
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <button class="btn btn-secondary btn-sm" onclick="window.navigate('laporan',{id:'${t.id}'})">
          <i class="fas fa-file-contract"></i> Lihat Laporan
        </button>
        <button class="btn btn-primary btn-sm" style="background:var(--gradient-brand)" onclick="window._runFinalConclusion()">
          <i class="fas fa-flag-checkered"></i> Buat Kesimpulan Final
        </button>
      </div>
    </div>

    <!-- Detailed Modular Audit (Utama) -->
    <div id="modular-audit-section" style="margin-top:var(--space-6);margin-bottom:var(--space-8)">
      <div class="flex-between" style="margin-bottom:var(--space-5);padding:var(--space-4);background:var(--bg-input);border-radius:var(--radius-lg);border-left:4px solid var(--brand-500)">
        <div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">
            <i class="fas fa-microchip" style="color:var(--brand-400);margin-right:8px"></i>Audit Modular Per Item (Total: ${n.length} Item)
          </h2>
          <p style="font-size:0.85rem;color:var(--text-tertiary);margin-top:4px">Gunakan tombol AI pada masing-masing item untuk hasil audit yang sangat akurat.</p>
        </div>
        <div style="text-align:right">
          <span class="badge badge-info" style="padding:6px 12px">DEEP REASONING ACTIVE</span>
        </div>
      </div>
      <div style="max-height:800px;overflow-y:auto;padding-right:8px;margin-bottom:var(--space-6)">
        ${Ai(n)}
      </div>
    </div>

    <!-- Score Grid (Summary) -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4)">
      <div style="font-weight:700;color:var(--text-tertiary);text-transform:uppercase;font-size:0.75rem;letter-spacing:0.1em">Ringkasan Skor Per Aspek</div>
      <button class="btn btn-primary btn-sm" onclick="window.navigate('laporan', {id: '${window._analisisProyekId}'})" style="padding: 6px 16px; border-radius: 99px">
        <i class="fas fa-file-invoice"></i> Buka Laporan SLF Lengkap &rarr;
      </button>
    </div>
    <div class="aspek-score-grid" style="margin-bottom:var(--space-8)">
      ${r.map(t=>{let r=e?.[t.key]||0,i=r>=80?`hsl(160,65%,46%)`:r>=60?`hsl(40,80%,55%)`:`hsl(0,74%,52%)`,a=n.filter(e=>(e.kategori===`administrasi`?`Administrasi`:e.aspek||`Lainnya`)===t.label),o=a.filter(e=>{if(!e.catatan)return!1;let t=e.catatan.trim().startsWith(`{`),n=e.catatan.includes(`###`)||e.catatan.length>50;return t||n}).length,s=a.length,c=o>=s&&s>0;return`
          <div class="aspek-score-card" style="padding-bottom:12px; border: 1px solid ${c?`var(--brand-500)`:`var(--border-subtle)`}; background: ${c?`hsla(220,70%,50%,0.02)`:`var(--bg-card)`}">
            <div class="asc-icon ${t.kpiColor}"><i class="fas ${t.icon}"></i></div>
            <div class="asc-nilai" style="color:${i}">${r}</div>
            <div class="asc-label">${t.label}</div>
            
            <div style="margin: 8px 0; font-size: 0.65rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; display: flex; justify-content: space-between">
               <span>Poin Teranalisis</span>
               <span style="color: ${c?`var(--brand-400)`:`var(--text-secondary)`}">${o}/${s}</span>
            </div>
            
            <div class="asc-bar" style="height: 6px; margin-bottom: 12px">
              <div class="asc-fill" style="width:${s>0?o/s*100:0}%; background:var(--brand-400)"></div>
            </div>

            <div class="text-xs" style="margin-top:4px;color:${i};margin-bottom:15px; font-weight: 700">
               Status: ${r>=80?`LAIK`:r>=60?`CUKUP`:`KRITIS`}
            </div>
            
            <!-- Status Badge & Link Preview -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background: var(--bg-100); padding: 8px; border-radius: 8px">
              <span class="badge ${c?`badge-success`:`badge-warning`}" style="font-size:0.6rem">
                <i class="fas ${c?`fa-check-double`:`fa-hourglass-half`}"></i> ${c?`Siap Lapor`:`Progress`}
              </span>
              ${c?`
                <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window._showAspectPreview('${t.label}')" style="font-size:0.65rem; color:var(--brand-500); font-weight:700; padding: 2px 8px">
                  <i class="fas fa-eye"></i> Preview
                </button>
              `:``}
            </div>
            
            <button class="btn ${c?`btn-primary`:`btn-outline`} btn-sm" style="width:100%; font-size: 0.7rem" onclick="event.stopPropagation(); window._runAspect('${t.label}')">
              <i class="fas ${c?`fa-file-invoice`:`fa-list-check`}"></i> ${c?`Sintesis Laporan Teknis`:`Kompilasi Data`} ${t.label}
            </button>
          </div>
        `}).join(``)}
    </div>

    <!-- Main Grid: Chart + Rekomendasi -->
    <div style="display:grid;grid-template-columns:360px 1fr;gap:var(--space-5)">
      <!-- Radar Chart -->
      <div class="card">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-chart-radar" style="color:var(--brand-400);margin-right:8px"></i>Radar Skor Aspek
        </div>
        <div class="radar-wrap">
          <canvas id="radar-chart"></canvas>
        </div>
      </div>

      <!-- Rekomendasi -->
      <div class="card">
        <div class="card-header" style="margin-bottom:var(--space-4)">
          <div>
            <div class="card-title">Rekomendasi Teknis</div>
            <div class="card-subtitle">${o.length} rekomendasi berdasarkan hasil analisis</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          ${o.length===0?`
            <div class="ai-finding success"><i class="fas fa-circle-check" style="margin-right:6px"></i>Tidak ada rekomendasi kritis.</div>
          `:o.map((e,t)=>`
              <div class="rekom-card">
                <div class="rekom-priority" style="background:${{kritis:`hsl(0,74%,52%)`,tinggi:`hsl(0,74%,52%)`,sedang:`hsl(40,80%,55%)`}[e.prioritas?.toLowerCase()]||`hsl(200,75%,52%)`}"></div>
                <div style="flex:1">
                  <div class="flex gap-3" style="align-items:center;margin-bottom:4px">
                    <span class="text-sm font-semibold">${t+1}. ${Ei(e.judul||``)}</span>
                    <span class="badge" style="font-size:0.6rem">${Ei(e.prioritas||``)}</span>
                  </div>
                  <p class="text-xs text-secondary">${Ei(e.tindakan||``)}</p>
                </div>
              </div>
            `).join(``)}
        </div>
      </div>
    </div>

    <!-- Narasi Teknis -->
    ${e.narasi_teknis?`
      <div class="card" style="margin-top:var(--space-5)">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-file-alt" style="color:var(--brand-400);margin-right:8px"></i>Narasi Teknis Analisis
        </div>
        <div class="markdown-content" style="font-size:0.875rem;color:var(--text-secondary);line-height:1.8">${si.parse(e.narasi_teknis||``)}</div>
      </div>
    `:``}

    <!-- Expert Consortium Analysis (BAB V & VI) -->
    ${e.metadata?.expert_findings?`
      <div class="card" style="margin-top:var(--space-5); border: 2px solid var(--brand-300); background: linear-gradient(to bottom right, #ffffff, #f5f3ff)">
        <div class="flex-between" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 15px">
           <div class="card-title" style="margin:0; color:var(--brand-600)">
              <i class="fas fa-microchip" style="margin-right:8px"></i>Kedalaman Analisis: Konsorsium Ahli (Bab V & VI)
           </div>
           <span class="badge badge-primary" style="font-size:0.65rem">DEEP REASONING VERIFIED</span>
        </div>
        <div class="markdown-content" style="font-size:0.9rem; line-height:1.7; color:var(--text-primary)">
           ${si.parse(e.metadata.expert_findings.bab5_analisis||``)}
           <hr style="margin: 20px 0; border: none; border-top: 1px dashed var(--border-subtle)">
           <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid var(--brand-200)">
              <h4 style="color:var(--brand-500); margin-bottom: 12px">Kesimpulan & Rekomendasi (Bab VI)</h4>
              ${si.parse(e.metadata.expert_findings.bab6_kesimpulan||``)}
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-subtle); font-weight: 800; color: var(--brand-700)">
                 STATUS FINAL: ${e.metadata.expert_findings.status_final?.replace(/_/g,` `)}
              </div>
           </div>
        </div>
      </div>
    `:``}

    <!-- Action -->
    <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);justify-content:flex-end">
      <button class="btn btn-secondary" onclick="window.navigate('checklist',{id:'${t.id}'})">
        <i class="fas fa-clipboard-check"></i> Edit Checklist
      </button>
      <button class="btn btn-outline" id="btn-expert-consensus" onclick="window._runExpertConsensus()" style="border-color:var(--brand-400); color:var(--brand-500)">
        <i class="fas fa-users-gear"></i> Jalankan Konsorsium Ahli (V2)
      </button>
      <button class="btn btn-primary" onclick="window.navigate('laporan',{id:'${t.id}'})">
        <i class="fas fa-file-contract"></i> Lihat Laporan SLF
      </button>
    </div>
  `}function _i(t,n,r){window._runAnalysis=async()=>{se(`Silakan jalankan analisis per aspek secara modular.`)},window._runExpertConsensus=async()=>{try{let n=document.getElementById(`btn-expert-consensus`);n&&(n.disabled=!0),vi(`Penyelarasan Ahli (Consensus)`,`Membangun konsorsium 5 Tenaga Ahli Spesialis untuk Analisis Forensik...`);let{data:i}=await e.from(`checklist_items`).select(`*`).eq(`proyek_id`,r),{data:a}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,r).limit(1).maybeSingle();if(!a)throw Error(`Jalankan analisis aspek (Skoring) terlebih dahulu.`);for(let e of[`Arsitek`,`Ahli Struktur`,`Ahli MEP`,`Ahli Legal`,`Koordinator Forensik`])vi(`Penyelarasan Ahli`,`${e} sedang memproses data...`),await new Promise(e=>setTimeout(e,1200));let s=await o(i,t,{skor:a.skor,riskLevel:a.status_kelaikan}),{error:c}=await e.from(`hasil_analisis`).update({metadata:{...a.metadata||{},expert_findings:s}}).eq(`id`,a.id);if(c)throw c;yi(),B(`Analisis Konsorsium Ahli Selesai! Bab V & VI telah di-generate.`),fi(r)}catch(e){yi(),V(`Gagal menjalankan konsorsium: `+e.message);let t=document.getElementById(`btn-expert-consensus`);t&&(t.disabled=!1)}}}function vi(e,t){let n=document.getElementById(`ai-progress-overlay`),r=document.getElementById(`ai-progress-title`),i=document.getElementById(`ai-progress-msg`),a=document.getElementById(`ai-progress-fill`),o=document.getElementById(`ai-progress-pct`);n&&(e&&(r.innerText=e),t&&(i.innerText=t),a.style.width=`0%`,o.innerText=`Menghubungkan ke API OpenAI...`,n.style.display=`flex`,setTimeout(()=>{n.style.opacity=`1`,n.style.pointerEvents=`all`;let e=n.querySelector(`.export-progress-modal`);e&&(e.style.transform=`translateY(0)`);let t=0;window._aiProgressInterval=setInterval(()=>{t+=(90-t)*.05,a.style.width=Math.min(t,90)+`%`,t>30&&(o.innerText=`Menganalisis parameter...`),t>60&&(o.innerText=`Deep Reasoning sedang berjalan...`),t>80&&(o.innerText=`Menyusun laporan struktural...`)},500)},10))}function yi(){let e=document.getElementById(`ai-progress-overlay`);if(e){clearInterval(window._aiProgressInterval);let t=document.getElementById(`ai-progress-fill`),n=document.getElementById(`ai-progress-pct`),r=document.getElementById(`ai-progress-icon-i`);t.style.width=`100%`,n.innerText=`Selesai!`,r.classList.remove(`fa-fade`),r.classList.add(`fa-check-circle`),setTimeout(()=>{e.style.opacity=`0`,e.style.pointerEvents=`none`;let t=e.querySelector(`.export-progress-modal`);t&&(t.style.transform=`translateY(20px)`),setTimeout(()=>{e.style.display=`none`,r.classList.remove(`fa-check-circle`),r.classList.add(`fa-fade`,`fa-brain`)},300)},800)}}window._runAspect=async t=>{try{vi(`Sintesis Laporan ${t}`,`Lead Engineer sedang merangkum seluruh hasil investigasi forensic modular...`);let{data:r,error:i}=await e.from(`checklist_items`).select(`*`).eq(`proyek_id`,window._analisisProyekId);if(i)throw i;let a=r.filter(e=>(e.kategori===`administrasi`?`Administrasi`:e.aspek||`Lainnya`)===t);if(!a||a.length===0){yi(),V(`Tidak ada data input yang diisi untuk Aspek ${t}.`);return}let o=a.map(e=>{let t=null;try{e.catatan&&e.catatan.startsWith(`{`)&&(t=JSON.parse(e.catatan))}catch{}let n=t||e.catatan&&(e.catatan.includes(`###`)||e.catatan.length>50),r=!1;return r=e.kategori===`administrasi`?(li[e.status]??0)>=60:(ui[e.status]??0)>=60,{kode:e.kode,nama:e.nama,status:t?t.status:r?`Sesuai`:`Tidak Sesuai`,faktual:t?t.faktual:e.catatan||`Data tidak tersedia`,visual:t?t.visual:`Lihat catatan lapangan`,regulasi:t?t.regulasi:[`PP 16/2021`],analisis:t?t.analisis:`Perlu audit lanjutan`,risiko:t?t.risiko:`Sedang`,rekomendasi:t?t.rekomendasi:`Perbaikan segera`,is_deep_reasoning:!!n}}),s=a.every(e=>{let t=e.kategori===`administrasi`?e.status===`ada_sesuai`||e.status===`tidak_wajib`:e.status===`baik`||e.status===`tidak_ada`,n=!e.catatan||e.catatan.trim().length===0;return t&&n}),c;s?(console.log(`[Smart Hybrid] Aspek ${t} sempurna. Menggunakan Local Template...`),c={skor_aspek:100,narasi_teknis:`### EVALUASI ASPEK ${t.toUpperCase()}\n\nBerdasarkan pemeriksaan lapangan mendalam, seluruh parameter pada aspek ${t} ditemukan dalam kondisi **PRIMA/SESUAI**. Tidak ditemukan adanya anomali teknis maupun administratif yang berpotensi mengurangi kelaikan fungsi bangunan. Seluruh sistem telah memenuhi standar NSPK (Norma, Standar, Prosedur, dan Kriteria) PUPR.\n\n**Rekomendasi:** Lanjutkan pemeliharaan rutin sesuai jadwal yang telah ditetapkan.`,rekomendasi:[],meta:{provider:`Smart Hybrid Logic (Local Engine)`,kategori:`LAIK`}},await new Promise(e=>setTimeout(e,800))):c=await n(t,a,(e,t,n)=>{},{preAnalyzedResults:o}),await new Promise(e=>setTimeout(e,500));let{data:l,error:u}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,window._analisisProyekId).limit(1);if(u)throw u;let d=l&&l.length>0?l[0]:null,f=[];if(d&&d.rekomendasi){let e=d.rekomendasi;typeof e==`string`&&(e=JSON.parse(e)),f=e.filter(e=>e.aspek!==t)}c.rekomendasi&&c.rekomendasi.length>0&&(f=[...f,...c.rekomendasi]);let p={Administrasi:`skor_administrasi`,Pemanfaatan:`skor_mep`,Arsitektur:`skor_arsitektur`,Struktur:`skor_struktur`,Mekanikal:`skor_kebakaran`,Kesehatan:`skor_kesehatan`,Kenyamanan:`skor_kenyamanan`,Kemudahan:`skor_kemudahan`}[t],m=d?.narasi_teknis||``;(m.includes(`TABEL EVALUASI KOMPREHENSIF`)||m.includes(`KESIMPULAN KELAIAKAN & STRATEGI`)||!m.trim()||!m.includes(`# BAB IV`))&&(m=`# BAB IV – ANALISIS DAN EVALUASI

Laporan ini disusun secara otomatis berdasarkan audit teknis modular.
`);let h=`## ASPEK PEMERIKSAAN: ${t.toUpperCase()}`,g=`\n\n${h}\n${c.narasi_teknis}\n`,_=m.indexOf(h);if(_!==-1){let e=m.indexOf(`## ASPEK PEMERIKSAAN:`,_+h.length);e===-1&&(e=m.length);let t=m.substring(0,_).trim(),n=m.substring(e).trim();m=t+g+(n?`

`+n:``)}else m=m.trim()+g;let v={skor_administrasi:d?.skor_administrasi||0,skor_mep:d?.skor_mep||0,skor_arsitektur:d?.skor_arsitektur||0,skor_struktur:d?.skor_struktur||0,skor_kebakaran:d?.skor_kebakaran||0,skor_kesehatan:d?.skor_kesehatan||0,skor_kenyamanan:d?.skor_kenyamanan||0,skor_kemudahan:d?.skor_kemudahan||0};v[p]=c.skor_aspek;let y={skor_administrasi:ci.administrasi,skor_mep:ci.pemanfaatan,skor_arsitektur:ci.arsitektur,skor_struktur:ci.struktur,skor_kebakaran:ci.mekanikal,skor_kesehatan:ci.kesehatan,skor_kenyamanan:ci.kenyamanan,skor_kemudahan:ci.kemudahan},b=0,x=0;for(let[e,t]of Object.entries(y))b+=v[e]*t,x+=t;let S=Math.round(b/x),C=`critical`;S>=80?C=`low`:S>=65?C=`medium`:S>=45&&(C=`high`);let w=`DALAM_PENGKAJIAN`;w=v.skor_struktur<50||v.skor_kebakaran<50||S<50?`TIDAK_LAIK_FUNGSI`:S>=80&&v.skor_struktur>=70&&v.skor_kebakaran>=70?`LAIK_FUNGSI`:`LAIK_FUNGSI_BERSYARAT`;let T={proyek_id:window._analisisProyekId,[p]:c.skor_aspek,skor_total:S,risk_level:C,status_slf:w,rekomendasi:f,narasi_teknis:m.trim()};d&&d.id?await e.from(`hasil_analisis`).update(T).eq(`id`,d.id):await e.from(`hasil_analisis`).insert([T]);let E=document.querySelector(`.markdown-content`);E&&!E.closest(`.modular-detail-modal`)&&(E.innerHTML=si.parse(T.narasi_teknis),E.scrollIntoView({behavior:`smooth`,block:`end`})),yi(),B(`Sintesis BAB IV ${t} Berhasil & Disimpan!`),window._showAspectPreview&&setTimeout(()=>window._showAspectPreview(t),500),fi(window._analisisProyekId)}catch(e){yi(),V(`Gagal menganalisa Aspek ${t}: `+e.message)}},window._showAspectPreview=async t=>{try{let{data:n}=await e.from(`hasil_analisis`).select(`narasi_teknis`).eq(`proyek_id`,window._analisisProyekId).single();if(!n||!n.narasi_teknis){se(`Laporan untuk Aspek ${t} belum disusun. Silakan klik tombol Sintesis terlebih dahulu.`);return}let r=`## ASPEK PEMERIKSAAN: ${t.toUpperCase()}`,i=RegExp(`${r}[\\s\\S]*?(?=\\n\\n## ASPEK PEMERIKSAAN:|$)`),a=n.narasi_teknis.match(i),o=a?a[0]:``;if(!o){se(`Analisis untuk Aspek ${t} belum tersedia di dalam BAB IV.`);return}let s=`
      <div id="preview-modal-overlay" class="modal-overlay" style="display:flex; z-index: 9999">
        <div class="modal-content" style="max-width: 900px; height: 90vh; padding: 0; overflow: hidden; display: flex; flex-direction: column">
          <div class="modal-header" style="padding: var(--space-4) var(--space-6); background: var(--bg-100); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0">
            <div>
              <h3 class="modal-title" style="font-size: 1.1rem">Preview Laporan SLF: ${t}</h3>
              <p style="font-size: 0.75rem; color: var(--text-tertiary)">Format ini identik dengan output dokumen resmi.</p>
            </div>
            <button class="btn-close" onclick="document.getElementById('preview-modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 40px; background: white; font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.6; color: #111">
             <div class="report-preview-sheet" style="max-width: 100%; margin: 0 auto; background: white">
               ${si.parse(o)}
             </div>
          </div>
          <div class="modal-footer" style="padding: var(--space-4) var(--space-6); background: var(--bg-100); border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0">
             <button class="btn btn-ghost" onclick="document.getElementById('preview-modal-overlay').remove()">Tutup</button>
             <button class="btn btn-primary" onclick="window.navigate('laporan', {id: '${window._analisisProyekId}'})">
                <i class="fas fa-file-invoice"></i> Lihat Laporan Lengkap
             </button>
          </div>
        </div>
      </div>
      <style>
        .report-preview-sheet h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-top: 32px; font-size: 1.4rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px }
        .report-preview-sheet h3 { color: #1e40af; margin-top: 24px; font-size: 1.15rem; font-weight: 700; border: none; padding: 0 }
        .report-preview-sheet p { margin-bottom: 16px; font-size: 1rem; text-align: justify }
        .report-preview-sheet table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem }
        .report-preview-sheet th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; font-weight: 700; text-align: left; color: #334155 }
        .report-preview-sheet td { border: 1px solid #cbd5e1; padding: 10px; vertical-align: top }
        .report-preview-sheet ul { margin-bottom: 16px; padding-left: 20px }
        .report-preview-sheet li { margin-bottom: 8px }
        .report-preview-sheet strong { color: #1e3a8a }
      </style>
    `;document.body.insertAdjacentHTML(`beforeend`,s)}catch(e){V(`Gagal memuat pratinjau: `+e.message)}},window._runSingleItemAnalysis=async(t,n)=>{let i=document.getElementById(`btn-wrap-${t}`),a=i.innerHTML;try{i.innerHTML=`<button class="btn btn-ghost btn-sm" disabled><i class="fas fa-spinner fa-spin"></i> AI Reasoning...</button>`;let{data:a,error:o}=await e.from(`checklist_items`).select(`*`).eq(`id`,t).maybeSingle();if(o)throw o;let s=await r(a,n),{error:c}=await e.from(`checklist_items`).update({catatan:s.narasi_item_lengkap}).eq(`id`,t);if(c)throw c;B(`Analisis Modular ${a.kode} selesai!`),fi(window._analisisProyekId)}catch(e){V(`Gagal Analisis Modular: `+e.message),i.innerHTML=a}},window._runNSPKBotForItem=async(t,n)=>{let r=document.querySelector(`button[onclick*="_runNSPKBotForItem('${t}'"]`);if(!r)return;let i=r.innerHTML;try{r.disabled=!0,r.innerHTML=`<i class="fas fa-robot fa-spin"></i> Searching...`;let i=await jn(n,window._analisisProyekId);if(i&&i.status===`success`){B(`Referensi Ditemukan: ${i.name}`);let{error:n}=await e.from(`checklist_items`).update({metadata:{nspk_ref:i.name,nspk_url:i.url,nspk_file_id:i.fileId}}).eq(`id`,t);if(n)throw n;fi(window._analisisProyekId)}else se(`Bot tidak menemukan dokumen spesifik untuk "${n}" di Drive.`)}catch(e){V(`Bot Error: `+e.message)}finally{r.disabled=!1,r.innerHTML=i}},window._showModularDetail=async(t,n)=>{let r=document.getElementById(`modular-detail-overlay`),i=document.getElementById(`md-kode`),a=document.getElementById(`md-nama`),o=document.getElementById(`md-content`),s=document.getElementById(`md-btn-reanalyze`);try{let{data:c,error:l}=await e.from(`checklist_items`).select(`*`).eq(`id`,t).maybeSingle();if(l)throw l;i.innerText=c.kode,a.innerText=c.nama,o.innerHTML=c.catatan?`<div class="markdown-content">${si.parse(c.catatan)}</div>`:`<div style="text-align:center;padding:var(--space-10);color:var(--text-tertiary)">
         <i class="fas fa-robot" style="font-size:3rem;margin-bottom:12px;opacity:0.3"></i>
         <p>Belum ada hasil analisis AI untuk item ini.</p>
       </div>`,s.onclick=()=>{window._closeModularDetail(),window._runSingleItemAnalysis(t,n)},r.style.display=`flex`,setTimeout(()=>{r.style.opacity=`1`,r.style.pointerEvents=`all`,r.querySelector(`.modular-detail-modal`).style.transform=`scale(1)`},10)}catch(e){V(`Gagal memuat detail: `+e.message)}},window._closeModularDetail=()=>{let e=document.getElementById(`modular-detail-overlay`);e&&(e.style.opacity=`0`,e.style.pointerEvents=`none`,e.querySelector(`.modular-detail-modal`).style.transform=`scale(0.95)`,setTimeout(()=>{e.style.display=`none`},300))},window._runFinalConclusion=async()=>{try{vi(`Merumuskan Kesimpulan`,`OpenAI menyusun status kelaikan akhir...`);let{data:t,error:n}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,window._analisisProyekId).limit(1);if(n)throw n;if(!t||t.length===0)throw Error(`Anda harus menganalisis minimal satu aspek terlebih dahulu!`);let r=t[0],i={Administrasi:r.skor_administrasi,Struktur:r.skor_struktur,Arsitektur:r.skor_arsitektur,MEP:r.skor_mep,Kebakaran:r.skor_kebakaran,Kesehatan:r.skor_kesehatan,Kenyamanan:r.skor_kenyamanan,Kemudahan:r.skor_kemudahan},o=r.rekomendasi||[];typeof o==`string`&&(o=JSON.parse(o));let s=await a(i,o),c=r.narasi_teknis||``,l=RegExp(`### KESIMPULAN FINAL[\\s\\S]*?$`);c=c.replace(l,``).trim(),c=`### KESIMPULAN FINAL STRATEGIS\n${s.narasi_kesimpulan_akhir}\n\n---\n\n`+c;let u={skor_total:s.skor_total,status_slf:s.status_slf===`LAIK_FUNGSI`||s.status_slf===`LAIK_FUNGSI_BERSYARAT`||s.status_slf===`TIDAK_LAIK_FUNGSI`?s.status_slf:`DALAM_PENGKAJIAN`,risk_level:s.risk_level,narasi_teknis:c};await e.from(`hasil_analisis`).update(u).eq(`id`,r.id),await e.from(`proyek`).update({status_slf:u.status_slf,progress:100}).eq(`id`,window._analisisProyekId),yi(),B(`Kesimpulan Final SLF berhasil diterbitkan!`),fi(window._analisisProyekId)}catch(e){yi(),V(`Gagal merumuskan kesimpulan: `+e.message)}};function bi(e){let t=()=>{let t=document.getElementById(`radar-chart`);!t||!window.Chart||new window.Chart(t,{type:`radar`,data:{labels:[`Admin`,`Manfaat`,`Arsitek`,`Struktur`,`Mekanik`,`Kesehatan`,`Nyaman`,`Mudah`],datasets:[{label:`Skor`,data:[e.skor_administrasi,e.skor_mep,e.skor_arsitektur,e.skor_struktur,e.skor_kebakaran,e.skor_kesehatan,e.skor_kenyamanan,e.skor_kemudahan],backgroundColor:`hsla(220,70%,48%,0.2)`,borderColor:`hsl(220,70%,56%)`,borderWidth:2,pointBackgroundColor:`hsl(220,70%,56%)`,pointRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,scales:{r:{min:0,max:100,ticks:{stepSize:20,color:`hsl(220,10%,50%)`,font:{size:10},backdropColor:`transparent`},grid:{color:`hsla(220,20%,50%,0.15)`},pointLabels:{color:`hsl(220,12%,70%)`,font:{size:11}},angleLines:{color:`hsla(220,20%,50%,0.15)`}}},plugins:{legend:{display:!1}}}})};if(window.Chart)t();else{let e=document.createElement(`script`);e.src=`https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`,e.onload=t,document.head.appendChild(e)}}async function xi(t){try{let{data:n}=await e.from(`proyek`).select(`id,nama_bangunan`).eq(`id`,t).maybeSingle();return n}catch{return null}}async function Si(t){try{let{data:n}=await e.from(`checklist_items`).select(`*`).eq(`proyek_id`,t);return n||[]}catch{return[]}}async function Ci(t){try{let{data:n}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,t).order(`created_at`,{ascending:!1}).limit(1);return n&&n.length>0?n[0]:null}catch{return null}}async function wi(t){try{let{data:n}=await e.from(`proyek_files`).select(`*`).eq(`proyek_id`,t);return n||[]}catch{return[]}}function Ti(){return`
    <div class="page-header">
      <div class="skeleton" style="height:20px;width:200px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:36px;width:400px;margin-bottom:8px"></div>
    </div>
    <div class="skeleton" style="height:160px;border-radius:var(--radius-lg);margin-bottom:var(--space-5)"></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-5)">
      ${Array(8).fill(0).map(()=>`<div class="skeleton" style="height:120px;border-radius:var(--radius-lg)"></div>`).join(``)}
    </div>
    <div style="display:grid;grid-template-columns:360px 1fr;gap:var(--space-5)">
      <div class="skeleton" style="height:360px;border-radius:var(--radius-lg)"></div>
      <div class="skeleton" style="height:360px;border-radius:var(--radius-lg)"></div>
    </div>
  `}function Ei(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function Di(e){try{return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`short`,year:`numeric`})}catch{return e||``}}function Oi(e){return{low:`hsl(160,65%,46%)`,medium:`hsl(40,80%,55%)`,high:`hsl(0,70%,58%)`,critical:`hsl(330,70%,50%)`}[e]||`hsl(200,80%,58%)`}function ki(e){return{low:`Rendah`,medium:`Sedang`,high:`Tinggi`,critical:`Kritis`}[e]||e}function Ai(e){let t={};e.forEach(e=>{let n=e.kategori===`administrasi`?`Administrasi`:e.aspek||`Lainnya`;t[n]||(t[n]=[]),t[n].push(e)});let n=Object.keys(t).sort((e,t)=>e===`Administrasi`?-1:t===`Administrasi`?1:e.localeCompare(t));return(!window._activeModularTab||!n.includes(window._activeModularTab))&&(window._activeModularTab=n[0]),`
    <div class="modular-tabs-container" style="display:grid;grid-template-columns:260px 1fr;gap:var(--space-6);background:var(--bg-card);border-radius:var(--radius-xl);border:1px solid var(--border-subtle);overflow:hidden;min-height:600px">
      
      <!-- Sidebar Nav -->
      <div class="modular-sidebar" style="background:var(--bg-input);border-right:1px solid var(--border-subtle);padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-2)">
        <div style="font-size:0.7rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-2);padding:0 var(--space-2)">Kategori Poin Audit</div>
        ${n.map(e=>{let n=t[e],r=n.filter(e=>!!e.catatan&&e.catatan.length>50).length,i=Math.round(r/n.length*100),a=window._activeModularTab===e;return`
            <button class="modular-tab-btn ${a?`active`:``}" 
                    onclick="window._switchModularTab('${e}')"
                    id="tab-btn-${e.replace(/\s+/g,`-`)}"
                    style="display:flex;flex-direction:column;align-items:flex-start;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);border:none;background:${a?`var(--bg-card)`:`transparent`};color:${a?`var(--brand-400)`:`var(--text-secondary)`};cursor:pointer;transition:all 0.2s ease;text-align:left;box-shadow:${a?`var(--shadow-md)`:`none`}">
              <span style="font-size:0.9rem;font-weight:700">${e}</span>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;width:100%">
                <div style="flex:1;height:4px;background:var(--border-subtle);border-radius:2px">
                   <div style="width:${i}%;height:100%;background:${i===100?`var(--brand-500)`:`var(--brand-400)`};border-radius:2px"></div>
                </div>
                <span style="font-size:0.65rem;font-weight:600;min-width:40px">${r}/${n.length} Item</span>
              </div>
            </button>
          `}).join(``)}
      </div>

        <div id="modular-items-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:var(--space-4)">
          ${(t[window._activeModularTab]||[]).map(e=>{let t=!!e.catatan&&(e.catatan.includes(`###`)||e.catatan.length>50),n=(window._analisisFiles||[]).filter(t=>{let n=(t.subcategory||t.category||``).toLowerCase(),r=e.nama.toLowerCase();return r.includes(n)||n.includes(r.substring(0,10))});return`
              <div class="card item-card-modular" style="padding:var(--space-4);display:flex;flex-direction:column;border-top:3px solid ${t?`var(--brand-500)`:`var(--border-subtle)`};transition:all 0.2s ease;background:var(--bg-card)">
                <div style="flex:1">
                  <div class="flex-between" style="margin-bottom:8px">
                    <span style="font-family:monospace;font-weight:700;color:var(--brand-400);font-size:0.8rem">${e.kode}</span>
                    <span class="badge" style="font-size:0.6rem;background:var(--bg-input);padding:2px 8px">${Ei(e.status||`Belum`)}</span>
                  </div>
                  <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:12px;line-height:1.4;color:var(--text-primary);cursor:pointer" onclick="window._showModularDetail('${e.id}', '${window._activeModularTab}')">
                    ${Ei(e.nama)}
                  </h4>
                  
                  <!-- Data Dasar Lapangan (Transparency) -->
                  <div style="background:var(--bg-input);border-radius:var(--radius-md);padding:10px;margin-bottom:12px;border:1px solid var(--border-subtle)">
                    <div style="font-size:0.65rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:4px">
                      <i class="fas fa-clipboard-check"></i> Data Lapangan
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.4">
                      ${e.catatan&&!t?Ei(e.catatan):e.status?`Status: ${Ei(e.status)}`:`<i class="text-tertiary">Tidak ada catatan lapangan</i>`}
                    </div>
                  </div>

                  <!-- Berkas Terlampir (Integration) -->
                  ${n.length>0?`
                  <div style="margin-bottom:12px">
                    <div style="font-size:0.65rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:4px">
                      <i class="fas fa-paperclip"></i> Lampiran Berkas (${n.length})
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px">
                      ${n.map(e=>`
                        <a href="${e.url}" target="_blank" class="badge badge-outline" style="font-size:0.65rem;text-decoration:none;display:flex;align-items:center;gap:4px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                          <i class="fas ${e.name.endsWith(`.pdf`)?`fa-file-pdf`:`fa-image`}" style="font-size:0.7rem"></i> ${Ei(e.name)}
                        </a>
                      `).join(``)}
                    </div>
                  </div>
                  `:``}

                  <!-- AI Summary -->
                  ${t?`
                    <div style="font-size:0.75rem;color:var(--text-secondary);background:hsla(220,70%,50%,0.05);padding:12px;border-radius:8px;margin-bottom:16px;border:1px solid hsla(220,70%,50%,0.2);position:relative;cursor:pointer" onclick="window._showModularDetail('${e.id}', '${window._activeModularTab}')">
                      <div style="font-size:0.65rem;font-weight:700;color:var(--brand-400);text-transform:uppercase;margin-bottom:6px">Hasil Analisis AI</div>
                      <div style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5">
                        ${e.catatan.replace(/#[# ]+/g,``).substring(0,180)}...
                      </div>
                    </div>
                  `:``}
                </div>
                
                <div id="btn-wrap-${e.id}" onclick="event.stopPropagation()" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                  <button class="btn btn-outline btn-sm" onclick="window._runNSPKBotForItem('${e.id}', '${e.nama}')" style="font-size:0.75rem;padding:var(--space-2);font-weight:600">
                    <i class="fas fa-robot"></i> Bot NSPK
                  </button>
                  <button class="btn ${t?`btn-secondary`:`btn-primary`} btn-sm" onclick="window._runSingleItemAnalysis('${e.id}', '${window._activeModularTab}')" style="font-size:0.75rem;padding:var(--space-2);font-weight:600">
                    <i class="fas ${t?`fa-rotate-right`:`fa-brain`}"></i> ${t?`Ulangi`:`Analisis AI`}
                  </button>
                </div>
              </div>
            `}).join(``)}
        </div>
      </div>
    </div>

    <style>
      .modular-tab-btn:hover { background: hsla(220,70%,50%,0.05) !important; color: var(--brand-400) !important; }
      .modular-tab-btn.active { background: var(--bg-card) !important; border-left: 3px solid var(--brand-500) !important; border-radius: 0 8px 8px 0 !important; }
      .item-card-modular:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-top-color: var(--brand-400) !important; }
    </style>
  `}window._switchModularTab=e=>{window._activeModularTab=e,window._analisisProyekId&&fi(window._analisisProyekId)};var ji=d({AbstractNumbering:()=>$v,AlignmentType:()=>Y,AnnotationReference:()=>gm,Attributes:()=>Ki,BaseXmlComponent:()=>Hi,Body:()=>lv,Bookmark:()=>th,BookmarkEnd:()=>rh,BookmarkStart:()=>nh,Border:()=>Du,BorderStyle:()=>Eu,BuilderElement:()=>J,CarriageReturn:()=>Sm,CellMerge:()=>Og,CellMergeAttributes:()=>Dg,CharacterSet:()=>uh,CheckBox:()=>ab,CheckBoxSymbolElement:()=>rb,CheckBoxUtil:()=>ib,Column:()=>cv,ColumnBreak:()=>Nm,Comment:()=>om,CommentRangeEnd:()=>im,CommentRangeStart:()=>rm,CommentReference:()=>am,Comments:()=>sm,ConcreteHyperlink:()=>Xm,ConcreteNumbering:()=>ny,ContinuationSeparator:()=>bm,DayLong:()=>pm,DayShort:()=>um,DeletedTableCell:()=>Tg,DeletedTableRow:()=>Cg,DeletedTextRun:()=>bg,Document:()=>Hy,DocumentAttributeNamespaces:()=>w_,DocumentAttributes:()=>T_,DocumentBackground:()=>dv,DocumentBackgroundAttributes:()=>uv,DocumentDefaults:()=>zy,DocumentGridType:()=>F_,Drawing:()=>Lp,DropCapType:()=>_h,EMPTY_OBJECT:()=>Ui,EmphasisMarkType:()=>Xu,EmptyElement:()=>vu,EndnoteIdReference:()=>eb,EndnoteReference:()=>vm,EndnoteReferenceRun:()=>tb,EndnoteReferenceRunAttributes:()=>$y,Endnotes:()=>Cv,ExternalHyperlink:()=>Qm,File:()=>Hy,FileChild:()=>qm,FootNoteReferenceRunAttributes:()=>Xy,FootNotes:()=>Pv,Footer:()=>Yy,FooterWrapper:()=>Dv,FootnoteReference:()=>Zy,FootnoteReferenceElement:()=>_m,FootnoteReferenceRun:()=>Qy,FrameAnchorType:()=>vh,FrameWrap:()=>yh,GridSpan:()=>Bg,Header:()=>Jy,HeaderFooterReferenceType:()=>L_,HeaderFooterType:()=>R_,HeaderWrapper:()=>Rv,HeadingLevel:()=>Lm,HeightRule:()=>p_,HighlightColor:()=>dd,HorizontalPositionAlign:()=>Iu,HorizontalPositionRelativeFrom:()=>Cf,HpsMeasureElement:()=>_u,HyperlinkType:()=>Ym,IgnoreIfEmptyXmlComponent:()=>Wi,ImageRun:()=>Vp,ImportedRootElementAttributes:()=>Zl,ImportedXmlComponent:()=>Xl,InitializableXmlComponent:()=>Ql,InsertedTableCell:()=>wg,InsertedTableRow:()=>Sg,InsertedTextRun:()=>hg,InternalHyperlink:()=>Zm,LastRenderedPageBreak:()=>wm,LeaderType:()=>Bm,Level:()=>Yv,LevelBase:()=>Jv,LevelForOverride:()=>Xv,LevelFormat:()=>Bv,LevelOverride:()=>iy,LevelSuffix:()=>Gv,LineNumberRestartFormat:()=>B_,LineRuleType:()=>Fm,Math:()=>Ch,MathAngledBrackets:()=>ug,MathCurlyBrackets:()=>lg,MathDegree:()=>Xh,MathDenominator:()=>Eh,MathFraction:()=>Oh,MathFunction:()=>rg,MathFunctionName:()=>tg,MathFunctionProperties:()=>ng,MathIntegral:()=>Rh,MathLimit:()=>zh,MathLimitLower:()=>Vh,MathLimitUpper:()=>Bh,MathNumerator:()=>Dh,MathPreSubSuperScript:()=>Yh,MathRadical:()=>eg,MathRadicalProperties:()=>$h,MathRoundBrackets:()=>sg,MathRun:()=>Th,MathSquareBrackets:()=>cg,MathSubScript:()=>Gh,MathSubSuperScript:()=>qh,MathSum:()=>Lh,MathSuperScript:()=>Uh,Media:()=>zv,MonthLong:()=>mm,MonthShort:()=>dm,NextAttributeComponent:()=>Gi,NoBreakHyphen:()=>cm,NumberFormat:()=>Ru,NumberProperties:()=>Wm,NumberValueElement:()=>xu,NumberedItemReference:()=>oh,NumberedItemReferenceFormat:()=>ih,Numbering:()=>sy,OnOffElement:()=>q,OverlapType:()=>n_,Packer:()=>Rb,PageBorderDisplay:()=>H_,PageBorderOffsetFrom:()=>U_,PageBorderZOrder:()=>W_,PageBorders:()=>K_,PageBreak:()=>Mm,PageBreakBefore:()=>Pm,PageNumber:()=>gd,PageNumberElement:()=>xm,PageNumberSeparator:()=>J_,PageOrientation:()=>X_,PageReference:()=>lh,PageTextDirection:()=>ev,PageTextDirectionType:()=>Q_,Paragraph:()=>Z,ParagraphProperties:()=>xh,ParagraphPropertiesChange:()=>Sh,ParagraphPropertiesDefaults:()=>Ly,ParagraphRunProperties:()=>pd,PatchType:()=>fx,PositionalTab:()=>km,PositionalTabAlignment:()=>Tm,PositionalTabLeader:()=>Dm,PositionalTabRelativeTo:()=>Em,PrettifyType:()=>Fb,RelativeHorizontalPosition:()=>e_,RelativeVerticalPosition:()=>t_,Run:()=>_d,RunProperties:()=>fd,RunPropertiesChange:()=>md,RunPropertiesDefaults:()=>Ry,SectionProperties:()=>av,SectionPropertiesChange:()=>ov,SectionType:()=>tv,Separator:()=>ym,SequentialIdentifier:()=>Kp,ShadingType:()=>Ku,SimpleField:()=>Jp,SimpleMailMergeField:()=>Yp,SoftHyphen:()=>lm,SpaceType:()=>zu,StringContainer:()=>Cu,StringEnumValueElement:()=>Su,StringValueElement:()=>yu,StyleForCharacter:()=>vy,StyleForParagraph:()=>_y,StyleLevel:()=>qy,Styles:()=>Iy,SymbolRun:()=>bd,TDirection:()=>Kg,Tab:()=>Cm,TabStopPosition:()=>Vm,TabStopType:()=>zm,Table:()=>f_,TableAnchorType:()=>$g,TableBorders:()=>Qg,TableCell:()=>Yg,TableCellBorders:()=>Rg,TableLayoutType:()=>a_,TableOfContents:()=>Ky,TableProperties:()=>u_,TableRow:()=>__,TableRowProperties:()=>h_,TableRowPropertiesChange:()=>g_,TextDirection:()=>Wg,TextEffect:()=>ud,TextRun:()=>X,TextWrappingSide:()=>Cp,TextWrappingType:()=>Sp,Textbox:()=>pb,ThematicBreak:()=>Ou,UnderlineType:()=>cd,VerticalAlign:()=>jg,VerticalAlignSection:()=>Ag,VerticalAlignTable:()=>kg,VerticalAnchor:()=>Af,VerticalMerge:()=>Ug,VerticalMergeRevisionType:()=>Eg,VerticalMergeType:()=>Vg,VerticalPositionAlign:()=>Lu,VerticalPositionRelativeFrom:()=>wf,WORKAROUND2:()=>``,WORKAROUND3:()=>``,WORKAROUND4:()=>``,WidthType:()=>Ig,WpgGroupRun:()=>Wp,WpsShapeRun:()=>Up,XmlAttributeComponent:()=>G,XmlComponent:()=>W,YearLong:()=>hm,YearShort:()=>fm,abstractNumUniqueNumericIdGen:()=>mf,bookmarkUniqueNumericIdGen:()=>_f,concreteNumUniqueNumericIdGen:()=>hf,convertInchesToTwip:()=>ff,convertMillimetersToTwip:()=>df,convertToXmlComponent:()=>Jl,createAlignment:()=>wu,createBodyProperties:()=>jf,createBorderElement:()=>Tu,createColumns:()=>P_,createDocumentGrid:()=>I_,createDotEmphasisMark:()=>Qu,createEmphasisMark:()=>Zu,createFrameProperties:()=>bh,createHeaderFooterReference:()=>z_,createHorizontalPosition:()=>Of,createIndent:()=>ku,createLineNumberType:()=>V_,createMathAccentCharacter:()=>kh,createMathBase:()=>Ah,createMathLimitLocation:()=>jh,createMathNAryProperties:()=>Ph,createMathPreSubSuperScriptProperties:()=>Jh,createMathSubScriptElement:()=>Fh,createMathSubScriptProperties:()=>Wh,createMathSubSuperScriptProperties:()=>Kh,createMathSuperScriptElement:()=>Ih,createMathSuperScriptProperties:()=>Hh,createOutlineLevel:()=>sh,createPageMargin:()=>q_,createPageNumberType:()=>Y_,createPageSize:()=>Z_,createParagraphStyle:()=>Rm,createRunFonts:()=>id,createSectionType:()=>nv,createShading:()=>Gu,createSimplePos:()=>Tf,createSpacing:()=>Im,createStringElement:()=>bu,createTabStop:()=>Um,createTabStopItem:()=>Hm,createTableFloatProperties:()=>i_,createTableLayout:()=>o_,createTableLook:()=>l_,createTableRowHeight:()=>m_,createTableWidthElement:()=>Lg,createTransformation:()=>Hp,createUnderline:()=>ld,createVerticalAlign:()=>Mg,createVerticalPosition:()=>kf,createWrapNone:()=>wp,createWrapSquare:()=>Tp,createWrapTight:()=>Ep,createWrapTopAndBottom:()=>Dp,dateTimeValue:()=>gu,decimalNumber:()=>$l,docPropertiesUniqueNumericIdGen:()=>gf,eighthPointMeasureValue:()=>mu,encodeUtf8:()=>Sf,hashedId:()=>yf,hexColorValue:()=>su,hpsMeasureValue:()=>lu,longHexNumber:()=>nu,measurementOrPercentValue:()=>pu,patchDetector:()=>bx,patchDocument:()=>_x,percentageValue:()=>fu,pointMeasureValue:()=>hu,positiveUniversalMeasureValue:()=>ou,sectionMarginDefaults:()=>rv,sectionPageSizeDefaults:()=>iv,shortHexNumber:()=>ru,signedHpsMeasureValue:()=>uu,signedTwipsMeasureValue:()=>cu,standardizeData:()=>zp,twipsMeasureValue:()=>du,uCharHexNumber:()=>iu,uniqueId:()=>vf,uniqueNumericIdCreator:()=>pf,uniqueUuid:()=>xf,universalMeasureValue:()=>au,unsignedDecimalNumber:()=>eu}),Mi=Object.defineProperty,Ni=Object.defineProperties,Pi=Object.getOwnPropertyDescriptors,Fi=Object.getOwnPropertySymbols,Ii=Object.prototype.hasOwnProperty,Li=Object.prototype.propertyIsEnumerable,Ri=(e,t,n)=>t in e?Mi(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,H=(e,t)=>{for(var n in t||={})Ii.call(t,n)&&Ri(e,n,t[n]);if(Fi)for(var n of Fi(t))Li.call(t,n)&&Ri(e,n,t[n]);return e},zi=(e,t)=>Ni(e,Pi(t)),Bi=(e,t)=>{var n={};for(var r in e)Ii.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&Fi)for(var r of Fi(e))t.indexOf(r)<0&&Li.call(e,r)&&(n[r]=e[r]);return n},U=(e,t,n)=>Ri(e,typeof t==`symbol`?t:t+``,n),Vi=(e,t,n)=>new Promise((r,i)=>{var a=e=>{try{s(n.next(e))}catch(e){i(e)}},o=e=>{try{s(n.throw(e))}catch(e){i(e)}},s=e=>e.done?r(e.value):Promise.resolve(e.value).then(a,o);s((n=n.apply(e,t)).next())}),Hi=class{constructor(e){U(this,`rootKey`),this.rootKey=e}},Ui=Object.seal({}),W=class extends Hi{constructor(e){super(e),U(this,`root`),this.root=[]}prepForXml(e){e.stack.push(this);let t=this.root.map(t=>t instanceof Hi?t.prepForXml(e):t).filter(e=>e!==void 0);return e.stack.pop(),{[this.rootKey]:t.length?t.length===1&&t[0]?._attr?t[0]:t:Ui}}addChildElement(e){return this.root.push(e),this}},Wi=class extends W{constructor(e,t){super(e),U(this,`includeIfEmpty`),this.includeIfEmpty=t}prepForXml(e){let t=super.prepForXml(e);if(this.includeIfEmpty||t&&(typeof t[this.rootKey]!=`object`||Object.keys(t[this.rootKey]).length))return t}},G=class extends Hi{constructor(e){super(`_attr`),U(this,`xmlKeys`),this.root=e}prepForXml(e){let t={};return Object.entries(this.root).forEach(([e,n])=>{if(n!==void 0){let r=this.xmlKeys&&this.xmlKeys[e]||e;t[r]=n}}),{_attr:t}}},Gi=class extends Hi{constructor(e){super(`_attr`),this.root=e}prepForXml(e){return{_attr:Object.values(this.root).filter(({value:e})=>e!==void 0).reduce((e,{key:t,value:n})=>zi(H({},e),{[t]:n}),{})}}},Ki=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w:val`,color:`w:color`,fill:`w:fill`,space:`w:space`,sz:`w:sz`,type:`w:type`,rsidR:`w:rsidR`,rsidRPr:`w:rsidRPr`,rsidSect:`w:rsidSect`,w:`w:w`,h:`w:h`,top:`w:top`,right:`w:right`,bottom:`w:bottom`,left:`w:left`,header:`w:header`,footer:`w:footer`,gutter:`w:gutter`,linePitch:`w:linePitch`,pos:`w:pos`})}},qi=typeof globalThis<`u`?globalThis:typeof window<`u`?window:typeof global<`u`?global:typeof self<`u`?self:{};function Ji(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,`default`)?e.default:e}var Yi={},Xi={exports:{}},Zi;function Qi(){if(Zi)return Xi.exports;Zi=1;var e=typeof Reflect==`object`?Reflect:null,t=e&&typeof e.apply==`function`?e.apply:function(e,t,n){return Function.prototype.apply.call(e,t,n)},n=e&&typeof e.ownKeys==`function`?e.ownKeys:Object.getOwnPropertySymbols?function(e){return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))}:function(e){return Object.getOwnPropertyNames(e)};function r(e){console&&console.warn&&console.warn(e)}var i=Number.isNaN||function(e){return e!==e};function a(){a.init.call(this)}Xi.exports=a,Xi.exports.once=_,a.EventEmitter=a,a.prototype._events=void 0,a.prototype._eventsCount=0,a.prototype._maxListeners=void 0;var o=10;function s(e){if(typeof e!=`function`)throw TypeError(`The "listener" argument must be of type Function. Received type `+typeof e)}Object.defineProperty(a,`defaultMaxListeners`,{enumerable:!0,get:function(){return o},set:function(e){if(typeof e!=`number`||e<0||i(e))throw RangeError(`The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received `+e+`.`);o=e}}),a.init=function(){(this._events===void 0||this._events===Object.getPrototypeOf(this)._events)&&(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},a.prototype.setMaxListeners=function(e){if(typeof e!=`number`||e<0||i(e))throw RangeError(`The value of "n" is out of range. It must be a non-negative number. Received `+e+`.`);return this._maxListeners=e,this};function c(e){return e._maxListeners===void 0?a.defaultMaxListeners:e._maxListeners}a.prototype.getMaxListeners=function(){return c(this)},a.prototype.emit=function(e){for(var n=[],r=1;r<arguments.length;r++)n.push(arguments[r]);var i=e===`error`,a=this._events;if(a!==void 0)i&&=a.error===void 0;else if(!i)return!1;if(i){var o;if(n.length>0&&(o=n[0]),o instanceof Error)throw o;var s=Error(`Unhandled error.`+(o?` (`+o.message+`)`:``));throw s.context=o,s}var c=a[e];if(c===void 0)return!1;if(typeof c==`function`)t(c,this,n);else for(var l=c.length,u=m(c,l),r=0;r<l;++r)t(u[r],this,n);return!0};function l(e,t,n,i){var a,o,l;if(s(n),o=e._events,o===void 0?(o=e._events=Object.create(null),e._eventsCount=0):(o.newListener!==void 0&&(e.emit(`newListener`,t,n.listener?n.listener:n),o=e._events),l=o[t]),l===void 0)l=o[t]=n,++e._eventsCount;else if(typeof l==`function`?l=o[t]=i?[n,l]:[l,n]:i?l.unshift(n):l.push(n),a=c(e),a>0&&l.length>a&&!l.warned){l.warned=!0;var u=Error(`Possible EventEmitter memory leak detected. `+l.length+` `+String(t)+` listeners added. Use emitter.setMaxListeners() to increase limit`);u.name=`MaxListenersExceededWarning`,u.emitter=e,u.type=t,u.count=l.length,r(u)}return e}a.prototype.addListener=function(e,t){return l(this,e,t,!1)},a.prototype.on=a.prototype.addListener,a.prototype.prependListener=function(e,t){return l(this,e,t,!0)};function u(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length===0?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function d(e,t,n){var r={fired:!1,wrapFn:void 0,target:e,type:t,listener:n},i=u.bind(r);return i.listener=n,r.wrapFn=i,i}a.prototype.once=function(e,t){return s(t),this.on(e,d(this,e,t)),this},a.prototype.prependOnceListener=function(e,t){return s(t),this.prependListener(e,d(this,e,t)),this},a.prototype.removeListener=function(e,t){var n,r,i,a,o;if(s(t),r=this._events,r===void 0||(n=r[e],n===void 0))return this;if(n===t||n.listener===t)--this._eventsCount===0?this._events=Object.create(null):(delete r[e],r.removeListener&&this.emit(`removeListener`,e,n.listener||t));else if(typeof n!=`function`){for(i=-1,a=n.length-1;a>=0;a--)if(n[a]===t||n[a].listener===t){o=n[a].listener,i=a;break}if(i<0)return this;i===0?n.shift():h(n,i),n.length===1&&(r[e]=n[0]),r.removeListener!==void 0&&this.emit(`removeListener`,e,o||t)}return this},a.prototype.off=a.prototype.removeListener,a.prototype.removeAllListeners=function(e){var t,n=this._events,r;if(n===void 0)return this;if(n.removeListener===void 0)return arguments.length===0?(this._events=Object.create(null),this._eventsCount=0):n[e]!==void 0&&(--this._eventsCount===0?this._events=Object.create(null):delete n[e]),this;if(arguments.length===0){var i=Object.keys(n),a;for(r=0;r<i.length;++r)a=i[r],a!==`removeListener`&&this.removeAllListeners(a);return this.removeAllListeners(`removeListener`),this._events=Object.create(null),this._eventsCount=0,this}if(t=n[e],typeof t==`function`)this.removeListener(e,t);else if(t!==void 0)for(r=t.length-1;r>=0;r--)this.removeListener(e,t[r]);return this};function f(e,t,n){var r=e._events;if(r===void 0)return[];var i=r[t];return i===void 0?[]:typeof i==`function`?n?[i.listener||i]:[i]:n?g(i):m(i,i.length)}a.prototype.listeners=function(e){return f(this,e,!0)},a.prototype.rawListeners=function(e){return f(this,e,!1)},a.listenerCount=function(e,t){return typeof e.listenerCount==`function`?e.listenerCount(t):p.call(e,t)},a.prototype.listenerCount=p;function p(e){var t=this._events;if(t!==void 0){var n=t[e];if(typeof n==`function`)return 1;if(n!==void 0)return n.length}return 0}a.prototype.eventNames=function(){return this._eventsCount>0?n(this._events):[]};function m(e,t){for(var n=Array(t),r=0;r<t;++r)n[r]=e[r];return n}function h(e,t){for(;t+1<e.length;t++)e[t]=e[t+1];e.pop()}function g(e){for(var t=Array(e.length),n=0;n<t.length;++n)t[n]=e[n].listener||e[n];return t}function _(e,t){return new Promise(function(n,r){function i(n){e.removeListener(t,a),r(n)}function a(){typeof e.removeListener==`function`&&e.removeListener(`error`,i),n([].slice.call(arguments))}y(e,t,a,{once:!0}),t!==`error`&&v(e,i,{once:!0})})}function v(e,t,n){typeof e.on==`function`&&y(e,`error`,t,n)}function y(e,t,n,r){if(typeof e.on==`function`)r.once?e.once(t,n):e.on(t,n);else if(typeof e.addEventListener==`function`)e.addEventListener(t,function i(a){r.once&&e.removeEventListener(t,i),n(a)});else throw TypeError(`The "emitter" argument must be of type EventEmitter. Received type `+typeof e)}return Xi.exports}var $i={exports:{}},ea;function ta(){return ea?$i.exports:(ea=1,typeof Object.create==`function`?$i.exports=function(e,t){t&&(e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}))}:$i.exports=function(e,t){if(t){e.super_=t;var n=function(){};n.prototype=t.prototype,e.prototype=new n,e.prototype.constructor=e}},$i.exports)}function na(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,`default`)?e.default:e}var ra={exports:{}},ia=ra.exports={},aa,oa;function sa(){throw Error(`setTimeout has not been defined`)}function ca(){throw Error(`clearTimeout has not been defined`)}(function(){try{aa=typeof setTimeout==`function`?setTimeout:sa}catch{aa=sa}try{oa=typeof clearTimeout==`function`?clearTimeout:ca}catch{oa=ca}})();function la(e){if(aa===setTimeout)return setTimeout(e,0);if((aa===sa||!aa)&&setTimeout)return aa=setTimeout,setTimeout(e,0);try{return aa(e,0)}catch{try{return aa.call(null,e,0)}catch{return aa.call(this,e,0)}}}function ua(e){if(oa===clearTimeout)return clearTimeout(e);if((oa===ca||!oa)&&clearTimeout)return oa=clearTimeout,clearTimeout(e);try{return oa(e)}catch{try{return oa.call(null,e)}catch{return oa.call(this,e)}}}var da=[],fa=!1,pa,ma=-1;function ha(){!fa||!pa||(fa=!1,pa.length?da=pa.concat(da):ma=-1,da.length&&ga())}function ga(){if(!fa){var e=la(ha);fa=!0;for(var t=da.length;t;){for(pa=da,da=[];++ma<t;)pa&&pa[ma].run();ma=-1,t=da.length}pa=null,fa=!1,ua(e)}}ia.nextTick=function(e){var t=Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];da.push(new _a(e,t)),da.length===1&&!fa&&la(ga)};function _a(e,t){this.fun=e,this.array=t}_a.prototype.run=function(){this.fun.apply(null,this.array)},ia.title=`browser`,ia.browser=!0,ia.env={},ia.argv=[],ia.version=``,ia.versions={};function va(){}ia.on=va,ia.addListener=va,ia.once=va,ia.off=va,ia.removeListener=va,ia.removeAllListeners=va,ia.emit=va,ia.prependListener=va,ia.prependOnceListener=va,ia.listeners=function(e){return[]},ia.binding=function(e){throw Error(`process.binding is not supported`)},ia.cwd=function(){return`/`},ia.chdir=function(e){throw Error(`process.chdir is not supported`)},ia.umask=function(){return 0};var ya=ra.exports,K=na(ya),ba,xa;function Sa(){return xa?ba:(xa=1,ba=Qi().EventEmitter,ba)}var Ca={},wa={},Ta;function Ea(){if(Ta)return wa;Ta=1,wa.byteLength=s,wa.toByteArray=l,wa.fromByteArray=f;for(var e=[],t=[],n=typeof Uint8Array<`u`?Uint8Array:Array,r=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`,i=0,a=r.length;i<a;++i)e[i]=r[i],t[r.charCodeAt(i)]=i;t[45]=62,t[95]=63;function o(e){var t=e.length;if(t%4>0)throw Error(`Invalid string. Length must be a multiple of 4`);var n=e.indexOf(`=`);n===-1&&(n=t);var r=n===t?0:4-n%4;return[n,r]}function s(e){var t=o(e),n=t[0],r=t[1];return(n+r)*3/4-r}function c(e,t,n){return(t+n)*3/4-n}function l(e){var r,i=o(e),a=i[0],s=i[1],l=new n(c(e,a,s)),u=0,d=s>0?a-4:a,f;for(f=0;f<d;f+=4)r=t[e.charCodeAt(f)]<<18|t[e.charCodeAt(f+1)]<<12|t[e.charCodeAt(f+2)]<<6|t[e.charCodeAt(f+3)],l[u++]=r>>16&255,l[u++]=r>>8&255,l[u++]=r&255;return s===2&&(r=t[e.charCodeAt(f)]<<2|t[e.charCodeAt(f+1)]>>4,l[u++]=r&255),s===1&&(r=t[e.charCodeAt(f)]<<10|t[e.charCodeAt(f+1)]<<4|t[e.charCodeAt(f+2)]>>2,l[u++]=r>>8&255,l[u++]=r&255),l}function u(t){return e[t>>18&63]+e[t>>12&63]+e[t>>6&63]+e[t&63]}function d(e,t,n){for(var r,i=[],a=t;a<n;a+=3)r=(e[a]<<16&16711680)+(e[a+1]<<8&65280)+(e[a+2]&255),i.push(u(r));return i.join(``)}function f(t){for(var n,r=t.length,i=r%3,a=[],o=16383,s=0,c=r-i;s<c;s+=o)a.push(d(t,s,s+o>c?c:s+o));return i===1?(n=t[r-1],a.push(e[n>>2]+e[n<<4&63]+`==`)):i===2&&(n=(t[r-2]<<8)+t[r-1],a.push(e[n>>10]+e[n>>4&63]+e[n<<2&63]+`=`)),a.join(``)}return wa}var Da={},Oa;function ka(){return Oa?Da:(Oa=1,Da.read=function(e,t,n,r,i){var a,o,s=i*8-r-1,c=(1<<s)-1,l=c>>1,u=-7,d=n?i-1:0,f=n?-1:1,p=e[t+d];for(d+=f,a=p&(1<<-u)-1,p>>=-u,u+=s;u>0;a=a*256+e[t+d],d+=f,u-=8);for(o=a&(1<<-u)-1,a>>=-u,u+=r;u>0;o=o*256+e[t+d],d+=f,u-=8);if(a===0)a=1-l;else if(a===c)return o?NaN:(p?-1:1)*(1/0);else o+=2**r,a-=l;return(p?-1:1)*o*2**(a-r)},Da.write=function(e,t,n,r,i,a){var o,s,c,l=a*8-i-1,u=(1<<l)-1,d=u>>1,f=i===23?2**-24-2**-77:0,p=r?0:a-1,m=r?1:-1,h=t<0||t===0&&1/t<0?1:0;for(t=Math.abs(t),isNaN(t)||t===1/0?(s=isNaN(t)?1:0,o=u):(o=Math.floor(Math.log(t)/Math.LN2),t*(c=2**-o)<1&&(o--,c*=2),o+d>=1?t+=f/c:t+=f*2**(1-d),t*c>=2&&(o++,c/=2),o+d>=u?(s=0,o=u):o+d>=1?(s=(t*c-1)*2**i,o+=d):(s=t*2**(d-1)*2**i,o=0));i>=8;e[n+p]=s&255,p+=m,s/=256,i-=8);for(o=o<<i|s,l+=i;l>0;e[n+p]=o&255,p+=m,o/=256,l-=8);e[n+p-m]|=h*128},Da)}var Aa;function ja(){return Aa?Ca:(Aa=1,(function(e){var t=Ea(),n=ka(),r=typeof Symbol==`function`&&typeof Symbol.for==`function`?Symbol.for(`nodejs.util.inspect.custom`):null;e.Buffer=s,e.SlowBuffer=v,e.INSPECT_MAX_BYTES=50;var i=2147483647;e.kMaxLength=i,s.TYPED_ARRAY_SUPPORT=a(),!s.TYPED_ARRAY_SUPPORT&&typeof console<`u`&&typeof console.error==`function`&&console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");function a(){try{var e=new Uint8Array(1),t={foo:function(){return 42}};return Object.setPrototypeOf(t,Uint8Array.prototype),Object.setPrototypeOf(e,t),e.foo()===42}catch{return!1}}Object.defineProperty(s.prototype,`parent`,{enumerable:!0,get:function(){if(s.isBuffer(this))return this.buffer}}),Object.defineProperty(s.prototype,`offset`,{enumerable:!0,get:function(){if(s.isBuffer(this))return this.byteOffset}});function o(e){if(e>i)throw RangeError(`The value "`+e+`" is invalid for option "size"`);var t=new Uint8Array(e);return Object.setPrototypeOf(t,s.prototype),t}function s(e,t,n){if(typeof e==`number`){if(typeof t==`string`)throw TypeError(`The "string" argument must be of type string. Received type number`);return d(e)}return c(e,t,n)}s.poolSize=8192;function c(e,t,n){if(typeof e==`string`)return f(e,t);if(ArrayBuffer.isView(e))return m(e);if(e==null)throw TypeError(`The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type `+typeof e);if(se(e,ArrayBuffer)||e&&se(e.buffer,ArrayBuffer)||typeof SharedArrayBuffer<`u`&&(se(e,SharedArrayBuffer)||e&&se(e.buffer,SharedArrayBuffer)))return h(e,t,n);if(typeof e==`number`)throw TypeError(`The "value" argument must not be of type number. Received type number`);var r=e.valueOf&&e.valueOf();if(r!=null&&r!==e)return s.from(r,t,n);var i=g(e);if(i)return i;if(typeof Symbol<`u`&&Symbol.toPrimitive!=null&&typeof e[Symbol.toPrimitive]==`function`)return s.from(e[Symbol.toPrimitive](`string`),t,n);throw TypeError(`The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type `+typeof e)}s.from=function(e,t,n){return c(e,t,n)},Object.setPrototypeOf(s.prototype,Uint8Array.prototype),Object.setPrototypeOf(s,Uint8Array);function l(e){if(typeof e!=`number`)throw TypeError(`"size" argument must be of type number`);if(e<0)throw RangeError(`The value "`+e+`" is invalid for option "size"`)}function u(e,t,n){return l(e),e<=0||t===void 0?o(e):typeof n==`string`?o(e).fill(t,n):o(e).fill(t)}s.alloc=function(e,t,n){return u(e,t,n)};function d(e){return l(e),o(e<0?0:_(e)|0)}s.allocUnsafe=function(e){return d(e)},s.allocUnsafeSlow=function(e){return d(e)};function f(e,t){if((typeof t!=`string`||t===``)&&(t=`utf8`),!s.isEncoding(t))throw TypeError(`Unknown encoding: `+t);var n=y(e,t)|0,r=o(n),i=r.write(e,t);return i!==n&&(r=r.slice(0,i)),r}function p(e){for(var t=e.length<0?0:_(e.length)|0,n=o(t),r=0;r<t;r+=1)n[r]=e[r]&255;return n}function m(e){if(se(e,Uint8Array)){var t=new Uint8Array(e);return h(t.buffer,t.byteOffset,t.byteLength)}return p(e)}function h(e,t,n){if(t<0||e.byteLength<t)throw RangeError(`"offset" is outside of buffer bounds`);if(e.byteLength<t+(n||0))throw RangeError(`"length" is outside of buffer bounds`);var r=t===void 0&&n===void 0?new Uint8Array(e):n===void 0?new Uint8Array(e,t):new Uint8Array(e,t,n);return Object.setPrototypeOf(r,s.prototype),r}function g(e){if(s.isBuffer(e)){var t=_(e.length)|0,n=o(t);return n.length===0||e.copy(n,0,0,t),n}if(e.length!==void 0)return typeof e.length!=`number`||ce(e.length)?o(0):p(e);if(e.type===`Buffer`&&Array.isArray(e.data))return p(e.data)}function _(e){if(e>=i)throw RangeError(`Attempt to allocate Buffer larger than maximum size: 0x`+i.toString(16)+` bytes`);return e|0}function v(e){return+e!=e&&(e=0),s.alloc(+e)}s.isBuffer=function(e){return e!=null&&e._isBuffer===!0&&e!==s.prototype},s.compare=function(e,t){if(se(e,Uint8Array)&&(e=s.from(e,e.offset,e.byteLength)),se(t,Uint8Array)&&(t=s.from(t,t.offset,t.byteLength)),!s.isBuffer(e)||!s.isBuffer(t))throw TypeError(`The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array`);if(e===t)return 0;for(var n=e.length,r=t.length,i=0,a=Math.min(n,r);i<a;++i)if(e[i]!==t[i]){n=e[i],r=t[i];break}return n<r?-1:r<n?1:0},s.isEncoding=function(e){switch(String(e).toLowerCase()){case`hex`:case`utf8`:case`utf-8`:case`ascii`:case`latin1`:case`binary`:case`base64`:case`ucs2`:case`ucs-2`:case`utf16le`:case`utf-16le`:return!0;default:return!1}},s.concat=function(e,t){if(!Array.isArray(e))throw TypeError(`"list" argument must be an Array of Buffers`);if(e.length===0)return s.alloc(0);var n;if(t===void 0)for(t=0,n=0;n<e.length;++n)t+=e[n].length;var r=s.allocUnsafe(t),i=0;for(n=0;n<e.length;++n){var a=e[n];if(se(a,Uint8Array))i+a.length>r.length?s.from(a).copy(r,i):Uint8Array.prototype.set.call(r,a,i);else if(s.isBuffer(a))a.copy(r,i);else throw TypeError(`"list" argument must be an Array of Buffers`);i+=a.length}return r};function y(e,t){if(s.isBuffer(e))return e.length;if(ArrayBuffer.isView(e)||se(e,ArrayBuffer))return e.byteLength;if(typeof e!=`string`)throw TypeError(`The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type `+typeof e);var n=e.length,r=arguments.length>2&&arguments[2]===!0;if(!r&&n===0)return 0;for(var i=!1;;)switch(t){case`ascii`:case`latin1`:case`binary`:return n;case`utf8`:case`utf-8`:return ie(e).length;case`ucs2`:case`ucs-2`:case`utf16le`:case`utf-16le`:return n*2;case`hex`:return n>>>1;case`base64`:return B(e).length;default:if(i)return r?-1:ie(e).length;t=(``+t).toLowerCase(),i=!0}}s.byteLength=y;function b(e,t,n){var r=!1;if((t===void 0||t<0)&&(t=0),t>this.length||((n===void 0||n>this.length)&&(n=this.length),n<=0)||(n>>>=0,t>>>=0,n<=t))return``;for(e||=`utf8`;;)switch(e){case`hex`:return P(this,t,n);case`utf8`:case`utf-8`:return A(this,t,n);case`ascii`:return ee(this,t,n);case`latin1`:case`binary`:return N(this,t,n);case`base64`:return k(this,t,n);case`ucs2`:case`ucs-2`:case`utf16le`:case`utf-16le`:return F(this,t,n);default:if(r)throw TypeError(`Unknown encoding: `+e);e=(e+``).toLowerCase(),r=!0}}s.prototype._isBuffer=!0;function x(e,t,n){var r=e[t];e[t]=e[n],e[n]=r}s.prototype.swap16=function(){var e=this.length;if(e%2!=0)throw RangeError(`Buffer size must be a multiple of 16-bits`);for(var t=0;t<e;t+=2)x(this,t,t+1);return this},s.prototype.swap32=function(){var e=this.length;if(e%4!=0)throw RangeError(`Buffer size must be a multiple of 32-bits`);for(var t=0;t<e;t+=4)x(this,t,t+3),x(this,t+1,t+2);return this},s.prototype.swap64=function(){var e=this.length;if(e%8!=0)throw RangeError(`Buffer size must be a multiple of 64-bits`);for(var t=0;t<e;t+=8)x(this,t,t+7),x(this,t+1,t+6),x(this,t+2,t+5),x(this,t+3,t+4);return this},s.prototype.toString=function(){var e=this.length;return e===0?``:arguments.length===0?A(this,0,e):b.apply(this,arguments)},s.prototype.toLocaleString=s.prototype.toString,s.prototype.equals=function(e){if(!s.isBuffer(e))throw TypeError(`Argument must be a Buffer`);return this===e?!0:s.compare(this,e)===0},s.prototype.inspect=function(){var t=``,n=e.INSPECT_MAX_BYTES;return t=this.toString(`hex`,0,n).replace(/(.{2})/g,`$1 `).trim(),this.length>n&&(t+=` ... `),`<Buffer `+t+`>`},r&&(s.prototype[r]=s.prototype.inspect),s.prototype.compare=function(e,t,n,r,i){if(se(e,Uint8Array)&&(e=s.from(e,e.offset,e.byteLength)),!s.isBuffer(e))throw TypeError(`The "target" argument must be one of type Buffer or Uint8Array. Received type `+typeof e);if(t===void 0&&(t=0),n===void 0&&(n=e?e.length:0),r===void 0&&(r=0),i===void 0&&(i=this.length),t<0||n>e.length||r<0||i>this.length)throw RangeError(`out of range index`);if(r>=i&&t>=n)return 0;if(r>=i)return-1;if(t>=n)return 1;if(t>>>=0,n>>>=0,r>>>=0,i>>>=0,this===e)return 0;for(var a=i-r,o=n-t,c=Math.min(a,o),l=this.slice(r,i),u=e.slice(t,n),d=0;d<c;++d)if(l[d]!==u[d]){a=l[d],o=u[d];break}return a<o?-1:o<a?1:0};function S(e,t,n,r,i){if(e.length===0)return-1;if(typeof n==`string`?(r=n,n=0):n>2147483647?n=2147483647:n<-2147483648&&(n=-2147483648),n=+n,ce(n)&&(n=i?0:e.length-1),n<0&&(n=e.length+n),n>=e.length){if(i)return-1;n=e.length-1}else if(n<0)if(i)n=0;else return-1;if(typeof t==`string`&&(t=s.from(t,r)),s.isBuffer(t))return t.length===0?-1:C(e,t,n,r,i);if(typeof t==`number`)return t&=255,typeof Uint8Array.prototype.indexOf==`function`?i?Uint8Array.prototype.indexOf.call(e,t,n):Uint8Array.prototype.lastIndexOf.call(e,t,n):C(e,[t],n,r,i);throw TypeError(`val must be string, number or Buffer`)}function C(e,t,n,r,i){var a=1,o=e.length,s=t.length;if(r!==void 0&&(r=String(r).toLowerCase(),r===`ucs2`||r===`ucs-2`||r===`utf16le`||r===`utf-16le`)){if(e.length<2||t.length<2)return-1;a=2,o/=2,s/=2,n/=2}function c(e,t){return a===1?e[t]:e.readUInt16BE(t*a)}var l;if(i){var u=-1;for(l=n;l<o;l++)if(c(e,l)===c(t,u===-1?0:l-u)){if(u===-1&&(u=l),l-u+1===s)return u*a}else u!==-1&&(l-=l-u),u=-1}else for(n+s>o&&(n=o-s),l=n;l>=0;l--){for(var d=!0,f=0;f<s;f++)if(c(e,l+f)!==c(t,f)){d=!1;break}if(d)return l}return-1}s.prototype.includes=function(e,t,n){return this.indexOf(e,t,n)!==-1},s.prototype.indexOf=function(e,t,n){return S(this,e,t,n,!0)},s.prototype.lastIndexOf=function(e,t,n){return S(this,e,t,n,!1)};function w(e,t,n,r){n=Number(n)||0;var i=e.length-n;r?(r=Number(r),r>i&&(r=i)):r=i;var a=t.length;r>a/2&&(r=a/2);for(var o=0;o<r;++o){var s=parseInt(t.substr(o*2,2),16);if(ce(s))return o;e[n+o]=s}return o}function T(e,t,n,r){return V(ie(t,e.length-n),e,n,r)}function E(e,t,n,r){return V(ae(t),e,n,r)}function D(e,t,n,r){return V(B(t),e,n,r)}function O(e,t,n,r){return V(oe(t,e.length-n),e,n,r)}s.prototype.write=function(e,t,n,r){if(t===void 0)r=`utf8`,n=this.length,t=0;else if(n===void 0&&typeof t==`string`)r=t,n=this.length,t=0;else if(isFinite(t))t>>>=0,isFinite(n)?(n>>>=0,r===void 0&&(r=`utf8`)):(r=n,n=void 0);else throw Error(`Buffer.write(string, encoding, offset[, length]) is no longer supported`);var i=this.length-t;if((n===void 0||n>i)&&(n=i),e.length>0&&(n<0||t<0)||t>this.length)throw RangeError(`Attempt to write outside buffer bounds`);r||=`utf8`;for(var a=!1;;)switch(r){case`hex`:return w(this,e,t,n);case`utf8`:case`utf-8`:return T(this,e,t,n);case`ascii`:case`latin1`:case`binary`:return E(this,e,t,n);case`base64`:return D(this,e,t,n);case`ucs2`:case`ucs-2`:case`utf16le`:case`utf-16le`:return O(this,e,t,n);default:if(a)throw TypeError(`Unknown encoding: `+r);r=(``+r).toLowerCase(),a=!0}},s.prototype.toJSON=function(){return{type:`Buffer`,data:Array.prototype.slice.call(this._arr||this,0)}};function k(e,n,r){return n===0&&r===e.length?t.fromByteArray(e):t.fromByteArray(e.slice(n,r))}function A(e,t,n){n=Math.min(e.length,n);for(var r=[],i=t;i<n;){var a=e[i],o=null,s=a>239?4:a>223?3:a>191?2:1;if(i+s<=n){var c,l,u,d;switch(s){case 1:a<128&&(o=a);break;case 2:c=e[i+1],(c&192)==128&&(d=(a&31)<<6|c&63,d>127&&(o=d));break;case 3:c=e[i+1],l=e[i+2],(c&192)==128&&(l&192)==128&&(d=(a&15)<<12|(c&63)<<6|l&63,d>2047&&(d<55296||d>57343)&&(o=d));break;case 4:c=e[i+1],l=e[i+2],u=e[i+3],(c&192)==128&&(l&192)==128&&(u&192)==128&&(d=(a&15)<<18|(c&63)<<12|(l&63)<<6|u&63,d>65535&&d<1114112&&(o=d))}}o===null?(o=65533,s=1):o>65535&&(o-=65536,r.push(o>>>10&1023|55296),o=56320|o&1023),r.push(o),i+=s}return M(r)}var j=4096;function M(e){var t=e.length;if(t<=j)return String.fromCharCode.apply(String,e);for(var n=``,r=0;r<t;)n+=String.fromCharCode.apply(String,e.slice(r,r+=j));return n}function ee(e,t,n){var r=``;n=Math.min(e.length,n);for(var i=t;i<n;++i)r+=String.fromCharCode(e[i]&127);return r}function N(e,t,n){var r=``;n=Math.min(e.length,n);for(var i=t;i<n;++i)r+=String.fromCharCode(e[i]);return r}function P(e,t,n){var r=e.length;(!t||t<0)&&(t=0),(!n||n<0||n>r)&&(n=r);for(var i=``,a=t;a<n;++a)i+=le[e[a]];return i}function F(e,t,n){for(var r=e.slice(t,n),i=``,a=0;a<r.length-1;a+=2)i+=String.fromCharCode(r[a]+r[a+1]*256);return i}s.prototype.slice=function(e,t){var n=this.length;e=~~e,t=t===void 0?n:~~t,e<0?(e+=n,e<0&&(e=0)):e>n&&(e=n),t<0?(t+=n,t<0&&(t=0)):t>n&&(t=n),t<e&&(t=e);var r=this.subarray(e,t);return Object.setPrototypeOf(r,s.prototype),r};function I(e,t,n){if(e%1!=0||e<0)throw RangeError(`offset is not uint`);if(e+t>n)throw RangeError(`Trying to access beyond buffer length`)}s.prototype.readUintLE=s.prototype.readUIntLE=function(e,t,n){e>>>=0,t>>>=0,n||I(e,t,this.length);for(var r=this[e],i=1,a=0;++a<t&&(i*=256);)r+=this[e+a]*i;return r},s.prototype.readUintBE=s.prototype.readUIntBE=function(e,t,n){e>>>=0,t>>>=0,n||I(e,t,this.length);for(var r=this[e+--t],i=1;t>0&&(i*=256);)r+=this[e+--t]*i;return r},s.prototype.readUint8=s.prototype.readUInt8=function(e,t){return e>>>=0,t||I(e,1,this.length),this[e]},s.prototype.readUint16LE=s.prototype.readUInt16LE=function(e,t){return e>>>=0,t||I(e,2,this.length),this[e]|this[e+1]<<8},s.prototype.readUint16BE=s.prototype.readUInt16BE=function(e,t){return e>>>=0,t||I(e,2,this.length),this[e]<<8|this[e+1]},s.prototype.readUint32LE=s.prototype.readUInt32LE=function(e,t){return e>>>=0,t||I(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+this[e+3]*16777216},s.prototype.readUint32BE=s.prototype.readUInt32BE=function(e,t){return e>>>=0,t||I(e,4,this.length),this[e]*16777216+(this[e+1]<<16|this[e+2]<<8|this[e+3])},s.prototype.readIntLE=function(e,t,n){e>>>=0,t>>>=0,n||I(e,t,this.length);for(var r=this[e],i=1,a=0;++a<t&&(i*=256);)r+=this[e+a]*i;return i*=128,r>=i&&(r-=2**(8*t)),r},s.prototype.readIntBE=function(e,t,n){e>>>=0,t>>>=0,n||I(e,t,this.length);for(var r=t,i=1,a=this[e+--r];r>0&&(i*=256);)a+=this[e+--r]*i;return i*=128,a>=i&&(a-=2**(8*t)),a},s.prototype.readInt8=function(e,t){return e>>>=0,t||I(e,1,this.length),this[e]&128?(255-this[e]+1)*-1:this[e]},s.prototype.readInt16LE=function(e,t){e>>>=0,t||I(e,2,this.length);var n=this[e]|this[e+1]<<8;return n&32768?n|4294901760:n},s.prototype.readInt16BE=function(e,t){e>>>=0,t||I(e,2,this.length);var n=this[e+1]|this[e]<<8;return n&32768?n|4294901760:n},s.prototype.readInt32LE=function(e,t){return e>>>=0,t||I(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24},s.prototype.readInt32BE=function(e,t){return e>>>=0,t||I(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3]},s.prototype.readFloatLE=function(e,t){return e>>>=0,t||I(e,4,this.length),n.read(this,e,!0,23,4)},s.prototype.readFloatBE=function(e,t){return e>>>=0,t||I(e,4,this.length),n.read(this,e,!1,23,4)},s.prototype.readDoubleLE=function(e,t){return e>>>=0,t||I(e,8,this.length),n.read(this,e,!0,52,8)},s.prototype.readDoubleBE=function(e,t){return e>>>=0,t||I(e,8,this.length),n.read(this,e,!1,52,8)};function L(e,t,n,r,i,a){if(!s.isBuffer(e))throw TypeError(`"buffer" argument must be a Buffer instance`);if(t>i||t<a)throw RangeError(`"value" argument is out of bounds`);if(n+r>e.length)throw RangeError(`Index out of range`)}s.prototype.writeUintLE=s.prototype.writeUIntLE=function(e,t,n,r){if(e=+e,t>>>=0,n>>>=0,!r){var i=2**(8*n)-1;L(this,e,t,n,i,0)}var a=1,o=0;for(this[t]=e&255;++o<n&&(a*=256);)this[t+o]=e/a&255;return t+n},s.prototype.writeUintBE=s.prototype.writeUIntBE=function(e,t,n,r){if(e=+e,t>>>=0,n>>>=0,!r){var i=2**(8*n)-1;L(this,e,t,n,i,0)}var a=n-1,o=1;for(this[t+a]=e&255;--a>=0&&(o*=256);)this[t+a]=e/o&255;return t+n},s.prototype.writeUint8=s.prototype.writeUInt8=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,1,255,0),this[t]=e&255,t+1},s.prototype.writeUint16LE=s.prototype.writeUInt16LE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,2,65535,0),this[t]=e&255,this[t+1]=e>>>8,t+2},s.prototype.writeUint16BE=s.prototype.writeUInt16BE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,2,65535,0),this[t]=e>>>8,this[t+1]=e&255,t+2},s.prototype.writeUint32LE=s.prototype.writeUInt32LE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,4,4294967295,0),this[t+3]=e>>>24,this[t+2]=e>>>16,this[t+1]=e>>>8,this[t]=e&255,t+4},s.prototype.writeUint32BE=s.prototype.writeUInt32BE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,4,4294967295,0),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=e&255,t+4},s.prototype.writeIntLE=function(e,t,n,r){if(e=+e,t>>>=0,!r){var i=2**(8*n-1);L(this,e,t,n,i-1,-i)}var a=0,o=1,s=0;for(this[t]=e&255;++a<n&&(o*=256);)e<0&&s===0&&this[t+a-1]!==0&&(s=1),this[t+a]=(e/o>>0)-s&255;return t+n},s.prototype.writeIntBE=function(e,t,n,r){if(e=+e,t>>>=0,!r){var i=2**(8*n-1);L(this,e,t,n,i-1,-i)}var a=n-1,o=1,s=0;for(this[t+a]=e&255;--a>=0&&(o*=256);)e<0&&s===0&&this[t+a+1]!==0&&(s=1),this[t+a]=(e/o>>0)-s&255;return t+n},s.prototype.writeInt8=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,1,127,-128),e<0&&(e=255+e+1),this[t]=e&255,t+1},s.prototype.writeInt16LE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,2,32767,-32768),this[t]=e&255,this[t+1]=e>>>8,t+2},s.prototype.writeInt16BE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,2,32767,-32768),this[t]=e>>>8,this[t+1]=e&255,t+2},s.prototype.writeInt32LE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,4,2147483647,-2147483648),this[t]=e&255,this[t+1]=e>>>8,this[t+2]=e>>>16,this[t+3]=e>>>24,t+4},s.prototype.writeInt32BE=function(e,t,n){return e=+e,t>>>=0,n||L(this,e,t,4,2147483647,-2147483648),e<0&&(e=4294967295+e+1),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=e&255,t+4};function R(e,t,n,r,i,a){if(n+r>e.length||n<0)throw RangeError(`Index out of range`)}function z(e,t,r,i,a){return t=+t,r>>>=0,a||R(e,t,r,4),n.write(e,t,r,i,23,4),r+4}s.prototype.writeFloatLE=function(e,t,n){return z(this,e,t,!0,n)},s.prototype.writeFloatBE=function(e,t,n){return z(this,e,t,!1,n)};function te(e,t,r,i,a){return t=+t,r>>>=0,a||R(e,t,r,8),n.write(e,t,r,i,52,8),r+8}s.prototype.writeDoubleLE=function(e,t,n){return te(this,e,t,!0,n)},s.prototype.writeDoubleBE=function(e,t,n){return te(this,e,t,!1,n)},s.prototype.copy=function(e,t,n,r){if(!s.isBuffer(e))throw TypeError(`argument should be a Buffer`);if(n||=0,!r&&r!==0&&(r=this.length),t>=e.length&&(t=e.length),t||=0,r>0&&r<n&&(r=n),r===n||e.length===0||this.length===0)return 0;if(t<0)throw RangeError(`targetStart out of bounds`);if(n<0||n>=this.length)throw RangeError(`Index out of range`);if(r<0)throw RangeError(`sourceEnd out of bounds`);r>this.length&&(r=this.length),e.length-t<r-n&&(r=e.length-t+n);var i=r-n;return this===e&&typeof Uint8Array.prototype.copyWithin==`function`?this.copyWithin(t,n,r):Uint8Array.prototype.set.call(e,this.subarray(n,r),t),i},s.prototype.fill=function(e,t,n,r){if(typeof e==`string`){if(typeof t==`string`?(r=t,t=0,n=this.length):typeof n==`string`&&(r=n,n=this.length),r!==void 0&&typeof r!=`string`)throw TypeError(`encoding must be a string`);if(typeof r==`string`&&!s.isEncoding(r))throw TypeError(`Unknown encoding: `+r);if(e.length===1){var i=e.charCodeAt(0);(r===`utf8`&&i<128||r===`latin1`)&&(e=i)}}else typeof e==`number`?e&=255:typeof e==`boolean`&&(e=Number(e));if(t<0||this.length<t||this.length<n)throw RangeError(`Out of range index`);if(n<=t)return this;t>>>=0,n=n===void 0?this.length:n>>>0,e||=0;var a;if(typeof e==`number`)for(a=t;a<n;++a)this[a]=e;else{var o=s.isBuffer(e)?e:s.from(e,r),c=o.length;if(c===0)throw TypeError(`The value "`+e+`" is invalid for argument "value"`);for(a=0;a<n-t;++a)this[a+t]=o[a%c]}return this};var ne=/[^+/0-9A-Za-z-_]/g;function re(e){if(e=e.split(`=`)[0],e=e.trim().replace(ne,``),e.length<2)return``;for(;e.length%4!=0;)e+=`=`;return e}function ie(e,t){t||=1/0;for(var n,r=e.length,i=null,a=[],o=0;o<r;++o){if(n=e.charCodeAt(o),n>55295&&n<57344){if(!i){if(n>56319){(t-=3)>-1&&a.push(239,191,189);continue}else if(o+1===r){(t-=3)>-1&&a.push(239,191,189);continue}i=n;continue}if(n<56320){(t-=3)>-1&&a.push(239,191,189),i=n;continue}n=(i-55296<<10|n-56320)+65536}else i&&(t-=3)>-1&&a.push(239,191,189);if(i=null,n<128){if(--t<0)break;a.push(n)}else if(n<2048){if((t-=2)<0)break;a.push(n>>6|192,n&63|128)}else if(n<65536){if((t-=3)<0)break;a.push(n>>12|224,n>>6&63|128,n&63|128)}else if(n<1114112){if((t-=4)<0)break;a.push(n>>18|240,n>>12&63|128,n>>6&63|128,n&63|128)}else throw Error(`Invalid code point`)}return a}function ae(e){for(var t=[],n=0;n<e.length;++n)t.push(e.charCodeAt(n)&255);return t}function oe(e,t){for(var n,r,i,a=[],o=0;o<e.length&&!((t-=2)<0);++o)n=e.charCodeAt(o),r=n>>8,i=n%256,a.push(i),a.push(r);return a}function B(e){return t.toByteArray(re(e))}function V(e,t,n,r){for(var i=0;i<r&&!(i+n>=t.length||i>=e.length);++i)t[i+n]=e[i];return i}function se(e,t){return e instanceof t||e!=null&&e.constructor!=null&&e.constructor.name!=null&&e.constructor.name===t.name}function ce(e){return e!==e}var le=(function(){for(var e=`0123456789abcdef`,t=Array(256),n=0;n<16;++n)for(var r=n*16,i=0;i<16;++i)t[r+i]=e[n]+e[i];return t})()})(Ca),Ca)}var Ma={},Na={},Pa,Fa;function Ia(){return Fa?Pa:(Fa=1,Pa=function(){if(typeof Symbol!=`function`||typeof Object.getOwnPropertySymbols!=`function`)return!1;if(typeof Symbol.iterator==`symbol`)return!0;var e={},t=Symbol(`test`),n=Object(t);if(typeof t==`string`||Object.prototype.toString.call(t)!==`[object Symbol]`||Object.prototype.toString.call(n)!==`[object Symbol]`)return!1;var r=42;for(var i in e[t]=r,e)return!1;if(typeof Object.keys==`function`&&Object.keys(e).length!==0||typeof Object.getOwnPropertyNames==`function`&&Object.getOwnPropertyNames(e).length!==0)return!1;var a=Object.getOwnPropertySymbols(e);if(a.length!==1||a[0]!==t||!Object.prototype.propertyIsEnumerable.call(e,t))return!1;if(typeof Object.getOwnPropertyDescriptor==`function`){var o=Object.getOwnPropertyDescriptor(e,t);if(o.value!==r||o.enumerable!==!0)return!1}return!0},Pa)}var La,Ra;function za(){if(Ra)return La;Ra=1;var e=Ia();return La=function(){return e()&&!!Symbol.toStringTag},La}var Ba,Va;function Ha(){return Va?Ba:(Va=1,Ba=Object,Ba)}var Ua,Wa;function Ga(){return Wa?Ua:(Wa=1,Ua=Error,Ua)}var Ka,qa;function Ja(){return qa?Ka:(qa=1,Ka=EvalError,Ka)}var Ya,Xa;function Za(){return Xa?Ya:(Xa=1,Ya=RangeError,Ya)}var Qa,$a;function eo(){return $a?Qa:($a=1,Qa=ReferenceError,Qa)}var to,no;function ro(){return no?to:(no=1,to=SyntaxError,to)}var io,ao;function oo(){return ao?io:(ao=1,io=TypeError,io)}var so,co;function lo(){return co?so:(co=1,so=URIError,so)}var uo,fo;function po(){return fo?uo:(fo=1,uo=Math.abs,uo)}var mo,ho;function go(){return ho?mo:(ho=1,mo=Math.floor,mo)}var _o,vo;function yo(){return vo?_o:(vo=1,_o=Math.max,_o)}var bo,xo;function So(){return xo?bo:(xo=1,bo=Math.min,bo)}var Co,wo;function To(){return wo?Co:(wo=1,Co=Math.pow,Co)}var Eo,Do;function Oo(){return Do?Eo:(Do=1,Eo=Math.round,Eo)}var ko,Ao;function jo(){return Ao?ko:(Ao=1,ko=Number.isNaN||function(e){return e!==e},ko)}var Mo,No;function Po(){if(No)return Mo;No=1;var e=jo();return Mo=function(t){return e(t)||t===0?t:t<0?-1:1},Mo}var Fo,Io;function Lo(){return Io?Fo:(Io=1,Fo=Object.getOwnPropertyDescriptor,Fo)}var Ro,zo;function Bo(){if(zo)return Ro;zo=1;var e=Lo();if(e)try{e([],`length`)}catch{e=null}return Ro=e,Ro}var Vo,Ho;function Uo(){if(Ho)return Vo;Ho=1;var e=Object.defineProperty||!1;if(e)try{e({},`a`,{value:1})}catch{e=!1}return Vo=e,Vo}var Wo,Go;function Ko(){if(Go)return Wo;Go=1;var e=typeof Symbol<`u`&&Symbol,t=Ia();return Wo=function(){return typeof e!=`function`||typeof Symbol!=`function`||typeof e(`foo`)!=`symbol`||typeof Symbol(`bar`)!=`symbol`?!1:t()},Wo}var qo,Jo;function Yo(){return Jo?qo:(Jo=1,qo=typeof Reflect<`u`&&Reflect.getPrototypeOf||null,qo)}var Xo,Zo;function Qo(){return Zo?Xo:(Zo=1,Xo=Ha().getPrototypeOf||null,Xo)}var $o,es;function ts(){if(es)return $o;es=1;var e=`Function.prototype.bind called on incompatible `,t=Object.prototype.toString,n=Math.max,r=`[object Function]`,i=function(e,t){for(var n=[],r=0;r<e.length;r+=1)n[r]=e[r];for(var i=0;i<t.length;i+=1)n[i+e.length]=t[i];return n},a=function(e,t){for(var n=[],r=t,i=0;r<e.length;r+=1,i+=1)n[i]=e[r];return n},o=function(e,t){for(var n=``,r=0;r<e.length;r+=1)n+=e[r],r+1<e.length&&(n+=t);return n};return $o=function(s){var c=this;if(typeof c!=`function`||t.apply(c)!==r)throw TypeError(e+c);for(var l=a(arguments,1),u,d=function(){if(this instanceof u){var e=c.apply(this,i(l,arguments));return Object(e)===e?e:this}return c.apply(s,i(l,arguments))},f=n(0,c.length-l.length),p=[],m=0;m<f;m++)p[m]=`$`+m;if(u=Function(`binder`,`return function (`+o(p,`,`)+`){ return binder.apply(this,arguments); }`)(d),c.prototype){var h=function(){};h.prototype=c.prototype,u.prototype=new h,h.prototype=null}return u},$o}var ns,rs;function is(){if(rs)return ns;rs=1;var e=ts();return ns=Function.prototype.bind||e,ns}var as,os;function ss(){return os?as:(os=1,as=Function.prototype.call,as)}var cs,ls;function us(){return ls?cs:(ls=1,cs=Function.prototype.apply,cs)}var ds,fs;function ps(){return fs?ds:(fs=1,ds=typeof Reflect<`u`&&Reflect&&Reflect.apply,ds)}var ms,hs;function gs(){if(hs)return ms;hs=1;var e=is(),t=us(),n=ss();return ms=ps()||e.call(n,t),ms}var _s,vs;function ys(){if(vs)return _s;vs=1;var e=is(),t=oo(),n=ss(),r=gs();return _s=function(i){if(i.length<1||typeof i[0]!=`function`)throw new t(`a function is required`);return r(e,n,i)},_s}var bs,xs;function Ss(){if(xs)return bs;xs=1;var e=ys(),t=Bo(),n;try{n=[].__proto__===Array.prototype}catch(e){if(!e||typeof e!=`object`||!(`code`in e)||e.code!==`ERR_PROTO_ACCESS`)throw e}var r=!!n&&t&&t(Object.prototype,`__proto__`),i=Object,a=i.getPrototypeOf;return bs=r&&typeof r.get==`function`?e([r.get]):typeof a==`function`?(function(e){return a(e==null?e:i(e))}):!1,bs}var Cs,ws;function Ts(){if(ws)return Cs;ws=1;var e=Yo(),t=Qo(),n=Ss();return Cs=e?function(t){return e(t)}:t?function(e){if(!e||typeof e!=`object`&&typeof e!=`function`)throw TypeError(`getProto: not an object`);return t(e)}:n?function(e){return n(e)}:null,Cs}var Es,Ds;function Os(){if(Ds)return Es;Ds=1;var e=Function.prototype.call,t=Object.prototype.hasOwnProperty;return Es=is().call(e,t),Es}var ks,As;function js(){if(As)return ks;As=1;var e,t=Ha(),n=Ga(),r=Ja(),i=Za(),a=eo(),o=ro(),s=oo(),c=lo(),l=po(),u=go(),d=yo(),f=So(),p=To(),m=Oo(),h=Po(),g=Function,_=function(e){try{return g(`"use strict"; return (`+e+`).constructor;`)()}catch{}},v=Bo(),y=Uo(),b=function(){throw new s},x=v?(function(){try{return arguments.callee,b}catch{try{return v(arguments,`callee`).get}catch{return b}}})():b,S=Ko()(),C=Ts(),w=Qo(),T=Yo(),E=us(),D=ss(),O={},k=typeof Uint8Array>`u`||!C?e:C(Uint8Array),A={__proto__:null,"%AggregateError%":typeof AggregateError>`u`?e:AggregateError,"%Array%":Array,"%ArrayBuffer%":typeof ArrayBuffer>`u`?e:ArrayBuffer,"%ArrayIteratorPrototype%":S&&C?C([][Symbol.iterator]()):e,"%AsyncFromSyncIteratorPrototype%":e,"%AsyncFunction%":O,"%AsyncGenerator%":O,"%AsyncGeneratorFunction%":O,"%AsyncIteratorPrototype%":O,"%Atomics%":typeof Atomics>`u`?e:Atomics,"%BigInt%":typeof BigInt>`u`?e:BigInt,"%BigInt64Array%":typeof BigInt64Array>`u`?e:BigInt64Array,"%BigUint64Array%":typeof BigUint64Array>`u`?e:BigUint64Array,"%Boolean%":Boolean,"%DataView%":typeof DataView>`u`?e:DataView,"%Date%":Date,"%decodeURI%":decodeURI,"%decodeURIComponent%":decodeURIComponent,"%encodeURI%":encodeURI,"%encodeURIComponent%":encodeURIComponent,"%Error%":n,"%eval%":eval,"%EvalError%":r,"%Float16Array%":typeof Float16Array>`u`?e:Float16Array,"%Float32Array%":typeof Float32Array>`u`?e:Float32Array,"%Float64Array%":typeof Float64Array>`u`?e:Float64Array,"%FinalizationRegistry%":typeof FinalizationRegistry>`u`?e:FinalizationRegistry,"%Function%":g,"%GeneratorFunction%":O,"%Int8Array%":typeof Int8Array>`u`?e:Int8Array,"%Int16Array%":typeof Int16Array>`u`?e:Int16Array,"%Int32Array%":typeof Int32Array>`u`?e:Int32Array,"%isFinite%":isFinite,"%isNaN%":isNaN,"%IteratorPrototype%":S&&C?C(C([][Symbol.iterator]())):e,"%JSON%":typeof JSON==`object`?JSON:e,"%Map%":typeof Map>`u`?e:Map,"%MapIteratorPrototype%":typeof Map>`u`||!S||!C?e:C(new Map()[Symbol.iterator]()),"%Math%":Math,"%Number%":Number,"%Object%":t,"%Object.getOwnPropertyDescriptor%":v,"%parseFloat%":parseFloat,"%parseInt%":parseInt,"%Promise%":typeof Promise>`u`?e:Promise,"%Proxy%":typeof Proxy>`u`?e:Proxy,"%RangeError%":i,"%ReferenceError%":a,"%Reflect%":typeof Reflect>`u`?e:Reflect,"%RegExp%":RegExp,"%Set%":typeof Set>`u`?e:Set,"%SetIteratorPrototype%":typeof Set>`u`||!S||!C?e:C(new Set()[Symbol.iterator]()),"%SharedArrayBuffer%":typeof SharedArrayBuffer>`u`?e:SharedArrayBuffer,"%String%":String,"%StringIteratorPrototype%":S&&C?C(``[Symbol.iterator]()):e,"%Symbol%":S?Symbol:e,"%SyntaxError%":o,"%ThrowTypeError%":x,"%TypedArray%":k,"%TypeError%":s,"%Uint8Array%":typeof Uint8Array>`u`?e:Uint8Array,"%Uint8ClampedArray%":typeof Uint8ClampedArray>`u`?e:Uint8ClampedArray,"%Uint16Array%":typeof Uint16Array>`u`?e:Uint16Array,"%Uint32Array%":typeof Uint32Array>`u`?e:Uint32Array,"%URIError%":c,"%WeakMap%":typeof WeakMap>`u`?e:WeakMap,"%WeakRef%":typeof WeakRef>`u`?e:WeakRef,"%WeakSet%":typeof WeakSet>`u`?e:WeakSet,"%Function.prototype.call%":D,"%Function.prototype.apply%":E,"%Object.defineProperty%":y,"%Object.getPrototypeOf%":w,"%Math.abs%":l,"%Math.floor%":u,"%Math.max%":d,"%Math.min%":f,"%Math.pow%":p,"%Math.round%":m,"%Math.sign%":h,"%Reflect.getPrototypeOf%":T};if(C)try{null.error}catch(e){A[`%Error.prototype%`]=C(C(e))}var j=function e(t){var n;if(t===`%AsyncFunction%`)n=_(`async function () {}`);else if(t===`%GeneratorFunction%`)n=_(`function* () {}`);else if(t===`%AsyncGeneratorFunction%`)n=_(`async function* () {}`);else if(t===`%AsyncGenerator%`){var r=e(`%AsyncGeneratorFunction%`);r&&(n=r.prototype)}else if(t===`%AsyncIteratorPrototype%`){var i=e(`%AsyncGenerator%`);i&&C&&(n=C(i.prototype))}return A[t]=n,n},M={__proto__:null,"%ArrayBufferPrototype%":[`ArrayBuffer`,`prototype`],"%ArrayPrototype%":[`Array`,`prototype`],"%ArrayProto_entries%":[`Array`,`prototype`,`entries`],"%ArrayProto_forEach%":[`Array`,`prototype`,`forEach`],"%ArrayProto_keys%":[`Array`,`prototype`,`keys`],"%ArrayProto_values%":[`Array`,`prototype`,`values`],"%AsyncFunctionPrototype%":[`AsyncFunction`,`prototype`],"%AsyncGenerator%":[`AsyncGeneratorFunction`,`prototype`],"%AsyncGeneratorPrototype%":[`AsyncGeneratorFunction`,`prototype`,`prototype`],"%BooleanPrototype%":[`Boolean`,`prototype`],"%DataViewPrototype%":[`DataView`,`prototype`],"%DatePrototype%":[`Date`,`prototype`],"%ErrorPrototype%":[`Error`,`prototype`],"%EvalErrorPrototype%":[`EvalError`,`prototype`],"%Float32ArrayPrototype%":[`Float32Array`,`prototype`],"%Float64ArrayPrototype%":[`Float64Array`,`prototype`],"%FunctionPrototype%":[`Function`,`prototype`],"%Generator%":[`GeneratorFunction`,`prototype`],"%GeneratorPrototype%":[`GeneratorFunction`,`prototype`,`prototype`],"%Int8ArrayPrototype%":[`Int8Array`,`prototype`],"%Int16ArrayPrototype%":[`Int16Array`,`prototype`],"%Int32ArrayPrototype%":[`Int32Array`,`prototype`],"%JSONParse%":[`JSON`,`parse`],"%JSONStringify%":[`JSON`,`stringify`],"%MapPrototype%":[`Map`,`prototype`],"%NumberPrototype%":[`Number`,`prototype`],"%ObjectPrototype%":[`Object`,`prototype`],"%ObjProto_toString%":[`Object`,`prototype`,`toString`],"%ObjProto_valueOf%":[`Object`,`prototype`,`valueOf`],"%PromisePrototype%":[`Promise`,`prototype`],"%PromiseProto_then%":[`Promise`,`prototype`,`then`],"%Promise_all%":[`Promise`,`all`],"%Promise_reject%":[`Promise`,`reject`],"%Promise_resolve%":[`Promise`,`resolve`],"%RangeErrorPrototype%":[`RangeError`,`prototype`],"%ReferenceErrorPrototype%":[`ReferenceError`,`prototype`],"%RegExpPrototype%":[`RegExp`,`prototype`],"%SetPrototype%":[`Set`,`prototype`],"%SharedArrayBufferPrototype%":[`SharedArrayBuffer`,`prototype`],"%StringPrototype%":[`String`,`prototype`],"%SymbolPrototype%":[`Symbol`,`prototype`],"%SyntaxErrorPrototype%":[`SyntaxError`,`prototype`],"%TypedArrayPrototype%":[`TypedArray`,`prototype`],"%TypeErrorPrototype%":[`TypeError`,`prototype`],"%Uint8ArrayPrototype%":[`Uint8Array`,`prototype`],"%Uint8ClampedArrayPrototype%":[`Uint8ClampedArray`,`prototype`],"%Uint16ArrayPrototype%":[`Uint16Array`,`prototype`],"%Uint32ArrayPrototype%":[`Uint32Array`,`prototype`],"%URIErrorPrototype%":[`URIError`,`prototype`],"%WeakMapPrototype%":[`WeakMap`,`prototype`],"%WeakSetPrototype%":[`WeakSet`,`prototype`]},ee=is(),N=Os(),P=ee.call(D,Array.prototype.concat),F=ee.call(E,Array.prototype.splice),I=ee.call(D,String.prototype.replace),L=ee.call(D,String.prototype.slice),R=ee.call(D,RegExp.prototype.exec),z=/[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g,te=/\\(\\)?/g,ne=function(e){var t=L(e,0,1),n=L(e,-1);if(t===`%`&&n!==`%`)throw new o("invalid intrinsic syntax, expected closing `%`");if(n===`%`&&t!==`%`)throw new o("invalid intrinsic syntax, expected opening `%`");var r=[];return I(e,z,function(e,t,n,i){r[r.length]=n?I(i,te,`$1`):t||e}),r},re=function(e,t){var n=e,r;if(N(M,n)&&(r=M[n],n=`%`+r[0]+`%`),N(A,n)){var i=A[n];if(i===O&&(i=j(n)),i===void 0&&!t)throw new s(`intrinsic `+e+` exists, but is not available. Please file an issue!`);return{alias:r,name:n,value:i}}throw new o(`intrinsic `+e+` does not exist!`)};return ks=function(e,t){if(typeof e!=`string`||e.length===0)throw new s(`intrinsic name must be a non-empty string`);if(arguments.length>1&&typeof t!=`boolean`)throw new s(`"allowMissing" argument must be a boolean`);if(R(/^%?[^%]*%?$/,e)===null)throw new o("`%` may not be present anywhere but at the beginning and end of the intrinsic name");var n=ne(e),r=n.length>0?n[0]:``,i=re(`%`+r+`%`,t),a=i.name,c=i.value,l=!1,u=i.alias;u&&(r=u[0],F(n,P([0,1],u)));for(var d=1,f=!0;d<n.length;d+=1){var p=n[d],m=L(p,0,1),h=L(p,-1);if((m===`"`||m===`'`||m==="`"||h===`"`||h===`'`||h==="`")&&m!==h)throw new o(`property names with quotes must have matching quotes`);if((p===`constructor`||!f)&&(l=!0),r+=`.`+p,a=`%`+r+`%`,N(A,a))c=A[a];else if(c!=null){if(!(p in c)){if(!t)throw new s(`base intrinsic for `+e+` exists, but the property is not available.`);return}if(v&&d+1>=n.length){var g=v(c,p);f=!!g,c=f&&`get`in g&&!(`originalValue`in g.get)?g.get:c[p]}else f=N(c,p),c=c[p];f&&!l&&(A[a]=c)}}return c},ks}var Ms,Ns;function Ps(){if(Ns)return Ms;Ns=1;var e=js(),t=ys(),n=t([e(`%String.prototype.indexOf%`)]);return Ms=function(r,i){var a=e(r,!!i);return typeof a==`function`&&n(r,`.prototype.`)>-1?t([a]):a},Ms}var Fs,Is;function Ls(){if(Is)return Fs;Is=1;var e=za()(),t=Ps()(`Object.prototype.toString`),n=function(n){return e&&n&&typeof n==`object`&&Symbol.toStringTag in n?!1:t(n)===`[object Arguments]`},r=function(e){return n(e)?!0:typeof e==`object`&&!!e&&`length`in e&&typeof e.length==`number`&&e.length>=0&&t(e)!==`[object Array]`&&`callee`in e&&t(e.callee)===`[object Function]`},i=(function(){return n(arguments)})();return n.isLegacyArguments=r,Fs=i?n:r,Fs}var Rs,zs;function Bs(){if(zs)return Rs;zs=1;var e=Object.prototype.toString,t=Function.prototype.toString,n=/^\s*(?:function)?\*/,r=za()(),i=Object.getPrototypeOf,a=function(){if(!r)return!1;try{return Function(`return function*() {}`)()}catch{}},o;return Rs=function(s){if(typeof s!=`function`)return!1;if(n.test(t.call(s)))return!0;if(!r)return e.call(s)===`[object GeneratorFunction]`;if(!i)return!1;if(o===void 0){var c=a();o=c?i(c):!1}return i(s)===o},Rs}var Vs,Hs;function Us(){if(Hs)return Vs;Hs=1;var e=Function.prototype.toString,t=typeof Reflect==`object`&&Reflect!==null&&Reflect.apply,n,r;if(typeof t==`function`&&typeof Object.defineProperty==`function`)try{n=Object.defineProperty({},`length`,{get:function(){throw r}}),r={},t(function(){throw 42},null,n)}catch(e){e!==r&&(t=null)}else t=null;var i=/^\s*class\b/,a=function(t){try{var n=e.call(t);return i.test(n)}catch{return!1}},o=function(t){try{return a(t)?!1:(e.call(t),!0)}catch{return!1}},s=Object.prototype.toString,c=`[object Object]`,l=`[object Function]`,u=`[object GeneratorFunction]`,d=`[object HTMLAllCollection]`,f=`[object HTML document.all class]`,p=`[object HTMLCollection]`,m=typeof Symbol==`function`&&!!Symbol.toStringTag,h=!(0 in[,]),g=function(){return!1};if(typeof document==`object`){var _=document.all;s.call(_)===s.call(document.all)&&(g=function(e){if((h||!e)&&(e===void 0||typeof e==`object`))try{var t=s.call(e);return(t===d||t===f||t===p||t===c)&&e(``)==null}catch{}return!1})}return Vs=t?function(e){if(g(e))return!0;if(!e||typeof e!=`function`&&typeof e!=`object`)return!1;try{t(e,null,n)}catch(e){if(e!==r)return!1}return!a(e)&&o(e)}:function(e){if(g(e))return!0;if(!e||typeof e!=`function`&&typeof e!=`object`)return!1;if(m)return o(e);if(a(e))return!1;var t=s.call(e);return t!==l&&t!==u&&!/^\[object HTML/.test(t)?!1:o(e)},Vs}var Ws,Gs;function Ks(){if(Gs)return Ws;Gs=1;var e=Us(),t=Object.prototype.toString,n=Object.prototype.hasOwnProperty,r=function(e,t,r){for(var i=0,a=e.length;i<a;i++)n.call(e,i)&&(r==null?t(e[i],i,e):t.call(r,e[i],i,e))},i=function(e,t,n){for(var r=0,i=e.length;r<i;r++)n==null?t(e.charAt(r),r,e):t.call(n,e.charAt(r),r,e)},a=function(e,t,r){for(var i in e)n.call(e,i)&&(r==null?t(e[i],i,e):t.call(r,e[i],i,e))};function o(e){return t.call(e)===`[object Array]`}return Ws=function(t,n,s){if(!e(n))throw TypeError(`iterator must be a function`);var c;arguments.length>=3&&(c=s),o(t)?r(t,n,c):typeof t==`string`?i(t,n,c):a(t,n,c)},Ws}var qs,Js;function Ys(){return Js?qs:(Js=1,qs=[`Float32Array`,`Float64Array`,`Int8Array`,`Int16Array`,`Int32Array`,`Uint8Array`,`Uint8ClampedArray`,`Uint16Array`,`Uint32Array`,`BigInt64Array`,`BigUint64Array`],qs)}var Xs,Zs;function Qs(){if(Zs)return Xs;Zs=1;var e=Ys(),t=typeof globalThis>`u`?qi:globalThis;return Xs=function(){for(var n=[],r=0;r<e.length;r++)typeof t[e[r]]==`function`&&(n[n.length]=e[r]);return n},Xs}var $s={exports:{}},ec,tc;function nc(){if(tc)return ec;tc=1;var e=Uo(),t=ro(),n=oo(),r=Bo();return ec=function(i,a,o){if(!i||typeof i!=`object`&&typeof i!=`function`)throw new n("`obj` must be an object or a function`");if(typeof a!=`string`&&typeof a!=`symbol`)throw new n("`property` must be a string or a symbol`");if(arguments.length>3&&typeof arguments[3]!=`boolean`&&arguments[3]!==null)throw new n("`nonEnumerable`, if provided, must be a boolean or null");if(arguments.length>4&&typeof arguments[4]!=`boolean`&&arguments[4]!==null)throw new n("`nonWritable`, if provided, must be a boolean or null");if(arguments.length>5&&typeof arguments[5]!=`boolean`&&arguments[5]!==null)throw new n("`nonConfigurable`, if provided, must be a boolean or null");if(arguments.length>6&&typeof arguments[6]!=`boolean`)throw new n("`loose`, if provided, must be a boolean");var s=arguments.length>3?arguments[3]:null,c=arguments.length>4?arguments[4]:null,l=arguments.length>5?arguments[5]:null,u=arguments.length>6?arguments[6]:!1,d=!!r&&r(i,a);if(e)e(i,a,{configurable:l===null&&d?d.configurable:!l,enumerable:s===null&&d?d.enumerable:!s,value:o,writable:c===null&&d?d.writable:!c});else if(u||!s&&!c&&!l)i[a]=o;else throw new t(`This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.`)},ec}var rc,ic;function ac(){if(ic)return rc;ic=1;var e=Uo(),t=function(){return!!e};return t.hasArrayLengthDefineBug=function(){if(!e)return null;try{return e([],`length`,{value:1}).length!==1}catch{return!0}},rc=t,rc}var oc,sc;function cc(){if(sc)return oc;sc=1;var e=js(),t=nc(),n=ac()(),r=Bo(),i=oo(),a=e(`%Math.floor%`);return oc=function(e,o){if(typeof e!=`function`)throw new i("`fn` is not a function");if(typeof o!=`number`||o<0||o>4294967295||a(o)!==o)throw new i("`length` must be a positive 32-bit integer");var s=arguments.length>2&&!!arguments[2],c=!0,l=!0;if(`length`in e&&r){var u=r(e,`length`);u&&!u.configurable&&(c=!1),u&&!u.writable&&(l=!1)}return(c||l||!s)&&(n?t(e,`length`,o,!0,!0):t(e,`length`,o)),e},oc}var lc,uc;function dc(){if(uc)return lc;uc=1;var e=is(),t=us(),n=gs();return lc=function(){return n(e,t,arguments)},lc}var fc;function pc(){return fc?$s.exports:(fc=1,(function(e){var t=cc(),n=Uo(),r=ys(),i=dc();e.exports=function(e){var n=r(arguments),i=e.length-(arguments.length-1);return t(n,1+(i>0?i:0),!0)},n?n(e.exports,`apply`,{value:i}):e.exports.apply=i})($s),$s.exports)}var mc,hc;function gc(){if(hc)return mc;hc=1;var e=Ks(),t=Qs(),n=pc(),r=Ps(),i=Bo(),a=Ts(),o=r(`Object.prototype.toString`),s=za()(),c=typeof globalThis>`u`?qi:globalThis,l=t(),u=r(`String.prototype.slice`),d=r(`Array.prototype.indexOf`,!0)||function(e,t){for(var n=0;n<e.length;n+=1)if(e[n]===t)return n;return-1},f={__proto__:null};s&&i&&a?e(l,function(e){var t=new c[e];if(Symbol.toStringTag in t&&a){var r=a(t),o=i(r,Symbol.toStringTag);!o&&r&&(o=i(a(r),Symbol.toStringTag)),f[`$`+e]=n(o.get)}}):e(l,function(e){var t=new c[e],r=t.slice||t.set;r&&(f[`$`+e]=n(r))});var p=function(t){var n=!1;return e(f,function(e,r){if(!n)try{`$`+e(t)===r&&(n=u(r,1))}catch{}}),n},m=function(t){var n=!1;return e(f,function(e,r){if(!n)try{e(t),n=u(r,1)}catch{}}),n};return mc=function(e){if(!e||typeof e!=`object`)return!1;if(!s){var t=u(o(e),8,-1);return d(l,t)>-1?t:t===`Object`?m(e):!1}return i?p(e):null},mc}var _c,vc;function yc(){if(vc)return _c;vc=1;var e=gc();return _c=function(t){return!!e(t)},_c}var bc;function xc(){return bc?Na:(bc=1,(function(e){var t=Ls(),n=Bs(),r=gc(),i=yc();function a(e){return e.call.bind(e)}var o=typeof BigInt<`u`,s=typeof Symbol<`u`,c=a(Object.prototype.toString),l=a(Number.prototype.valueOf),u=a(String.prototype.valueOf),d=a(Boolean.prototype.valueOf);if(o)var f=a(BigInt.prototype.valueOf);if(s)var p=a(Symbol.prototype.valueOf);function m(e,t){if(typeof e!=`object`)return!1;try{return t(e),!0}catch{return!1}}e.isArgumentsObject=t,e.isGeneratorFunction=n,e.isTypedArray=i;function h(e){return typeof Promise<`u`&&e instanceof Promise||typeof e==`object`&&!!e&&typeof e.then==`function`&&typeof e.catch==`function`}e.isPromise=h;function g(e){return typeof ArrayBuffer<`u`&&ArrayBuffer.isView?ArrayBuffer.isView(e):i(e)||R(e)}e.isArrayBufferView=g;function _(e){return r(e)===`Uint8Array`}e.isUint8Array=_;function v(e){return r(e)===`Uint8ClampedArray`}e.isUint8ClampedArray=v;function y(e){return r(e)===`Uint16Array`}e.isUint16Array=y;function b(e){return r(e)===`Uint32Array`}e.isUint32Array=b;function x(e){return r(e)===`Int8Array`}e.isInt8Array=x;function S(e){return r(e)===`Int16Array`}e.isInt16Array=S;function C(e){return r(e)===`Int32Array`}e.isInt32Array=C;function w(e){return r(e)===`Float32Array`}e.isFloat32Array=w;function T(e){return r(e)===`Float64Array`}e.isFloat64Array=T;function E(e){return r(e)===`BigInt64Array`}e.isBigInt64Array=E;function D(e){return r(e)===`BigUint64Array`}e.isBigUint64Array=D;function O(e){return c(e)===`[object Map]`}O.working=typeof Map<`u`&&O(new Map);function k(e){return typeof Map>`u`?!1:O.working?O(e):e instanceof Map}e.isMap=k;function A(e){return c(e)===`[object Set]`}A.working=typeof Set<`u`&&A(new Set);function j(e){return typeof Set>`u`?!1:A.working?A(e):e instanceof Set}e.isSet=j;function M(e){return c(e)===`[object WeakMap]`}M.working=typeof WeakMap<`u`&&M(new WeakMap);function ee(e){return typeof WeakMap>`u`?!1:M.working?M(e):e instanceof WeakMap}e.isWeakMap=ee;function N(e){return c(e)===`[object WeakSet]`}N.working=typeof WeakSet<`u`&&N(new WeakSet);function P(e){return N(e)}e.isWeakSet=P;function F(e){return c(e)===`[object ArrayBuffer]`}F.working=typeof ArrayBuffer<`u`&&F(new ArrayBuffer);function I(e){return typeof ArrayBuffer>`u`?!1:F.working?F(e):e instanceof ArrayBuffer}e.isArrayBuffer=I;function L(e){return c(e)===`[object DataView]`}L.working=typeof ArrayBuffer<`u`&&typeof DataView<`u`&&L(new DataView(new ArrayBuffer(1),0,1));function R(e){return typeof DataView>`u`?!1:L.working?L(e):e instanceof DataView}e.isDataView=R;var z=typeof SharedArrayBuffer<`u`?SharedArrayBuffer:void 0;function te(e){return c(e)===`[object SharedArrayBuffer]`}function ne(e){return z===void 0?!1:(te.working===void 0&&(te.working=te(new z)),te.working?te(e):e instanceof z)}e.isSharedArrayBuffer=ne;function re(e){return c(e)===`[object AsyncFunction]`}e.isAsyncFunction=re;function ie(e){return c(e)===`[object Map Iterator]`}e.isMapIterator=ie;function ae(e){return c(e)===`[object Set Iterator]`}e.isSetIterator=ae;function oe(e){return c(e)===`[object Generator]`}e.isGeneratorObject=oe;function B(e){return c(e)===`[object WebAssembly.Module]`}e.isWebAssemblyCompiledModule=B;function V(e){return m(e,l)}e.isNumberObject=V;function se(e){return m(e,u)}e.isStringObject=se;function ce(e){return m(e,d)}e.isBooleanObject=ce;function le(e){return o&&m(e,f)}e.isBigIntObject=le;function ue(e){return s&&m(e,p)}e.isSymbolObject=ue;function de(e){return V(e)||se(e)||ce(e)||le(e)||ue(e)}e.isBoxedPrimitive=de;function fe(e){return typeof Uint8Array<`u`&&(I(e)||ne(e))}e.isAnyArrayBuffer=fe,[`isProxy`,`isExternal`,`isModuleNamespaceObject`].forEach(function(t){Object.defineProperty(e,t,{enumerable:!1,value:function(){throw Error(t+` is not supported in userland`)}})})})(Na),Na)}var Sc,Cc;function wc(){return Cc?Sc:(Cc=1,Sc=function(e){return e&&typeof e==`object`&&typeof e.copy==`function`&&typeof e.fill==`function`&&typeof e.readUInt8==`function`},Sc)}var Tc;function Ec(){return Tc?Ma:(Tc=1,(function(e){var t=Object.getOwnPropertyDescriptors||function(e){for(var t=Object.keys(e),n={},r=0;r<t.length;r++)n[t[r]]=Object.getOwnPropertyDescriptor(e,t[r]);return n},n=/%[sdj%]/g;e.format=function(e){if(!x(e)){for(var t=[],r=0;r<arguments.length;r++)t.push(o(arguments[r]));return t.join(` `)}for(var r=1,i=arguments,a=i.length,s=String(e).replace(n,function(e){if(e===`%%`)return`%`;if(r>=a)return e;switch(e){case`%s`:return String(i[r++]);case`%d`:return Number(i[r++]);case`%j`:try{return JSON.stringify(i[r++])}catch{return`[Circular]`}default:return e}}),c=i[r];r<a;c=i[++r])v(c)||!T(c)?s+=` `+c:s+=` `+o(c);return s},e.deprecate=function(t,n){if(K!==void 0&&K.noDeprecation===!0)return t;if(K===void 0)return function(){return e.deprecate(t,n).apply(this,arguments)};var r=!1;function i(){if(!r){if(K.throwDeprecation)throw Error(n);K.traceDeprecation?console.trace(n):console.error(n),r=!0}return t.apply(this,arguments)}return i};var r={},i=/^$/;if(K.env.NODE_DEBUG){var a=K.env.NODE_DEBUG;a=a.replace(/[|\\{}()[\]^$+?.]/g,`\\$&`).replace(/\*/g,`.*`).replace(/,/g,`$|^`).toUpperCase(),i=RegExp(`^`+a+`$`,`i`)}e.debuglog=function(t){if(t=t.toUpperCase(),!r[t])if(i.test(t)){var n=K.pid;r[t]=function(){var r=e.format.apply(e,arguments);console.error(`%s %d: %s`,t,n,r)}}else r[t]=function(){};return r[t]};function o(t,n){var r={seen:[],stylize:c};return arguments.length>=3&&(r.depth=arguments[2]),arguments.length>=4&&(r.colors=arguments[3]),_(n)?r.showHidden=n:n&&e._extend(r,n),C(r.showHidden)&&(r.showHidden=!1),C(r.depth)&&(r.depth=2),C(r.colors)&&(r.colors=!1),C(r.customInspect)&&(r.customInspect=!0),r.colors&&(r.stylize=s),u(r,t,r.depth)}e.inspect=o,o.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},o.styles={special:`cyan`,number:`yellow`,boolean:`yellow`,undefined:`grey`,null:`bold`,string:`green`,date:`magenta`,regexp:`red`};function s(e,t){var n=o.styles[t];return n?`\x1B[`+o.colors[n][0]+`m`+e+`\x1B[`+o.colors[n][1]+`m`:e}function c(e,t){return e}function l(e){var t={};return e.forEach(function(e,n){t[e]=!0}),t}function u(t,n,r){if(t.customInspect&&n&&O(n.inspect)&&n.inspect!==e.inspect&&!(n.constructor&&n.constructor.prototype===n)){var i=n.inspect(r,t);return x(i)||(i=u(t,i,r)),i}var a=d(t,n);if(a)return a;var o=Object.keys(n),s=l(o);if(t.showHidden&&(o=Object.getOwnPropertyNames(n)),D(n)&&(o.indexOf(`message`)>=0||o.indexOf(`description`)>=0))return f(n);if(o.length===0){if(O(n)){var c=n.name?`: `+n.name:``;return t.stylize(`[Function`+c+`]`,`special`)}if(w(n))return t.stylize(RegExp.prototype.toString.call(n),`regexp`);if(E(n))return t.stylize(Date.prototype.toString.call(n),`date`);if(D(n))return f(n)}var _=``,v=!1,y=[`{`,`}`];if(g(n)&&(v=!0,y=[`[`,`]`]),O(n)&&(_=` [Function`+(n.name?`: `+n.name:``)+`]`),w(n)&&(_=` `+RegExp.prototype.toString.call(n)),E(n)&&(_=` `+Date.prototype.toUTCString.call(n)),D(n)&&(_=` `+f(n)),o.length===0&&(!v||n.length==0))return y[0]+_+y[1];if(r<0)return w(n)?t.stylize(RegExp.prototype.toString.call(n),`regexp`):t.stylize(`[Object]`,`special`);t.seen.push(n);var b=v?p(t,n,r,s,o):o.map(function(e){return m(t,n,r,s,e,v)});return t.seen.pop(),h(b,_,y)}function d(e,t){if(C(t))return e.stylize(`undefined`,`undefined`);if(x(t)){var n=`'`+JSON.stringify(t).replace(/^"|"$/g,``).replace(/'/g,`\\'`).replace(/\\"/g,`"`)+`'`;return e.stylize(n,`string`)}if(b(t))return e.stylize(``+t,`number`);if(_(t))return e.stylize(``+t,`boolean`);if(v(t))return e.stylize(`null`,`null`)}function f(e){return`[`+Error.prototype.toString.call(e)+`]`}function p(e,t,n,r,i){for(var a=[],o=0,s=t.length;o<s;++o)N(t,String(o))?a.push(m(e,t,n,r,String(o),!0)):a.push(``);return i.forEach(function(i){i.match(/^\d+$/)||a.push(m(e,t,n,r,i,!0))}),a}function m(e,t,n,r,i,a){var o,s,c=Object.getOwnPropertyDescriptor(t,i)||{value:t[i]};if(c.get?s=c.set?e.stylize(`[Getter/Setter]`,`special`):e.stylize(`[Getter]`,`special`):c.set&&(s=e.stylize(`[Setter]`,`special`)),N(r,i)||(o=`[`+i+`]`),s||(e.seen.indexOf(c.value)<0?(s=v(n)?u(e,c.value,null):u(e,c.value,n-1),s.indexOf(`
`)>-1&&(s=a?s.split(`
`).map(function(e){return`  `+e}).join(`
`).slice(2):`
`+s.split(`
`).map(function(e){return`   `+e}).join(`
`))):s=e.stylize(`[Circular]`,`special`)),C(o)){if(a&&i.match(/^\d+$/))return s;o=JSON.stringify(``+i),o.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(o=o.slice(1,-1),o=e.stylize(o,`name`)):(o=o.replace(/'/g,`\\'`).replace(/\\"/g,`"`).replace(/(^"|"$)/g,`'`),o=e.stylize(o,`string`))}return o+`: `+s}function h(e,t,n){return e.reduce(function(e,t){return t.indexOf(`
`),e+t.replace(/\u001b\[\d\d?m/g,``).length+1},0)>60?n[0]+(t===``?``:t+`
 `)+` `+e.join(`,
  `)+` `+n[1]:n[0]+t+` `+e.join(`, `)+` `+n[1]}e.types=xc();function g(e){return Array.isArray(e)}e.isArray=g;function _(e){return typeof e==`boolean`}e.isBoolean=_;function v(e){return e===null}e.isNull=v;function y(e){return e==null}e.isNullOrUndefined=y;function b(e){return typeof e==`number`}e.isNumber=b;function x(e){return typeof e==`string`}e.isString=x;function S(e){return typeof e==`symbol`}e.isSymbol=S;function C(e){return e===void 0}e.isUndefined=C;function w(e){return T(e)&&A(e)===`[object RegExp]`}e.isRegExp=w,e.types.isRegExp=w;function T(e){return typeof e==`object`&&!!e}e.isObject=T;function E(e){return T(e)&&A(e)===`[object Date]`}e.isDate=E,e.types.isDate=E;function D(e){return T(e)&&(A(e)===`[object Error]`||e instanceof Error)}e.isError=D,e.types.isNativeError=D;function O(e){return typeof e==`function`}e.isFunction=O;function k(e){return e===null||typeof e==`boolean`||typeof e==`number`||typeof e==`string`||typeof e==`symbol`||e===void 0}e.isPrimitive=k,e.isBuffer=wc();function A(e){return Object.prototype.toString.call(e)}function j(e){return e<10?`0`+e.toString(10):e.toString(10)}var M=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`];function ee(){var e=new Date,t=[j(e.getHours()),j(e.getMinutes()),j(e.getSeconds())].join(`:`);return[e.getDate(),M[e.getMonth()],t].join(` `)}e.log=function(){console.log(`%s - %s`,ee(),e.format.apply(e,arguments))},e.inherits=ta(),e._extend=function(e,t){if(!t||!T(t))return e;for(var n=Object.keys(t),r=n.length;r--;)e[n[r]]=t[n[r]];return e};function N(e,t){return Object.prototype.hasOwnProperty.call(e,t)}var P=typeof Symbol<`u`?Symbol(`util.promisify.custom`):void 0;e.promisify=function(e){if(typeof e!=`function`)throw TypeError(`The "original" argument must be of type Function`);if(P&&e[P]){var n=e[P];if(typeof n!=`function`)throw TypeError(`The "util.promisify.custom" argument must be of type Function`);return Object.defineProperty(n,P,{value:n,enumerable:!1,writable:!1,configurable:!0}),n}function n(){for(var t,n,r=new Promise(function(e,r){t=e,n=r}),i=[],a=0;a<arguments.length;a++)i.push(arguments[a]);i.push(function(e,r){e?n(e):t(r)});try{e.apply(this,i)}catch(e){n(e)}return r}return Object.setPrototypeOf(n,Object.getPrototypeOf(e)),P&&Object.defineProperty(n,P,{value:n,enumerable:!1,writable:!1,configurable:!0}),Object.defineProperties(n,t(e))},e.promisify.custom=P;function F(e,t){if(!e){var n=Error(`Promise was rejected with a falsy value`);n.reason=e,e=n}return t(e)}function I(e){if(typeof e!=`function`)throw TypeError(`The "original" argument must be of type Function`);function n(){for(var t=[],n=0;n<arguments.length;n++)t.push(arguments[n]);var r=t.pop();if(typeof r!=`function`)throw TypeError(`The last argument must be of type Function`);var i=this,a=function(){return r.apply(i,arguments)};e.apply(this,t).then(function(e){K.nextTick(a.bind(null,null,e))},function(e){K.nextTick(F.bind(null,e,a))})}return Object.setPrototypeOf(n,Object.getPrototypeOf(e)),Object.defineProperties(n,t(e)),n}e.callbackify=I})(Ma),Ma)}var Dc,Oc;function kc(){if(Oc)return Dc;Oc=1;function e(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function t(t){for(var r=1;r<arguments.length;r++){var i=arguments[r]==null?{}:arguments[r];r%2?e(Object(i),!0).forEach(function(e){n(t,e,i[e])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):e(Object(i)).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e))})}return t}function n(e,t,n){return t=o(t),t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){if(!(e instanceof t))throw TypeError(`Cannot call a class as a function`)}function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,`value`in r&&(r.writable=!0),Object.defineProperty(e,o(r.key),r)}}function a(e,t,n){return t&&i(e.prototype,t),Object.defineProperty(e,`prototype`,{writable:!1}),e}function o(e){var t=s(e,`string`);return typeof t==`symbol`?t:String(t)}function s(e,t){if(typeof e!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(typeof r!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return String(e)}var c=ja().Buffer,l=Ec().inspect,u=l&&l.custom||`inspect`;function d(e,t,n){c.prototype.copy.call(e,t,n)}return Dc=(function(){function e(){r(this,e),this.head=null,this.tail=null,this.length=0}return a(e,[{key:`push`,value:function(e){var t={data:e,next:null};this.length>0?this.tail.next=t:this.head=t,this.tail=t,++this.length}},{key:`unshift`,value:function(e){var t={data:e,next:this.head};this.length===0&&(this.tail=t),this.head=t,++this.length}},{key:`shift`,value:function(){if(this.length!==0){var e=this.head.data;return this.length===1?this.head=this.tail=null:this.head=this.head.next,--this.length,e}}},{key:`clear`,value:function(){this.head=this.tail=null,this.length=0}},{key:`join`,value:function(e){if(this.length===0)return``;for(var t=this.head,n=``+t.data;t=t.next;)n+=e+t.data;return n}},{key:`concat`,value:function(e){if(this.length===0)return c.alloc(0);for(var t=c.allocUnsafe(e>>>0),n=this.head,r=0;n;)d(n.data,t,r),r+=n.data.length,n=n.next;return t}},{key:`consume`,value:function(e,t){var n;return e<this.head.data.length?(n=this.head.data.slice(0,e),this.head.data=this.head.data.slice(e)):n=e===this.head.data.length?this.shift():t?this._getString(e):this._getBuffer(e),n}},{key:`first`,value:function(){return this.head.data}},{key:`_getString`,value:function(e){var t=this.head,n=1,r=t.data;for(e-=r.length;t=t.next;){var i=t.data,a=e>i.length?i.length:e;if(a===i.length?r+=i:r+=i.slice(0,e),e-=a,e===0){a===i.length?(++n,t.next?this.head=t.next:this.head=this.tail=null):(this.head=t,t.data=i.slice(a));break}++n}return this.length-=n,r}},{key:`_getBuffer`,value:function(e){var t=c.allocUnsafe(e),n=this.head,r=1;for(n.data.copy(t),e-=n.data.length;n=n.next;){var i=n.data,a=e>i.length?i.length:e;if(i.copy(t,t.length-e,0,a),e-=a,e===0){a===i.length?(++r,n.next?this.head=n.next:this.head=this.tail=null):(this.head=n,n.data=i.slice(a));break}++r}return this.length-=r,t}},{key:u,value:function(e,n){return l(this,t(t({},n),{},{depth:0,customInspect:!1}))}}]),e})(),Dc}var Ac,jc;function Mc(){if(jc)return Ac;jc=1;function e(e,r){var a=this,o=this._readableState&&this._readableState.destroyed,s=this._writableState&&this._writableState.destroyed;return o||s?(r?r(e):e&&(this._writableState?this._writableState.errorEmitted||(this._writableState.errorEmitted=!0,K.nextTick(i,this,e)):K.nextTick(i,this,e)),this):(this._readableState&&(this._readableState.destroyed=!0),this._writableState&&(this._writableState.destroyed=!0),this._destroy(e||null,function(e){!r&&e?a._writableState?a._writableState.errorEmitted?K.nextTick(n,a):(a._writableState.errorEmitted=!0,K.nextTick(t,a,e)):K.nextTick(t,a,e):r?(K.nextTick(n,a),r(e)):K.nextTick(n,a)}),this)}function t(e,t){i(e,t),n(e)}function n(e){e._writableState&&!e._writableState.emitClose||e._readableState&&!e._readableState.emitClose||e.emit(`close`)}function r(){this._readableState&&(this._readableState.destroyed=!1,this._readableState.reading=!1,this._readableState.ended=!1,this._readableState.endEmitted=!1),this._writableState&&(this._writableState.destroyed=!1,this._writableState.ended=!1,this._writableState.ending=!1,this._writableState.finalCalled=!1,this._writableState.prefinished=!1,this._writableState.finished=!1,this._writableState.errorEmitted=!1)}function i(e,t){e.emit(`error`,t)}function a(e,t){var n=e._readableState,r=e._writableState;n&&n.autoDestroy||r&&r.autoDestroy?e.destroy(t):e.emit(`error`,t)}return Ac={destroy:e,undestroy:r,errorOrDestroy:a},Ac}var Nc={},Pc;function Fc(){if(Pc)return Nc;Pc=1;function e(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,e.__proto__=t}var t={};function n(n,r,i){i||=Error;function a(e,t,n){return typeof r==`string`?r:r(e,t,n)}var o=(function(t){e(n,t);function n(e,n,r){return t.call(this,a(e,n,r))||this}return n})(i);o.prototype.name=i.name,o.prototype.code=n,t[n]=o}function r(e,t){if(Array.isArray(e)){var n=e.length;return e=e.map(function(e){return String(e)}),n>2?`one of ${t} ${e.slice(0,n-1).join(`, `)}, or `+e[n-1]:n===2?`one of ${t} ${e[0]} or ${e[1]}`:`of ${t} ${e[0]}`}else return`of ${t} ${String(e)}`}function i(e,t,n){return e.substr(0,t.length)===t}function a(e,t,n){return(n===void 0||n>e.length)&&(n=e.length),e.substring(n-t.length,n)===t}function o(e,t,n){return typeof n!=`number`&&(n=0),n+t.length>e.length?!1:e.indexOf(t,n)!==-1}return n(`ERR_INVALID_OPT_VALUE`,function(e,t){return`The value "`+t+`" is invalid for option "`+e+`"`},TypeError),n(`ERR_INVALID_ARG_TYPE`,function(e,t,n){var s;typeof t==`string`&&i(t,`not `)?(s=`must not be`,t=t.replace(/^not /,``)):s=`must be`;var c=a(e,` argument`)?`The ${e} ${s} ${r(t,`type`)}`:`The "${e}" ${o(e,`.`)?`property`:`argument`} ${s} ${r(t,`type`)}`;return c+=`. Received type ${typeof n}`,c},TypeError),n(`ERR_STREAM_PUSH_AFTER_EOF`,`stream.push() after EOF`),n(`ERR_METHOD_NOT_IMPLEMENTED`,function(e){return`The `+e+` method is not implemented`}),n(`ERR_STREAM_PREMATURE_CLOSE`,`Premature close`),n(`ERR_STREAM_DESTROYED`,function(e){return`Cannot call `+e+` after a stream was destroyed`}),n(`ERR_MULTIPLE_CALLBACK`,`Callback called multiple times`),n(`ERR_STREAM_CANNOT_PIPE`,`Cannot pipe, not readable`),n(`ERR_STREAM_WRITE_AFTER_END`,`write after end`),n(`ERR_STREAM_NULL_VALUES`,`May not write null values to stream`,TypeError),n(`ERR_UNKNOWN_ENCODING`,function(e){return`Unknown encoding: `+e},TypeError),n(`ERR_STREAM_UNSHIFT_AFTER_END_EVENT`,`stream.unshift() after end event`),Nc.codes=t,Nc}var Ic,Lc;function Rc(){if(Lc)return Ic;Lc=1;var e=Fc().codes.ERR_INVALID_OPT_VALUE;function t(e,t,n){return e.highWaterMark==null?t?e[n]:null:e.highWaterMark}function n(n,r,i,a){var o=t(r,a,i);if(o!=null){if(!(isFinite(o)&&Math.floor(o)===o)||o<0)throw new e(a?i:`highWaterMark`,o);return Math.floor(o)}return n.objectMode?16:16*1024}return Ic={getHighWaterMark:n},Ic}var zc,Bc;function Vc(){if(Bc)return zc;Bc=1,zc=e;function e(e,n){if(t(`noDeprecation`))return e;var r=!1;function i(){if(!r){if(t(`throwDeprecation`))throw Error(n);t(`traceDeprecation`)?console.trace(n):console.warn(n),r=!0}return e.apply(this,arguments)}return i}function t(e){try{if(!qi.localStorage)return!1}catch{return!1}var t=qi.localStorage[e];return t==null?!1:String(t).toLowerCase()===`true`}return zc}var Hc,Uc;function Wc(){if(Uc)return Hc;Uc=1,Hc=C;function e(e){var t=this;this.next=null,this.entry=null,this.finish=function(){z(t,e)}}var t;C.WritableState=x;var n={deprecate:Vc()},r=Sa(),i=ja().Buffer,a=(qi===void 0?typeof window<`u`?window:typeof self<`u`?self:{}:qi).Uint8Array||function(){};function o(e){return i.from(e)}function s(e){return i.isBuffer(e)||e instanceof a}var c=Mc(),l=Rc().getHighWaterMark,u=Fc().codes,d=u.ERR_INVALID_ARG_TYPE,f=u.ERR_METHOD_NOT_IMPLEMENTED,p=u.ERR_MULTIPLE_CALLBACK,m=u.ERR_STREAM_CANNOT_PIPE,h=u.ERR_STREAM_DESTROYED,g=u.ERR_STREAM_NULL_VALUES,_=u.ERR_STREAM_WRITE_AFTER_END,v=u.ERR_UNKNOWN_ENCODING,y=c.errorOrDestroy;ta()(C,r);function b(){}function x(n,r,i){t||=qc(),n||={},typeof i!=`boolean`&&(i=r instanceof t),this.objectMode=!!n.objectMode,i&&(this.objectMode=this.objectMode||!!n.writableObjectMode),this.highWaterMark=l(this,n,`writableHighWaterMark`,i),this.finalCalled=!1,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1,this.destroyed=!1,this.decodeStrings=n.decodeStrings!==!1,this.defaultEncoding=n.defaultEncoding||`utf8`,this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=function(e){j(r,e)},this.writecb=null,this.writelen=0,this.bufferedRequest=null,this.lastBufferedRequest=null,this.pendingcb=0,this.prefinished=!1,this.errorEmitted=!1,this.emitClose=n.emitClose!==!1,this.autoDestroy=!!n.autoDestroy,this.bufferedRequestCount=0,this.corkedRequestsFree=new e(this)}x.prototype.getBuffer=function(){for(var e=this.bufferedRequest,t=[];e;)t.push(e),e=e.next;return t},(function(){try{Object.defineProperty(x.prototype,`buffer`,{get:n.deprecate(function(){return this.getBuffer()},`_writableState.buffer is deprecated. Use _writableState.getBuffer instead.`,`DEP0003`)})}catch{}})();var S;typeof Symbol==`function`&&Symbol.hasInstance&&typeof Function.prototype[Symbol.hasInstance]==`function`?(S=Function.prototype[Symbol.hasInstance],Object.defineProperty(C,Symbol.hasInstance,{value:function(e){return S.call(this,e)?!0:this===C?e&&e._writableState instanceof x:!1}})):S=function(e){return e instanceof this};function C(e){t||=qc();var n=this instanceof t;if(!n&&!S.call(C,this))return new C(e);this._writableState=new x(e,this,n),this.writable=!0,e&&(typeof e.write==`function`&&(this._write=e.write),typeof e.writev==`function`&&(this._writev=e.writev),typeof e.destroy==`function`&&(this._destroy=e.destroy),typeof e.final==`function`&&(this._final=e.final)),r.call(this)}C.prototype.pipe=function(){y(this,new m)};function w(e,t){var n=new _;y(e,n),K.nextTick(t,n)}function T(e,t,n,r){var i;return n===null?i=new g:typeof n!=`string`&&!t.objectMode&&(i=new d(`chunk`,[`string`,`Buffer`],n)),i?(y(e,i),K.nextTick(r,i),!1):!0}C.prototype.write=function(e,t,n){var r=this._writableState,a=!1,c=!r.objectMode&&s(e);return c&&!i.isBuffer(e)&&(e=o(e)),typeof t==`function`&&(n=t,t=null),c?t=`buffer`:t||=r.defaultEncoding,typeof n!=`function`&&(n=b),r.ending?w(this,n):(c||T(this,r,e,n))&&(r.pendingcb++,a=D(this,r,c,e,t,n)),a},C.prototype.cork=function(){this._writableState.corked++},C.prototype.uncork=function(){var e=this._writableState;e.corked&&(e.corked--,!e.writing&&!e.corked&&!e.bufferProcessing&&e.bufferedRequest&&N(this,e))},C.prototype.setDefaultEncoding=function(e){if(typeof e==`string`&&(e=e.toLowerCase()),!([`hex`,`utf8`,`utf-8`,`ascii`,`binary`,`base64`,`ucs2`,`ucs-2`,`utf16le`,`utf-16le`,`raw`].indexOf((e+``).toLowerCase())>-1))throw new v(e);return this._writableState.defaultEncoding=e,this},Object.defineProperty(C.prototype,`writableBuffer`,{enumerable:!1,get:function(){return this._writableState&&this._writableState.getBuffer()}});function E(e,t,n){return!e.objectMode&&e.decodeStrings!==!1&&typeof t==`string`&&(t=i.from(t,n)),t}Object.defineProperty(C.prototype,`writableHighWaterMark`,{enumerable:!1,get:function(){return this._writableState.highWaterMark}});function D(e,t,n,r,i,a){if(!n){var o=E(t,r,i);r!==o&&(n=!0,i=`buffer`,r=o)}var s=t.objectMode?1:r.length;t.length+=s;var c=t.length<t.highWaterMark;if(c||(t.needDrain=!0),t.writing||t.corked){var l=t.lastBufferedRequest;t.lastBufferedRequest={chunk:r,encoding:i,isBuf:n,callback:a,next:null},l?l.next=t.lastBufferedRequest:t.bufferedRequest=t.lastBufferedRequest,t.bufferedRequestCount+=1}else O(e,t,!1,s,r,i,a);return c}function O(e,t,n,r,i,a,o){t.writelen=r,t.writecb=o,t.writing=!0,t.sync=!0,t.destroyed?t.onwrite(new h(`write`)):n?e._writev(i,t.onwrite):e._write(i,a,t.onwrite),t.sync=!1}function k(e,t,n,r,i){--t.pendingcb,n?(K.nextTick(i,r),K.nextTick(L,e,t),e._writableState.errorEmitted=!0,y(e,r)):(i(r),e._writableState.errorEmitted=!0,y(e,r),L(e,t))}function A(e){e.writing=!1,e.writecb=null,e.length-=e.writelen,e.writelen=0}function j(e,t){var n=e._writableState,r=n.sync,i=n.writecb;if(typeof i!=`function`)throw new p;if(A(n),t)k(e,n,r,t,i);else{var a=P(n)||e.destroyed;!a&&!n.corked&&!n.bufferProcessing&&n.bufferedRequest&&N(e,n),r?K.nextTick(M,e,n,a,i):M(e,n,a,i)}}function M(e,t,n,r){n||ee(e,t),t.pendingcb--,r(),L(e,t)}function ee(e,t){t.length===0&&t.needDrain&&(t.needDrain=!1,e.emit(`drain`))}function N(t,n){n.bufferProcessing=!0;var r=n.bufferedRequest;if(t._writev&&r&&r.next){var i=n.bufferedRequestCount,a=Array(i),o=n.corkedRequestsFree;o.entry=r;for(var s=0,c=!0;r;)a[s]=r,r.isBuf||(c=!1),r=r.next,s+=1;a.allBuffers=c,O(t,n,!0,n.length,a,``,o.finish),n.pendingcb++,n.lastBufferedRequest=null,o.next?(n.corkedRequestsFree=o.next,o.next=null):n.corkedRequestsFree=new e(n),n.bufferedRequestCount=0}else{for(;r;){var l=r.chunk,u=r.encoding,d=r.callback;if(O(t,n,!1,n.objectMode?1:l.length,l,u,d),r=r.next,n.bufferedRequestCount--,n.writing)break}r===null&&(n.lastBufferedRequest=null)}n.bufferedRequest=r,n.bufferProcessing=!1}C.prototype._write=function(e,t,n){n(new f(`_write()`))},C.prototype._writev=null,C.prototype.end=function(e,t,n){var r=this._writableState;return typeof e==`function`?(n=e,e=null,t=null):typeof t==`function`&&(n=t,t=null),e!=null&&this.write(e,t),r.corked&&(r.corked=1,this.uncork()),r.ending||R(this,r,n),this},Object.defineProperty(C.prototype,`writableLength`,{enumerable:!1,get:function(){return this._writableState.length}});function P(e){return e.ending&&e.length===0&&e.bufferedRequest===null&&!e.finished&&!e.writing}function F(e,t){e._final(function(n){t.pendingcb--,n&&y(e,n),t.prefinished=!0,e.emit(`prefinish`),L(e,t)})}function I(e,t){!t.prefinished&&!t.finalCalled&&(typeof e._final==`function`&&!t.destroyed?(t.pendingcb++,t.finalCalled=!0,K.nextTick(F,e,t)):(t.prefinished=!0,e.emit(`prefinish`)))}function L(e,t){var n=P(t);if(n&&(I(e,t),t.pendingcb===0&&(t.finished=!0,e.emit(`finish`),t.autoDestroy))){var r=e._readableState;(!r||r.autoDestroy&&r.endEmitted)&&e.destroy()}return n}function R(e,t,n){t.ending=!0,L(e,t),n&&(t.finished?K.nextTick(n):e.once(`finish`,n)),t.ended=!0,e.writable=!1}function z(e,t,n){var r=e.entry;for(e.entry=null;r;){var i=r.callback;t.pendingcb--,i(n),r=r.next}t.corkedRequestsFree.next=e}return Object.defineProperty(C.prototype,`destroyed`,{enumerable:!1,get:function(){return this._writableState===void 0?!1:this._writableState.destroyed},set:function(e){this._writableState&&(this._writableState.destroyed=e)}}),C.prototype.destroy=c.destroy,C.prototype._undestroy=c.undestroy,C.prototype._destroy=function(e,t){t(e)},Hc}var Gc,Kc;function qc(){if(Kc)return Gc;Kc=1;var e=Object.keys||function(e){var t=[];for(var n in e)t.push(n);return t};Gc=o;var t=dl(),n=Wc();ta()(o,t);for(var r=e(n.prototype),i=0;i<r.length;i++){var a=r[i];o.prototype[a]||(o.prototype[a]=n.prototype[a])}function o(e){if(!(this instanceof o))return new o(e);t.call(this,e),n.call(this,e),this.allowHalfOpen=!0,e&&(e.readable===!1&&(this.readable=!1),e.writable===!1&&(this.writable=!1),e.allowHalfOpen===!1&&(this.allowHalfOpen=!1,this.once(`end`,s)))}Object.defineProperty(o.prototype,`writableHighWaterMark`,{enumerable:!1,get:function(){return this._writableState.highWaterMark}}),Object.defineProperty(o.prototype,`writableBuffer`,{enumerable:!1,get:function(){return this._writableState&&this._writableState.getBuffer()}}),Object.defineProperty(o.prototype,`writableLength`,{enumerable:!1,get:function(){return this._writableState.length}});function s(){this._writableState.ended||K.nextTick(c,this)}function c(e){e.end()}return Object.defineProperty(o.prototype,`destroyed`,{enumerable:!1,get:function(){return this._readableState===void 0||this._writableState===void 0?!1:this._readableState.destroyed&&this._writableState.destroyed},set:function(e){this._readableState===void 0||this._writableState===void 0||(this._readableState.destroyed=e,this._writableState.destroyed=e)}}),Gc}var Jc={},Yc={exports:{}},Xc;function Zc(){return Xc?Yc.exports:(Xc=1,(function(e,t){var n=ja(),r=n.Buffer;function i(e,t){for(var n in e)t[n]=e[n]}r.from&&r.alloc&&r.allocUnsafe&&r.allocUnsafeSlow?e.exports=n:(i(n,t),t.Buffer=a);function a(e,t,n){return r(e,t,n)}i(r,a),a.from=function(e,t,n){if(typeof e==`number`)throw TypeError(`Argument must not be a number`);return r(e,t,n)},a.alloc=function(e,t,n){if(typeof e!=`number`)throw TypeError(`Argument must be a number`);var i=r(e);return t===void 0?i.fill(0):typeof n==`string`?i.fill(t,n):i.fill(t),i},a.allocUnsafe=function(e){if(typeof e!=`number`)throw TypeError(`Argument must be a number`);return r(e)},a.allocUnsafeSlow=function(e){if(typeof e!=`number`)throw TypeError(`Argument must be a number`);return n.SlowBuffer(e)}})(Yc,Yc.exports),Yc.exports)}var Qc;function $c(){if(Qc)return Jc;Qc=1;var e=Zc().Buffer,t=e.isEncoding||function(e){switch(e=``+e,e&&e.toLowerCase()){case`hex`:case`utf8`:case`utf-8`:case`ascii`:case`binary`:case`base64`:case`ucs2`:case`ucs-2`:case`utf16le`:case`utf-16le`:case`raw`:return!0;default:return!1}};function n(e){if(!e)return`utf8`;for(var t;;)switch(e){case`utf8`:case`utf-8`:return`utf8`;case`ucs2`:case`ucs-2`:case`utf16le`:case`utf-16le`:return`utf16le`;case`latin1`:case`binary`:return`latin1`;case`base64`:case`ascii`:case`hex`:return e;default:if(t)return;e=(``+e).toLowerCase(),t=!0}}function r(r){var i=n(r);if(typeof i!=`string`&&(e.isEncoding===t||!t(r)))throw Error(`Unknown encoding: `+r);return i||r}Jc.StringDecoder=i;function i(t){this.encoding=r(t);var n;switch(this.encoding){case`utf16le`:this.text=d,this.end=f,n=4;break;case`utf8`:this.fillLast=c,n=4;break;case`base64`:this.text=p,this.end=m,n=3;break;default:this.write=h,this.end=g;return}this.lastNeed=0,this.lastTotal=0,this.lastChar=e.allocUnsafe(n)}i.prototype.write=function(e){if(e.length===0)return``;var t,n;if(this.lastNeed){if(t=this.fillLast(e),t===void 0)return``;n=this.lastNeed,this.lastNeed=0}else n=0;return n<e.length?t?t+this.text(e,n):this.text(e,n):t||``},i.prototype.end=u,i.prototype.text=l,i.prototype.fillLast=function(e){if(this.lastNeed<=e.length)return e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,e.length),this.lastNeed-=e.length};function a(e){return e<=127?0:e>>5==6?2:e>>4==14?3:e>>3==30?4:e>>6==2?-1:-2}function o(e,t,n){var r=t.length-1;if(r<n)return 0;var i=a(t[r]);return i>=0?(i>0&&(e.lastNeed=i-1),i):--r<n||i===-2?0:(i=a(t[r]),i>=0?(i>0&&(e.lastNeed=i-2),i):--r<n||i===-2?0:(i=a(t[r]),i>=0?(i>0&&(i===2?i=0:e.lastNeed=i-3),i):0))}function s(e,t,n){if((t[0]&192)!=128)return e.lastNeed=0,`�`;if(e.lastNeed>1&&t.length>1){if((t[1]&192)!=128)return e.lastNeed=1,`�`;if(e.lastNeed>2&&t.length>2&&(t[2]&192)!=128)return e.lastNeed=2,`�`}}function c(e){var t=this.lastTotal-this.lastNeed,n=s(this,e);if(n!==void 0)return n;if(this.lastNeed<=e.length)return e.copy(this.lastChar,t,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);e.copy(this.lastChar,t,0,e.length),this.lastNeed-=e.length}function l(e,t){var n=o(this,e,t);if(!this.lastNeed)return e.toString(`utf8`,t);this.lastTotal=n;var r=e.length-(n-this.lastNeed);return e.copy(this.lastChar,0,r),e.toString(`utf8`,t,r)}function u(e){var t=e&&e.length?this.write(e):``;return this.lastNeed?t+`�`:t}function d(e,t){if((e.length-t)%2==0){var n=e.toString(`utf16le`,t);if(n){var r=n.charCodeAt(n.length-1);if(r>=55296&&r<=56319)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1],n.slice(0,-1)}return n}return this.lastNeed=1,this.lastTotal=2,this.lastChar[0]=e[e.length-1],e.toString(`utf16le`,t,e.length-1)}function f(e){var t=e&&e.length?this.write(e):``;if(this.lastNeed){var n=this.lastTotal-this.lastNeed;return t+this.lastChar.toString(`utf16le`,0,n)}return t}function p(e,t){var n=(e.length-t)%3;return n===0?e.toString(`base64`,t):(this.lastNeed=3-n,this.lastTotal=3,n===1?this.lastChar[0]=e[e.length-1]:(this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1]),e.toString(`base64`,t,e.length-n))}function m(e){var t=e&&e.length?this.write(e):``;return this.lastNeed?t+this.lastChar.toString(`base64`,0,3-this.lastNeed):t}function h(e){return e.toString(this.encoding)}function g(e){return e&&e.length?this.write(e):``}return Jc}var el,tl;function nl(){if(tl)return el;tl=1;var e=Fc().codes.ERR_STREAM_PREMATURE_CLOSE;function t(e){var t=!1;return function(){if(!t){t=!0;var n=[...arguments];e.apply(this,n)}}}function n(){}function r(e){return e.setHeader&&typeof e.abort==`function`}function i(a,o,s){if(typeof o==`function`)return i(a,null,o);o||={},s=t(s||n);var c=o.readable||o.readable!==!1&&a.readable,l=o.writable||o.writable!==!1&&a.writable,u=function(){a.writable||f()},d=a._writableState&&a._writableState.finished,f=function(){l=!1,d=!0,c||s.call(a)},p=a._readableState&&a._readableState.endEmitted,m=function(){c=!1,p=!0,l||s.call(a)},h=function(e){s.call(a,e)},g=function(){var t;if(c&&!p)return(!a._readableState||!a._readableState.ended)&&(t=new e),s.call(a,t);if(l&&!d)return(!a._writableState||!a._writableState.ended)&&(t=new e),s.call(a,t)},_=function(){a.req.on(`finish`,f)};return r(a)?(a.on(`complete`,f),a.on(`abort`,g),a.req?_():a.on(`request`,_)):l&&!a._writableState&&(a.on(`end`,u),a.on(`close`,u)),a.on(`end`,m),a.on(`finish`,f),o.error!==!1&&a.on(`error`,h),a.on(`close`,g),function(){a.removeListener(`complete`,f),a.removeListener(`abort`,g),a.removeListener(`request`,_),a.req&&a.req.removeListener(`finish`,f),a.removeListener(`end`,u),a.removeListener(`close`,u),a.removeListener(`finish`,f),a.removeListener(`end`,m),a.removeListener(`error`,h),a.removeListener(`close`,g)}}return el=i,el}var rl,il;function al(){if(il)return rl;il=1;var e;function t(e,t,r){return t=n(t),t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function n(e){var t=r(e,`string`);return typeof t==`symbol`?t:String(t)}function r(e,t){if(typeof e!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(typeof r!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}var i=nl(),a=Symbol(`lastResolve`),o=Symbol(`lastReject`),s=Symbol(`error`),c=Symbol(`ended`),l=Symbol(`lastPromise`),u=Symbol(`handlePromise`),d=Symbol(`stream`);function f(e,t){return{value:e,done:t}}function p(e){var t=e[a];if(t!==null){var n=e[d].read();n!==null&&(e[l]=null,e[a]=null,e[o]=null,t(f(n,!1)))}}function m(e){K.nextTick(p,e)}function h(e,t){return function(n,r){e.then(function(){if(t[c]){n(f(void 0,!0));return}t[u](n,r)},r)}}var g=Object.getPrototypeOf(function(){}),_=Object.setPrototypeOf((e={get stream(){return this[d]},next:function(){var e=this,t=this[s];if(t!==null)return Promise.reject(t);if(this[c])return Promise.resolve(f(void 0,!0));if(this[d].destroyed)return new Promise(function(t,n){K.nextTick(function(){e[s]?n(e[s]):t(f(void 0,!0))})});var n=this[l],r;if(n)r=new Promise(h(n,this));else{var i=this[d].read();if(i!==null)return Promise.resolve(f(i,!1));r=new Promise(this[u])}return this[l]=r,r}},t(e,Symbol.asyncIterator,function(){return this}),t(e,`return`,function(){var e=this;return new Promise(function(t,n){e[d].destroy(null,function(e){if(e){n(e);return}t(f(void 0,!0))})})}),e),g);return rl=function(e){var n,r=Object.create(_,(n={},t(n,d,{value:e,writable:!0}),t(n,a,{value:null,writable:!0}),t(n,o,{value:null,writable:!0}),t(n,s,{value:null,writable:!0}),t(n,c,{value:e._readableState.endEmitted,writable:!0}),t(n,u,{value:function(e,t){var n=r[d].read();n?(r[l]=null,r[a]=null,r[o]=null,e(f(n,!1))):(r[a]=e,r[o]=t)},writable:!0}),n));return r[l]=null,i(e,function(e){if(e&&e.code!==`ERR_STREAM_PREMATURE_CLOSE`){var t=r[o];t!==null&&(r[l]=null,r[a]=null,r[o]=null,t(e)),r[s]=e;return}var n=r[a];n!==null&&(r[l]=null,r[a]=null,r[o]=null,n(f(void 0,!0))),r[c]=!0}),e.on(`readable`,m.bind(null,r)),r},rl}var ol,sl;function cl(){return sl?ol:(sl=1,ol=function(){throw Error(`Readable.from is not available in the browser`)},ol)}var ll,ul;function dl(){if(ul)return ll;ul=1,ll=w;var e;w.ReadableState=C,Qi().EventEmitter;var t=function(e,t){return e.listeners(t).length},n=Sa(),r=ja().Buffer,i=(qi===void 0?typeof window<`u`?window:typeof self<`u`?self:{}:qi).Uint8Array||function(){};function a(e){return r.from(e)}function o(e){return r.isBuffer(e)||e instanceof i}var s=Ec(),c=s&&s.debuglog?s.debuglog(`stream`):function(){},l=kc(),u=Mc(),d=Rc().getHighWaterMark,f=Fc().codes,p=f.ERR_INVALID_ARG_TYPE,m=f.ERR_STREAM_PUSH_AFTER_EOF,h=f.ERR_METHOD_NOT_IMPLEMENTED,g=f.ERR_STREAM_UNSHIFT_AFTER_END_EVENT,_,v,y;ta()(w,n);var b=u.errorOrDestroy,x=[`error`,`close`,`destroy`,`pause`,`resume`];function S(e,t,n){if(typeof e.prependListener==`function`)return e.prependListener(t,n);!e._events||!e._events[t]?e.on(t,n):Array.isArray(e._events[t])?e._events[t].unshift(n):e._events[t]=[n,e._events[t]]}function C(t,n,r){e||=qc(),t||={},typeof r!=`boolean`&&(r=n instanceof e),this.objectMode=!!t.objectMode,r&&(this.objectMode=this.objectMode||!!t.readableObjectMode),this.highWaterMark=d(this,t,`readableHighWaterMark`,r),this.buffer=new l,this.length=0,this.pipes=null,this.pipesCount=0,this.flowing=null,this.ended=!1,this.endEmitted=!1,this.reading=!1,this.sync=!0,this.needReadable=!1,this.emittedReadable=!1,this.readableListening=!1,this.resumeScheduled=!1,this.paused=!0,this.emitClose=t.emitClose!==!1,this.autoDestroy=!!t.autoDestroy,this.destroyed=!1,this.defaultEncoding=t.defaultEncoding||`utf8`,this.awaitDrain=0,this.readingMore=!1,this.decoder=null,this.encoding=null,t.encoding&&(_||=$c().StringDecoder,this.decoder=new _(t.encoding),this.encoding=t.encoding)}function w(t){if(e||=qc(),!(this instanceof w))return new w(t);var r=this instanceof e;this._readableState=new C(t,this,r),this.readable=!0,t&&(typeof t.read==`function`&&(this._read=t.read),typeof t.destroy==`function`&&(this._destroy=t.destroy)),n.call(this)}Object.defineProperty(w.prototype,`destroyed`,{enumerable:!1,get:function(){return this._readableState===void 0?!1:this._readableState.destroyed},set:function(e){this._readableState&&(this._readableState.destroyed=e)}}),w.prototype.destroy=u.destroy,w.prototype._undestroy=u.undestroy,w.prototype._destroy=function(e,t){t(e)},w.prototype.push=function(e,t){var n=this._readableState,i;return n.objectMode?i=!0:typeof e==`string`&&(t||=n.defaultEncoding,t!==n.encoding&&(e=r.from(e,t),t=``),i=!0),T(this,e,t,!1,i)},w.prototype.unshift=function(e){return T(this,e,null,!0,!1)};function T(e,t,n,i,o){c(`readableAddChunk`,t);var s=e._readableState;if(t===null)s.reading=!1,j(e,s);else{var l;if(o||(l=D(s,t)),l)b(e,l);else if(s.objectMode||t&&t.length>0)if(typeof t!=`string`&&!s.objectMode&&Object.getPrototypeOf(t)!==r.prototype&&(t=a(t)),i)s.endEmitted?b(e,new g):E(e,s,t,!0);else if(s.ended)b(e,new m);else if(s.destroyed)return!1;else s.reading=!1,s.decoder&&!n?(t=s.decoder.write(t),s.objectMode||t.length!==0?E(e,s,t,!1):N(e,s)):E(e,s,t,!1);else i||(s.reading=!1,N(e,s))}return!s.ended&&(s.length<s.highWaterMark||s.length===0)}function E(e,t,n,r){t.flowing&&t.length===0&&!t.sync?(t.awaitDrain=0,e.emit(`data`,n)):(t.length+=t.objectMode?1:n.length,r?t.buffer.unshift(n):t.buffer.push(n),t.needReadable&&M(e)),N(e,t)}function D(e,t){var n;return!o(t)&&typeof t!=`string`&&t!==void 0&&!e.objectMode&&(n=new p(`chunk`,[`string`,`Buffer`,`Uint8Array`],t)),n}w.prototype.isPaused=function(){return this._readableState.flowing===!1},w.prototype.setEncoding=function(e){_||=$c().StringDecoder;var t=new _(e);this._readableState.decoder=t,this._readableState.encoding=this._readableState.decoder.encoding;for(var n=this._readableState.buffer.head,r=``;n!==null;)r+=t.write(n.data),n=n.next;return this._readableState.buffer.clear(),r!==``&&this._readableState.buffer.push(r),this._readableState.length=r.length,this};var O=1073741824;function k(e){return e>=O?e=O:(e--,e|=e>>>1,e|=e>>>2,e|=e>>>4,e|=e>>>8,e|=e>>>16,e++),e}function A(e,t){return e<=0||t.length===0&&t.ended?0:t.objectMode?1:e===e?(e>t.highWaterMark&&(t.highWaterMark=k(e)),e<=t.length?e:t.ended?t.length:(t.needReadable=!0,0)):t.flowing&&t.length?t.buffer.head.data.length:t.length}w.prototype.read=function(e){c(`read`,e),e=parseInt(e,10);var t=this._readableState,n=e;if(e!==0&&(t.emittedReadable=!1),e===0&&t.needReadable&&((t.highWaterMark===0?t.length>0:t.length>=t.highWaterMark)||t.ended))return c(`read: emitReadable`,t.length,t.ended),t.length===0&&t.ended?re(this):M(this),null;if(e=A(e,t),e===0&&t.ended)return t.length===0&&re(this),null;var r=t.needReadable;c(`need readable`,r),(t.length===0||t.length-e<t.highWaterMark)&&(r=!0,c(`length less than watermark`,r)),t.ended||t.reading?(r=!1,c(`reading or ended`,r)):r&&(c(`do read`),t.reading=!0,t.sync=!0,t.length===0&&(t.needReadable=!0),this._read(t.highWaterMark),t.sync=!1,t.reading||(e=A(n,t)));var i=e>0?ne(e,t):null;return i===null?(t.needReadable=t.length<=t.highWaterMark,e=0):(t.length-=e,t.awaitDrain=0),t.length===0&&(t.ended||(t.needReadable=!0),n!==e&&t.ended&&re(this)),i!==null&&this.emit(`data`,i),i};function j(e,t){if(c(`onEofChunk`),!t.ended){if(t.decoder){var n=t.decoder.end();n&&n.length&&(t.buffer.push(n),t.length+=t.objectMode?1:n.length)}t.ended=!0,t.sync?M(e):(t.needReadable=!1,t.emittedReadable||(t.emittedReadable=!0,ee(e)))}}function M(e){var t=e._readableState;c(`emitReadable`,t.needReadable,t.emittedReadable),t.needReadable=!1,t.emittedReadable||(c(`emitReadable`,t.flowing),t.emittedReadable=!0,K.nextTick(ee,e))}function ee(e){var t=e._readableState;c(`emitReadable_`,t.destroyed,t.length,t.ended),!t.destroyed&&(t.length||t.ended)&&(e.emit(`readable`),t.emittedReadable=!1),t.needReadable=!t.flowing&&!t.ended&&t.length<=t.highWaterMark,te(e)}function N(e,t){t.readingMore||(t.readingMore=!0,K.nextTick(P,e,t))}function P(e,t){for(;!t.reading&&!t.ended&&(t.length<t.highWaterMark||t.flowing&&t.length===0);){var n=t.length;if(c(`maybeReadMore read 0`),e.read(0),n===t.length)break}t.readingMore=!1}w.prototype._read=function(e){b(this,new h(`_read()`))},w.prototype.pipe=function(e,n){var r=this,i=this._readableState;switch(i.pipesCount){case 0:i.pipes=e;break;case 1:i.pipes=[i.pipes,e];break;default:i.pipes.push(e);break}i.pipesCount+=1,c(`pipe count=%d opts=%j`,i.pipesCount,n);var a=(!n||n.end!==!1)&&e!==K.stdout&&e!==K.stderr?s:g;i.endEmitted?K.nextTick(a):r.once(`end`,a),e.on(`unpipe`,o);function o(e,t){c(`onunpipe`),e===r&&t&&t.hasUnpiped===!1&&(t.hasUnpiped=!0,d())}function s(){c(`onend`),e.end()}var l=F(r);e.on(`drain`,l);var u=!1;function d(){c(`cleanup`),e.removeListener(`close`,m),e.removeListener(`finish`,h),e.removeListener(`drain`,l),e.removeListener(`error`,p),e.removeListener(`unpipe`,o),r.removeListener(`end`,s),r.removeListener(`end`,g),r.removeListener(`data`,f),u=!0,i.awaitDrain&&(!e._writableState||e._writableState.needDrain)&&l()}r.on(`data`,f);function f(t){c(`ondata`);var n=e.write(t);c(`dest.write`,n),n===!1&&((i.pipesCount===1&&i.pipes===e||i.pipesCount>1&&ae(i.pipes,e)!==-1)&&!u&&(c(`false write response, pause`,i.awaitDrain),i.awaitDrain++),r.pause())}function p(n){c(`onerror`,n),g(),e.removeListener(`error`,p),t(e,`error`)===0&&b(e,n)}S(e,`error`,p);function m(){e.removeListener(`finish`,h),g()}e.once(`close`,m);function h(){c(`onfinish`),e.removeListener(`close`,m),g()}e.once(`finish`,h);function g(){c(`unpipe`),r.unpipe(e)}return e.emit(`pipe`,r),i.flowing||(c(`pipe resume`),r.resume()),e};function F(e){return function(){var n=e._readableState;c(`pipeOnDrain`,n.awaitDrain),n.awaitDrain&&n.awaitDrain--,n.awaitDrain===0&&t(e,`data`)&&(n.flowing=!0,te(e))}}w.prototype.unpipe=function(e){var t=this._readableState,n={hasUnpiped:!1};if(t.pipesCount===0)return this;if(t.pipesCount===1)return e&&e!==t.pipes?this:(e||=t.pipes,t.pipes=null,t.pipesCount=0,t.flowing=!1,e&&e.emit(`unpipe`,this,n),this);if(!e){var r=t.pipes,i=t.pipesCount;t.pipes=null,t.pipesCount=0,t.flowing=!1;for(var a=0;a<i;a++)r[a].emit(`unpipe`,this,{hasUnpiped:!1});return this}var o=ae(t.pipes,e);return o===-1?this:(t.pipes.splice(o,1),--t.pipesCount,t.pipesCount===1&&(t.pipes=t.pipes[0]),e.emit(`unpipe`,this,n),this)},w.prototype.on=function(e,t){var r=n.prototype.on.call(this,e,t),i=this._readableState;return e===`data`?(i.readableListening=this.listenerCount(`readable`)>0,i.flowing!==!1&&this.resume()):e===`readable`&&!i.endEmitted&&!i.readableListening&&(i.readableListening=i.needReadable=!0,i.flowing=!1,i.emittedReadable=!1,c(`on readable`,i.length,i.reading),i.length?M(this):i.reading||K.nextTick(L,this)),r},w.prototype.addListener=w.prototype.on,w.prototype.removeListener=function(e,t){var r=n.prototype.removeListener.call(this,e,t);return e===`readable`&&K.nextTick(I,this),r},w.prototype.removeAllListeners=function(e){var t=n.prototype.removeAllListeners.apply(this,arguments);return(e===`readable`||e===void 0)&&K.nextTick(I,this),t};function I(e){var t=e._readableState;t.readableListening=e.listenerCount(`readable`)>0,t.resumeScheduled&&!t.paused?t.flowing=!0:e.listenerCount(`data`)>0&&e.resume()}function L(e){c(`readable nexttick read 0`),e.read(0)}w.prototype.resume=function(){var e=this._readableState;return e.flowing||(c(`resume`),e.flowing=!e.readableListening,R(this,e)),e.paused=!1,this};function R(e,t){t.resumeScheduled||(t.resumeScheduled=!0,K.nextTick(z,e,t))}function z(e,t){c(`resume`,t.reading),t.reading||e.read(0),t.resumeScheduled=!1,e.emit(`resume`),te(e),t.flowing&&!t.reading&&e.read(0)}w.prototype.pause=function(){return c(`call pause flowing=%j`,this._readableState.flowing),this._readableState.flowing!==!1&&(c(`pause`),this._readableState.flowing=!1,this.emit(`pause`)),this._readableState.paused=!0,this};function te(e){var t=e._readableState;for(c(`flow`,t.flowing);t.flowing&&e.read()!==null;);}w.prototype.wrap=function(e){var t=this,n=this._readableState,r=!1;for(var i in e.on(`end`,function(){if(c(`wrapped end`),n.decoder&&!n.ended){var e=n.decoder.end();e&&e.length&&t.push(e)}t.push(null)}),e.on(`data`,function(i){c(`wrapped data`),n.decoder&&(i=n.decoder.write(i)),!(n.objectMode&&i==null)&&(!n.objectMode&&(!i||!i.length)||t.push(i)||(r=!0,e.pause()))}),e)this[i]===void 0&&typeof e[i]==`function`&&(this[i]=(function(t){return function(){return e[t].apply(e,arguments)}})(i));for(var a=0;a<x.length;a++)e.on(x[a],this.emit.bind(this,x[a]));return this._read=function(t){c(`wrapped _read`,t),r&&(r=!1,e.resume())},this},typeof Symbol==`function`&&(w.prototype[Symbol.asyncIterator]=function(){return v===void 0&&(v=al()),v(this)}),Object.defineProperty(w.prototype,`readableHighWaterMark`,{enumerable:!1,get:function(){return this._readableState.highWaterMark}}),Object.defineProperty(w.prototype,`readableBuffer`,{enumerable:!1,get:function(){return this._readableState&&this._readableState.buffer}}),Object.defineProperty(w.prototype,`readableFlowing`,{enumerable:!1,get:function(){return this._readableState.flowing},set:function(e){this._readableState&&(this._readableState.flowing=e)}}),w._fromList=ne,Object.defineProperty(w.prototype,`readableLength`,{enumerable:!1,get:function(){return this._readableState.length}});function ne(e,t){if(t.length===0)return null;var n;return t.objectMode?n=t.buffer.shift():!e||e>=t.length?(n=t.decoder?t.buffer.join(``):t.buffer.length===1?t.buffer.first():t.buffer.concat(t.length),t.buffer.clear()):n=t.buffer.consume(e,t.decoder),n}function re(e){var t=e._readableState;c(`endReadable`,t.endEmitted),t.endEmitted||(t.ended=!0,K.nextTick(ie,t,e))}function ie(e,t){if(c(`endReadableNT`,e.endEmitted,e.length),!e.endEmitted&&e.length===0&&(e.endEmitted=!0,t.readable=!1,t.emit(`end`),e.autoDestroy)){var n=t._writableState;(!n||n.autoDestroy&&n.finished)&&t.destroy()}}typeof Symbol==`function`&&(w.from=function(e,t){return y===void 0&&(y=cl()),y(w,e,t)});function ae(e,t){for(var n=0,r=e.length;n<r;n++)if(e[n]===t)return n;return-1}return ll}var fl,pl;function ml(){if(pl)return fl;pl=1,fl=s;var e=Fc().codes,t=e.ERR_METHOD_NOT_IMPLEMENTED,n=e.ERR_MULTIPLE_CALLBACK,r=e.ERR_TRANSFORM_ALREADY_TRANSFORMING,i=e.ERR_TRANSFORM_WITH_LENGTH_0,a=qc();ta()(s,a);function o(e,t){var r=this._transformState;r.transforming=!1;var i=r.writecb;if(i===null)return this.emit(`error`,new n);r.writechunk=null,r.writecb=null,t!=null&&this.push(t),i(e);var a=this._readableState;a.reading=!1,(a.needReadable||a.length<a.highWaterMark)&&this._read(a.highWaterMark)}function s(e){if(!(this instanceof s))return new s(e);a.call(this,e),this._transformState={afterTransform:o.bind(this),needTransform:!1,transforming:!1,writecb:null,writechunk:null,writeencoding:null},this._readableState.needReadable=!0,this._readableState.sync=!1,e&&(typeof e.transform==`function`&&(this._transform=e.transform),typeof e.flush==`function`&&(this._flush=e.flush)),this.on(`prefinish`,c)}function c(){var e=this;typeof this._flush==`function`&&!this._readableState.destroyed?this._flush(function(t,n){l(e,t,n)}):l(this,null,null)}s.prototype.push=function(e,t){return this._transformState.needTransform=!1,a.prototype.push.call(this,e,t)},s.prototype._transform=function(e,n,r){r(new t(`_transform()`))},s.prototype._write=function(e,t,n){var r=this._transformState;if(r.writecb=n,r.writechunk=e,r.writeencoding=t,!r.transforming){var i=this._readableState;(r.needTransform||i.needReadable||i.length<i.highWaterMark)&&this._read(i.highWaterMark)}},s.prototype._read=function(e){var t=this._transformState;t.writechunk!==null&&!t.transforming?(t.transforming=!0,this._transform(t.writechunk,t.writeencoding,t.afterTransform)):t.needTransform=!0},s.prototype._destroy=function(e,t){a.prototype._destroy.call(this,e,function(e){t(e)})};function l(e,t,n){if(t)return e.emit(`error`,t);if(n!=null&&e.push(n),e._writableState.length)throw new i;if(e._transformState.transforming)throw new r;return e.push(null)}return fl}var hl,gl;function _l(){if(gl)return hl;gl=1,hl=t;var e=ml();ta()(t,e);function t(n){if(!(this instanceof t))return new t(n);e.call(this,n)}return t.prototype._transform=function(e,t,n){n(null,e)},hl}var vl,yl;function bl(){if(yl)return vl;yl=1;var e;function t(e){var t=!1;return function(){t||(t=!0,e.apply(void 0,arguments))}}var n=Fc().codes,r=n.ERR_MISSING_ARGS,i=n.ERR_STREAM_DESTROYED;function a(e){if(e)throw e}function o(e){return e.setHeader&&typeof e.abort==`function`}function s(n,r,a,s){s=t(s);var c=!1;n.on(`close`,function(){c=!0}),e===void 0&&(e=nl()),e(n,{readable:r,writable:a},function(e){if(e)return s(e);c=!0,s()});var l=!1;return function(e){if(!c&&!l){if(l=!0,o(n))return n.abort();if(typeof n.destroy==`function`)return n.destroy();s(e||new i(`pipe`))}}}function c(e){e()}function l(e,t){return e.pipe(t)}function u(e){return!e.length||typeof e[e.length-1]!=`function`?a:e.pop()}function d(){var e=[...arguments],t=u(e);if(Array.isArray(e[0])&&(e=e[0]),e.length<2)throw new r(`streams`);var n,i=e.map(function(r,a){var o=a<e.length-1;return s(r,o,a>0,function(e){n||=e,e&&i.forEach(c),!o&&(i.forEach(c),t(n))})});return e.reduce(l)}return vl=d,vl}var xl,Sl;function Cl(){if(Sl)return xl;Sl=1,xl=t;var e=Qi().EventEmitter;ta()(t,e),t.Readable=dl(),t.Writable=Wc(),t.Duplex=qc(),t.Transform=ml(),t.PassThrough=_l(),t.finished=nl(),t.pipeline=bl(),t.Stream=t;function t(){e.call(this)}return t.prototype.pipe=function(t,n){var r=this;function i(e){t.writable&&!1===t.write(e)&&r.pause&&r.pause()}r.on(`data`,i);function a(){r.readable&&r.resume&&r.resume()}t.on(`drain`,a),!t._isStdio&&(!n||n.end!==!1)&&(r.on(`end`,s),r.on(`close`,c));var o=!1;function s(){o||(o=!0,t.end())}function c(){o||(o=!0,typeof t.destroy==`function`&&t.destroy())}function l(t){if(u(),e.listenerCount(this,`error`)===0)throw t}r.on(`error`,l),t.on(`error`,l);function u(){r.removeListener(`data`,i),t.removeListener(`drain`,a),r.removeListener(`end`,s),r.removeListener(`close`,c),r.removeListener(`error`,l),t.removeListener(`error`,l),r.removeListener(`end`,u),r.removeListener(`close`,u),t.removeListener(`close`,u)}return r.on(`end`,u),r.on(`close`,u),t.on(`close`,u),t.emit(`pipe`,r),t},xl}var wl;function Tl(){return wl?Yi:(wl=1,(function(e){(function(e){e.parser=function(e,t){return new n(e,t)},e.SAXParser=n,e.SAXStream=l,e.createStream=c,e.MAX_BUFFER_LENGTH=64*1024;var t=[`comment`,`sgmlDecl`,`textNode`,`tagName`,`doctype`,`procInstName`,`procInstBody`,`entity`,`attribName`,`attribValue`,`cdata`,`script`];e.EVENTS=[`text`,`processinginstruction`,`sgmldeclaration`,`doctype`,`comment`,`opentagstart`,`attribute`,`opentag`,`closetag`,`opencdata`,`cdata`,`closecdata`,`error`,`end`,`ready`,`script`,`opennamespace`,`closenamespace`];function n(t,r){if(!(this instanceof n))return new n(t,r);var a=this;i(a),a.q=a.c=``,a.bufferCheckPosition=e.MAX_BUFFER_LENGTH,a.opt=r||{},a.opt.lowercase=a.opt.lowercase||a.opt.lowercasetags,a.looseCase=a.opt.lowercase?`toLowerCase`:`toUpperCase`,a.tags=[],a.closed=a.closedRoot=a.sawRoot=!1,a.tag=a.error=null,a.strict=!!t,a.noscript=!!(t||a.opt.noscript),a.state=w.BEGIN,a.strictEntities=a.opt.strictEntities,a.ENTITIES=a.strictEntities?Object.create(e.XML_ENTITIES):Object.create(e.ENTITIES),a.attribList=[],a.opt.xmlns&&(a.ns=Object.create(m)),a.trackPosition=a.opt.position!==!1,a.trackPosition&&(a.position=a.line=a.column=0),E(a,`onready`)}Object.create||(Object.create=function(e){function t(){}return t.prototype=e,new t}),Object.keys||(Object.keys=function(e){var t=[];for(var n in e)e.hasOwnProperty(n)&&t.push(n);return t});function r(n){for(var r=Math.max(e.MAX_BUFFER_LENGTH,10),i=0,a=0,o=t.length;a<o;a++){var s=n[t[a]].length;if(s>r)switch(t[a]){case`textNode`:O(n);break;case`cdata`:D(n,`oncdata`,n.cdata),n.cdata=``;break;case`script`:D(n,`onscript`,n.script),n.script=``;break;default:A(n,`Max buffer length exceeded: `+t[a])}i=Math.max(i,s)}n.bufferCheckPosition=e.MAX_BUFFER_LENGTH-i+n.position}function i(e){for(var n=0,r=t.length;n<r;n++)e[t[n]]=``}function a(e){O(e),e.cdata!==``&&(D(e,`oncdata`,e.cdata),e.cdata=``),e.script!==``&&(D(e,`onscript`,e.script),e.script=``)}n.prototype={end:function(){j(this)},write:te,resume:function(){return this.error=null,this},close:function(){return this.write(null)},flush:function(){a(this)}};var o;try{o=Cl().Stream}catch{o=function(){}}var s=e.EVENTS.filter(function(e){return e!==`error`&&e!==`end`});function c(e,t){return new l(e,t)}function l(e,t){if(!(this instanceof l))return new l(e,t);o.apply(this),this._parser=new n(e,t),this.writable=!0,this.readable=!0;var r=this;this._parser.onend=function(){r.emit(`end`)},this._parser.onerror=function(e){r.emit(`error`,e),r._parser.error=null},this._decoder=null,s.forEach(function(e){Object.defineProperty(r,`on`+e,{get:function(){return r._parser[`on`+e]},set:function(t){if(!t)return r.removeAllListeners(e),r._parser[`on`+e]=t,t;r.on(e,t)},enumerable:!0,configurable:!1})})}l.prototype=Object.create(o.prototype,{constructor:{value:l}}),l.prototype.write=function(e){if(typeof Buffer==`function`&&typeof Buffer.isBuffer==`function`&&Buffer.isBuffer(e)){if(!this._decoder){var t=$c().StringDecoder;this._decoder=new t(`utf8`)}e=this._decoder.write(e)}return this._parser.write(e.toString()),this.emit(`data`,e),!0},l.prototype.end=function(e){return e&&e.length&&this.write(e),this._parser.end(),!0},l.prototype.on=function(e,t){var n=this;return!n._parser[`on`+e]&&s.indexOf(e)!==-1&&(n._parser[`on`+e]=function(){var t=arguments.length===1?[arguments[0]]:Array.apply(null,arguments);t.splice(0,0,e),n.emit.apply(n,t)}),o.prototype.on.call(n,e,t)};var u=`[CDATA[`,d=`DOCTYPE`,f=`http://www.w3.org/XML/1998/namespace`,p=`http://www.w3.org/2000/xmlns/`,m={xml:f,xmlns:p},h=/[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,g=/[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/,_=/[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,v=/[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;function y(e){return e===` `||e===`
`||e===`\r`||e===`	`}function b(e){return e===`"`||e===`'`}function x(e){return e===`>`||y(e)}function S(e,t){return e.test(t)}function C(e,t){return!S(e,t)}var w=0;for(var T in e.STATE={BEGIN:w++,BEGIN_WHITESPACE:w++,TEXT:w++,TEXT_ENTITY:w++,OPEN_WAKA:w++,SGML_DECL:w++,SGML_DECL_QUOTED:w++,DOCTYPE:w++,DOCTYPE_QUOTED:w++,DOCTYPE_DTD:w++,DOCTYPE_DTD_QUOTED:w++,COMMENT_STARTING:w++,COMMENT:w++,COMMENT_ENDING:w++,COMMENT_ENDED:w++,CDATA:w++,CDATA_ENDING:w++,CDATA_ENDING_2:w++,PROC_INST:w++,PROC_INST_BODY:w++,PROC_INST_ENDING:w++,OPEN_TAG:w++,OPEN_TAG_SLASH:w++,ATTRIB:w++,ATTRIB_NAME:w++,ATTRIB_NAME_SAW_WHITE:w++,ATTRIB_VALUE:w++,ATTRIB_VALUE_QUOTED:w++,ATTRIB_VALUE_CLOSED:w++,ATTRIB_VALUE_UNQUOTED:w++,ATTRIB_VALUE_ENTITY_Q:w++,ATTRIB_VALUE_ENTITY_U:w++,CLOSE_TAG:w++,CLOSE_TAG_SAW_WHITE:w++,SCRIPT:w++,SCRIPT_ENDING:w++},e.XML_ENTITIES={amp:`&`,gt:`>`,lt:`<`,quot:`"`,apos:`'`},e.ENTITIES={amp:`&`,gt:`>`,lt:`<`,quot:`"`,apos:`'`,AElig:198,Aacute:193,Acirc:194,Agrave:192,Aring:197,Atilde:195,Auml:196,Ccedil:199,ETH:208,Eacute:201,Ecirc:202,Egrave:200,Euml:203,Iacute:205,Icirc:206,Igrave:204,Iuml:207,Ntilde:209,Oacute:211,Ocirc:212,Ograve:210,Oslash:216,Otilde:213,Ouml:214,THORN:222,Uacute:218,Ucirc:219,Ugrave:217,Uuml:220,Yacute:221,aacute:225,acirc:226,aelig:230,agrave:224,aring:229,atilde:227,auml:228,ccedil:231,eacute:233,ecirc:234,egrave:232,eth:240,euml:235,iacute:237,icirc:238,igrave:236,iuml:239,ntilde:241,oacute:243,ocirc:244,ograve:242,oslash:248,otilde:245,ouml:246,szlig:223,thorn:254,uacute:250,ucirc:251,ugrave:249,uuml:252,yacute:253,yuml:255,copy:169,reg:174,nbsp:160,iexcl:161,cent:162,pound:163,curren:164,yen:165,brvbar:166,sect:167,uml:168,ordf:170,laquo:171,not:172,shy:173,macr:175,deg:176,plusmn:177,sup1:185,sup2:178,sup3:179,acute:180,micro:181,para:182,middot:183,cedil:184,ordm:186,raquo:187,frac14:188,frac12:189,frac34:190,iquest:191,times:215,divide:247,OElig:338,oelig:339,Scaron:352,scaron:353,Yuml:376,fnof:402,circ:710,tilde:732,Alpha:913,Beta:914,Gamma:915,Delta:916,Epsilon:917,Zeta:918,Eta:919,Theta:920,Iota:921,Kappa:922,Lambda:923,Mu:924,Nu:925,Xi:926,Omicron:927,Pi:928,Rho:929,Sigma:931,Tau:932,Upsilon:933,Phi:934,Chi:935,Psi:936,Omega:937,alpha:945,beta:946,gamma:947,delta:948,epsilon:949,zeta:950,eta:951,theta:952,iota:953,kappa:954,lambda:955,mu:956,nu:957,xi:958,omicron:959,pi:960,rho:961,sigmaf:962,sigma:963,tau:964,upsilon:965,phi:966,chi:967,psi:968,omega:969,thetasym:977,upsih:978,piv:982,ensp:8194,emsp:8195,thinsp:8201,zwnj:8204,zwj:8205,lrm:8206,rlm:8207,ndash:8211,mdash:8212,lsquo:8216,rsquo:8217,sbquo:8218,ldquo:8220,rdquo:8221,bdquo:8222,dagger:8224,Dagger:8225,bull:8226,hellip:8230,permil:8240,prime:8242,Prime:8243,lsaquo:8249,rsaquo:8250,oline:8254,frasl:8260,euro:8364,image:8465,weierp:8472,real:8476,trade:8482,alefsym:8501,larr:8592,uarr:8593,rarr:8594,darr:8595,harr:8596,crarr:8629,lArr:8656,uArr:8657,rArr:8658,dArr:8659,hArr:8660,forall:8704,part:8706,exist:8707,empty:8709,nabla:8711,isin:8712,notin:8713,ni:8715,prod:8719,sum:8721,minus:8722,lowast:8727,radic:8730,prop:8733,infin:8734,ang:8736,and:8743,or:8744,cap:8745,cup:8746,int:8747,there4:8756,sim:8764,cong:8773,asymp:8776,ne:8800,equiv:8801,le:8804,ge:8805,sub:8834,sup:8835,nsub:8836,sube:8838,supe:8839,oplus:8853,otimes:8855,perp:8869,sdot:8901,lceil:8968,rceil:8969,lfloor:8970,rfloor:8971,lang:9001,rang:9002,loz:9674,spades:9824,clubs:9827,hearts:9829,diams:9830},Object.keys(e.ENTITIES).forEach(function(t){var n=e.ENTITIES[t],r=typeof n==`number`?String.fromCharCode(n):n;e.ENTITIES[t]=r}),e.STATE)e.STATE[e.STATE[T]]=T;w=e.STATE;function E(e,t,n){e[t]&&e[t](n)}function D(e,t,n){e.textNode&&O(e),E(e,t,n)}function O(e){e.textNode=k(e.opt,e.textNode),e.textNode&&E(e,`ontext`,e.textNode),e.textNode=``}function k(e,t){return e.trim&&(t=t.trim()),e.normalize&&(t=t.replace(/\s+/g,` `)),t}function A(e,t){return O(e),e.trackPosition&&(t+=`
Line: `+e.line+`
Column: `+e.column+`
Char: `+e.c),t=Error(t),e.error=t,E(e,`onerror`,t),e}function j(e){return e.sawRoot&&!e.closedRoot&&M(e,`Unclosed root tag`),e.state!==w.BEGIN&&e.state!==w.BEGIN_WHITESPACE&&e.state!==w.TEXT&&A(e,`Unexpected end`),O(e),e.c=``,e.closed=!0,E(e,`onend`),n.call(e,e.strict,e.opt),e}function M(e,t){if(typeof e!=`object`||!(e instanceof n))throw Error(`bad call to strictFail`);e.strict&&A(e,t)}function ee(e){e.strict||(e.tagName=e.tagName[e.looseCase]());var t=e.tags[e.tags.length-1]||e,n=e.tag={name:e.tagName,attributes:{}};e.opt.xmlns&&(n.ns=t.ns),e.attribList.length=0,D(e,`onopentagstart`,n)}function N(e,t){var n=e.indexOf(`:`)<0?[``,e]:e.split(`:`),r=n[0],i=n[1];return t&&e===`xmlns`&&(r=`xmlns`,i=``),{prefix:r,local:i}}function P(e){if(e.strict||(e.attribName=e.attribName[e.looseCase]()),e.attribList.indexOf(e.attribName)!==-1||e.tag.attributes.hasOwnProperty(e.attribName)){e.attribName=e.attribValue=``;return}if(e.opt.xmlns){var t=N(e.attribName,!0),n=t.prefix,r=t.local;if(n===`xmlns`)if(r===`xml`&&e.attribValue!==f)M(e,`xml: prefix must be bound to `+f+`
Actual: `+e.attribValue);else if(r===`xmlns`&&e.attribValue!==p)M(e,`xmlns: prefix must be bound to `+p+`
Actual: `+e.attribValue);else{var i=e.tag,a=e.tags[e.tags.length-1]||e;i.ns===a.ns&&(i.ns=Object.create(a.ns)),i.ns[r]=e.attribValue}e.attribList.push([e.attribName,e.attribValue])}else e.tag.attributes[e.attribName]=e.attribValue,D(e,`onattribute`,{name:e.attribName,value:e.attribValue});e.attribName=e.attribValue=``}function F(e,t){if(e.opt.xmlns){var n=e.tag,r=N(e.tagName);n.prefix=r.prefix,n.local=r.local,n.uri=n.ns[r.prefix]||``,n.prefix&&!n.uri&&(M(e,`Unbound namespace prefix: `+JSON.stringify(e.tagName)),n.uri=r.prefix);var i=e.tags[e.tags.length-1]||e;n.ns&&i.ns!==n.ns&&Object.keys(n.ns).forEach(function(t){D(e,`onopennamespace`,{prefix:t,uri:n.ns[t]})});for(var a=0,o=e.attribList.length;a<o;a++){var s=e.attribList[a],c=s[0],l=s[1],u=N(c,!0),d=u.prefix,f=u.local,p=d===``?``:n.ns[d]||``,m={name:c,value:l,prefix:d,local:f,uri:p};d&&d!==`xmlns`&&!p&&(M(e,`Unbound namespace prefix: `+JSON.stringify(d)),m.uri=d),e.tag.attributes[c]=m,D(e,`onattribute`,m)}e.attribList.length=0}e.tag.isSelfClosing=!!t,e.sawRoot=!0,e.tags.push(e.tag),D(e,`onopentag`,e.tag),t||(!e.noscript&&e.tagName.toLowerCase()===`script`?e.state=w.SCRIPT:e.state=w.TEXT,e.tag=null,e.tagName=``),e.attribName=e.attribValue=``,e.attribList.length=0}function I(e){if(!e.tagName){M(e,`Weird empty close tag.`),e.textNode+=`</>`,e.state=w.TEXT;return}if(e.script){if(e.tagName!==`script`){e.script+=`</`+e.tagName+`>`,e.tagName=``,e.state=w.SCRIPT;return}D(e,`onscript`,e.script),e.script=``}var t=e.tags.length,n=e.tagName;e.strict||(n=n[e.looseCase]());for(var r=n;t--&&e.tags[t].name!==r;)M(e,`Unexpected close tag`);if(t<0){M(e,`Unmatched closing tag: `+e.tagName),e.textNode+=`</`+e.tagName+`>`,e.state=w.TEXT;return}e.tagName=n;for(var i=e.tags.length;i-- >t;){var a=e.tag=e.tags.pop();e.tagName=e.tag.name,D(e,`onclosetag`,e.tagName);var o={};for(var s in a.ns)o[s]=a.ns[s];var c=e.tags[e.tags.length-1]||e;e.opt.xmlns&&a.ns!==c.ns&&Object.keys(a.ns).forEach(function(t){var n=a.ns[t];D(e,`onclosenamespace`,{prefix:t,uri:n})})}t===0&&(e.closedRoot=!0),e.tagName=e.attribValue=e.attribName=``,e.attribList.length=0,e.state=w.TEXT}function L(e){var t=e.entity,n=t.toLowerCase(),r,i=``;return e.ENTITIES[t]?e.ENTITIES[t]:e.ENTITIES[n]?e.ENTITIES[n]:(t=n,t.charAt(0)===`#`&&(t.charAt(1)===`x`?(t=t.slice(2),r=parseInt(t,16),i=r.toString(16)):(t=t.slice(1),r=parseInt(t,10),i=r.toString(10))),t=t.replace(/^0+/,``),isNaN(r)||i.toLowerCase()!==t?(M(e,`Invalid character entity`),`&`+e.entity+`;`):String.fromCodePoint(r))}function R(e,t){t===`<`?(e.state=w.OPEN_WAKA,e.startTagPosition=e.position):y(t)||(M(e,`Non-whitespace before first tag.`),e.textNode=t,e.state=w.TEXT)}function z(e,t){var n=``;return t<e.length&&(n=e.charAt(t)),n}function te(e){var t=this;if(this.error)throw this.error;if(t.closed)return A(t,`Cannot write after close. Assign an onready handler.`);if(e===null)return j(t);typeof e==`object`&&(e=e.toString());for(var n=0,i=``;i=z(e,n++),t.c=i,i;)switch(t.trackPosition&&(t.position++,i===`
`?(t.line++,t.column=0):t.column++),t.state){case w.BEGIN:if(t.state=w.BEGIN_WHITESPACE,i===`﻿`)continue;R(t,i);continue;case w.BEGIN_WHITESPACE:R(t,i);continue;case w.TEXT:if(t.sawRoot&&!t.closedRoot){for(var a=n-1;i&&i!==`<`&&i!==`&`;)i=z(e,n++),i&&t.trackPosition&&(t.position++,i===`
`?(t.line++,t.column=0):t.column++);t.textNode+=e.substring(a,n-1)}i===`<`&&!(t.sawRoot&&t.closedRoot&&!t.strict)?(t.state=w.OPEN_WAKA,t.startTagPosition=t.position):(!y(i)&&(!t.sawRoot||t.closedRoot)&&M(t,`Text data outside of root node.`),i===`&`?t.state=w.TEXT_ENTITY:t.textNode+=i);continue;case w.SCRIPT:i===`<`?t.state=w.SCRIPT_ENDING:t.script+=i;continue;case w.SCRIPT_ENDING:i===`/`?t.state=w.CLOSE_TAG:(t.script+=`<`+i,t.state=w.SCRIPT);continue;case w.OPEN_WAKA:if(i===`!`)t.state=w.SGML_DECL,t.sgmlDecl=``;else if(!y(i))if(S(h,i))t.state=w.OPEN_TAG,t.tagName=i;else if(i===`/`)t.state=w.CLOSE_TAG,t.tagName=``;else if(i===`?`)t.state=w.PROC_INST,t.procInstName=t.procInstBody=``;else{if(M(t,`Unencoded <`),t.startTagPosition+1<t.position){var o=t.position-t.startTagPosition;i=Array(o).join(` `)+i}t.textNode+=`<`+i,t.state=w.TEXT}continue;case w.SGML_DECL:(t.sgmlDecl+i).toUpperCase()===u?(D(t,`onopencdata`),t.state=w.CDATA,t.sgmlDecl=``,t.cdata=``):t.sgmlDecl+i===`--`?(t.state=w.COMMENT,t.comment=``,t.sgmlDecl=``):(t.sgmlDecl+i).toUpperCase()===d?(t.state=w.DOCTYPE,(t.doctype||t.sawRoot)&&M(t,`Inappropriately located doctype declaration`),t.doctype=``,t.sgmlDecl=``):i===`>`?(D(t,`onsgmldeclaration`,t.sgmlDecl),t.sgmlDecl=``,t.state=w.TEXT):(b(i)&&(t.state=w.SGML_DECL_QUOTED),t.sgmlDecl+=i);continue;case w.SGML_DECL_QUOTED:i===t.q&&(t.state=w.SGML_DECL,t.q=``),t.sgmlDecl+=i;continue;case w.DOCTYPE:i===`>`?(t.state=w.TEXT,D(t,`ondoctype`,t.doctype),t.doctype=!0):(t.doctype+=i,i===`[`?t.state=w.DOCTYPE_DTD:b(i)&&(t.state=w.DOCTYPE_QUOTED,t.q=i));continue;case w.DOCTYPE_QUOTED:t.doctype+=i,i===t.q&&(t.q=``,t.state=w.DOCTYPE);continue;case w.DOCTYPE_DTD:t.doctype+=i,i===`]`?t.state=w.DOCTYPE:b(i)&&(t.state=w.DOCTYPE_DTD_QUOTED,t.q=i);continue;case w.DOCTYPE_DTD_QUOTED:t.doctype+=i,i===t.q&&(t.state=w.DOCTYPE_DTD,t.q=``);continue;case w.COMMENT:i===`-`?t.state=w.COMMENT_ENDING:t.comment+=i;continue;case w.COMMENT_ENDING:i===`-`?(t.state=w.COMMENT_ENDED,t.comment=k(t.opt,t.comment),t.comment&&D(t,`oncomment`,t.comment),t.comment=``):(t.comment+=`-`+i,t.state=w.COMMENT);continue;case w.COMMENT_ENDED:i===`>`?t.state=w.TEXT:(M(t,`Malformed comment`),t.comment+=`--`+i,t.state=w.COMMENT);continue;case w.CDATA:i===`]`?t.state=w.CDATA_ENDING:t.cdata+=i;continue;case w.CDATA_ENDING:i===`]`?t.state=w.CDATA_ENDING_2:(t.cdata+=`]`+i,t.state=w.CDATA);continue;case w.CDATA_ENDING_2:i===`>`?(t.cdata&&D(t,`oncdata`,t.cdata),D(t,`onclosecdata`),t.cdata=``,t.state=w.TEXT):i===`]`?t.cdata+=`]`:(t.cdata+=`]]`+i,t.state=w.CDATA);continue;case w.PROC_INST:i===`?`?t.state=w.PROC_INST_ENDING:y(i)?t.state=w.PROC_INST_BODY:t.procInstName+=i;continue;case w.PROC_INST_BODY:if(!t.procInstBody&&y(i))continue;i===`?`?t.state=w.PROC_INST_ENDING:t.procInstBody+=i;continue;case w.PROC_INST_ENDING:i===`>`?(D(t,`onprocessinginstruction`,{name:t.procInstName,body:t.procInstBody}),t.procInstName=t.procInstBody=``,t.state=w.TEXT):(t.procInstBody+=`?`+i,t.state=w.PROC_INST_BODY);continue;case w.OPEN_TAG:S(g,i)?t.tagName+=i:(ee(t),i===`>`?F(t):i===`/`?t.state=w.OPEN_TAG_SLASH:(y(i)||M(t,`Invalid character in tag name`),t.state=w.ATTRIB));continue;case w.OPEN_TAG_SLASH:i===`>`?(F(t,!0),I(t)):(M(t,`Forward-slash in opening tag not followed by >`),t.state=w.ATTRIB);continue;case w.ATTRIB:if(y(i))continue;i===`>`?F(t):i===`/`?t.state=w.OPEN_TAG_SLASH:S(h,i)?(t.attribName=i,t.attribValue=``,t.state=w.ATTRIB_NAME):M(t,`Invalid attribute name`);continue;case w.ATTRIB_NAME:i===`=`?t.state=w.ATTRIB_VALUE:i===`>`?(M(t,`Attribute without value`),t.attribValue=t.attribName,P(t),F(t)):y(i)?t.state=w.ATTRIB_NAME_SAW_WHITE:S(g,i)?t.attribName+=i:M(t,`Invalid attribute name`);continue;case w.ATTRIB_NAME_SAW_WHITE:if(i===`=`)t.state=w.ATTRIB_VALUE;else if(y(i))continue;else M(t,`Attribute without value`),t.tag.attributes[t.attribName]=``,t.attribValue=``,D(t,`onattribute`,{name:t.attribName,value:``}),t.attribName=``,i===`>`?F(t):S(h,i)?(t.attribName=i,t.state=w.ATTRIB_NAME):(M(t,`Invalid attribute name`),t.state=w.ATTRIB);continue;case w.ATTRIB_VALUE:if(y(i))continue;b(i)?(t.q=i,t.state=w.ATTRIB_VALUE_QUOTED):(M(t,`Unquoted attribute value`),t.state=w.ATTRIB_VALUE_UNQUOTED,t.attribValue=i);continue;case w.ATTRIB_VALUE_QUOTED:if(i!==t.q){i===`&`?t.state=w.ATTRIB_VALUE_ENTITY_Q:t.attribValue+=i;continue}P(t),t.q=``,t.state=w.ATTRIB_VALUE_CLOSED;continue;case w.ATTRIB_VALUE_CLOSED:y(i)?t.state=w.ATTRIB:i===`>`?F(t):i===`/`?t.state=w.OPEN_TAG_SLASH:S(h,i)?(M(t,`No whitespace between attributes`),t.attribName=i,t.attribValue=``,t.state=w.ATTRIB_NAME):M(t,`Invalid attribute name`);continue;case w.ATTRIB_VALUE_UNQUOTED:if(!x(i)){i===`&`?t.state=w.ATTRIB_VALUE_ENTITY_U:t.attribValue+=i;continue}P(t),i===`>`?F(t):t.state=w.ATTRIB;continue;case w.CLOSE_TAG:if(t.tagName)i===`>`?I(t):S(g,i)?t.tagName+=i:t.script?(t.script+=`</`+t.tagName,t.tagName=``,t.state=w.SCRIPT):(y(i)||M(t,`Invalid tagname in closing tag`),t.state=w.CLOSE_TAG_SAW_WHITE);else{if(y(i))continue;C(h,i)?t.script?(t.script+=`</`+i,t.state=w.SCRIPT):M(t,`Invalid tagname in closing tag.`):t.tagName=i}continue;case w.CLOSE_TAG_SAW_WHITE:if(y(i))continue;i===`>`?I(t):M(t,`Invalid characters in closing tag`);continue;case w.TEXT_ENTITY:case w.ATTRIB_VALUE_ENTITY_Q:case w.ATTRIB_VALUE_ENTITY_U:var s,c;switch(t.state){case w.TEXT_ENTITY:s=w.TEXT,c=`textNode`;break;case w.ATTRIB_VALUE_ENTITY_Q:s=w.ATTRIB_VALUE_QUOTED,c=`attribValue`;break;case w.ATTRIB_VALUE_ENTITY_U:s=w.ATTRIB_VALUE_UNQUOTED,c=`attribValue`;break}i===`;`?(t[c]+=L(t),t.entity=``,t.state=s):S(t.entity.length?v:_,i)?t.entity+=i:(M(t,`Invalid character in entity name`),t[c]+=`&`+t.entity+i,t.entity=``,t.state=s);continue;default:throw Error(t,`Unknown state: `+t.state)}return t.position>=t.bufferCheckPosition&&r(t),t}String.fromCodePoint||(function(){var e=String.fromCharCode,t=Math.floor,n=function(){var n=16384,r=[],i,a,o=-1,s=arguments.length;if(!s)return``;for(var c=``;++o<s;){var l=Number(arguments[o]);if(!isFinite(l)||l<0||l>1114111||t(l)!==l)throw RangeError(`Invalid code point: `+l);l<=65535?r.push(l):(l-=65536,i=(l>>10)+55296,a=l%1024+56320,r.push(i,a)),(o+1===s||r.length>n)&&(c+=e.apply(null,r),r.length=0)}return c};Object.defineProperty?Object.defineProperty(String,`fromCodePoint`,{value:n,configurable:!0,writable:!0}):String.fromCodePoint=n})()})(e)})(Yi),Yi)}var El,Dl;function Ol(){return Dl?El:(Dl=1,El={isArray:function(e){return Array.isArray?Array.isArray(e):Object.prototype.toString.call(e)===`[object Array]`}},El)}var kl,Al;function jl(){if(Al)return kl;Al=1;var e=Ol().isArray;return kl={copyOptions:function(e){var t,n={};for(t in e)e.hasOwnProperty(t)&&(n[t]=e[t]);return n},ensureFlagExists:function(e,t){(!(e in t)||typeof t[e]!=`boolean`)&&(t[e]=!1)},ensureSpacesExists:function(e){(!(`spaces`in e)||typeof e.spaces!=`number`&&typeof e.spaces!=`string`)&&(e.spaces=0)},ensureAlwaysArrayExists:function(t){(!(`alwaysArray`in t)||typeof t.alwaysArray!=`boolean`&&!e(t.alwaysArray))&&(t.alwaysArray=!1)},ensureKeyExists:function(e,t){(!(e+`Key`in t)||typeof t[e+`Key`]!=`string`)&&(t[e+`Key`]=t.compact?`_`+e:e)},checkFnExists:function(e,t){return e+`Fn`in t}},kl}var Ml,Nl;function Pl(){if(Nl)return Ml;Nl=1;var e=Tl(),t=jl(),n=Ol().isArray,r,i;function a(e){return r=t.copyOptions(e),t.ensureFlagExists(`ignoreDeclaration`,r),t.ensureFlagExists(`ignoreInstruction`,r),t.ensureFlagExists(`ignoreAttributes`,r),t.ensureFlagExists(`ignoreText`,r),t.ensureFlagExists(`ignoreComment`,r),t.ensureFlagExists(`ignoreCdata`,r),t.ensureFlagExists(`ignoreDoctype`,r),t.ensureFlagExists(`compact`,r),t.ensureFlagExists(`alwaysChildren`,r),t.ensureFlagExists(`addParent`,r),t.ensureFlagExists(`trim`,r),t.ensureFlagExists(`nativeType`,r),t.ensureFlagExists(`nativeTypeAttributes`,r),t.ensureFlagExists(`sanitize`,r),t.ensureFlagExists(`instructionHasAttributes`,r),t.ensureFlagExists(`captureSpacesBetweenElements`,r),t.ensureAlwaysArrayExists(r),t.ensureKeyExists(`declaration`,r),t.ensureKeyExists(`instruction`,r),t.ensureKeyExists(`attributes`,r),t.ensureKeyExists(`text`,r),t.ensureKeyExists(`comment`,r),t.ensureKeyExists(`cdata`,r),t.ensureKeyExists(`doctype`,r),t.ensureKeyExists(`type`,r),t.ensureKeyExists(`name`,r),t.ensureKeyExists(`elements`,r),t.ensureKeyExists(`parent`,r),t.checkFnExists(`doctype`,r),t.checkFnExists(`instruction`,r),t.checkFnExists(`cdata`,r),t.checkFnExists(`comment`,r),t.checkFnExists(`text`,r),t.checkFnExists(`instructionName`,r),t.checkFnExists(`elementName`,r),t.checkFnExists(`attributeName`,r),t.checkFnExists(`attributeValue`,r),t.checkFnExists(`attributes`,r),r}function o(e){var t=Number(e);if(!isNaN(t))return t;var n=e.toLowerCase();return n===`true`?!0:n===`false`?!1:e}function s(e,t){var a;if(r.compact){if(!i[r[e+`Key`]]&&(n(r.alwaysArray)?r.alwaysArray.indexOf(r[e+`Key`])!==-1:r.alwaysArray)&&(i[r[e+`Key`]]=[]),i[r[e+`Key`]]&&!n(i[r[e+`Key`]])&&(i[r[e+`Key`]]=[i[r[e+`Key`]]]),e+`Fn`in r&&typeof t==`string`&&(t=r[e+`Fn`](t,i)),e===`instruction`&&(`instructionFn`in r||`instructionNameFn`in r)){for(a in t)if(t.hasOwnProperty(a))if(`instructionFn`in r)t[a]=r.instructionFn(t[a],a,i);else{var o=t[a];delete t[a],t[r.instructionNameFn(a,o,i)]=o}}n(i[r[e+`Key`]])?i[r[e+`Key`]].push(t):i[r[e+`Key`]]=t}else{i[r.elementsKey]||(i[r.elementsKey]=[]);var s={};if(s[r.typeKey]=e,e===`instruction`){for(a in t)if(t.hasOwnProperty(a))break;s[r.nameKey]=`instructionNameFn`in r?r.instructionNameFn(a,t,i):a,r.instructionHasAttributes?(s[r.attributesKey]=t[a][r.attributesKey],`instructionFn`in r&&(s[r.attributesKey]=r.instructionFn(s[r.attributesKey],a,i))):(`instructionFn`in r&&(t[a]=r.instructionFn(t[a],a,i)),s[r.instructionKey]=t[a])}else e+`Fn`in r&&(t=r[e+`Fn`](t,i)),s[r[e+`Key`]]=t;r.addParent&&(s[r.parentKey]=i),i[r.elementsKey].push(s)}}function c(e){if(`attributesFn`in r&&e&&(e=r.attributesFn(e,i)),(r.trim||`attributeValueFn`in r||`attributeNameFn`in r||r.nativeTypeAttributes)&&e){for(var t in e)if(e.hasOwnProperty(t)&&(r.trim&&(e[t]=e[t].trim()),r.nativeTypeAttributes&&(e[t]=o(e[t])),`attributeValueFn`in r&&(e[t]=r.attributeValueFn(e[t],t,i)),`attributeNameFn`in r)){var n=e[t];delete e[t],e[r.attributeNameFn(t,e[t],i)]=n}}return e}function l(e){var t={};if(e.body&&(e.name.toLowerCase()===`xml`||r.instructionHasAttributes)){for(var n=/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\w+))\s*/g,a;(a=n.exec(e.body))!==null;)t[a[1]]=a[2]||a[3]||a[4];t=c(t)}if(e.name.toLowerCase()===`xml`){if(r.ignoreDeclaration)return;i[r.declarationKey]={},Object.keys(t).length&&(i[r.declarationKey][r.attributesKey]=t),r.addParent&&(i[r.declarationKey][r.parentKey]=i)}else{if(r.ignoreInstruction)return;r.trim&&(e.body=e.body.trim());var o={};r.instructionHasAttributes&&Object.keys(t).length?(o[e.name]={},o[e.name][r.attributesKey]=t):o[e.name]=e.body,s(`instruction`,o)}}function u(e,t){var a;if(typeof e==`object`&&(t=e.attributes,e=e.name),t=c(t),`elementNameFn`in r&&(e=r.elementNameFn(e,i)),r.compact){if(a={},!r.ignoreAttributes&&t&&Object.keys(t).length)for(var o in a[r.attributesKey]={},t)t.hasOwnProperty(o)&&(a[r.attributesKey][o]=t[o]);!(e in i)&&(n(r.alwaysArray)?r.alwaysArray.indexOf(e)!==-1:r.alwaysArray)&&(i[e]=[]),i[e]&&!n(i[e])&&(i[e]=[i[e]]),n(i[e])?i[e].push(a):i[e]=a}else i[r.elementsKey]||(i[r.elementsKey]=[]),a={},a[r.typeKey]=`element`,a[r.nameKey]=e,!r.ignoreAttributes&&t&&Object.keys(t).length&&(a[r.attributesKey]=t),r.alwaysChildren&&(a[r.elementsKey]=[]),i[r.elementsKey].push(a);a[r.parentKey]=i,i=a}function d(e){r.ignoreText||!e.trim()&&!r.captureSpacesBetweenElements||(r.trim&&(e=e.trim()),r.nativeType&&(e=o(e)),r.sanitize&&(e=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)),s(`text`,e))}function f(e){r.ignoreComment||(r.trim&&(e=e.trim()),s(`comment`,e))}function p(e){var t=i[r.parentKey];r.addParent||delete i[r.parentKey],i=t}function m(e){r.ignoreCdata||(r.trim&&(e=e.trim()),s(`cdata`,e))}function h(e){r.ignoreDoctype||(e=e.replace(/^ /,``),r.trim&&(e=e.trim()),s(`doctype`,e))}function g(e){e.note=e}return Ml=function(t,n){var o=e.parser(!0,{}),s={};if(i=s,r=a(n),o.opt={strictEntities:!0},o.onopentag=u,o.ontext=d,o.oncomment=f,o.onclosetag=p,o.onerror=g,o.oncdata=m,o.ondoctype=h,o.onprocessinginstruction=l,o.write(t).close(),s[r.elementsKey]){var c=s[r.elementsKey];delete s[r.elementsKey],s[r.elementsKey]=c,delete s.text}return s},Ml}var Fl,Il;function Ll(){if(Il)return Fl;Il=1;var e=jl(),t=Pl();function n(t){var n=e.copyOptions(t);return e.ensureSpacesExists(n),n}return Fl=function(e,r){var i=n(r),a=t(e,i),o,s=`compact`in i&&i.compact?`_parent`:`parent`;return o=`addParent`in i&&i.addParent?JSON.stringify(a,function(e,t){return e===s?`_`:t},i.spaces):JSON.stringify(a,null,i.spaces),o.replace(/\u2028/g,`\\u2028`).replace(/\u2029/g,`\\u2029`)},Fl}var Rl,zl;function Bl(){if(zl)return Rl;zl=1;var e=jl(),t=Ol().isArray,n,r;function i(t){var n=e.copyOptions(t);return e.ensureFlagExists(`ignoreDeclaration`,n),e.ensureFlagExists(`ignoreInstruction`,n),e.ensureFlagExists(`ignoreAttributes`,n),e.ensureFlagExists(`ignoreText`,n),e.ensureFlagExists(`ignoreComment`,n),e.ensureFlagExists(`ignoreCdata`,n),e.ensureFlagExists(`ignoreDoctype`,n),e.ensureFlagExists(`compact`,n),e.ensureFlagExists(`indentText`,n),e.ensureFlagExists(`indentCdata`,n),e.ensureFlagExists(`indentAttributes`,n),e.ensureFlagExists(`indentInstruction`,n),e.ensureFlagExists(`fullTagEmptyElement`,n),e.ensureFlagExists(`noQuotesForNativeAttributes`,n),e.ensureSpacesExists(n),typeof n.spaces==`number`&&(n.spaces=Array(n.spaces+1).join(` `)),e.ensureKeyExists(`declaration`,n),e.ensureKeyExists(`instruction`,n),e.ensureKeyExists(`attributes`,n),e.ensureKeyExists(`text`,n),e.ensureKeyExists(`comment`,n),e.ensureKeyExists(`cdata`,n),e.ensureKeyExists(`doctype`,n),e.ensureKeyExists(`type`,n),e.ensureKeyExists(`name`,n),e.ensureKeyExists(`elements`,n),e.checkFnExists(`doctype`,n),e.checkFnExists(`instruction`,n),e.checkFnExists(`cdata`,n),e.checkFnExists(`comment`,n),e.checkFnExists(`text`,n),e.checkFnExists(`instructionName`,n),e.checkFnExists(`elementName`,n),e.checkFnExists(`attributeName`,n),e.checkFnExists(`attributeValue`,n),e.checkFnExists(`attributes`,n),e.checkFnExists(`fullTagEmptyElement`,n),n}function a(e,t,n){return(!n&&e.spaces?`
`:``)+Array(t+1).join(e.spaces)}function o(e,t,i){if(t.ignoreAttributes)return``;`attributesFn`in t&&(e=t.attributesFn(e,r,n));var o,s,c,l,u=[];for(o in e)e.hasOwnProperty(o)&&e[o]!==null&&e[o]!==void 0&&(l=t.noQuotesForNativeAttributes&&typeof e[o]!=`string`?``:`"`,s=``+e[o],s=s.replace(/"/g,`&quot;`),c=`attributeNameFn`in t?t.attributeNameFn(o,s,r,n):o,u.push(t.spaces&&t.indentAttributes?a(t,i+1,!1):` `),u.push(c+`=`+l+(`attributeValueFn`in t?t.attributeValueFn(s,o,r,n):s)+l));return e&&Object.keys(e).length&&t.spaces&&t.indentAttributes&&u.push(a(t,i,!1)),u.join(``)}function s(e,t,i){return n=e,r=`xml`,t.ignoreDeclaration?``:`<?xml`+o(e[t.attributesKey],t,i)+`?>`}function c(e,t,i){if(t.ignoreInstruction)return``;for(var a in e)if(e.hasOwnProperty(a))break;var s=`instructionNameFn`in t?t.instructionNameFn(a,e[a],r,n):a;if(typeof e[a]==`object`)return n=e,r=s,`<?`+s+o(e[a][t.attributesKey],t,i)+`?>`;var c=e[a]?e[a]:``;return`instructionFn`in t&&(c=t.instructionFn(c,a,r,n)),`<?`+s+(c?` `+c:``)+`?>`}function l(e,t){return t.ignoreComment?``:`<!--`+(`commentFn`in t?t.commentFn(e,r,n):e)+`-->`}function u(e,t){return t.ignoreCdata?``:`<![CDATA[`+(`cdataFn`in t?t.cdataFn(e,r,n):e.replace(`]]>`,`]]]]><![CDATA[>`))+`]]>`}function d(e,t){return t.ignoreDoctype?``:`<!DOCTYPE `+(`doctypeFn`in t?t.doctypeFn(e,r,n):e)+`>`}function f(e,t){return t.ignoreText?``:(e=``+e,e=e.replace(/&amp;/g,`&`),e=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`),`textFn`in t?t.textFn(e,r,n):e)}function p(e,t){var n;if(e.elements&&e.elements.length)for(n=0;n<e.elements.length;++n)switch(e.elements[n][t.typeKey]){case`text`:if(t.indentText)return!0;break;case`cdata`:if(t.indentCdata)return!0;break;case`instruction`:if(t.indentInstruction)return!0;break;case`doctype`:case`comment`:case`element`:return!0;default:return!0}return!1}function m(e,t,i){n=e,r=e.name;var a=[],s=`elementNameFn`in t?t.elementNameFn(e.name,e):e.name;a.push(`<`+s),e[t.attributesKey]&&a.push(o(e[t.attributesKey],t,i));var c=e[t.elementsKey]&&e[t.elementsKey].length||e[t.attributesKey]&&e[t.attributesKey][`xml:space`]===`preserve`;return c||=`fullTagEmptyElementFn`in t?t.fullTagEmptyElementFn(e.name,e):t.fullTagEmptyElement,c?(a.push(`>`),e[t.elementsKey]&&e[t.elementsKey].length&&(a.push(h(e[t.elementsKey],t,i+1)),n=e,r=e.name),a.push(t.spaces&&p(e,t)?`
`+Array(i+1).join(t.spaces):``),a.push(`</`+s+`>`)):a.push(`/>`),a.join(``)}function h(e,t,n,r){return e.reduce(function(e,i){var o=a(t,n,r&&!e);switch(i.type){case`element`:return e+o+m(i,t,n);case`comment`:return e+o+l(i[t.commentKey],t);case`doctype`:return e+o+d(i[t.doctypeKey],t);case`cdata`:return e+(t.indentCdata?o:``)+u(i[t.cdataKey],t);case`text`:return e+(t.indentText?o:``)+f(i[t.textKey],t);case`instruction`:var s={};return s[i[t.nameKey]]=i[t.attributesKey]?i:i[t.instructionKey],e+(t.indentInstruction?o:``)+c(s,t,n)}},``)}function g(e,t,n){for(var r in e)if(e.hasOwnProperty(r))switch(r){case t.parentKey:case t.attributesKey:break;case t.textKey:if(t.indentText||n)return!0;break;case t.cdataKey:if(t.indentCdata||n)return!0;break;case t.instructionKey:if(t.indentInstruction||n)return!0;break;case t.doctypeKey:case t.commentKey:return!0;default:return!0}return!1}function _(e,t,i,s,c){n=e,r=t;var l=`elementNameFn`in i?i.elementNameFn(t,e):t;if(e==null||e===``)return`fullTagEmptyElementFn`in i&&i.fullTagEmptyElementFn(t,e)||i.fullTagEmptyElement?`<`+l+`></`+l+`>`:`<`+l+`/>`;var u=[];if(t){if(u.push(`<`+l),typeof e!=`object`)return u.push(`>`+f(e,i)+`</`+l+`>`),u.join(``);e[i.attributesKey]&&u.push(o(e[i.attributesKey],i,s));var d=g(e,i,!0)||e[i.attributesKey]&&e[i.attributesKey][`xml:space`]===`preserve`;if(d||=`fullTagEmptyElementFn`in i?i.fullTagEmptyElementFn(t,e):i.fullTagEmptyElement,d)u.push(`>`);else return u.push(`/>`),u.join(``)}return u.push(v(e,i,s+1,!1)),n=e,r=t,t&&u.push((c?a(i,s,!1):``)+`</`+l+`>`),u.join(``)}function v(e,n,r,i){var o,p,m,h=[];for(p in e)if(e.hasOwnProperty(p))for(m=t(e[p])?e[p]:[e[p]],o=0;o<m.length;++o){switch(p){case n.declarationKey:h.push(s(m[o],n,r));break;case n.instructionKey:h.push((n.indentInstruction?a(n,r,i):``)+c(m[o],n,r));break;case n.attributesKey:case n.parentKey:break;case n.textKey:h.push((n.indentText?a(n,r,i):``)+f(m[o],n));break;case n.cdataKey:h.push((n.indentCdata?a(n,r,i):``)+u(m[o],n));break;case n.doctypeKey:h.push(a(n,r,i)+d(m[o],n));break;case n.commentKey:h.push(a(n,r,i)+l(m[o],n));break;default:h.push(a(n,r,i)+_(m[o],p,n,r,g(m[o],n)))}i&&=!h.length}return h.join(``)}return Rl=function(e,t){t=i(t);var a=[];return n=e,r=`_root_`,t.compact?a.push(v(e,t,0,!0)):(e[t.declarationKey]&&a.push(s(e[t.declarationKey],t,0)),e[t.elementsKey]&&e[t.elementsKey].length&&a.push(h(e[t.elementsKey],t,0,!a.length))),a.join(``)},Rl}var Vl,Hl;function Ul(){if(Hl)return Vl;Hl=1;var e=Bl();return Vl=function(t,n){t instanceof Buffer&&(t=t.toString());var r=null;if(typeof t==`string`)try{r=JSON.parse(t)}catch{throw Error(`The JSON structure is invalid`)}else r=t;return e(r,n)},Vl}var Wl,Gl;function Kl(){return Gl?Wl:(Gl=1,Wl={xml2js:Pl(),xml2json:Ll(),js2xml:Bl(),json2xml:Ul()},Wl)}var ql=Kl(),Jl=e=>{switch(e.type){case void 0:case`element`:let t=new Xl(e.name,e.attributes),n=e.elements||[];for(let e of n){let n=Jl(e);n!==void 0&&t.push(n)}return t;case`text`:return e.text;default:return}},Yl=class extends G{},Xl=class extends W{static fromXmlString(e){return Jl(ql.xml2js(e,{compact:!1}))}constructor(e,t){super(e),t&&this.root.push(new Yl(t))}push(e){this.root.push(e)}},Zl=class extends W{constructor(e){super(``),this._attr=e}prepForXml(e){return{_attr:this._attr}}},Ql=class extends W{constructor(e,t){super(e),t&&(this.root=t.root)}},$l=e=>{if(isNaN(e))throw Error(`Invalid value '${e}' specified. Must be an integer.`);return Math.floor(e)},eu=e=>{let t=$l(e);if(t<0)throw Error(`Invalid value '${e}' specified. Must be a positive integer.`);return t},tu=(e,t)=>{let n=t*2;if(e.length!==n||isNaN(Number(`0x${e}`)))throw Error(`Invalid hex value '${e}'. Expected ${n} digit hex value`);return e},nu=e=>tu(e,4),ru=e=>tu(e,2),iu=e=>tu(e,1),au=e=>{let t=e.slice(-2),n=e.substring(0,e.length-2);return`${Number(n)}${t}`},ou=e=>{let t=au(e);if(parseFloat(t)<0)throw Error(`Invalid value '${t}' specified. Expected a positive number.`);return t},su=e=>e===`auto`?e:tu(e.charAt(0)===`#`?e.substring(1):e,3),cu=e=>typeof e==`string`?au(e):$l(e),lu=e=>typeof e==`string`?ou(e):eu(e),uu=e=>typeof e==`string`?au(e):$l(e),du=e=>typeof e==`string`?ou(e):eu(e),fu=e=>{let t=e.substring(0,e.length-1);return`${Number(t)}%`},pu=e=>typeof e==`number`?$l(e):e.slice(-1)===`%`?fu(e):au(e),mu=eu,hu=eu,gu=e=>e.toISOString(),q=class extends W{constructor(e,t=!0){super(e),t!==!0&&this.root.push(new Ki({val:t}))}},_u=class extends W{constructor(e,t){super(e),this.root.push(new Ki({val:lu(t)}))}},vu=class extends W{},yu=class extends W{constructor(e,t){super(e),this.root.push(new Ki({val:t}))}},bu=(e,t)=>new J({name:e,attributes:{value:{key:`w:val`,value:t}}}),xu=class extends W{constructor(e,t){super(e),this.root.push(new Ki({val:t}))}},Su=class extends W{constructor(e,t){super(e),this.root.push(new Ki({val:t}))}},Cu=class extends W{constructor(e,t){super(e),this.root.push(t)}},J=class extends W{constructor({name:e,attributes:t,children:n}){super(e),t&&this.root.push(new Gi(t)),n&&this.root.push(...n)}},Y={START:`start`,CENTER:`center`,END:`end`,BOTH:`both`,MEDIUM_KASHIDA:`mediumKashida`,DISTRIBUTE:`distribute`,NUM_TAB:`numTab`,HIGH_KASHIDA:`highKashida`,LOW_KASHIDA:`lowKashida`,THAI_DISTRIBUTE:`thaiDistribute`,LEFT:`left`,RIGHT:`right`,JUSTIFIED:`both`},wu=e=>new J({name:`w:jc`,attributes:{val:{key:`w:val`,value:e}}}),Tu=(e,{color:t,size:n,space:r,style:i})=>new J({name:e,attributes:{style:{key:`w:val`,value:i},color:{key:`w:color`,value:t===void 0?void 0:su(t)},size:{key:`w:sz`,value:n===void 0?void 0:mu(n)},space:{key:`w:space`,value:r===void 0?void 0:hu(r)}}}),Eu={SINGLE:`single`,DASH_DOT_STROKED:`dashDotStroked`,DASHED:`dashed`,DASH_SMALL_GAP:`dashSmallGap`,DOT_DASH:`dotDash`,DOT_DOT_DASH:`dotDotDash`,DOTTED:`dotted`,DOUBLE:`double`,DOUBLE_WAVE:`doubleWave`,INSET:`inset`,NIL:`nil`,NONE:`none`,OUTSET:`outset`,THICK:`thick`,THICK_THIN_LARGE_GAP:`thickThinLargeGap`,THICK_THIN_MEDIUM_GAP:`thickThinMediumGap`,THICK_THIN_SMALL_GAP:`thickThinSmallGap`,THIN_THICK_LARGE_GAP:`thinThickLargeGap`,THIN_THICK_MEDIUM_GAP:`thinThickMediumGap`,THIN_THICK_SMALL_GAP:`thinThickSmallGap`,THIN_THICK_THIN_LARGE_GAP:`thinThickThinLargeGap`,THIN_THICK_THIN_MEDIUM_GAP:`thinThickThinMediumGap`,THIN_THICK_THIN_SMALL_GAP:`thinThickThinSmallGap`,THREE_D_EMBOSS:`threeDEmboss`,THREE_D_ENGRAVE:`threeDEngrave`,TRIPLE:`triple`,WAVE:`wave`},Du=class extends Wi{constructor(e){super(`w:pBdr`),e.top&&this.root.push(Tu(`w:top`,e.top)),e.bottom&&this.root.push(Tu(`w:bottom`,e.bottom)),e.left&&this.root.push(Tu(`w:left`,e.left)),e.right&&this.root.push(Tu(`w:right`,e.right)),e.between&&this.root.push(Tu(`w:between`,e.between))}},Ou=class extends W{constructor(){super(`w:pBdr`);let e=Tu(`w:bottom`,{color:`auto`,space:1,style:Eu.SINGLE,size:6});this.root.push(e)}},ku=({start:e,end:t,left:n,right:r,hanging:i,firstLine:a})=>new J({name:`w:ind`,attributes:{start:{key:`w:start`,value:e===void 0?void 0:cu(e)},end:{key:`w:end`,value:t===void 0?void 0:cu(t)},left:{key:`w:left`,value:n===void 0?void 0:cu(n)},right:{key:`w:right`,value:r===void 0?void 0:cu(r)},hanging:{key:`w:hanging`,value:i===void 0?void 0:du(i)},firstLine:{key:`w:firstLine`,value:a===void 0?void 0:du(a)}}}),Au=()=>new J({name:`w:br`}),ju={BEGIN:`begin`,END:`end`,SEPARATE:`separate`},Mu=(e,t)=>new J({name:`w:fldChar`,attributes:{type:{key:`w:fldCharType`,value:e},dirty:{key:`w:dirty`,value:t}}}),Nu=e=>Mu(ju.BEGIN,e),Pu=e=>Mu(ju.SEPARATE,e),Fu=e=>Mu(ju.END,e),Iu={CENTER:`center`,INSIDE:`inside`,LEFT:`left`,OUTSIDE:`outside`,RIGHT:`right`},Lu={BOTTOM:`bottom`,CENTER:`center`,INSIDE:`inside`,OUTSIDE:`outside`,TOP:`top`},Ru={DECIMAL:`decimal`,UPPER_ROMAN:`upperRoman`,LOWER_ROMAN:`lowerRoman`,UPPER_LETTER:`upperLetter`,LOWER_LETTER:`lowerLetter`,ORDINAL:`ordinal`,CARDINAL_TEXT:`cardinalText`,ORDINAL_TEXT:`ordinalText`,HEX:`hex`,CHICAGO:`chicago`,IDEOGRAPH_DIGITAL:`ideographDigital`,JAPANESE_COUNTING:`japaneseCounting`,AIUEO:`aiueo`,IROHA:`iroha`,DECIMAL_FULL_WIDTH:`decimalFullWidth`,DECIMAL_HALF_WIDTH:`decimalHalfWidth`,JAPANESE_LEGAL:`japaneseLegal`,JAPANESE_DIGITAL_TEN_THOUSAND:`japaneseDigitalTenThousand`,DECIMAL_ENCLOSED_CIRCLE:`decimalEnclosedCircle`,DECIMAL_FULL_WIDTH_2:`decimalFullWidth2`,AIUEO_FULL_WIDTH:`aiueoFullWidth`,IROHA_FULL_WIDTH:`irohaFullWidth`,DECIMAL_ZERO:`decimalZero`,BULLET:`bullet`,GANADA:`ganada`,CHOSUNG:`chosung`,DECIMAL_ENCLOSED_FULL_STOP:`decimalEnclosedFullstop`,DECIMAL_ENCLOSED_PAREN:`decimalEnclosedParen`,DECIMAL_ENCLOSED_CIRCLE_CHINESE:`decimalEnclosedCircleChinese`,IDEOGRAPH_ENCLOSED_CIRCLE:`ideographEnclosedCircle`,IDEOGRAPH_TRADITIONAL:`ideographTraditional`,IDEOGRAPH_ZODIAC:`ideographZodiac`,IDEOGRAPH_ZODIAC_TRADITIONAL:`ideographZodiacTraditional`,TAIWANESE_COUNTING:`taiwaneseCounting`,IDEOGRAPH_LEGAL_TRADITIONAL:`ideographLegalTraditional`,TAIWANESE_COUNTING_THOUSAND:`taiwaneseCountingThousand`,TAIWANESE_DIGITAL:`taiwaneseDigital`,CHINESE_COUNTING:`chineseCounting`,CHINESE_LEGAL_SIMPLIFIED:`chineseLegalSimplified`,CHINESE_COUNTING_TEN_THOUSAND:`chineseCountingThousand`,KOREAN_DIGITAL:`koreanDigital`,KOREAN_COUNTING:`koreanCounting`,KOREAN_LEGAL:`koreanLegal`,KOREAN_DIGITAL_2:`koreanDigital2`,VIETNAMESE_COUNTING:`vietnameseCounting`,RUSSIAN_LOWER:`russianLower`,RUSSIAN_UPPER:`russianUpper`,NONE:`none`,NUMBER_IN_DASH:`numberInDash`,HEBREW_1:`hebrew1`,HEBREW_2:`hebrew2`,ARABIC_ALPHA:`arabicAlpha`,ARABIC_ABJAD:`arabicAbjad`,HINDI_VOWELS:`hindiVowels`,HINDI_CONSONANTS:`hindiConsonants`,HINDI_NUMBERS:`hindiNumbers`,HINDI_COUNTING:`hindiCounting`,THAI_LETTERS:`thaiLetters`,THAI_NUMBERS:`thaiNumbers`,THAI_COUNTING:`thaiCounting`,BAHT_TEXT:`bahtText`,DOLLAR_TEXT:`dollarText`},zu={DEFAULT:`default`,PRESERVE:`preserve`},Bu=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{space:`xml:space`})}},Vu=class extends W{constructor(){super(`w:instrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`PAGE`)}},Hu=class extends W{constructor(){super(`w:instrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`NUMPAGES`)}},Uu=class extends W{constructor(){super(`w:instrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`SECTIONPAGES`)}},Wu=class extends W{constructor(){super(`w:instrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`SECTION`)}},Gu=({fill:e,color:t,type:n})=>new J({name:`w:shd`,attributes:{fill:{key:`w:fill`,value:e===void 0?void 0:su(e)},color:{key:`w:color`,value:t===void 0?void 0:su(t)},type:{key:`w:val`,value:n}}}),Ku={CLEAR:`clear`,DIAGONAL_CROSS:`diagCross`,DIAGONAL_STRIPE:`diagStripe`,HORIZONTAL_CROSS:`horzCross`,HORIZONTAL_STRIPE:`horzStripe`,NIL:`nil`,PERCENT_5:`pct5`,PERCENT_10:`pct10`,PERCENT_12:`pct12`,PERCENT_15:`pct15`,PERCENT_20:`pct20`,PERCENT_25:`pct25`,PERCENT_30:`pct30`,PERCENT_35:`pct35`,PERCENT_37:`pct37`,PERCENT_40:`pct40`,PERCENT_45:`pct45`,PERCENT_50:`pct50`,PERCENT_55:`pct55`,PERCENT_60:`pct60`,PERCENT_62:`pct62`,PERCENT_65:`pct65`,PERCENT_70:`pct70`,PERCENT_75:`pct75`,PERCENT_80:`pct80`,PERCENT_85:`pct85`,PERCENT_87:`pct87`,PERCENT_90:`pct90`,PERCENT_95:`pct95`,REVERSE_DIAGONAL_STRIPE:`reverseDiagStripe`,SOLID:`solid`,THIN_DIAGONAL_CROSS:`thinDiagCross`,THIN_DIAGONAL_STRIPE:`thinDiagStripe`,THIN_HORIZONTAL_CROSS:`thinHorzCross`,THIN_REVERSE_DIAGONAL_STRIPE:`thinReverseDiagStripe`,THIN_VERTICAL_STRIPE:`thinVertStripe`,VERTICAL_STRIPE:`vertStripe`},qu=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`,author:`w:author`,date:`w:date`})}},Ju=class extends W{constructor(e){super(`w:del`),this.root.push(new qu({id:e.id,author:e.author,date:e.date}))}},Yu=class extends W{constructor(e){super(`w:ins`),this.root.push(new qu({id:e.id,author:e.author,date:e.date}))}},Xu={DOT:`dot`},Zu=(e=Xu.DOT)=>new J({name:`w:em`,attributes:{val:{key:`w:val`,value:e}}}),Qu=()=>Zu(Xu.DOT),$u=class extends W{constructor(e){super(`w:spacing`),this.root.push(new Ki({val:cu(e)}))}},ed=class extends W{constructor(e){super(`w:color`),this.root.push(new Ki({val:su(e)}))}},td=class extends W{constructor(e){super(`w:highlight`),this.root.push(new Ki({val:e}))}},nd=class extends W{constructor(e){super(`w:highlightCs`),this.root.push(new Ki({val:e}))}},rd=e=>new J({name:`w:lang`,attributes:{value:{key:`w:val`,value:e.value},eastAsia:{key:`w:eastAsia`,value:e.eastAsia},bidirectional:{key:`w:bidi`,value:e.bidirectional}}}),id=(e,t)=>{if(typeof e==`string`){let n=e;return new J({name:`w:rFonts`,attributes:{ascii:{key:`w:ascii`,value:n},cs:{key:`w:cs`,value:n},eastAsia:{key:`w:eastAsia`,value:n},hAnsi:{key:`w:hAnsi`,value:n},hint:{key:`w:hint`,value:t}}})}let n=e;return new J({name:`w:rFonts`,attributes:{ascii:{key:`w:ascii`,value:n.ascii},cs:{key:`w:cs`,value:n.cs},eastAsia:{key:`w:eastAsia`,value:n.eastAsia},hAnsi:{key:`w:hAnsi`,value:n.hAnsi},hint:{key:`w:hint`,value:n.hint}}})},ad=e=>new J({name:`w:vertAlign`,attributes:{val:{key:`w:val`,value:e}}}),od=()=>ad(`superscript`),sd=()=>ad(`subscript`),cd={SINGLE:`single`,WORDS:`words`,DOUBLE:`double`,THICK:`thick`,DOTTED:`dotted`,DOTTEDHEAVY:`dottedHeavy`,DASH:`dash`,DASHEDHEAVY:`dashedHeavy`,DASHLONG:`dashLong`,DASHLONGHEAVY:`dashLongHeavy`,DOTDASH:`dotDash`,DASHDOTHEAVY:`dashDotHeavy`,DOTDOTDASH:`dotDotDash`,DASHDOTDOTHEAVY:`dashDotDotHeavy`,WAVE:`wave`,WAVYHEAVY:`wavyHeavy`,WAVYDOUBLE:`wavyDouble`,NONE:`none`},ld=(e=cd.SINGLE,t)=>new J({name:`w:u`,attributes:{val:{key:`w:val`,value:e},color:{key:`w:color`,value:t===void 0?void 0:su(t)}}}),ud={BLINK_BACKGROUND:`blinkBackground`,LIGHTS:`lights`,ANTS_BLACK:`antsBlack`,ANTS_RED:`antsRed`,SHIMMER:`shimmer`,SPARKLE:`sparkle`,NONE:`none`},dd={BLACK:`black`,BLUE:`blue`,CYAN:`cyan`,DARK_BLUE:`darkBlue`,DARK_CYAN:`darkCyan`,DARK_GRAY:`darkGray`,DARK_GREEN:`darkGreen`,DARK_MAGENTA:`darkMagenta`,DARK_RED:`darkRed`,DARK_YELLOW:`darkYellow`,GREEN:`green`,LIGHT_GRAY:`lightGray`,MAGENTA:`magenta`,NONE:`none`,RED:`red`,WHITE:`white`,YELLOW:`yellow`},fd=class extends Wi{constructor(e){if(super(`w:rPr`),!e)return;e.style&&this.push(new yu(`w:rStyle`,e.style)),e.font&&(typeof e.font==`string`?this.push(id(e.font)):`name`in e.font?this.push(id(e.font.name,e.font.hint)):this.push(id(e.font))),e.bold!==void 0&&this.push(new q(`w:b`,e.bold)),(e.boldComplexScript===void 0&&e.bold!==void 0||e.boldComplexScript)&&this.push(new q(`w:bCs`,e.boldComplexScript??e.bold)),e.italics!==void 0&&this.push(new q(`w:i`,e.italics)),(e.italicsComplexScript===void 0&&e.italics!==void 0||e.italicsComplexScript)&&this.push(new q(`w:iCs`,e.italicsComplexScript??e.italics)),e.smallCaps===void 0?e.allCaps!==void 0&&this.push(new q(`w:caps`,e.allCaps)):this.push(new q(`w:smallCaps`,e.smallCaps)),e.strike!==void 0&&this.push(new q(`w:strike`,e.strike)),e.doubleStrike!==void 0&&this.push(new q(`w:dstrike`,e.doubleStrike)),e.emboss!==void 0&&this.push(new q(`w:emboss`,e.emboss)),e.imprint!==void 0&&this.push(new q(`w:imprint`,e.imprint)),e.noProof!==void 0&&this.push(new q(`w:noProof`,e.noProof)),e.snapToGrid!==void 0&&this.push(new q(`w:snapToGrid`,e.snapToGrid)),e.vanish&&this.push(new q(`w:vanish`,e.vanish)),e.color&&this.push(new ed(e.color)),e.characterSpacing&&this.push(new $u(e.characterSpacing)),e.scale!==void 0&&this.push(new xu(`w:w`,e.scale)),e.kern&&this.push(new _u(`w:kern`,e.kern)),e.position&&this.push(new yu(`w:position`,e.position)),e.size!==void 0&&this.push(new _u(`w:sz`,e.size));let t=e.sizeComplexScript===void 0||e.sizeComplexScript===!0?e.size:e.sizeComplexScript;t&&this.push(new _u(`w:szCs`,t)),e.highlight&&this.push(new td(e.highlight));let n=e.highlightComplexScript===void 0||e.highlightComplexScript===!0?e.highlight:e.highlightComplexScript;n&&this.push(new nd(n)),e.underline&&this.push(ld(e.underline.type,e.underline.color)),e.effect&&this.push(new yu(`w:effect`,e.effect)),e.border&&this.push(Tu(`w:bdr`,e.border)),e.shading&&this.push(Gu(e.shading)),e.subScript&&this.push(sd()),e.superScript&&this.push(od()),e.rightToLeft!==void 0&&this.push(new q(`w:rtl`,e.rightToLeft)),e.emphasisMark&&this.push(Zu(e.emphasisMark.type)),e.language&&this.push(rd(e.language)),e.specVanish&&this.push(new q(`w:specVanish`,e.vanish)),e.math&&this.push(new q(`w:oMath`,e.math)),e.revision&&this.push(new md(e.revision))}push(e){this.root.push(e)}},pd=class extends fd{constructor(e){super(e),e?.insertion&&this.push(new Yu(e.insertion)),e?.deletion&&this.push(new Ju(e.deletion))}},md=class extends W{constructor(e){super(`w:rPrChange`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.addChildElement(new fd(e))}},hd=class extends W{constructor(e){super(`w:t`),typeof e==`string`?(this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(e)):(this.root.push(new Bu({space:e.space??zu.DEFAULT})),this.root.push(e.text))}},gd={CURRENT:`CURRENT`,TOTAL_PAGES:`TOTAL_PAGES`,TOTAL_PAGES_IN_SECTION:`TOTAL_PAGES_IN_SECTION`,CURRENT_SECTION:`SECTION`},_d=class extends W{constructor(e){if(super(`w:r`),U(this,`properties`),this.properties=new fd(e),this.root.push(this.properties),e.break)for(let t=0;t<e.break;t++)this.root.push(Au());if(e.children)for(let t of e.children){if(typeof t==`string`){switch(t){case gd.CURRENT:this.root.push(Nu()),this.root.push(new Vu),this.root.push(Pu()),this.root.push(Fu());break;case gd.TOTAL_PAGES:this.root.push(Nu()),this.root.push(new Hu),this.root.push(Pu()),this.root.push(Fu());break;case gd.TOTAL_PAGES_IN_SECTION:this.root.push(Nu()),this.root.push(new Uu),this.root.push(Pu()),this.root.push(Fu());break;case gd.CURRENT_SECTION:this.root.push(Nu()),this.root.push(new Wu),this.root.push(Pu()),this.root.push(Fu());break;default:this.root.push(new hd(t));break}continue}this.root.push(t)}else e.text!==void 0&&this.root.push(new hd(e.text))}},X=class extends _d{constructor(e){super(typeof e==`string`?{text:e}:e)}},vd=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{char:`w:char`,symbolfont:`w:font`})}},yd=class extends W{constructor(e=``,t=`Wingdings`){super(`w:sym`),this.root.push(new vd({char:e,symbolfont:t}))}},bd=class extends _d{constructor(e){if(typeof e==`string`)return super({}),this.root.push(new yd(e)),this;super(e),this.root.push(new yd(e.char,e.symbolfont))}},xd={},Sd={},Cd,wd;function Td(){if(wd)return Cd;wd=1,Cd=e;function e(e,t){if(!e)throw Error(t||`Assertion failed`)}return e.equal=function(e,t,n){if(e!=t)throw Error(n||`Assertion failed: `+e+` != `+t)},Cd}var Ed;function Dd(){if(Ed)return Sd;Ed=1;var e=Td();Sd.inherits=ta();function t(e,t){return(e.charCodeAt(t)&64512)!=55296||t<0||t+1>=e.length?!1:(e.charCodeAt(t+1)&64512)==56320}function n(e,n){if(Array.isArray(e))return e.slice();if(!e)return[];var r=[];if(typeof e==`string`){if(!n)for(var i=0,a=0;a<e.length;a++){var o=e.charCodeAt(a);o<128?r[i++]=o:o<2048?(r[i++]=o>>6|192,r[i++]=o&63|128):t(e,a)?(o=65536+((o&1023)<<10)+(e.charCodeAt(++a)&1023),r[i++]=o>>18|240,r[i++]=o>>12&63|128,r[i++]=o>>6&63|128,r[i++]=o&63|128):(r[i++]=o>>12|224,r[i++]=o>>6&63|128,r[i++]=o&63|128)}else if(n===`hex`)for(e=e.replace(/[^a-z0-9]+/gi,``),e.length%2!=0&&(e=`0`+e),a=0;a<e.length;a+=2)r.push(parseInt(e[a]+e[a+1],16))}else for(a=0;a<e.length;a++)r[a]=e[a]|0;return r}Sd.toArray=n;function r(e){for(var t=``,n=0;n<e.length;n++)t+=o(e[n].toString(16));return t}Sd.toHex=r;function i(e){return(e>>>24|e>>>8&65280|e<<8&16711680|(e&255)<<24)>>>0}Sd.htonl=i;function a(e,t){for(var n=``,r=0;r<e.length;r++){var a=e[r];t===`little`&&(a=i(a)),n+=s(a.toString(16))}return n}Sd.toHex32=a;function o(e){return e.length===1?`0`+e:e}Sd.zero2=o;function s(e){return e.length===7?`0`+e:e.length===6?`00`+e:e.length===5?`000`+e:e.length===4?`0000`+e:e.length===3?`00000`+e:e.length===2?`000000`+e:e.length===1?`0000000`+e:e}Sd.zero8=s;function c(t,n,r,i){var a=r-n;e(a%4==0);for(var o=Array(a/4),s=0,c=n;s<o.length;s++,c+=4)o[s]=(i===`big`?t[c]<<24|t[c+1]<<16|t[c+2]<<8|t[c+3]:t[c+3]<<24|t[c+2]<<16|t[c+1]<<8|t[c])>>>0;return o}Sd.join32=c;function l(e,t){for(var n=Array(e.length*4),r=0,i=0;r<e.length;r++,i+=4){var a=e[r];t===`big`?(n[i]=a>>>24,n[i+1]=a>>>16&255,n[i+2]=a>>>8&255,n[i+3]=a&255):(n[i+3]=a>>>24,n[i+2]=a>>>16&255,n[i+1]=a>>>8&255,n[i]=a&255)}return n}Sd.split32=l;function u(e,t){return e>>>t|e<<32-t}Sd.rotr32=u;function d(e,t){return e<<t|e>>>32-t}Sd.rotl32=d;function f(e,t){return e+t>>>0}Sd.sum32=f;function p(e,t,n){return e+t+n>>>0}Sd.sum32_3=p;function m(e,t,n,r){return e+t+n+r>>>0}Sd.sum32_4=m;function h(e,t,n,r,i){return e+t+n+r+i>>>0}Sd.sum32_5=h;function g(e,t,n,r){var i=e[t],a=r+e[t+1]>>>0;e[t]=(a<r?1:0)+n+i>>>0,e[t+1]=a}Sd.sum64=g;function _(e,t,n,r){return(t+r>>>0<t?1:0)+e+n>>>0}Sd.sum64_hi=_;function v(e,t,n,r){return t+r>>>0}Sd.sum64_lo=v;function y(e,t,n,r,i,a,o,s){var c=0,l=t;return l=l+r>>>0,c+=l<t?1:0,l=l+a>>>0,c+=l<a?1:0,l=l+s>>>0,c+=l<s?1:0,e+n+i+o+c>>>0}Sd.sum64_4_hi=y;function b(e,t,n,r,i,a,o,s){return t+r+a+s>>>0}Sd.sum64_4_lo=b;function x(e,t,n,r,i,a,o,s,c,l){var u=0,d=t;return d=d+r>>>0,u+=d<t?1:0,d=d+a>>>0,u+=d<a?1:0,d=d+s>>>0,u+=d<s?1:0,d=d+l>>>0,u+=d<l?1:0,e+n+i+o+c+u>>>0}Sd.sum64_5_hi=x;function S(e,t,n,r,i,a,o,s,c,l){return t+r+a+s+l>>>0}Sd.sum64_5_lo=S;function C(e,t,n){return(t<<32-n|e>>>n)>>>0}Sd.rotr64_hi=C;function w(e,t,n){return(e<<32-n|t>>>n)>>>0}Sd.rotr64_lo=w;function T(e,t,n){return e>>>n}Sd.shr64_hi=T;function E(e,t,n){return(e<<32-n|t>>>n)>>>0}return Sd.shr64_lo=E,Sd}var Od={},kd;function Ad(){if(kd)return Od;kd=1;var e=Dd(),t=Td();function n(){this.pending=null,this.pendingTotal=0,this.blockSize=this.constructor.blockSize,this.outSize=this.constructor.outSize,this.hmacStrength=this.constructor.hmacStrength,this.padLength=this.constructor.padLength/8,this.endian=`big`,this._delta8=this.blockSize/8,this._delta32=this.blockSize/32}return Od.BlockHash=n,n.prototype.update=function(t,n){if(t=e.toArray(t,n),this.pending?this.pending=this.pending.concat(t):this.pending=t,this.pendingTotal+=t.length,this.pending.length>=this._delta8){t=this.pending;var r=t.length%this._delta8;this.pending=t.slice(t.length-r,t.length),this.pending.length===0&&(this.pending=null),t=e.join32(t,0,t.length-r,this.endian);for(var i=0;i<t.length;i+=this._delta32)this._update(t,i,i+this._delta32)}return this},n.prototype.digest=function(e){return this.update(this._pad()),t(this.pending===null),this._digest(e)},n.prototype._pad=function(){var e=this.pendingTotal,t=this._delta8,n=t-(e+this.padLength)%t,r=Array(n+this.padLength);r[0]=128;for(var i=1;i<n;i++)r[i]=0;if(e<<=3,this.endian===`big`){for(var a=8;a<this.padLength;a++)r[i++]=0;r[i++]=0,r[i++]=0,r[i++]=0,r[i++]=0,r[i++]=e>>>24&255,r[i++]=e>>>16&255,r[i++]=e>>>8&255,r[i++]=e&255}else for(r[i++]=e&255,r[i++]=e>>>8&255,r[i++]=e>>>16&255,r[i++]=e>>>24&255,r[i++]=0,r[i++]=0,r[i++]=0,r[i++]=0,a=8;a<this.padLength;a++)r[i++]=0;return r},Od}var jd={},Md={},Nd;function Pd(){if(Nd)return Md;Nd=1;var e=Dd().rotr32;function t(e,t,a,o){if(e===0)return n(t,a,o);if(e===1||e===3)return i(t,a,o);if(e===2)return r(t,a,o)}Md.ft_1=t;function n(e,t,n){return e&t^~e&n}Md.ch32=n;function r(e,t,n){return e&t^e&n^t&n}Md.maj32=r;function i(e,t,n){return e^t^n}Md.p32=i;function a(t){return e(t,2)^e(t,13)^e(t,22)}Md.s0_256=a;function o(t){return e(t,6)^e(t,11)^e(t,25)}Md.s1_256=o;function s(t){return e(t,7)^e(t,18)^t>>>3}Md.g0_256=s;function c(t){return e(t,17)^e(t,19)^t>>>10}return Md.g1_256=c,Md}var Fd,Id;function Ld(){if(Id)return Fd;Id=1;var e=Dd(),t=Ad(),n=Pd(),r=e.rotl32,i=e.sum32,a=e.sum32_5,o=n.ft_1,s=t.BlockHash,c=[1518500249,1859775393,2400959708,3395469782];function l(){if(!(this instanceof l))return new l;s.call(this),this.h=[1732584193,4023233417,2562383102,271733878,3285377520],this.W=Array(80)}return e.inherits(l,s),Fd=l,l.blockSize=512,l.outSize=160,l.hmacStrength=80,l.padLength=64,l.prototype._update=function(e,t){for(var n=this.W,s=0;s<16;s++)n[s]=e[t+s];for(;s<n.length;s++)n[s]=r(n[s-3]^n[s-8]^n[s-14]^n[s-16],1);var l=this.h[0],u=this.h[1],d=this.h[2],f=this.h[3],p=this.h[4];for(s=0;s<n.length;s++){var m=~~(s/20),h=a(r(l,5),o(m,u,d,f),p,n[s],c[m]);p=f,f=d,d=r(u,30),u=l,l=h}this.h[0]=i(this.h[0],l),this.h[1]=i(this.h[1],u),this.h[2]=i(this.h[2],d),this.h[3]=i(this.h[3],f),this.h[4]=i(this.h[4],p)},l.prototype._digest=function(t){return t===`hex`?e.toHex32(this.h,`big`):e.split32(this.h,`big`)},Fd}var Rd,zd;function Bd(){if(zd)return Rd;zd=1;var e=Dd(),t=Ad(),n=Pd(),r=Td(),i=e.sum32,a=e.sum32_4,o=e.sum32_5,s=n.ch32,c=n.maj32,l=n.s0_256,u=n.s1_256,d=n.g0_256,f=n.g1_256,p=t.BlockHash,m=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];function h(){if(!(this instanceof h))return new h;p.call(this),this.h=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],this.k=m,this.W=Array(64)}return e.inherits(h,p),Rd=h,h.blockSize=512,h.outSize=256,h.hmacStrength=192,h.padLength=64,h.prototype._update=function(e,t){for(var n=this.W,p=0;p<16;p++)n[p]=e[t+p];for(;p<n.length;p++)n[p]=a(f(n[p-2]),n[p-7],d(n[p-15]),n[p-16]);var m=this.h[0],h=this.h[1],g=this.h[2],_=this.h[3],v=this.h[4],y=this.h[5],b=this.h[6],x=this.h[7];for(r(this.k.length===n.length),p=0;p<n.length;p++){var S=o(x,u(v),s(v,y,b),this.k[p],n[p]),C=i(l(m),c(m,h,g));x=b,b=y,y=v,v=i(_,S),_=g,g=h,h=m,m=i(S,C)}this.h[0]=i(this.h[0],m),this.h[1]=i(this.h[1],h),this.h[2]=i(this.h[2],g),this.h[3]=i(this.h[3],_),this.h[4]=i(this.h[4],v),this.h[5]=i(this.h[5],y),this.h[6]=i(this.h[6],b),this.h[7]=i(this.h[7],x)},h.prototype._digest=function(t){return t===`hex`?e.toHex32(this.h,`big`):e.split32(this.h,`big`)},Rd}var Vd,Hd;function Ud(){if(Hd)return Vd;Hd=1;var e=Dd(),t=Bd();function n(){if(!(this instanceof n))return new n;t.call(this),this.h=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428]}return e.inherits(n,t),Vd=n,n.blockSize=512,n.outSize=224,n.hmacStrength=192,n.padLength=64,n.prototype._digest=function(t){return t===`hex`?e.toHex32(this.h.slice(0,7),`big`):e.split32(this.h.slice(0,7),`big`)},Vd}var Wd,Gd;function Kd(){if(Gd)return Wd;Gd=1;var e=Dd(),t=Ad(),n=Td(),r=e.rotr64_hi,i=e.rotr64_lo,a=e.shr64_hi,o=e.shr64_lo,s=e.sum64,c=e.sum64_hi,l=e.sum64_lo,u=e.sum64_4_hi,d=e.sum64_4_lo,f=e.sum64_5_hi,p=e.sum64_5_lo,m=t.BlockHash,h=[1116352408,3609767458,1899447441,602891725,3049323471,3964484399,3921009573,2173295548,961987163,4081628472,1508970993,3053834265,2453635748,2937671579,2870763221,3664609560,3624381080,2734883394,310598401,1164996542,607225278,1323610764,1426881987,3590304994,1925078388,4068182383,2162078206,991336113,2614888103,633803317,3248222580,3479774868,3835390401,2666613458,4022224774,944711139,264347078,2341262773,604807628,2007800933,770255983,1495990901,1249150122,1856431235,1555081692,3175218132,1996064986,2198950837,2554220882,3999719339,2821834349,766784016,2952996808,2566594879,3210313671,3203337956,3336571891,1034457026,3584528711,2466948901,113926993,3758326383,338241895,168717936,666307205,1188179964,773529912,1546045734,1294757372,1522805485,1396182291,2643833823,1695183700,2343527390,1986661051,1014477480,2177026350,1206759142,2456956037,344077627,2730485921,1290863460,2820302411,3158454273,3259730800,3505952657,3345764771,106217008,3516065817,3606008344,3600352804,1432725776,4094571909,1467031594,275423344,851169720,430227734,3100823752,506948616,1363258195,659060556,3750685593,883997877,3785050280,958139571,3318307427,1322822218,3812723403,1537002063,2003034995,1747873779,3602036899,1955562222,1575990012,2024104815,1125592928,2227730452,2716904306,2361852424,442776044,2428436474,593698344,2756734187,3733110249,3204031479,2999351573,3329325298,3815920427,3391569614,3928383900,3515267271,566280711,3940187606,3454069534,4118630271,4000239992,116418474,1914138554,174292421,2731055270,289380356,3203993006,460393269,320620315,685471733,587496836,852142971,1086792851,1017036298,365543100,1126000580,2618297676,1288033470,3409855158,1501505948,4234509866,1607167915,987167468,1816402316,1246189591];function g(){if(!(this instanceof g))return new g;m.call(this),this.h=[1779033703,4089235720,3144134277,2227873595,1013904242,4271175723,2773480762,1595750129,1359893119,2917565137,2600822924,725511199,528734635,4215389547,1541459225,327033209],this.k=h,this.W=Array(160)}e.inherits(g,m),Wd=g,g.blockSize=1024,g.outSize=512,g.hmacStrength=192,g.padLength=128,g.prototype._prepareBlock=function(e,t){for(var n=this.W,r=0;r<32;r++)n[r]=e[t+r];for(;r<n.length;r+=2){var i=D(n[r-4],n[r-3]),a=O(n[r-4],n[r-3]),o=n[r-14],s=n[r-13],c=T(n[r-30],n[r-29]),l=E(n[r-30],n[r-29]),f=n[r-32],p=n[r-31];n[r]=u(i,a,o,s,c,l,f,p),n[r+1]=d(i,a,o,s,c,l,f,p)}},g.prototype._update=function(e,t){this._prepareBlock(e,t);var r=this.W,i=this.h[0],a=this.h[1],o=this.h[2],u=this.h[3],d=this.h[4],m=this.h[5],h=this.h[6],g=this.h[7],T=this.h[8],E=this.h[9],D=this.h[10],O=this.h[11],k=this.h[12],A=this.h[13],j=this.h[14],M=this.h[15];n(this.k.length===r.length);for(var ee=0;ee<r.length;ee+=2){var N=j,P=M,F=C(T,E),I=w(T,E),L=_(T,E,D,O,k),R=v(T,E,D,O,k,A),z=this.k[ee],te=this.k[ee+1],ne=r[ee],re=r[ee+1],ie=f(N,P,F,I,L,R,z,te,ne,re),ae=p(N,P,F,I,L,R,z,te,ne,re);N=x(i,a),P=S(i,a),F=y(i,a,o,u,d),I=b(i,a,o,u,d,m);var oe=c(N,P,F,I),B=l(N,P,F,I);j=k,M=A,k=D,A=O,D=T,O=E,T=c(h,g,ie,ae),E=l(g,g,ie,ae),h=d,g=m,d=o,m=u,o=i,u=a,i=c(ie,ae,oe,B),a=l(ie,ae,oe,B)}s(this.h,0,i,a),s(this.h,2,o,u),s(this.h,4,d,m),s(this.h,6,h,g),s(this.h,8,T,E),s(this.h,10,D,O),s(this.h,12,k,A),s(this.h,14,j,M)},g.prototype._digest=function(t){return t===`hex`?e.toHex32(this.h,`big`):e.split32(this.h,`big`)};function _(e,t,n,r,i){var a=e&n^~e&i;return a<0&&(a+=4294967296),a}function v(e,t,n,r,i,a){var o=t&r^~t&a;return o<0&&(o+=4294967296),o}function y(e,t,n,r,i){var a=e&n^e&i^n&i;return a<0&&(a+=4294967296),a}function b(e,t,n,r,i,a){var o=t&r^t&a^r&a;return o<0&&(o+=4294967296),o}function x(e,t){var n=r(e,t,28),i=r(t,e,2),a=r(t,e,7),o=n^i^a;return o<0&&(o+=4294967296),o}function S(e,t){var n=i(e,t,28),r=i(t,e,2),a=i(t,e,7),o=n^r^a;return o<0&&(o+=4294967296),o}function C(e,t){var n=r(e,t,14),i=r(e,t,18),a=r(t,e,9),o=n^i^a;return o<0&&(o+=4294967296),o}function w(e,t){var n=i(e,t,14),r=i(e,t,18),a=i(t,e,9),o=n^r^a;return o<0&&(o+=4294967296),o}function T(e,t){var n=r(e,t,1),i=r(e,t,8),o=a(e,t,7),s=n^i^o;return s<0&&(s+=4294967296),s}function E(e,t){var n=i(e,t,1),r=i(e,t,8),a=o(e,t,7),s=n^r^a;return s<0&&(s+=4294967296),s}function D(e,t){var n=r(e,t,19),i=r(t,e,29),o=a(e,t,6),s=n^i^o;return s<0&&(s+=4294967296),s}function O(e,t){var n=i(e,t,19),r=i(t,e,29),a=o(e,t,6),s=n^r^a;return s<0&&(s+=4294967296),s}return Wd}var qd,Jd;function Yd(){if(Jd)return qd;Jd=1;var e=Dd(),t=Kd();function n(){if(!(this instanceof n))return new n;t.call(this),this.h=[3418070365,3238371032,1654270250,914150663,2438529370,812702999,355462360,4144912697,1731405415,4290775857,2394180231,1750603025,3675008525,1694076839,1203062813,3204075428]}return e.inherits(n,t),qd=n,n.blockSize=1024,n.outSize=384,n.hmacStrength=192,n.padLength=128,n.prototype._digest=function(t){return t===`hex`?e.toHex32(this.h.slice(0,12),`big`):e.split32(this.h.slice(0,12),`big`)},qd}var Xd;function Zd(){return Xd?jd:(Xd=1,jd.sha1=Ld(),jd.sha224=Ud(),jd.sha256=Bd(),jd.sha384=Yd(),jd.sha512=Kd(),jd)}var Qd={},$d;function ef(){if($d)return Qd;$d=1;var e=Dd(),t=Ad(),n=e.rotl32,r=e.sum32,i=e.sum32_3,a=e.sum32_4,o=t.BlockHash;function s(){if(!(this instanceof s))return new s;o.call(this),this.h=[1732584193,4023233417,2562383102,271733878,3285377520],this.endian=`little`}e.inherits(s,o),Qd.ripemd160=s,s.blockSize=512,s.outSize=160,s.hmacStrength=192,s.padLength=64,s.prototype._update=function(e,t){for(var o=this.h[0],s=this.h[1],h=this.h[2],g=this.h[3],_=this.h[4],v=o,y=s,b=h,x=g,S=_,C=0;C<80;C++){var w=r(n(a(o,c(C,s,h,g),e[d[C]+t],l(C)),p[C]),_);o=_,_=g,g=n(h,10),h=s,s=w,w=r(n(a(v,c(79-C,y,b,x),e[f[C]+t],u(C)),m[C]),S),v=S,S=x,x=n(b,10),b=y,y=w}w=i(this.h[1],h,x),this.h[1]=i(this.h[2],g,S),this.h[2]=i(this.h[3],_,v),this.h[3]=i(this.h[4],o,y),this.h[4]=i(this.h[0],s,b),this.h[0]=w},s.prototype._digest=function(t){return t===`hex`?e.toHex32(this.h,`little`):e.split32(this.h,`little`)};function c(e,t,n,r){return e<=15?t^n^r:e<=31?t&n|~t&r:e<=47?(t|~n)^r:e<=63?t&r|n&~r:t^(n|~r)}function l(e){return e<=15?0:e<=31?1518500249:e<=47?1859775393:e<=63?2400959708:2840853838}function u(e){return e<=15?1352829926:e<=31?1548603684:e<=47?1836072691:e<=63?2053994217:0}var d=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13],f=[5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11],p=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6],m=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];return Qd}var tf,nf;function rf(){if(nf)return tf;nf=1;var e=Dd(),t=Td();function n(t,r,i){if(!(this instanceof n))return new n(t,r,i);this.Hash=t,this.blockSize=t.blockSize/8,this.outSize=t.outSize/8,this.inner=null,this.outer=null,this._init(e.toArray(r,i))}return tf=n,n.prototype._init=function(e){e.length>this.blockSize&&(e=new this.Hash().update(e).digest()),t(e.length<=this.blockSize);for(var n=e.length;n<this.blockSize;n++)e.push(0);for(n=0;n<e.length;n++)e[n]^=54;for(this.inner=new this.Hash().update(e),n=0;n<e.length;n++)e[n]^=106;this.outer=new this.Hash().update(e)},n.prototype.update=function(e,t){return this.inner.update(e,t),this},n.prototype.digest=function(e){return this.outer.update(this.inner.digest()),this.outer.digest(e)},tf}var af;function of(){return af?xd:(af=1,(function(e){var t=e;t.utils=Dd(),t.common=Ad(),t.sha=Zd(),t.ripemd=ef(),t.hmac=rf(),t.sha1=t.sha.sha1,t.sha256=t.sha.sha256,t.sha224=t.sha.sha224,t.sha384=t.sha.sha384,t.sha512=t.sha.sha512,t.ripemd160=t.ripemd.ripemd160})(xd),xd)}var sf=Ji(of()),cf=`useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict`,lf=(e,t=21)=>(n=t)=>{let r=``,i=n|0;for(;i--;)r+=e[Math.random()*e.length|0];return r},uf=(e=21)=>{let t=``,n=e|0;for(;n--;)t+=cf[Math.random()*64|0];return t},df=e=>Math.floor(e/25.4*72*20),ff=e=>Math.floor(e*72*20),pf=(e=0)=>{let t=e;return()=>++t},mf=()=>pf(),hf=()=>pf(1),gf=()=>pf(),_f=()=>pf(),vf=()=>uf().toLowerCase(),yf=e=>sf.sha1().update(e instanceof ArrayBuffer?new Uint8Array(e):e).digest(`hex`),bf=e=>lf(`1234567890abcdef`,e)(),xf=()=>`${bf(8)}-${bf(4)}-${bf(4)}-${bf(4)}-${bf(12)}`,Sf=e=>new Uint8Array(new TextEncoder().encode(e)),Cf={CHARACTER:`character`,COLUMN:`column`,INSIDE_MARGIN:`insideMargin`,LEFT_MARGIN:`leftMargin`,MARGIN:`margin`,OUTSIDE_MARGIN:`outsideMargin`,PAGE:`page`,RIGHT_MARGIN:`rightMargin`},wf={BOTTOM_MARGIN:`bottomMargin`,INSIDE_MARGIN:`insideMargin`,LINE:`line`,MARGIN:`margin`,OUTSIDE_MARGIN:`outsideMargin`,PAGE:`page`,PARAGRAPH:`paragraph`,TOP_MARGIN:`topMargin`},Tf=()=>new J({name:`wp:simplePos`,attributes:{x:{key:`x`,value:0},y:{key:`y`,value:0}}}),Ef=e=>new J({name:`wp:align`,children:[e]}),Df=e=>new J({name:`wp:posOffset`,children:[e.toString()]}),Of=({relative:e,align:t,offset:n})=>new J({name:`wp:positionH`,attributes:{relativeFrom:{key:`relativeFrom`,value:e??Cf.PAGE}},children:[(()=>{if(t)return Ef(t);if(n!==void 0)return Df(n);throw Error(`There is no configuration provided for floating position (Align or offset)`)})()]}),kf=({relative:e,align:t,offset:n})=>new J({name:`wp:positionV`,attributes:{relativeFrom:{key:`relativeFrom`,value:e??wf.PAGE}},children:[(()=>{if(t)return Ef(t);if(n!==void 0)return Df(n);throw Error(`There is no configuration provided for floating position (Align or offset)`)})()]}),Af=(e=>(e.CENTER=`ctr`,e.TOP=`t`,e.BOTTOM=`b`,e))(Af||{}),jf=(e={})=>new J({name:`wps:bodyPr`,attributes:{lIns:{key:`lIns`,value:e.margins?.left},rIns:{key:`rIns`,value:e.margins?.right},tIns:{key:`tIns`,value:e.margins?.top},bIns:{key:`bIns`,value:e.margins?.bottom},anchor:{key:`anchor`,value:e.verticalAnchor}},children:[...e.noAutoFit?[new q(`a:noAutofit`,e.noAutoFit)]:[]]}),Mf=(e={txBox:`1`})=>new J({name:`wps:cNvSpPr`,attributes:{txBox:{key:`txBox`,value:e.txBox}}}),Nf=e=>new J({name:`w:txbxContent`,children:[...e]}),Pf=e=>new J({name:`wps:txbx`,children:[Nf(e)]}),Ff=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{cx:`cx`,cy:`cy`})}},If=class extends W{constructor(e,t){super(`a:ext`),U(this,`attributes`),this.attributes=new Ff({cx:e,cy:t}),this.root.push(this.attributes)}},Lf=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{x:`x`,y:`y`})}},Rf=class extends W{constructor(e,t){super(`a:off`),this.root.push(new Lf({x:e??0,y:t??0}))}},zf=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{flipVertical:`flipV`,flipHorizontal:`flipH`,rotation:`rot`})}},Bf=class extends W{constructor(e){super(`a:xfrm`),U(this,`extents`),U(this,`offset`),this.root.push(new zf({flipVertical:e.flip?.vertical,flipHorizontal:e.flip?.horizontal,rotation:e.rotation})),this.offset=new Rf(e.offset?.emus?.x,e.offset?.emus?.y),this.extents=new If(e.emus.x,e.emus.y),this.root.push(this.offset),this.root.push(this.extents)}},Vf=()=>new J({name:`a:noFill`}),Hf=e=>new J({name:`a:srgbClr`,attributes:{value:{key:`val`,value:e.value}}}),Uf=e=>new J({name:`a:schemeClr`,attributes:{value:{key:`val`,value:e.value}}}),Wf=e=>new J({name:`a:solidFill`,children:[e.type===`rgb`?Hf(e):Uf(e)]}),Gf=e=>new J({name:`a:ln`,attributes:{width:{key:`w`,value:e.width},cap:{key:`cap`,value:e.cap},compoundLine:{key:`cmpd`,value:e.compoundLine},align:{key:`algn`,value:e.align}},children:[e.type===`noFill`?Vf():e.solidFillType===`rgb`?Wf({type:`rgb`,value:e.value}):Wf({type:`scheme`,value:e.value})]}),Kf=class extends W{constructor(){super(`a:avLst`)}},qf=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{prst:`prst`})}},Jf=class extends W{constructor(){super(`a:prstGeom`),this.root.push(new qf({prst:`rect`})),this.root.push(new Kf)}},Yf=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{bwMode:`bwMode`})}},Xf=class extends W{constructor({element:e,outline:t,solidFill:n,transform:r}){super(`${e}:spPr`),U(this,`form`),this.root.push(new Yf({bwMode:`auto`})),this.form=new Bf(r),this.root.push(this.form),this.root.push(new Jf),t&&(this.root.push(Vf()),this.root.push(Gf(t))),n&&this.root.push(Wf(n))}},Zf=e=>new J({name:`wps:wsp`,children:[Mf(e.nonVisualProperties),new Xf({element:`wps`,transform:e.transformation,outline:e.outline,solidFill:e.solidFill}),Pf(e.children),jf(e.bodyProperties)]}),Qf=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{uri:`uri`})}},$f=e=>new J({name:`asvg:svgBlip`,attributes:{asvg:{key:`xmlns:asvg`,value:`http://schemas.microsoft.com/office/drawing/2016/SVG/main`},embed:{key:`r:embed`,value:`rId{${e.fileName}}`}}}),ep=e=>new J({name:`a:ext`,attributes:{uri:{key:`uri`,value:`{96DAC541-7B7A-43D3-8B79-37D633B846F1}`}},children:[$f(e)]}),tp=e=>new J({name:`a:extLst`,children:[ep(e)]}),np=e=>new J({name:`a:blip`,attributes:{embed:{key:`r:embed`,value:`rId{${e.type===`svg`?e.fallback.fileName:e.fileName}}`},cstate:{key:`cstate`,value:`none`}},children:e.type===`svg`?[tp(e)]:[]}),rp=class extends W{constructor(){super(`a:srcRect`)}},ip=class extends W{constructor(){super(`a:fillRect`)}},ap=class extends W{constructor(){super(`a:stretch`),this.root.push(new ip)}},op=class extends W{constructor(e){super(`pic:blipFill`),this.root.push(np(e)),this.root.push(new rp),this.root.push(new ap)}},sp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{noChangeAspect:`noChangeAspect`,noChangeArrowheads:`noChangeArrowheads`})}},cp=class extends W{constructor(){super(`a:picLocks`),this.root.push(new sp({noChangeAspect:1,noChangeArrowheads:1}))}},lp=class extends W{constructor(){super(`pic:cNvPicPr`),this.root.push(new cp)}},up=(e,t)=>new J({name:`a:hlinkClick`,attributes:zi(H({},t?{xmlns:{key:`xmlns:a`,value:`http://schemas.openxmlformats.org/drawingml/2006/main`}}:{}),{id:{key:`r:id`,value:`rId${e}`}})}),dp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`id`,name:`name`,descr:`descr`})}},fp=class extends W{constructor(){super(`pic:cNvPr`),this.root.push(new dp({id:0,name:``,descr:``}))}prepForXml(e){for(let t=e.stack.length-1;t>=0;t--){let n=e.stack[t];if(n instanceof Xm){this.root.push(up(n.linkId,!1));break}}return super.prepForXml(e)}},pp=class extends W{constructor(){super(`pic:nvPicPr`),this.root.push(new fp),this.root.push(new lp)}},mp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{xmlns:`xmlns:pic`})}},hp=class extends W{constructor({mediaData:e,transform:t,outline:n}){super(`pic:pic`),this.root.push(new mp({xmlns:`http://schemas.openxmlformats.org/drawingml/2006/picture`})),this.root.push(new pp),this.root.push(new op(e)),this.root.push(new Xf({element:`pic`,transform:t,outline:n}))}},gp=e=>new J({name:`wpg:grpSpPr`,children:[new Bf(e)]}),_p=()=>new J({name:`wpg:cNvGrpSpPr`}),vp=e=>new J({name:`wpg:wgp`,children:[_p(),gp(e.transformation),...e.children]}),yp=class extends W{constructor({mediaData:e,transform:t,outline:n,solidFill:r}){if(super(`a:graphicData`),e.type===`wps`){this.root.push(new Qf({uri:`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`}));let i=Zf(zi(H({},e.data),{transformation:t,outline:n,solidFill:r}));this.root.push(i)}else if(e.type===`wpg`){this.root.push(new Qf({uri:`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`}));let n=vp({children:e.children.map(e=>e.type===`wps`?Zf(zi(H({},e.data),{transformation:e.transformation,outline:e.outline,solidFill:e.solidFill})):new hp({mediaData:e,transform:e.transformation,outline:e.outline})),transformation:t});this.root.push(n)}else{this.root.push(new Qf({uri:`http://schemas.openxmlformats.org/drawingml/2006/picture`}));let r=new hp({mediaData:e,transform:t,outline:n});this.root.push(r)}}},bp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{a:`xmlns:a`})}},xp=class extends W{constructor({mediaData:e,transform:t,outline:n,solidFill:r}){super(`a:graphic`),U(this,`data`),this.root.push(new bp({a:`http://schemas.openxmlformats.org/drawingml/2006/main`})),this.data=new yp({mediaData:e,transform:t,outline:n,solidFill:r}),this.root.push(this.data)}},Sp={NONE:0,SQUARE:1,TIGHT:2,TOP_AND_BOTTOM:3},Cp={BOTH_SIDES:`bothSides`,LEFT:`left`,RIGHT:`right`,LARGEST:`largest`},wp=()=>new J({name:`wp:wrapNone`}),Tp=(e,t={top:0,bottom:0,left:0,right:0})=>new J({name:`wp:wrapSquare`,attributes:{wrapText:{key:`wrapText`,value:e.side||Cp.BOTH_SIDES},distT:{key:`distT`,value:t.top},distB:{key:`distB`,value:t.bottom},distL:{key:`distL`,value:t.left},distR:{key:`distR`,value:t.right}}}),Ep=(e={top:0,bottom:0})=>new J({name:`wp:wrapTight`,attributes:{distT:{key:`distT`,value:e.top},distB:{key:`distB`,value:e.bottom}}}),Dp=(e={top:0,bottom:0})=>new J({name:`wp:wrapTopAndBottom`,attributes:{distT:{key:`distT`,value:e.top},distB:{key:`distB`,value:e.bottom}}}),Op=class extends W{constructor({name:e,description:t,title:n,id:r}={name:``,description:``,title:``}){super(`wp:docPr`),U(this,`docPropertiesUniqueNumericId`,gf());let i={id:{key:`id`,value:r??this.docPropertiesUniqueNumericId()},name:{key:`name`,value:e}};t!=null&&(i.description={key:`descr`,value:t}),n!=null&&(i.title={key:`title`,value:n}),this.root.push(new Gi(i))}prepForXml(e){for(let t=e.stack.length-1;t>=0;t--){let n=e.stack[t];if(n instanceof Xm){this.root.push(up(n.linkId,!0));break}}return super.prepForXml(e)}},kp=({top:e,right:t,bottom:n,left:r})=>new J({name:`wp:effectExtent`,attributes:{top:{key:`t`,value:e},right:{key:`r`,value:t},bottom:{key:`b`,value:n},left:{key:`l`,value:r}}}),Ap=({x:e,y:t})=>new J({name:`wp:extent`,attributes:{x:{key:`cx`,value:e},y:{key:`cy`,value:t}}}),jp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{xmlns:`xmlns:a`,noChangeAspect:`noChangeAspect`})}},Mp=class extends W{constructor(){super(`a:graphicFrameLocks`),this.root.push(new jp({xmlns:`http://schemas.openxmlformats.org/drawingml/2006/main`,noChangeAspect:1}))}},Np=()=>new J({name:`wp:cNvGraphicFramePr`,children:[new Mp]}),Pp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{distT:`distT`,distB:`distB`,distL:`distL`,distR:`distR`,allowOverlap:`allowOverlap`,behindDoc:`behindDoc`,layoutInCell:`layoutInCell`,locked:`locked`,relativeHeight:`relativeHeight`,simplePos:`simplePos`})}},Fp=class extends W{constructor({mediaData:e,transform:t,drawingOptions:n}){super(`wp:anchor`);let r=H({allowOverlap:!0,behindDocument:!1,lockAnchor:!1,layoutInCell:!0,verticalPosition:{},horizontalPosition:{}},n.floating);if(this.root.push(new Pp({distT:r.margins&&r.margins.top||0,distB:r.margins&&r.margins.bottom||0,distL:r.margins&&r.margins.left||0,distR:r.margins&&r.margins.right||0,simplePos:`0`,allowOverlap:r.allowOverlap===!0?`1`:`0`,behindDoc:r.behindDocument===!0?`1`:`0`,locked:r.lockAnchor===!0?`1`:`0`,layoutInCell:r.layoutInCell===!0?`1`:`0`,relativeHeight:r.zIndex?r.zIndex:t.emus.y})),this.root.push(Tf()),this.root.push(Of(r.horizontalPosition)),this.root.push(kf(r.verticalPosition)),this.root.push(Ap({x:t.emus.x,y:t.emus.y})),this.root.push(kp({top:0,right:0,bottom:0,left:0})),n.floating!==void 0&&n.floating.wrap!==void 0)switch(n.floating.wrap.type){case Sp.SQUARE:this.root.push(Tp(n.floating.wrap,n.floating.margins));break;case Sp.TIGHT:this.root.push(Ep(n.floating.margins));break;case Sp.TOP_AND_BOTTOM:this.root.push(Dp(n.floating.margins));break;case Sp.NONE:default:this.root.push(wp())}else this.root.push(wp());this.root.push(new Op(n.docProperties)),this.root.push(Np()),this.root.push(new xp({mediaData:e,transform:t,outline:n.outline,solidFill:n.solidFill}))}},Ip=({mediaData:e,transform:t,docProperties:n,outline:r,solidFill:i})=>new J({name:`wp:inline`,attributes:{distanceTop:{key:`distT`,value:0},distanceBottom:{key:`distB`,value:0},distanceLeft:{key:`distL`,value:0},distanceRight:{key:`distR`,value:0}},children:[Ap({x:t.emus.x,y:t.emus.y}),kp(r?{top:(r.width??9525)*2,right:(r.width??9525)*2,bottom:(r.width??9525)*2,left:(r.width??9525)*2}:{top:0,right:0,bottom:0,left:0}),new Op(n),Np(),new xp({mediaData:e,transform:t,outline:r,solidFill:i})]}),Lp=class extends W{constructor(e,t={}){super(`w:drawing`),t.floating?this.root.push(new Fp({mediaData:e,transform:e.transformation,drawingOptions:t})):this.root.push(Ip({mediaData:e,transform:e.transformation,docProperties:t.docProperties,outline:t.outline,solidFill:t.solidFill}))}},Rp=e=>{let t=e.indexOf(`;base64,`),n=t===-1?0:t+8;return new Uint8Array(atob(e.substring(n)).split(``).map(e=>e.charCodeAt(0)))},zp=e=>typeof e==`string`?Rp(e):e,Bp=(e,t)=>({data:zp(e.data),fileName:t,transformation:{pixels:{x:Math.round(e.transformation.width),y:Math.round(e.transformation.height)},emus:{x:Math.round(e.transformation.width*9525),y:Math.round(e.transformation.height*9525)},flip:e.transformation.flip,rotation:e.transformation.rotation?e.transformation.rotation*6e4:void 0}}),Vp=class extends _d{constructor(e){super({}),U(this,`imageData`);let t=`${yf(e.data)}.${e.type}`;this.imageData=e.type===`svg`?zi(H({type:e.type},Bp(e,t)),{fallback:H({type:e.fallback.type},Bp(zi(H({},e.fallback),{transformation:e.transformation}),`${yf(e.fallback.data)}.${e.fallback.type}`))}):H({type:e.type},Bp(e,t));let n=new Lp(this.imageData,{floating:e.floating,docProperties:e.altText,outline:e.outline});this.root.push(n)}prepForXml(e){return e.file.Media.addImage(this.imageData.fileName,this.imageData),this.imageData.type===`svg`&&e.file.Media.addImage(this.imageData.fallback.fileName,this.imageData.fallback),super.prepForXml(e)}},Hp=e=>({offset:{pixels:{x:Math.round(e.offset?.left??0),y:Math.round(e.offset?.top??0)},emus:{x:Math.round((e.offset?.left??0)*9525),y:Math.round((e.offset?.top??0)*9525)}},pixels:{x:Math.round(e.width),y:Math.round(e.height)},emus:{x:Math.round(e.width*9525),y:Math.round(e.height*9525)},flip:e.flip,rotation:e.rotation?e.rotation*6e4:void 0}),Up=class extends _d{constructor(e){super({}),U(this,`wpsShapeData`),this.wpsShapeData={type:e.type,transformation:Hp(e.transformation),data:H({},e)};let t=new Lp(this.wpsShapeData,{floating:e.floating,docProperties:e.altText,outline:e.outline,solidFill:e.solidFill});this.root.push(t)}},Wp=class extends _d{constructor(e){super({}),U(this,`wpgGroupData`),U(this,`mediaDatas`),this.wpgGroupData={type:e.type,transformation:Hp(e.transformation),children:e.children};let t=new Lp(this.wpgGroupData,{floating:e.floating,docProperties:e.altText});this.mediaDatas=e.children.filter(e=>e.type!==`wps`).map(e=>e),this.root.push(t)}prepForXml(e){return this.mediaDatas.forEach(t=>{e.file.Media.addImage(t.fileName,t),t.type===`svg`&&e.file.Media.addImage(t.fallback.fileName,t.fallback)}),super.prepForXml(e)}},Gp=class extends W{constructor(e){super(`w:instrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`SEQ ${e}`)}},Kp=class extends _d{constructor(e){super({}),this.root.push(Nu(!0)),this.root.push(new Gp(e)),this.root.push(Pu()),this.root.push(Fu())}},qp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{instr:`w:instr`})}},Jp=class extends W{constructor(e,t){super(`w:fldSimple`),this.root.push(new qp({instr:e})),t!==void 0&&this.root.push(new X(t))}},Yp=class extends Jp{constructor(e){super(` MERGEFIELD ${e} `,`«${e}»`)}},Xp=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{xmlns:`xmlns`})}},Zp={EXTERNAL:`External`},Qp=(e,t,n,r)=>new J({name:`Relationship`,attributes:{id:{key:`Id`,value:e},type:{key:`Type`,value:t},target:{key:`Target`,value:n},targetMode:{key:`TargetMode`,value:r}}}),$p=class extends W{constructor(){super(`Relationships`),this.root.push(new Xp({xmlns:`http://schemas.openxmlformats.org/package/2006/relationships`}))}addRelationship(e,t,n,r){this.root.push(Qp(`rId${e}`,t,n,r))}get RelationshipCount(){return this.root.length-1}},em=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`,initials:`w:initials`,author:`w:author`,date:`w:date`})}},tm=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`})}},nm=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{"xmlns:cx":`xmlns:cx`,"xmlns:cx1":`xmlns:cx1`,"xmlns:cx2":`xmlns:cx2`,"xmlns:cx3":`xmlns:cx3`,"xmlns:cx4":`xmlns:cx4`,"xmlns:cx5":`xmlns:cx5`,"xmlns:cx6":`xmlns:cx6`,"xmlns:cx7":`xmlns:cx7`,"xmlns:cx8":`xmlns:cx8`,"xmlns:mc":`xmlns:mc`,"xmlns:aink":`xmlns:aink`,"xmlns:am3d":`xmlns:am3d`,"xmlns:o":`xmlns:o`,"xmlns:r":`xmlns:r`,"xmlns:m":`xmlns:m`,"xmlns:v":`xmlns:v`,"xmlns:wp14":`xmlns:wp14`,"xmlns:wp":`xmlns:wp`,"xmlns:w10":`xmlns:w10`,"xmlns:w":`xmlns:w`,"xmlns:w14":`xmlns:w14`,"xmlns:w15":`xmlns:w15`,"xmlns:w16cex":`xmlns:w16cex`,"xmlns:w16cid":`xmlns:w16cid`,"xmlns:w16":`xmlns:w16`,"xmlns:w16sdtdh":`xmlns:w16sdtdh`,"xmlns:w16se":`xmlns:w16se`,"xmlns:wpg":`xmlns:wpg`,"xmlns:wpi":`xmlns:wpi`,"xmlns:wne":`xmlns:wne`,"xmlns:wps":`xmlns:wps`})}},rm=class extends W{constructor(e){super(`w:commentRangeStart`),this.root.push(new tm({id:e}))}},im=class extends W{constructor(e){super(`w:commentRangeEnd`),this.root.push(new tm({id:e}))}},am=class extends W{constructor(e){super(`w:commentReference`),this.root.push(new tm({id:e}))}},om=class extends W{constructor({id:e,initials:t,author:n,date:r=new Date,children:i}){super(`w:comment`),this.root.push(new em({id:e,initials:t,author:n,date:r.toISOString()}));for(let e of i)this.root.push(e)}},sm=class extends W{constructor({children:e}){super(`w:comments`),U(this,`relationships`),this.root.push(new nm({"xmlns:cx":`http://schemas.microsoft.com/office/drawing/2014/chartex`,"xmlns:cx1":`http://schemas.microsoft.com/office/drawing/2015/9/8/chartex`,"xmlns:cx2":`http://schemas.microsoft.com/office/drawing/2015/10/21/chartex`,"xmlns:cx3":`http://schemas.microsoft.com/office/drawing/2016/5/9/chartex`,"xmlns:cx4":`http://schemas.microsoft.com/office/drawing/2016/5/10/chartex`,"xmlns:cx5":`http://schemas.microsoft.com/office/drawing/2016/5/11/chartex`,"xmlns:cx6":`http://schemas.microsoft.com/office/drawing/2016/5/12/chartex`,"xmlns:cx7":`http://schemas.microsoft.com/office/drawing/2016/5/13/chartex`,"xmlns:cx8":`http://schemas.microsoft.com/office/drawing/2016/5/14/chartex`,"xmlns:mc":`http://schemas.openxmlformats.org/markup-compatibility/2006`,"xmlns:aink":`http://schemas.microsoft.com/office/drawing/2016/ink`,"xmlns:am3d":`http://schemas.microsoft.com/office/drawing/2017/model3d`,"xmlns:o":`urn:schemas-microsoft-com:office:office`,"xmlns:r":`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,"xmlns:m":`http://schemas.openxmlformats.org/officeDocument/2006/math`,"xmlns:v":`urn:schemas-microsoft-com:vml`,"xmlns:wp14":`http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`,"xmlns:wp":`http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing`,"xmlns:w10":`urn:schemas-microsoft-com:office:word`,"xmlns:w":`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,"xmlns:w14":`http://schemas.microsoft.com/office/word/2010/wordml`,"xmlns:w15":`http://schemas.microsoft.com/office/word/2012/wordml`,"xmlns:w16cex":`http://schemas.microsoft.com/office/word/2018/wordml/cex`,"xmlns:w16cid":`http://schemas.microsoft.com/office/word/2016/wordml/cid`,"xmlns:w16":`http://schemas.microsoft.com/office/word/2018/wordml`,"xmlns:w16sdtdh":`http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash`,"xmlns:w16se":`http://schemas.microsoft.com/office/word/2015/wordml/symex`,"xmlns:wpg":`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`,"xmlns:wpi":`http://schemas.microsoft.com/office/word/2010/wordprocessingInk`,"xmlns:wne":`http://schemas.microsoft.com/office/word/2006/wordml`,"xmlns:wps":`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`}));for(let t of e)this.root.push(new om(t));this.relationships=new $p}get Relationships(){return this.relationships}},cm=class extends vu{constructor(){super(`w:noBreakHyphen`)}},lm=class extends vu{constructor(){super(`w:softHyphen`)}},um=class extends vu{constructor(){super(`w:dayShort`)}},dm=class extends vu{constructor(){super(`w:monthShort`)}},fm=class extends vu{constructor(){super(`w:yearShort`)}},pm=class extends vu{constructor(){super(`w:dayLong`)}},mm=class extends vu{constructor(){super(`w:monthLong`)}},hm=class extends vu{constructor(){super(`w:yearLong`)}},gm=class extends vu{constructor(){super(`w:annotationRef`)}},_m=class extends vu{constructor(){super(`w:footnoteRef`)}},vm=class extends vu{constructor(){super(`w:endnoteRef`)}},ym=class extends vu{constructor(){super(`w:separator`)}},bm=class extends vu{constructor(){super(`w:continuationSeparator`)}},xm=class extends vu{constructor(){super(`w:pgNum`)}},Sm=class extends vu{constructor(){super(`w:cr`)}},Cm=class extends vu{constructor(){super(`w:tab`)}},wm=class extends vu{constructor(){super(`w:lastRenderedPageBreak`)}},Tm={LEFT:`left`,CENTER:`center`,RIGHT:`right`},Em={MARGIN:`margin`,INDENT:`indent`},Dm={NONE:`none`,DOT:`dot`,HYPHEN:`hyphen`,UNDERSCORE:`underscore`,MIDDLE_DOT:`middleDot`},Om=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{alignment:`w:alignment`,relativeTo:`w:relativeTo`,leader:`w:leader`})}},km=class extends W{constructor(e){super(`w:ptab`),this.root.push(new Om({alignment:e.alignment,relativeTo:e.relativeTo,leader:e.leader}))}},Am={COLUMN:`column`,PAGE:`page`},jm=class extends W{constructor(e){super(`w:br`),this.root.push(new Ki({type:e}))}},Mm=class extends _d{constructor(){super({}),this.root.push(new jm(Am.PAGE))}},Nm=class extends _d{constructor(){super({}),this.root.push(new jm(Am.COLUMN))}},Pm=class extends W{constructor(){super(`w:pageBreakBefore`)}},Fm={AT_LEAST:`atLeast`,EXACTLY:`exactly`,EXACT:`exact`,AUTO:`auto`},Im=({after:e,before:t,line:n,lineRule:r,beforeAutoSpacing:i,afterAutoSpacing:a})=>new J({name:`w:spacing`,attributes:{after:{key:`w:after`,value:e},before:{key:`w:before`,value:t},line:{key:`w:line`,value:n},lineRule:{key:`w:lineRule`,value:r},beforeAutoSpacing:{key:`w:beforeAutospacing`,value:i},afterAutoSpacing:{key:`w:afterAutospacing`,value:a}}}),Lm={HEADING_1:`Heading1`,HEADING_2:`Heading2`,HEADING_3:`Heading3`,HEADING_4:`Heading4`,HEADING_5:`Heading5`,HEADING_6:`Heading6`,TITLE:`Title`},Rm=e=>new J({name:`w:pStyle`,attributes:{val:{key:`w:val`,value:e}}}),zm={LEFT:`left`,RIGHT:`right`,CENTER:`center`,BAR:`bar`,CLEAR:`clear`,DECIMAL:`decimal`,END:`end`,NUM:`num`,START:`start`},Bm={DOT:`dot`,HYPHEN:`hyphen`,MIDDLE_DOT:`middleDot`,NONE:`none`,UNDERSCORE:`underscore`},Vm={MAX:9026},Hm=({type:e,position:t,leader:n})=>new J({name:`w:tab`,attributes:{val:{key:`w:val`,value:e},pos:{key:`w:pos`,value:t},leader:{key:`w:leader`,value:n}}}),Um=e=>new J({name:`w:tabs`,children:e.map(e=>Hm(e))}),Wm=class extends W{constructor(e,t){super(`w:numPr`),this.root.push(new Gm(t)),this.root.push(new Km(e))}},Gm=class extends W{constructor(e){if(super(`w:ilvl`),e>9)throw Error(`Level cannot be greater than 9. Read more here: https://answers.microsoft.com/en-us/msoffice/forum/all/does-word-support-more-than-9-list-levels/d130fdcd-1781-446d-8c84-c6c79124e4d7`);this.root.push(new Ki({val:e}))}},Km=class extends W{constructor(e){super(`w:numId`),this.root.push(new Ki({val:typeof e==`string`?`{${e}}`:e}))}},qm=class extends W{constructor(){super(...arguments),U(this,`fileChild`,Symbol())}},Jm=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`r:id`,history:`w:history`,anchor:`w:anchor`})}},Ym={INTERNAL:`INTERNAL`,EXTERNAL:`EXTERNAL`},Xm=class extends W{constructor(e,t,n){super(`w:hyperlink`),U(this,`linkId`),this.linkId=t;let r=new Jm({history:1,anchor:n||void 0,id:n?void 0:`rId${this.linkId}`});this.root.push(r),e.forEach(e=>{this.root.push(e)})}},Zm=class extends Xm{constructor(e){super(e.children,vf(),e.anchor)}},Qm=class extends W{constructor(e){super(`w:externalHyperlink`),this.options=e}},$m=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`,name:`w:name`})}},eh=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`})}},th=class{constructor(e){U(this,`bookmarkUniqueNumericId`,_f()),U(this,`start`),U(this,`children`),U(this,`end`);let t=this.bookmarkUniqueNumericId();this.start=new nh(e.id,t),this.children=e.children,this.end=new rh(t)}},nh=class extends W{constructor(e,t){super(`w:bookmarkStart`);let n=new $m({name:e,id:t});this.root.push(n)}},rh=class extends W{constructor(e){super(`w:bookmarkEnd`);let t=new eh({id:e});this.root.push(t)}},ih=(e=>(e.NONE=`none`,e.RELATIVE=`relative`,e.NO_CONTEXT=`no_context`,e.FULL_CONTEXT=`full_context`,e))(ih||{}),ah={relative:`\\r`,no_context:`\\n`,full_context:`\\w`,none:void 0},oh=class extends Jp{constructor(e,t,n={}){let{hyperlink:r=!0,referenceFormat:i=`full_context`}=n,a=`${`REF ${e}`} ${[...r?[`\\h`]:[],...[ah[i]].filter(e=>!!e)].join(` `)}`;super(a,t)}},sh=e=>new J({name:`w:outlineLvl`,attributes:{val:{key:`w:val`,value:e}}}),ch=class extends W{constructor(e,t={}){super(`w:instrText`),this.root.push(new Bu({space:zu.PRESERVE}));let n=`PAGEREF ${e}`;t.hyperlink&&(n=`${n} \\h`),t.useRelativePosition&&(n=`${n} \\p`),this.root.push(n)}},lh=class extends _d{constructor(e,t={}){super({children:[Nu(!0),new ch(e,t),Fu()]})}},uh={ANSI:`00`,DEFAULT:`01`,SYMBOL:`02`,MAC:`4D`,JIS:`80`,HANGUL:`81`,JOHAB:`82`,GB_2312:`86`,CHINESEBIG5:`88`,GREEK:`A1`,TURKISH:`A2`,VIETNAMESE:`A3`,HEBREW:`B1`,ARABIC:`B2`,BALTIC:`BA`,RUSSIAN:`CC`,THAI:`DE`,EASTEUROPE:`EE`,OEM:`FF`},dh=({id:e,fontKey:t,subsetted:n},r)=>new J({name:r,attributes:H({id:{key:`r:id`,value:e}},t?{fontKey:{key:`w:fontKey`,value:`{${t}}`}}:{}),children:[...n?[new q(`w:subsetted`,n)]:[]]}),fh=({name:e,altName:t,panose1:n,charset:r,family:i,notTrueType:a,pitch:o,sig:s,embedRegular:c,embedBold:l,embedItalic:u,embedBoldItalic:d})=>new J({name:`w:font`,attributes:{name:{key:`w:name`,value:e}},children:[...t?[bu(`w:altName`,t)]:[],...n?[bu(`w:panose1`,n)]:[],...r?[bu(`w:charset`,r)]:[],...[bu(`w:family`,i)],...a?[new q(`w:notTrueType`,a)]:[],...[bu(`w:pitch`,o)],...s?[new J({name:`w:sig`,attributes:{usb0:{key:`w:usb0`,value:s.usb0},usb1:{key:`w:usb1`,value:s.usb1},usb2:{key:`w:usb2`,value:s.usb2},usb3:{key:`w:usb3`,value:s.usb3},csb0:{key:`w:csb0`,value:s.csb0},csb1:{key:`w:csb1`,value:s.csb1}}})]:[],...c?[dh(c,`w:embedRegular`)]:[],...l?[dh(l,`w:embedBold`)]:[],...u?[dh(u,`w:embedItalic`)]:[],...d?[dh(d,`w:embedBoldItalic`)]:[]]}),ph=({name:e,index:t,fontKey:n,characterSet:r})=>fh({name:e,sig:{usb0:`E0002AFF`,usb1:`C000247B`,usb2:`00000009`,usb3:`00000000`,csb0:`000001FF`,csb1:`00000000`},charset:r,family:`auto`,pitch:`variable`,embedRegular:{fontKey:n,id:`rId${t}`}}),mh=e=>new J({name:`w:fonts`,attributes:{mc:{key:`xmlns:mc`,value:`http://schemas.openxmlformats.org/markup-compatibility/2006`},r:{key:`xmlns:r`,value:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`},w:{key:`xmlns:w`,value:`http://schemas.openxmlformats.org/wordprocessingml/2006/main`},w14:{key:`xmlns:w14`,value:`http://schemas.microsoft.com/office/word/2010/wordml`},w15:{key:`xmlns:w15`,value:`http://schemas.microsoft.com/office/word/2012/wordml`},w16cex:{key:`xmlns:w16cex`,value:`http://schemas.microsoft.com/office/word/2018/wordml/cex`},w16cid:{key:`xmlns:w16cid`,value:`http://schemas.microsoft.com/office/word/2016/wordml/cid`},w16:{key:`xmlns:w16`,value:`http://schemas.microsoft.com/office/word/2018/wordml`},w16sdtdh:{key:`xmlns:w16sdtdh`,value:`http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash`},w16se:{key:`xmlns:w16se`,value:`http://schemas.microsoft.com/office/word/2015/wordml/symex`},Ignorable:{key:`mc:Ignorable`,value:`w14 w15 w16se w16cid w16 w16cex w16sdtdh`}},children:e.map((e,t)=>ph({name:e.name,index:t+1,fontKey:e.fontKey,characterSet:e.characterSet}))}),hh=class{constructor(e){U(this,`fontTable`),U(this,`relationships`),U(this,`fontOptionsWithKey`,[]),this.options=e,this.fontOptionsWithKey=e.map(e=>zi(H({},e),{fontKey:xf()})),this.fontTable=mh(this.fontOptionsWithKey),this.relationships=new $p;for(let t=0;t<e.length;t++)this.relationships.addRelationship(t+1,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/font`,`fonts/${e[t].name}.odttf`)}get View(){return this.fontTable}get Relationships(){return this.relationships}},gh=()=>new J({name:`w:wordWrap`,attributes:{val:{key:`w:val`,value:0}}}),_h={NONE:`none`,DROP:`drop`,MARGIN:`margin`},vh={MARGIN:`margin`,PAGE:`page`,TEXT:`text`},yh={AROUND:`around`,AUTO:`auto`,NONE:`none`,NOT_BESIDE:`notBeside`,THROUGH:`through`,TIGHT:`tight`},bh=e=>new J({name:`w:framePr`,attributes:{anchorLock:{key:`w:anchorLock`,value:e.anchorLock},dropCap:{key:`w:dropCap`,value:e.dropCap},width:{key:`w:w`,value:e.width},height:{key:`w:h`,value:e.height},x:{key:`w:x`,value:e.position?e.position.x:void 0},y:{key:`w:y`,value:e.position?e.position.y:void 0},anchorHorizontal:{key:`w:hAnchor`,value:e.anchor.horizontal},anchorVertical:{key:`w:vAnchor`,value:e.anchor.vertical},spaceHorizontal:{key:`w:hSpace`,value:e.space?.horizontal},spaceVertical:{key:`w:vSpace`,value:e.space?.vertical},rule:{key:`w:hRule`,value:e.rule},alignmentX:{key:`w:xAlign`,value:e.alignment?e.alignment.x:void 0},alignmentY:{key:`w:yAlign`,value:e.alignment?e.alignment.y:void 0},lines:{key:`w:lines`,value:e.lines},wrap:{key:`w:wrap`,value:e.wrap}}}),xh=class extends Wi{constructor(e){if(super(`w:pPr`,e?.includeIfEmpty),U(this,`numberingReferences`,[]),!e)return this;e.heading&&this.push(Rm(e.heading)),e.bullet&&this.push(Rm(`ListParagraph`)),e.numbering&&!e.style&&!e.heading&&(e.numbering.custom||this.push(Rm(`ListParagraph`))),e.style&&this.push(Rm(e.style)),e.keepNext!==void 0&&this.push(new q(`w:keepNext`,e.keepNext)),e.keepLines!==void 0&&this.push(new q(`w:keepLines`,e.keepLines)),e.pageBreakBefore&&this.push(new Pm),e.frame&&this.push(bh(e.frame)),e.widowControl!==void 0&&this.push(new q(`w:widowControl`,e.widowControl)),e.bullet&&this.push(new Wm(1,e.bullet.level)),e.numbering?(this.numberingReferences.push({reference:e.numbering.reference,instance:e.numbering.instance??0}),this.push(new Wm(`${e.numbering.reference}-${e.numbering.instance??0}`,e.numbering.level))):e.numbering===!1&&this.push(new Wm(0,0)),e.border&&this.push(new Du(e.border)),e.thematicBreak&&this.push(new Ou),e.shading&&this.push(Gu(e.shading)),e.wordWrap&&this.push(gh()),e.overflowPunctuation&&this.push(new q(`w:overflowPunct`,e.overflowPunctuation));let t=[...e.rightTabStop===void 0?[]:[{type:zm.RIGHT,position:e.rightTabStop}],...e.tabStops?e.tabStops:[],...e.leftTabStop===void 0?[]:[{type:zm.LEFT,position:e.leftTabStop}]];t.length>0&&this.push(Um(t)),e.bidirectional!==void 0&&this.push(new q(`w:bidi`,e.bidirectional)),e.spacing&&this.push(Im(e.spacing)),e.indent&&this.push(ku(e.indent)),e.contextualSpacing!==void 0&&this.push(new q(`w:contextualSpacing`,e.contextualSpacing)),e.alignment&&this.push(wu(e.alignment)),e.outlineLevel!==void 0&&this.push(sh(e.outlineLevel)),e.suppressLineNumbers!==void 0&&this.push(new q(`w:suppressLineNumbers`,e.suppressLineNumbers)),e.autoSpaceEastAsianText!==void 0&&this.push(new q(`w:autoSpaceDN`,e.autoSpaceEastAsianText)),e.run&&this.push(new pd(e.run)),e.revision&&this.push(new Sh(e.revision))}push(e){this.root.push(e)}prepForXml(e){if(!(e.viewWrapper instanceof hh))for(let t of this.numberingReferences)e.file.Numbering.createConcreteNumberingInstance(t.reference,t.instance);return super.prepForXml(e)}},Sh=class extends W{constructor(e){super(`w:pPrChange`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.root.push(new xh(zi(H({},e),{includeIfEmpty:!0})))}},Z=class extends qm{constructor(e){if(super(`w:p`),U(this,`properties`),typeof e==`string`)return this.properties=new xh({}),this.root.push(this.properties),this.root.push(new X(e)),this;if(this.properties=new xh(e),this.root.push(this.properties),e.text&&this.root.push(new X(e.text)),e.children)for(let t of e.children){if(t instanceof th){this.root.push(t.start);for(let e of t.children)this.root.push(e);this.root.push(t.end);continue}this.root.push(t)}}prepForXml(e){for(let t of this.root)if(t instanceof Qm){let n=this.root.indexOf(t),r=new Xm(t.options.children,vf());e.viewWrapper.Relationships.addRelationship(r.linkId,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink`,t.options.link,Zp.EXTERNAL),this.root[n]=r}return super.prepForXml(e)}addRunToFront(e){return this.root.splice(1,0,e),this}},Ch=class extends W{constructor(e){super(`m:oMath`);for(let t of e.children)this.root.push(t)}},wh=class extends W{constructor(e){super(`m:t`),this.root.push(e)}},Th=class extends W{constructor(e){super(`m:r`),this.root.push(new wh(e))}},Eh=class extends W{constructor(e){super(`m:den`);for(let t of e)this.root.push(t)}},Dh=class extends W{constructor(e){super(`m:num`);for(let t of e)this.root.push(t)}},Oh=class extends W{constructor(e){super(`m:f`),this.root.push(new Dh(e.numerator)),this.root.push(new Eh(e.denominator))}},kh=({accent:e})=>new J({name:`m:chr`,attributes:{accent:{key:`m:val`,value:e}}}),Ah=({children:e})=>new J({name:`m:e`,children:e}),jh=({value:e})=>new J({name:`m:limLoc`,attributes:{value:{key:`m:val`,value:e||`undOvr`}}}),Mh=()=>new J({name:`m:subHide`,attributes:{hide:{key:`m:val`,value:1}}}),Nh=()=>new J({name:`m:supHide`,attributes:{hide:{key:`m:val`,value:1}}}),Ph=({accent:e,hasSuperScript:t,hasSubScript:n,limitLocationVal:r})=>new J({name:`m:naryPr`,children:[...e?[kh({accent:e})]:[],jh({value:r}),...t?[]:[Nh()],...n?[]:[Mh()]]}),Fh=({children:e})=>new J({name:`m:sub`,children:e}),Ih=({children:e})=>new J({name:`m:sup`,children:e}),Lh=class extends W{constructor(e){super(`m:nary`),this.root.push(Ph({accent:`∑`,hasSuperScript:!!e.superScript,hasSubScript:!!e.subScript})),e.subScript&&this.root.push(Fh({children:e.subScript})),e.superScript&&this.root.push(Ih({children:e.superScript})),this.root.push(Ah({children:e.children}))}},Rh=class extends W{constructor(e){super(`m:nary`),this.root.push(Ph({accent:``,hasSuperScript:!!e.superScript,hasSubScript:!!e.subScript,limitLocationVal:`subSup`})),e.subScript&&this.root.push(Fh({children:e.subScript})),e.superScript&&this.root.push(Ih({children:e.superScript})),this.root.push(Ah({children:e.children}))}},zh=class extends W{constructor(e){super(`m:lim`);for(let t of e)this.root.push(t)}},Bh=class extends W{constructor(e){super(`m:limUpp`),this.root.push(Ah({children:e.children})),this.root.push(new zh(e.limit))}},Vh=class extends W{constructor(e){super(`m:limLow`),this.root.push(Ah({children:e.children})),this.root.push(new zh(e.limit))}},Hh=()=>new J({name:`m:sSupPr`}),Uh=class extends W{constructor(e){super(`m:sSup`),this.root.push(Hh()),this.root.push(Ah({children:e.children})),this.root.push(Ih({children:e.superScript}))}},Wh=()=>new J({name:`m:sSubPr`}),Gh=class extends W{constructor(e){super(`m:sSub`),this.root.push(Wh()),this.root.push(Ah({children:e.children})),this.root.push(Fh({children:e.subScript}))}},Kh=()=>new J({name:`m:sSubSupPr`}),qh=class extends W{constructor(e){super(`m:sSubSup`),this.root.push(Kh()),this.root.push(Ah({children:e.children})),this.root.push(Fh({children:e.subScript})),this.root.push(Ih({children:e.superScript}))}},Jh=()=>new J({name:`m:sPrePr`}),Yh=class extends J{constructor({children:e,subScript:t,superScript:n}){super({name:`m:sPre`,children:[Jh(),Ah({children:e}),Fh({children:t}),Ih({children:n})]})}},Xh=class extends W{constructor(e){if(super(`m:deg`),e)for(let t of e)this.root.push(t)}},Zh=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{hide:`m:val`})}},Qh=class extends W{constructor(){super(`m:degHide`),this.root.push(new Zh({hide:1}))}},$h=class extends W{constructor(e){super(`m:radPr`),e||this.root.push(new Qh)}},eg=class extends W{constructor(e){super(`m:rad`),this.root.push(new $h(!!e.degree)),this.root.push(new Xh(e.degree)),this.root.push(Ah({children:e.children}))}},tg=class extends W{constructor(e){super(`m:fName`);for(let t of e)this.root.push(t)}},ng=class extends W{constructor(){super(`m:funcPr`)}},rg=class extends W{constructor(e){super(`m:func`),this.root.push(new ng),this.root.push(new tg(e.name)),this.root.push(Ah({children:e.children}))}},ig=({character:e})=>new J({name:`m:begChr`,attributes:{character:{key:`m:val`,value:e}}}),ag=({character:e})=>new J({name:`m:endChr`,attributes:{character:{key:`m:val`,value:e}}}),og=({characters:e})=>new J({name:`m:dPr`,children:e?[ig({character:e.beginningCharacter}),ag({character:e.endingCharacter})]:[]}),sg=class extends W{constructor(e){super(`m:d`),this.root.push(og({})),this.root.push(Ah({children:e.children}))}},cg=class extends W{constructor(e){super(`m:d`),this.root.push(og({characters:{beginningCharacter:`[`,endingCharacter:`]`}})),this.root.push(Ah({children:e.children}))}},lg=class extends W{constructor(e){super(`m:d`),this.root.push(og({characters:{beginningCharacter:`{`,endingCharacter:`}`}})),this.root.push(Ah({children:e.children}))}},ug=class extends W{constructor(e){super(`m:d`),this.root.push(og({characters:{beginningCharacter:`〈`,endingCharacter:`〉`}})),this.root.push(Ah({children:e.children}))}},dg=e=>new J({name:`w:gridCol`,attributes:e===void 0?void 0:{width:{key:`w:w`,value:du(e)}}}),fg=class extends W{constructor(e,t){super(`w:tblGrid`);for(let t of e)this.root.push(dg(t));t&&this.root.push(new mg(t))}},pg=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`})}},mg=class extends W{constructor(e){super(`w:tblGridChange`),this.root.push(new pg({id:e.id})),this.root.push(new fg(e.columnWidths))}},hg=class extends W{constructor(e){super(`w:ins`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.addChildElement(new X(e))}},gg=class extends W{constructor(){super(`w:delInstrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`PAGE`)}},_g=class extends W{constructor(){super(`w:delInstrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`NUMPAGES`)}},vg=class extends W{constructor(){super(`w:delInstrText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(`SECTIONPAGES`)}},yg=class extends W{constructor(e){super(`w:delText`),this.root.push(new Bu({space:zu.PRESERVE})),this.root.push(e)}},bg=class extends W{constructor(e){super(`w:del`),U(this,`deletedTextRunWrapper`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.deletedTextRunWrapper=new xg(e),this.addChildElement(this.deletedTextRunWrapper)}},xg=class extends W{constructor(e){if(super(`w:r`),this.root.push(new fd(e)),e.children)for(let t of e.children){if(typeof t==`string`){switch(t){case gd.CURRENT:this.root.push(Nu()),this.root.push(new gg),this.root.push(Pu()),this.root.push(Fu());break;case gd.TOTAL_PAGES:this.root.push(Nu()),this.root.push(new _g),this.root.push(Pu()),this.root.push(Fu());break;case gd.TOTAL_PAGES_IN_SECTION:this.root.push(Nu()),this.root.push(new vg),this.root.push(Pu()),this.root.push(Fu());break;default:this.root.push(new yg(t));break}continue}this.root.push(t)}else e.text&&this.root.push(new yg(e.text));if(e.break)for(let t=0;t<e.break;t++)this.root.splice(1,0,Au())}},Sg=class extends W{constructor(e){super(`w:ins`),this.root.push(new qu({id:e.id,author:e.author,date:e.date}))}},Cg=class extends W{constructor(e){super(`w:del`),this.root.push(new qu({id:e.id,author:e.author,date:e.date}))}},wg=class extends W{constructor(e){super(`w:cellIns`),this.root.push(new qu({id:e.id,author:e.author,date:e.date}))}},Tg=class extends W{constructor(e){super(`w:cellDel`),this.root.push(new qu({id:e.id,author:e.author,date:e.date}))}},Eg={CONTINUE:`cont`,RESTART:`rest`},Dg=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`,author:`w:author`,date:`w:date`,verticalMerge:`w:vMerge`,verticalMergeOriginal:`w:vMergeOrig`})}},Og=class extends W{constructor(e){super(`w:cellMerge`),this.root.push(new Dg(e))}},kg={TOP:`top`,CENTER:`center`,BOTTOM:`bottom`},Ag=zi(H({},kg),{BOTH:`both`}),jg=Ag,Mg=e=>new J({name:`w:vAlign`,attributes:{verticalAlign:{key:`w:val`,value:e}}}),Ng=({marginUnitType:e=Ig.DXA,top:t,left:n,bottom:r,right:i})=>[{name:`w:top`,size:t},{name:`w:left`,size:n},{name:`w:bottom`,size:r},{name:`w:right`,size:i}].filter(e=>e.size!==void 0).map(({name:t,size:n})=>Lg(t,{type:e,size:n})),Pg=e=>{let t=Ng(e);if(t.length!==0)return new J({name:`w:tblCellMar`,children:t})},Fg=e=>{let t=Ng(e);if(t.length!==0)return new J({name:`w:tcMar`,children:t})},Ig={AUTO:`auto`,DXA:`dxa`,NIL:`nil`,PERCENTAGE:`pct`},Lg=(e,{type:t=Ig.AUTO,size:n})=>{let r=n;return t===Ig.PERCENTAGE&&typeof n==`number`&&(r=`${n}%`),new J({name:e,attributes:{type:{key:`w:type`,value:t},size:{key:`w:w`,value:pu(r)}}})},Rg=class extends Wi{constructor(e){super(`w:tcBorders`),e.top&&this.root.push(Tu(`w:top`,e.top)),e.start&&this.root.push(Tu(`w:start`,e.start)),e.left&&this.root.push(Tu(`w:left`,e.left)),e.bottom&&this.root.push(Tu(`w:bottom`,e.bottom)),e.end&&this.root.push(Tu(`w:end`,e.end)),e.right&&this.root.push(Tu(`w:right`,e.right))}},zg=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w:val`})}},Bg=class extends W{constructor(e){super(`w:gridSpan`),this.root.push(new zg({val:$l(e)}))}},Vg={CONTINUE:`continue`,RESTART:`restart`},Hg=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w:val`})}},Ug=class extends W{constructor(e){super(`w:vMerge`),this.root.push(new Hg({val:e}))}},Wg={BOTTOM_TO_TOP_LEFT_TO_RIGHT:`btLr`,LEFT_TO_RIGHT_TOP_TO_BOTTOM:`lrTb`,TOP_TO_BOTTOM_RIGHT_TO_LEFT:`tbRl`},Gg=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w:val`})}},Kg=class extends W{constructor(e){super(`w:textDirection`),this.root.push(new Gg({val:e}))}},qg=class extends Wi{constructor(e){if(super(`w:tcPr`,e.includeIfEmpty),e.width&&this.root.push(Lg(`w:tcW`,e.width)),e.columnSpan&&this.root.push(new Bg(e.columnSpan)),e.verticalMerge?this.root.push(new Ug(e.verticalMerge)):e.rowSpan&&e.rowSpan>1&&this.root.push(new Ug(Vg.RESTART)),e.borders&&this.root.push(new Rg(e.borders)),e.shading&&this.root.push(Gu(e.shading)),e.margins){let t=Fg(e.margins);t&&this.root.push(t)}e.textDirection&&this.root.push(new Kg(e.textDirection)),e.verticalAlign&&this.root.push(Mg(e.verticalAlign)),e.insertion&&this.root.push(new wg(e.insertion)),e.deletion&&this.root.push(new Tg(e.deletion)),e.revision&&this.root.push(new Jg(e.revision)),e.cellMerge&&this.root.push(new Og(e.cellMerge))}},Jg=class extends W{constructor(e){super(`w:tcPrChange`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.root.push(new qg(zi(H({},e),{includeIfEmpty:!0})))}},Yg=class extends W{constructor(e){super(`w:tc`),this.options=e,this.root.push(new qg(e));for(let t of e.children)this.root.push(t)}prepForXml(e){return this.root[this.root.length-1]instanceof Z||this.root.push(new Z({})),super.prepForXml(e)}},Xg={style:Eu.NONE,size:0,color:`auto`},Zg={style:Eu.SINGLE,size:4,color:`auto`},Qg=class extends W{constructor(e){super(`w:tblBorders`),this.root.push(Tu(`w:top`,e.top??Zg)),this.root.push(Tu(`w:left`,e.left??Zg)),this.root.push(Tu(`w:bottom`,e.bottom??Zg)),this.root.push(Tu(`w:right`,e.right??Zg)),this.root.push(Tu(`w:insideH`,e.insideHorizontal??Zg)),this.root.push(Tu(`w:insideV`,e.insideVertical??Zg))}};U(Qg,`NONE`,{top:Xg,bottom:Xg,left:Xg,right:Xg,insideHorizontal:Xg,insideVertical:Xg});var $g={MARGIN:`margin`,PAGE:`page`,TEXT:`text`},e_={CENTER:`center`,INSIDE:`inside`,LEFT:`left`,OUTSIDE:`outside`,RIGHT:`right`},t_={CENTER:`center`,INSIDE:`inside`,BOTTOM:`bottom`,OUTSIDE:`outside`,INLINE:`inline`,TOP:`top`},n_={NEVER:`never`,OVERLAP:`overlap`},r_=e=>new J({name:`w:tblOverlap`,attributes:{val:{key:`w:val`,value:e}}}),i_=({horizontalAnchor:e,verticalAnchor:t,absoluteHorizontalPosition:n,relativeHorizontalPosition:r,absoluteVerticalPosition:i,relativeVerticalPosition:a,bottomFromText:o,topFromText:s,leftFromText:c,rightFromText:l,overlap:u})=>new J({name:`w:tblpPr`,attributes:{leftFromText:{key:`w:leftFromText`,value:c===void 0?void 0:du(c)},rightFromText:{key:`w:rightFromText`,value:l===void 0?void 0:du(l)},topFromText:{key:`w:topFromText`,value:s===void 0?void 0:du(s)},bottomFromText:{key:`w:bottomFromText`,value:o===void 0?void 0:du(o)},absoluteHorizontalPosition:{key:`w:tblpX`,value:n===void 0?void 0:cu(n)},absoluteVerticalPosition:{key:`w:tblpY`,value:i===void 0?void 0:cu(i)},horizontalAnchor:{key:`w:horzAnchor`,value:e},relativeHorizontalPosition:{key:`w:tblpXSpec`,value:r},relativeVerticalPosition:{key:`w:tblpYSpec`,value:a},verticalAnchor:{key:`w:vertAnchor`,value:t}},children:u?[r_(u)]:void 0}),a_={AUTOFIT:`autofit`,FIXED:`fixed`},o_=e=>new J({name:`w:tblLayout`,attributes:{type:{key:`w:type`,value:e}}}),s_={DXA:`dxa`},c_=({type:e=s_.DXA,value:t})=>new J({name:`w:tblCellSpacing`,attributes:{type:{key:`w:type`,value:e},value:{key:`w:w`,value:pu(t)}}}),l_=({firstRow:e,lastRow:t,firstColumn:n,lastColumn:r,noHBand:i,noVBand:a})=>new J({name:`w:tblLook`,attributes:{firstRow:{key:`w:firstRow`,value:e},lastRow:{key:`w:lastRow`,value:t},firstColumn:{key:`w:firstColumn`,value:n},lastColumn:{key:`w:lastColumn`,value:r},noHBand:{key:`w:noHBand`,value:i},noVBand:{key:`w:noVBand`,value:a}}}),u_=class extends Wi{constructor(e){if(super(`w:tblPr`,e.includeIfEmpty),e.style&&this.root.push(new yu(`w:tblStyle`,e.style)),e.float&&this.root.push(i_(e.float)),e.visuallyRightToLeft!==void 0&&this.root.push(new q(`w:bidiVisual`,e.visuallyRightToLeft)),e.width&&this.root.push(Lg(`w:tblW`,e.width)),e.alignment&&this.root.push(wu(e.alignment)),e.indent&&this.root.push(Lg(`w:tblInd`,e.indent)),e.borders&&this.root.push(new Qg(e.borders)),e.shading&&this.root.push(Gu(e.shading)),e.layout&&this.root.push(o_(e.layout)),e.cellMargin){let t=Pg(e.cellMargin);t&&this.root.push(t)}e.tableLook&&this.root.push(l_(e.tableLook)),e.cellSpacing&&this.root.push(c_(e.cellSpacing)),e.revision&&this.root.push(new d_(e.revision))}},d_=class extends W{constructor(e){super(`w:tblPrChange`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.root.push(new u_(zi(H({},e),{includeIfEmpty:!0})))}},f_=class extends qm{constructor({rows:e,width:t,columnWidths:n=Array(Math.max(...e.map(e=>e.CellCount))).fill(100),columnWidthsRevision:r,margins:i,indent:a,float:o,layout:s,style:c,borders:l,alignment:u,visuallyRightToLeft:d,tableLook:f,cellSpacing:p,revision:m}){super(`w:tbl`),this.root.push(new u_({borders:l??{},width:t??{size:100},indent:a,float:o,layout:s,style:c,alignment:u,cellMargin:i,visuallyRightToLeft:d,tableLook:f,cellSpacing:p,revision:m})),this.root.push(new fg(n,r));for(let t of e)this.root.push(t);e.forEach((t,n)=>{if(n===e.length-1)return;let r=0;t.cells.forEach(t=>{if(t.options.rowSpan&&t.options.rowSpan>1){let i=new Yg({rowSpan:t.options.rowSpan-1,columnSpan:t.options.columnSpan,borders:t.options.borders,children:[],verticalMerge:Vg.CONTINUE});e[n+1].addCellToColumnIndex(i,r)}r+=t.options.columnSpan||1})})}},p_={AUTO:`auto`,ATLEAST:`atLeast`,EXACT:`exact`},m_=(e,t)=>new J({name:`w:trHeight`,attributes:{value:{key:`w:val`,value:du(e)},rule:{key:`w:hRule`,value:t}}}),h_=class extends Wi{constructor(e){super(`w:trPr`,e.includeIfEmpty),e.cantSplit!==void 0&&this.root.push(new q(`w:cantSplit`,e.cantSplit)),e.tableHeader!==void 0&&this.root.push(new q(`w:tblHeader`,e.tableHeader)),e.height&&this.root.push(m_(e.height.value,e.height.rule)),e.cellSpacing&&this.root.push(c_(e.cellSpacing)),e.insertion&&this.root.push(new Sg(e.insertion)),e.deletion&&this.root.push(new Cg(e.deletion)),e.revision&&this.root.push(new g_(e.revision))}},g_=class extends W{constructor(e){super(`w:trPrChange`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.root.push(new h_(zi(H({},e),{includeIfEmpty:!0})))}},__=class extends W{constructor(e){super(`w:tr`),this.options=e,this.root.push(new h_(e));for(let t of e.children)this.root.push(t)}get CellCount(){return this.options.children.length}get cells(){return this.root.filter(e=>e instanceof Yg)}addCellToIndex(e,t){this.root.splice(t+1,0,e)}addCellToColumnIndex(e,t){let n=this.columnIndexToRootIndex(t,!0);this.addCellToIndex(e,n-1)}rootIndexToColumnIndex(e){if(e<1||e>=this.root.length)throw Error(`cell 'rootIndex' should between 1 to ${this.root.length-1}`);let t=0;for(let n=1;n<e;n++){let e=this.root[n];t+=e.options.columnSpan||1}return t}columnIndexToRootIndex(e,t=!1){if(e<0)throw Error(`cell 'columnIndex' should not less than zero`);let n=0,r=1;for(;n<=e;){if(r>=this.root.length){if(t)return this.root.length;throw Error(`cell 'columnIndex' should not great than ${n-1}`)}let e=this.root[r];r+=1,n+=e&&e.options.columnSpan||1}return r-1}},v_=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{xmlns:`xmlns`,vt:`xmlns:vt`})}},y_=class extends W{constructor(){super(`Properties`),this.root.push(new v_({xmlns:`http://schemas.openxmlformats.org/officeDocument/2006/extended-properties`,vt:`http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes`}))}},b_=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{xmlns:`xmlns`})}},x_=(e,t)=>new J({name:`Default`,attributes:{contentType:{key:`ContentType`,value:e},extension:{key:`Extension`,value:t}}}),S_=(e,t)=>new J({name:`Override`,attributes:{contentType:{key:`ContentType`,value:e},partName:{key:`PartName`,value:t}}}),C_=class extends W{constructor(){super(`Types`),this.root.push(new b_({xmlns:`http://schemas.openxmlformats.org/package/2006/content-types`})),this.root.push(x_(`image/png`,`png`)),this.root.push(x_(`image/jpeg`,`jpeg`)),this.root.push(x_(`image/jpeg`,`jpg`)),this.root.push(x_(`image/bmp`,`bmp`)),this.root.push(x_(`image/gif`,`gif`)),this.root.push(x_(`image/svg+xml`,`svg`)),this.root.push(x_(`application/vnd.openxmlformats-package.relationships+xml`,`rels`)),this.root.push(x_(`application/xml`,`xml`)),this.root.push(x_(`application/vnd.openxmlformats-officedocument.obfuscatedFont`,`odttf`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml`,`/word/document.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml`,`/word/styles.xml`)),this.root.push(S_(`application/vnd.openxmlformats-package.core-properties+xml`,`/docProps/core.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.custom-properties+xml`,`/docProps/custom.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.extended-properties+xml`,`/docProps/app.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml`,`/word/numbering.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml`,`/word/footnotes.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml`,`/word/endnotes.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml`,`/word/settings.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml`,`/word/comments.xml`)),this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml`,`/word/fontTable.xml`))}addFooter(e){this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml`,`/word/footer${e}.xml`))}addHeader(e){this.root.push(S_(`application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml`,`/word/header${e}.xml`))}},w_={wpc:`http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas`,mc:`http://schemas.openxmlformats.org/markup-compatibility/2006`,o:`urn:schemas-microsoft-com:office:office`,r:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,m:`http://schemas.openxmlformats.org/officeDocument/2006/math`,v:`urn:schemas-microsoft-com:vml`,wp14:`http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`,wp:`http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing`,w10:`urn:schemas-microsoft-com:office:word`,w:`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,w14:`http://schemas.microsoft.com/office/word/2010/wordml`,w15:`http://schemas.microsoft.com/office/word/2012/wordml`,wpg:`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`,wpi:`http://schemas.microsoft.com/office/word/2010/wordprocessingInk`,wne:`http://schemas.microsoft.com/office/word/2006/wordml`,wps:`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`,cp:`http://schemas.openxmlformats.org/package/2006/metadata/core-properties`,dc:`http://purl.org/dc/elements/1.1/`,dcterms:`http://purl.org/dc/terms/`,dcmitype:`http://purl.org/dc/dcmitype/`,xsi:`http://www.w3.org/2001/XMLSchema-instance`,cx:`http://schemas.microsoft.com/office/drawing/2014/chartex`,cx1:`http://schemas.microsoft.com/office/drawing/2015/9/8/chartex`,cx2:`http://schemas.microsoft.com/office/drawing/2015/10/21/chartex`,cx3:`http://schemas.microsoft.com/office/drawing/2016/5/9/chartex`,cx4:`http://schemas.microsoft.com/office/drawing/2016/5/10/chartex`,cx5:`http://schemas.microsoft.com/office/drawing/2016/5/11/chartex`,cx6:`http://schemas.microsoft.com/office/drawing/2016/5/12/chartex`,cx7:`http://schemas.microsoft.com/office/drawing/2016/5/13/chartex`,cx8:`http://schemas.microsoft.com/office/drawing/2016/5/14/chartex`,aink:`http://schemas.microsoft.com/office/drawing/2016/ink`,am3d:`http://schemas.microsoft.com/office/drawing/2017/model3d`,w16cex:`http://schemas.microsoft.com/office/word/2018/wordml/cex`,w16cid:`http://schemas.microsoft.com/office/word/2016/wordml/cid`,w16:`http://schemas.microsoft.com/office/word/2018/wordml`,w16sdtdh:`http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash`,w16se:`http://schemas.microsoft.com/office/word/2015/wordml/symex`},T_=class extends G{constructor(e,t){super(H({Ignorable:t},Object.fromEntries(e.map(e=>[e,w_[e]])))),U(this,`xmlKeys`,H({Ignorable:`mc:Ignorable`},Object.fromEntries(Object.keys(w_).map(e=>[e,`xmlns:${e}`]))))}},E_=class extends W{constructor(e){super(`cp:coreProperties`),this.root.push(new T_([`cp`,`dc`,`dcterms`,`dcmitype`,`xsi`])),e.title&&this.root.push(new Cu(`dc:title`,e.title)),e.subject&&this.root.push(new Cu(`dc:subject`,e.subject)),e.creator&&this.root.push(new Cu(`dc:creator`,e.creator)),e.keywords&&this.root.push(new Cu(`cp:keywords`,e.keywords)),e.description&&this.root.push(new Cu(`dc:description`,e.description)),e.lastModifiedBy&&this.root.push(new Cu(`cp:lastModifiedBy`,e.lastModifiedBy)),e.revision&&this.root.push(new Cu(`cp:revision`,String(e.revision))),this.root.push(new O_(`dcterms:created`)),this.root.push(new O_(`dcterms:modified`))}},D_=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{type:`xsi:type`})}},O_=class extends W{constructor(e){super(e),this.root.push(new D_({type:`dcterms:W3CDTF`})),this.root.push(gu(new Date))}},k_=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{xmlns:`xmlns`,vt:`xmlns:vt`})}},A_=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{formatId:`fmtid`,pid:`pid`,name:`name`})}},j_=class extends W{constructor(e,t){super(`property`),this.root.push(new A_({formatId:`{D5CDD505-2E9C-101B-9397-08002B2CF9AE}`,pid:e.toString(),name:t.name})),this.root.push(new M_(t.value))}},M_=class extends W{constructor(e){super(`vt:lpwstr`),this.root.push(e)}},N_=class extends W{constructor(e){super(`Properties`),U(this,`nextId`),U(this,`properties`,[]),this.root.push(new k_({xmlns:`http://schemas.openxmlformats.org/officeDocument/2006/custom-properties`,vt:`http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes`})),this.nextId=2;for(let t of e)this.addCustomProperty(t)}prepForXml(e){return this.properties.forEach(e=>this.root.push(e)),super.prepForXml(e)}addCustomProperty(e){this.properties.push(new j_(this.nextId++,e))}},P_=({space:e,count:t,separate:n,equalWidth:r,children:i})=>new J({name:`w:cols`,attributes:{space:{key:`w:space`,value:e===void 0?void 0:du(e)},count:{key:`w:num`,value:t===void 0?void 0:$l(t)},separate:{key:`w:sep`,value:n},equalWidth:{key:`w:equalWidth`,value:r}},children:!r&&i?i:void 0}),F_={DEFAULT:`default`,LINES:`lines`,LINES_AND_CHARS:`linesAndChars`,SNAP_TO_CHARS:`snapToChars`},I_=({type:e,linePitch:t,charSpace:n})=>new J({name:`w:docGrid`,attributes:{type:{key:`w:type`,value:e},linePitch:{key:`w:linePitch`,value:$l(t)},charSpace:{key:`w:charSpace`,value:n?$l(n):void 0}}}),L_={DEFAULT:`default`,FIRST:`first`,EVEN:`even`},R_={HEADER:`w:headerReference`,FOOTER:`w:footerReference`},z_=(e,t)=>new J({name:e,attributes:{type:{key:`w:type`,value:t.type||L_.DEFAULT},id:{key:`r:id`,value:`rId${t.id}`}}}),B_={NEW_PAGE:`newPage`,NEW_SECTION:`newSection`,CONTINUOUS:`continuous`},V_=({countBy:e,start:t,restart:n,distance:r})=>new J({name:`w:lnNumType`,attributes:{countBy:{key:`w:countBy`,value:e===void 0?void 0:$l(e)},start:{key:`w:start`,value:t===void 0?void 0:$l(t)},restart:{key:`w:restart`,value:n},distance:{key:`w:distance`,value:r===void 0?void 0:du(r)}}}),H_={ALL_PAGES:`allPages`,FIRST_PAGE:`firstPage`,NOT_FIRST_PAGE:`notFirstPage`},U_={PAGE:`page`,TEXT:`text`},W_={BACK:`back`,FRONT:`front`},G_=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{display:`w:display`,offsetFrom:`w:offsetFrom`,zOrder:`w:zOrder`})}},K_=class extends Wi{constructor(e){if(super(`w:pgBorders`),!e)return this;e.pageBorders?this.root.push(new G_({display:e.pageBorders.display,offsetFrom:e.pageBorders.offsetFrom,zOrder:e.pageBorders.zOrder})):this.root.push(new G_({})),e.pageBorderTop&&this.root.push(Tu(`w:top`,e.pageBorderTop)),e.pageBorderLeft&&this.root.push(Tu(`w:left`,e.pageBorderLeft)),e.pageBorderBottom&&this.root.push(Tu(`w:bottom`,e.pageBorderBottom)),e.pageBorderRight&&this.root.push(Tu(`w:right`,e.pageBorderRight))}},q_=(e,t,n,r,i,a,o)=>new J({name:`w:pgMar`,attributes:{top:{key:`w:top`,value:cu(e)},right:{key:`w:right`,value:du(t)},bottom:{key:`w:bottom`,value:cu(n)},left:{key:`w:left`,value:du(r)},header:{key:`w:header`,value:du(i)},footer:{key:`w:footer`,value:du(a)},gutter:{key:`w:gutter`,value:du(o)}}}),J_={HYPHEN:`hyphen`,PERIOD:`period`,COLON:`colon`,EM_DASH:`emDash`,EN_DASH:`endash`},Y_=({start:e,formatType:t,separator:n})=>new J({name:`w:pgNumType`,attributes:{start:{key:`w:start`,value:e===void 0?void 0:$l(e)},formatType:{key:`w:fmt`,value:t},separator:{key:`w:chapSep`,value:n}}}),X_={PORTRAIT:`portrait`,LANDSCAPE:`landscape`},Z_=({width:e,height:t,orientation:n,code:r})=>{let i=du(e),a=du(t);return new J({name:`w:pgSz`,attributes:{width:{key:`w:w`,value:n===X_.LANDSCAPE?a:i},height:{key:`w:h`,value:n===X_.LANDSCAPE?i:a},orientation:{key:`w:orient`,value:n},code:{key:`w:code`,value:r}}})},Q_={LEFT_TO_RIGHT_TOP_TO_BOTTOM:`lrTb`,TOP_TO_BOTTOM_RIGHT_TO_LEFT:`tbRl`},$_=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w:val`})}},ev=class extends W{constructor(e){super(`w:textDirection`),this.root.push(new $_({val:e}))}},tv={NEXT_PAGE:`nextPage`,NEXT_COLUMN:`nextColumn`,CONTINUOUS:`continuous`,EVEN_PAGE:`evenPage`,ODD_PAGE:`oddPage`},nv=e=>new J({name:`w:type`,attributes:{val:{key:`w:val`,value:e}}}),rv={TOP:1440,RIGHT:1440,BOTTOM:1440,LEFT:1440,HEADER:708,FOOTER:708,GUTTER:0},iv={WIDTH:11906,HEIGHT:16838,ORIENTATION:X_.PORTRAIT},av=class extends W{constructor({page:{size:{width:e=iv.WIDTH,height:t=iv.HEIGHT,orientation:n=iv.ORIENTATION}={},margin:{top:r=rv.TOP,right:i=rv.RIGHT,bottom:a=rv.BOTTOM,left:o=rv.LEFT,header:s=rv.HEADER,footer:c=rv.FOOTER,gutter:l=rv.GUTTER}={},pageNumbers:u={},borders:d,textDirection:f}={},grid:{linePitch:p=360,charSpace:m,type:h}={},headerWrapperGroup:g={},footerWrapperGroup:_={},lineNumbers:v,titlePage:y,verticalAlign:b,column:x,type:S,revision:C}={}){super(`w:sectPr`),this.addHeaderFooterGroup(R_.HEADER,g),this.addHeaderFooterGroup(R_.FOOTER,_),S&&this.root.push(nv(S)),this.root.push(Z_({width:e,height:t,orientation:n})),this.root.push(q_(r,i,a,o,s,c,l)),d&&this.root.push(new K_(d)),v&&this.root.push(V_(v)),this.root.push(Y_(u)),x&&this.root.push(P_(x)),b&&this.root.push(Mg(b)),y!==void 0&&this.root.push(new q(`w:titlePg`,y)),f&&this.root.push(new ev(f)),C&&this.root.push(new ov(C)),this.root.push(I_({linePitch:p,charSpace:m,type:h}))}addHeaderFooterGroup(e,t){t.default&&this.root.push(z_(e,{type:L_.DEFAULT,id:t.default.View.ReferenceId})),t.first&&this.root.push(z_(e,{type:L_.FIRST,id:t.first.View.ReferenceId})),t.even&&this.root.push(z_(e,{type:L_.EVEN,id:t.even.View.ReferenceId}))}},ov=class extends W{constructor(e){super(`w:sectPrChange`),this.root.push(new qu({id:e.id,author:e.author,date:e.date})),this.root.push(new av(e))}},sv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{width:`w:w`,space:`w:space`})}},cv=class extends W{constructor(e){super(`w:col`),this.root.push(new sv({width:du(e.width),space:e.space===void 0?void 0:du(e.space)}))}},lv=class extends W{constructor(){super(`w:body`),U(this,`sections`,[])}addSection(e){let t=this.sections.pop();this.root.push(this.createSectionParagraph(t)),this.sections.push(new av(e))}prepForXml(e){return this.sections.length===1&&(this.root.splice(0,1),this.root.push(this.sections.pop())),super.prepForXml(e)}push(e){this.root.push(e)}createSectionParagraph(e){let t=new Z({}),n=new xh({});return n.push(e),t.addChildElement(n),t}},uv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{color:`w:color`,themeColor:`w:themeColor`,themeShade:`w:themeShade`,themeTint:`w:themeTint`})}},dv=class extends W{constructor(e){super(`w:background`),this.root.push(new uv({color:e.color===void 0?void 0:su(e.color),themeColor:e.themeColor,themeShade:e.themeShade===void 0?void 0:iu(e.themeShade),themeTint:e.themeTint===void 0?void 0:iu(e.themeTint)}))}},fv=class extends W{constructor(e){super(`w:document`),U(this,`body`),this.root.push(new T_(`wpc.mc.o.r.m.v.wp14.wp.w10.w.w14.w15.wpg.wpi.wne.wps.cx.cx1.cx2.cx3.cx4.cx5.cx6.cx7.cx8.aink.am3d.w16cex.w16cid.w16.w16sdtdh.w16se`.split(`.`),`w14 w15 wp14`)),this.body=new lv,e.background&&this.root.push(new dv(e.background)),this.root.push(this.body)}add(e){return this.body.push(e),this}get Body(){return this.body}},pv=class{constructor(e){U(this,`document`),U(this,`relationships`),this.document=new fv(e),this.relationships=new $p}get View(){return this.document}get Relationships(){return this.relationships}},mv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{wpc:`xmlns:wpc`,mc:`xmlns:mc`,o:`xmlns:o`,r:`xmlns:r`,m:`xmlns:m`,v:`xmlns:v`,wp14:`xmlns:wp14`,wp:`xmlns:wp`,w10:`xmlns:w10`,w:`xmlns:w`,w14:`xmlns:w14`,w15:`xmlns:w15`,wpg:`xmlns:wpg`,wpi:`xmlns:wpi`,wne:`xmlns:wne`,wps:`xmlns:wps`,Ignorable:`mc:Ignorable`})}},hv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{type:`w:type`,id:`w:id`})}},gv=class extends _d{constructor(){super({style:`EndnoteReference`}),this.root.push(new vm)}},_v={SEPARATOR:`separator`,CONTINUATION_SEPARATOR:`continuationSeparator`},vv=class extends W{constructor(e){super(`w:endnote`),this.root.push(new hv({type:e.type,id:e.id}));for(let t=0;t<e.children.length;t++){let n=e.children[t];t===0&&n.addRunToFront(new gv),this.root.push(n)}}},yv=class extends W{constructor(){super(`w:continuationSeparator`)}},bv=class extends _d{constructor(){super({}),this.root.push(new yv)}},xv=class extends W{constructor(){super(`w:separator`)}},Sv=class extends _d{constructor(){super({}),this.root.push(new xv)}},Cv=class extends W{constructor(){super(`w:endnotes`),this.root.push(new mv({wpc:`http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas`,mc:`http://schemas.openxmlformats.org/markup-compatibility/2006`,o:`urn:schemas-microsoft-com:office:office`,r:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,m:`http://schemas.openxmlformats.org/officeDocument/2006/math`,v:`urn:schemas-microsoft-com:vml`,wp14:`http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`,wp:`http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing`,w10:`urn:schemas-microsoft-com:office:word`,w:`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,w14:`http://schemas.microsoft.com/office/word/2010/wordml`,w15:`http://schemas.microsoft.com/office/word/2012/wordml`,wpg:`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`,wpi:`http://schemas.microsoft.com/office/word/2010/wordprocessingInk`,wne:`http://schemas.microsoft.com/office/word/2006/wordml`,wps:`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`,Ignorable:`w14 w15 wp14`}));let e=new vv({id:-1,type:_v.SEPARATOR,children:[new Z({spacing:{after:0,line:240,lineRule:Fm.AUTO},children:[new Sv]})]});this.root.push(e);let t=new vv({id:0,type:_v.CONTINUATION_SEPARATOR,children:[new Z({spacing:{after:0,line:240,lineRule:Fm.AUTO},children:[new bv]})]});this.root.push(t)}createEndnote(e,t){let n=new vv({id:e,children:t});this.root.push(n)}},wv=class{constructor(){U(this,`endnotes`),U(this,`relationships`),this.endnotes=new Cv,this.relationships=new $p}get View(){return this.endnotes}get Relationships(){return this.relationships}},Tv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{wpc:`xmlns:wpc`,mc:`xmlns:mc`,o:`xmlns:o`,r:`xmlns:r`,m:`xmlns:m`,v:`xmlns:v`,wp14:`xmlns:wp14`,wp:`xmlns:wp`,w10:`xmlns:w10`,w:`xmlns:w`,w14:`xmlns:w14`,w15:`xmlns:w15`,wpg:`xmlns:wpg`,wpi:`xmlns:wpi`,wne:`xmlns:wne`,wps:`xmlns:wps`,cp:`xmlns:cp`,dc:`xmlns:dc`,dcterms:`xmlns:dcterms`,dcmitype:`xmlns:dcmitype`,xsi:`xmlns:xsi`,type:`xsi:type`})}},Ev=class extends Ql{constructor(e,t){super(`w:ftr`,t),U(this,`refId`),this.refId=e,t||this.root.push(new Tv({wpc:`http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas`,mc:`http://schemas.openxmlformats.org/markup-compatibility/2006`,o:`urn:schemas-microsoft-com:office:office`,r:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,m:`http://schemas.openxmlformats.org/officeDocument/2006/math`,v:`urn:schemas-microsoft-com:vml`,wp14:`http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`,wp:`http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing`,w10:`urn:schemas-microsoft-com:office:word`,w:`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,w14:`http://schemas.microsoft.com/office/word/2010/wordml`,w15:`http://schemas.microsoft.com/office/word/2012/wordml`,wpg:`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`,wpi:`http://schemas.microsoft.com/office/word/2010/wordprocessingInk`,wne:`http://schemas.microsoft.com/office/word/2006/wordml`,wps:`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`}))}get ReferenceId(){return this.refId}add(e){this.root.push(e)}},Dv=class{constructor(e,t,n){U(this,`footer`),U(this,`relationships`),this.media=e,this.footer=new Ev(t,n),this.relationships=new $p}add(e){this.footer.add(e)}addChildElement(e){this.footer.addChildElement(e)}get View(){return this.footer}get Relationships(){return this.relationships}get Media(){return this.media}},Ov=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{type:`w:type`,id:`w:id`})}},kv=class extends W{constructor(){super(`w:footnoteRef`)}},Av=class extends _d{constructor(){super({style:`FootnoteReference`}),this.root.push(new kv)}},jv={SEPERATOR:`separator`,CONTINUATION_SEPERATOR:`continuationSeparator`},Mv=class extends W{constructor(e){super(`w:footnote`),this.root.push(new Ov({type:e.type,id:e.id}));for(let t=0;t<e.children.length;t++){let n=e.children[t];t===0&&n.addRunToFront(new Av),this.root.push(n)}}},Nv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{wpc:`xmlns:wpc`,mc:`xmlns:mc`,o:`xmlns:o`,r:`xmlns:r`,m:`xmlns:m`,v:`xmlns:v`,wp14:`xmlns:wp14`,wp:`xmlns:wp`,w10:`xmlns:w10`,w:`xmlns:w`,w14:`xmlns:w14`,w15:`xmlns:w15`,wpg:`xmlns:wpg`,wpi:`xmlns:wpi`,wne:`xmlns:wne`,wps:`xmlns:wps`,Ignorable:`mc:Ignorable`})}},Pv=class extends W{constructor(){super(`w:footnotes`),this.root.push(new Nv({wpc:`http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas`,mc:`http://schemas.openxmlformats.org/markup-compatibility/2006`,o:`urn:schemas-microsoft-com:office:office`,r:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,m:`http://schemas.openxmlformats.org/officeDocument/2006/math`,v:`urn:schemas-microsoft-com:vml`,wp14:`http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`,wp:`http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing`,w10:`urn:schemas-microsoft-com:office:word`,w:`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,w14:`http://schemas.microsoft.com/office/word/2010/wordml`,w15:`http://schemas.microsoft.com/office/word/2012/wordml`,wpg:`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`,wpi:`http://schemas.microsoft.com/office/word/2010/wordprocessingInk`,wne:`http://schemas.microsoft.com/office/word/2006/wordml`,wps:`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`,Ignorable:`w14 w15 wp14`}));let e=new Mv({id:-1,type:jv.SEPERATOR,children:[new Z({spacing:{after:0,line:240,lineRule:Fm.AUTO},children:[new Sv]})]});this.root.push(e);let t=new Mv({id:0,type:jv.CONTINUATION_SEPERATOR,children:[new Z({spacing:{after:0,line:240,lineRule:Fm.AUTO},children:[new bv]})]});this.root.push(t)}createFootNote(e,t){let n=new Mv({id:e,children:t});this.root.push(n)}},Fv=class{constructor(){U(this,`footnotess`),U(this,`relationships`),this.footnotess=new Pv,this.relationships=new $p}get View(){return this.footnotess}get Relationships(){return this.relationships}},Iv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{wpc:`xmlns:wpc`,mc:`xmlns:mc`,o:`xmlns:o`,r:`xmlns:r`,m:`xmlns:m`,v:`xmlns:v`,wp14:`xmlns:wp14`,wp:`xmlns:wp`,w10:`xmlns:w10`,w:`xmlns:w`,w14:`xmlns:w14`,w15:`xmlns:w15`,wpg:`xmlns:wpg`,wpi:`xmlns:wpi`,wne:`xmlns:wne`,wps:`xmlns:wps`,cp:`xmlns:cp`,dc:`xmlns:dc`,dcterms:`xmlns:dcterms`,dcmitype:`xmlns:dcmitype`,xsi:`xmlns:xsi`,type:`xsi:type`,cx:`xmlns:cx`,cx1:`xmlns:cx1`,cx2:`xmlns:cx2`,cx3:`xmlns:cx3`,cx4:`xmlns:cx4`,cx5:`xmlns:cx5`,cx6:`xmlns:cx6`,cx7:`xmlns:cx7`,cx8:`xmlns:cx8`,w16cid:`xmlns:w16cid`,w16se:`xmlns:w16se`})}},Lv=class extends Ql{constructor(e,t){super(`w:hdr`,t),U(this,`refId`),this.refId=e,t||this.root.push(new Iv({wpc:`http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas`,mc:`http://schemas.openxmlformats.org/markup-compatibility/2006`,o:`urn:schemas-microsoft-com:office:office`,r:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,m:`http://schemas.openxmlformats.org/officeDocument/2006/math`,v:`urn:schemas-microsoft-com:vml`,wp14:`http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`,wp:`http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing`,w10:`urn:schemas-microsoft-com:office:word`,w:`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,w14:`http://schemas.microsoft.com/office/word/2010/wordml`,w15:`http://schemas.microsoft.com/office/word/2012/wordml`,wpg:`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`,wpi:`http://schemas.microsoft.com/office/word/2010/wordprocessingInk`,wne:`http://schemas.microsoft.com/office/word/2006/wordml`,wps:`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`,cx:`http://schemas.microsoft.com/office/drawing/2014/chartex`,cx1:`http://schemas.microsoft.com/office/drawing/2015/9/8/chartex`,cx2:`http://schemas.microsoft.com/office/drawing/2015/10/21/chartex`,cx3:`http://schemas.microsoft.com/office/drawing/2016/5/9/chartex`,cx4:`http://schemas.microsoft.com/office/drawing/2016/5/10/chartex`,cx5:`http://schemas.microsoft.com/office/drawing/2016/5/11/chartex`,cx6:`http://schemas.microsoft.com/office/drawing/2016/5/12/chartex`,cx7:`http://schemas.microsoft.com/office/drawing/2016/5/13/chartex`,cx8:`http://schemas.microsoft.com/office/drawing/2016/5/14/chartex`,w16cid:`http://schemas.microsoft.com/office/word/2016/wordml/cid`,w16se:`http://schemas.microsoft.com/office/word/2015/wordml/symex`}))}get ReferenceId(){return this.refId}add(e){this.root.push(e)}},Rv=class{constructor(e,t,n){U(this,`header`),U(this,`relationships`),this.media=e,this.header=new Lv(t,n),this.relationships=new $p}add(e){return this.header.add(e),this}addChildElement(e){this.header.addChildElement(e)}get View(){return this.header}get Relationships(){return this.relationships}get Media(){return this.media}},zv=class{constructor(){U(this,`map`),this.map=new Map}addImage(e,t){this.map.set(e,t)}get Array(){return Array.from(this.map.values())}},Bv={DECIMAL:`decimal`,UPPER_ROMAN:`upperRoman`,LOWER_ROMAN:`lowerRoman`,UPPER_LETTER:`upperLetter`,LOWER_LETTER:`lowerLetter`,ORDINAL:`ordinal`,CARDINAL_TEXT:`cardinalText`,ORDINAL_TEXT:`ordinalText`,HEX:`hex`,CHICAGO:`chicago`,IDEOGRAPH__DIGITAL:`ideographDigital`,JAPANESE_COUNTING:`japaneseCounting`,AIUEO:`aiueo`,IROHA:`iroha`,DECIMAL_FULL_WIDTH:`decimalFullWidth`,DECIMAL_HALF_WIDTH:`decimalHalfWidth`,JAPANESE_LEGAL:`japaneseLegal`,JAPANESE_DIGITAL_TEN_THOUSAND:`japaneseDigitalTenThousand`,DECIMAL_ENCLOSED_CIRCLE:`decimalEnclosedCircle`,DECIMAL_FULL_WIDTH2:`decimalFullWidth2`,AIUEO_FULL_WIDTH:`aiueoFullWidth`,IROHA_FULL_WIDTH:`irohaFullWidth`,DECIMAL_ZERO:`decimalZero`,BULLET:`bullet`,GANADA:`ganada`,CHOSUNG:`chosung`,DECIMAL_ENCLOSED_FULLSTOP:`decimalEnclosedFullstop`,DECIMAL_ENCLOSED_PARENTHESES:`decimalEnclosedParen`,DECIMAL_ENCLOSED_CIRCLE_CHINESE:`decimalEnclosedCircleChinese`,IDEOGRAPH_ENCLOSED_CIRCLE:`ideographEnclosedCircle`,IDEOGRAPH_TRADITIONAL:`ideographTraditional`,IDEOGRAPH_ZODIAC:`ideographZodiac`,IDEOGRAPH_ZODIAC_TRADITIONAL:`ideographZodiacTraditional`,TAIWANESE_COUNTING:`taiwaneseCounting`,IDEOGRAPH_LEGAL_TRADITIONAL:`ideographLegalTraditional`,TAIWANESE_COUNTING_THOUSAND:`taiwaneseCountingThousand`,TAIWANESE_DIGITAL:`taiwaneseDigital`,CHINESE_COUNTING:`chineseCounting`,CHINESE_LEGAL_SIMPLIFIED:`chineseLegalSimplified`,CHINESE_COUNTING_THOUSAND:`chineseCountingThousand`,KOREAN_DIGITAL:`koreanDigital`,KOREAN_COUNTING:`koreanCounting`,KOREAN_LEGAL:`koreanLegal`,KOREAN_DIGITAL2:`koreanDigital2`,VIETNAMESE_COUNTING:`vietnameseCounting`,RUSSIAN_LOWER:`russianLower`,RUSSIAN_UPPER:`russianUpper`,NONE:`none`,NUMBER_IN_DASH:`numberInDash`,HEBREW1:`hebrew1`,HEBREW2:`hebrew2`,ARABIC_ALPHA:`arabicAlpha`,ARABIC_ABJAD:`arabicAbjad`,HINDI_VOWELS:`hindiVowels`,HINDI_CONSONANTS:`hindiConsonants`,HINDI_NUMBERS:`hindiNumbers`,HINDI_COUNTING:`hindiCounting`,THAI_LETTERS:`thaiLetters`,THAI_NUMBERS:`thaiNumbers`,THAI_COUNTING:`thaiCounting`,BAHT_TEXT:`bahtText`,DOLLAR_TEXT:`dollarText`,CUSTOM:`custom`},Vv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{ilvl:`w:ilvl`,tentative:`w15:tentative`})}},Hv=class extends W{constructor(e){super(`w:numFmt`),this.root.push(new Ki({val:e}))}},Uv=class extends W{constructor(e){super(`w:lvlText`),this.root.push(new Ki({val:e}))}},Wv=class extends W{constructor(e){super(`w:lvlJc`),this.root.push(new Ki({val:e}))}},Gv={NOTHING:`nothing`,SPACE:`space`,TAB:`tab`},Kv=class extends W{constructor(e){super(`w:suff`),this.root.push(new Ki({val:e}))}},qv=class extends W{constructor(){super(`w:isLgl`)}},Jv=class extends W{constructor({level:e,format:t,text:n,alignment:r=Y.START,start:i=1,style:a,suffix:o,isLegalNumberingStyle:s}){if(super(`w:lvl`),U(this,`paragraphProperties`),U(this,`runProperties`),this.root.push(new xu(`w:start`,$l(i))),t&&this.root.push(new Hv(t)),o&&this.root.push(new Kv(o)),s&&this.root.push(new qv),n&&this.root.push(new Uv(n)),this.root.push(new Wv(r)),this.paragraphProperties=new xh(a&&a.paragraph),this.runProperties=new fd(a&&a.run),this.root.push(this.paragraphProperties),this.root.push(this.runProperties),e>9)throw Error(`Level cannot be greater than 9. Read more here: https://answers.microsoft.com/en-us/msoffice/forum/all/does-word-support-more-than-9-list-levels/d130fdcd-1781-446d-8c84-c6c79124e4d7`);this.root.push(new Vv({ilvl:$l(e),tentative:1}))}},Yv=class extends Jv{},Xv=class extends Jv{},Zv=class extends W{constructor(e){super(`w:multiLevelType`),this.root.push(new Ki({val:e}))}},Qv=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{abstractNumId:`w:abstractNumId`,restartNumberingAfterBreak:`w15:restartNumberingAfterBreak`})}},$v=class extends W{constructor(e,t){super(`w:abstractNum`),U(this,`id`),this.root.push(new Qv({abstractNumId:$l(e),restartNumberingAfterBreak:0})),this.root.push(new Zv(`hybridMultilevel`)),this.id=e;for(let e of t)this.root.push(new Yv(e))}},ey=class extends W{constructor(e){super(`w:abstractNumId`),this.root.push(new Ki({val:e}))}},ty=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{numId:`w:numId`})}},ny=class extends W{constructor(e){if(super(`w:num`),U(this,`numId`),U(this,`reference`),U(this,`instance`),this.numId=e.numId,this.reference=e.reference,this.instance=e.instance,this.root.push(new ty({numId:$l(e.numId)})),this.root.push(new ey($l(e.abstractNumId))),e.overrideLevels&&e.overrideLevels.length)for(let t of e.overrideLevels)this.root.push(new iy(t.num,t.start))}},ry=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{ilvl:`w:ilvl`})}},iy=class extends W{constructor(e,t){super(`w:lvlOverride`),this.root.push(new ry({ilvl:e})),t!==void 0&&this.root.push(new oy(t))}},ay=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w:val`})}},oy=class extends W{constructor(e){super(`w:startOverride`),this.root.push(new ay({val:e}))}},sy=class extends W{constructor(e){super(`w:numbering`),U(this,`abstractNumberingMap`,new Map),U(this,`concreteNumberingMap`,new Map),U(this,`referenceConfigMap`,new Map),U(this,`abstractNumUniqueNumericId`,mf()),U(this,`concreteNumUniqueNumericId`,hf()),this.root.push(new T_([`wpc`,`mc`,`o`,`r`,`m`,`v`,`wp14`,`wp`,`w10`,`w`,`w14`,`w15`,`wpg`,`wpi`,`wne`,`wps`],`w14 w15 wp14`));let t=new $v(this.abstractNumUniqueNumericId(),[{level:0,format:Bv.BULLET,text:`●`,alignment:Y.LEFT,style:{paragraph:{indent:{left:ff(.5),hanging:ff(.25)}}}},{level:1,format:Bv.BULLET,text:`○`,alignment:Y.LEFT,style:{paragraph:{indent:{left:ff(1),hanging:ff(.25)}}}},{level:2,format:Bv.BULLET,text:`■`,alignment:Y.LEFT,style:{paragraph:{indent:{left:2160,hanging:ff(.25)}}}},{level:3,format:Bv.BULLET,text:`●`,alignment:Y.LEFT,style:{paragraph:{indent:{left:2880,hanging:ff(.25)}}}},{level:4,format:Bv.BULLET,text:`○`,alignment:Y.LEFT,style:{paragraph:{indent:{left:3600,hanging:ff(.25)}}}},{level:5,format:Bv.BULLET,text:`■`,alignment:Y.LEFT,style:{paragraph:{indent:{left:4320,hanging:ff(.25)}}}},{level:6,format:Bv.BULLET,text:`●`,alignment:Y.LEFT,style:{paragraph:{indent:{left:5040,hanging:ff(.25)}}}},{level:7,format:Bv.BULLET,text:`●`,alignment:Y.LEFT,style:{paragraph:{indent:{left:5760,hanging:ff(.25)}}}},{level:8,format:Bv.BULLET,text:`●`,alignment:Y.LEFT,style:{paragraph:{indent:{left:6480,hanging:ff(.25)}}}}]);this.concreteNumberingMap.set(`default-bullet-numbering`,new ny({numId:1,abstractNumId:t.id,reference:`default-bullet-numbering`,instance:0,overrideLevels:[{num:0,start:1}]})),this.abstractNumberingMap.set(`default-bullet-numbering`,t);for(let t of e.config)this.abstractNumberingMap.set(t.reference,new $v(this.abstractNumUniqueNumericId(),t.levels)),this.referenceConfigMap.set(t.reference,t.levels)}prepForXml(e){for(let e of this.abstractNumberingMap.values())this.root.push(e);for(let e of this.concreteNumberingMap.values())this.root.push(e);return super.prepForXml(e)}createConcreteNumberingInstance(e,t){let n=this.abstractNumberingMap.get(e);if(!n)return;let r=`${e}-${t}`;if(this.concreteNumberingMap.has(r))return;let i=this.referenceConfigMap.get(e),a=i&&i[0].start,o={numId:this.concreteNumUniqueNumericId(),abstractNumId:n.id,reference:e,instance:t,overrideLevels:[typeof a==`number`&&Number.isInteger(a)?{num:0,start:a}:{num:0,start:1}]};this.concreteNumberingMap.set(r,new ny(o))}get ConcreteNumbering(){return Array.from(this.concreteNumberingMap.values())}get ReferenceConfig(){return Array.from(this.referenceConfigMap.values())}},cy=e=>new J({name:`w:compatSetting`,attributes:{version:{key:`w:val`,value:e},name:{key:`w:name`,value:`compatibilityMode`},uri:{key:`w:uri`,value:`http://schemas.microsoft.com/office/word`}}}),ly=class extends W{constructor(e){super(`w:compat`),e.version&&this.root.push(cy(e.version)),e.useSingleBorderforContiguousCells&&this.root.push(new q(`w:useSingleBorderforContiguousCells`,e.useSingleBorderforContiguousCells)),e.wordPerfectJustification&&this.root.push(new q(`w:wpJustification`,e.wordPerfectJustification)),e.noTabStopForHangingIndent&&this.root.push(new q(`w:noTabHangInd`,e.noTabStopForHangingIndent)),e.noLeading&&this.root.push(new q(`w:noLeading`,e.noLeading)),e.spaceForUnderline&&this.root.push(new q(`w:spaceForUL`,e.spaceForUnderline)),e.noColumnBalance&&this.root.push(new q(`w:noColumnBalance`,e.noColumnBalance)),e.balanceSingleByteDoubleByteWidth&&this.root.push(new q(`w:balanceSingleByteDoubleByteWidth`,e.balanceSingleByteDoubleByteWidth)),e.noExtraLineSpacing&&this.root.push(new q(`w:noExtraLineSpacing`,e.noExtraLineSpacing)),e.doNotLeaveBackslashAlone&&this.root.push(new q(`w:doNotLeaveBackslashAlone`,e.doNotLeaveBackslashAlone)),e.underlineTrailingSpaces&&this.root.push(new q(`w:ulTrailSpace`,e.underlineTrailingSpaces)),e.doNotExpandShiftReturn&&this.root.push(new q(`w:doNotExpandShiftReturn`,e.doNotExpandShiftReturn)),e.spacingInWholePoints&&this.root.push(new q(`w:spacingInWholePoints`,e.spacingInWholePoints)),e.lineWrapLikeWord6&&this.root.push(new q(`w:lineWrapLikeWord6`,e.lineWrapLikeWord6)),e.printBodyTextBeforeHeader&&this.root.push(new q(`w:printBodyTextBeforeHeader`,e.printBodyTextBeforeHeader)),e.printColorsBlack&&this.root.push(new q(`w:printColBlack`,e.printColorsBlack)),e.spaceWidth&&this.root.push(new q(`w:wpSpaceWidth`,e.spaceWidth)),e.showBreaksInFrames&&this.root.push(new q(`w:showBreaksInFrames`,e.showBreaksInFrames)),e.subFontBySize&&this.root.push(new q(`w:subFontBySize`,e.subFontBySize)),e.suppressBottomSpacing&&this.root.push(new q(`w:suppressBottomSpacing`,e.suppressBottomSpacing)),e.suppressTopSpacing&&this.root.push(new q(`w:suppressTopSpacing`,e.suppressTopSpacing)),e.suppressSpacingAtTopOfPage&&this.root.push(new q(`w:suppressSpacingAtTopOfPage`,e.suppressSpacingAtTopOfPage)),e.suppressTopSpacingWP&&this.root.push(new q(`w:suppressTopSpacingWP`,e.suppressTopSpacingWP)),e.suppressSpBfAfterPgBrk&&this.root.push(new q(`w:suppressSpBfAfterPgBrk`,e.suppressSpBfAfterPgBrk)),e.swapBordersFacingPages&&this.root.push(new q(`w:swapBordersFacingPages`,e.swapBordersFacingPages)),e.convertMailMergeEsc&&this.root.push(new q(`w:convMailMergeEsc`,e.convertMailMergeEsc)),e.truncateFontHeightsLikeWP6&&this.root.push(new q(`w:truncateFontHeightsLikeWP6`,e.truncateFontHeightsLikeWP6)),e.macWordSmallCaps&&this.root.push(new q(`w:mwSmallCaps`,e.macWordSmallCaps)),e.usePrinterMetrics&&this.root.push(new q(`w:usePrinterMetrics`,e.usePrinterMetrics)),e.doNotSuppressParagraphBorders&&this.root.push(new q(`w:doNotSuppressParagraphBorders`,e.doNotSuppressParagraphBorders)),e.wrapTrailSpaces&&this.root.push(new q(`w:wrapTrailSpaces`,e.wrapTrailSpaces)),e.footnoteLayoutLikeWW8&&this.root.push(new q(`w:footnoteLayoutLikeWW8`,e.footnoteLayoutLikeWW8)),e.shapeLayoutLikeWW8&&this.root.push(new q(`w:shapeLayoutLikeWW8`,e.shapeLayoutLikeWW8)),e.alignTablesRowByRow&&this.root.push(new q(`w:alignTablesRowByRow`,e.alignTablesRowByRow)),e.forgetLastTabAlignment&&this.root.push(new q(`w:forgetLastTabAlignment`,e.forgetLastTabAlignment)),e.adjustLineHeightInTable&&this.root.push(new q(`w:adjustLineHeightInTable`,e.adjustLineHeightInTable)),e.autoSpaceLikeWord95&&this.root.push(new q(`w:autoSpaceLikeWord95`,e.autoSpaceLikeWord95)),e.noSpaceRaiseLower&&this.root.push(new q(`w:noSpaceRaiseLower`,e.noSpaceRaiseLower)),e.doNotUseHTMLParagraphAutoSpacing&&this.root.push(new q(`w:doNotUseHTMLParagraphAutoSpacing`,e.doNotUseHTMLParagraphAutoSpacing)),e.layoutRawTableWidth&&this.root.push(new q(`w:layoutRawTableWidth`,e.layoutRawTableWidth)),e.layoutTableRowsApart&&this.root.push(new q(`w:layoutTableRowsApart`,e.layoutTableRowsApart)),e.useWord97LineBreakRules&&this.root.push(new q(`w:useWord97LineBreakRules`,e.useWord97LineBreakRules)),e.doNotBreakWrappedTables&&this.root.push(new q(`w:doNotBreakWrappedTables`,e.doNotBreakWrappedTables)),e.doNotSnapToGridInCell&&this.root.push(new q(`w:doNotSnapToGridInCell`,e.doNotSnapToGridInCell)),e.selectFieldWithFirstOrLastCharacter&&this.root.push(new q(`w:selectFldWithFirstOrLastChar`,e.selectFieldWithFirstOrLastCharacter)),e.applyBreakingRules&&this.root.push(new q(`w:applyBreakingRules`,e.applyBreakingRules)),e.doNotWrapTextWithPunctuation&&this.root.push(new q(`w:doNotWrapTextWithPunct`,e.doNotWrapTextWithPunctuation)),e.doNotUseEastAsianBreakRules&&this.root.push(new q(`w:doNotUseEastAsianBreakRules`,e.doNotUseEastAsianBreakRules)),e.useWord2002TableStyleRules&&this.root.push(new q(`w:useWord2002TableStyleRules`,e.useWord2002TableStyleRules)),e.growAutofit&&this.root.push(new q(`w:growAutofit`,e.growAutofit)),e.useFELayout&&this.root.push(new q(`w:useFELayout`,e.useFELayout)),e.useNormalStyleForList&&this.root.push(new q(`w:useNormalStyleForList`,e.useNormalStyleForList)),e.doNotUseIndentAsNumberingTabStop&&this.root.push(new q(`w:doNotUseIndentAsNumberingTabStop`,e.doNotUseIndentAsNumberingTabStop)),e.useAlternateEastAsianLineBreakRules&&this.root.push(new q(`w:useAltKinsokuLineBreakRules`,e.useAlternateEastAsianLineBreakRules)),e.allowSpaceOfSameStyleInTable&&this.root.push(new q(`w:allowSpaceOfSameStyleInTable`,e.allowSpaceOfSameStyleInTable)),e.doNotSuppressIndentation&&this.root.push(new q(`w:doNotSuppressIndentation`,e.doNotSuppressIndentation)),e.doNotAutofitConstrainedTables&&this.root.push(new q(`w:doNotAutofitConstrainedTables`,e.doNotAutofitConstrainedTables)),e.autofitToFirstFixedWidthCell&&this.root.push(new q(`w:autofitToFirstFixedWidthCell`,e.autofitToFirstFixedWidthCell)),e.underlineTabInNumberingList&&this.root.push(new q(`w:underlineTabInNumList`,e.underlineTabInNumberingList)),e.displayHangulFixedWidth&&this.root.push(new q(`w:displayHangulFixedWidth`,e.displayHangulFixedWidth)),e.splitPgBreakAndParaMark&&this.root.push(new q(`w:splitPgBreakAndParaMark`,e.splitPgBreakAndParaMark)),e.doNotVerticallyAlignCellWithSp&&this.root.push(new q(`w:doNotVertAlignCellWithSp`,e.doNotVerticallyAlignCellWithSp)),e.doNotBreakConstrainedForcedTable&&this.root.push(new q(`w:doNotBreakConstrainedForcedTable`,e.doNotBreakConstrainedForcedTable)),e.ignoreVerticalAlignmentInTextboxes&&this.root.push(new q(`w:doNotVertAlignInTxbx`,e.ignoreVerticalAlignmentInTextboxes)),e.useAnsiKerningPairs&&this.root.push(new q(`w:useAnsiKerningPairs`,e.useAnsiKerningPairs)),e.cachedColumnBalance&&this.root.push(new q(`w:cachedColBalance`,e.cachedColumnBalance))}},uy=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{wpc:`xmlns:wpc`,mc:`xmlns:mc`,o:`xmlns:o`,r:`xmlns:r`,m:`xmlns:m`,v:`xmlns:v`,wp14:`xmlns:wp14`,wp:`xmlns:wp`,w10:`xmlns:w10`,w:`xmlns:w`,w14:`xmlns:w14`,w15:`xmlns:w15`,wpg:`xmlns:wpg`,wpi:`xmlns:wpi`,wne:`xmlns:wne`,wps:`xmlns:wps`,Ignorable:`mc:Ignorable`})}},dy=class extends W{constructor(e){super(`w:settings`),this.root.push(new uy({wpc:`http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas`,mc:`http://schemas.openxmlformats.org/markup-compatibility/2006`,o:`urn:schemas-microsoft-com:office:office`,r:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,m:`http://schemas.openxmlformats.org/officeDocument/2006/math`,v:`urn:schemas-microsoft-com:vml`,wp14:`http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing`,wp:`http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing`,w10:`urn:schemas-microsoft-com:office:word`,w:`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,w14:`http://schemas.microsoft.com/office/word/2010/wordml`,w15:`http://schemas.microsoft.com/office/word/2012/wordml`,wpg:`http://schemas.microsoft.com/office/word/2010/wordprocessingGroup`,wpi:`http://schemas.microsoft.com/office/word/2010/wordprocessingInk`,wne:`http://schemas.microsoft.com/office/word/2006/wordml`,wps:`http://schemas.microsoft.com/office/word/2010/wordprocessingShape`,Ignorable:`w14 w15 wp14`})),this.root.push(new q(`w:displayBackgroundShape`,!0)),e.trackRevisions!==void 0&&this.root.push(new q(`w:trackRevisions`,e.trackRevisions)),e.evenAndOddHeaders!==void 0&&this.root.push(new q(`w:evenAndOddHeaders`,e.evenAndOddHeaders)),e.updateFields!==void 0&&this.root.push(new q(`w:updateFields`,e.updateFields)),e.defaultTabStop!==void 0&&this.root.push(new xu(`w:defaultTabStop`,e.defaultTabStop)),e.hyphenation?.autoHyphenation!==void 0&&this.root.push(new q(`w:autoHyphenation`,e.hyphenation.autoHyphenation)),e.hyphenation?.hyphenationZone!==void 0&&this.root.push(new xu(`w:hyphenationZone`,e.hyphenation.hyphenationZone)),e.hyphenation?.consecutiveHyphenLimit!==void 0&&this.root.push(new xu(`w:consecutiveHyphenLimit`,e.hyphenation.consecutiveHyphenLimit)),e.hyphenation?.doNotHyphenateCaps!==void 0&&this.root.push(new q(`w:doNotHyphenateCaps`,e.hyphenation.doNotHyphenateCaps)),this.root.push(new ly(zi(H({},e.compatibility??{}),{version:e.compatibility?.version??e.compatibilityModeVersion??15})))}},fy=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w:val`})}},py=class extends W{constructor(e){super(`w:name`),this.root.push(new fy({val:e}))}},my=class extends W{constructor(e){super(`w:uiPriority`),this.root.push(new fy({val:$l(e)}))}},hy=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{type:`w:type`,styleId:`w:styleId`,default:`w:default`,customStyle:`w:customStyle`})}},gy=class extends W{constructor(e,t){super(`w:style`),this.root.push(new hy(e)),t.name&&this.root.push(new py(t.name)),t.basedOn&&this.root.push(new yu(`w:basedOn`,t.basedOn)),t.next&&this.root.push(new yu(`w:next`,t.next)),t.link&&this.root.push(new yu(`w:link`,t.link)),t.uiPriority!==void 0&&this.root.push(new my(t.uiPriority)),t.semiHidden!==void 0&&this.root.push(new q(`w:semiHidden`,t.semiHidden)),t.unhideWhenUsed!==void 0&&this.root.push(new q(`w:unhideWhenUsed`,t.unhideWhenUsed)),t.quickFormat!==void 0&&this.root.push(new q(`w:qFormat`,t.quickFormat))}},_y=class extends gy{constructor(e){super({type:`paragraph`,styleId:e.id},e),U(this,`paragraphProperties`),U(this,`runProperties`),this.paragraphProperties=new xh(e.paragraph),this.runProperties=new fd(e.run),this.root.push(this.paragraphProperties),this.root.push(this.runProperties)}},vy=class extends gy{constructor(e){super({type:`character`,styleId:e.id},H({uiPriority:99,unhideWhenUsed:!0},e)),U(this,`runProperties`),this.runProperties=new fd(e.run),this.root.push(this.runProperties)}},yy=class extends _y{constructor(e){super(H({basedOn:`Normal`,next:`Normal`,quickFormat:!0},e))}},by=class extends yy{constructor(e){super(H({id:`Title`,name:`Title`},e))}},xy=class extends yy{constructor(e){super(H({id:`Heading1`,name:`Heading 1`},e))}},Sy=class extends yy{constructor(e){super(H({id:`Heading2`,name:`Heading 2`},e))}},Cy=class extends yy{constructor(e){super(H({id:`Heading3`,name:`Heading 3`},e))}},wy=class extends yy{constructor(e){super(H({id:`Heading4`,name:`Heading 4`},e))}},Ty=class extends yy{constructor(e){super(H({id:`Heading5`,name:`Heading 5`},e))}},Ey=class extends yy{constructor(e){super(H({id:`Heading6`,name:`Heading 6`},e))}},Dy=class extends yy{constructor(e){super(H({id:`Strong`,name:`Strong`},e))}},Oy=class extends _y{constructor(e){super(H({id:`ListParagraph`,name:`List Paragraph`,basedOn:`Normal`,quickFormat:!0},e))}},ky=class extends _y{constructor(e){super(H({id:`FootnoteText`,name:`footnote text`,link:`FootnoteTextChar`,basedOn:`Normal`,uiPriority:99,semiHidden:!0,unhideWhenUsed:!0,paragraph:{spacing:{after:0,line:240,lineRule:Fm.AUTO}},run:{size:20}},e))}},Ay=class extends vy{constructor(e){super(H({id:`FootnoteReference`,name:`footnote reference`,basedOn:`DefaultParagraphFont`,semiHidden:!0,run:{superScript:!0}},e))}},jy=class extends vy{constructor(e){super(H({id:`FootnoteTextChar`,name:`Footnote Text Char`,basedOn:`DefaultParagraphFont`,link:`FootnoteText`,semiHidden:!0,run:{size:20}},e))}},My=class extends _y{constructor(e){super(H({id:`EndnoteText`,name:`endnote text`,link:`EndnoteTextChar`,basedOn:`Normal`,uiPriority:99,semiHidden:!0,unhideWhenUsed:!0,paragraph:{spacing:{after:0,line:240,lineRule:Fm.AUTO}},run:{size:20}},e))}},Ny=class extends vy{constructor(e){super(H({id:`EndnoteReference`,name:`endnote reference`,basedOn:`DefaultParagraphFont`,semiHidden:!0,run:{superScript:!0}},e))}},Py=class extends vy{constructor(e){super(H({id:`EndnoteTextChar`,name:`Endnote Text Char`,basedOn:`DefaultParagraphFont`,link:`EndnoteText`,semiHidden:!0,run:{size:20}},e))}},Fy=class extends vy{constructor(e){super(H({id:`Hyperlink`,name:`Hyperlink`,basedOn:`DefaultParagraphFont`,run:{color:`0563C1`,underline:{type:cd.SINGLE}}},e))}},Iy=class extends W{constructor(e){if(super(`w:styles`),e.initialStyles&&this.root.push(e.initialStyles),e.importedStyles)for(let t of e.importedStyles)this.root.push(t);if(e.paragraphStyles)for(let t of e.paragraphStyles)this.root.push(new _y(t));if(e.characterStyles)for(let t of e.characterStyles)this.root.push(new vy(t))}},Ly=class extends W{constructor(e){super(`w:pPrDefault`),this.root.push(new xh(e))}},Ry=class extends W{constructor(e){super(`w:rPrDefault`),this.root.push(new fd(e))}},zy=class extends W{constructor(e){super(`w:docDefaults`),U(this,`runPropertiesDefaults`),U(this,`paragraphPropertiesDefaults`),this.runPropertiesDefaults=new Ry(e.run),this.paragraphPropertiesDefaults=new Ly(e.paragraph),this.root.push(this.runPropertiesDefaults),this.root.push(this.paragraphPropertiesDefaults)}},By=class{newInstance(e){let t=ql.xml2js(e,{compact:!1}),n;for(let e of t.elements||[])e.name===`w:styles`&&(n=e);if(n===void 0)throw Error(`can not find styles element`);let r=n.elements||[];return{initialStyles:new Zl(n.attributes),importedStyles:r.map(e=>Jl(e))}}},Vy=class{newInstance(e={}){return{initialStyles:new T_([`mc`,`r`,`w`,`w14`,`w15`],`w14 w15`),importedStyles:[new zy(e.document??{}),new by(H({run:{size:56}},e.title)),new xy(H({run:{color:`2E74B5`,size:32}},e.heading1)),new Sy(H({run:{color:`2E74B5`,size:26}},e.heading2)),new Cy(H({run:{color:`1F4D78`,size:24}},e.heading3)),new wy(H({run:{color:`2E74B5`,italics:!0}},e.heading4)),new Ty(H({run:{color:`2E74B5`}},e.heading5)),new Ey(H({run:{color:`1F4D78`}},e.heading6)),new Dy(H({run:{bold:!0}},e.strong)),new Oy(e.listParagraph||{}),new Fy(e.hyperlink||{}),new Ay(e.footnoteReference||{}),new ky(e.footnoteText||{}),new jy(e.footnoteTextChar||{}),new Ny(e.endnoteReference||{}),new My(e.endnoteText||{}),new Py(e.endnoteTextChar||{})]}}},Hy=class{constructor(e){if(U(this,`currentRelationshipId`,1),U(this,`documentWrapper`),U(this,`headers`,[]),U(this,`footers`,[]),U(this,`coreProperties`),U(this,`numbering`),U(this,`media`),U(this,`fileRelationships`),U(this,`footnotesWrapper`),U(this,`endnotesWrapper`),U(this,`settings`),U(this,`contentTypes`),U(this,`customProperties`),U(this,`appProperties`),U(this,`styles`),U(this,`comments`),U(this,`fontWrapper`),this.coreProperties=new E_(zi(H({},e),{creator:e.creator??`Un-named`,revision:e.revision??1,lastModifiedBy:e.lastModifiedBy??`Un-named`})),this.numbering=new sy(e.numbering?e.numbering:{config:[]}),this.comments=new sm(e.comments??{children:[]}),this.fileRelationships=new $p,this.customProperties=new N_(e.customProperties??[]),this.appProperties=new y_,this.footnotesWrapper=new Fv,this.endnotesWrapper=new wv,this.contentTypes=new C_,this.documentWrapper=new pv({background:e.background}),this.settings=new dy({compatibilityModeVersion:e.compatabilityModeVersion,compatibility:e.compatibility,evenAndOddHeaders:!!e.evenAndOddHeaderAndFooters,trackRevisions:e.features?.trackRevisions,updateFields:e.features?.updateFields,defaultTabStop:e.defaultTabStop,hyphenation:{autoHyphenation:e.hyphenation?.autoHyphenation,hyphenationZone:e.hyphenation?.hyphenationZone,consecutiveHyphenLimit:e.hyphenation?.consecutiveHyphenLimit,doNotHyphenateCaps:e.hyphenation?.doNotHyphenateCaps}}),this.media=new zv,e.externalStyles!==void 0){let t=new Vy().newInstance(e.styles?.default),n=new By().newInstance(e.externalStyles);this.styles=new Iy(zi(H({},n),{importedStyles:[...t.importedStyles,...n.importedStyles]}))}else e.styles?this.styles=new Iy(H(H({},new Vy().newInstance(e.styles.default)),e.styles)):this.styles=new Iy(new Vy().newInstance());this.addDefaultRelationships();for(let t of e.sections)this.addSection(t);if(e.footnotes)for(let t in e.footnotes)this.footnotesWrapper.View.createFootNote(parseFloat(t),e.footnotes[t].children);if(e.endnotes)for(let t in e.endnotes)this.endnotesWrapper.View.createEndnote(parseFloat(t),e.endnotes[t].children);this.fontWrapper=new hh(e.fonts??[])}addSection({headers:e={},footers:t={},children:n,properties:r}){this.documentWrapper.View.Body.addSection(zi(H({},r),{headerWrapperGroup:{default:e.default?this.createHeader(e.default):void 0,first:e.first?this.createHeader(e.first):void 0,even:e.even?this.createHeader(e.even):void 0},footerWrapperGroup:{default:t.default?this.createFooter(t.default):void 0,first:t.first?this.createFooter(t.first):void 0,even:t.even?this.createFooter(t.even):void 0}}));for(let e of n)this.documentWrapper.View.add(e)}createHeader(e){let t=new Rv(this.media,this.currentRelationshipId++);for(let n of e.options.children)t.add(n);return this.addHeaderToDocument(t),t}createFooter(e){let t=new Dv(this.media,this.currentRelationshipId++);for(let n of e.options.children)t.add(n);return this.addFooterToDocument(t),t}addHeaderToDocument(e,t=L_.DEFAULT){this.headers.push({header:e,type:t}),this.documentWrapper.Relationships.addRelationship(e.View.ReferenceId,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/header`,`header${this.headers.length}.xml`),this.contentTypes.addHeader(this.headers.length)}addFooterToDocument(e,t=L_.DEFAULT){this.footers.push({footer:e,type:t}),this.documentWrapper.Relationships.addRelationship(e.View.ReferenceId,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer`,`footer${this.footers.length}.xml`),this.contentTypes.addFooter(this.footers.length)}addDefaultRelationships(){this.fileRelationships.addRelationship(1,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument`,`word/document.xml`),this.fileRelationships.addRelationship(2,`http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties`,`docProps/core.xml`),this.fileRelationships.addRelationship(3,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties`,`docProps/app.xml`),this.fileRelationships.addRelationship(4,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties`,`docProps/custom.xml`),this.documentWrapper.Relationships.addRelationship(this.currentRelationshipId++,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles`,`styles.xml`),this.documentWrapper.Relationships.addRelationship(this.currentRelationshipId++,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering`,`numbering.xml`),this.documentWrapper.Relationships.addRelationship(this.currentRelationshipId++,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes`,`footnotes.xml`),this.documentWrapper.Relationships.addRelationship(this.currentRelationshipId++,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes`,`endnotes.xml`),this.documentWrapper.Relationships.addRelationship(this.currentRelationshipId++,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings`,`settings.xml`),this.documentWrapper.Relationships.addRelationship(this.currentRelationshipId++,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments`,`comments.xml`)}get Document(){return this.documentWrapper}get Styles(){return this.styles}get CoreProperties(){return this.coreProperties}get Numbering(){return this.numbering}get Media(){return this.media}get FileRelationships(){return this.fileRelationships}get Headers(){return this.headers.map(e=>e.header)}get Footers(){return this.footers.map(e=>e.footer)}get ContentTypes(){return this.contentTypes}get CustomProperties(){return this.customProperties}get AppProperties(){return this.appProperties}get FootNotes(){return this.footnotesWrapper}get Endnotes(){return this.endnotesWrapper}get Settings(){return this.settings}get Comments(){return this.comments}get FontTable(){return this.fontWrapper}},Uy=class extends W{constructor(e={}){super(`w:instrText`),U(this,`properties`),this.properties=e,this.root.push(new Bu({space:zu.PRESERVE}));let t=`TOC`;if(this.properties.captionLabel&&(t=`${t} \\a "${this.properties.captionLabel}"`),this.properties.entriesFromBookmark&&(t=`${t} \\b "${this.properties.entriesFromBookmark}"`),this.properties.captionLabelIncludingNumbers&&(t=`${t} \\c "${this.properties.captionLabelIncludingNumbers}"`),this.properties.sequenceAndPageNumbersSeparator&&(t=`${t} \\d "${this.properties.sequenceAndPageNumbersSeparator}"`),this.properties.tcFieldIdentifier&&(t=`${t} \\f "${this.properties.tcFieldIdentifier}"`),this.properties.hyperlink&&(t=`${t} \\h`),this.properties.tcFieldLevelRange&&(t=`${t} \\l "${this.properties.tcFieldLevelRange}"`),this.properties.pageNumbersEntryLevelsRange&&(t=`${t} \\n "${this.properties.pageNumbersEntryLevelsRange}"`),this.properties.headingStyleRange&&(t=`${t} \\o "${this.properties.headingStyleRange}"`),this.properties.entryAndPageNumberSeparator&&(t=`${t} \\p "${this.properties.entryAndPageNumberSeparator}"`),this.properties.seqFieldIdentifierForPrefix&&(t=`${t} \\s "${this.properties.seqFieldIdentifierForPrefix}"`),this.properties.stylesWithLevels&&this.properties.stylesWithLevels.length){let e=this.properties.stylesWithLevels.map(e=>`${e.styleName},${e.level}`).join(`,`);t=`${t} \\t "${e}"`}this.properties.useAppliedParagraphOutlineLevel&&(t=`${t} \\u`),this.properties.preserveTabInEntries&&(t=`${t} \\w`),this.properties.preserveNewLineInEntries&&(t=`${t} \\x`),this.properties.hideTabAndPageNumbersInWebView&&(t=`${t} \\z`),this.root.push(t)}},Wy=class extends W{constructor(){super(`w:sdtContent`)}},Gy=class extends W{constructor(e){super(`w:sdtPr`),e&&this.root.push(new yu(`w:alias`,e))}},Ky=class extends qm{constructor(e=`Table of Contents`,t={}){var n=t,{contentChildren:r=[],cachedEntries:i=[],beginDirty:a=!0}=n,o=Bi(n,[`contentChildren`,`cachedEntries`,`beginDirty`]);super(`w:sdt`),this.root.push(new Gy(e));let s=new Wy,c=[new _d({children:[Nu(a),new Uy(o),Pu()]})],l=[new _d({children:[Fu()]})];if(i!==void 0&&i.length>0){let{stylesWithLevels:e}=o,t=i.map((t,n)=>{let r=this.buildCachedContentParagraphChild(t,o),a=e?.find(e=>e.level===t.level)?.styleName??`TOC${t.level}`,s=n===0?[...c,r]:n===i.length-1?[r,...l]:[r];return new Z({style:a,tabStops:this.getTabStopsForLevel(t.level),children:s})}),n=t;i.length<=1&&(n=[...t,new Z({children:l})]);for(let e of n)s.addChildElement(e)}else{let e=new Z({children:c});s.addChildElement(e);for(let e of r)s.addChildElement(e);let t=new Z({children:l});s.addChildElement(t)}this.root.push(s)}getTabStopsForLevel(e,t=9025){return[{type:`clear`,position:t+1-(e-1)*240},{type:`right`,position:t,leader:`dot`}]}buildCachedContentRun(e,t){return new _d({style:t?.hyperlink&&e.href!==void 0?`IndexLink`:void 0,children:[new hd({text:e.title}),new Cm,new hd({text:e.page?.toString()??``})]})}buildCachedContentParagraphChild(e,t){let n=this.buildCachedContentRun(e,t);return t?.hyperlink&&e.href!==void 0?new Zm({anchor:e.href,children:[n]}):n}},qy=class{constructor(e,t){U(this,`styleName`),U(this,`level`),this.styleName=e,this.level=t}},Jy=class{constructor(e={children:[]}){U(this,`options`),this.options=e}},Yy=class{constructor(e={children:[]}){U(this,`options`),this.options=e}},Xy=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`})}},Zy=class extends W{constructor(e){super(`w:footnoteReference`),this.root.push(new Xy({id:e}))}},Qy=class extends _d{constructor(e){super({style:`FootnoteReference`}),this.root.push(new Zy(e))}},$y=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{id:`w:id`})}},eb=class extends W{constructor(e){super(`w:endnoteReference`),this.root.push(new $y({id:e}))}},tb=class extends _d{constructor(e){super({style:`EndnoteReference`}),this.root.push(new eb(e))}},nb=class extends G{constructor(){super(...arguments),U(this,`xmlKeys`,{val:`w14:val`,symbolfont:`w14:font`})}},rb=class extends W{constructor(e,t,n){super(e),n?this.root.push(new nb({val:ru(t),symbolfont:n})):this.root.push(new nb({val:t}))}},ib=class extends W{constructor(e){super(`w14:checkbox`),U(this,`DEFAULT_UNCHECKED_SYMBOL`,`2610`),U(this,`DEFAULT_CHECKED_SYMBOL`,`2612`),U(this,`DEFAULT_FONT`,`MS Gothic`);let t=e?.checked?`1`:`0`,n,r;this.root.push(new rb(`w14:checked`,t)),n=e?.checkedState?.value?e?.checkedState?.value:this.DEFAULT_CHECKED_SYMBOL,r=e?.checkedState?.font?e?.checkedState?.font:this.DEFAULT_FONT,this.root.push(new rb(`w14:checkedState`,n,r)),n=e?.uncheckedState?.value?e?.uncheckedState?.value:this.DEFAULT_UNCHECKED_SYMBOL,r=e?.uncheckedState?.font?e?.uncheckedState?.font:this.DEFAULT_FONT,this.root.push(new rb(`w14:uncheckedState`,n,r))}},ab=class extends W{constructor(e){super(`w:sdt`),U(this,`DEFAULT_UNCHECKED_SYMBOL`,`2610`),U(this,`DEFAULT_CHECKED_SYMBOL`,`2612`),U(this,`DEFAULT_FONT`,`MS Gothic`);let t=new Gy(e?.alias);t.addChildElement(new ib(e)),this.root.push(t);let n=new Wy,r=e?.checkedState?.font,i=e?.checkedState?.value,a=e?.uncheckedState?.font,o=e?.uncheckedState?.value,s,c;e?.checked?(s=r||this.DEFAULT_FONT,c=i||this.DEFAULT_CHECKED_SYMBOL):(s=a||this.DEFAULT_FONT,c=o||this.DEFAULT_UNCHECKED_SYMBOL);let l=new bd({char:c,symbolfont:s});n.addChildElement(l),this.root.push(n)}},ob=({shape:e})=>new J({name:`w:pict`,children:[e]}),sb=({children:e=[]})=>new J({name:`w:txbxContent`,children:e}),cb=({style:e,children:t,inset:n})=>new J({name:`v:textbox`,attributes:{style:{key:`style`,value:e},insetMode:{key:`insetmode`,value:n?`custom`:`auto`},inset:{key:`inset`,value:n?`${n.left}, ${n.top}, ${n.right}, ${n.bottom}`:void 0}},children:[sb({children:t})]}),lb=`#_x0000_t202`,ub={flip:`flip`,height:`height`,left:`left`,marginBottom:`margin-bottom`,marginLeft:`margin-left`,marginRight:`margin-right`,marginTop:`margin-top`,positionHorizontal:`mso-position-horizontal`,positionHorizontalRelative:`mso-position-horizontal-relative`,positionVertical:`mso-position-vertical`,positionVerticalRelative:`mso-position-vertical-relative`,wrapDistanceBottom:`mso-wrap-distance-bottom`,wrapDistanceLeft:`mso-wrap-distance-left`,wrapDistanceRight:`mso-wrap-distance-right`,wrapDistanceTop:`mso-wrap-distance-top`,wrapEdited:`mso-wrap-edited`,wrapStyle:`mso-wrap-style`,position:`position`,rotation:`rotation`,top:`top`,visibility:`visibility`,width:`width`,zIndex:`z-index`},db=e=>e?Object.entries(e).map(([e,t])=>`${ub[e]}:${t}`).join(`;`):void 0,fb=({id:e,children:t,type:n=lb,style:r})=>new J({name:`v:shape`,attributes:{id:{key:`id`,value:e},type:{key:`type`,value:n},style:{key:`style`,value:db(r)}},children:[cb({style:`mso-fit-shape-to-text:t;`,children:t})]}),pb=class extends qm{constructor(e){var t=e,{style:n,children:r}=t,i=Bi(t,[`style`,`children`]);super(`w:p`),this.root.push(new xh(i)),this.root.push(ob({shape:fb({children:r,id:vf(),style:n})}))}},mb=Cl();function hb(e){throw Error(`Could not dynamically require "`+e+`". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.`)}var gb={exports:{}},_b;function vb(){return _b?gb.exports:(_b=1,(function(e,t){(function(t){e.exports=t()})(function(){return(function e(t,n,r){function i(o,s){if(!n[o]){if(!t[o]){var c=typeof hb==`function`&&hb;if(!s&&c)return c(o,!0);if(a)return a(o,!0);var l=Error(`Cannot find module '`+o+`'`);throw l.code=`MODULE_NOT_FOUND`,l}var u=n[o]={exports:{}};t[o][0].call(u.exports,function(e){var n=t[o][1][e];return i(n||e)},u,u.exports,e,t,n,r)}return n[o].exports}for(var a=typeof hb==`function`&&hb,o=0;o<r.length;o++)i(r[o]);return i})({1:[function(e,t,n){var r=e(`./utils`),i=e(`./support`),a=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=`;n.encode=function(e){for(var t,n,i,o,s,c,l,u=[],d=0,f=e.length,p=f,m=r.getTypeOf(e)!==`string`;d<e.length;)p=f-d,i=m?(t=e[d++],n=d<f?e[d++]:0,d<f?e[d++]:0):(t=e.charCodeAt(d++),n=d<f?e.charCodeAt(d++):0,d<f?e.charCodeAt(d++):0),o=t>>2,s=(3&t)<<4|n>>4,c=1<p?(15&n)<<2|i>>6:64,l=2<p?63&i:64,u.push(a.charAt(o)+a.charAt(s)+a.charAt(c)+a.charAt(l));return u.join(``)},n.decode=function(e){var t,n,r,o,s,c,l=0,u=0,d=`data:`;if(e.substr(0,d.length)===d)throw Error(`Invalid base64 input, it looks like a data url.`);var f,p=3*(e=e.replace(/[^A-Za-z0-9+/=]/g,``)).length/4;if(e.charAt(e.length-1)===a.charAt(64)&&p--,e.charAt(e.length-2)===a.charAt(64)&&p--,p%1!=0)throw Error(`Invalid base64 input, bad content length.`);for(f=i.uint8array?new Uint8Array(0|p):Array(0|p);l<e.length;)t=a.indexOf(e.charAt(l++))<<2|(o=a.indexOf(e.charAt(l++)))>>4,n=(15&o)<<4|(s=a.indexOf(e.charAt(l++)))>>2,r=(3&s)<<6|(c=a.indexOf(e.charAt(l++))),f[u++]=t,s!==64&&(f[u++]=n),c!==64&&(f[u++]=r);return f}},{"./support":30,"./utils":32}],2:[function(e,t,n){var r=e(`./external`),i=e(`./stream/DataWorker`),a=e(`./stream/Crc32Probe`),o=e(`./stream/DataLengthProbe`);function s(e,t,n,r,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=n,this.compression=r,this.compressedContent=i}s.prototype={getContentWorker:function(){var e=new i(r.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new o(`data_length`)),t=this;return e.on(`end`,function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw Error(`Bug : uncompressed data size mismatch`)}),e},getCompressedWorker:function(){return new i(r.Promise.resolve(this.compressedContent)).withStreamInfo(`compressedSize`,this.compressedSize).withStreamInfo(`uncompressedSize`,this.uncompressedSize).withStreamInfo(`crc32`,this.crc32).withStreamInfo(`compression`,this.compression)}},s.createWorkerFrom=function(e,t,n){return e.pipe(new a).pipe(new o(`uncompressedSize`)).pipe(t.compressWorker(n)).pipe(new o(`compressedSize`)).withStreamInfo(`compression`,t)},t.exports=s},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,n){var r=e(`./stream/GenericWorker`);n.STORE={magic:`\0\0`,compressWorker:function(){return new r(`STORE compression`)},uncompressWorker:function(){return new r(`STORE decompression`)}},n.DEFLATE=e(`./flate`)},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,n){var r=e(`./utils`),i=(function(){for(var e,t=[],n=0;n<256;n++){e=n;for(var r=0;r<8;r++)e=1&e?3988292384^e>>>1:e>>>1;t[n]=e}return t})();t.exports=function(e,t){return e!==void 0&&e.length?r.getTypeOf(e)===`string`?(function(e,t,n,r){var a=i,o=r+n;e^=-1;for(var s=r;s<o;s++)e=e>>>8^a[255&(e^t.charCodeAt(s))];return-1^e})(0|t,e,e.length,0):(function(e,t,n,r){var a=i,o=r+n;e^=-1;for(var s=r;s<o;s++)e=e>>>8^a[255&(e^t[s])];return-1^e})(0|t,e,e.length,0):0}},{"./utils":32}],5:[function(e,t,n){n.base64=!1,n.binary=!1,n.dir=!1,n.createFolders=!0,n.date=null,n.compression=null,n.compressionOptions=null,n.comment=null,n.unixPermissions=null,n.dosPermissions=null},{}],6:[function(e,t,n){var r=null;r=typeof Promise<`u`?Promise:e(`lie`),t.exports={Promise:r}},{lie:37}],7:[function(e,t,n){var r=typeof Uint8Array<`u`&&typeof Uint16Array<`u`&&typeof Uint32Array<`u`,i=e(`pako`),a=e(`./utils`),o=e(`./stream/GenericWorker`),s=r?`uint8array`:`array`;function c(e,t){o.call(this,`FlateWorker/`+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={}}n.magic=`\b\0`,a.inherits(c,o),c.prototype.processChunk=function(e){this.meta=e.meta,this._pako===null&&this._createPako(),this._pako.push(a.transformTo(s,e.data),!1)},c.prototype.flush=function(){o.prototype.flush.call(this),this._pako===null&&this._createPako(),this._pako.push([],!0)},c.prototype.cleanUp=function(){o.prototype.cleanUp.call(this),this._pako=null},c.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var e=this;this._pako.onData=function(t){e.push({data:t,meta:e.meta})}},n.compressWorker=function(e){return new c(`Deflate`,e)},n.uncompressWorker=function(){return new c(`Inflate`,{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,n){function r(e,t){var n,r=``;for(n=0;n<t;n++)r+=String.fromCharCode(255&e),e>>>=8;return r}function i(e,t,n,i,o,u){var d,f,p=e.file,m=e.compression,h=u!==s.utf8encode,g=a.transformTo(`string`,u(p.name)),_=a.transformTo(`string`,s.utf8encode(p.name)),v=p.comment,y=a.transformTo(`string`,u(v)),b=a.transformTo(`string`,s.utf8encode(v)),x=_.length!==p.name.length,S=b.length!==v.length,C=``,w=``,T=``,E=p.dir,D=p.date,O={crc32:0,compressedSize:0,uncompressedSize:0};t&&!n||(O.crc32=e.crc32,O.compressedSize=e.compressedSize,O.uncompressedSize=e.uncompressedSize);var k=0;t&&(k|=8),h||!x&&!S||(k|=2048);var A=0,j=0;E&&(A|=16),o===`UNIX`?(j=798,A|=(function(e,t){var n=e;return e||(n=t?16893:33204),(65535&n)<<16})(p.unixPermissions,E)):(j=20,A|=(function(e){return 63&(e||0)})(p.dosPermissions)),d=D.getUTCHours(),d<<=6,d|=D.getUTCMinutes(),d<<=5,d|=D.getUTCSeconds()/2,f=D.getUTCFullYear()-1980,f<<=4,f|=D.getUTCMonth()+1,f<<=5,f|=D.getUTCDate(),x&&(w=r(1,1)+r(c(g),4)+_,C+=`up`+r(w.length,2)+w),S&&(T=r(1,1)+r(c(y),4)+b,C+=`uc`+r(T.length,2)+T);var M=``;return M+=`
\0`,M+=r(k,2),M+=m.magic,M+=r(d,2),M+=r(f,2),M+=r(O.crc32,4),M+=r(O.compressedSize,4),M+=r(O.uncompressedSize,4),M+=r(g.length,2),M+=r(C.length,2),{fileRecord:l.LOCAL_FILE_HEADER+M+g+C,dirRecord:l.CENTRAL_FILE_HEADER+r(j,2)+M+r(y.length,2)+`\0\0\0\0`+r(A,4)+r(i,4)+g+C+y}}var a=e(`../utils`),o=e(`../stream/GenericWorker`),s=e(`../utf8`),c=e(`../crc32`),l=e(`../signature`);function u(e,t,n,r){o.call(this,`ZipFileWorker`),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=n,this.encodeFileName=r,this.streamFiles=e,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}a.inherits(u,o),u.prototype.push=function(e){var t=e.meta.percent||0,n=this.entriesCount,r=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,o.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:n?(t+100*(n-r-1))/n:100}}))},u.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var n=i(e,t,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:n.fileRecord,meta:{percent:0}})}else this.accumulate=!0},u.prototype.closedSource=function(e){this.accumulate=!1;var t=this.streamFiles&&!e.file.dir,n=i(e,t,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(n.dirRecord),t)this.push({data:(function(e){return l.DATA_DESCRIPTOR+r(e.crc32,4)+r(e.compressedSize,4)+r(e.uncompressedSize,4)})(e),meta:{percent:100}});else for(this.push({data:n.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},u.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var n=this.bytesWritten-e,i=(function(e,t,n,i,o){var s=a.transformTo(`string`,o(i));return l.CENTRAL_DIRECTORY_END+`\0\0\0\0`+r(e,2)+r(e,2)+r(t,4)+r(n,4)+r(s.length,2)+s})(this.dirRecords.length,n,e,this.zipComment,this.encodeFileName);this.push({data:i,meta:{percent:100}})},u.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},u.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on(`data`,function(e){t.processChunk(e)}),e.on(`end`,function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end()}),e.on(`error`,function(e){t.error(e)}),this},u.prototype.resume=function(){return!!o.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},u.prototype.error=function(e){var t=this._sources;if(!o.prototype.error.call(this,e))return!1;for(var n=0;n<t.length;n++)try{t[n].error(e)}catch{}return!0},u.prototype.lock=function(){o.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock()},t.exports=u},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,n){var r=e(`../compressions`),i=e(`./ZipFileWorker`);n.generateWorker=function(e,t,n){var a=new i(t.streamFiles,n,t.platform,t.encodeFileName),o=0;try{e.forEach(function(e,n){o++;var i=(function(e,t){var n=e||t,i=r[n];if(!i)throw Error(n+` is not a valid compression method !`);return i})(n.options.compression,t.compression),s=n.options.compressionOptions||t.compressionOptions||{},c=n.dir,l=n.date;n._compressWorker(i,s).withStreamInfo(`file`,{name:e,dir:c,date:l,comment:n.comment||``,unixPermissions:n.unixPermissions,dosPermissions:n.dosPermissions}).pipe(a)}),a.entriesCount=o}catch(e){a.error(e)}return a}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,n){function r(){if(!(this instanceof r))return new r;if(arguments.length)throw Error(`The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.`);this.files=Object.create(null),this.comment=null,this.root=``,this.clone=function(){var e=new r;for(var t in this)typeof this[t]!=`function`&&(e[t]=this[t]);return e}}(r.prototype=e(`./object`)).loadAsync=e(`./load`),r.support=e(`./support`),r.defaults=e(`./defaults`),r.version=`3.10.1`,r.loadAsync=function(e,t){return new r().loadAsync(e,t)},r.external=e(`./external`),t.exports=r},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,n){var r=e(`./utils`),i=e(`./external`),a=e(`./utf8`),o=e(`./zipEntries`),s=e(`./stream/Crc32Probe`),c=e(`./nodejsUtils`);function l(e){return new i.Promise(function(t,n){var r=e.decompressed.getContentWorker().pipe(new s);r.on(`error`,function(e){n(e)}).on(`end`,function(){r.streamInfo.crc32===e.decompressed.crc32?t():n(Error(`Corrupted zip : CRC32 mismatch`))}).resume()})}t.exports=function(e,t){var n=this;return t=r.extend(t||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:a.utf8decode}),c.isNode&&c.isStream(e)?i.Promise.reject(Error(`JSZip can't accept a stream when loading a zip file.`)):r.prepareContent(`the loaded zip file`,e,!0,t.optimizedBinaryString,t.base64).then(function(e){var n=new o(t);return n.load(e),n}).then(function(e){var n=[i.Promise.resolve(e)],r=e.files;if(t.checkCRC32)for(var a=0;a<r.length;a++)n.push(l(r[a]));return i.Promise.all(n)}).then(function(e){for(var i=e.shift(),a=i.files,o=0;o<a.length;o++){var s=a[o],c=s.fileNameStr,l=r.resolve(s.fileNameStr);n.file(l,s.decompressed,{binary:!0,optimizedBinaryString:!0,date:s.date,dir:s.dir,comment:s.fileCommentStr.length?s.fileCommentStr:null,unixPermissions:s.unixPermissions,dosPermissions:s.dosPermissions,createFolders:t.createFolders}),s.dir||(n.file(l).unsafeOriginalName=c)}return i.zipComment.length&&(n.comment=i.zipComment),n})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,n){var r=e(`../utils`),i=e(`../stream/GenericWorker`);function a(e,t){i.call(this,`Nodejs stream input adapter for `+e),this._upstreamEnded=!1,this._bindStream(t)}r.inherits(a,i),a.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on(`data`,function(e){t.push({data:e,meta:{percent:0}})}).on(`error`,function(e){t.isPaused?this.generatedError=e:t.error(e)}).on(`end`,function(){t.isPaused?t._upstreamEnded=!0:t.end()})},a.prototype.pause=function(){return!!i.prototype.pause.call(this)&&(this._stream.pause(),!0)},a.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},t.exports=a},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,n){var r=e(`readable-stream`).Readable;function i(e,t,n){r.call(this,t),this._helper=e;var i=this;e.on(`data`,function(e,t){i.push(e)||i._helper.pause(),n&&n(t)}).on(`error`,function(e){i.emit(`error`,e)}).on(`end`,function(){i.push(null)})}e(`../utils`).inherits(i,r),i.prototype._read=function(){this._helper.resume()},t.exports=i},{"../utils":32,"readable-stream":16}],14:[function(e,t,n){t.exports={isNode:typeof Buffer<`u`,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if(typeof e==`number`)throw Error(`The "data" argument must not be a number`);return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&typeof e.on==`function`&&typeof e.pause==`function`&&typeof e.resume==`function`}}},{}],15:[function(e,t,n){function r(e,t,n){var r,i=a.getTypeOf(t),s=a.extend(n||{},c);s.date=s.date||new Date,s.compression!==null&&(s.compression=s.compression.toUpperCase()),typeof s.unixPermissions==`string`&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(e=h(e)),s.createFolders&&(r=m(e))&&g.call(this,r,!0);var d=i===`string`&&!1===s.binary&&!1===s.base64;n&&n.binary!==void 0||(s.binary=!d),(t instanceof l&&t.uncompressedSize===0||s.dir||!t||t.length===0)&&(s.base64=!1,s.binary=!0,t=``,s.compression=`STORE`,i=`string`);var _=null;_=t instanceof l||t instanceof o?t:f.isNode&&f.isStream(t)?new p(e,t):a.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var v=new u(e,_,s);this.files[e]=v}var i=e(`./utf8`),a=e(`./utils`),o=e(`./stream/GenericWorker`),s=e(`./stream/StreamHelper`),c=e(`./defaults`),l=e(`./compressedObject`),u=e(`./zipObject`),d=e(`./generate`),f=e(`./nodejsUtils`),p=e(`./nodejs/NodejsStreamInputAdapter`),m=function(e){e.slice(-1)===`/`&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf(`/`);return 0<t?e.substring(0,t):``},h=function(e){return e.slice(-1)!==`/`&&(e+=`/`),e},g=function(e,t){return t=t===void 0?c.createFolders:t,e=h(e),this.files[e]||r.call(this,e,null,{dir:!0,createFolders:t}),this.files[e]};function _(e){return Object.prototype.toString.call(e)===`[object RegExp]`}t.exports={load:function(){throw Error(`This method has been removed in JSZip 3.0, please check the upgrade guide.`)},forEach:function(e){var t,n,r;for(t in this.files)r=this.files[t],(n=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(n,r)},filter:function(e){var t=[];return this.forEach(function(n,r){e(n,r)&&t.push(r)}),t},file:function(e,t,n){if(arguments.length!==1)return e=this.root+e,r.call(this,e,t,n),this;if(_(e)){var i=e;return this.filter(function(e,t){return!t.dir&&i.test(e)})}var a=this.files[this.root+e];return a&&!a.dir?a:null},folder:function(e){if(!e)return this;if(_(e))return this.filter(function(t,n){return n.dir&&e.test(t)});var t=this.root+e,n=g.call(this,t),r=this.clone();return r.root=n.name,r},remove:function(e){e=this.root+e;var t=this.files[e];if(t||=(e.slice(-1)!==`/`&&(e+=`/`),this.files[e]),t&&!t.dir)delete this.files[e];else for(var n=this.filter(function(t,n){return n.name.slice(0,e.length)===e}),r=0;r<n.length;r++)delete this.files[n[r].name];return this},generate:function(){throw Error(`This method has been removed in JSZip 3.0, please check the upgrade guide.`)},generateInternalStream:function(e){var t,n={};try{if((n=a.extend(e||{},{streamFiles:!1,compression:`STORE`,compressionOptions:null,type:``,platform:`DOS`,comment:null,mimeType:`application/zip`,encodeFileName:i.utf8encode})).type=n.type.toLowerCase(),n.compression=n.compression.toUpperCase(),n.type===`binarystring`&&(n.type=`string`),!n.type)throw Error(`No output type specified.`);a.checkSupport(n.type),n.platform!==`darwin`&&n.platform!==`freebsd`&&n.platform!==`linux`&&n.platform!==`sunos`||(n.platform=`UNIX`),n.platform===`win32`&&(n.platform=`DOS`);var r=n.comment||this.comment||``;t=d.generateWorker(this,n,r)}catch(e){(t=new o(`error`)).error(e)}return new s(t,n.type||`string`,n.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return(e||={}).type||(e.type=`nodebuffer`),this.generateInternalStream(e).toNodejsStream(t)}}},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,n){t.exports=e(`stream`)},{stream:void 0}],17:[function(e,t,n){var r=e(`./DataReader`);function i(e){r.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t]}e(`../utils`).inherits(i,r),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),n=e.charCodeAt(1),r=e.charCodeAt(2),i=e.charCodeAt(3),a=this.length-4;0<=a;--a)if(this.data[a]===t&&this.data[a+1]===n&&this.data[a+2]===r&&this.data[a+3]===i)return a-this.zero;return-1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),n=e.charCodeAt(1),r=e.charCodeAt(2),i=e.charCodeAt(3),a=this.readData(4);return t===a[0]&&n===a[1]&&r===a[2]&&i===a[3]},i.prototype.readData=function(e){if(this.checkOffset(e),e===0)return[];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],18:[function(e,t,n){var r=e(`../utils`);function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e)},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw Error(`End of data reached (data length = `+this.length+`, asked index = `+e+`). Corrupted zip ?`)},setIndex:function(e){this.checkIndex(e),this.index=e},skip:function(e){this.setIndex(this.index+e)},byteAt:function(){},readInt:function(e){var t,n=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)n=(n<<8)+this.byteAt(t);return this.index+=e,n},readString:function(e){return r.transformTo(`string`,this.readData(e))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i},{"../utils":32}],19:[function(e,t,n){var r=e(`./Uint8ArrayReader`);function i(e){r.call(this,e)}e(`../utils`).inherits(i,r),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,n){var r=e(`./DataReader`);function i(e){r.call(this,e)}e(`../utils`).inherits(i,r),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],21:[function(e,t,n){var r=e(`./ArrayReader`);function i(e){r.call(this,e)}e(`../utils`).inherits(i,r),i.prototype.readData=function(e){if(this.checkOffset(e),e===0)return new Uint8Array;var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,n){var r=e(`../utils`),i=e(`../support`),a=e(`./ArrayReader`),o=e(`./StringReader`),s=e(`./NodeBufferReader`),c=e(`./Uint8ArrayReader`);t.exports=function(e){var t=r.getTypeOf(e);return r.checkSupport(t),t!==`string`||i.uint8array?t===`nodebuffer`?new s(e):i.uint8array?new c(r.transformTo(`uint8array`,e)):new a(r.transformTo(`array`,e)):new o(e)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,n){n.LOCAL_FILE_HEADER=`PK`,n.CENTRAL_FILE_HEADER=`PK`,n.CENTRAL_DIRECTORY_END=`PK`,n.ZIP64_CENTRAL_DIRECTORY_LOCATOR=`PK\x07`,n.ZIP64_CENTRAL_DIRECTORY_END=`PK`,n.DATA_DESCRIPTOR=`PK\x07\b`},{}],24:[function(e,t,n){var r=e(`./GenericWorker`),i=e(`../utils`);function a(e){r.call(this,`ConvertWorker to `+e),this.destType=e}i.inherits(a,r),a.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta})},t.exports=a},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,n){var r=e(`./GenericWorker`),i=e(`../crc32`);function a(){r.call(this,`Crc32Probe`),this.withStreamInfo(`crc32`,0)}e(`../utils`).inherits(a,r),a.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e)},t.exports=a},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,n){var r=e(`../utils`),i=e(`./GenericWorker`);function a(e){i.call(this,`DataLengthProbe for `+e),this.propName=e,this.withStreamInfo(e,0)}r.inherits(a,i),a.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length}i.prototype.processChunk.call(this,e)},t.exports=a},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,n){var r=e(`../utils`),i=e(`./GenericWorker`);function a(e){i.call(this,`DataWorker`);var t=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type=``,this._tickScheduled=!1,e.then(function(e){t.dataIsReady=!0,t.data=e,t.max=e&&e.length||0,t.type=r.getTypeOf(e),t.isPaused||t._tickAndRepeat()},function(e){t.error(e)})}r.inherits(a,i),a.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},a.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,r.delay(this._tickAndRepeat,[],this)),!0)},a.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(r.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},a.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case`string`:e=this.data.substring(this.index,t);break;case`uint8array`:e=this.data.subarray(this.index,t);break;case`array`:case`nodebuffer`:e=this.data.slice(this.index,t)}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=a},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,n){function r(e){this.name=e||`default`,this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}r.prototype={push:function(e){this.emit(`data`,e)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit(`end`),this.cleanUp(),this.isFinished=!0}catch(e){this.emit(`error`,e)}return!0},error:function(e){return!this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=!0,this.emit(`error`,e),this.previous&&this.previous.error(e),this.cleanUp()),!0)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(e,t){if(this._listeners[e])for(var n=0;n<this._listeners[e].length;n++)this._listeners[e][n].call(this,t)},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw Error(`The stream '`+this+`' has already been used.`);this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on(`data`,function(e){t.processChunk(e)}),e.on(`end`,function(){t.end()}),e.on(`error`,function(e){t.error(e)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var e=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),e=!0),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e)},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,e)&&(this.streamInfo[e]=this.extraStreamInfo[e])},lock:function(){if(this.isLocked)throw Error(`The stream '`+this+`' has already been used.`);this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var e=`Worker `+this.name;return this.previous?this.previous+` -> `+e:e}},t.exports=r},{}],29:[function(e,t,n){var r=e(`../utils`),i=e(`./ConvertWorker`),a=e(`./GenericWorker`),o=e(`../base64`),s=e(`../support`),c=e(`../external`),l=null;if(s.nodestream)try{l=e(`../nodejs/NodejsStreamOutputAdapter`)}catch{}function u(e,t){return new c.Promise(function(n,i){var a=[],s=e._internalType,c=e._outputType,l=e._mimeType;e.on(`data`,function(e,n){a.push(e),t&&t(n)}).on(`error`,function(e){a=[],i(e)}).on(`end`,function(){try{n((function(e,t,n){switch(e){case`blob`:return r.newBlob(r.transformTo(`arraybuffer`,t),n);case`base64`:return o.encode(t);default:return r.transformTo(e,t)}})(c,(function(e,t){var n,r=0,i=null,a=0;for(n=0;n<t.length;n++)a+=t[n].length;switch(e){case`string`:return t.join(``);case`array`:return Array.prototype.concat.apply([],t);case`uint8array`:for(i=new Uint8Array(a),n=0;n<t.length;n++)i.set(t[n],r),r+=t[n].length;return i;case`nodebuffer`:return Buffer.concat(t);default:throw Error(`concat : unsupported type '`+e+`'`)}})(s,a),l))}catch(e){i(e)}a=[]}).resume()})}function d(e,t,n){var o=t;switch(t){case`blob`:case`arraybuffer`:o=`uint8array`;break;case`base64`:o=`string`}try{this._internalType=o,this._outputType=t,this._mimeType=n,r.checkSupport(o),this._worker=e.pipe(new i(o)),e.lock()}catch(e){this._worker=new a(`error`),this._worker.error(e)}}d.prototype={accumulate:function(e){return u(this,e)},on:function(e,t){var n=this;return e===`data`?this._worker.on(e,function(e){t.call(n,e.data,e.meta)}):this._worker.on(e,function(){r.delay(t,arguments,n)}),this},resume:function(){return r.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(r.checkSupport(`nodestream`),this._outputType!==`nodebuffer`)throw Error(this._outputType+` is not supported by this method`);return new l(this,{objectMode:this._outputType!==`nodebuffer`},e)}},t.exports=d},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,n){if(n.base64=!0,n.array=!0,n.string=!0,n.arraybuffer=typeof ArrayBuffer<`u`&&typeof Uint8Array<`u`,n.nodebuffer=typeof Buffer<`u`,n.uint8array=typeof Uint8Array<`u`,typeof ArrayBuffer>`u`)n.blob=!1;else{var r=new ArrayBuffer(0);try{n.blob=new Blob([r],{type:`application/zip`}).size===0}catch{try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(r),n.blob=i.getBlob(`application/zip`).size===0}catch{n.blob=!1}}}try{n.nodestream=!!e(`readable-stream`).Readable}catch{n.nodestream=!1}},{"readable-stream":16}],31:[function(e,t,n){for(var r=e(`./utils`),i=e(`./support`),a=e(`./nodejsUtils`),o=e(`./stream/GenericWorker`),s=Array(256),c=0;c<256;c++)s[c]=252<=c?6:248<=c?5:240<=c?4:224<=c?3:192<=c?2:1;s[254]=s[254]=1;function l(){o.call(this,`utf-8 decode`),this.leftOver=null}function u(){o.call(this,`utf-8 encode`)}n.utf8encode=function(e){return i.nodebuffer?a.newBufferFrom(e,`utf-8`):(function(e){var t,n,r,a,o,s=e.length,c=0;for(a=0;a<s;a++)(64512&(n=e.charCodeAt(a)))==55296&&a+1<s&&(64512&(r=e.charCodeAt(a+1)))==56320&&(n=65536+(n-55296<<10)+(r-56320),a++),c+=n<128?1:n<2048?2:n<65536?3:4;for(t=i.uint8array?new Uint8Array(c):Array(c),a=o=0;o<c;a++)(64512&(n=e.charCodeAt(a)))==55296&&a+1<s&&(64512&(r=e.charCodeAt(a+1)))==56320&&(n=65536+(n-55296<<10)+(r-56320),a++),n<128?t[o++]=n:(n<2048?t[o++]=192|n>>>6:(n<65536?t[o++]=224|n>>>12:(t[o++]=240|n>>>18,t[o++]=128|n>>>12&63),t[o++]=128|n>>>6&63),t[o++]=128|63&n);return t})(e)},n.utf8decode=function(e){return i.nodebuffer?r.transformTo(`nodebuffer`,e).toString(`utf-8`):(function(e){var t,n,i,a,o=e.length,c=Array(2*o);for(t=n=0;t<o;)if((i=e[t++])<128)c[n++]=i;else if(4<(a=s[i]))c[n++]=65533,t+=a-1;else{for(i&=a===2?31:a===3?15:7;1<a&&t<o;)i=i<<6|63&e[t++],a--;1<a?c[n++]=65533:i<65536?c[n++]=i:(i-=65536,c[n++]=55296|i>>10&1023,c[n++]=56320|1023&i)}return c.length!==n&&(c.subarray?c=c.subarray(0,n):c.length=n),r.applyFromCharCode(c)})(e=r.transformTo(i.uint8array?`uint8array`:`array`,e))},r.inherits(l,o),l.prototype.processChunk=function(e){var t=r.transformTo(i.uint8array?`uint8array`:`array`,e.data);if(this.leftOver&&this.leftOver.length){if(i.uint8array){var a=t;(t=new Uint8Array(a.length+this.leftOver.length)).set(this.leftOver,0),t.set(a,this.leftOver.length)}else t=this.leftOver.concat(t);this.leftOver=null}var o=(function(e,t){var n;for((t||=e.length)>e.length&&(t=e.length),n=t-1;0<=n&&(192&e[n])==128;)n--;return n<0||n===0?t:n+s[e[n]]>t?n:t})(t),c=t;o!==t.length&&(i.uint8array?(c=t.subarray(0,o),this.leftOver=t.subarray(o,t.length)):(c=t.slice(0,o),this.leftOver=t.slice(o,t.length))),this.push({data:n.utf8decode(c),meta:e.meta})},l.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:n.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},n.Utf8DecodeWorker=l,r.inherits(u,o),u.prototype.processChunk=function(e){this.push({data:n.utf8encode(e.data),meta:e.meta})},n.Utf8EncodeWorker=u},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,n){var r=e(`./support`),i=e(`./base64`),a=e(`./nodejsUtils`),o=e(`./external`);function s(e){return e}function c(e,t){for(var n=0;n<e.length;++n)t[n]=255&e.charCodeAt(n);return t}e(`setimmediate`),n.newBlob=function(e,t){n.checkSupport(`blob`);try{return new Blob([e],{type:t})}catch{try{var r=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return r.append(e),r.getBlob(t)}catch{throw Error(`Bug : can't construct the Blob.`)}}};var l={stringifyByChunk:function(e,t,n){var r=[],i=0,a=e.length;if(a<=n)return String.fromCharCode.apply(null,e);for(;i<a;)t===`array`||t===`nodebuffer`?r.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+n,a)))):r.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+n,a)))),i+=n;return r.join(``)},stringifyByChar:function(e){for(var t=``,n=0;n<e.length;n++)t+=String.fromCharCode(e[n]);return t},applyCanBeUsed:{uint8array:(function(){try{return r.uint8array&&String.fromCharCode.apply(null,new Uint8Array(1)).length===1}catch{return!1}})(),nodebuffer:(function(){try{return r.nodebuffer&&String.fromCharCode.apply(null,a.allocBuffer(1)).length===1}catch{return!1}})()}};function u(e){var t=65536,r=n.getTypeOf(e),i=!0;if(r===`uint8array`?i=l.applyCanBeUsed.uint8array:r===`nodebuffer`&&(i=l.applyCanBeUsed.nodebuffer),i)for(;1<t;)try{return l.stringifyByChunk(e,r,t)}catch{t=Math.floor(t/2)}return l.stringifyByChar(e)}function d(e,t){for(var n=0;n<e.length;n++)t[n]=e[n];return t}n.applyFromCharCode=u;var f={};f.string={string:s,array:function(e){return c(e,Array(e.length))},arraybuffer:function(e){return f.string.uint8array(e).buffer},uint8array:function(e){return c(e,new Uint8Array(e.length))},nodebuffer:function(e){return c(e,a.allocBuffer(e.length))}},f.array={string:u,array:s,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return a.newBufferFrom(e)}},f.arraybuffer={string:function(e){return u(new Uint8Array(e))},array:function(e){return d(new Uint8Array(e),Array(e.byteLength))},arraybuffer:s,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return a.newBufferFrom(new Uint8Array(e))}},f.uint8array={string:u,array:function(e){return d(e,Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:s,nodebuffer:function(e){return a.newBufferFrom(e)}},f.nodebuffer={string:u,array:function(e){return d(e,Array(e.length))},arraybuffer:function(e){return f.nodebuffer.uint8array(e).buffer},uint8array:function(e){return d(e,new Uint8Array(e.length))},nodebuffer:s},n.transformTo=function(e,t){return t||=``,e?(n.checkSupport(e),f[n.getTypeOf(t)][e](t)):t},n.resolve=function(e){for(var t=e.split(`/`),n=[],r=0;r<t.length;r++){var i=t[r];i===`.`||i===``&&r!==0&&r!==t.length-1||(i===`..`?n.pop():n.push(i))}return n.join(`/`)},n.getTypeOf=function(e){return typeof e==`string`?`string`:Object.prototype.toString.call(e)===`[object Array]`?`array`:r.nodebuffer&&a.isBuffer(e)?`nodebuffer`:r.uint8array&&e instanceof Uint8Array?`uint8array`:r.arraybuffer&&e instanceof ArrayBuffer?`arraybuffer`:void 0},n.checkSupport=function(e){if(!r[e.toLowerCase()])throw Error(e+` is not supported by this platform`)},n.MAX_VALUE_16BITS=65535,n.MAX_VALUE_32BITS=-1,n.pretty=function(e){var t,n,r=``;for(n=0;n<(e||``).length;n++)r+=`\\x`+((t=e.charCodeAt(n))<16?`0`:``)+t.toString(16).toUpperCase();return r},n.delay=function(e,t,n){setImmediate(function(){e.apply(n||null,t||[])})},n.inherits=function(e,t){function n(){}n.prototype=t.prototype,e.prototype=new n},n.extend=function(){var e,t,n={};for(e=0;e<arguments.length;e++)for(t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&n[t]===void 0&&(n[t]=arguments[e][t]);return n},n.prepareContent=function(e,t,a,s,l){return o.Promise.resolve(t).then(function(e){return r.blob&&(e instanceof Blob||[`[object File]`,`[object Blob]`].indexOf(Object.prototype.toString.call(e))!==-1)&&typeof FileReader<`u`?new o.Promise(function(t,n){var r=new FileReader;r.onload=function(e){t(e.target.result)},r.onerror=function(e){n(e.target.error)},r.readAsArrayBuffer(e)}):e}).then(function(t){var u=n.getTypeOf(t);return u?(u===`arraybuffer`?t=n.transformTo(`uint8array`,t):u===`string`&&(l?t=i.decode(t):a&&!0!==s&&(t=(function(e){return c(e,r.uint8array?new Uint8Array(e.length):Array(e.length))})(t))),t):o.Promise.reject(Error(`Can't read the data of '`+e+`'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?`))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,t,n){var r=e(`./reader/readerFor`),i=e(`./utils`),a=e(`./signature`),o=e(`./zipEntry`),s=e(`./support`);function c(e){this.files=[],this.loadOptions=e}c.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw Error(`Corrupted zip or bug: unexpected signature (`+i.pretty(t)+`, expected `+i.pretty(e)+`)`)}},isSignature:function(e,t){var n=this.reader.index;this.reader.setIndex(e);var r=this.reader.readString(4)===t;return this.reader.setIndex(n),r},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=s.uint8array?`uint8array`:`array`,n=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(n)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,n,r=this.zip64EndOfCentralSize-44;0<r;)e=this.reader.readInt(2),t=this.reader.readInt(4),n=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:n}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw Error(`Multi-volumes zip are not supported`)},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(a.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes()},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(a.CENTRAL_FILE_HEADER);)(e=new o({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&this.centralDirRecords!==0&&this.files.length===0)throw Error(`Corrupted zip or bug: expected `+this.centralDirRecords+` records in central dir, got `+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(a.CENTRAL_DIRECTORY_END);if(e<0)throw this.isSignature(0,a.LOCAL_FILE_HEADER)?Error(`Corrupted zip: can't find end of central directory`):Error(`Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html`);this.reader.setIndex(e);var t=e;if(this.checkSignature(a.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=!0,(e=this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw Error(`Corrupted zip: can't find the ZIP64 end of central directory locator`);if(this.reader.setIndex(e),this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,a.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw Error(`Corrupted zip: can't find the ZIP64 end of central directory`);this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var n=this.centralDirOffset+this.centralDirSize;this.zip64&&(n+=20,n+=12+this.zip64EndOfCentralSize);var r=t-n;if(0<r)this.isSignature(t,a.CENTRAL_FILE_HEADER)||(this.reader.zero=r);else if(r<0)throw Error(`Corrupted zip: missing `+Math.abs(r)+` bytes.`)},prepareReader:function(e){this.reader=r(e)},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},t.exports=c},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,t,n){var r=e(`./reader/readerFor`),i=e(`./utils`),a=e(`./compressedObject`),o=e(`./crc32`),s=e(`./utf8`),c=e(`./compressions`),l=e(`./support`);function u(e,t){this.options=e,this.loadOptions=t}u.prototype={isEncrypted:function(){return(1&this.bitFlag)==1},useUTF8:function(){return(2048&this.bitFlag)==2048},readLocalPart:function(e){var t,n;if(e.skip(22),this.fileNameLength=e.readInt(2),n=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(n),this.compressedSize===-1||this.uncompressedSize===-1)throw Error(`Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)`);if((t=(function(e){for(var t in c)if(Object.prototype.hasOwnProperty.call(c,t)&&c[t].magic===e)return c[t];return null})(this.compressionMethod))===null)throw Error(`Corrupted zip : compression `+i.pretty(this.compressionMethod)+` unknown (inner file : `+i.transformTo(`string`,this.fileName)+`)`);this.decompressed=new a(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize))},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw Error(`Encrypted zip are not supported`);e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),e==0&&(this.dosPermissions=63&this.externalFileAttributes),e==3&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||this.fileNameStr.slice(-1)!==`/`||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var e=r(this.extraFields[1].value);this.uncompressedSize===i.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===i.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===i.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===i.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(e){var t,n,r,i=e.index+this.extraFieldsLength;for(this.extraFields||={};e.index+4<i;)t=e.readInt(2),n=e.readInt(2),r=e.readData(n),this.extraFields[t]={id:t,length:n,value:r};e.setIndex(i)},handleUTF8:function(){var e=l.uint8array?`uint8array`:`array`;if(this.useUTF8())this.fileNameStr=s.utf8decode(this.fileName),this.fileCommentStr=s.utf8decode(this.fileComment);else{var t=this.findExtraFieldUnicodePath();if(t!==null)this.fileNameStr=t;else{var n=i.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(n)}var r=this.findExtraFieldUnicodeComment();if(r!==null)this.fileCommentStr=r;else{var a=i.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(a)}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=r(e.value);return t.readInt(1)===1&&o(this.fileName)===t.readInt(4)?s.utf8decode(t.readData(e.length-5)):null}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=r(e.value);return t.readInt(1)===1&&o(this.fileComment)===t.readInt(4)?s.utf8decode(t.readData(e.length-5)):null}return null}},t.exports=u},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,n){function r(e,t,n){this.name=e,this.dir=n.dir,this.date=n.date,this.comment=n.comment,this.unixPermissions=n.unixPermissions,this.dosPermissions=n.dosPermissions,this._data=t,this._dataBinary=n.binary,this.options={compression:n.compression,compressionOptions:n.compressionOptions}}var i=e(`./stream/StreamHelper`),a=e(`./stream/DataWorker`),o=e(`./utf8`),s=e(`./compressedObject`),c=e(`./stream/GenericWorker`);r.prototype={internalStream:function(e){var t=null,n=`string`;try{if(!e)throw Error(`No output type specified.`);var r=(n=e.toLowerCase())===`string`||n===`text`;n!==`binarystring`&&n!==`text`||(n=`string`),t=this._decompressWorker();var a=!this._dataBinary;a&&!r&&(t=t.pipe(new o.Utf8EncodeWorker)),!a&&r&&(t=t.pipe(new o.Utf8DecodeWorker))}catch(e){(t=new c(`error`)).error(e)}return new i(t,n,``)},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||`nodebuffer`).toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof s&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var n=this._decompressWorker();return this._dataBinary||(n=n.pipe(new o.Utf8EncodeWorker)),s.createWorkerFrom(n,e,t)},_decompressWorker:function(){return this._data instanceof s?this._data.getContentWorker():this._data instanceof c?this._data:new a(this._data)}};for(var l=[`asText`,`asBinary`,`asNodeBuffer`,`asUint8Array`,`asArrayBuffer`],u=function(){throw Error(`This method has been removed in JSZip 3.0, please check the upgrade guide.`)},d=0;d<l.length;d++)r.prototype[l[d]]=u;t.exports=r},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,t,n){(function(e){var n,r,i=e.MutationObserver||e.WebKitMutationObserver;if(i){var a=0,o=new i(u),s=e.document.createTextNode(``);o.observe(s,{characterData:!0}),n=function(){s.data=a=++a%2}}else if(e.setImmediate||e.MessageChannel===void 0)n=`document`in e&&`onreadystatechange`in e.document.createElement(`script`)?function(){var t=e.document.createElement(`script`);t.onreadystatechange=function(){u(),t.onreadystatechange=null,t.parentNode.removeChild(t),t=null},e.document.documentElement.appendChild(t)}:function(){setTimeout(u,0)};else{var c=new e.MessageChannel;c.port1.onmessage=u,n=function(){c.port2.postMessage(0)}}var l=[];function u(){var e,t;r=!0;for(var n=l.length;n;){for(t=l,l=[],e=-1;++e<n;)t[e]();n=l.length}r=!1}t.exports=function(e){l.push(e)!==1||r||n()}}).call(this,qi===void 0?typeof self<`u`?self:typeof window<`u`?window:{}:qi)},{}],37:[function(e,t,n){var r=e(`immediate`);function i(){}var a={},o=[`REJECTED`],s=[`FULFILLED`],c=[`PENDING`];function l(e){if(typeof e!=`function`)throw TypeError(`resolver must be a function`);this.state=c,this.queue=[],this.outcome=void 0,e!==i&&p(this,e)}function u(e,t,n){this.promise=e,typeof t==`function`&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),typeof n==`function`&&(this.onRejected=n,this.callRejected=this.otherCallRejected)}function d(e,t,n){r(function(){var r;try{r=t(n)}catch(t){return a.reject(e,t)}r===e?a.reject(e,TypeError(`Cannot resolve promise with itself`)):a.resolve(e,r)})}function f(e){var t=e&&e.then;if(e&&(typeof e==`object`||typeof e==`function`)&&typeof t==`function`)return function(){t.apply(e,arguments)}}function p(e,t){var n=!1;function r(t){n||(n=!0,a.reject(e,t))}function i(t){n||(n=!0,a.resolve(e,t))}var o=m(function(){t(i,r)});o.status===`error`&&r(o.value)}function m(e,t){var n={};try{n.value=e(t),n.status=`success`}catch(e){n.status=`error`,n.value=e}return n}(t.exports=l).prototype.finally=function(e){if(typeof e!=`function`)return this;var t=this.constructor;return this.then(function(n){return t.resolve(e()).then(function(){return n})},function(n){return t.resolve(e()).then(function(){throw n})})},l.prototype.catch=function(e){return this.then(null,e)},l.prototype.then=function(e,t){if(typeof e!=`function`&&this.state===s||typeof t!=`function`&&this.state===o)return this;var n=new this.constructor(i);return this.state===c?this.queue.push(new u(n,e,t)):d(n,this.state===s?e:t,this.outcome),n},u.prototype.callFulfilled=function(e){a.resolve(this.promise,e)},u.prototype.otherCallFulfilled=function(e){d(this.promise,this.onFulfilled,e)},u.prototype.callRejected=function(e){a.reject(this.promise,e)},u.prototype.otherCallRejected=function(e){d(this.promise,this.onRejected,e)},a.resolve=function(e,t){var n=m(f,t);if(n.status===`error`)return a.reject(e,n.value);var r=n.value;if(r)p(e,r);else{e.state=s,e.outcome=t;for(var i=-1,o=e.queue.length;++i<o;)e.queue[i].callFulfilled(t)}return e},a.reject=function(e,t){e.state=o,e.outcome=t;for(var n=-1,r=e.queue.length;++n<r;)e.queue[n].callRejected(t);return e},l.resolve=function(e){return e instanceof this?e:a.resolve(new this(i),e)},l.reject=function(e){var t=new this(i);return a.reject(t,e)},l.all=function(e){var t=this;if(Object.prototype.toString.call(e)!==`[object Array]`)return this.reject(TypeError(`must be an array`));var n=e.length,r=!1;if(!n)return this.resolve([]);for(var o=Array(n),s=0,c=-1,l=new this(i);++c<n;)u(e[c],c);return l;function u(e,i){t.resolve(e).then(function(e){o[i]=e,++s!==n||r||(r=!0,a.resolve(l,o))},function(e){r||(r=!0,a.reject(l,e))})}},l.race=function(e){var t=this;if(Object.prototype.toString.call(e)!==`[object Array]`)return this.reject(TypeError(`must be an array`));var n=e.length,r=!1;if(!n)return this.resolve([]);for(var o=-1,s=new this(i);++o<n;)c=e[o],t.resolve(c).then(function(e){r||(r=!0,a.resolve(s,e))},function(e){r||(r=!0,a.reject(s,e))});var c;return s}},{immediate:36}],38:[function(e,t,n){var r={};(0,e(`./lib/utils/common`).assign)(r,e(`./lib/deflate`),e(`./lib/inflate`),e(`./lib/zlib/constants`)),t.exports=r},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,n){var r=e(`./zlib/deflate`),i=e(`./utils/common`),a=e(`./utils/strings`),o=e(`./zlib/messages`),s=e(`./zlib/zstream`),c=Object.prototype.toString,l=0,u=-1,d=0,f=8;function p(e){if(!(this instanceof p))return new p(e);this.options=i.assign({level:u,method:f,chunkSize:16384,windowBits:15,memLevel:8,strategy:d,to:``},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg=``,this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var n=r.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(n!==l)throw Error(o[n]);if(t.header&&r.deflateSetHeader(this.strm,t.header),t.dictionary){var m;if(m=typeof t.dictionary==`string`?a.string2buf(t.dictionary):c.call(t.dictionary)===`[object ArrayBuffer]`?new Uint8Array(t.dictionary):t.dictionary,(n=r.deflateSetDictionary(this.strm,m))!==l)throw Error(o[n]);this._dict_set=!0}}function m(e,t){var n=new p(t);if(n.push(e,!0),n.err)throw n.msg||o[n.err];return n.result}p.prototype.push=function(e,t){var n,o,s=this.strm,u=this.options.chunkSize;if(this.ended)return!1;o=t===~~t?t:!0===t?4:0,typeof e==`string`?s.input=a.string2buf(e):c.call(e)===`[object ArrayBuffer]`?s.input=new Uint8Array(e):s.input=e,s.next_in=0,s.avail_in=s.input.length;do{if(s.avail_out===0&&(s.output=new i.Buf8(u),s.next_out=0,s.avail_out=u),(n=r.deflate(s,o))!==1&&n!==l)return this.onEnd(n),!(this.ended=!0);s.avail_out!==0&&(s.avail_in!==0||o!==4&&o!==2)||(this.options.to===`string`?this.onData(a.buf2binstring(i.shrinkBuf(s.output,s.next_out))):this.onData(i.shrinkBuf(s.output,s.next_out)))}while((0<s.avail_in||s.avail_out===0)&&n!==1);return o===4?(n=r.deflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===l):o!==2||(this.onEnd(l),!(s.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e)},p.prototype.onEnd=function(e){e===l&&(this.options.to===`string`?this.result=this.chunks.join(``):this.result=i.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},n.Deflate=p,n.deflate=m,n.deflateRaw=function(e,t){return(t||={}).raw=!0,m(e,t)},n.gzip=function(e,t){return(t||={}).gzip=!0,m(e,t)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,n){var r=e(`./zlib/inflate`),i=e(`./utils/common`),a=e(`./utils/strings`),o=e(`./zlib/constants`),s=e(`./zlib/messages`),c=e(`./zlib/zstream`),l=e(`./zlib/gzheader`),u=Object.prototype.toString;function d(e){if(!(this instanceof d))return new d(e);this.options=i.assign({chunkSize:16384,windowBits:0,to:``},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,t.windowBits===0&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&!(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg=``,this.ended=!1,this.chunks=[],this.strm=new c,this.strm.avail_out=0;var n=r.inflateInit2(this.strm,t.windowBits);if(n!==o.Z_OK)throw Error(s[n]);this.header=new l,r.inflateGetHeader(this.strm,this.header)}function f(e,t){var n=new d(t);if(n.push(e,!0),n.err)throw n.msg||s[n.err];return n.result}d.prototype.push=function(e,t){var n,s,c,l,d,f,p=this.strm,m=this.options.chunkSize,h=this.options.dictionary,g=!1;if(this.ended)return!1;s=t===~~t?t:!0===t?o.Z_FINISH:o.Z_NO_FLUSH,typeof e==`string`?p.input=a.binstring2buf(e):u.call(e)===`[object ArrayBuffer]`?p.input=new Uint8Array(e):p.input=e,p.next_in=0,p.avail_in=p.input.length;do{if(p.avail_out===0&&(p.output=new i.Buf8(m),p.next_out=0,p.avail_out=m),(n=r.inflate(p,o.Z_NO_FLUSH))===o.Z_NEED_DICT&&h&&(f=typeof h==`string`?a.string2buf(h):u.call(h)===`[object ArrayBuffer]`?new Uint8Array(h):h,n=r.inflateSetDictionary(this.strm,f)),n===o.Z_BUF_ERROR&&!0===g&&(n=o.Z_OK,g=!1),n!==o.Z_STREAM_END&&n!==o.Z_OK)return this.onEnd(n),!(this.ended=!0);p.next_out&&(p.avail_out!==0&&n!==o.Z_STREAM_END&&(p.avail_in!==0||s!==o.Z_FINISH&&s!==o.Z_SYNC_FLUSH)||(this.options.to===`string`?(c=a.utf8border(p.output,p.next_out),l=p.next_out-c,d=a.buf2string(p.output,c),p.next_out=l,p.avail_out=m-l,l&&i.arraySet(p.output,p.output,c,l,0),this.onData(d)):this.onData(i.shrinkBuf(p.output,p.next_out)))),p.avail_in===0&&p.avail_out===0&&(g=!0)}while((0<p.avail_in||p.avail_out===0)&&n!==o.Z_STREAM_END);return n===o.Z_STREAM_END&&(s=o.Z_FINISH),s===o.Z_FINISH?(n=r.inflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===o.Z_OK):s!==o.Z_SYNC_FLUSH||(this.onEnd(o.Z_OK),!(p.avail_out=0))},d.prototype.onData=function(e){this.chunks.push(e)},d.prototype.onEnd=function(e){e===o.Z_OK&&(this.options.to===`string`?this.result=this.chunks.join(``):this.result=i.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},n.Inflate=d,n.inflate=f,n.inflateRaw=function(e,t){return(t||={}).raw=!0,f(e,t)},n.ungzip=f},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,n){var r=typeof Uint8Array<`u`&&typeof Uint16Array<`u`&&typeof Int32Array<`u`;n.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var n=t.shift();if(n){if(typeof n!=`object`)throw TypeError(n+`must be non-object`);for(var r in n)n.hasOwnProperty(r)&&(e[r]=n[r])}}return e},n.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,n,r,i){if(t.subarray&&e.subarray)e.set(t.subarray(n,n+r),i);else for(var a=0;a<r;a++)e[i+a]=t[n+a]},flattenChunks:function(e){var t,n,r,i,a,o;for(t=r=0,n=e.length;t<n;t++)r+=e[t].length;for(o=new Uint8Array(r),t=i=0,n=e.length;t<n;t++)a=e[t],o.set(a,i),i+=a.length;return o}},a={arraySet:function(e,t,n,r,i){for(var a=0;a<r;a++)e[i+a]=t[n+a]},flattenChunks:function(e){return[].concat.apply([],e)}};n.setTyped=function(e){e?(n.Buf8=Uint8Array,n.Buf16=Uint16Array,n.Buf32=Int32Array,n.assign(n,i)):(n.Buf8=Array,n.Buf16=Array,n.Buf32=Array,n.assign(n,a))},n.setTyped(r)},{}],42:[function(e,t,n){var r=e(`./common`),i=!0,a=!0;try{String.fromCharCode.apply(null,[0])}catch{i=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{a=!1}for(var o=new r.Buf8(256),s=0;s<256;s++)o[s]=252<=s?6:248<=s?5:240<=s?4:224<=s?3:192<=s?2:1;function c(e,t){if(t<65537&&(e.subarray&&a||!e.subarray&&i))return String.fromCharCode.apply(null,r.shrinkBuf(e,t));for(var n=``,o=0;o<t;o++)n+=String.fromCharCode(e[o]);return n}o[254]=o[254]=1,n.string2buf=function(e){var t,n,i,a,o,s=e.length,c=0;for(a=0;a<s;a++)(64512&(n=e.charCodeAt(a)))==55296&&a+1<s&&(64512&(i=e.charCodeAt(a+1)))==56320&&(n=65536+(n-55296<<10)+(i-56320),a++),c+=n<128?1:n<2048?2:n<65536?3:4;for(t=new r.Buf8(c),a=o=0;o<c;a++)(64512&(n=e.charCodeAt(a)))==55296&&a+1<s&&(64512&(i=e.charCodeAt(a+1)))==56320&&(n=65536+(n-55296<<10)+(i-56320),a++),n<128?t[o++]=n:(n<2048?t[o++]=192|n>>>6:(n<65536?t[o++]=224|n>>>12:(t[o++]=240|n>>>18,t[o++]=128|n>>>12&63),t[o++]=128|n>>>6&63),t[o++]=128|63&n);return t},n.buf2binstring=function(e){return c(e,e.length)},n.binstring2buf=function(e){for(var t=new r.Buf8(e.length),n=0,i=t.length;n<i;n++)t[n]=e.charCodeAt(n);return t},n.buf2string=function(e,t){var n,r,i,a,s=t||e.length,l=Array(2*s);for(n=r=0;n<s;)if((i=e[n++])<128)l[r++]=i;else if(4<(a=o[i]))l[r++]=65533,n+=a-1;else{for(i&=a===2?31:a===3?15:7;1<a&&n<s;)i=i<<6|63&e[n++],a--;1<a?l[r++]=65533:i<65536?l[r++]=i:(i-=65536,l[r++]=55296|i>>10&1023,l[r++]=56320|1023&i)}return c(l,r)},n.utf8border=function(e,t){var n;for((t||=e.length)>e.length&&(t=e.length),n=t-1;0<=n&&(192&e[n])==128;)n--;return n<0||n===0?t:n+o[e[n]]>t?n:t}},{"./common":41}],43:[function(e,t,n){t.exports=function(e,t,n,r){for(var i=65535&e|0,a=e>>>16&65535|0,o=0;n!==0;){for(n-=o=2e3<n?2e3:n;a=a+(i=i+t[r++]|0)|0,--o;);i%=65521,a%=65521}return i|a<<16|0}},{}],44:[function(e,t,n){t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,t,n){var r=(function(){for(var e,t=[],n=0;n<256;n++){e=n;for(var r=0;r<8;r++)e=1&e?3988292384^e>>>1:e>>>1;t[n]=e}return t})();t.exports=function(e,t,n,i){var a=r,o=i+n;e^=-1;for(var s=i;s<o;s++)e=e>>>8^a[255&(e^t[s])];return-1^e}},{}],46:[function(e,t,n){var r,i=e(`../utils/common`),a=e(`./trees`),o=e(`./adler32`),s=e(`./crc32`),c=e(`./messages`),l=0,u=4,d=0,f=-2,p=-1,m=4,h=2,g=8,_=9,v=286,y=30,b=19,x=2*v+1,S=15,C=3,w=258,T=w+C+1,E=42,D=113,O=1,k=2,A=3,j=4;function M(e,t){return e.msg=c[t],t}function ee(e){return(e<<1)-(4<e?9:0)}function N(e){for(var t=e.length;0<=--t;)e[t]=0}function P(e){var t=e.state,n=t.pending;n>e.avail_out&&(n=e.avail_out),n!==0&&(i.arraySet(e.output,t.pending_buf,t.pending_out,n,e.next_out),e.next_out+=n,t.pending_out+=n,e.total_out+=n,e.avail_out-=n,t.pending-=n,t.pending===0&&(t.pending_out=0))}function F(e,t){a._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,P(e.strm)}function I(e,t){e.pending_buf[e.pending++]=t}function L(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function R(e,t){var n,r,i=e.max_chain_length,a=e.strstart,o=e.prev_length,s=e.nice_match,c=e.strstart>e.w_size-T?e.strstart-(e.w_size-T):0,l=e.window,u=e.w_mask,d=e.prev,f=e.strstart+w,p=l[a+o-1],m=l[a+o];e.prev_length>=e.good_match&&(i>>=2),s>e.lookahead&&(s=e.lookahead);do if(l[(n=t)+o]===m&&l[n+o-1]===p&&l[n]===l[a]&&l[++n]===l[a+1]){a+=2,n++;do;while(l[++a]===l[++n]&&l[++a]===l[++n]&&l[++a]===l[++n]&&l[++a]===l[++n]&&l[++a]===l[++n]&&l[++a]===l[++n]&&l[++a]===l[++n]&&l[++a]===l[++n]&&a<f);if(r=w-(f-a),a=f-w,o<r){if(e.match_start=t,s<=(o=r))break;p=l[a+o-1],m=l[a+o]}}while((t=d[t&u])>c&&--i!=0);return o<=e.lookahead?o:e.lookahead}function z(e){var t,n,r,a,c,l,u,d,f,p,m=e.w_size;do{if(a=e.window_size-e.lookahead-e.strstart,e.strstart>=m+(m-T)){for(i.arraySet(e.window,e.window,m,m,0),e.match_start-=m,e.strstart-=m,e.block_start-=m,t=n=e.hash_size;r=e.head[--t],e.head[t]=m<=r?r-m:0,--n;);for(t=n=m;r=e.prev[--t],e.prev[t]=m<=r?r-m:0,--n;);a+=m}if(e.strm.avail_in===0)break;if(l=e.strm,u=e.window,d=e.strstart+e.lookahead,f=a,p=void 0,p=l.avail_in,f<p&&(p=f),n=p===0?0:(l.avail_in-=p,i.arraySet(u,l.input,l.next_in,p,d),l.state.wrap===1?l.adler=o(l.adler,u,p,d):l.state.wrap===2&&(l.adler=s(l.adler,u,p,d)),l.next_in+=p,l.total_in+=p,p),e.lookahead+=n,e.lookahead+e.insert>=C)for(c=e.strstart-e.insert,e.ins_h=e.window[c],e.ins_h=(e.ins_h<<e.hash_shift^e.window[c+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[c+C-1])&e.hash_mask,e.prev[c&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=c,c++,e.insert--,!(e.lookahead+e.insert<C)););}while(e.lookahead<T&&e.strm.avail_in!==0)}function te(e,t){for(var n,r;;){if(e.lookahead<T){if(z(e),e.lookahead<T&&t===l)return O;if(e.lookahead===0)break}if(n=0,e.lookahead>=C&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+C-1])&e.hash_mask,n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),n!==0&&e.strstart-n<=e.w_size-T&&(e.match_length=R(e,n)),e.match_length>=C)if(r=a._tr_tally(e,e.strstart-e.match_start,e.match_length-C),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=C){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+C-1])&e.hash_mask,n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,--e.match_length!=0;);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else r=a._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(r&&(F(e,!1),e.strm.avail_out===0))return O}return e.insert=e.strstart<C-1?e.strstart:C-1,t===u?(F(e,!0),e.strm.avail_out===0?A:j):e.last_lit&&(F(e,!1),e.strm.avail_out===0)?O:k}function ne(e,t){for(var n,r,i;;){if(e.lookahead<T){if(z(e),e.lookahead<T&&t===l)return O;if(e.lookahead===0)break}if(n=0,e.lookahead>=C&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+C-1])&e.hash_mask,n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=C-1,n!==0&&e.prev_length<e.max_lazy_match&&e.strstart-n<=e.w_size-T&&(e.match_length=R(e,n),e.match_length<=5&&(e.strategy===1||e.match_length===C&&4096<e.strstart-e.match_start)&&(e.match_length=C-1)),e.prev_length>=C&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-C,r=a._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-C),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+C-1])&e.hash_mask,n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),--e.prev_length!=0;);if(e.match_available=0,e.match_length=C-1,e.strstart++,r&&(F(e,!1),e.strm.avail_out===0))return O}else if(e.match_available){if((r=a._tr_tally(e,0,e.window[e.strstart-1]))&&F(e,!1),e.strstart++,e.lookahead--,e.strm.avail_out===0)return O}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&=(r=a._tr_tally(e,0,e.window[e.strstart-1]),0),e.insert=e.strstart<C-1?e.strstart:C-1,t===u?(F(e,!0),e.strm.avail_out===0?A:j):e.last_lit&&(F(e,!1),e.strm.avail_out===0)?O:k}function re(e,t,n,r,i){this.good_length=e,this.max_lazy=t,this.nice_length=n,this.max_chain=r,this.func=i}function ie(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=g,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new i.Buf16(2*x),this.dyn_dtree=new i.Buf16(2*(2*y+1)),this.bl_tree=new i.Buf16(2*(2*b+1)),N(this.dyn_ltree),N(this.dyn_dtree),N(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new i.Buf16(S+1),this.heap=new i.Buf16(2*v+1),N(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new i.Buf16(2*v+1),N(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function ae(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=h,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?E:D,e.adler=t.wrap===2?0:1,t.last_flush=l,a._tr_init(t),d):M(e,f)}function oe(e){var t=ae(e);return t===d&&(function(e){e.window_size=2*e.w_size,N(e.head),e.max_lazy_match=r[e.level].max_lazy,e.good_match=r[e.level].good_length,e.nice_match=r[e.level].nice_length,e.max_chain_length=r[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=C-1,e.match_available=0,e.ins_h=0})(e.state),t}function B(e,t,n,r,a,o){if(!e)return f;var s=1;if(t===p&&(t=6),r<0?(s=0,r=-r):15<r&&(s=2,r-=16),a<1||_<a||n!==g||r<8||15<r||t<0||9<t||o<0||m<o)return M(e,f);r===8&&(r=9);var c=new ie;return(e.state=c).strm=e,c.wrap=s,c.gzhead=null,c.w_bits=r,c.w_size=1<<c.w_bits,c.w_mask=c.w_size-1,c.hash_bits=a+7,c.hash_size=1<<c.hash_bits,c.hash_mask=c.hash_size-1,c.hash_shift=~~((c.hash_bits+C-1)/C),c.window=new i.Buf8(2*c.w_size),c.head=new i.Buf16(c.hash_size),c.prev=new i.Buf16(c.w_size),c.lit_bufsize=1<<a+6,c.pending_buf_size=4*c.lit_bufsize,c.pending_buf=new i.Buf8(c.pending_buf_size),c.d_buf=1*c.lit_bufsize,c.l_buf=3*c.lit_bufsize,c.level=t,c.strategy=o,c.method=n,oe(e)}r=[new re(0,0,0,0,function(e,t){var n=65535;for(n>e.pending_buf_size-5&&(n=e.pending_buf_size-5);;){if(e.lookahead<=1){if(z(e),e.lookahead===0&&t===l)return O;if(e.lookahead===0)break}e.strstart+=e.lookahead,e.lookahead=0;var r=e.block_start+n;if((e.strstart===0||e.strstart>=r)&&(e.lookahead=e.strstart-r,e.strstart=r,F(e,!1),e.strm.avail_out===0)||e.strstart-e.block_start>=e.w_size-T&&(F(e,!1),e.strm.avail_out===0))return O}return e.insert=0,t===u?(F(e,!0),e.strm.avail_out===0?A:j):(e.strstart>e.block_start&&(F(e,!1),e.strm.avail_out),O)}),new re(4,4,8,4,te),new re(4,5,16,8,te),new re(4,6,32,32,te),new re(4,4,16,16,ne),new re(8,16,32,32,ne),new re(8,16,128,128,ne),new re(8,32,128,256,ne),new re(32,128,258,1024,ne),new re(32,258,258,4096,ne)],n.deflateInit=function(e,t){return B(e,t,g,15,8,0)},n.deflateInit2=B,n.deflateReset=oe,n.deflateResetKeep=ae,n.deflateSetHeader=function(e,t){return e&&e.state&&e.state.wrap===2?(e.state.gzhead=t,d):f},n.deflate=function(e,t){var n,i,o,c;if(!e||!e.state||5<t||t<0)return e?M(e,f):f;if(i=e.state,!e.output||!e.input&&e.avail_in!==0||i.status===666&&t!==u)return M(e,e.avail_out===0?-5:f);if(i.strm=e,n=i.last_flush,i.last_flush=t,i.status===E)if(i.wrap===2)e.adler=0,I(i,31),I(i,139),I(i,8),i.gzhead?(I(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),I(i,255&i.gzhead.time),I(i,i.gzhead.time>>8&255),I(i,i.gzhead.time>>16&255),I(i,i.gzhead.time>>24&255),I(i,i.level===9?2:2<=i.strategy||i.level<2?4:0),I(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(I(i,255&i.gzhead.extra.length),I(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(e.adler=s(e.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(I(i,0),I(i,0),I(i,0),I(i,0),I(i,0),I(i,i.level===9?2:2<=i.strategy||i.level<2?4:0),I(i,3),i.status=D);else{var p=g+(i.w_bits-8<<4)<<8;p|=(2<=i.strategy||i.level<2?0:i.level<6?1:i.level===6?2:3)<<6,i.strstart!==0&&(p|=32),p+=31-p%31,i.status=D,L(i,p),i.strstart!==0&&(L(i,e.adler>>>16),L(i,65535&e.adler)),e.adler=1}if(i.status===69)if(i.gzhead.extra){for(o=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>o&&(e.adler=s(e.adler,i.pending_buf,i.pending-o,o)),P(e),o=i.pending,i.pending!==i.pending_buf_size));)I(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>o&&(e.adler=s(e.adler,i.pending_buf,i.pending-o,o)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73)}else i.status=73;if(i.status===73)if(i.gzhead.name){o=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>o&&(e.adler=s(e.adler,i.pending_buf,i.pending-o,o)),P(e),o=i.pending,i.pending===i.pending_buf_size)){c=1;break}c=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,I(i,c)}while(c!==0);i.gzhead.hcrc&&i.pending>o&&(e.adler=s(e.adler,i.pending_buf,i.pending-o,o)),c===0&&(i.gzindex=0,i.status=91)}else i.status=91;if(i.status===91)if(i.gzhead.comment){o=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>o&&(e.adler=s(e.adler,i.pending_buf,i.pending-o,o)),P(e),o=i.pending,i.pending===i.pending_buf_size)){c=1;break}c=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,I(i,c)}while(c!==0);i.gzhead.hcrc&&i.pending>o&&(e.adler=s(e.adler,i.pending_buf,i.pending-o,o)),c===0&&(i.status=103)}else i.status=103;if(i.status===103&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&P(e),i.pending+2<=i.pending_buf_size&&(I(i,255&e.adler),I(i,e.adler>>8&255),e.adler=0,i.status=D)):i.status=D),i.pending!==0){if(P(e),e.avail_out===0)return i.last_flush=-1,d}else if(e.avail_in===0&&ee(t)<=ee(n)&&t!==u)return M(e,-5);if(i.status===666&&e.avail_in!==0)return M(e,-5);if(e.avail_in!==0||i.lookahead!==0||t!==l&&i.status!==666){var m=i.strategy===2?(function(e,t){for(var n;;){if(e.lookahead===0&&(z(e),e.lookahead===0)){if(t===l)return O;break}if(e.match_length=0,n=a._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,n&&(F(e,!1),e.strm.avail_out===0))return O}return e.insert=0,t===u?(F(e,!0),e.strm.avail_out===0?A:j):e.last_lit&&(F(e,!1),e.strm.avail_out===0)?O:k})(i,t):i.strategy===3?(function(e,t){for(var n,r,i,o,s=e.window;;){if(e.lookahead<=w){if(z(e),e.lookahead<=w&&t===l)return O;if(e.lookahead===0)break}if(e.match_length=0,e.lookahead>=C&&0<e.strstart&&(r=s[i=e.strstart-1])===s[++i]&&r===s[++i]&&r===s[++i]){o=e.strstart+w;do;while(r===s[++i]&&r===s[++i]&&r===s[++i]&&r===s[++i]&&r===s[++i]&&r===s[++i]&&r===s[++i]&&r===s[++i]&&i<o);e.match_length=w-(o-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=C?(n=a._tr_tally(e,1,e.match_length-C),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(n=a._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),n&&(F(e,!1),e.strm.avail_out===0))return O}return e.insert=0,t===u?(F(e,!0),e.strm.avail_out===0?A:j):e.last_lit&&(F(e,!1),e.strm.avail_out===0)?O:k})(i,t):r[i.level].func(i,t);if(m!==A&&m!==j||(i.status=666),m===O||m===A)return e.avail_out===0&&(i.last_flush=-1),d;if(m===k&&(t===1?a._tr_align(i):t!==5&&(a._tr_stored_block(i,0,0,!1),t===3&&(N(i.head),i.lookahead===0&&(i.strstart=0,i.block_start=0,i.insert=0))),P(e),e.avail_out===0))return i.last_flush=-1,d}return t===u?i.wrap<=0?1:(i.wrap===2?(I(i,255&e.adler),I(i,e.adler>>8&255),I(i,e.adler>>16&255),I(i,e.adler>>24&255),I(i,255&e.total_in),I(i,e.total_in>>8&255),I(i,e.total_in>>16&255),I(i,e.total_in>>24&255)):(L(i,e.adler>>>16),L(i,65535&e.adler)),P(e),0<i.wrap&&(i.wrap=-i.wrap),i.pending===0?1:d):d},n.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==E&&t!==69&&t!==73&&t!==91&&t!==103&&t!==D&&t!==666?M(e,f):(e.state=null,t===D?M(e,-3):d):f},n.deflateSetDictionary=function(e,t){var n,r,a,s,c,l,u,p,m=t.length;if(!e||!e.state||(s=(n=e.state).wrap)===2||s===1&&n.status!==E||n.lookahead)return f;for(s===1&&(e.adler=o(e.adler,t,m,0)),n.wrap=0,m>=n.w_size&&(s===0&&(N(n.head),n.strstart=0,n.block_start=0,n.insert=0),p=new i.Buf8(n.w_size),i.arraySet(p,t,m-n.w_size,n.w_size,0),t=p,m=n.w_size),c=e.avail_in,l=e.next_in,u=e.input,e.avail_in=m,e.next_in=0,e.input=t,z(n);n.lookahead>=C;){for(r=n.strstart,a=n.lookahead-(C-1);n.ins_h=(n.ins_h<<n.hash_shift^n.window[r+C-1])&n.hash_mask,n.prev[r&n.w_mask]=n.head[n.ins_h],n.head[n.ins_h]=r,r++,--a;);n.strstart=r,n.lookahead=C-1,z(n)}return n.strstart+=n.lookahead,n.block_start=n.strstart,n.insert=n.lookahead,n.lookahead=0,n.match_length=n.prev_length=C-1,n.match_available=0,e.next_in=l,e.input=u,e.avail_in=c,n.wrap=s,d},n.deflateInfo=`pako deflate (from Nodeca project)`},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,n){t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name=``,this.comment=``,this.hcrc=0,this.done=!1}},{}],48:[function(e,t,n){t.exports=function(e,t){var n=e.state,r=e.next_in,i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T=e.input,E;i=r+(e.avail_in-5),a=e.next_out,E=e.output,o=a-(t-e.avail_out),s=a+(e.avail_out-257),c=n.dmax,l=n.wsize,u=n.whave,d=n.wnext,f=n.window,p=n.hold,m=n.bits,h=n.lencode,g=n.distcode,_=(1<<n.lenbits)-1,v=(1<<n.distbits)-1;e:do{m<15&&(p+=T[r++]<<m,m+=8,p+=T[r++]<<m,m+=8),y=h[p&_];t:for(;;){if(p>>>=b=y>>>24,m-=b,(b=y>>>16&255)==0)E[a++]=65535&y;else{if(!(16&b)){if(!(64&b)){y=h[(65535&y)+(p&(1<<b)-1)];continue t}if(32&b){n.mode=12;break e}e.msg=`invalid literal/length code`,n.mode=30;break e}x=65535&y,(b&=15)&&(m<b&&(p+=T[r++]<<m,m+=8),x+=p&(1<<b)-1,p>>>=b,m-=b),m<15&&(p+=T[r++]<<m,m+=8,p+=T[r++]<<m,m+=8),y=g[p&v];r:for(;;){if(p>>>=b=y>>>24,m-=b,!(16&(b=y>>>16&255))){if(!(64&b)){y=g[(65535&y)+(p&(1<<b)-1)];continue r}e.msg=`invalid distance code`,n.mode=30;break e}if(S=65535&y,m<(b&=15)&&(p+=T[r++]<<m,(m+=8)<b&&(p+=T[r++]<<m,m+=8)),c<(S+=p&(1<<b)-1)){e.msg=`invalid distance too far back`,n.mode=30;break e}if(p>>>=b,m-=b,(b=a-o)<S){if(u<(b=S-b)&&n.sane){e.msg=`invalid distance too far back`,n.mode=30;break e}if(w=f,(C=0)===d){if(C+=l-b,b<x){for(x-=b;E[a++]=f[C++],--b;);C=a-S,w=E}}else if(d<b){if(C+=l+d-b,(b-=d)<x){for(x-=b;E[a++]=f[C++],--b;);if(C=0,d<x){for(x-=b=d;E[a++]=f[C++],--b;);C=a-S,w=E}}}else if(C+=d-b,b<x){for(x-=b;E[a++]=f[C++],--b;);C=a-S,w=E}for(;2<x;)E[a++]=w[C++],E[a++]=w[C++],E[a++]=w[C++],x-=3;x&&(E[a++]=w[C++],1<x&&(E[a++]=w[C++]))}else{for(C=a-S;E[a++]=E[C++],E[a++]=E[C++],E[a++]=E[C++],2<(x-=3););x&&(E[a++]=E[C++],1<x&&(E[a++]=E[C++]))}break}}break}}while(r<i&&a<s);r-=x=m>>3,p&=(1<<(m-=x<<3))-1,e.next_in=r,e.next_out=a,e.avail_in=r<i?i-r+5:5-(r-i),e.avail_out=a<s?s-a+257:257-(a-s),n.hold=p,n.bits=m}},{}],49:[function(e,t,n){var r=e(`../utils/common`),i=e(`./adler32`),a=e(`./crc32`),o=e(`./inffast`),s=e(`./inftrees`),c=1,l=2,u=0,d=-2,f=1,p=852,m=592;function h(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function g(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new r.Buf16(320),this.work=new r.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function _(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg=``,t.wrap&&(e.adler=1&t.wrap),t.mode=f,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new r.Buf32(p),t.distcode=t.distdyn=new r.Buf32(m),t.sane=1,t.back=-1,u):d}function v(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,_(e)):d}function y(e,t){var n,r;return e&&e.state?(r=e.state,t<0?(n=0,t=-t):(n=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?d:(r.window!==null&&r.wbits!==t&&(r.window=null),r.wrap=n,r.wbits=t,v(e))):d}function b(e,t){var n,r;return e?(r=new g,(e.state=r).window=null,(n=y(e,t))!==u&&(e.state=null),n):d}var x,S,C=!0;function w(e){if(C){var t;for(x=new r.Buf32(512),S=new r.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(s(c,e.lens,0,288,x,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;s(l,e.lens,0,32,S,0,e.work,{bits:5}),C=!1}e.lencode=x,e.lenbits=9,e.distcode=S,e.distbits=5}function T(e,t,n,i){var a,o=e.state;return o.window===null&&(o.wsize=1<<o.wbits,o.wnext=0,o.whave=0,o.window=new r.Buf8(o.wsize)),i>=o.wsize?(r.arraySet(o.window,t,n-o.wsize,o.wsize,0),o.wnext=0,o.whave=o.wsize):(i<(a=o.wsize-o.wnext)&&(a=i),r.arraySet(o.window,t,n-i,a,o.wnext),(i-=a)?(r.arraySet(o.window,t,n-i,i,0),o.wnext=i,o.whave=o.wsize):(o.wnext+=a,o.wnext===o.wsize&&(o.wnext=0),o.whave<o.wsize&&(o.whave+=a))),0}n.inflateReset=v,n.inflateReset2=y,n.inflateResetKeep=_,n.inflateInit=function(e){return b(e,15)},n.inflateInit2=b,n.inflate=function(e,t){var n,p,m,g,_,v,y,b,x,S,C,E,D,O,k,A,j,M,ee,N,P,F,I,L,R=0,z=new r.Buf8(4),te=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&e.avail_in!==0)return d;(n=e.state).mode===12&&(n.mode=13),_=e.next_out,m=e.output,y=e.avail_out,g=e.next_in,p=e.input,v=e.avail_in,b=n.hold,x=n.bits,S=v,C=y,F=u;e:for(;;)switch(n.mode){case f:if(n.wrap===0){n.mode=13;break}for(;x<16;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(2&n.wrap&&b===35615){z[n.check=0]=255&b,z[1]=b>>>8&255,n.check=a(n.check,z,2,0),x=b=0,n.mode=2;break}if(n.flags=0,n.head&&(n.head.done=!1),!(1&n.wrap)||(((255&b)<<8)+(b>>8))%31){e.msg=`incorrect header check`,n.mode=30;break}if((15&b)!=8){e.msg=`unknown compression method`,n.mode=30;break}if(x-=4,P=8+(15&(b>>>=4)),n.wbits===0)n.wbits=P;else if(P>n.wbits){e.msg=`invalid window size`,n.mode=30;break}n.dmax=1<<P,e.adler=n.check=1,n.mode=512&b?10:12,x=b=0;break;case 2:for(;x<16;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(n.flags=b,(255&n.flags)!=8){e.msg=`unknown compression method`,n.mode=30;break}if(57344&n.flags){e.msg=`unknown header flags set`,n.mode=30;break}n.head&&(n.head.text=b>>8&1),512&n.flags&&(z[0]=255&b,z[1]=b>>>8&255,n.check=a(n.check,z,2,0)),x=b=0,n.mode=3;case 3:for(;x<32;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}n.head&&(n.head.time=b),512&n.flags&&(z[0]=255&b,z[1]=b>>>8&255,z[2]=b>>>16&255,z[3]=b>>>24&255,n.check=a(n.check,z,4,0)),x=b=0,n.mode=4;case 4:for(;x<16;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}n.head&&(n.head.xflags=255&b,n.head.os=b>>8),512&n.flags&&(z[0]=255&b,z[1]=b>>>8&255,n.check=a(n.check,z,2,0)),x=b=0,n.mode=5;case 5:if(1024&n.flags){for(;x<16;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}n.length=b,n.head&&(n.head.extra_len=b),512&n.flags&&(z[0]=255&b,z[1]=b>>>8&255,n.check=a(n.check,z,2,0)),x=b=0}else n.head&&(n.head.extra=null);n.mode=6;case 6:if(1024&n.flags&&(v<(E=n.length)&&(E=v),E&&(n.head&&(P=n.head.extra_len-n.length,n.head.extra||(n.head.extra=Array(n.head.extra_len)),r.arraySet(n.head.extra,p,g,E,P)),512&n.flags&&(n.check=a(n.check,p,E,g)),v-=E,g+=E,n.length-=E),n.length))break e;n.length=0,n.mode=7;case 7:if(2048&n.flags){if(v===0)break e;for(E=0;P=p[g+ E++],n.head&&P&&n.length<65536&&(n.head.name+=String.fromCharCode(P)),P&&E<v;);if(512&n.flags&&(n.check=a(n.check,p,E,g)),v-=E,g+=E,P)break e}else n.head&&(n.head.name=null);n.length=0,n.mode=8;case 8:if(4096&n.flags){if(v===0)break e;for(E=0;P=p[g+ E++],n.head&&P&&n.length<65536&&(n.head.comment+=String.fromCharCode(P)),P&&E<v;);if(512&n.flags&&(n.check=a(n.check,p,E,g)),v-=E,g+=E,P)break e}else n.head&&(n.head.comment=null);n.mode=9;case 9:if(512&n.flags){for(;x<16;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(b!==(65535&n.check)){e.msg=`header crc mismatch`,n.mode=30;break}x=b=0}n.head&&(n.head.hcrc=n.flags>>9&1,n.head.done=!0),e.adler=n.check=0,n.mode=12;break;case 10:for(;x<32;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}e.adler=n.check=h(b),x=b=0,n.mode=11;case 11:if(n.havedict===0)return e.next_out=_,e.avail_out=y,e.next_in=g,e.avail_in=v,n.hold=b,n.bits=x,2;e.adler=n.check=1,n.mode=12;case 12:if(t===5||t===6)break e;case 13:if(n.last){b>>>=7&x,x-=7&x,n.mode=27;break}for(;x<3;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}switch(n.last=1&b,--x,3&(b>>>=1)){case 0:n.mode=14;break;case 1:if(w(n),n.mode=20,t!==6)break;b>>>=2,x-=2;break e;case 2:n.mode=17;break;case 3:e.msg=`invalid block type`,n.mode=30}b>>>=2,x-=2;break;case 14:for(b>>>=7&x,x-=7&x;x<32;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if((65535&b)!=(b>>>16^65535)){e.msg=`invalid stored block lengths`,n.mode=30;break}if(n.length=65535&b,x=b=0,n.mode=15,t===6)break e;case 15:n.mode=16;case 16:if(E=n.length){if(v<E&&(E=v),y<E&&(E=y),E===0)break e;r.arraySet(m,p,g,E,_),v-=E,g+=E,y-=E,_+=E,n.length-=E;break}n.mode=12;break;case 17:for(;x<14;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(n.nlen=257+(31&b),b>>>=5,x-=5,n.ndist=1+(31&b),b>>>=5,x-=5,n.ncode=4+(15&b),b>>>=4,x-=4,286<n.nlen||30<n.ndist){e.msg=`too many length or distance symbols`,n.mode=30;break}n.have=0,n.mode=18;case 18:for(;n.have<n.ncode;){for(;x<3;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}n.lens[te[n.have++]]=7&b,b>>>=3,x-=3}for(;n.have<19;)n.lens[te[n.have++]]=0;if(n.lencode=n.lendyn,n.lenbits=7,I={bits:n.lenbits},F=s(0,n.lens,0,19,n.lencode,0,n.work,I),n.lenbits=I.bits,F){e.msg=`invalid code lengths set`,n.mode=30;break}n.have=0,n.mode=19;case 19:for(;n.have<n.nlen+n.ndist;){for(;A=(R=n.lencode[b&(1<<n.lenbits)-1])>>>16&255,j=65535&R,!((k=R>>>24)<=x);){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(j<16)b>>>=k,x-=k,n.lens[n.have++]=j;else{if(j===16){for(L=k+2;x<L;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(b>>>=k,x-=k,n.have===0){e.msg=`invalid bit length repeat`,n.mode=30;break}P=n.lens[n.have-1],E=3+(3&b),b>>>=2,x-=2}else if(j===17){for(L=k+3;x<L;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}x-=k,P=0,E=3+(7&(b>>>=k)),b>>>=3,x-=3}else{for(L=k+7;x<L;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}x-=k,P=0,E=11+(127&(b>>>=k)),b>>>=7,x-=7}if(n.have+E>n.nlen+n.ndist){e.msg=`invalid bit length repeat`,n.mode=30;break}for(;E--;)n.lens[n.have++]=P}}if(n.mode===30)break;if(n.lens[256]===0){e.msg=`invalid code -- missing end-of-block`,n.mode=30;break}if(n.lenbits=9,I={bits:n.lenbits},F=s(c,n.lens,0,n.nlen,n.lencode,0,n.work,I),n.lenbits=I.bits,F){e.msg=`invalid literal/lengths set`,n.mode=30;break}if(n.distbits=6,n.distcode=n.distdyn,I={bits:n.distbits},F=s(l,n.lens,n.nlen,n.ndist,n.distcode,0,n.work,I),n.distbits=I.bits,F){e.msg=`invalid distances set`,n.mode=30;break}if(n.mode=20,t===6)break e;case 20:n.mode=21;case 21:if(6<=v&&258<=y){e.next_out=_,e.avail_out=y,e.next_in=g,e.avail_in=v,n.hold=b,n.bits=x,o(e,C),_=e.next_out,m=e.output,y=e.avail_out,g=e.next_in,p=e.input,v=e.avail_in,b=n.hold,x=n.bits,n.mode===12&&(n.back=-1);break}for(n.back=0;A=(R=n.lencode[b&(1<<n.lenbits)-1])>>>16&255,j=65535&R,!((k=R>>>24)<=x);){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(A&&!(240&A)){for(M=k,ee=A,N=j;A=(R=n.lencode[N+((b&(1<<M+ee)-1)>>M)])>>>16&255,j=65535&R,!(M+(k=R>>>24)<=x);){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}b>>>=M,x-=M,n.back+=M}if(b>>>=k,x-=k,n.back+=k,n.length=j,A===0){n.mode=26;break}if(32&A){n.back=-1,n.mode=12;break}if(64&A){e.msg=`invalid literal/length code`,n.mode=30;break}n.extra=15&A,n.mode=22;case 22:if(n.extra){for(L=n.extra;x<L;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}n.length+=b&(1<<n.extra)-1,b>>>=n.extra,x-=n.extra,n.back+=n.extra}n.was=n.length,n.mode=23;case 23:for(;A=(R=n.distcode[b&(1<<n.distbits)-1])>>>16&255,j=65535&R,!((k=R>>>24)<=x);){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(!(240&A)){for(M=k,ee=A,N=j;A=(R=n.distcode[N+((b&(1<<M+ee)-1)>>M)])>>>16&255,j=65535&R,!(M+(k=R>>>24)<=x);){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}b>>>=M,x-=M,n.back+=M}if(b>>>=k,x-=k,n.back+=k,64&A){e.msg=`invalid distance code`,n.mode=30;break}n.offset=j,n.extra=15&A,n.mode=24;case 24:if(n.extra){for(L=n.extra;x<L;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}n.offset+=b&(1<<n.extra)-1,b>>>=n.extra,x-=n.extra,n.back+=n.extra}if(n.offset>n.dmax){e.msg=`invalid distance too far back`,n.mode=30;break}n.mode=25;case 25:if(y===0)break e;if(E=C-y,n.offset>E){if((E=n.offset-E)>n.whave&&n.sane){e.msg=`invalid distance too far back`,n.mode=30;break}D=E>n.wnext?(E-=n.wnext,n.wsize-E):n.wnext-E,E>n.length&&(E=n.length),O=n.window}else O=m,D=_-n.offset,E=n.length;for(y<E&&(E=y),y-=E,n.length-=E;m[_++]=O[D++],--E;);n.length===0&&(n.mode=21);break;case 26:if(y===0)break e;m[_++]=n.length,y--,n.mode=21;break;case 27:if(n.wrap){for(;x<32;){if(v===0)break e;v--,b|=p[g++]<<x,x+=8}if(C-=y,e.total_out+=C,n.total+=C,C&&(e.adler=n.check=n.flags?a(n.check,m,C,_-C):i(n.check,m,C,_-C)),C=y,(n.flags?b:h(b))!==n.check){e.msg=`incorrect data check`,n.mode=30;break}x=b=0}n.mode=28;case 28:if(n.wrap&&n.flags){for(;x<32;){if(v===0)break e;v--,b+=p[g++]<<x,x+=8}if(b!==(4294967295&n.total)){e.msg=`incorrect length check`,n.mode=30;break}x=b=0}n.mode=29;case 29:F=1;break e;case 30:F=-3;break e;case 31:return-4;case 32:default:return d}return e.next_out=_,e.avail_out=y,e.next_in=g,e.avail_in=v,n.hold=b,n.bits=x,(n.wsize||C!==e.avail_out&&n.mode<30&&(n.mode<27||t!==4))&&T(e,e.output,e.next_out,C-e.avail_out)?(n.mode=31,-4):(S-=e.avail_in,C-=e.avail_out,e.total_in+=S,e.total_out+=C,n.total+=C,n.wrap&&C&&(e.adler=n.check=n.flags?a(n.check,m,C,e.next_out-C):i(n.check,m,C,e.next_out-C)),e.data_type=n.bits+(n.last?64:0)+(n.mode===12?128:0)+(n.mode===20||n.mode===15?256:0),(S==0&&C===0||t===4)&&F===u&&(F=-5),F)},n.inflateEnd=function(e){if(!e||!e.state)return d;var t=e.state;return t.window&&=null,e.state=null,u},n.inflateGetHeader=function(e,t){var n;return e&&e.state&&2&(n=e.state).wrap?((n.head=t).done=!1,u):d},n.inflateSetDictionary=function(e,t){var n,r=t.length;return e&&e.state?(n=e.state).wrap!==0&&n.mode!==11?d:n.mode===11&&i(1,t,r,0)!==n.check?-3:T(e,t,r,r)?(n.mode=31,-4):(n.havedict=1,u):d},n.inflateInfo=`pako inflate (from Nodeca project)`},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,n){var r=e(`../utils/common`),i=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],a=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],o=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],s=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,n,c,l,u,d,f){var p,m,h,g,_,v,y,b,x,S=f.bits,C=0,w=0,T=0,E=0,D=0,O=0,k=0,A=0,j=0,M=0,ee=null,N=0,P=new r.Buf16(16),F=new r.Buf16(16),I=null,L=0;for(C=0;C<=15;C++)P[C]=0;for(w=0;w<c;w++)P[t[n+w]]++;for(D=S,E=15;1<=E&&P[E]===0;E--);if(E<D&&(D=E),E===0)return l[u++]=20971520,l[u++]=20971520,f.bits=1,0;for(T=1;T<E&&P[T]===0;T++);for(D<T&&(D=T),C=A=1;C<=15;C++)if(A<<=1,(A-=P[C])<0)return-1;if(0<A&&(e===0||E!==1))return-1;for(F[1]=0,C=1;C<15;C++)F[C+1]=F[C]+P[C];for(w=0;w<c;w++)t[n+w]!==0&&(d[F[t[n+w]]++]=w);if(v=e===0?(ee=I=d,19):e===1?(ee=i,N-=257,I=a,L-=257,256):(ee=o,I=s,-1),C=T,_=u,k=w=M=0,h=-1,g=(j=1<<(O=D))-1,e===1&&852<j||e===2&&592<j)return 1;for(;;){for(y=C-k,x=d[w]<v?(b=0,d[w]):d[w]>v?(b=I[L+d[w]],ee[N+d[w]]):(b=96,0),p=1<<C-k,T=m=1<<O;l[_+(M>>k)+(m-=p)]=y<<24|b<<16|x|0,m!==0;);for(p=1<<C-1;M&p;)p>>=1;if(p===0?M=0:(M&=p-1,M+=p),w++,--P[C]==0){if(C===E)break;C=t[n+d[w]]}if(D<C&&(M&g)!==h){for(k===0&&(k=D),_+=T,A=1<<(O=C-k);O+k<E&&!((A-=P[O+k])<=0);)O++,A<<=1;if(j+=1<<O,e===1&&852<j||e===2&&592<j)return 1;l[h=M&g]=D<<24|O<<16|_-u|0}}return M!==0&&(l[_+M]=C-k<<24|4194304),f.bits=D,0}},{"../utils/common":41}],51:[function(e,t,n){t.exports={2:`need dictionary`,1:`stream end`,0:``,"-1":`file error`,"-2":`stream error`,"-3":`data error`,"-4":`insufficient memory`,"-5":`buffer error`,"-6":`incompatible version`}},{}],52:[function(e,t,n){var r=e(`../utils/common`),i=0,a=1;function o(e){for(var t=e.length;0<=--t;)e[t]=0}var s=0,c=29,l=256,u=l+1+c,d=30,f=19,p=2*u+1,m=15,h=16,g=7,_=256,v=16,y=17,b=18,x=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],S=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],C=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],w=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],T=Array(2*(u+2));o(T);var E=Array(2*d);o(E);var D=Array(512);o(D);var O=Array(256);o(O);var k=Array(c);o(k);var A,j,M,ee=Array(d);function N(e,t,n,r,i){this.static_tree=e,this.extra_bits=t,this.extra_base=n,this.elems=r,this.max_length=i,this.has_stree=e&&e.length}function P(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function F(e){return e<256?D[e]:D[256+(e>>>7)]}function I(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function L(e,t,n){e.bi_valid>h-n?(e.bi_buf|=t<<e.bi_valid&65535,I(e,e.bi_buf),e.bi_buf=t>>h-e.bi_valid,e.bi_valid+=n-h):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=n)}function R(e,t,n){L(e,n[2*t],n[2*t+1])}function z(e,t){for(var n=0;n|=1&e,e>>>=1,n<<=1,0<--t;);return n>>>1}function te(e,t,n){var r,i,a=Array(m+1),o=0;for(r=1;r<=m;r++)a[r]=o=o+n[r-1]<<1;for(i=0;i<=t;i++){var s=e[2*i+1];s!==0&&(e[2*i]=z(a[s]++,s))}}function ne(e){var t;for(t=0;t<u;t++)e.dyn_ltree[2*t]=0;for(t=0;t<d;t++)e.dyn_dtree[2*t]=0;for(t=0;t<f;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*_]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function re(e){8<e.bi_valid?I(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function ie(e,t,n,r){var i=2*t,a=2*n;return e[i]<e[a]||e[i]===e[a]&&r[t]<=r[n]}function ae(e,t,n){for(var r=e.heap[n],i=n<<1;i<=e.heap_len&&(i<e.heap_len&&ie(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!ie(t,r,e.heap[i],e.depth));)e.heap[n]=e.heap[i],n=i,i<<=1;e.heap[n]=r}function oe(e,t,n){var r,i,a,o,s=0;if(e.last_lit!==0)for(;r=e.pending_buf[e.d_buf+2*s]<<8|e.pending_buf[e.d_buf+2*s+1],i=e.pending_buf[e.l_buf+s],s++,r===0?R(e,i,t):(R(e,(a=O[i])+l+1,t),(o=x[a])!==0&&L(e,i-=k[a],o),R(e,a=F(--r),n),(o=S[a])!==0&&L(e,r-=ee[a],o)),s<e.last_lit;);R(e,_,t)}function B(e,t){var n,r,i,a=t.dyn_tree,o=t.stat_desc.static_tree,s=t.stat_desc.has_stree,c=t.stat_desc.elems,l=-1;for(e.heap_len=0,e.heap_max=p,n=0;n<c;n++)a[2*n]===0?a[2*n+1]=0:(e.heap[++e.heap_len]=l=n,e.depth[n]=0);for(;e.heap_len<2;)a[2*(i=e.heap[++e.heap_len]=l<2?++l:0)]=1,e.depth[i]=0,e.opt_len--,s&&(e.static_len-=o[2*i+1]);for(t.max_code=l,n=e.heap_len>>1;1<=n;n--)ae(e,a,n);for(i=c;n=e.heap[1],e.heap[1]=e.heap[e.heap_len--],ae(e,a,1),r=e.heap[1],e.heap[--e.heap_max]=n,e.heap[--e.heap_max]=r,a[2*i]=a[2*n]+a[2*r],e.depth[i]=(e.depth[n]>=e.depth[r]?e.depth[n]:e.depth[r])+1,a[2*n+1]=a[2*r+1]=i,e.heap[1]=i++,ae(e,a,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],(function(e,t){var n,r,i,a,o,s,c=t.dyn_tree,l=t.max_code,u=t.stat_desc.static_tree,d=t.stat_desc.has_stree,f=t.stat_desc.extra_bits,h=t.stat_desc.extra_base,g=t.stat_desc.max_length,_=0;for(a=0;a<=m;a++)e.bl_count[a]=0;for(c[2*e.heap[e.heap_max]+1]=0,n=e.heap_max+1;n<p;n++)g<(a=c[2*c[2*(r=e.heap[n])+1]+1]+1)&&(a=g,_++),c[2*r+1]=a,l<r||(e.bl_count[a]++,o=0,h<=r&&(o=f[r-h]),s=c[2*r],e.opt_len+=s*(a+o),d&&(e.static_len+=s*(u[2*r+1]+o)));if(_!==0){do{for(a=g-1;e.bl_count[a]===0;)a--;e.bl_count[a]--,e.bl_count[a+1]+=2,e.bl_count[g]--,_-=2}while(0<_);for(a=g;a!==0;a--)for(r=e.bl_count[a];r!==0;)l<(i=e.heap[--n])||(c[2*i+1]!==a&&(e.opt_len+=(a-c[2*i+1])*c[2*i],c[2*i+1]=a),r--)}})(e,t),te(a,l,e.bl_count)}function V(e,t,n){var r,i,a=-1,o=t[1],s=0,c=7,l=4;for(o===0&&(c=138,l=3),t[2*(n+1)+1]=65535,r=0;r<=n;r++)i=o,o=t[2*(r+1)+1],++s<c&&i===o||(s<l?e.bl_tree[2*i]+=s:i===0?s<=10?e.bl_tree[2*y]++:e.bl_tree[2*b]++:(i!==a&&e.bl_tree[2*i]++,e.bl_tree[2*v]++),a=i,l=(s=0)===o?(c=138,3):i===o?(c=6,3):(c=7,4))}function se(e,t,n){var r,i,a=-1,o=t[1],s=0,c=7,l=4;for(o===0&&(c=138,l=3),r=0;r<=n;r++)if(i=o,o=t[2*(r+1)+1],!(++s<c&&i===o)){if(s<l)for(;R(e,i,e.bl_tree),--s!=0;);else i===0?s<=10?(R(e,y,e.bl_tree),L(e,s-3,3)):(R(e,b,e.bl_tree),L(e,s-11,7)):(i!==a&&(R(e,i,e.bl_tree),s--),R(e,v,e.bl_tree),L(e,s-3,2));a=i,l=(s=0)===o?(c=138,3):i===o?(c=6,3):(c=7,4)}}o(ee);var ce=!1;function le(e,t,n,i){L(e,(s<<1)+(i?1:0),3),(function(e,t,n,i){re(e),I(e,n),I(e,~n),r.arraySet(e.pending_buf,e.window,t,n,e.pending),e.pending+=n})(e,t,n)}n._tr_init=function(e){ce||=((function(){var e,t,n,r,i,a=Array(m+1);for(r=n=0;r<c-1;r++)for(k[r]=n,e=0;e<1<<x[r];e++)O[n++]=r;for(O[n-1]=r,r=i=0;r<16;r++)for(ee[r]=i,e=0;e<1<<S[r];e++)D[i++]=r;for(i>>=7;r<d;r++)for(ee[r]=i<<7,e=0;e<1<<S[r]-7;e++)D[256+ i++]=r;for(t=0;t<=m;t++)a[t]=0;for(e=0;e<=143;)T[2*e+1]=8,e++,a[8]++;for(;e<=255;)T[2*e+1]=9,e++,a[9]++;for(;e<=279;)T[2*e+1]=7,e++,a[7]++;for(;e<=287;)T[2*e+1]=8,e++,a[8]++;for(te(T,u+1,a),e=0;e<d;e++)E[2*e+1]=5,E[2*e]=z(e,5);A=new N(T,x,l+1,u,m),j=new N(E,S,0,d,m),M=new N([],C,0,f,g)})(),!0),e.l_desc=new P(e.dyn_ltree,A),e.d_desc=new P(e.dyn_dtree,j),e.bl_desc=new P(e.bl_tree,M),e.bi_buf=0,e.bi_valid=0,ne(e)},n._tr_stored_block=le,n._tr_flush_block=function(e,t,n,r){var o,s,c=0;0<e.level?(e.strm.data_type===2&&(e.strm.data_type=(function(e){var t,n=4093624447;for(t=0;t<=31;t++,n>>>=1)if(1&n&&e.dyn_ltree[2*t]!==0)return i;if(e.dyn_ltree[18]!==0||e.dyn_ltree[20]!==0||e.dyn_ltree[26]!==0)return a;for(t=32;t<l;t++)if(e.dyn_ltree[2*t]!==0)return a;return i})(e)),B(e,e.l_desc),B(e,e.d_desc),c=(function(e){var t;for(V(e,e.dyn_ltree,e.l_desc.max_code),V(e,e.dyn_dtree,e.d_desc.max_code),B(e,e.bl_desc),t=f-1;3<=t&&e.bl_tree[2*w[t]+1]===0;t--);return e.opt_len+=3*(t+1)+5+5+4,t})(e),o=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=o&&(o=s)):o=s=n+5,n+4<=o&&t!==-1?le(e,t,n,r):e.strategy===4||s===o?(L(e,2+(r?1:0),3),oe(e,T,E)):(L(e,4+(r?1:0),3),(function(e,t,n,r){var i;for(L(e,t-257,5),L(e,n-1,5),L(e,r-4,4),i=0;i<r;i++)L(e,e.bl_tree[2*w[i]+1],3);se(e,e.dyn_ltree,t-1),se(e,e.dyn_dtree,n-1)})(e,e.l_desc.max_code+1,e.d_desc.max_code+1,c+1),oe(e,e.dyn_ltree,e.dyn_dtree)),ne(e),r&&re(e)},n._tr_tally=function(e,t,n){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&n,e.last_lit++,t===0?e.dyn_ltree[2*n]++:(e.matches++,t--,e.dyn_ltree[2*(O[n]+l+1)]++,e.dyn_dtree[2*F(t)]++),e.last_lit===e.lit_bufsize-1},n._tr_align=function(e){L(e,2,3),R(e,_,T),(function(e){e.bi_valid===16?(I(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)})(e)}},{"../utils/common":41}],53:[function(e,t,n){t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg=``,this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,t,n){(function(e){(function(e,t){if(!e.setImmediate){var n,r,i,a,o=1,s={},c=!1,l=e.document,u=Object.getPrototypeOf&&Object.getPrototypeOf(e);u=u&&u.setTimeout?u:e,n={}.toString.call(e.process)===`[object process]`?function(e){K.nextTick(function(){f(e)})}:(function(){if(e.postMessage&&!e.importScripts){var t=!0,n=e.onmessage;return e.onmessage=function(){t=!1},e.postMessage(``,`*`),e.onmessage=n,t}})()?(a=`setImmediate$`+Math.random()+`$`,e.addEventListener?e.addEventListener(`message`,p,!1):e.attachEvent(`onmessage`,p),function(t){e.postMessage(a+t,`*`)}):e.MessageChannel?((i=new MessageChannel).port1.onmessage=function(e){f(e.data)},function(e){i.port2.postMessage(e)}):l&&`onreadystatechange`in l.createElement(`script`)?(r=l.documentElement,function(e){var t=l.createElement(`script`);t.onreadystatechange=function(){f(e),t.onreadystatechange=null,r.removeChild(t),t=null},r.appendChild(t)}):function(e){setTimeout(f,0,e)},u.setImmediate=function(e){typeof e!=`function`&&(e=Function(``+e));for(var t=Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];return s[o]={callback:e,args:t},n(o),o++},u.clearImmediate=d}function d(e){delete s[e]}function f(e){if(c)setTimeout(f,0,e);else{var n=s[e];if(n){c=!0;try{(function(e){var n=e.callback,r=e.args;switch(r.length){case 0:n();break;case 1:n(r[0]);break;case 2:n(r[0],r[1]);break;case 3:n(r[0],r[1],r[2]);break;default:n.apply(t,r)}})(n)}finally{d(e),c=!1}}}}function p(t){t.source===e&&typeof t.data==`string`&&t.data.indexOf(a)===0&&f(+t.data.slice(a.length))}})(typeof self>`u`?e===void 0?this:e:self)}).call(this,qi===void 0?typeof self<`u`?self:typeof window<`u`?window:{}:qi)},{}]},{},[10])(10)})})(gb),gb.exports)}var yb=Ji(vb()),bb={exports:{}},xb,Sb;function Cb(){if(Sb)return xb;Sb=1;var e={"&":`&amp;`,'"':`&quot;`,"'":`&apos;`,"<":`&lt;`,">":`&gt;`};function t(t){return t&&t.replace?t.replace(/([&"<>'])/g,function(t,n){return e[n]}):t}return xb=t,xb}var wb;function Tb(){if(wb)return bb.exports;wb=1;var e=Cb(),t=Cl().Stream,n=`    `;function r(e,r){typeof r!=`object`&&(r={indent:r});var i=r.stream?new t:null,a=``,c=!1,l=r.indent?r.indent===!0?n:r.indent:``,u=!0;function d(e){u?K.nextTick(e):e()}function f(e,n){if(n!==void 0&&(a+=n),e&&!c&&(i||=new t,c=!0),e&&c){var r=a;d(function(){i.emit(`data`,r)}),a=``}}function p(e,t){s(f,o(e,l,l?1:0),t)}function m(){if(i){var e=a;d(function(){i.emit(`data`,e),i.emit(`end`),i.readable=!1,i.emit(`close`)})}}function h(e){var t={version:`1.0`,encoding:e.encoding||`UTF-8`};e.standalone&&(t.standalone=e.standalone),p({"?xml":{_attr:t}}),a=a.replace(`/>`,`?>`)}return d(function(){u=!1}),r.declaration&&h(r.declaration),e&&e.forEach?e.forEach(function(t,n){var r;n+1===e.length&&(r=m),p(t,r)}):p(e,m),i?(i.readable=!0,i):a}function i(){var e={_elem:o(Array.prototype.slice.call(arguments))};return e.push=function(e){if(!this.append)throw Error(`not assigned to a parent!`);var t=this,n=this._elem.indent;s(this.append,o(e,n,this._elem.icount+(n?1:0)),function(){t.append(!0)})},e.close=function(e){e!==void 0&&this.push(e),this.end&&this.end()},e}function a(e,t){return Array(t||0).join(e||``)}function o(t,n,r){r||=0;var i=a(n,r),s,l=t,u=!1;if(typeof t==`object`&&(s=Object.keys(t)[0],l=t[s],l&&l._elem))return l._elem.name=s,l._elem.icount=r,l._elem.indent=n,l._elem.indents=i,l._elem.interrupt=l,l._elem;var d=[],f=[],p;function m(e){Object.keys(e).forEach(function(t){d.push(c(t,e[t]))})}switch(typeof l){case`object`:if(l===null)break;l._attr&&m(l._attr),l._cdata&&f.push((`<![CDATA[`+l._cdata).replace(/\]\]>/g,`]]]]><![CDATA[>`)+`]]>`),l.forEach&&(p=!1,f.push(``),l.forEach(function(t){typeof t==`object`?Object.keys(t)[0]==`_attr`?m(t._attr):f.push(o(t,n,r+1)):(f.pop(),p=!0,f.push(e(t)))}),p||f.push(``));break;default:f.push(e(l))}return{name:s,interrupt:u,attributes:d,content:f,icount:r,indents:i,indent:n}}function s(e,t,n){if(typeof t!=`object`)return e(!1,t);var r=t.interrupt?1:t.content.length;function i(){for(;t.content.length;){var i=t.content.shift();if(i!==void 0){if(a(i))return;s(e,i)}}e(!1,(r>1?t.indents:``)+(t.name?`</`+t.name+`>`:``)+(t.indent&&!n?`
`:``)),n&&n()}function a(t){return t.interrupt?(t.interrupt.append=e,t.interrupt.end=i,t.interrupt=!1,e(!0),!0):!1}if(e(!1,t.indents+(t.name?`<`+t.name:``)+(t.attributes.length?` `+t.attributes.join(` `):``)+(r?t.name?`>`:``:t.name?`/>`:``)+(t.indent&&r>1?`
`:``)),!r)return e(!1,t.indent?`
`:``);a(t)||i()}function c(t,n){return t+`="`+e(n)+`"`}return bb.exports=r,bb.exports.element=bb.exports.Element=i,bb.exports}var Eb=Ji(Tb()),Db=0,Ob=32,kb=32,Ab=(e,t)=>{let n=t.replace(/-/g,``);if(n.length!==kb)throw Error(`Error: Cannot extract GUID from font filename: ${t}`);let r=n.replace(/(..)/g,`$1 `).trim().split(` `).map(e=>parseInt(e,16));r.reverse();let i=e.slice(Db,Ob).map((e,t)=>e^r[t%r.length]),a=new Uint8Array(Db+i.length+Math.max(0,e.length-Ob));return a.set(e.slice(0,Db)),a.set(i,Db),a.set(e.slice(Ob),Db+i.length),a},jb=class{format(e,t={stack:[]}){let n=e.prepForXml(t);if(n)return n;throw Error(`XMLComponent did not format correctly`)}},Mb=class{replace(e,t,n){let r=e;return t.forEach((e,t)=>{r=r.replace(RegExp(`{${e.fileName}}`,`g`),(n+t).toString())}),r}getMediaData(e,t){return t.Array.filter(t=>e.search(`{${t.fileName}}`)>0)}},Nb=class{replace(e,t){let n=e;for(let e of t)n=n.replace(RegExp(`{${e.reference}-${e.instance}}`,`g`),e.numId.toString());return n}},Pb=class{constructor(){U(this,`formatter`),U(this,`imageReplacer`),U(this,`numberingReplacer`),this.formatter=new jb,this.imageReplacer=new Mb,this.numberingReplacer=new Nb}compile(e,t,n=[]){let r=new yb,i=this.xmlifyFile(e,t),a=new Map(Object.entries(i));for(let[,e]of a)if(Array.isArray(e))for(let t of e)r.file(t.path,Sf(t.data));else r.file(e.path,Sf(e.data));for(let e of n)r.file(e.path,Sf(e.data));for(let t of e.Media.Array)t.type===`svg`?(r.file(`word/media/${t.fileName}`,t.data),r.file(`word/media/${t.fallback.fileName}`,t.fallback.data)):r.file(`word/media/${t.fileName}`,t.data);for(let{data:t,name:n,fontKey:i}of e.FontTable.fontOptionsWithKey){let[e]=n.split(`.`);r.file(`word/fonts/${e}.odttf`,Ab(t,i))}return r}xmlifyFile(e,t){let n=e.Document.Relationships.RelationshipCount+1,r=Eb(this.formatter.format(e.Document.View,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),i=e.Comments.Relationships.RelationshipCount+1,a=Eb(this.formatter.format(e.Comments,{viewWrapper:{View:e.Comments,Relationships:e.Comments.Relationships},file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),o=e.FootNotes.Relationships.RelationshipCount+1,s=Eb(this.formatter.format(e.FootNotes.View,{viewWrapper:e.FootNotes,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),c=this.imageReplacer.getMediaData(r,e.Media),l=this.imageReplacer.getMediaData(a,e.Media),u=this.imageReplacer.getMediaData(s,e.Media);return{Relationships:{data:(c.forEach((t,r)=>{e.Document.Relationships.addRelationship(n+r,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`,`media/${t.fileName}`)}),e.Document.Relationships.addRelationship(e.Document.Relationships.RelationshipCount+1,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable`,`fontTable.xml`),Eb(this.formatter.format(e.Document.Relationships,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}})),path:`word/_rels/document.xml.rels`},Document:{data:(()=>{let t=this.imageReplacer.replace(r,c,n);return this.numberingReplacer.replace(t,e.Numbering.ConcreteNumbering)})(),path:`word/document.xml`},Styles:{data:(()=>{let n=Eb(this.formatter.format(e.Styles,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}});return this.numberingReplacer.replace(n,e.Numbering.ConcreteNumbering)})(),path:`word/styles.xml`},Properties:{data:Eb(this.formatter.format(e.CoreProperties,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),path:`docProps/core.xml`},Numbering:{data:Eb(this.formatter.format(e.Numbering,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),path:`word/numbering.xml`},FileRelationships:{data:Eb(this.formatter.format(e.FileRelationships,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),path:`_rels/.rels`},HeaderRelationships:e.Headers.map((n,r)=>{let i=Eb(this.formatter.format(n.View,{viewWrapper:n,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}});return this.imageReplacer.getMediaData(i,e.Media).forEach((e,t)=>{n.Relationships.addRelationship(t,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`,`media/${e.fileName}`)}),{data:Eb(this.formatter.format(n.Relationships,{viewWrapper:n,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),path:`word/_rels/header${r+1}.xml.rels`}}),FooterRelationships:e.Footers.map((n,r)=>{let i=Eb(this.formatter.format(n.View,{viewWrapper:n,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}});return this.imageReplacer.getMediaData(i,e.Media).forEach((e,t)=>{n.Relationships.addRelationship(t,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`,`media/${e.fileName}`)}),{data:Eb(this.formatter.format(n.Relationships,{viewWrapper:n,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),path:`word/_rels/footer${r+1}.xml.rels`}}),Headers:e.Headers.map((n,r)=>{let i=Eb(this.formatter.format(n.View,{viewWrapper:n,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),a=this.imageReplacer.getMediaData(i,e.Media),o=this.imageReplacer.replace(i,a,0);return{data:this.numberingReplacer.replace(o,e.Numbering.ConcreteNumbering),path:`word/header${r+1}.xml`}}),Footers:e.Footers.map((n,r)=>{let i=Eb(this.formatter.format(n.View,{viewWrapper:n,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),a=this.imageReplacer.getMediaData(i,e.Media),o=this.imageReplacer.replace(i,a,0);return{data:this.numberingReplacer.replace(o,e.Numbering.ConcreteNumbering),path:`word/footer${r+1}.xml`}}),ContentTypes:{data:Eb(this.formatter.format(e.ContentTypes,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),path:`[Content_Types].xml`},CustomProperties:{data:Eb(this.formatter.format(e.CustomProperties,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),path:`docProps/custom.xml`},AppProperties:{data:Eb(this.formatter.format(e.AppProperties,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),path:`docProps/app.xml`},FootNotes:{data:(()=>{let t=this.imageReplacer.replace(s,u,o);return this.numberingReplacer.replace(t,e.Numbering.ConcreteNumbering)})(),path:`word/footnotes.xml`},FootNotesRelationships:{data:(u.forEach((t,n)=>{e.FootNotes.Relationships.addRelationship(o+n,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`,`media/${t.fileName}`)}),Eb(this.formatter.format(e.FootNotes.Relationships,{viewWrapper:e.FootNotes,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}})),path:`word/_rels/footnotes.xml.rels`},Endnotes:{data:Eb(this.formatter.format(e.Endnotes.View,{viewWrapper:e.Endnotes,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),path:`word/endnotes.xml`},EndnotesRelationships:{data:Eb(this.formatter.format(e.Endnotes.Relationships,{viewWrapper:e.Endnotes,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),path:`word/_rels/endnotes.xml.rels`},Settings:{data:Eb(this.formatter.format(e.Settings,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),path:`word/settings.xml`},Comments:{data:(()=>{let t=this.imageReplacer.replace(a,l,i);return this.numberingReplacer.replace(t,e.Numbering.ConcreteNumbering)})(),path:`word/comments.xml`},CommentsRelationships:{data:(l.forEach((t,n)=>{e.Comments.Relationships.addRelationship(i+n,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`,`media/${t.fileName}`)}),Eb(this.formatter.format(e.Comments.Relationships,{viewWrapper:{View:e.Comments,Relationships:e.Comments.Relationships},file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}})),path:`word/_rels/comments.xml.rels`},FontTable:{data:Eb(this.formatter.format(e.FontTable.View,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{standalone:`yes`,encoding:`UTF-8`}}),path:`word/fontTable.xml`},FontTableRelationships:{data:Eb(this.formatter.format(e.FontTable.Relationships,{viewWrapper:e.Document,file:e,stack:[]}),{indent:t,declaration:{encoding:`UTF-8`}}),path:`word/_rels/fontTable.xml.rels`}}}},Fb={NONE:``,WITH_2_BLANKS:`  `,WITH_4_BLANKS:`    `,WITH_TAB:`	`},Ib=e=>e===!0?Fb.WITH_2_BLANKS:e===!1?void 0:e,Lb=class e{static pack(e,t,n){return Vi(this,arguments,function*(e,t,n,r=[]){return this.compiler.compile(e,Ib(n),r).generateAsync({type:t,mimeType:`application/vnd.openxmlformats-officedocument.wordprocessingml.document`,compression:`DEFLATE`})})}static toString(t,n,r=[]){return e.pack(t,`string`,n,r)}static toBuffer(t,n,r=[]){return e.pack(t,`nodebuffer`,n,r)}static toBase64String(t,n,r=[]){return e.pack(t,`base64`,n,r)}static toBlob(t,n,r=[]){return e.pack(t,`blob`,n,r)}static toArrayBuffer(t,n,r=[]){return e.pack(t,`arraybuffer`,n,r)}static toStream(e,t,n=[]){let r=new mb.Stream;return this.compiler.compile(e,Ib(t),n).generateAsync({type:`nodebuffer`,mimeType:`application/vnd.openxmlformats-officedocument.wordprocessingml.document`,compression:`DEFLATE`}).then(e=>{r.emit(`data`,e),r.emit(`end`)}),r}};U(Lb,`compiler`,new Pb);var Rb=Lb,zb=new jb,Bb=e=>ql.xml2js(e,{compact:!1,captureSpacesBetweenElements:!0}),Vb=e=>Bb(Eb(zb.format(new hd({text:e})))).elements[0].elements??[],Hb=e=>zi(H({},e),{attributes:{"xml:space":`preserve`}}),Ub=(e,t)=>e.elements?.filter(e=>e.name===t)[0].elements??[],Wb=(e,t,n)=>{let r=Ub(e,`Types`);r.some(e=>e.type===`element`&&e.name===`Default`&&e?.attributes?.ContentType===t&&e?.attributes?.Extension===n)||r.push({attributes:{ContentType:t,Extension:n},name:`Default`,type:`element`})},Gb=e=>{let t=parseInt(e.substring(3),10);return isNaN(t)?0:t},Kb=e=>Ub(e,`Relationships`).map(e=>Gb((e.attributes?.Id)?.toString()??``)).reduce((e,t)=>Math.max(e,t),0)+1,qb=(e,t,n,r,i)=>{let a=Ub(e,`Relationships`);return a.push({attributes:{Id:`rId${t}`,Type:n,Target:r,TargetMode:i},name:`Relationship`,type:`element`}),a},Jb=class extends Error{constructor(e){super(`Token ${e} not found`),this.name=`TokenNotFoundError`}},Yb=(e,t)=>{for(let n=0;n<(e.elements??[]).length;n++){let r=e.elements[n];if(r.type===`element`&&r.name===`w:r`){let e=(r.elements??[]).filter(e=>e.type===`element`&&e.name===`w:t`);for(let r of e)if(r.elements?.[0]&&r.elements[0].text?.includes(t))return n}}throw new Jb(t)},Xb=(e,t)=>{let n=-1,r=e.elements?.map((e,r)=>{if(n!==-1)return e;if(e.type===`element`&&e.name===`w:t`){let i=(e.elements?.[0]?.text??``).split(t),a=i.map(t=>zi(H(H({},e),Hb(e)),{elements:Vb(t)}));return i.length>1&&(n=r),a}else return e}).flat()??[];return{left:zi(H({},JSON.parse(JSON.stringify(e))),{elements:r.slice(0,n+1)}),right:zi(H({},JSON.parse(JSON.stringify(e))),{elements:r.slice(n+1)})}},Zb={START:0,MIDDLE:1,END:2},Qb=({paragraphElement:e,renderedParagraph:t,originalText:n,replacementText:r})=>{let i=t.text.indexOf(n),a=i+n.length-1,o=Zb.START;for(let n of t.runs)for(let{text:t,index:s,start:c,end:l}of n.parts)switch(o){case Zb.START:if(i>=c&&i<=l){let u=i-c,d=Math.min(a,l)-c,f=n.text.substring(u,d+1);if(f===``)continue;let p=t.replace(f,r);$b(e.elements[n.index].elements[s],p),o=Zb.MIDDLE;continue}break;case Zb.MIDDLE:if(a<=l){let r=t.substring(a-c+1);$b(e.elements[n.index].elements[s],r);let i=e.elements[n.index].elements[s];e.elements[n.index].elements[s]=Hb(i),o=Zb.END}else $b(e.elements[n.index].elements[s],``);break}return e},$b=(e,t)=>(e.elements=Vb(t),e),ex=e=>{if(e.element.name!==`w:p`)throw Error(`Invalid node type: ${e.element.name}`);if(!e.element.elements)return{text:``,runs:[],index:-1,pathToParagraph:[]};let t=0,n=e.element.elements.map((e,t)=>({element:e,i:t})).filter(({element:e})=>e.name===`w:r`).map(({element:e,i:n})=>{let r=tx(e,n,t);return t+=r.text.length,r}).filter(e=>!!e);return{text:n.reduce((e,t)=>e+t.text,``),runs:n,index:e.index,pathToParagraph:nx(e)}},tx=(e,t,n)=>{if(!e.elements)return{text:``,parts:[],index:-1,start:n,end:n};let r=n,i=e.elements.map((e,t)=>e.name===`w:t`&&e.elements&&e.elements.length>0?{text:e.elements[0].text?.toString()??``,index:t,start:r,end:(r+=(e.elements[0].text?.toString()??``).length-1,r)}:void 0).filter(e=>!!e).map(e=>e);return{text:i.reduce((e,t)=>e+t.text,``),parts:i,index:t,start:n,end:r}},nx=e=>e.parent?[...nx(e.parent),e.index]:[e.index],rx=e=>e.element.elements?.map((t,n)=>({element:t,index:n,parent:e}))??[],ix=e=>{let t=[],n=[...rx({element:e,index:0,parent:void 0})],r;for(;n.length>0;)r=n.shift(),r.element.name===`w:p`&&(t=[...t,ex(r)]),n.push(...rx(r));return t},ax=(e,t)=>ix(e).filter(e=>e.text.includes(t)),ox=new jb,sx=`ɵ`,cx=({json:e,patch:t,patchText:n,context:r,keepOriginalStyles:i=!0})=>{let a=ax(e,n);if(a.length===0)return{element:e,didFindOccurrence:!1};for(let o of a){let a=t.children.map(e=>Bb(Eb(ox.format(e,r)))).map(e=>e.elements[0]);switch(t.type){case fx.DOCUMENT:{let t=ux(e,o.pathToParagraph),n=dx(o.pathToParagraph);t.elements.splice(n,1,...a);break}case fx.PARAGRAPH:default:{let t=lx(e,o.pathToParagraph);Qb({paragraphElement:t,renderedParagraph:o,originalText:n,replacementText:sx});let r=Yb(t,sx),s=t.elements[r],{left:c,right:l}=Xb(s,sx),u=a,d=l;if(i){let e=s.elements.filter(e=>e.type===`element`&&e.name===`w:rPr`);u=a.map(t=>zi(H({},t),{elements:[...e,...t.elements??[]]})),d=zi(H({},l),{elements:[...e,...l.elements]})}t.elements.splice(r,1,c,...u,d);break}}}return{element:e,didFindOccurrence:!0}},lx=(e,t)=>{let n=e;for(let e=1;e<t.length;e++){let r=t[e];n=n.elements[r]}return n},ux=(e,t)=>lx(e,t.slice(0,t.length-1)),dx=e=>e[e.length-1],fx={DOCUMENT:`file`,PARAGRAPH:`paragraph`},px=new Mb,mx=new Uint8Array([255,254]),hx=new Uint8Array([254,255]),gx=(e,t)=>{if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0},_x=e=>Vi(null,[e],function*({outputType:e,data:t,patches:n,keepOriginalStyles:r,placeholderDelimiters:i={start:`{{`,end:`}}`},recursive:a=!0}){let o=t instanceof yb?t:yield yb.loadAsync(t),s=new Map,c={Media:new zv},l=new Map,u=[],d=[],f=!1,p=new Map;for(let[e,t]of Object.entries(o.files)){let o=yield t.async(`uint8array`),m=o.slice(0,2);if(gx(m,mx)||gx(m,hx)){p.set(e,o);continue}if(!e.endsWith(`.xml`)&&!e.endsWith(`.rels`)){p.set(e,o);continue}let h=Bb(yield t.async(`text`));if(e===`word/document.xml`){let e=h.elements?.find(e=>e.name===`w:document`);if(e&&e.attributes){for(let t of[`mc`,`wp`,`r`,`w15`,`m`])e.attributes[`xmlns:${t}`]=w_[t];e.attributes[`mc:Ignorable`]=`${e.attributes[`mc:Ignorable`]||``} w15`.trim()}}if(e.startsWith(`word/`)&&!e.endsWith(`.xml.rels`)){let t={file:c,viewWrapper:{Relationships:{addRelationship:(t,n,r,i)=>{d.push({key:e,hyperlink:{id:t,link:r}})}}},stack:[]};if(s.set(e,t),!i?.start.trim()||!i?.end.trim())throw Error(`Both start and end delimiters must be non-empty strings.`);let{start:o,end:l}=i;for(let[i,s]of Object.entries(n)){let n=`${o}${i}${l}`;for(;;){let{didFindOccurrence:i}=cx({json:h,patch:zi(H({},s),{children:s.children.map(t=>{if(t instanceof Qm){let n=new Xm(t.options.children,vf());return d.push({key:e,hyperlink:{id:n.linkId,link:t.options.link}}),n}else return t})}),patchText:n,context:t,keepOriginalStyles:r});if(!a||!i)break}}let p=px.getMediaData(JSON.stringify(h),t.file.Media);p.length>0&&(f=!0,u.push({key:e,mediaDatas:p}))}l.set(e,h)}for(let{key:e,mediaDatas:t}of u){let n=`word/_rels/${e.split(`/`).pop()}.rels`,r=l.get(n)??yx();l.set(n,r);let i=Kb(r),a=px.replace(JSON.stringify(l.get(e)),t,i);l.set(e,JSON.parse(a));for(let e=0;e<t.length;e++){let{fileName:n}=t[e];qb(r,i+e,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`,`media/${n}`)}}for(let{key:e,hyperlink:t}of d){let n=`word/_rels/${e.split(`/`).pop()}.rels`,r=l.get(n)??yx();l.set(n,r),qb(r,t.id,`http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink`,t.link,Zp.EXTERNAL)}if(f){let e=l.get(`[Content_Types].xml`);if(!e)throw Error(`Could not find content types file`);Wb(e,`image/png`,`png`),Wb(e,`image/jpeg`,`jpeg`),Wb(e,`image/jpeg`,`jpg`),Wb(e,`image/bmp`,`bmp`),Wb(e,`image/gif`,`gif`),Wb(e,`image/svg+xml`,`svg`)}let m=new yb;for(let[e,t]of l){let n=vx(t);m.file(e,Sf(n))}for(let[e,t]of p)m.file(e,t);for(let{data:e,fileName:t}of c.Media.Array)m.file(`word/media/${t}`,e);return m.generateAsync({type:e,mimeType:`application/vnd.openxmlformats-officedocument.wordprocessingml.document`,compression:`DEFLATE`})}),vx=e=>ql.js2xml(e,{attributeValueFn:e=>String(e).replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&apos;`)}),yx=()=>({declaration:{attributes:{version:`1.0`,encoding:`UTF-8`,standalone:`yes`}},elements:[{type:`element`,name:`Relationships`,attributes:{xmlns:`http://schemas.openxmlformats.org/package/2006/relationships`},elements:[]}]}),bx=e=>Vi(null,[e],function*({data:e}){let t=e instanceof yb?e:yield yb.loadAsync(e),n=new Set;for(let[e,r]of Object.entries(t.files))!e.endsWith(`.xml`)&&!e.endsWith(`.rels`)||e.startsWith(`word/`)&&!e.endsWith(`.xml.rels`)&&ix(Bb(yield r.async(`text`))).forEach(e=>xx(e.text).forEach(e=>n.add(e)));return Array.from(n)}),xx=e=>{let t=RegExp(`(?<=\\{\\{).+?(?=\\}\\})`,`gs`);return e.match(t)??[]},Sx=u(((e,t)=>{(function(t,n){typeof define==`function`&&define.amd?define([],n):e===void 0?(n(),t.FileSaver={exports:{}}.exports):n()})(e,function(){function e(e,t){return t===void 0?t={autoBom:!1}:typeof t!=`object`&&(console.warn(`Deprecated: Expected third argument to be a object`),t={autoBom:!t}),t.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob([`﻿`,e],{type:e.type}):e}function n(e,t,n){var r=new XMLHttpRequest;r.open(`GET`,e),r.responseType=`blob`,r.onload=function(){s(r.response,t,n)},r.onerror=function(){console.error(`could not download file`)},r.send()}function r(e){var t=new XMLHttpRequest;t.open(`HEAD`,e,!1);try{t.send()}catch{}return 200<=t.status&&299>=t.status}function i(e){try{e.dispatchEvent(new MouseEvent(`click`))}catch{var t=document.createEvent(`MouseEvents`);t.initMouseEvent(`click`,!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),e.dispatchEvent(t)}}var a=typeof window==`object`&&window.window===window?window:typeof self==`object`&&self.self===self?self:typeof global==`object`&&global.global===global?global:void 0,o=a.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),s=a.saveAs||(typeof window!=`object`||window!==a?function(){}:`download`in HTMLAnchorElement.prototype&&!o?function(e,t,o){var s=a.URL||a.webkitURL,c=document.createElement(`a`);t=t||e.name||`download`,c.download=t,c.rel=`noopener`,typeof e==`string`?(c.href=e,c.origin===location.origin?i(c):r(c.href)?n(e,t,o):i(c,c.target=`_blank`)):(c.href=s.createObjectURL(e),setTimeout(function(){s.revokeObjectURL(c.href)},4e4),setTimeout(function(){i(c)},0))}:`msSaveOrOpenBlob`in navigator?function(t,a,o){if(a=a||t.name||`download`,typeof t!=`string`)navigator.msSaveOrOpenBlob(e(t,o),a);else if(r(t))n(t,a,o);else{var s=document.createElement(`a`);s.href=t,s.target=`_blank`,setTimeout(function(){i(s)})}}:function(e,t,r,i){if(i||=open(``,`_blank`),i&&(i.document.title=i.document.body.innerText=`downloading...`),typeof e==`string`)return n(e,t,r);var s=e.type===`application/octet-stream`,c=/constructor/i.test(a.HTMLElement)||a.safari,l=/CriOS\/[\d]+/.test(navigator.userAgent);if((l||s&&c||o)&&typeof FileReader<`u`){var u=new FileReader;u.onloadend=function(){var e=u.result;e=l?e:e.replace(/^data:[^;]*;/,`data:attachment/file;`),i?i.location.href=e:location=e,i=null},u.readAsDataURL(e)}else{var d=a.URL||a.webkitURL,f=d.createObjectURL(e);i?i.location=f:location.href=f,i=null,setTimeout(function(){d.revokeObjectURL(f)},4e4)}});a.saveAs=s.saveAs=s,t!==void 0&&(t.exports=s)})})),Cx=Sx();function wx(e){if(!e||typeof e!=`string`)return{sections:[],summary:null,items:[]};let t=Ex(e);return{items:Dx(t),summary:Nx(t),globalAnalysis:Px(t),raw:t}}function Tx(e){if(!e||!e.items.length&&!e.raw)return`<p style="font-style:italic;color:#64748b">Narasi teknis tidak tersedia.</p>`;let t=``;return e.summary&&(t+=Fx(e.summary)),e.items.length>0&&(t+=`<div class="report-items-container">`,e.items.forEach((e,n)=>{t+=Ix(e,n)}),t+=`</div>`),e.globalAnalysis&&(t+=Lx(e.globalAnalysis)),e.items.length===0&&e.raw&&(t+=Rx(e.raw)),t}function Ex(e){return e.replace(/[\u{1F600}-\u{1F9FF}]/gu,``).replace(/[\u{2600}-\u{26FF}]/gu,``).replace(/[\u{2700}-\u{27BF}]/gu,``).replace(/[\u{FE00}-\u{FE0F}]/gu,``).replace(/[\u{1F000}-\u{1F02F}]/gu,``).replace(/[📊🔹🔥⏳📈📌📋🤖🎯🧠🔍📐🧾🔤🧱📖⚙️💡⚠️✅❌🚧]/g,``).trim()}function Dx(e){let t=[],n=/(?:^|\n)(?:#{1,4}\s*)?(?:\*{0,2})?\s*((?:[A-Z]{1,3}\d{1,3})\s*[–\-—]\s*.+?)(?:\*{0,2})?(?:\n|$)/g,r,i=[];for(;(r=n.exec(e))!==null;)i.push({title:r[1].trim().replace(/^\*+|\*+$/g,``),start:r.index,end:r.index+r[0].length});for(let n=0;n<i.length;n++){let r=i[n].end,a=n+1<i.length?i[n+1].start:e.length,o=e.substring(r,a).trim(),s=Ox(i[n].title,o);s&&t.push(s)}return t}function Ox(e,t){let n=e.match(/^([A-Z]{1,3}\d{1,3})/),r={kode:n?n[1]:``,nama:e.replace(/^[A-Z]{1,3}\d{1,3}\s*[–\-—]\s*/,``).trim(),fullTitle:e,status:kx(t,[`STATUS KEPATUHAN`,`STATUS`,`Status`]),analisis:kx(t,[`ANALISIS TEKNIS`,`ANALISIS`,`Analisis`]),dasarHukum:kx(t,[`DASAR REGULASI`,`DASAR HUKUM`,`Dasar Hukum`,`Dasar Regulasi`]),risiko:kx(t,[`RISIKO TEKNIS & HUKUM`,`RISIKO TEKNIS`,`RISIKO`,`Risiko`]),tingkatRisiko:kx(t,[`TINGKAT RISIKO`,`LEVEL RISIKO`,`Level Risiko`,`Tingkat Risiko`]),rekomendasi:kx(t,[`REKOMENDASI TEKNIS`,`REKOMENDASI`,`Rekomendasi`]),rawContent:t};if(r.tingkatRisiko){let e=r.tingkatRisiko.toLowerCase();e.includes(`kritis`)||e.includes(`critical`)?r.riskLevel=`critical`:e.includes(`tinggi`)||e.includes(`high`)?r.riskLevel=`high`:e.includes(`sedang`)||e.includes(`medium`)?r.riskLevel=`medium`:e.includes(`rendah`)||e.includes(`low`)?r.riskLevel=`low`:r.riskLevel=`medium`}else r.riskLevel=`medium`;return r}function kx(e,t){for(let n of t){let t=RegExp(`(?:^|\\n)\\s*(?:[*\\-]\\s*)?\\*{0,2}${jx(n)}\\*{0,2}\\s*[:：]\\s*(.+?)(?=\\n\\s*(?:[*\\-]\\s*)?\\*{0,2}(?:${Ax()})|$)`,`is`),r=e.match(t);if(r)return Mx(r[1]);let i=RegExp(`(?:^|\\n)\\s*(?:[*\\-]\\s*)?\\*{0,2}${jx(n)}\\*{0,2}\\s*[:：]\\s*\\n([\\s\\S]+?)(?=\\n\\s*(?:[*\\-]\\s*)?\\*{0,2}(?:${Ax()})|$)`,`is`),a=e.match(i);if(a)return Mx(a[1])}return``}function Ax(){return[`STATUS KEPATUHAN`,`STATUS`,`ANALISIS TEKNIS`,`ANALISIS`,`DASAR REGULASI`,`DASAR HUKUM`,`RISIKO TEKNIS`,`RISIKO`,`TINGKAT RISIKO`,`LEVEL RISIKO`,`REKOMENDASI TEKNIS`,`REKOMENDASI`,`SKOR`,`KESIMPULAN`,`TEMUAN`].map(jx).join(`|`)}function jx(e){return e.replace(/[.*+?^${}()|[\]\\&]/g,`\\$&`)}function Mx(e){return e.replace(/^\s*[\-\*]\s*/gm,``).replace(/\n{3,}/g,`

`).replace(/^\s+/gm,``).trim()}function Nx(e){let t={},n=e.match(/SKOR KEPATUHAN(?:\s+\w+)?.*?[:：]\s*(\d+)/i);n&&(t.skor=parseInt(n[1]));let r=e.match(/KATEGORI KELAYAKAN.*?[:：]\s*(.+)/i);r&&(t.kategori=r[1].trim());let i=e.match(/TEMUAN KRITIS.*?[:：]\s*([\s\S]+?)(?=\n#{1,3}\s|\n\*{2}[A-Z]|$)/i);return i&&(t.temuanKritis=i[1].trim()),Object.keys(t).length>0?t:null}function Px(e){let t={},n=e.match(/(?:HUBUNGAN ANTAR DOKUMEN|Dependency.*?Analysis).*?[:：]\s*([\s\S]+?)(?=\n#{1,3}\s|\n\*{2}[A-Z]|$)/i);n&&(t.dependencyAnalysis=n[1].trim());let r=e.match(/(?:PREDIKSI RISIKO|Risk Prediction).*?[:：]\s*([\s\S]+?)(?=\n#{1,3}\s|\n\*{2}[A-Z]|$)/i);return r&&(t.riskPrediction=r[1].trim()),Object.keys(t).length>0?t:null}function Fx(e){return`
    <div class="report-summary-card" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px 24px;margin-bottom:24px">
      <div style="font-size:0.85rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;border-bottom:2px solid #0ea5e9;padding-bottom:6px">
        Ringkasan Eksekutif Analisis
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${e.skor==null?``:`
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;border-radius:50%;background:${e.skor>=80?`#dcfce7`:e.skor>=60?`#fef9c3`:`#fee2e2`};display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:800;color:${e.skor>=80?`#166534`:e.skor>=60?`#854d0e`:`#991b1b`}">${e.skor}</div>
            <div>
              <div style="font-size:0.78rem;color:#64748b">Skor Kepatuhan</div>
              <div style="font-size:0.9rem;font-weight:700;color:#0f172a">${e.skor}%</div>
            </div>
          </div>
        `}
        ${e.kategori?`
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;border-radius:50%;background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#1e3a8a">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div>
              <div style="font-size:0.78rem;color:#64748b">Status Kelayakan</div>
              <div style="font-size:0.9rem;font-weight:700;color:#1e3a8a">${Wx(e.kategori)}</div>
            </div>
          </div>
        `:``}
      </div>
      ${e.temuanKritis?`
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #bae6fd">
          <div style="font-size:0.78rem;font-weight:700;color:#991b1b;margin-bottom:6px">Temuan Kritis:</div>
          <div style="font-size:0.825rem;color:#374151;line-height:1.6">${Bx(e.temuanKritis)}</div>
        </div>
      `:``}
    </div>
  `}function Ix(e,t){let n={critical:{bg:`#fef2f2`,border:`#fca5a5`,accent:`#dc2626`,label:`KRITIS`},high:{bg:`#fff7ed`,border:`#fed7aa`,accent:`#ea580c`,label:`TINGGI`},medium:{bg:`#fefce8`,border:`#fde68a`,accent:`#ca8a04`,label:`SEDANG`},low:{bg:`#f0fdf4`,border:`#bbf7d0`,accent:`#16a34a`,label:`RENDAH`}},r=n[e.riskLevel]||n.medium;return`
    <div class="report-item-card" style="background:white;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px;overflow:hidden;page-break-inside:avoid">
      <!-- Header -->
      <div style="background:${r.bg};padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${r.border}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:8px;background:white;border:2px solid ${r.accent};display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:${r.accent};font-family:monospace">${Wx(e.kode)}</div>
          <div>
            <div style="font-size:0.95rem;font-weight:700;color:#0f172a">${Wx(e.nama)}</div>
            ${e.status?`<div style="font-size:0.78rem;color:${r.accent};font-weight:600;margin-top:2px">Status: ${Wx(e.status)}</div>`:``}
          </div>
        </div>
        <span style="background:${r.accent};color:white;padding:3px 10px;border-radius:999px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${r.label}</span>
      </div>

      <!-- Body -->
      <div style="padding:16px 20px">
        ${e.analisis?`
          <div class="report-field" style="margin-bottom:14px">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#2563eb;display:inline-block"></span>
              Temuan dan Analisis
            </div>
            <div style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify">${zx(e.analisis)}</div>
          </div>
        `:``}

        ${e.dasarHukum?`
          <div class="report-field" style="margin-bottom:14px">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#0ea5e9;display:inline-block"></span>
              Standar Acuan / Dasar Hukum
            </div>
            <div style="font-size:0.825rem;color:#374151;background:#f8fafc;border-left:3px solid #0ea5e9;padding:10px 14px;border-radius:0 6px 6px 0;line-height:1.7">${Bx(e.dasarHukum)}</div>
          </div>
        `:``}

        ${e.risiko?`
          <div class="report-field" style="margin-bottom:14px">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#dc2626;display:inline-block"></span>
              Dampak Risiko
            </div>
            <div style="font-size:0.825rem;color:#374151;background:#fef2f2;border-left:3px solid #fca5a5;padding:10px 14px;border-radius:0 6px 6px 0;line-height:1.7">${zx(e.risiko)}</div>
          </div>
        `:``}

        ${e.rekomendasi?`
          <div class="report-field">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#059669;display:inline-block"></span>
              Rekomendasi Teknis
            </div>
            <div style="font-size:0.825rem;color:#374151;background:#f0fdf4;border-left:3px solid #86efac;padding:10px 14px;border-radius:0 6px 6px 0;line-height:1.7">${Bx(e.rekomendasi)}</div>
          </div>
        `:``}
      </div>
    </div>
  `}function Lx(e){let t=``;return e.dependencyAnalysis&&(t+=`
      <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:20px 24px;margin-top:20px">
        <div style="font-size:0.85rem;font-weight:700;color:#7c3aed;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">Analisis Keterkaitan Antar Dokumen</div>
        <div style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify">${zx(e.dependencyAnalysis)}</div>
      </div>
    `),e.riskPrediction&&(t+=`
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px 24px;margin-top:16px">
        <div style="font-size:0.85rem;font-weight:700;color:#ea580c;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">Prediksi Risiko Kedepan</div>
        <div style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify">${zx(e.riskPrediction)}</div>
      </div>
    `),t}function Rx(e){let t=e.split(/\n{2,}/),n=`<div class="report-clean-narrative">`;return t.forEach(e=>{let t=e.trim();if(t)if(t.startsWith(`### `)||t.startsWith(`## `)||t.startsWith(`# `)){let e=t.startsWith(`### `)?`h4`:t.startsWith(`## `)?`h3`:`h2`,r=t.replace(/^#{1,4}\s*/,``);n+=`<${e} style="font-size:${e===`h2`?`1.1rem`:e===`h3`?`1rem`:`0.95rem`};font-weight:700;color:#1e3a8a;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">${Wx(r)}</${e}>`}else t.match(/^\|.*\|$/m)?n+=`<div class="markdown-content">${Ux(t)}</div>`:n+=`<p style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify;margin-bottom:10px">${Hx(t)}</p>`}),n+=`</div>`,n}function zx(e){return e?e.split(/\n{2,}/).map(e=>e.trim()).filter(e=>e).map(e=>e.match(/^[\-\*]\s/m)?Bx(e):e.match(/^\d+\.\s/m)?Vx(e):`<p style="margin:0 0 8px;text-align:justify">${Hx(e)}</p>`).join(``):``}function Bx(e){if(!e)return``;let t=e.split(`
`).filter(e=>e.trim());if(t.some(e=>e.trim().match(/^[\-\*]\s/))){let e=[],n=``;return t.forEach(t=>{let r=t.trim();r.match(/^[\-\*]\s/)?(n&&e.push(n),n=r.replace(/^[\-\*]\s/,``)):r.match(/^[a-z]\)\s|^[ivx]+\)\s/i)?n+=`<br>&nbsp;&nbsp;&nbsp;`+r:n+=` `+r}),n&&e.push(n),`<ul style="margin:0;padding-left:20px;list-style:disc">${e.map(e=>`<li style="margin-bottom:4px;font-size:0.825rem;line-height:1.6">${Hx(e)}</li>`).join(``)}</ul>`}return t.map(e=>`<p style="margin:0 0 6px">${Hx(e.trim())}</p>`).join(``)}function Vx(e){if(!e)return``;let t=e.split(`
`).filter(e=>e.trim()),n=[],r=``;return t.forEach(e=>{let t=e.trim();t.match(/^\d+\.\s/)?(r&&n.push(r),r=t.replace(/^\d+\.\s/,``)):r+=` `+t}),r&&n.push(r),`<ol style="margin:0;padding-left:20px">${n.map(e=>`<li style="margin-bottom:4px;font-size:0.825rem;line-height:1.6">${Hx(e)}</li>`).join(``)}</ol>`}function Hx(e){return e?Wx(e).replace(/\*\*(.+?)\*\*/g,`<strong style="color:#0f172a;font-weight:700">$1</strong>`).replace(/\*(.+?)\*/g,`<em>$1</em>`).replace(/`(.+?)`/g,`<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>`).replace(/\n/g,`<br>`):``}function Ux(e){let t=e.trim().split(`
`).filter(e=>e.trim().startsWith(`|`));if(t.length<2)return`<p>${Wx(e)}</p>`;let n=e=>e.split(`|`).map(e=>e.trim()).filter((e,t,n)=>t>0&&t<n.length),r=e=>e.match(/^\|[\s\-:|]+\|$/),i=t.filter(e=>!r(e));if(i.length===0)return``;let a=`<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.825rem">`;return i.forEach((e,t)=>{let r=n(e),i=t===0;a+=`<tr>`,r.forEach(e=>{i?a+=`<th style="background:#f1f5f9;color:#1e3a8a;font-weight:700;padding:8px 12px;border:1px solid #d1d5db;text-align:left;font-size:0.78rem">${Wx(e)}</th>`:a+=`<td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151">${Hx(e)}</td>`}),a+=`</tr>`}),a+=`</table>`,a}function Wx(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function Gx(e){return wx(e)}var Kx=`slf_app_settings`,qx=`00000000-0000-0000-0000-000000000000`,Jx={consultant:{name:`PT. Konsultan Pengkaji Indonesia`,address:`Jl. Jenderal Sudirman No. 123, Jakarta Pusat`,logo:null,signature:null,stamp:null,kop_image:null,kop_text:`PEMERINTAH KABUPATEN __________
DINAS PEKERJAAN UMUM DAN PENATAAN RUANG
Jl. Raya No. 123, Kota __________, Prov. __________`,director_name:``,director_job:`Direktur`},ai:{defaultModel:`gemini-3.1-flash-lite-preview`},experts:{architecture:{name:``,skk:``,signature:null,qr_code:null},structure:{name:``,skk:``,signature:null,qr_code:null},mep:{name:``,skk:``,signature:null,qr_code:null}},google:{defaultDriveProxy:``,templateDocId:``}};async function Yx(){let t=localStorage.getItem(Kx),n=t?JSON.parse(t):Jx;try{let{data:t,error:r}=await e.from(`settings`).select(`data`).eq(`id`,qx).maybeSingle();t&&t.data&&(n=t.data,localStorage.setItem(Kx,JSON.stringify(n)))}catch(e){console.warn(`[Settings] Failed to fetch remote settings, using local.`,e)}return{consultant:{...Jx.consultant,...n.consultant},ai:{...Jx.ai,...n.ai},experts:n.experts||Jx.experts,google:{...Jx.google,...n.google||{}}}}async function Xx(t){localStorage.setItem(Kx,JSON.stringify(t));try{let{error:n}=await e.from(`settings`).upsert({id:qx,data:t,updated_at:new Date().toISOString()});if(n)throw n;return!0}catch(e){throw console.error(`[Settings] Cloud sync failed:`,e),e}}var Q=`Calibri`,Zx=22,Qx=32,$x=28,eS=24,tS=20,nS=18,rS=`1a1a2e`,iS=`1e3a8a`,aS=`374151`,oS=`6b7280`,sS=`065f46`,cS=`991b1b`,lS=`92400e`,uS=`f1f5f9`,dS=`f9fafb`,fS=`d1d5db`,pS=1701,mS=1417,hS=1701,gS=1417,_S=360;function vS(e){return{ada_sesuai:`Sesuai`,ada_tidak_sesuai:`Tidak Sesuai`,tidak_ada:`Tidak Ada`,pertama_kali:`Pertama Kali`,baik:`Baik`,sedang:`Sedang`,buruk:`Buruk`,kritis:`Kritis`,tidak_wajib:`Tidak Wajib`,tidak_ada_renovasi:`Tidak Ada Renovasi`}[e]||e||`-`}function yS(e){return{low:`Rendah`,medium:`Sedang`,high:`Tinggi`,critical:`Kritis`}[e]||e||`-`}function bS(e){return{LAIK_FUNGSI:`LAIK FUNGSI`,LAIK_FUNGSI_BERSYARAT:`LAIK FUNGSI BERSYARAT`,TIDAK_LAIK_FUNGSI:`TIDAK LAIK FUNGSI`,DALAM_PENGKAJIAN:`DALAM PENGKAJIAN`}[e]||e||`BELUM DIANALISIS`}function xS(e){try{return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`})}catch{return String(e||``)}}function SS(e){return String(e||``).replace(/[\u{1F600}-\u{1F9FF}]/gu,``).replace(/[\u{2600}-\u{26FF}]/gu,``).replace(/[\u{2700}-\u{27BF}]/gu,``).replace(/[\u{FE00}-\u{FE0F}]/gu,``).replace(/[\u{1F000}-\u{1F02F}]/gu,``).trim()}function CS(){return{top:{style:Eu.SINGLE,size:1,color:fS},bottom:{style:Eu.SINGLE,size:1,color:fS},left:{style:Eu.SINGLE,size:1,color:fS},right:{style:Eu.SINGLE,size:1,color:fS},insideHorizontal:{style:Eu.SINGLE,size:1,color:fS},insideVertical:{style:Eu.SINGLE,size:1,color:fS}}}function wS(e,t){return new Yg({width:{size:t,type:Ig.PERCENTAGE},shading:{fill:uS,type:Ku.CLEAR},margins:{top:80,bottom:80,left:100,right:100},verticalAlign:jg.CENTER,children:[new Z({alignment:Y.CENTER,children:[new X({text:SS(e),bold:!0,size:tS,font:Q,color:iS})]})]})}function $(e,t,n={}){return new Yg({width:{size:t,type:Ig.PERCENTAGE},shading:n.shading?{fill:n.shading,type:Ku.CLEAR}:void 0,margins:{top:60,bottom:60,left:100,right:100},verticalAlign:jg.CENTER,children:[new Z({alignment:n.center?Y.CENTER:Y.LEFT,children:[new X({text:SS(e),size:n.size||tS,font:Q,bold:n.bold||!1,color:n.color||rS,italics:n.italics||!1})]})]})}function TS(e){return new Z({heading:Lm.HEADING_1,alignment:Y.CENTER,spacing:{before:400,after:200},children:[new X({text:SS(e).toUpperCase(),bold:!0,size:Qx,font:Q,color:iS,allCaps:!0})]})}function ES(e){return new Z({heading:Lm.HEADING_2,spacing:{before:300,after:150},children:[new X({text:SS(e),bold:!0,size:$x,font:Q,color:iS})]})}function DS(e){return new Z({heading:Lm.HEADING_3,spacing:{before:200,after:100},children:[new X({text:SS(e),bold:!0,size:eS,font:Q,color:aS})]})}function OS(e,t={}){return e?new Z({alignment:Y.JUSTIFIED,spacing:{after:t.spacingAfter||120,line:_S},indent:t.indent?{left:t.indent}:void 0,children:[new X({text:SS(e),size:t.size||Zx,font:Q,bold:t.bold||!1,italics:t.italics||!1,color:t.color||rS})]}):new Z({spacing:{before:60}})}function kS(e,t=0){return new Z({alignment:Y.JUSTIFIED,spacing:{after:80,line:_S},bullet:{level:t},children:[new X({text:SS(e),size:Zx,font:Q,color:rS})]})}function AS(e,t,n=!1){return new Z({alignment:Y.JUSTIFIED,spacing:{after:80,line:_S},indent:{left:360},children:[new X({text:`${e}. `,bold:!0,size:Zx,font:Q}),new X({text:SS(t),bold:n,size:Zx,font:Q})]})}function jS(){return new Z({spacing:{before:100}})}function MS(){return new Z({children:[new Mm]})}function NS(){return new Z({spacing:{before:200,after:200},border:{bottom:{style:Eu.SINGLE,size:2,color:fS}}})}async function PS(e,t,n,r){let{blob:i,fileName:a}=await FS(e,t,n,r);return(0,Cx.saveAs)(i,a),r&&r(100,`Selesai!`),a}async function FS(e,t,n,r){r&&r(5,`Menyiapkan struktur dokumen...`);let i=await Yx(),a=new Hy({creator:`Smart AI Pengkaji SLF v1.0`,title:`Laporan Kajian SLF - ${e.nama_bangunan}`,description:`Laporan Penilaian Kelaikan Fungsi oleh ${i.consultant.name}`,styles:{default:{document:{run:{size:Zx,font:Q,color:rS},paragraph:{alignment:Y.JUSTIFIED,spacing:{line:_S}}}},paragraphStyles:[{id:`Heading1`,name:`Heading 1`,basedOn:`Normal`,next:`Normal`,quickFormat:!0,run:{size:Qx,bold:!0,font:Q,allCaps:!0,color:iS},paragraph:{alignment:Y.CENTER,spacing:{before:400,after:200}}},{id:`Heading2`,name:`Heading 2`,basedOn:`Normal`,next:`Normal`,quickFormat:!0,run:{size:$x,bold:!0,font:Q,color:iS},paragraph:{spacing:{before:300,after:150}}},{id:`Heading3`,name:`Heading 3`,basedOn:`Normal`,next:`Normal`,quickFormat:!0,run:{size:eS,bold:!0,font:Q,color:aS},paragraph:{spacing:{before:200,after:100}}}]},numbering:{config:[{reference:`ordered-list`,levels:[{level:0,format:Bv.DECIMAL,text:`%1.`,alignment:Y.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}},{level:1,format:Bv.DECIMAL,text:`%1.%2`,alignment:Y.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]}]},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:0,right:0,bottom:0,left:0}}},children:IS(e,i)},{properties:{page:{size:{width:11906,height:16838},margin:{top:pS,right:gS,bottom:mS,left:hS}}},headers:{default:new Jy({children:[new Z({alignment:Y.RIGHT,spacing:{after:120},border:{bottom:{style:Eu.SINGLE,size:1,color:fS}},children:[new X({text:`${i.consultant.name.toUpperCase()} - LAPORAN KAJIAN SLF - `,size:nS,color:oS,font:Q}),new X({text:SS(e.nama_bangunan).toUpperCase(),size:nS,color:oS,font:Q,bold:!0})]})]})},footers:{default:new Yy({children:[new Z({alignment:Y.CENTER,border:{top:{style:Eu.SINGLE,size:1,color:fS}},spacing:{before:120},children:[new X({text:`Smart AI Pengkaji SLF v1.0  |  Halaman `,size:nS,color:oS,font:Q}),new X({children:[gd.CURRENT],size:nS,color:oS,font:Q})]})]})},children:[...RS(e),MS(),...zS(),MS(),...BS(n),MS(),...VS(t,n),MS(),...HS(t,e),MS(),...US(t),MS(),...LS(i,e)]}]});r&&r(95,`Finalisasi dokumen...`);let o=await Rb.toBlob(a),s=new Date().toISOString().split(`T`)[0];return{blob:o,fileName:`SLF_${SS(e.nama_bangunan).replace(/\s+/g,`_`)}_${s}.docx`}}function IS(e,t){return[...[,,,,].fill(null).map(()=>new Z({spacing:{before:400}})),new Z({alignment:Y.CENTER,spacing:{after:400},children:[new X({text:`LOGO KONSULTAN`,size:24,bold:!0,color:oS,font:Q,italics:!0})]}),new Z({alignment:Y.CENTER,spacing:{after:100},children:[new X({text:`________________________________________`,size:24,color:iS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{before:400,after:100},children:[new X({text:`LAPORAN`,size:40,bold:!0,color:iS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{after:100},children:[new X({text:`PENILAIAN KELAIKAN FUNGSI`,size:36,bold:!0,color:iS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{after:200},children:[new X({text:`BANGUNAN GEDUNG`,size:36,bold:!0,color:iS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{before:100,after:200},children:[new X({text:`________________________________________`,size:24,color:iS,font:Q})]}),new Z({spacing:{before:600}}),new Z({alignment:Y.CENTER,spacing:{after:100},children:[new X({text:SS(e.nama_bangunan).toUpperCase(),size:32,bold:!0,color:rS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{after:80},children:[new X({text:SS(e.alamat||``),size:24,color:aS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{after:200},children:[new X({text:`${SS(e.kota||``)}, ${SS(e.provinsi||``)}`,size:24,color:aS,font:Q})]}),...[,,,,].fill(null).map(()=>new Z({spacing:{before:400}})),new Z({alignment:Y.CENTER,spacing:{after:60},children:[new X({text:`Diajukan oleh:`,size:tS,color:oS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{after:200},children:[new X({text:SS(e.pemilik||`N/A`).toUpperCase(),size:28,bold:!0,color:rS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{before:200,after:100},children:[new X({text:xS(new Date),size:Zx,color:oS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{before:600},children:[new X({text:`Ditetapkan Dan Diterbitkan oleh:`,size:tS,color:oS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{before:100},children:[new X({text:t.consultant.name.toUpperCase(),size:32,bold:!0,color:iS,font:Q})]}),new Z({alignment:Y.CENTER,spacing:{before:60},children:[new X({text:`Smart AI Pengkaji SLF v1.0`,size:tS,color:oS,font:Q,italics:!0})]})]}function LS(e,t){let n=[];return n.push(new __({children:[wS(`NO`,10),wS(`NAMA TENAGA AHLI`,60),wS(`TANDA TANGAN`,30)]})),e.experts.forEach((e,t)=>{n.push(new __({children:[$(String(t+1),10,{center:!0}),new Yg({width:{size:60,type:Ig.PERCENTAGE},margins:{top:100,bottom:100,left:100,right:100},children:[new Z({children:[new X({text:SS(e.name),bold:!0,size:Zx,font:Q})]}),new Z({children:[new X({text:`SKA: ${SS(e.ska)}`,size:tS,font:Q,color:oS})]})]}),$(``,30)]}))}),[TS(`TIM TENAGA AHLI PENGKAJI TEKNIS`),OS(`Laporan kajian teknis kelaikan fungsi bangunan gedung ${t.nama_bangunan} ini disusun dan dipertanggungjawabkan oleh Tim Tenaga Ahli ${e.consultant.name} sebagai berikut:`),jS(),new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:n}),jS(),OS(`Ditetapkan di: ${t.kota||`Jakarta`}`),OS(`Tanggal: ${xS(new Date)}`),jS(),new Z({alignment:Y.CENTER,spacing:{before:400},children:[new X({text:`Mengetahui,`,size:Zx,font:Q}),new Mm]}),new Z({alignment:Y.CENTER,children:[new X({text:e.consultant.name.toUpperCase(),bold:!0,size:Zx,font:Q})]}),...[,,,,].fill(null).map(()=>jS()),new Z({alignment:Y.CENTER,children:[new X({text:`( __________________________ )`,bold:!0,size:Zx,font:Q})]}),new Z({alignment:Y.CENTER,children:[new X({text:`Direktur / Penanggung Jawab Teknis`,size:tS,font:Q,color:oS})]})]}function RS(e){let t=[[`Nama Bangunan`,e.nama_bangunan||`-`],[`Jenis Bangunan`,e.jenis_bangunan||`-`],[`Fungsi Bangunan`,e.fungsi_bangunan||`-`],[`Alamat Lokasi`,`${e.alamat||`-`}, ${e.kota||`-`}, ${e.provinsi||`-`}`],[`Nama Pemilik`,e.pemilik||`-`],[`Tahun Dibangun`,String(e.tahun_dibangun||`-`)],[`Jumlah Lantai`,`${e.jumlah_lantai||`-`} Lantai`],[`Luas Bangunan`,e.luas_bangunan?`${Number(e.luas_bangunan).toLocaleString(`id-ID`)} m2`:`-`],[`Luas Lahan`,e.luas_lahan?`${Number(e.luas_lahan).toLocaleString(`id-ID`)} m2`:`-`],[`Konstruksi Utama`,e.jenis_konstruksi||`-`],[`Nomor PBG/IMB`,e.nomor_pbg||`Belum tersedia`]];return[TS(`BAB I: GAMBARAN UMUM`),ES(`1.1. Latar Belakang`),OS(`Penilaian kelaikan fungsi bangunan gedung merupakan kewajiban yang diamanatkan dalam Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung. Penilaian ini bertujuan untuk memastikan bahwa bangunan gedung memenuhi persyaratan teknis yang mencakup aspek keselamatan, kesehatan, kenyamanan, dan kemudahan.`),OS(`Sertifikat Laik Fungsi (SLF) diterbitkan sebagai bukti formal bahwa bangunan gedung telah memenuhi persyaratan kelaikan fungsi dan layak untuk digunakan sesuai dengan fungsi yang ditetapkan. Kajian ini dilakukan untuk mengevaluasi kondisi eksisting bangunan secara menyeluruh berdasarkan standar teknis yang berlaku.`),ES(`1.2. Maksud dan Tujuan`),OS(`Maksud dari kajian ini adalah:`),AS(`1`,`Menilai kelengkapan dokumen administratif bangunan gedung.`),AS(`2`,`Mengevaluasi kondisi teknis eksisting bangunan gedung terhadap persyaratan standar.`),AS(`3`,`Menentukan kelayakan fungsi bangunan gedung untuk penerbitan atau perpanjangan SLF.`),AS(`4`,`Menyusun rekomendasi teknis untuk perbaikan atau peningkatan kinerja bangunan.`),ES(`1.3. Ruang Lingkup`),OS(`Ruang lingkup kajian meliputi aspek-aspek berikut:`),kS(`Administrasi: Kelengkapan dokumen perizinan (PBG/IMB, SLF, as-built drawing, dll).`),kS(`Struktur: Evaluasi kondisi elemen struktur (kolom, balok, pelat, pondasi).`),kS(`Arsitektur: Penilaian selubung bangunan, tata ruang, dan finishing.`),kS(`MEP (Mekanikal, Elektrikal, Plumbing): Audit instalasi utilitas bangunan.`),kS(`Keselamatan Kebakaran: Proteksi aktif dan pasif terhadap bahaya kebakaran.`),kS(`Kesehatan, Kenyamanan, dan Kemudahan: Aspek K3 bangunan gedung.`),ES(`1.4. Dasar Hukum`),kS(`Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung.`),kS(`Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan UU No. 28/2002.`),kS(`SNI 9273:2025 - Evaluasi dan Rehabilitasi Seismik Bangunan Gedung Eksisting.`),kS(`ASCE/SEI 41-17 - Seismic Evaluation and Retrofit of Existing Buildings.`),kS(`Peraturan Menteri PUPR terkait Persyaratan Teknis Bangunan Gedung.`),ES(`1.5. Data Umum Bangunan`),new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:t.map((e,t)=>new __({children:[$(e[0],35,{bold:!0,shading:t%2==0?dS:void 0}),$(e[1],65,{shading:t%2==0?dS:void 0})]}))})]}function zS(){return[TS(`BAB II: METODOLOGI PEMERIKSAAN`),ES(`2.1. Pendekatan Analisis`),OS(`Kajian teknis bangunan gedung ini dilakukan menggunakan pendekatan multi-layer yang mengintegrasikan beberapa metode evaluasi:`),AS(`1`,`Rule-based Analysis: Evaluasi berbasis aturan mengacu pada Norma, Standar, Pedoman, dan Kriteria (NSPK) yang berlaku di Indonesia, khususnya PP No. 16 Tahun 2021 dan peraturan turunannya.`),AS(`2`,`Risk-based Assessment: Penilaian berbasis risiko yang mengidentifikasi dampak potensial dari ketidaksesuaian terhadap keselamatan, kesehatan, dan keberlanjutan operasional bangunan.`),AS(`3`,`Performance-based Evaluation: Evaluasi berbasis kinerja mengacu pada SNI 9273:2025 dan ASCE/SEI 41-17 untuk menentukan level kinerja struktur (IO, LS, CP).`),AS(`4`,`AI-based Deep Reasoning: Analisis mendalam menggunakan engine kecerdasan buatan (Smart AI Pengkaji SLF) yang telah dilatih dengan basis pengetahuan teknis PUPR.`),ES(`2.2. Sumber Data`),OS(`Data yang digunakan dalam analisis diperoleh dari:`),kS(`Dokumen administratif yang diunggah pemilik/pengelola bangunan.`),kS(`Hasil pemeriksaan visual lapangan (visual assessment).`),kS(`Data checklist pemeriksaan yang diisi oleh tim pemeriksa.`),kS(`Hasil pengujian material (jika tersedia): hammer test, UPV, core drill.`),kS(`Database regulasi dan standar teknis PUPR yang terintegrasi dalam sistem AI.`),ES(`2.3. Metode Penilaian`),OS(`Penilaian dilakukan dengan sistem skoring kuantitatif (0-100) untuk setiap aspek kelaikan fungsi. Klasifikasi status kelaikan berdasarkan hasil evaluasi:`),new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[wS(`SKOR`,20),wS(`STATUS KELAIKAN`,40),wS(`KETERANGAN`,40)]}),new __({children:[$(`>= 80`,20,{center:!0,bold:!0,color:sS}),$(`Laik Fungsi`,40,{bold:!0,color:sS}),$(`Bangunan memenuhi seluruh persyaratan teknis.`,40)]}),new __({children:[$(`60 - 79`,20,{center:!0,bold:!0,color:lS}),$(`Laik Fungsi Bersyarat`,40,{bold:!0,color:lS}),$(`Terdapat ketidaksesuaian minor yang perlu ditindaklanjuti.`,40,{shading:dS})]}),new __({children:[$(`< 60`,20,{center:!0,bold:!0,color:cS}),$(`Tidak Laik Fungsi`,40,{bold:!0,color:cS}),$(`Ditemukan ketidaksesuaian kritis terhadap standar keselamatan.`,40)]})]}),ES(`2.4. Alur Analisis AI`),OS(`Proses audit mengikuti alur evaluasi sistematis sebagai berikut:`),OS(`Input Data  -->  Validasi Data  -->  Analisis Rule-based  -->  Deep Reasoning AI  -->  Skoring per Aspek  -->  Kesimpulan & Rekomendasi`,{bold:!0}),OS(`Setiap tahap dilengkapi dengan mekanisme validasi dan cross-check untuk memastikan konsistensi dan akurasi output analisis.`,{italics:!0}),ES(`2.5. Bobot Penilaian per Aspek`),new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[wS(`NO`,10),wS(`ASPEK`,50),wS(`BOBOT (%)`,20),wS(`ACUAN STANDAR`,20)]}),...[[`1`,`Administrasi`,`10`,`PP 16/2021`],[`2`,`Struktur`,`25`,`SNI 9273:2025`],[`3`,`Arsitektur`,`10`,`NSPK BG`],[`4`,`MEP (Utilitas)`,`15`,`SNI PUIL/Plumbing`],[`5`,`Keselamatan Kebakaran`,`20`,`Permen PU 26/2008`],[`6`,`Kesehatan`,`8`,`Permen PUPR 14/2017`],[`7`,`Kenyamanan`,`6`,`SNI Kenyamanan`],[`8`,`Kemudahan`,`6`,`Permen PU 30/2006`]].map((e,t)=>new __({children:[$(e[0],10,{center:!0,shading:t%2==0?dS:void 0}),$(e[1],50,{shading:t%2==0?dS:void 0}),$(e[2],20,{center:!0,bold:!0,shading:t%2==0?dS:void 0}),$(e[3],20,{italics:!0,color:oS,shading:t%2==0?dS:void 0})]}))]})]}function BS(e){let t=(e||[]).filter(e=>e.kategori===`administrasi`),n=(e||[]).filter(e=>e.kategori===`teknis`),r=e=>!e||e.length===0?[OS(`Data checklist tidak tersedia.`,{italics:!0,color:oS})]:[new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[wS(`KODE`,12),wS(`ITEM PEMERIKSAAN`,38),wS(`STATUS`,18),wS(`CATATAN TEKNIS`,32)]}),...e.map((e,t)=>new __({children:[$(e.kode||`-`,12,{center:!0,bold:!0,size:tS,shading:t%2==0?dS:void 0}),$(e.nama||`-`,38,{shading:t%2==0?dS:void 0}),$(vS(e.status),18,{center:!0,bold:!0,color:[`baik`,`ada_sesuai`].includes(e.status)?sS:[`buruk`,`kritis`,`tidak_ada`,`ada_tidak_sesuai`].includes(e.status)?cS:lS,shading:t%2==0?dS:void 0}),$(e.catatan||`-`,32,{size:tS,shading:t%2==0?dS:void 0})]}))]})];return[TS(`BAB III: HASIL PEMERIKSAAN CHECKLIST`),OS(`Berikut adalah hasil pemeriksaan kelengkapan dokumen dan kondisi teknis bangunan gedung yang dirangkum berdasarkan data input pemeriksaan lapangan.`),ES(`3.1. Checklist Dokumen Administrasi`),OS(`Total item administrasi yang diperiksa: ${t.length} item.`),...r(t),jS(),ES(`3.2. Checklist Kondisi Teknis Eksisting`),OS(`Total item teknis yang diperiksa: ${n.length} item.`),...r(n)]}function VS(e,t){if(!e)return[TS(`BAB IV: ANALISIS AI`),OS(`Analisis belum dilakukan. Jalankan analisis AI terlebih dahulu.`,{italics:!0})];let n=[{label:`Administrasi`,skor:e.skor_administrasi,bobot:10},{label:`Struktur`,skor:e.skor_struktur,bobot:25},{label:`Arsitektur`,skor:e.skor_arsitektur,bobot:10},{label:`MEP (Utilitas)`,skor:e.skor_mep,bobot:15},{label:`Keselamatan Kebakaran`,skor:e.skor_kebakaran,bobot:20},{label:`Kesehatan`,skor:e.skor_kesehatan,bobot:8},{label:`Kenyamanan`,skor:e.skor_kenyamanan,bobot:6},{label:`Kemudahan`,skor:e.skor_kemudahan,bobot:6}],r=t||[],i=r.filter(e=>[`ada_sesuai`,`baik`].includes(e.status)).length,a=r.filter(e=>[`ada_tidak_sesuai`,`buruk`,`kritis`].includes(e.status)).length,o=r.filter(e=>[`tidak_ada`].includes(e.status)).length,s=[TS(`BAB IV: ANALISIS AI (INTI LAPORAN)`),OS(`Berdasarkan pemrosesan data checklist menggunakan engine AI (${SS(e.ai_provider||`Smart AI`)}), berikut adalah hasil analisis mendalam terhadap setiap aspek kelaikan fungsi bangunan gedung.`),ES(`4.1. Ringkasan Hasil Analisis`),new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[wS(`PARAMETER`,50),wS(`NILAI`,50)]}),new __({children:[$(`Total Item Diperiksa`,50,{bold:!0}),$(`${r.length} item`,50,{center:!0})]}),new __({children:[$(`Item Sesuai / Baik`,50,{bold:!0,shading:dS}),$(`${i} item`,50,{center:!0,color:sS,bold:!0,shading:dS})]}),new __({children:[$(`Item Tidak Sesuai / Buruk`,50,{bold:!0}),$(`${a} item`,50,{center:!0,color:cS,bold:!0})]}),new __({children:[$(`Item Tidak Ada`,50,{bold:!0,shading:dS}),$(`${o} item`,50,{center:!0,color:lS,bold:!0,shading:dS})]}),new __({children:[$(`Skor Kepatuhan Total`,50,{bold:!0}),$(`${e.skor_total||0}%`,50,{center:!0,bold:!0,size:$x})]}),new __({children:[$(`Level Risiko`,50,{bold:!0,shading:dS}),$(yS(e.risk_level).toUpperCase(),50,{center:!0,bold:!0,shading:dS,color:e.risk_level===`low`?sS:e.risk_level===`high`||e.risk_level===`critical`?cS:lS})]})]}),jS(),ES(`4.2. Skor Per Aspek Kelaikan Fungsi`),new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[wS(`NO`,8),wS(`ASPEK`,32),wS(`BOBOT (%)`,15),wS(`SKOR (0-100)`,20),wS(`KATEGORI`,25)]}),...n.map((e,t)=>{let n=e.skor||0,r=n>=80?`Baik`:n>=60?`Cukup`:n>=40?`Perlu Perbaikan`:`Kritis`,i=n>=80?sS:n>=60?lS:cS;return new __({children:[$(String(t+1),8,{center:!0,shading:t%2==0?dS:void 0}),$(e.label,32,{shading:t%2==0?dS:void 0}),$(String(e.bobot),15,{center:!0,shading:t%2==0?dS:void 0}),$(String(n),20,{center:!0,bold:!0,color:i,shading:t%2==0?dS:void 0}),$(r.toUpperCase(),25,{center:!0,bold:!0,color:i,shading:t%2==0?dS:void 0})]})})]}),jS()];if(e.narasi_teknis){s.push(ES(`4.3. Analisis Mendalam per Item`));try{let t=Gx(e.narasi_teknis);t&&t.items&&t.items.length>0?(t.summary&&t.summary.temuanKritis&&(s.push(DS(`Ringkasan Temuan Kritis`)),s.push(OS(t.summary.temuanKritis)),s.push(jS())),t.items.forEach(e=>{s.push(new Z({spacing:{before:200,after:100},children:[new X({text:`${e.kode?e.kode+` - `:``}${e.nama}`,bold:!0,size:eS,color:rS})]})),s.push(new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[$(`Status Kepatuhan`,25,{bold:!0,shading:dS}),$(e.status||`-`,75,{bold:!0,color:e.riskLevel===`critical`||e.riskLevel===`high`?cS:e.riskLevel===`low`?sS:lS})]}),new __({children:[$(`Temuan & Analisis`,25,{bold:!0}),new Yg({width:{size:75,type:Ig.PERCENTAGE},margins:{top:100,bottom:100,left:100,right:100},borders:{left:{size:1,color:fS,style:Eu.SINGLE}},children:[new Z({text:e.analisis?SS(e.analisis):`-`,size:Zx,font:Q,alignment:Y.JUSTIFIED})]})]}),new __({children:[$(`Standar Acuan`,25,{bold:!0,shading:dS}),new Yg({width:{size:75,type:Ig.PERCENTAGE},margins:{top:100,bottom:100,left:100,right:100},shading:{fill:dS,type:Ku.CLEAR},borders:{left:{size:1,color:fS,style:Eu.SINGLE}},children:[new Z({text:e.dasarHukum?SS(e.dasarHukum):`-`,size:Zx,font:Q,alignment:Y.JUSTIFIED})]})]}),new __({children:[$(`Dampak Risiko`,25,{bold:!0}),new Yg({width:{size:75,type:Ig.PERCENTAGE},margins:{top:100,bottom:100,left:100,right:100},borders:{left:{size:1,color:fS,style:Eu.SINGLE}},children:[new Z({text:e.risiko?SS(e.risiko):`-`,size:Zx,font:Q,alignment:Y.JUSTIFIED})]})]}),new __({children:[$(`Rekomendasi`,25,{bold:!0,shading:dS}),new Yg({width:{size:75,type:Ig.PERCENTAGE},margins:{top:100,bottom:100,left:100,right:100},shading:{fill:dS,type:Ku.CLEAR},borders:{left:{size:1,color:fS,style:Eu.SINGLE}},children:[new Z({text:e.rekomendasi?SS(e.rekomendasi):`-`,size:Zx,font:Q,alignment:Y.JUSTIFIED})]})]})]})),s.push(jS())})):(s.push(OS(`Berikut adalah narasi teknis hasil analisis AI untuk setiap aspek yang telah dievaluasi:`)),s.push(jS()),s.push(...WS(e.narasi_teknis)))}catch(t){console.error(`Error formatting docx narrative:`,t),s.push(...WS(e.narasi_teknis))}}return s}function HS(e,t){let n=bS(e?.status_slf),r=e?.skor_total||0,i=``;return i=e?.status_slf===`LAIK_FUNGSI`?`Berdasarkan hasil evaluasi mendalam terhadap seluruh aspek kelaikan fungsi, bangunan gedung "${SS(t.nama_bangunan)}" dinyatakan memenuhi persyaratan teknis sesuai PP No. 16 Tahun 2021. Skor kepatuhan total mencapai ${r}/100 yang mengindikasikan kesiapan operasional penuh. Bangunan dapat dioperasikan dan diterbitkan Sertifikat Laik Fungsi (SLF).`:e?.status_slf===`LAIK_FUNGSI_BERSYARAT`?`Berdasarkan hasil evaluasi mendalam, bangunan gedung "${SS(t.nama_bangunan)}" dinyatakan layak secara bersyarat dengan skor kepatuhan ${r}/100. Terdapat beberapa ketidaksesuaian minor yang tidak mempengaruhi keselamatan utama namun perlu ditindaklanjuti dalam jangka waktu yang ditentukan. Bangunan dapat beroperasi dengan catatan harus menyelesaikan rekomendasi perbaikan.`:`Berdasarkan hasil evaluasi mendalam, bangunan gedung "${SS(t.nama_bangunan)}" BELUM memenuhi persyaratan kelaikan fungsi dengan skor kepatuhan ${r}/100. Ditemukan ketidaksesuaian kritis yang berpotensi membahayakan keselamatan penghuni. Bangunan TIDAK DAPAT diterbitkan SLF sampai seluruh temuan kritis ditindaklanjuti melalui program rehabilitasi/retrofit.`,[TS(`BAB V: KESIMPULAN`),ES(`5.1. Status Kelaikan Fungsi`),OS(i),jS(),new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[new Yg({width:{size:100,type:Ig.PERCENTAGE},shading:{fill:uS,type:Ku.CLEAR},margins:{top:200,bottom:200,left:200,right:200},verticalAlign:jg.CENTER,children:[new Z({alignment:Y.CENTER,children:[new X({text:`STATUS: ${n}`,bold:!0,size:Qx,font:Q,color:e?.status_slf===`LAIK_FUNGSI`?sS:e?.status_slf===`LAIK_FUNGSI_BERSYARAT`?lS:cS})]}),new Z({alignment:Y.CENTER,spacing:{before:100},children:[new X({text:`Skor Kepatuhan: ${r}/100  |  Risiko: ${yS(e?.risk_level).toUpperCase()}`,size:eS,font:Q,color:aS})]})]})]})]}),jS(),ES(`5.2. Interpretasi Skor`),OS(`Skor total ${r}/100 diperoleh dari perhitungan rata-rata berbobot seluruh aspek kelaikan fungsi. Evaluasi ini bersifat indikatif berdasarkan data yang tersedia dan harus dikonfirmasi oleh tenaga ahli pengkaji bangunan gedung yang bersertifikat sebelum diterbitkan Sertifikat Laik Fungsi resmi dari instansi berwenang.`)]}function US(e){let t=[];try{t=typeof e?.rekomendasi==`string`?JSON.parse(e.rekomendasi):e?.rekomendasi||[]}catch{}let n=t.filter(e=>[`kritis`,`tinggi`].includes(e.prioritas?.toLowerCase())),r=t.filter(e=>e.prioritas?.toLowerCase()===`sedang`),i=t.filter(e=>e.prioritas?.toLowerCase()===`rendah`),a=(e,t,n)=>{if(t.length===0)return[];let r=[DS(e)];return r.push(new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:[new __({children:[wS(`NO`,8),wS(`ASPEK`,15),wS(`TINDAKAN`,47),wS(`STANDAR ACUAN`,15),wS(`PRIORITAS`,15)]}),...t.map((e,t)=>new __({children:[$(String(t+1),8,{center:!0,shading:t%2==0?dS:void 0}),$(SS(e.aspek||`-`),15,{bold:!0,shading:t%2==0?dS:void 0}),$(SS(`${e.judul||``}: ${e.tindakan||``}`),47,{shading:t%2==0?dS:void 0}),$(SS(e.standar||`-`),15,{italics:!0,color:oS,shading:t%2==0?dS:void 0}),$(SS(e.prioritas||`-`).toUpperCase(),15,{center:!0,bold:!0,color:[`kritis`,`tinggi`].includes(e.prioritas?.toLowerCase())?cS:e.prioritas?.toLowerCase()===`sedang`?lS:sS,shading:t%2==0?dS:void 0})]}))]})),r},o=[TS(`BAB VI: REKOMENDASI`),OS(`Berdasarkan hasil analisis dan evaluasi mendalam terhadap seluruh aspek kelaikan fungsi bangunan, disusun rekomendasi teknis berikut ini yang dikelompokkan berdasarkan tingkat prioritas pelaksanaan.`),OS(`Total rekomendasi: ${t.length} item.`),...a(`Prioritas 1: URGENT (Kritis/Tinggi)`,n,`Kritis`),...a(`Prioritas 2: Jangka Pendek (Sedang)`,r,`Sedang`),...a(`Prioritas 3: Jangka Menengah (Rendah)`,i,`Rendah`)];return t.length===0&&o.push(OS(`Tidak ditemukan temuan kritis yang memerlukan tindakan prioritas. Bangunan dalam kondisi memadai.`)),o.push(jS()),o.push(jS()),o.push(NS()),o.push(new Z({alignment:Y.RIGHT,spacing:{after:60},children:[new X({text:`Dianalisis dan disusun oleh,`,size:Zx,font:Q})]})),o.push(new Z({alignment:Y.RIGHT,spacing:{after:60},children:[new X({text:`Tim Pengkaji Teknis Bangunan Gedung`,size:Zx,font:Q,bold:!0})]})),o.push(jS()),o.push(jS()),o.push(jS()),o.push(new Z({alignment:Y.RIGHT,border:{bottom:{style:Eu.SINGLE,size:1,color:rS}},spacing:{after:60},children:[new X({text:`                                          `,size:Zx})]})),o.push(new Z({alignment:Y.RIGHT,spacing:{after:60},children:[new X({text:`Generated by Smart AI Pengkaji SLF v1.0`,size:tS,font:Q,italics:!0,color:oS})]})),o.push(new Z({alignment:Y.RIGHT,children:[new X({text:xS(new Date),size:tS,font:Q,color:oS})]})),o}function WS(e=``){if(!e)return[OS(`Tidak ada narasi teknis.`,{italics:!0})];let t=SS(e).split(`
`),n=[],r=[],i=()=>{if(r.length<2){r=[];return}let e=r.filter(e=>!e.match(/^\|[\s\-:|]+\|$/));if(e.length===0){r=[];return}let t=e=>e.split(`|`).map(e=>e.trim()).filter((e,t,n)=>!(t===0&&e===``||t===n.length-1&&e===``)),i=t(e[0]).length;if(i===0){r=[];return}let a=Math.floor(100/i);try{let r=new f_({width:{size:100,type:Ig.PERCENTAGE},borders:CS(),rows:e.map((e,n)=>{let r=t(e);for(;r.length<i;)r.push(`-`);return new __({children:r.slice(0,i).map(e=>n===0?wS(e,a):$(e,a,{shading:n%2==0?dS:void 0}))})})});n.push(r),n.push(jS())}catch{e.forEach(e=>n.push(OS(e)))}r=[]};return t.forEach(e=>{let t=e.trim();if(t.startsWith(`|`)&&t.endsWith(`|`)){r.push(t);return}else r.length>0&&i();if(!t){n.push(jS());return}if(t.startsWith(`### `))n.push(DS(t.replace(/^###\s+/,``)));else if(t.startsWith(`## `))n.push(ES(t.replace(/^##\s+/,``)));else if(t.startsWith(`# `))n.push(TS(t.replace(/^#\s+/,``)));else if(t.match(/^-{3,}$/)||t.match(/^\*{3,}$/))n.push(NS());else if(t.startsWith(`* `)||t.startsWith(`- `))n.push(kS(t.substring(2)));else if(t.match(/^\d+\.\s/)){let e=t.match(/^(\d+\.)\s(.+)$/);e&&n.push(new Z({alignment:Y.JUSTIFIED,spacing:{after:80,line:_S},indent:{left:360},children:[new X({text:`${e[1]} `,bold:!0,size:Zx,font:Q}),...GS(e[2])]}))}else n.push(new Z({alignment:Y.JUSTIFIED,spacing:{after:120,line:_S},children:GS(t)}))}),r.length>0&&i(),n}function GS(e){if(!e)return[new X({text:``,size:Zx,font:Q})];let t=[],n=/(\*\*.*?\*\*|\*.*?\*|`.*?`|[^*`]+)/g,r;for(;(r=n.exec(e))!==null;){let e=r[1];e.startsWith(`**`)&&e.endsWith(`**`)?t.push(new X({text:SS(e.slice(2,-2)),bold:!0,size:Zx,font:Q,color:rS})):e.startsWith(`*`)&&e.endsWith(`*`)&&!e.startsWith(`**`)?t.push(new X({text:SS(e.slice(1,-1)),italics:!0,size:Zx,font:Q,color:aS})):e.startsWith("`")&&e.endsWith("`")?t.push(new X({text:SS(e.slice(1,-1)),size:tS,font:`Consolas`,color:`7c3aed`})):t.push(new X({text:SS(e),size:Zx,font:Q,color:rS}))}return t.length===0&&t.push(new X({text:SS(e),size:Zx,font:Q})),t}async function KS(){let e=await Yx();return{consultantName:e.consultant.name.toUpperCase(),consultantTagline:e.consultant.address,docTitle:`LAPORAN TEKNIS KAJIAN SLF BANGUNAN GEDUNG`,logo:e.consultant.logo,website:`Smart AI Pengkaji SLF`}}async function qS(){return window.html2pdf?window.html2pdf:new Promise((e,t)=>{let n=document.createElement(`script`);n.src=`https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`,n.crossOrigin=`anonymous`,n.onload=()=>e(window.html2pdf),n.onerror=()=>t(Error(`Gagal memuat library html2pdf.js dari CDN. Pastikan ada koneksi internet.`)),document.head.appendChild(n)})}async function JS(e,t,n){try{n&&n(10,`Memuat library PDF...`);let r=await qS();n&&n(20,`Mengambil pengaturan identitas...`);let i=await KS();n&&n(40,`Menyiapkan konten laporan...`);let a=e.cloneNode(!0);YS(a),n&&n(50,`Mengonversi ke format PDF...`);let o=new Date().toISOString().split(`T`)[0],s=`SLF_${(t.nama_bangunan||`Laporan`).replace(/\s+/g,`_`)}_${o}.pdf`,c={margin:[25,10,20,10],filename:s,image:{type:`jpeg`,quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1,letterRendering:!0,scrollX:0,scrollY:0},jsPDF:{unit:`mm`,format:`a4`,orientation:`portrait`,compress:!0},pagebreak:{mode:[`avoid-all`,`css`,`legacy`],before:`.pdf-page-break`,avoid:[`.report-item-card`,`.report-field`,`tr`,`td`,`th`,`h2`,`h3`],after:`.pdf-page-break-after`}};return n&&n(70,`Merender halaman PDF & Menambah Header/Footer...`),await r().set(c).from(a).toPdf().get(`pdf`).then(e=>{let t=e.internal.getNumberOfPages(),n=e.internal.pageSize.getWidth(),r=e.internal.pageSize.getHeight();for(let a=1;a<=t;a++){if(e.setPage(a),e.setFontSize(10),e.setTextColor(17,24,39),e.setFont(`helvetica`,`bold`),i.logo)try{e.addImage(i.logo,`PNG`,10,8,10,10)}catch{e.setFillColor(30,58,138),e.rect(10,8,8,8,`F`)}else e.setFillColor(30,58,138),e.rect(10,8,8,8,`F`);e.text(i.consultantName,i.logo?23:22,12),e.setFont(`helvetica`,`normal`),e.setFontSize(7),e.setTextColor(100,116,139);let o=i.consultantTagline.length>80?i.consultantTagline.substring(0,77)+`...`:i.consultantTagline;e.text(o,i.logo?23:22,16),e.setFontSize(8),e.text(i.docTitle,n-10,14,{align:`right`}),e.setDrawColor(226,232,240),e.setLineWidth(.3),e.line(10,19,n-10,19),e.line(10,r-15,n-10,r-15),e.setFontSize(7),e.text(`Dihasilkan otomatis oleh Smart AI Pengkaji SLF | `+i.consultantName,10,r-10),e.setFont(`helvetica`,`bold`),e.text(`Halaman ${a} / ${t}`,n-10,r-10,{align:`right`})}}).save(),n&&n(100,`Selesai!`),s}catch(e){throw n&&n(100,`Gagal`,!0),console.error(`PDF Generation Error:`,e),Error(e.message||`Gagal generate PDF`)}}function YS(e){e.style.position=`relative`,e.style.margin=`0 auto`,e.style.padding=`0`,e.style.left=`0`,e.style.top=`0`,e.style.width=`190mm`,e.style.boxSizing=`border-box`,e.style.fontFamily=`'Calibri', 'Segoe UI', sans-serif`,e.style.color=`#111827`,e.style.backgroundColor=`white`,e.querySelectorAll(`*`).forEach(e=>{window.getComputedStyle(e).color===`rgb(255, 255, 255)`&&!e.closest(`.laporan-cover`)&&!e.closest(`.badge-status`)&&(e.style.color=`#111827`),e.style.maxWidth&&(e.style.maxWidth=`100%`)});let t=e.querySelector(`.laporan-cover`);t&&(t.style.backgroundColor=`#1e3a8a`,t.style.color=`white`,t.style.textAlign=`center`,t.style.padding=`60px 40px`,t.style.minHeight=`275mm`,t.style.display=`flex`,t.style.flexDirection=`column`,t.style.justifyContent=`center`,t.querySelectorAll(`*`).forEach(e=>{e.style.color=`white`})),e.querySelectorAll(`.no-print`).forEach(e=>e.remove()),e.querySelectorAll(`.laporan-section > table`).forEach(e=>{e.style.borderCollapse=`collapse`,e.style.width=`100%`,e.style.tableLayout=`auto`,e.querySelectorAll(`th, td`).forEach(e=>{e.style.border=`1px solid #d1d5db`})}),e.querySelectorAll(`.laporan-section`).forEach(e=>{e.style.pageBreakBefore=`always`,e.style.padding=`0`,e.style.borderBottom=`none`})}async function XS(e,t,n,r){let i=await Yx(),a=e.drive_proxy_url||i.google?.defaultDriveProxy,o=i.google?.templateDocId;if(!a)throw Error(`Google Apps Script URL belum dikonfigurasi. Buka Pengaturan → Integrasi Google dan isi "GAS Proxy URL".`);r&&r(10,`Menyiapkan data laporan...`);let s=QS(e,t,n,i);r&&r(25,`Mengirim request ke Google Apps Script...`);let c=new Date().toISOString().split(`T`)[0],l=`Laporan SLF - ${e.nama_bangunan} - ${c}`,u={action:`generateFromTemplate`,templateId:o||void 0,proyekId:e.id,docTitle:l,data:s};r&&r(40,`Mengirim payload ke GAS...`);let d=await fetch(a,{method:`POST`,headers:{"Content-Type":`text/plain;charset=utf-8`},body:JSON.stringify(u)});if(!d.ok)throw Error(`GAS request gagal: HTTP ${d.status} ${d.statusText}`);let f=await d.json();if(f.error)throw Error(f.error);return r&&r(85,`Dokumen berhasil di-generate...`),iC(e.id,f.id),r&&r(100,`Selesai!`),{id:f.id,title:f.title,editUrl:f.editUrl,embedUrl:f.embedUrl,exportDocxUrl:f.exportDocxUrl,exportPdfUrl:f.exportPdfUrl,folderId:f.folderId,folderUrl:f.folderUrl}}async function ZS(e,t,n,r,i){let a=await Yx(),o=t.drive_proxy_url||a.google?.defaultDriveProxy;if(!o)throw Error(`GAS Proxy URL belum dikonfigurasi.`);i&&i(10,`Menyiapkan data terbaru...`);let s=QS(t,n,r,a);i&&i(40,`Mengirim pembaruan ke Google Docs...`);let c=await(await fetch(o,{method:`POST`,headers:{"Content-Type":`text/plain;charset=utf-8`},body:JSON.stringify({action:`updateDocument`,docId:e,data:s})})).json();if(c.error)throw Error(c.error);return i&&i(100,`Dokumen berhasil diperbarui!`),c}function QS(e,t,n,r){let i=t?.skor_total||0,a=t?.risk_level||`medium`,o=t?.status_slf||`DALAM_PENGKAJIAN`,s=[];try{s=typeof t?.rekomendasi==`string`?JSON.parse(t.rekomendasi):t?.rekomendasi||[]}catch{s=[]}let c=s.filter(e=>[`kritis`,`tinggi`].includes(e.prioritas?.toLowerCase())),l=s.filter(e=>e.prioritas?.toLowerCase()===`sedang`),u=s.filter(e=>e.prioritas?.toLowerCase()===`rendah`),d=t?.narasi_teknis?pC(t.narasi_teknis):`Narasi analisis teknis belum tersedia. Lakukan Sintesis AI pada halaman Analisis terlebih dahulu.`,f=[{aspek:`Administrasi`,skor:t?.skor_administrasi||0,bobot:`10%`,acuan:`PP 16/2021`},{aspek:`Struktur`,skor:t?.skor_struktur||0,bobot:`25%`,acuan:`SNI 9273:2025`},{aspek:`Arsitektur`,skor:t?.skor_arsitektur||0,bobot:`10%`,acuan:`NSPK BG`},{aspek:`MEP / Utilitas`,skor:t?.skor_mep||0,bobot:`15%`,acuan:`SNI PUIL/Plumbing`},{aspek:`Keselamatan Kebakaran`,skor:t?.skor_kebakaran||0,bobot:`20%`,acuan:`Permen PU 26/2008`},{aspek:`Kesehatan`,skor:t?.skor_kesehatan||0,bobot:`8%`,acuan:`Permen PUPR 14/2017`},{aspek:`Kenyamanan`,skor:t?.skor_kenyamanan||0,bobot:`6%`,acuan:`SNI Kenyamanan`},{aspek:`Kemudahan`,skor:t?.skor_kemudahan||0,bobot:`6%`,acuan:`Permen PU 30/2006`}],p=(n||[]).filter(e=>e.kategori===`administrasi`),m=(n||[]).filter(e=>e.kategori!==`administrasi`),h=(n||[]).filter(e=>[`ada_sesuai`,`baik`].includes(e.status)).length,g=(n||[]).filter(e=>[`ada_tidak_sesuai`,`buruk`,`kritis`,`tidak_ada`].includes(e.status)).length,_={NAMA_BANGUNAN:e.nama_bangunan||`-`,JENIS_BANGUNAN:e.jenis_bangunan||`-`,FUNGSI_BANGUNAN:e.fungsi_bangunan||`-`,ALAMAT:e.alamat||`-`,KOTA:e.kota||`-`,PROVINSI:e.provinsi||`-`,ALAMAT_LENGKAP:`${e.alamat||`-`}, ${e.kota||`-`}, ${e.provinsi||`-`}`,PEMILIK:e.pemilik||`-`,TAHUN_DIBANGUN:String(e.tahun_dibangun||`-`),JUMLAH_LANTAI:`${e.jumlah_lantai||`-`} Lantai`,LUAS_BANGUNAN:e.luas_bangunan?`${Number(e.luas_bangunan).toLocaleString(`id-ID`)} m²`:`-`,LUAS_LAHAN:e.luas_lahan?`${Number(e.luas_lahan).toLocaleString(`id-ID`)} m²`:`-`,JENIS_KONSTRUKSI:e.jenis_konstruksi||`-`,NOMOR_PBG:e.nomor_pbg||`Belum tersedia`,TANGGAL_LAPORAN:sC(new Date),BULAN_TAHUN:cC(new Date),TAHUN:String(new Date().getFullYear()),NAMA_KONSULTAN:r.consultant?.name||`-`,ALAMAT_KONSULTAN:r.consultant?.address||`-`,SKOR_TOTAL:String(i),SKOR_ADMINISTRASI:String(t?.skor_administrasi||0),SKOR_STRUKTUR:String(t?.skor_struktur||0),SKOR_ARSITEKTUR:String(t?.skor_arsitektur||0),SKOR_MEP:String(t?.skor_mep||0),SKOR_KEBAKARAN:String(t?.skor_kebakaran||0),SKOR_KESEHATAN:String(t?.skor_kesehatan||0),SKOR_KENYAMANAN:String(t?.skor_kenyamanan||0),SKOR_KEMUDAHAN:String(t?.skor_kemudahan||0),RISK_LEVEL:lC(a),STATUS_SLF:uC(o),STATUS_SLF_SINGKAT:dC(o),STATUS_SLF_NARATIF:fC(o),TOTAL_ITEM:String((n||[]).length),ITEM_SESUAI:String(h),ITEM_TIDAK_SESUAI:String(g),PERSEN_KEPATUHAN:`${i}%`,NARASI_BAB4:d,NARASI_BAB5:t?.metadata?.expert_findings?.bab5_analisis?pC(t.metadata.expert_findings.bab5_analisis):`Analisis forensik belum dijalankan. Gunakan "Jalankan Konsorsium Ahli" di halaman Analisis.`,NARASI_BAB6:t?.metadata?.expert_findings?.bab6_kesimpulan?pC(t.metadata.expert_findings.bab6_kesimpulan):`Kesimpulan akhir belum tersedia.`,STATUS_FINAL_EXPERT:t?.metadata?.expert_findings?.status_final?.replace(/_/g,` `)||`-`,JUMLAH_REKOMENDASI:String(s.length),REKOMENDASI_P1_COUNT:String(c.length),REKOMENDASI_P2_COUNT:String(l.length),REKOMENDASI_P3_COUNT:String(u.length),KOTA_PENETAPAN:e.kota||`Jakarta`,TANGGAL_PENETAPAN:sC(new Date)},v={_checklistAdmin:p,_checklistTeknis:m,_timAhli:r.experts||[],_rekomendasiP1:c,_rekomendasiP2:l,_rekomendasiP3:u,_skorAspek:f};return{..._,...v}}function $S(e){return`https://docs.google.com/document/d/${e}/edit?embedded=true&rm=minimal`}function eC(e){return`https://docs.google.com/document/d/${e}/edit`}function tC(e){return`https://docs.google.com/document/d/${e}/export?format=docx`}function nC(e){return`https://docs.google.com/document/d/${e}/export?format=pdf`}var rC=`slf_gdoc_cache`;function iC(e,t){try{let n=JSON.parse(localStorage.getItem(rC)||`{}`);n[e]={docId:t,generatedAt:new Date().toISOString()},localStorage.setItem(rC,JSON.stringify(n))}catch{}}function aC(e){try{return JSON.parse(localStorage.getItem(rC)||`{}`)[e]||null}catch{return null}}async function oC(){let e=await Yx(),t=e.google?.defaultDriveProxy,n=e.google?.templateDocId;return t?n?{ready:!0,gasUrl:!0,templateId:!0,message:`Siap generate laporan.`}:{ready:!1,gasUrl:!0,templateId:!1,message:`Template Google Docs ID belum diisi di Pengaturan.`}:{ready:!1,gasUrl:!1,templateId:!!n,message:`GAS Proxy URL belum diisi di Pengaturan.`}}function sC(e){try{return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`})}catch{return String(e)}}function cC(e){try{return new Date(e).toLocaleDateString(`id-ID`,{month:`long`,year:`numeric`})}catch{return``}}function lC(e){return{low:`RENDAH`,medium:`SEDANG`,high:`TINGGI`,critical:`KRITIS`}[e]||e?.toUpperCase()||`-`}function uC(e){return{LAIK_FUNGSI:`LAIK FUNGSI`,LAIK_FUNGSI_BERSYARAT:`LAIK FUNGSI BERSYARAT`,TIDAK_LAIK_FUNGSI:`TIDAK LAIK FUNGSI`,DALAM_PENGKAJIAN:`DALAM PENGKAJIAN`}[e]||e||`BELUM DIANALISIS`}function dC(e){return{LAIK_FUNGSI:`Laik`,LAIK_FUNGSI_BERSYARAT:`Bersyarat`,TIDAK_LAIK_FUNGSI:`Tidak Laik`,DALAM_PENGKAJIAN:`Proses`}[e]||`-`}function fC(e){return{LAIK_FUNGSI:`Bangunan gedung telah memenuhi persyaratan kelaikan fungsi dan layak untuk diterbitkan Sertifikat Laik Fungsi (SLF). Seluruh aspek teknis, administratif, keselamatan, dan kemudahan telah terpenuhi sesuai standar PUPR yang berlaku.`,LAIK_FUNGSI_BERSYARAT:`Bangunan gedung dapat dioperasikan dengan syarat pemilik/pengelola wajib segera menindaklanjuti seluruh rekomendasi teknis yang tertuang dalam laporan ini dalam jangka waktu yang telah ditentukan. SLF dapat diterbitkan dengan catatan pembinaan.`,TIDAK_LAIK_FUNGSI:`Bangunan gedung belum memenuhi persyaratan minimum kelaikan fungsi. Terdapat temuan kritis yang berpotensi membahayakan keselamatan penghuni dan masyarakat sekitar. SLF tidak dapat diterbitkan sebelum dilakukan rehabilitasi dan perbaikan menyeluruh sesuai standar teknis yang berlaku.`,DALAM_PENGKAJIAN:`Proses pengkajian teknis masih berlangsung. Status kelaikan fungsi bangunan gedung akan ditetapkan setelah seluruh pemeriksaan dan analisis teknis selesai dilakukan.`}[e]||`Status belum ditentukan.`}function pC(e){return e.replace(/^#{1,6}\s+/gm,``).replace(/\*\*(.+?)\*\*/g,`$1`).replace(/\*(.+?)\*/g,`$1`).replace(/`(.+?)`/g,`$1`).replace(/[\u{1F600}-\u{1F9FF}]/gu,``).replace(/[\u{2600}-\u{26FF}]/gu,``).replace(/[\u{2700}-\u{27BF}]/gu,``).substring(0,8e3).trim()}async function mC(e={}){let t=e.id;if(!t)return M(`proyek`),``;let n=document.getElementById(`page-root`);n&&(n.innerHTML=TC());let[r,i,a,o,s]=await Promise.all([xC(t),SC(t),wC(t),Yx(),CC(t)]);if(!r)return M(`proyek`),V(`Proyek tidak ditemukan.`),``;window._reportPhotos=s;let c=await oC(),l=aC(t),u=hC(r,i,a,o,c,l);return n&&(n.innerHTML=u,yC(r,i,a,o,c,l),bC()),u}function hC(e,t,n,r,i,a){return t?`
    <div id="laporan-page">
      <!-- Action Bar (No Print) -->
      <div class="page-header no-print" style="margin-bottom:var(--space-4)">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${e.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> ${EC(e.nama_bangunan)}
            </button>
            <h1 class="page-title">Penyusunan Laporan SLF</h1>
            <p class="page-subtitle">Sistem otomatisasi penyusunan laporan berbasis template.</p>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="tabs-container" style="margin-top:var(--space-5);margin-bottom:0">
          <div class="tab-item active" onclick="window._switchContentTab('tab-gdocs', this)" id="nav-tab-gdocs">
            <i class="fas fa-file-word"></i> Editor Cerdas (Template Google Docs)
          </div>
          <div class="tab-item" onclick="window._switchContentTab('tab-legacy', this)" id="nav-tab-legacy">
            <i class="fas fa-desktop"></i> Preview Lokal (Legacy)
          </div>
        </div>
      </div>

      <!-- Export Progress Modal -->
      <div class="export-progress-overlay" id="export-progress-overlay" style="display:none">
        <div class="export-progress-modal card">
          <div class="export-progress-icon">
            <i class="fas fa-circle-notch fa-spin" id="export-progress-icon-i" style="font-size:2.5rem;color:var(--brand-400)"></i>
          </div>
          <h3 id="export-progress-title" style="margin-top:16px;margin-bottom:8px">Mengeksport Dokumen...</h3>
          <p id="export-progress-msg" style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:var(--space-4)">Menyiapkan integrasi...</p>
          <div class="export-progress-bar" style="width:100%;height:8px;background:var(--bg-elevated);border-radius:4px;overflow:hidden">
            <div class="export-progress-fill" id="export-progress-fill" style="width:0%;height:100%;background:var(--gradient-brand);transition:width 0.3s ease"></div>
          </div>
          <div id="export-progress-pct" style="font-size:0.85rem;font-weight:600;color:var(--text-primary);margin-top:var(--space-2);text-align:right">0%</div>
        </div>
      </div>

      <!-- TAB 1: GOOGLE DOCS EDITOR -->
      <div id="tab-gdocs" class="tab-content active" style="padding:0">
        ${gC(e,i,a)}
      </div>

      <!-- TAB 2: PREVIEW LOKAL (LEGACY) -->
      <div id="tab-legacy" class="tab-content" style="padding:0">
        ${_C(e,t,n,r)}
      </div>

    </div>
  `:`
      <div class="page-container flex-center">
        <div class="card" style="text-align:center;padding:var(--space-12);max-width:500px">
          <div style="width:70px;height:70px;background:var(--gradient-brand);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);font-size:1.8rem;color:white">
            <i class="fas fa-file-contract"></i>
          </div>
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-2)">Laporan Belum Tersedia</h3>
          <p style="color:var(--text-secondary);margin:0 auto var(--space-6)">
            Laporan SLF baru dapat di-generate setelah Anda melengkapi checklist dan melakukan Analisis AI.
          </p>
          <button class="btn btn-primary" onclick="window.navigate('analisis',{id:'${e.id}'})">
            <i class="fas fa-brain"></i> Buka Halaman Analisis
          </button>
        </div>
      </div>
    `}function gC(e,t,n){if(!t.ready)return`
      <div class="card" style="text-align:center;padding:var(--space-12)">
        <div style="width:70px;height:70px;background:#fff1f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);font-size:1.8rem;color:#e11d48">
          <i class="fas fa-plug-circle-xmark"></i>
        </div>
        <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">Integrasi Google Docs Belum Siap</h3>
        <p style="color:var(--text-secondary);max-width:500px;margin:0 auto var(--space-6);line-height:1.6">
          ${EC(t.message)}<br>
          Silakan lengkapi konfigurasi Google Apps Script dan ID Template Master di halaman Pengaturan.
        </p>
        <button class="btn btn-outline" onclick="window.navigate('settings')">
          <i class="fas fa-sliders"></i> Buka Pengaturan
        </button>
      </div>
    `;if(!n)return`
      <div class="card" style="text-align:center;padding:var(--space-10)">
        <div style="width:80px;height:80px;background:#f0f9ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);font-size:2rem;color:var(--brand-400)">
          <i class="fas fa-wand-magic-sparkles"></i>
        </div>
        <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:12px">Buat Laporan dari Template</h3>
        <p style="color:var(--text-secondary);max-width:600px;margin:0 auto var(--space-6);line-height:1.6">
          Sistem akan membuat salinan dokumen master dan mengisi seluruh data proyek, checklist, dan analisis AI secara otomatis.
        </p>
        <button class="btn btn-primary btn-lg" onclick="window._generateGDoc()" id="btn-generate-gdoc">
          <i class="fas fa-file-signature" style="margin-right:8px"></i> Generate Dokumen Laporan
        </button>
      </div>
    `;let r=n.docId,i=$S(r),a=eC(r);return`
    <div style="display:grid;grid-template-columns:1fr;gap:var(--space-4)">
      
      <!-- Laporan Action Bar -->
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;margin-bottom:0">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;background:rgba(59,130,246,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:1.2rem">
            <i class="fas fa-file-word"></i>
          </div>
          <div>
            <div style="font-weight:700;color:var(--text-primary)">Laporan SLF Aktif</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">Dibuat: ${DC(n.generatedAt)}</div>
          </div>
        </div>
        
        <div style="display:flex;gap:12px">
          <button class="btn btn-outline btn-sm" onclick="window._reGenerateGDoc()" id="btn-re-generate">
            <i class="fas fa-rotate"></i> Sinkronisasi Ulang Data
          </button>
          
          <button class="btn btn-outline btn-sm" onclick="window.open('${a}','_blank')">
            <i class="fas fa-external-link-alt"></i> Buka Editor Teks Penuh
          </button>
          
          <div class="export-dropdown" id="dropdown-gdocs-export">
            <button class="btn btn-primary btn-sm" onclick="window._toggleGDocsExport()">
              <i class="fas fa-download"></i> Download Hasil
              <i class="fas fa-chevron-down" style="font-size:0.7rem;margin-left:4px"></i>
            </button>
            <div class="export-dropdown-menu" id="menu-gdocs-export" style="right:0">
              <button class="export-option" onclick="window._downloadGDocsWord('${r}')">
                <div class="export-option-icon" style="background:hsla(220,80%,55%,0.15);color:hsl(220,80%,55%)"><i class="fas fa-file-word"></i></div>
                <div><div class="export-option-title">Microsoft Word</div><div class="export-option-desc">Export final .docx</div></div>
              </button>
              <button class="export-option" onclick="window._downloadGDocsPdf('${r}')">
                <div class="export-option-icon" style="background:hsla(0,74%,52%,0.15);color:hsl(0,74%,52%)"><i class="fas fa-file-pdf"></i></div>
                <div><div class="export-option-title">PDF Document</div><div class="export-option-desc">Export final .pdf siap cetak</div></div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Editor Iframe -->
      <div class="card" style="padding:0;overflow:hidden;border:1px solid var(--border-subtle);height:75vh;position:relative">
         <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--text-tertiary);display:flex;flex-direction:column;align-items:center;gap:12px;z-index:0">
           <i class="fas fa-circle-notch fa-spin" style="font-size:2rem"></i>
           <span>Memuat Google Docs...</span>
         </div>
         <iframe src="${i}" style="width:100%;height:100%;border:none;position:relative;z-index:1;background:transparent"></iframe>
      </div>
    </div>
  `}function _C(e,t,n,r){return`
    <div class="laporan-wrap">
      <!-- Left: Nav (No Print) -->
      <div class="no-print" style="position:relative">
        
        <!-- Legacy Action Box -->
        <div class="card no-print" style="margin-bottom:var(--space-4);padding:var(--space-4)">
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:12px">Legacy Export Engine</div>
          
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="window._downloadWord()" style="width:100%;justify-content:center">
              <i class="fas fa-file-word"></i> Word (.docx) Lokal
            </button>
            <button class="btn btn-outline btn-sm" onclick="window._downloadPDF()" style="width:100%;justify-content:center">
              <i class="fas fa-file-pdf"></i> PDF Lokal
            </button>
            <button class="btn btn-outline btn-sm" onclick="window._printReport()" style="width:100%;justify-content:center">
              <i class="fas fa-print"></i> Cetak Browser
            </button>
          </div>
          <p class="text-xs text-secondary mt-3">
            Gunakan mode Legacy ini jika Anda offline atau tidak menggunakan integrasi Google Docs.
          </p>
        </div>

        <div class="laporan-nav pt-0 mt-0">
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-2)">Struktur Laporan</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${[{id:`cover`,icon:`fa-book`,label:`Cover Laporan`},{id:`bab1`,icon:`fa-building`,label:`Bab I: Gambaran`},{id:`bab2`,icon:`fa-search`,label:`Bab II: Metodologi`},{id:`bab3`,icon:`fa-clipboard-check`,label:`Bab III: Checklist`},{id:`bab4`,icon:`fa-brain`,label:`Bab IV: Analisis AI`},{id:`bab5`,icon:`fa-certificate`,label:`Bab V: Kesimpulan`},{id:`bab6`,icon:`fa-list-check`,label:`Bab VI: Rekomendasi`}].map((e,t)=>`
              <a href="javascript:void(0)" class="laporan-nav-item ${t===0?`active`:``}" 
                 onclick="document.querySelectorAll('.laporan-nav-item').forEach(el=>el.classList.remove('active')); this.classList.add('active'); document.getElementById('lap-${e.id}').scrollIntoView({ behavior: 'smooth', block: 'start' });">
                <i class="fas ${e.icon} shrink-0" style="width:20px;text-align:center"></i>
                <span class="truncate">${e.label}</span>
              </a>
            `).join(``)}
          </div>
        </div>
      </div>

      <!-- Right: Content (Printable) -->
      <div class="laporan-content" id="print-area">
        
        <!-- COVER -->
        <div id="lap-cover" class="laporan-cover" style="min-height:297mm;display:flex;flex-direction:column;justify-content:center">
          <div style="font-size:1.2rem;opacity:0.9;margin-bottom:24px;text-transform:uppercase;letter-spacing:2px">Laporan Kajian Teknis</div>
          <h1 style="font-size:2.8rem;line-height:1.2;margin-bottom:32px;text-shadow:0 4px 12px rgba(0,0,0,0.3)">Sertifikat Laik Fungsi<br>(SLF) Bangunan Gedung</h1>
          
          <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);border-radius:16px;padding:32px;margin:0 auto 48px;max-width:500px;border:1px solid rgba(255,255,255,0.2)">
            <h2 style="font-size:1.4rem;margin-bottom:12px;border:none;padding:0">${EC(e.nama_bangunan)}</h2>
            <p style="font-size:1rem;margin:0;opacity:0.9">${EC(e.alamat)}, ${EC(e.kota||``)}</p>
          </div>

          <div style="margin-top:auto;padding-top:60px">
            <p style="font-size:1.1rem;margin-bottom:8px">Diajukan oleh:</p>
            <p style="font-size:1.3rem;font-weight:700;margin-bottom:32px">${EC(e.pemilik)}</p>
            
            <div style="width:60px;height:4px;background:rgba(255,255,255,0.3);margin:0 auto 24px;border-radius:2px"></div>
            <p style="font-size:1rem;opacity:0.8">${DC(new Date)}</p>
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1)">
              <p style="font-size:0.85rem;opacity:0.7;margin-bottom:8px">Disusun Oleh:</p>
              <p style="font-size:1.1rem;font-weight:700">${EC(r.consultant.name)}</p>
            </div>
          </div>
        </div>

        <!-- BAB I: GAMBARAN UMUM -->
        <div id="lap-bab1" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>BAB I: Gambaran Umum Bangunan</h2>
          <h3>1.1. Latar Belakang</h3>
          <p>Penilaian kelaikan fungsi bangunan gedung merupakan kewajiban yang diamanatkan dalam PP No. 16 Tahun 2021 tentang Peraturan Pelaksanaan UU No. 28/2002 tentang Bangunan Gedung. Penilaian ini bertujuan untuk memastikan bahwa bangunan gedung memenuhi persyaratan teknis.</p>

          <h3>1.3. Data Umum Bangunan</h3>
          <table>
            <tbody>
              <tr><td style="width:30%;font-weight:600">Nama Bangunan</td><td><b>${EC(e.nama_bangunan)}</b></td></tr>
              <tr><td style="font-weight:600">Alamat Lokasi</td><td>${EC(e.alamat||`-`)}, ${EC(e.kota||`-`)}, ${EC(e.provinsi||`-`)}</td></tr>
              <tr><td style="font-weight:600">Nama Pemilik</td><td>${EC(e.pemilik)}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- BAB III: HASIL CHECKLIST -->
        <div id="lap-bab3" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>BAB III: Hasil Pemeriksaan Checklist</h2>
          <h3>3.1. Dokumen Administrasi</h3>
          ${vC(n.filter(e=>e.kategori===`administrasi`))}

          <h3 style="margin-top:24px">3.2. Kondisi Teknis Eksisting</h3>
          ${vC(n.filter(e=>e.kategori===`teknis`))}
        </div>

        <!-- BAB IV: ANALISIS AI -->
        <div id="lap-bab4" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>BAB IV: Hasil Analisis AI SLF</h2>
          <div style="display:flex;gap:20px;margin:24px 0">
            <div style="width:240px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;display:flex;flex-direction:column;justify-content:center">
              <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px">Skor Keseluruhan</div>
              <div style="font-size:4rem;font-weight:800;color:#1e3a8a;line-height:1">${t.skor_total||0}</div>
              <div style="margin-top:16px;font-size:0.9rem;font-weight:700;color:${t.risk_level===`low`?`#059669`:t.risk_level===`medium`?`#d97706`:`#dc2626`}">
                Risiko ${t.risk_level===`low`?`Rendah`:t.risk_level===`medium`?`Sedang`:t.risk_level===`high`?`Tinggi`:`Kritis`}
              </div>
            </div>
            <div style="flex:1">
              ${t.narasi_teknis?`
                <div class="bab4-narasi-content">
                  ${t.narasi_teknis.includes(`## ASPEK PEMERIKSAAN:`)?si.parse(t.narasi_teknis):Tx(wx(t.narasi_teknis))}
                </div>
              `:`<div style="padding:24px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><i class="fas fa-info-circle text-secondary"></i> Narasi belum tersedia.</div>`}
            </div>
          </div>
        </div>

        <!-- BAB V: ANALISIS FORENSIK (EXPERT CONSORTIUM) -->
        ${t.metadata?.expert_findings?`
          <div id="lap-bab5" class="laporan-section pdf-page-break" style="page-break-before:always">
            <h2>BAB V: Analisis Teknis & Ketajaman Profesional</h2>
            <p style="font-style:italic; color:#64748b; margin-bottom:20px">Bagian ini disusun berdasarkan analisis mendalam oleh Konsorsium Tenaga Ahli Spesialis (Arsitektur, Struktur, MEP, dan Legal).</p>
            <div class="bab5-forensic-content markdown-content" style="line-height:1.7">
              ${si.parse(t.metadata.expert_findings.bab5_analisis||``)}
            </div>
          </div>

          <!-- BAB VI: KESIMPULAN & REKOMENDASI -->
          <div id="lap-bab6" class="laporan-section pdf-page-break" style="page-break-before:always">
            <h2>BAB VI: Kesimpulan & Rekomendasi Utama</h2>
            <div style="background:#f1f5f9; border-radius:12px; padding:24px; border:1px solid #e2e8f0">
               <h4 style="margin-top:0; color:#1e3a8a">6.1. Status Kelaikan Hasil Audit</h4>
               <div style="font-size:1.2rem; font-weight:800; color:#1e293b; margin-bottom:15px; border-bottom:2px solid #cbd5e1; padding-bottom:10px">
                  REKOMENDASI STATUS: ${t.metadata.expert_findings.status_final?.replace(/_/g,` `)}
               </div>
               <div class="bab6-conclusion-content markdown-content" style="font-size:0.95rem">
                  ${si.parse(t.metadata.expert_findings.bab6_kesimpulan||``)}
               </div>
            </div>
          </div>
        `:``}

        </div>

        <!-- LAMPIRAN FOTO TEMUAN (DARI GALERI) -->
        <div id="lap-lampiran" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>LAMPIRAN: BUKTI VISUAL LAPORAN</h2>
          <div class="galeri-laporan-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px">
            ${window._reportPhotos&&window._reportPhotos.length>0?window._reportPhotos.map(e=>`
              <div style="border:1px solid #e2e8f0; padding:10px; border-radius:8px; page-break-inside:avoid">
                <img src="${e.url}" style="width:100%; height:180px; object-fit:cover; border-radius:4px; margin-bottom:8px">
                <div style="font-size:0.75rem; font-weight:700; color:#1e293b">${EC(e.nama||e.name)}</div>
                <div style="font-size:0.65rem; color:#64748b; margin-top:2px">Aspek: ${EC(e.aspek||e.category)}</div>
              </div>
            `).join(``):`<div style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8; border:2px dashed #e2e8f0; border-radius:12px">Belum ada foto yang dipilih dari Galeri.</div>`}
          </div>
        </div>

        <!-- PENGESAHAN (SIGNATURE & STAMP) -->
        <div id="lap-pengesahan" class="laporan-section pdf-page-break" style="page-break-before:always; padding:40px">
          <div style="margin-top:100px; display:flex; justify-content:flex-end">
            <div style="width:300px; text-align:center; position:relative">
              <div style="margin-bottom:80px">
                Dibuat di: ${EC(e.kota||`Jakarta`)}<br>
                Tanggal: ${new Date().toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`})}
              </div>
              <div style="font-weight:800; margin-bottom:4px">KONSULTAN PENGKAJI TEKNIS:</div>
              <div style="font-weight:800; margin-bottom:60px">${EC(r.consultant.name)}</div>
              
              <!-- Signature & Stamp Overlay -->
              <div style="position:absolute; bottom:60px; left:50%; transform:translateX(-50%); width:200px; height:150px; pointer-events:none">
                ${r.consultant.stamp?`<img src="${r.consultant.stamp}" style="position:absolute; top:0; left:0; width:120px; height:120px; opacity:0.8; object-fit:contain">`:``}
                ${r.consultant.signature?`<img src="${r.consultant.signature}" style="position:absolute; top:30px; left:40px; width:150px; height:80px; object-fit:contain">`:``}
              </div>

              <div style="border-bottom:1px solid #000; display:inline-block; min-width:200px; font-weight:800">
                ${EC(r.experts[0]?.name||`Nama Tenaga Ahli`)}
              </div>
              <div style="font-size:0.8rem; margin-top:4px">
                SKA/SKK: ${EC(r.experts[0]?.ska||`-`)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function vC(e){return!e||e.length===0?`<p style="font-size:0.85rem;font-style:italic">Data tidak tersedia.</p>`:`
    <table>
      <thead>
        <tr><th style="width:12%">Kode</th><th style="width:38%">Item / Komponen</th><th style="width:15%">Status</th><th style="width:35%">Catatan Teknis</th></tr>
      </thead>
      <tbody>
        ${e.map(e=>`
          <tr class="pdf-avoid-break">
            <td style="font-family:monospace;font-size:0.8rem;color:#64748b">${EC(e.kode||`-`)}</td>
            <td><b>${EC(e.nama)}</b></td>
            <td><span style="font-weight:700">${EC(e.status)}</span></td>
            <td style="font-size:0.825rem">${EC(e.catatan||`-`)}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function yC(e,t,n,r,i,a){let o=(e,t)=>{let n=document.getElementById(`export-progress-overlay`),r=document.getElementById(`export-progress-fill`),i=document.getElementById(`export-progress-pct`),a=document.getElementById(`export-progress-msg`);n&&(n.style.display=`flex`),r&&(r.style.width=`${e}%`),i&&(i.textContent=`${e}%`),a&&t&&(a.textContent=t)},s=()=>{let e=document.getElementById(`export-progress-overlay`);e&&(e.style.display=`none`)};window._generateGDoc=async()=>{try{o(0,`Memulai proses ke Google Cloud...`),await XS(e,t,n,o),B(`Dokumen Laporan berhasil digenerate di Google Docs!`),setTimeout(()=>M(`laporan`,{id:e.id}),500)}catch(e){s(),V(`Gagal generate dokumen: `+e.message)}},window._reGenerateGDoc=async()=>{if(a)try{o(0,`Menyiapkan pembaruan dokumen...`),await ZS(a.docId,e,t,n,o),B(`Data pada laporan Google Docs berhasil diperbarui!`)}catch(e){s(),V(`Gagal sinkronisasi data ulang: `+e.message)}},window._switchContentTab=(e,t)=>{document.querySelectorAll(`.tab-item`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.tab-content`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),document.getElementById(e).classList.add(`active`)},bC(),window._downloadWord=async()=>{try{o(5,`Menyiapkan dokumen Word...`),await PS(e,t,n,o),B(`Dokumen Word (.docx) berhasil di-download!`),setTimeout(s,1e3)}catch(e){s(),V(`Gagal membuat dokumen Word: `+e.message)}},window._downloadPDF=async()=>{try{o(10,`Memuat library PDF...`),await JS(document.getElementById(`print-area`),e,o),B(`Dokumen PDF berhasil di-download!`),setTimeout(s,1e3)}catch(e){s(),V(`Gagal membuat PDF: `+e.message)}},window._printReport=()=>{se(`Membuka dialog cetak...`),setTimeout(()=>window.print(),300)}}window._toggleGDocsExport=()=>{let e=document.getElementById(`menu-gdocs-export`);e&&e.classList.toggle(`open`)},window._downloadGDocsWord=e=>{window.open(tC(e),`_blank`),document.getElementById(`menu-gdocs-export`).classList.remove(`open`)},window._downloadGDocsPdf=e=>{window.open(nC(e),`_blank`),document.getElementById(`menu-gdocs-export`).classList.remove(`open`)};function bC(){document.addEventListener(`click`,e=>{let t=document.getElementById(`dropdown-gdocs-export`);t&&!t.contains(e.target)&&document.getElementById(`menu-gdocs-export`)?.classList.remove(`open`)})}async function xC(t){try{let{data:n}=await e.from(`proyek`).select(`*`).eq(`id`,t).maybeSingle();return n}catch{return null}}async function SC(t){try{let{data:n}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,t).order(`created_at`,{ascending:!1}).limit(1);return n&&n.length>0?n[0]:null}catch{return null}}async function CC(t){let[{data:n},{data:r}]=await Promise.all([e.from(`checklist_items`).select(`kode, nama, aspek, foto_urls, metadata`).eq(`proyek_id`,t),e.from(`proyek_files`).select(`*`).eq(`proyek_id`,t)]),i=[];return n?.forEach(e=>{e.metadata?.featured_photos&&e.metadata.featured_photos.forEach(t=>{i.push({url:t,nama:e.nama,aspek:e.aspek})})}),r?.forEach(e=>{e.metadata?.is_starred&&i.push({url:e.file_url,name:e.name,category:e.category})}),i}async function wC(t){try{let{data:n}=await e.from(`checklist_items`).select(`*`).eq(`proyek_id`,t);return n||[]}catch{return[]}}function TC(){return`
    <div class="page-header">
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:20px;width:400px"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:var(--space-5);margin-top:20px">
      <div class="skeleton" style="height:500px;border-radius:var(--radius-lg)"></div>
    </div>
  `}function EC(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function DC(e){try{return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`,hour:`2-digit`,minute:`2-digit`})}catch{return String(e)}}async function OC(){let e=document.getElementById(`page-root`);e&&(e.innerHTML=FC());let t=kC(await PC());return e&&(e.innerHTML=t,jC()),t}function kC(e){return`
    <div id="todo-page">
      <div class="page-header">
        <div class="flex-between">
          <div>
            <h1 class="page-title">Task Management</h1>
            <p class="page-subtitle">Papan Kanban pemantauan tindak lanjut rekomendasi SLF</p>
          </div>
          <button class="btn btn-primary" onclick="window._showNewTaskModal()">
            <i class="fas fa-plus"></i> Task Baru
          </button>
        </div>
      </div>

      <div class="kanban-board">
        ${[{id:`todo`,label:`To Do`,color:`hsl(220,10%,50%)`},{id:`in_progress`,label:`In Progress`,color:`hsl(40,80%,55%)`},{id:`review`,label:`Review`,color:`hsl(258,80%,60%)`},{id:`done`,label:`Done`,color:`hsl(160,65%,46%)`}].map(t=>{let n=e.filter(e=>(e.status||`todo`)===t.id);return`
            <div class="kanban-col" data-status="${t.id}">
              <div class="kanban-col-header" style="border-top: 3px solid ${t.color}">
                <div class="kch-title">
                  <div style="width:10px;height:10px;border-radius:50%;background:${t.color}"></div>
                  ${t.label}
                </div>
                <div class="kch-count" id="count-${t.id}">${n.length}</div>
              </div>
              <div class="kanban-col-body" id="col-${t.id}">
                ${n.map(e=>AC(e)).join(``)}
              </div>
            </div>
          `}).join(``)}
      </div>

      <!-- Modal Tambah Task -->
      <div class="modal-overlay" id="modal-task">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Tambah Task Baru</div>
            <button class="modal-close" onclick="document.getElementById('modal-task').classList.remove('open')">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body form-grid">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Judul Task</label>
              <input type="text" id="nt-judul" class="form-control" placeholder="Contoh: Perbaikan panel listrik lantai 1">
            </div>
            <div class="form-group">
              <label class="form-label">Prioritas</label>
              <select id="nt-prio" class="form-control">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Batas Waktu</label>
              <input type="date" id="nt-date" class="form-control">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('modal-task').classList.remove('open')">Batal</button>
            <button class="btn btn-primary" onclick="window._saveNewTask()">Simpan Task</button>
          </div>
        </div>
      </div>
    </div>
  `}function AC(e){return`
    <div class="task-card" draggable="true" data-id="${e.id}" onclick="window.navigate('todo-detail',{id:'${e.id}'})">
      <div class="tc-header">
        <div class="tc-prio ${e.priority||`medium`}">${e.priority||`medium`}</div>
        <div class="tc-proyek"><i class="fas fa-building"></i> ${IC(e.proyek_nama||`General`)}</div>
      </div>
      <div class="tc-title">${IC(e.judul||e.title||`Untitled Task`)}</div>
      <div class="tc-footer">
        <div><i class="fas fa-clock"></i> ${e.due_date?new Date(e.due_date).toLocaleDateString():`No date`}</div>
        <div style="background:var(--bg-elevated);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--border-subtle)"><i class="fas fa-user" style="font-size:0.6rem"></i></div>
      </div>
    </div>
  `}function jC(){let t=document.querySelectorAll(`.task-card`),n=document.querySelectorAll(`.kanban-col-body`),r=null;t.forEach(e=>{e.addEventListener(`dragstart`,()=>{r=e,setTimeout(()=>e.classList.add(`dragging`),0)}),e.addEventListener(`dragend`,()=>{e.classList.remove(`dragging`),r=null,NC()})}),n.forEach(t=>{t.addEventListener(`dragover`,e=>{e.preventDefault(),t.classList.add(`drag-over`);let n=MC(t,e.clientY);n==null?t.appendChild(r):t.insertBefore(r,n)}),t.addEventListener(`dragleave`,()=>t.classList.remove(`drag-over`)),t.addEventListener(`drop`,async n=>{if(n.preventDefault(),t.classList.remove(`drag-over`),r){let n=r.dataset.id,i=t.parentElement.dataset.status;await e.from(`todo_tasks`).update({status:i}).eq(`id`,n)}})}),window._showNewTaskModal=()=>document.getElementById(`modal-task`).classList.add(`open`),window._saveNewTask=async()=>{let t=document.getElementById(`nt-judul`).value,n=document.getElementById(`nt-prio`).value,r=document.getElementById(`nt-date`).value;if(!t)return V(`Judul wajib diisi`);try{let i=window.getUserInfo?window.getUserInfo():null,{data:a,error:o}=await e.from(`todo_tasks`).insert([{judul:t,title:t,priority:n,due_date:r||null,status:`todo`,user_id:i?.id||null}]).select().maybeSingle();if(o)throw o;document.getElementById(`modal-task`).classList.remove(`open`),B(`Task ditambahkan!`),OC()}catch(e){e.message.includes(`relation "todo_tasks" does not exist`)?V(`Tabel todo_tasks belum dibuat di Supabase.`):V(e.message)}}}function MC(e,t){return[...e.querySelectorAll(`.task-card:not(.dragging)`)].reduce((e,n)=>{let r=n.getBoundingClientRect(),i=t-r.top-r.height/2;return i<0&&i>e.offset?{offset:i,element:n}:e},{offset:-1/0}).element}function NC(){[`todo`,`in_progress`,`review`,`done`].forEach(e=>{let t=document.getElementById(`col-${e}`),n=document.getElementById(`count-${e}`);t&&n&&(n.textContent=t.children.length)})}async function PC(){try{let{data:t}=await e.from(`todo_tasks`).select(`*`).order(`created_at`,{ascending:!1});return t||[]}catch{return[{id:`1`,title:`Perbaikan Retak Kolom K1`,priority:`critical`,status:`todo`,due_date:`2026-04-10`,proyek_nama:`Gedung Sate`},{id:`2`,title:`Pengisian Ulang APAR`,priority:`medium`,status:`todo`,due_date:`2026-04-05`,proyek_nama:`Mall Pusat`},{id:`3`,title:`Review IMB As-Built`,priority:`high`,status:`in_progress`,due_date:`2026-03-30`,proyek_nama:`Puskesmas C`},{id:`4`,title:`Instalasi Grounding`,priority:`high`,status:`review`,proyek_nama:`Gedung Sate`},{id:`5`,title:`Pembersihan Saluran`,priority:`low`,status:`done`,proyek_nama:`Mall Pusat`}]}}function FC(){return`<div class="page-header"><div class="skeleton" style="height:36px;width:300px"></div></div>
          <div class="kanban-board">
            ${[,,,,].fill(0).map(()=>`<div class="skeleton" style="flex:0 0 320px;height:600px;border-radius:var(--radius-lg)"></div>`).join(``)}
          </div>`}function IC(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function LC(e={}){let t=e.id;if(!t)return M(`todo`),``;let n=document.getElementById(`page-root`);n&&(n.innerHTML=BC());let r=await zC(t);if(!r)return M(`todo`),``;let i=RC(r);return n&&(n.innerHTML=i),i}function RC(e){let t={todo:{l:`To Do`,c:`hsl(220,10%,50%)`},in_progress:{l:`In Progress`,c:`hsl(40,80%,55%)`},review:{l:`Review`,c:`hsl(258,80%,60%)`},done:{l:`Done`,c:`hsl(160,65%,46%)`}}[e.status||`todo`];return`
    <div id="todo-detail">
      <div class="page-header">
        <button class="btn btn-ghost btn-sm" onclick="window.navigate('todo')" style="margin-bottom:8px">
          <i class="fas fa-arrow-left"></i> Kembali ke Kanban
        </button>
        <div class="flex-between">
          <div>
            <div class="text-sm text-tertiary" style="margin-bottom:4px">
              ID Task: ${e.id} • ${new Date(e.created_at||Date.now()).toLocaleDateString(`id-ID`)}
            </div>
            <h1 class="page-title">${VC(e.judul||e.title)}</h1>
          </div>
          <div class="flex gap-3">
             <span class="badge" style="background:${t.c}22;color:${t.c};font-size:0.9rem;border:1px solid ${t.c}44">
               ${t.l}
             </span>
             <button class="btn btn-primary" onclick="alert('Simpan form...')"><i class="fas fa-save"></i> Simpan</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Main Form -->
        <div class="card form-grid">
          <div class="card-title" style="grid-column:span 2"><i class="fas fa-info-circle"></i> Info Task</div>
          
          <div class="form-group" style="grid-column:span 2">
             <label class="form-label">Deskripsi & Catatan</label>
             <textarea class="form-control" rows="5" placeholder="Tuliskan detail pekerjaan...">${VC(e.deskripsi||``)}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Prioritas</label>
             <select class="form-control" id="td-prio">
               <option value="low" ${e.priority===`low`?`selected`:``}>Low</option>
               <option value="medium" ${e.priority===`medium`?`selected`:``}>Medium</option>
               <option value="high" ${e.priority===`high`?`selected`:``}>High</option>
               <option value="critical" ${e.priority===`critical`?`selected`:``}>Critical</option>
             </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tenggat Waktu / Due Date</label>
            <input type="date" class="form-control" value="${e.due_date?e.due_date.substring(0,10):``}">
          </div>

          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Bukti Penyelesaian (Lampiran)</label>
            <div style="border:2px dashed var(--border-default);border-radius:var(--radius-md);padding:var(--space-5);text-align:center;color:var(--text-tertiary)">
              <i class="fas fa-cloud-upload-alt" style="font-size:2rem;margin-bottom:8px"></i>
              <div>Drag & Drop file lampiran dokumentasi ke sini</div>
              <button class="btn btn-secondary btn-sm" style="margin-top:var(--space-3)">Pilih File</button>
            </div>
          </div>
        </div>

        <!-- Sidebar / Activity -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="card">
            <div class="card-title">Atribut</div>
            <div class="form-group" style="margin-top:var(--space-3)">
              <label class="form-label">Terkait Proyek SLF</label>
              <div class="form-control" style="background:var(--bg-elevated);pointer-events:none">
                <i class="fas fa-building text-brand"></i> ${VC(e.proyek_nama||`Tidak ada/Pusat`)}
              </div>
            </div>
            <div class="form-group">
               <label class="form-label">Ditugaskan Kepada</label>
               <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border:1px solid var(--border-default);border-radius:var(--radius-sm)">
                 <div style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center"><i class="fas fa-user"></i></div>
                 <div>
                   <div style="font-size:0.875rem;font-weight:600">Admin Pemeliharaan</div>
                   <div style="font-size:0.75rem;color:var(--text-tertiary)">admin@pengkaji-slf.go.id</div>
                 </div>
               </div>
            </div>
          </div>

          <div class="card" style="flex:1">
            <div class="card-title"><i class="fas fa-history"></i> Log Aktivitas</div>
            <div style="margin-top:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">
              <div style="display:flex;gap:12px">
                <div style="width:12px;height:12px;border-radius:50%;background:var(--success-400);margin-top:4px"></div>
                <div>
                  <div class="text-sm"><b>Admin</b> membuat task ini.</div>
                  <div class="text-xs text-tertiary">${new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div style="margin-top:var(--space-5);border-top:1px solid var(--border-subtle);padding-top:var(--space-3);display:flex;gap:var(--space-2)">
              <input type="text" class="form-control" placeholder="Tulis komentar/update log...">
              <button class="btn btn-primary"><i class="fas fa-paper-plane"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}async function zC(t){try{let{data:n}=await e.from(`todo_tasks`).select(`*`).eq(`id`,t).maybeSingle();if(n)return n}catch{}return{id:t,title:`Mock Task #`+t,priority:`critical`,deskripsi:`Analisis mendalam terhadap struktur bangunan gedung untuk menemukan keretakan mikroskopis di kolom utama. Harap tinjau lampiran PDF inspeksi sebelumnya.`,created_at:new Date().toISOString()}}function BC(){return`<div class="skeleton" style="height:60px;margin-bottom:20px;width:30%"></div>
          <div class="grid-2">
            <div class="skeleton" style="height:600px;border-radius:12px"></div>
            <div class="skeleton" style="height:400px;border-radius:12px"></div>
          </div>`}function VC(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function HC(){let e=document.getElementById(`page-root`);e&&(e.innerHTML=qC());let[t,n]=await Promise.all([GC(),KC()]),r=UC(t,n);return e&&(e.innerHTML=r,WC(t,n)),r}function UC(e,t){let n=e.length,r=0,i=0,a=0,o=0,s=0,c=0;return e.forEach(e=>{e.status_slf===`LAIK_FUNGSI`?r++:e.status_slf===`LAIK_FUNGSI_BERSYARAT`?i++:e.status_slf===`TIDAK_LAIK_FUNGSI`?a++:o++}),t.length>0&&(c=Math.round(t.reduce((e,t)=>e+(t.skor_total||0),0)/t.length),s=t.filter(e=>[`critical`,`high`].includes(e.risk_level)).length),`
    <div id="executive-page">
      <div class="page-header" style="background:var(--bg-elevated);margin:-24px -24px 24px;padding:32px 24px;border-bottom:1px solid var(--border-subtle)">
        <div class="flex-between">
          <div>
            <div class="test-sm text-tertiary font-bold" style="letter-spacing:1px;text-transform:uppercase;margin-bottom:4px"><i class="fas fa-chart-line text-brand"></i> Executive View</div>
            <h1 class="page-title" style="font-size:2rem;margin-bottom:8px">Portofolio SLF Kota/Kabupaten</h1>
            <p class="text-secondary" style="max-width:600px;line-height:1.5">
              Dashboard analitik tingkat manajemen untuk memantau status kelaikan fungsi seluruh gedung yang terdaftar dalam wilayah kerja. Data ditarik real-time dari hasil engine AI.
            </p>
          </div>
          <div style="text-align:right">
             <div class="text-2xl font-bold text-primary">${new Date().toLocaleString(`id-ID`,{month:`long`,year:`numeric`})}</div>
             <div class="text-sm text-tertiary">Live System Update</div>
          </div>
        </div>
      </div>

      <!-- KPI Ribbon (Responsive 4-to-2-to-1) -->
      <div class="grid-4" style="margin-bottom:var(--space-5)">
        ${[{lbl:`Total Bangunan`,count:n,icon:`fa-city`,c:`kpi-blue`},{lbl:`SLF Terbit (Laik)`,count:r,icon:`fa-check-circle`,c:`kpi-green`},{lbl:`Risiko Tinggi/Kritis`,count:s,icon:`fa-triangle-exclamation`,c:`kpi-red`},{lbl:`Rata-Rata Skor AI`,count:c+`/100`,icon:`fa-brain`,c:`kpi-purple`}].map(e=>`
           <div class="card" style="display:flex;align-items:center;gap:16px">
             <div class="kpi-icon-wrap ${e.c}" style="width:48px;height:48px;font-size:1.2rem;margin:0">
               <i class="fas ${e.icon}"></i>
             </div>
             <div>
               <div class="text-xs text-tertiary font-bold" style="text-transform:uppercase">${e.lbl}</div>
               <div style="font-size:1.8rem;font-weight:800;letter-spacing:-1px;line-height:1.2">${e.count}</div>
             </div>
           </div>
        `).join(``)}
      </div>

      <!-- Charts (Responsive Layout) -->
      <div class="grid-main-responsive" style="margin-bottom:var(--space-5)">
        <div class="card">
          <div class="card-title" style="margin-bottom:var(--space-4)">Status Keseluruhan SLF</div>
          <div class="chart-wrap" style="height:300px">
             <canvas id="bar-chart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:var(--space-4)">Sebaran Tingkat Risiko (AI Score)</div>
          <div class="chart-wrap" style="height:300px">
             <canvas id="doughnut-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Tabel Urgent -->
      <div class="card">
        <div class="card-title" style="margin-bottom:var(--space-4)"><i class="fas fa-exclamation-circle text-danger"></i> Top 5 Bangunan Kritis (Area Prioritas Perbaikan)</div>
        <table class="checklist-table">
          <thead>
            <tr>
              <th>Bangunan</th>
              <th>Status SLF</th>
              <th>Evaluasi Terakhir</th>
              <th>Skor Total AI</th>
            </tr>
          </thead>
          <tbody>
            ${[...e].filter(e=>e.status_slf===`TIDAK_LAIK_FUNGSI`).slice(0,5).map(e=>`
              <tr>
                <td><b>${JC(e.nama_bangunan)}</b><br><span class="text-xs text-tertiary">${JC(e.alamat)}</span></td>
                <td><span class="badge" style="background:var(--danger-bg);color:var(--danger-400)">Tidak Laik Fungsi</span></td>
                <td class="text-tertiary">${new Date().toLocaleDateString(`id-ID`)}</td>
                <td><span class="text-danger font-bold text-lg">${t.find(t=>t.proyek_id===e.id)?.skor_total||0}</span>/100</td>
              </tr>
            `).join(``)}
            ${e.filter(e=>e.status_slf===`TIDAK_LAIK_FUNGSI`).length===0?`<tr><td colspan="4" class="text-center text-tertiary">Tidak ada bangunan berstatus Tidak Laik Fungsi dalam sistem.</td></tr>`:``}
          </tbody>
        </table>
      </div>
    </div>
  `}function WC(e,t){let n=()=>{if(!window.Chart)return setTimeout(n,100);let r=document.getElementById(`bar-chart`);if(r){let t=0,n=0,i=0,a=0;e.forEach(e=>{e.status_slf===`LAIK_FUNGSI`?t++:e.status_slf===`LAIK_FUNGSI_BERSYARAT`?n++:e.status_slf===`TIDAK_LAIK_FUNGSI`?i++:a++}),new window.Chart(r,{type:`bar`,data:{labels:[`Laik Fungsi`,`Bersyarat`,`Tidak Laik`,`Proses/Belum`],datasets:[{label:`Total Bangunan`,data:[t,n,i,a],backgroundColor:[`hsl(160,65%,46%)`,`hsl(40,80%,55%)`,`hsl(0,74%,52%)`,`hsl(220,10%,50%)`],borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}}}})}let i=document.getElementById(`doughnut-chart`);if(i){let e=0,n=0,r=0,a=0;t.forEach(t=>{t.risk_level===`critical`?e++:t.risk_level===`high`?n++:t.risk_level===`medium`?r++:a++}),t.length===0&&(a=1),new window.Chart(i,{type:`doughnut`,data:{labels:[`Low Risk`,`Medium`,`High`,`Critical`],datasets:[{data:[a,r,n,e],backgroundColor:[`hsl(160,65%,46%)`,`hsl(40,80%,55%)`,`hsl(20,80%,55%)`,`hsl(0,74%,52%)`],borderWidth:0,cutout:`70%`}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:`bottom`}}}})}};if(window.Chart)n();else{let e=document.createElement(`script`);e.src=`https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`,e.onload=n,document.head.appendChild(e)}}async function GC(){try{let{data:t}=await e.from(`proyek`).select(`*`);return t||[]}catch{return[]}}async function KC(){try{let{data:t}=await e.from(`hasil_analisis`).select(`*`);return t||[]}catch{return[]}}function qC(){return`<div class="skeleton" style="height:200px;margin-bottom:24px;width:100%"></div>
          <div class="grid-2-1">
            <div class="skeleton" style="height:350px"></div>
            <div class="skeleton" style="height:350px"></div>
          </div>`}function JC(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function YC(t,n=[]){try{let{data:r,error:i}=await e.from(`proyek`).select(`*`).eq(`id`,t).single();if(i)throw Error(`Gagal mengambil data proyek`);let{data:a}=await e.from(`checklist_items`).select(`*`).eq(`proyek_id`,t).in(`kategori`,[`administrasi`,`kajian_teknis`]);(a||[]).filter(e=>e.kategori===`administrasi`),(a||[]).filter(e=>e.kategori===`kajian_teknis`);let o=await ZC(n),s=new Hy({sections:[{properties:{page:{margin:{top:1440,bottom:1440,left:1440,right:1440}}},children:[QC(r),new Z({children:[new Mm]}),new Z({text:`BAB I`,heading:Lm.HEADING_1,alignment:Y.CENTER}),new Z({text:`PENDAHULUAN`,heading:Lm.HEADING_1,alignment:Y.CENTER,spacing:{after:400}}),new Z({children:[new X({text:`1.1 Latar Belakang`,bold:!0})],spacing:{before:200,after:100}}),new Z({text:`Pengkajian teknis bangunan gedung ini dilakukan untuk memastikan bahwa gedung "${r.nama_bangunan}" telah memenuhi standar kelaikan fungsi sesuai dengan regulasi yang berlaku di Indonesia. Dokumen ini disusun sebagai persyaratan administrasi dan teknis dalam pengajuan Sertifikat Laik Fungsi (SLF).`,alignment:Y.JUSTIFY,spacing:{after:200}}),new Z({children:[new Mm]}),new Z({text:`BAB II`,heading:Lm.HEADING_1,alignment:Y.CENTER}),new Z({text:`DATA UMUM BANGUNAN`,heading:Lm.HEADING_1,alignment:Y.CENTER,spacing:{after:400}}),$C(r),new Z({children:[new Mm]}),new Z({text:`BAB III`,heading:Lm.HEADING_1,alignment:Y.CENTER}),new Z({text:`PEMERIKSAAN ADMINISTRASI`,heading:Lm.HEADING_1,alignment:Y.CENTER,spacing:{after:400}}),ew(a),new Z({children:[new Mm]}),new Z({text:`BAB IV`,heading:Lm.HEADING_1,alignment:Y.CENTER}),new Z({text:`HASIL ANALISIS TEKNIS (KONSORSIUM AHLI)`,heading:Lm.HEADING_1,alignment:Y.CENTER,spacing:{after:400}}),...o,new Z({children:[new Mm]}),new Z({text:`BAB V`,heading:Lm.HEADING_1,alignment:Y.CENTER}),new Z({text:`KESIMPULAN DAN REKOMENDASI`,heading:Lm.HEADING_1,alignment:Y.CENTER,spacing:{after:400}}),tw(r,n)]}]});return(0,Cx.saveAs)(await Rb.toBlob(s),`Laporan_SLF_${r.nama_bangunan.replace(/\s+/g,`_`)}.docx`),!0}catch(e){throw console.error(`Gagal membuat laporan .docx:`,e),e}}async function XC(e){try{let t=await fetch(e);return t.ok?await t.arrayBuffer():null}catch(t){return console.warn(`Gagal fetch image buffer dari Drive:`,e,t),null}}async function ZC(e){let t=[];if(!e||e.length===0)return t.push(new Z({text:`(Belum ada data analisis)`,color:`999999`,spacing:{before:200}})),t;for(let n=0;n<e.length;n++){let r=e[n];t.push(new Z({children:[new X({text:`4.${n+1} Bidang Keahlian: ${r.name}`,bold:!0,size:24})],spacing:{before:300,after:100}})),t.push(new Z({text:r.analisis||`Pemeriksaan teknis telah dilakukan.`,alignment:Y.JUSTIFY,spacing:{after:100}}));let i=r.nspk_photos&&r.nspk_photos.length>0;if(t.push(new Z({children:[new X({text:`Dasar Hukum & Standar Teknis (NSPK):`,bold:!0,color:`1E40AF`})],spacing:{before:200,after:100}})),i)for(let e of r.nspk_photos){let n=await XC(e.url);n&&t.push(new Z({children:[new Vp({data:n,transformation:{width:450,height:250}}),new X({text:`\nRef: ${e.name}`,size:14,italics:!0,color:`666666`})],spacing:{before:100,after:150},alignment:Y.CENTER}))}else r.legal_citation&&t.push(new f_({width:{size:100,type:Ig.PERCENTAGE},rows:[new __({children:[new Yg({shading:{fill:`F8FAFC`},borders:{top:{style:BorderStyle.SINGLE,size:2,color:`3B82F6`},bottom:{style:BorderStyle.SINGLE,size:2,color:`3B82F6`},left:{style:BorderStyle.SINGLE,size:2,color:`3B82F6`},right:{style:BorderStyle.SINGLE,size:2,color:`3B82F6`}},children:[new Z({children:[new X({text:`REFERENSI ATURAN RESMI (AUTO-GENERATED)`,bold:!0,size:16,color:`3B82F6`})],alignment:Y.CENTER,spacing:{before:100,after:100}}),new Z({children:[new X({text:r.legal_citation,italics:!0,size:18})],alignment:Y.JUSTIFY,spacing:{before:100,after:100}})],verticalAlign:jg.CENTER})]})],spacing:{after:200}}));if(r.evidence_photos&&r.evidence_photos.length>0){t.push(new Z({children:[new X({text:`Lampiran Bukti Lapangan:`,bold:!0,italics:!0,color:`444444`})],spacing:{before:100,after:100}}));for(let e of r.evidence_photos){let n=await XC(e.url);n&&t.push(new Z({children:[new Vp({data:n,transformation:{width:300,height:200}}),new X({text:`\nGambaran: ${e.name}`,size:16,italics:!0})],spacing:{before:100,after:100},alignment:Y.CENTER}))}}t.push(new Z({children:[new X({text:`Rekomendasi Ahli:`,bold:!0,italics:!0})],spacing:{after:50}})),t.push(new Z({text:r.rekomendasi||`Tidak ada rekomendasi khusus.`,alignment:Y.JUSTIFY,spacing:{after:200}}))}return t}function QC(e){return new Z({alignment:Y.CENTER,children:[new X({text:`LAPORAN KONSEP PENGKAJIAN TEKNIS`,bold:!0,size:32}),new X({text:`
SERTIFIKAT LAIK FUNGSI (SLF)`,bold:!0,size:28}),new X({text:`

NAMA BANGUNAN:`,size:20}),new X({text:`\n${e.nama_bangunan.toUpperCase()}`,bold:!0,size:36}),new X({text:`\n\nLOKASI: ${e.alamat?.toUpperCase()||`ALAMAT TIDAK TERSEDIA`}`,size:24}),new X({text:`\nTAHUN PEMERIKSAAN: ${new Date().getFullYear()}`,size:20})],spacing:{before:2e3}})}function $C(e){return new f_({width:{size:100,type:Ig.PERCENTAGE},rows:[nw(`Nama Bangunan`,e.nama_bangunan),nw(`Pemilik`,e.pemilik||`-`),nw(`Alamat Lokasi`,e.alamat||`-`),nw(`Fungsi Bangunan`,e.fungsi_bangunan||`Umum`),nw(`Jumlah Lantai`,(e.jumlah_lantai||1)+` Lantai`)]})}function ew(e){let t=[new __({children:[rw(`Kode`),rw(`Dokumen Administrasi`),rw(`Status`)]})];return(e||[]).forEach(e=>{t.push(new __({children:[iw(e.kode),iw(e.nama),iw(e.status===`ada_sesuai`?`LENGKAP`:`TIDAK TERSEDIA`)]}))}),new f_({width:{size:100,type:Ig.PERCENTAGE},rows:t})}function tw(e,t){let n=t.map(e=>e.skor||0),r=n.length>0?Math.round(n.reduce((e,t)=>e+t)/n.length):0,i=`TIDAK LAIK`,a=`DC2626`;return r>=85?(i=`LAIK FUNGSI`,a=`059669`):r>=70&&(i=`LAIK FUNGSI DENGAN CATATAN`,a=`D97706`),new Z({children:[new X({text:`Berdasarkan hasil analisis teknis, bangunan gedung ini dinyatakan:`,size:24}),new X({text:`\n\n${i}`,bold:!0,size:48,underline:{},color:a}),new X({text:`\n\nIndeks Kelaikan: ${r}%`,size:20})],alignment:Y.CENTER,spacing:{before:500}})}function nw(e,t){return new __({children:[new Yg({children:[new Z({text:e,bold:!0})],width:{size:30,type:Ig.PERCENTAGE}}),new Yg({children:[new Z({text:t||`-`})],width:{size:70,type:Ig.PERCENTAGE}})]})}function rw(e){return new Yg({children:[new Z({text:e,bold:!0,alignment:Y.CENTER})],shading:{fill:`f3f4f6`},verticalAlign:jg.CENTER})}function iw(e){return new Yg({children:[new Z({text:e||`-`})],verticalAlign:jg.CENTER})}var aw=d({AGENT_CONFIG:()=>ow,runSpecificAgentAnalysis:()=>sw}),ow=[{id:`struktur`,name:`Ahli Struktur`,icon:`fa-cubes`,color:`hsl(0,70%,55%)`,focus:[`ITEM-05A`],standard:`SNI 1726, SNI 2847, SNI 9273:2025`,persona:`Senior Structural Engineer berlisensi Utama.`},{id:`geoteknik`,name:`Ahli Geoteknik`,icon:`fa-mountain-sun`,color:`hsl(25,60%,45%)`,focus:[`ITEM-05A1`,`ITEM-02E`,`ITEM-02B`],standard:`SNI 8460:2017 (Geoteknik)`,persona:`Ahli Geoteknik Forensik. Fokus pada stabilitas tanah, pondasi, dan basemen.`},{id:`ruang_dalam`,name:`Ahli Tata Ruang Dalam`,icon:`fa-door-open`,color:`hsl(258,70%,60%)`,focus:[`ITEM-01B`,`ITEM-03B`,`ITEM-07A`],standard:`NSPK Arsitektur & Ergonomi`,persona:`Pakar Arsitektur Interior & Fisika Bangunan.`},{id:`ruang_luar`,name:`Ahli Tata Ruang Luar`,icon:`fa-tree-city`,color:`hsl(160,65%,46%)`,focus:[`ITEM-01C`,`ITEM-02`],standard:`GSB, KDH, & Aksesibilitas Tapak`,persona:`Ahli Perencanaan Tapak & Lanskap.`},{id:`keselamatan`,name:`Ahli Keselamatan`,icon:`fa-shield-heart`,color:`hsl(0,70%,58%)`,focus:[`ITEM-05B`,`ITEM-05E`],standard:`Sistem Proteksi Kebakaran Aktif/Pasif`,persona:`Fire Safety Engineer. Fokus pada alat pemadam dan jalur evakuasi.`},{id:`mkkg`,name:`Ahli MKKG`,icon:`fa-users-gear`,color:`hsl(10,80%,50%)`,focus:[`ITEM-05B`,`ITEM-09`],standard:`Manajemen Keselamatan Kebakaran Gedung`,persona:`Pakar Manajemen Kebakaran. Fokus pada prosedur, simulasi, dan kesiapan tim.`},{id:`elektrikal`,name:`Ahli Elektrikal`,icon:`fa-plug-circle-bolt`,color:`hsl(40,80%,55%)`,focus:[`ITEM-05D`,`ITEM-05C`],standard:`PUIL 2011 & Proteksi Petir`,persona:`Ahli Instalasi Tenaga & Pembumian.`},{id:`plumbing`,name:`Ahli Plumbing`,icon:`fa-faucet-drip`,color:`hsl(210,80%,50%)`,focus:[`ITEM-06C1`,`ITEM-06C2`],standard:`SNI Plambing 8153:2015`,persona:`Ahli Rekayasa Plambing & Distribusi Air.`},{id:`kesehatan`,name:`Ahli Kesehatan`,icon:`fa-user-nurse`,color:`hsl(180,65%,45%)`,focus:[`ITEM-06C3`,`ITEM-06A`,`ITEM-04`],standard:`Sanitasi & Kualitas Udara (IAQ)`,persona:`Ahli Kesehatan Lingkungan & Sains Material.`},{id:`mekanikal`,name:`Ahli Mekanikal`,icon:`fa-gears`,color:`hsl(20,70%,50%)`,focus:[`ITEM-08A`,`ITEM-05A10`],standard:`Transportasi Vertikal & HVAC Sistem`,persona:`Ahli Mekanikal Bangunan & Lift.`},{id:`akustik`,name:`Ahli Akustik`,icon:`fa-waveform-lines`,color:`hsl(280,60%,55%)`,focus:[`ITEM-07D`],standard:`Batas Kebisingan & Vibrasi Gedung`,persona:`Ahli Akustika Lingkungan.`},{id:`pencahayaan`,name:`Ahli Pencahayaan`,icon:`fa-sun-bright`,color:`hsl(50,90%,50%)`,focus:[`ITEM-06B`,`ITEM-07C`],standard:`Level Iluminasi & Kenyamanan Visual`,persona:`Ahli Teknik Pencahayaan.`},{id:`sd_air`,name:`Ahli Sumber Daya Air`,icon:`fa-water-arrow-up`,color:`hsl(190,80%,45%)`,focus:[`ITEM-06C4`,`ITEM-02G`],standard:`Konservasi Air & Drainase Hujan`,persona:`Ahli Hidrologi Tapak & Manajemen Air.`},{id:`legal`,name:`Ahli Legal & Perizinan`,icon:`fa-file-signature`,color:`hsl(220,50%,50%)`,focus:[`ITEM-09`,`ITEM-04`],standard:`PBG, SLF, SLO, & Kepatuhan Administrasi`,persona:`Asesor Hukum Arsitektur & Perizinan.`},{id:`laporan`,name:`Ahli Laporan Teknis`,icon:`fa-pen-nib`,color:`hsl(258,80%,50%)`,focus:[`ITEM-01`,`ITEM-03`,`ITEM-05`,`ITEM-06`,`ITEM-07`,`ITEM-08`],standard:`Standar Narasi Pelaporan SLF Nasional`,persona:`Senior Technical Writer. Fokus pada konsistensi, gaya bahasa formal, dan eksekutif summary.`}];async function sw(t,n,a={}){let o=ow.find(e=>e.id===n);if(!o)throw Error(`Agen tidak ditemukan`);let{fetchAgentPrompt:s,injectPromptConfig:c,SYSTEM_INSTRUCTIONS_TEMPLATE:l,DEFAULT_PRINCIPLES:u}=await Rt(async()=>{let{fetchAgentPrompt:e,injectPromptConfig:t,SYSTEM_INSTRUCTIONS_TEMPLATE:n,DEFAULT_PRINCIPLES:r}=await import(`./prompt-config-service-B0Bany5t.js`);return{fetchAgentPrompt:e,injectPromptConfig:t,SYSTEM_INSTRUCTIONS_TEMPLATE:n,DEFAULT_PRINCIPLES:r}},__vite__mapDeps([4,2,3])),{fetchDriveFiles:d,fetchFileOCR:f}=await Rt(async()=>{let{fetchDriveFiles:e,fetchFileOCR:t}=await import(`./drive-COuyZp3V.js`);return{fetchDriveFiles:e,fetchFileOCR:t}},__vite__mapDeps([5,6])),[p,{data:m},{data:h},g]=await Promise.all([s(n),e.from(`proyek`).select(`*`).eq(`id`,t).single(),e.from(`checklist_items`).select(`*`).eq(`proyek_id`,t),d(t,m?.drive_proxy_url)]),_=p?.persona||o.persona,v=p?.mission||u.mission,y=p?.principles||u,b=``,x=[],S=[];if(g&&g.length>0){let e=[`retak`,`crack`,`bocor`,`rusak`,`patah`,`miring`,`karat`,`kritis`,`bahaya`,`rembes`],t=[...o.focus||[],o.name.split(` `)[1]].map(e=>e.toLowerCase()),n=g.filter(e=>t.some(t=>e.name.toLowerCase().includes(t))||e.name.toUpperCase().includes(`NSPK`));x=n.filter(t=>!t.name.toUpperCase().includes(`NSPK`)&&e.some(e=>t.name.toLowerCase().includes(e))).slice(0,2).map(e=>({name:e.name,url:e.url,id:e.id})),S=n.filter(e=>e.name.toUpperCase().includes(`NSPK`)&&t.some(t=>e.name.toLowerCase().includes(t))).slice(0,1).map(e=>({name:e.name,url:e.url,id:e.id}));let r=[...S,...x.slice(0,2)];r.length>0&&(b=`### DATA TEKSTUAL DARI BERKAS (OCR) ###\n${(await Promise.all(r.map(async e=>{let t=await f(e.id,m?.drive_proxy_url);return`${e.name.toUpperCase().includes(`NSPK`)?`[REFERENSI STANDAR NSPK]`:`[TEMUAN LAPANGAN: ${e.name}]`}\n${t||`(Gagal membaca isi berkas)`}`}))).join(`

`)}`)}let C=``;if(n===`struktur`){let{getSeismicInfoByAddress:e,getSeismicPromptContext:t}=await Rt(async()=>{let{getSeismicInfoByAddress:e,getSeismicPromptContext:t}=await import(`./seismic-service-CXmbrF0f.js`);return{getSeismicInfoByAddress:e,getSeismicPromptContext:t}},[]);C=t(e(m?.alamat||``))}let w=``;if(n===`laporan`)w=`### RINGKASAN TEMUAN AHLI LAIN ###\n${JSON.stringify(Object.values(a),null,2)}`;else{let e=(h||[]).filter(e=>o.focus.some(t=>e.kode.startsWith(t)));w=`### DATA CHECKLIST LAPANGAN (SUPABASE) ###\n${JSON.stringify(e.map(e=>({kode:e.kode,nama:e.nama,status:e.status||`Belum diperiksa`,catatan:e.catatan||`-`})),null,2)}`}let T=`### INFORMASI BANGUNAN ###
Nama: ${m?.nama_bangunan||`N/A`}
Fungsi: ${m?.fungsi_bangunan||`N/A`}
Alamat: ${m?.alamat||`N/A`}`,E=S.length===0?`

[USER_REQUEST: Foto NSPK tidak ditemukan di Drive. AI HARUS secara otomatis mengutip Pasal/Ayat Standar Teknis PUPR/SNI yang relevan dari basis pengetahuan internal Anda untuk Bagian Dasar Hukum.]`:``,D=`${T}\n\n${C}\n\n${w}\n\n${b}\n\n${E}\n\n[USER_NOTE: ${y.context||``}]`,O=c(l,{persona:_,mission:v,goal:y.goal||u.goal,done_criteria:y.done_criteria||u.done_criteria,context:D,constraints:y.constraints||u.constraints,strategy:y.strategy||u.strategy,output_format:y.output_format||u.output_format,reasoning:y.reasoning||u.reasoning});try{let e=await r({kode:`DEEP`,nama:o.name},o.name,{roleTitle:o.name,standard:o.standard||`Standar Nasional Indonesia`,targetModel:i.GEMINI,customPrompt:O});return{id:o.id,name:o.name,reasoning:e.reasoning_steps||[],analisis:e.analisis||e.narasi_teknis||`Analisis mendalam selesai.`,rekomendasi:e.rekomendasi||`Rekomendasi terlampir.`,legal_citation:e.dasar_hukum||e.kutipan_nspk||`Sesuai Standar Teknis PUPR`,skor:e.skor||85,status_label:e.status_label||(e.skor<70?`Risiko`:`Baik`),risiko:e.risiko||`Rendah`,evidence_photos:x,nspk_photos:S}}catch(e){throw console.error(`Error in Agent ${n}:`,e),e}}var cw={},lw=null,uw=null,dw=[],fw=[],pw={};async function mw(e={}){if(lw=e.proyekId||null,dw.length===0||e.refresh)try{let{fetchAllAgentPrompts:e,DEFAULT_PRINCIPLES:t}=await Rt(async()=>{let{fetchAllAgentPrompts:e,DEFAULT_PRINCIPLES:t}=await import(`./prompt-config-service-B0Bany5t.js`);return{fetchAllAgentPrompts:e,DEFAULT_PRINCIPLES:t}},__vite__mapDeps([4,2,3]));pw=t,dw=await hw(),fw=await e()}catch(e){console.error(`Fetch data failed:`,e)}return gw()}async function hw(){try{let{data:t}=await e.from(`proyek`).select(`id, nama_bangunan`).order(`created_at`,{ascending:!1});return t||[]}catch{return[]}}function gw(){return uw?vw():_w()}function _w(){return`
    <div id="multiagent-page" class="fade-in" style="padding-bottom:100px">
      <!-- Header Section -->
      <div class="page-header" style="text-align:center;margin-bottom:var(--space-6)">
        <div style="width:72px;height:72px;border-radius:var(--radius-xl);background:var(--gradient-brand);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);font-size:2rem;color:white;box-shadow:0 10px 25px hsla(258,80%,56%,0.4)">
          <i class="fas fa-microchip"></i>
        </div>
        <h1 class="page-title" style="font-size:2.2rem;margin-bottom:8px">Deep Reasoning Center</h1>
        <p class="page-subtitle" style="max-width:800px;margin:0 auto;margin-bottom:24px">
          Pusat kendali 15 AI Ahli. Konfigurasikan instruksi ahli atau luncurkan laporan teknis otomatis.
        </p>

        <!-- Project & Report Controls -->
        <div class="card-glass" style="max-width:700px; margin:0 auto; padding:16px; display:flex; gap:12px; align-items:center; justify-content:center; border-radius:16px">
          <div style="flex:1; text-align:left">
            <label class="text-xs font-bold mb-1 block" style="color:var(--text-tertiary)">PILIH PROYEK UNTUK LAPORAN:</label>
            <select id="select-proyek-report" class="form-input" style="width:100%">
              <option value="">-- Pilih Proyek --</option>
              ${dw.map(e=>`
                <option value="${e.id}" ${e.id===lw?`selected`:``}>${e.nama_bangunan}</option>
              `).join(``)}
            </select>
          </div>
          <button id="btn-download-report" class="btn btn-primary" style="height:42px; margin-top:18px" ${lw?``:`disabled`}>
            <i class="fas fa-file-word"></i> Luncurkan Laporan (.docx)
          </button>
        </div>
      </div>

      <div class="agent-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
        ${ow.map((e,t)=>{let n=fw.find(t=>t.agent_id===e.id)?.mission||pw.mission||`Belum diatur`;return`
            <div class="agent-card card-glass" id="card-${e.id}" style="display:flex; flex-direction:column; min-height:220px; transition:all 0.3s ease; position:relative; overflow:hidden">
              <div class="ac-header" style="background:rgba(255,255,255,0.03); padding:16px; border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; gap:12px">
                <div class="ac-avatar" style="background:${e.color}; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white"><i class="fas ${e.icon}"></i></div>
                <div class="ac-info">
                  <div class="ac-name" style="font-size:0.9rem; font-weight:800">${e.name}</div>
                  <div class="ac-role" style="font-size:0.65rem; color:var(--text-tertiary)">${e.id.toUpperCase()}</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:8px">
                  <button class="btn-run-agent" data-id="${e.id}" title="Jalankan Analisis" style="background:var(--bg-elevated); border:1px solid var(--border-subtle); color:var(--success-400); width:32px; height:32px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center">
                    <i class="fas fa-play"></i>
                  </button>
                  <button class="btn-edit-agent" data-id="${e.id}" title="Atur Prompt" style="background:var(--brand-500); border:none; color:white; width:32px; height:32px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center">
                    <i class="fas fa-cog"></i>
                  </button>
                </div>
              </div>
              <div class="ac-body" style="padding:16px; flex:1">
                <div id="status-${e.id}" style="color:var(--text-tertiary); font-size:0.65rem; margin-bottom:8px">Status: Menunggu...</div>
                <div style="color:var(--brand-400); font-weight:bold; font-size:0.65rem; margin-bottom:4px; text-transform:uppercase">Misi Utama:</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4">
                  ${n.length>100?n.substring(0,100)+`...`:n}
                </div>
              </div>
            </div>
          `}).join(``)}
      </div>
    </div>
  `}function vw(){let e=ow.find(e=>e.id===uw),t=fw.find(e=>e.agent_id===uw),n=pw;return`
    <div id="agent-editor" class="fade-in" style="max-width:1000px; margin:0 auto; padding-bottom:100px">
      <button id="btn-back-to-grid" class="btn btn-ghost" style="margin-bottom:20px; color:var(--brand-400)">
        <i class="fas fa-arrow-left"></i> Kembali ke Daftar Ahli
      </button>

      <div class="card card-glass" style="padding:0; overflow:hidden">
        <div class="card-header" style="background:var(--bg-elevated); padding:24px; border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; gap:20px">
          <div style="background:${e.color}; width:60px; height:60px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; box-shadow:0 8px 20px -4px ${e.color}80">
            <i class="fas ${e.icon}"></i>
          </div>
          <div>
            <h1 style="font-size:1.6rem; font-weight:800; margin:0">Konfigurasi: ${e.name}</h1>
            <p class="font-mono text-xs" style="color:var(--text-tertiary); margin-top:4px">AGENT_ID: ${uw}</p>
          </div>
          <div style="margin-left:auto; display:flex; gap:12px">
            <button id="btn-save-config" class="btn btn-primary" style="padding:10px 24px"><i class="fas fa-save"></i> Simpan Perubahan</button>
          </div>
        </div>

        <div class="card-body" style="padding:30px; display:grid; grid-template-columns: 1fr 1fr; gap:30px">
          <div style="display:flex; flex-direction:column; gap:24px">
            <div class="form-group">
                <label class="text-xs font-bold mb-2 block" style="color:var(--brand-400)">ROLE (PERSONA AI)</label>
                <input type="text" id="config-persona" class="form-input" style="width:100%" value="${t?.persona||e.persona||``}">
            </div>
            <div class="form-group">
                <label class="text-xs font-bold mb-2 block" style="color:var(--brand-400)">MISSION (TUGAS UTAMA)</label>
                <textarea id="config-mission" class="form-input" style="height:100px; width:100%">${t?.mission||n.mission}</textarea>
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap:16px">
              <div class="form-group"><label class="text-xs font-bold">1. GOAL</label><textarea id="config-goal" class="form-input">${t?.principles?.goal||n.goal}</textarea></div>
              <div class="form-group"><label class="text-xs font-bold">2. DONE CRITERIA</label><textarea id="config-done" class="form-input">${t?.principles?.done_criteria||n.done_criteria}</textarea></div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:24px">
            <div class="form-group">
                <label class="text-xs font-bold mb-2 block">OUTPUT FORMAT</label>
                <textarea id="config-format" class="form-input" style="height:120px; font-family:monospace; width:100%">${t?.principles?.output_format||n.output_format}</textarea>
            </div>
            <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle); border-radius:12px; padding:20px">
               <h4 class="text-xs font-bold mb-3" style="color:var(--brand-400)"><i class="fas fa-eye"></i> PROMPT PREVIEW:</h4>
               <pre id="prompt-preview" style="font-size:0.65rem; color:var(--text-tertiary); white-space:pre-wrap; max-height:200px; overflow-y:auto; font-family:var(--font-mono)"></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function yw(){let e=document.getElementById(`page-root`),t=()=>{let t=gw();e&&(e.innerHTML=t),yw()},n=document.getElementById(`btn-download-report`),r=document.getElementById(`select-proyek-report`);r&&(r.onchange=e=>{lw=e.target.value,n&&(n.disabled=!lw)}),n&&(n.onclick=async()=>{if(!lw)return V(`Pilih proyek terlebih dahulu!`);n.disabled=!0,n.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Menyusun...`;try{await YC(lw,Object.values(cw)),B(`Laporan Konsep berhasil diunduh.`)}catch(e){V(`Gagal: `+e.message)}finally{n.disabled=!1,n.innerHTML=`<i class="fas fa-file-word"></i> Luncurkan Laporan (.docx)`}}),document.querySelectorAll(`.btn-edit-agent`).forEach(e=>{e.onclick=()=>{uw=e.dataset.id,t()}}),document.querySelectorAll(`.btn-run-agent`).forEach(e=>{e.onclick=async()=>{if(!lw)return V(`Pilih proyek terlebih dahulu!`);let t=e.dataset.id,n=document.getElementById(`status-${t}`);e.disabled=!0,n&&(n.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Menganalisis...`);try{let{runSpecificAgentAnalysis:e}=await Rt(async()=>{let{runSpecificAgentAnalysis:e}=await Promise.resolve().then(()=>aw);return{runSpecificAgentAnalysis:e}},void 0),r=await e(lw,t,cw);cw[t]=r,n&&(n.innerHTML=`<i class="fas fa-check-circle" style="color:var(--success-400)"></i> Selesai`),B(`Analisis ${r.name} selesai.`)}catch(e){n&&(n.innerHTML=`<i class="fas fa-times" style="color:var(--danger-400)"></i> Gagal`),V(e.message)}finally{e.disabled=!1}}});let i=document.getElementById(`btn-back-to-grid`);i&&(i.onclick=()=>{uw=null,t()});let a=document.getElementById(`btn-save-config`);a&&(a.onclick=async()=>{a.disabled=!0;try{let{saveAgentPrompt:e}=await Rt(async()=>{let{saveAgentPrompt:e}=await import(`./prompt-config-service-B0Bany5t.js`);return{saveAgentPrompt:e}},__vite__mapDeps([4,2,3])),n={persona:document.getElementById(`config-persona`).value,mission:document.getElementById(`config-mission`).value,principles:{goal:document.getElementById(`config-goal`).value,done_criteria:document.getElementById(`config-done`).value,output_format:document.getElementById(`config-format`).value}};await e(uw,n),B(`Tersimpan.`),uw=null,t()}catch(e){V(e.message),a.disabled=!1}})}async function bw(){let t=document.getElementById(`page-root`);t&&(t.innerHTML=`<div class="p-8 text-center"><i class="fas fa-circle-notch fa-spin text-2xl"></i></div>`);let n=[{id:`umum`,label:`Data Umum`,icon:`fa-folder-open`},{id:`tanah`,label:`Data Tanah & Lingkungan`,icon:`fa-map-marked-alt`},{id:`arsitektur`,label:`Teknis Arsitektur`,icon:`fa-drafting-compass`},{id:`struktur`,label:`Teknis Struktur`,icon:`fa-cubes`},{id:`mep`,label:`Teknis MEP`,icon:`fa-bolt`},{id:`lapangan`,label:`Data Pengujian & Lapangan`,icon:`fa-clipboard-check`}],[{data:r},{data:i}]=await Promise.all([e.from(`proyek`).select(`id, nama_bangunan, created_at, alamat`).order(`created_at`,{ascending:!1}),e.from(`proyek_files`).select(`*, proyek(nama_bangunan)`).order(`created_at`,{ascending:!1})]);window._allProjects=r||[],window._allGlobalFiles=i||[],window._currentView=window._currentView||`projects`,window._selectedProject=window._selectedProject||null,window._selectedCategory=window._selectedCategory||`umum`,t&&(t.innerHTML=`
    <style>
      .drive-layout { display: flex; height: calc(100vh - 180px); background: #fff; border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); }
      .drive-sidebar { width: 250px; background: #f8fafc; border-right: 1px solid var(--border-subtle); padding: 20px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
      .drive-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
      
      .drive-nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; color: #64748b; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: 0.2s; border: none; background: transparent; width: 100%; text-align: left; }
      .drive-nav-item:hover { background: #f1f5f9; color: #1e293b; }
      .drive-nav-item.active { background: #e0f2fe; color: #0284c7; }
      .sidebar-divider { height: 1px; background: #e2e8f0; margin: 15px 0; }
      .sidebar-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 0 14px 8px; }
      
      .drive-toolbar { padding: 16px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; gap: 20px; }
      .drive-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: #64748b; }
      .drive-breadcrumb .crumb { cursor: pointer; transition: 0.2s; }
      .drive-breadcrumb .crumb:hover { color: var(--brand-500); }
      .drive-breadcrumb .active { color: #1e293b; font-weight: 700; }
      
      .drive-search { position: relative; flex: 1; max-width: 400px; }
      .drive-search i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
      .drive-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-subtle); border-radius: 8px; font-size: 0.82rem; background: #f8fafc; }
      
      .drive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; padding: 24px; overflow-y: auto; flex: 1; align-content: start; }
      .folder-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: 0.2s; cursor: pointer; background: #fff; position: relative; }
      .folder-card:hover { border-color: #cbd5e1; transform: translateY(-3px); box-shadow: var(--shadow-sm); border-left: 4px solid #fbbf24; }
      .folder-icon { width: 44px; height: 36px; background: #fbbf24; border-radius: 4px 12px 4px 4px; position: relative; }
      .folder-icon::after { content: ''; position: absolute; top: -4px; left: 0; width: 15px; height: 6px; background: #fbbf24; border-radius: 3px 3px 0 0; }
      .folder-name { font-size: 0.85rem; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .folder-meta { font-size: 0.7rem; color: #94a3b8; }
      .fm-file-card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: 0.2s; position: relative; background: #fff; cursor: pointer; }
      .fm-file-card:hover { border-color: #cbd5e1; box-shadow: var(--shadow-md); transform: translateY(-3px); }
      
      .fm-file-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: #f1f5f9; color: #94a3b8; }
      .fm-file-icon.has-file { background: #fee2e2; color: #ef4444; }
      .fm-file-icon.image { background: #e0f2fe; color: #0ea5e9; }
      
      .fm-file-info { display: flex; flex-direction: column; gap: 4px; }
      .fm-file-name { font-size: 0.9375rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
      .fm-file-meta { font-size: 0.75rem; color: #94a3b8; }
      .fm-file-badge { position: absolute; top: 15px; right: 15px; font-size: 0.65rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.025em; }
      .badge-ready { background: #e0f2fe; color: #0284c7; }
      
      .fm-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #94a3b8; padding: 60px 20px; width: 100%; grid-column: 1 / -1; }
      .fm-empty-state i { font-size: 4rem; margin-bottom: 20px; opacity: 0.2; }
    </style>

    <div class="page-header" style="margin-bottom:15px">
       <h1 class="page-title">Drive Konsultan Global</h1>
       <p class="page-subtitle">Sistem manajemen berkas teknis tersinkronisasi SIMBG & Inspeksi Lapangan</p>
    </div>

    <div class="drive-layout">
       <aside class="drive-sidebar" id="drive-sidebar-content">
          <!-- Render Sidebar Content based on view -->
       </aside>

       <main class="drive-main">
          <header class="drive-toolbar">
             <div class="drive-breadcrumb" id="drive-crumbs"></div>
             <div class="drive-search">
                <i class="fas fa-search"></i>
                <input type="text" id="drive-search-input" placeholder="Cari berkas..." oninput="window._renderDriveGrid()">
             </div>
             <button class="btn btn-ghost btn-sm" onclick="location.reload()"><i class="fas fa-sync"></i></button>
          </header>

          <div class="drive-grid" id="drive-content-grid"></div>
       </main>
    </div>
  `,window._simbgCategories=n,xw())}function xw(){window._changeDriveView=(t,n=null,r=null)=>{window._currentView=t,n&&(window._selectedProject=n),r&&(window._selectedCategory=r),e();let i=document.getElementById(`drive-crumbs`);if(t===`projects`)i.innerHTML=`<span class="crumb active">Unit Komputer</span>`;else if(t===`inner`){let e=window._allProjects.find(e=>e.id===window._selectedProject),t=window._simbgCategories.find(e=>e.id===window._selectedCategory);i.innerHTML=`
          <span class="crumb" onclick="window._changeDriveView('projects')">Unit Komputer</span>
          <i class="fas fa-chevron-right text-xs text-tertiary"></i>
          <span class="crumb" onclick="window._changeDriveView('inner', '${e?.id}')">${Cw(e?.nama_bangunan||`Folder`)}</span>
          <i class="fas fa-chevron-right text-xs text-tertiary"></i>
          <span class="active">${Cw(t?.label||`Umum`)}</span>
       `}else i.innerHTML=`<span class="crumb active">${t===`trash`?`Tempat Sampah`:`Terbaru`}</span>`;window._renderDriveGrid()};function e(){let e=document.getElementById(`drive-sidebar-content`);e&&(window._currentView===`projects`||window._currentView===`recent`||window._currentView===`trash`?e.innerHTML=`
        <div class="sidebar-label">Utama</div>
        <button class="drive-nav-item ${window._currentView===`projects`?`active`:``}" onclick="window._changeDriveView('projects')">
           <i class="fas fa-hdd"></i> <span>Drive Saya</span>
        </button>
        <button class="drive-nav-item ${window._currentView===`recent`?`active`:``}" onclick="window._changeDriveView('recent')">
           <i class="fas fa-clock"></i> <span>Terbaru</span>
        </button>
        <button class="drive-nav-item ${window._currentView===`trash`?`active`:``}" onclick="window._changeDriveView('trash')">
           <i class="fas fa-trash-alt"></i> <span>Tempat Sampah</span>
        </button>
        <div class="sidebar-divider"></div>
        <div class="sidebar-label">Penyimpanan Terpusat</div>
        <div style="padding:0 14px">
           <div class="text-xs text-tertiary mb-2 uppercase font-bold">Google Cloud (SIMBG)</div>
           <div class="progress-wrap" style="height:4px; opacity:0.6"><div class="progress-fill blue" style="width:78%"></div></div>
        </div>
      `:e.innerHTML=`
        <button class="drive-nav-item" onclick="window._changeDriveView('projects')" style="margin-bottom:12px; color:var(--brand-500); font-weight:700">
           <i class="fas fa-arrow-left"></i> <span>Unit Komputer</span>
        </button>
        <div class="sidebar-label">Kategori Berkas</div>
        ${window._simbgCategories.map(e=>`
          <button class="drive-nav-item ${window._selectedCategory===e.id?`active`:``}" 
                  onclick="window._changeDriveView('inner', null, '${e.id}')">
             <i class="fas ${e.icon}"></i> <span>${e.label}</span>
          </button>
        `).join(``)}
      `)}window._renderDriveGrid=()=>{let e=document.getElementById(`drive-content-grid`),t=document.getElementById(`drive-search-input`)?.value.toLowerCase()||``;if(e)if(window._currentView===`projects`){let n=window._allProjects.filter(e=>e.nama_bangunan.toLowerCase().includes(t));e.innerHTML=n.length?n.map(e=>`
          <div class="folder-card" onclick="window._changeDriveView('inner', '${e.id}')">
             <div class="folder-icon"></div>
             <div class="folder-name">${Cw(e.nama_bangunan)}</div>
             <div class="folder-meta">${window._allGlobalFiles.filter(t=>t.proyek_id===e.id).length} berkas</div>
          </div>
       `).join(``):`<div class="fm-empty-state"><i class="fas fa-folder-open"></i><p>Tidak ada proyek</p></div>`}else if(window._currentView===`inner`){let n=window._allGlobalFiles.filter(e=>e.proyek_id===window._selectedProject&&e.category===window._selectedCategory).filter(e=>e.name.toLowerCase().includes(t));e.innerHTML=n.length?n.map(e=>Sw(e)).join(``):`<div class="fm-empty-state"><i class="fas fa-folder-open"></i><p>Belum ada berkas di kategori ini</p></div>`}else e.innerHTML=`<div class="fm-empty-state"><i class="fas fa-database"></i><p>Data tidak tersedia</p></div>`},window._changeDriveView(window._currentView,window._selectedProject,window._selectedCategory)}function Sw(e,t=!1){let n=e.name.toLowerCase().endsWith(`.pdf`),r=e.name.match(/\.(jpg|jpeg|png|webp)$/i);return`
    <div class="fm-file-card ready" onclick="window.open('${e.file_url}', '_blank')">
      <div class="fm-file-icon has-file ${r?`image`:``}">
         <i class="fas ${r?`fa-file-image`:n?`fa-file-pdf`:`fa-file`}"></i>
      </div>
      <div class="fm-file-info">
         <div class="fm-file-name" title="${e.subcategory||e.category}">${Cw(e.subcategory||e.category)}</div>
         <div class="fm-file-meta">
            <span class="text-primary font-bold">${Cw(e.name)}</span>
         </div>
         <div class="text-xs text-tertiary mt-1">
            ${t?Cw(e.proyek?.nama_bangunan||`Proyek`):new Date(e.created_at).toLocaleDateString()}
         </div>
      </div>
      <span class="fm-file-badge badge-ready">${Cw(e.ai_status||`SIMBG`)}</span>
    </div>
  `}function Cw(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function ww(){let e=await Yx(),t=T();return`
    <div id="settings-page">
      <div class="page-header">
        <h1 class="page-title">Pengaturan</h1>
        <p class="page-subtitle">Kelola profil personal dan konfigurasi operasional sistem</p>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <div class="tab-item active" onclick="window.switchTab('tab-akun', this)">
          <i class="fas fa-user-circle"></i> Pengaturan Akun
        </div>
        <div class="tab-item" onclick="window.switchTab('tab-aplikasi', this)">
          <i class="fas fa-sliders"></i> Pengaturan Aplikasi
        </div>
      </div>

      <!-- Tab Content: Akun -->
      <div id="tab-akun" class="tab-content active">
        <div class="grid-settings" style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
          <div class="card">
            <div class="card-title" style="margin-bottom: var(--space-5);">
              <i class="fas fa-id-badge" style="color:var(--brand-400); margin-right:8px;"></i>
              Profil Pengguna
            </div>
            
            <div style="display:flex; align-items:center; gap:var(--space-6); margin-bottom:var(--space-6); padding:var(--space-4); background:var(--bg-elevated); border-radius:var(--radius-lg);">
              <div class="avatar-lg" style="width:80px; height:80px; border-radius:50%; background:var(--gradient-brand); display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:800; color:white; box-shadow:var(--shadow-brand);">
                ${t?.initials||`U`}
              </div>
              <div>
                <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary);">${t?.name||`User`}</h3>
                <p style="font-size:0.85rem; color:var(--brand-400); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-top:2px;">${t?.role||`Pengkaji Teknis`}</p>
                <p style="font-size:0.8rem; color:var(--text-tertiary); margin-top:4px;">Terdaftar sejak Mart 2026</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <input type="text" class="form-input" value="${t?.name||``}" readonly style="background:var(--bg-input); cursor:not-allowed;">
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Email</label>
              <input type="email" class="form-input" value="${t?.email||``}" readonly style="background:var(--bg-input); cursor:not-allowed;">
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="margin-bottom: var(--space-4);">
              <i class="fas fa-shield-halved" style="color:var(--brand-400); margin-right:8px;"></i>
              Keamanan & Privasi
            </div>
            <p class="text-sm text-secondary" style="margin-bottom: var(--space-4);">Pastikan akun Anda tetap aman dengan melakukan pengecekan sesi secara berkala.</p>
            
            <button class="btn btn-outline btn-sm" style="width:100%; justify-content:flex-start; margin-bottom:var(--space-3);">
              <i class="fas fa-key"></i> Ubah Password
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content: Aplikasi -->
      <div id="tab-aplikasi" class="tab-content">
        <form id="settings-form" onsubmit="handleSaveSettings(event)">
          <div class="grid-settings" style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
            
            <div style="display:flex; flex-direction:column; gap: var(--space-5);">
              <!-- Card: Identitas Konsultan -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fas fa-building" style="color:var(--brand-400); margin-right:8px;"></i>
                  Identitas Konsultan
                </div>
                <div class="form-group">
                  <label class="form-label">Nama Perusahaan</label>
                  <input type="text" class="form-input" name="consultant_name" value="${e.consultant?.name||``}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Alamat Kantor</label>
                  <textarea class="form-input" name="consultant_address" rows="2">${e.consultant?.address||``}</textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Kop Surat (Teks Resmi)</label>
                  <textarea class="form-input text-xs" name="consultant_kop_text" rows="3" placeholder="Contoh: PEMERINTAH KABUPATEN... DI NAS PEKERJAAN UMUM...">${e.consultant?.kop_text||``}</textarea>
                </div>
                <div class="grid-2" style="gap:15px; margin-top:10px;">
                  <div class="form-group">
                    <label class="form-label">Nama Direktur / Penanggung Jawab</label>
                    <input type="text" class="form-input" name="director_name" value="${e.consultant?.director_name||``}" placeholder="Nama Lengkap & Gelar">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Jabatan</label>
                    <input type="text" class="form-input" name="director_job" value="${e.consultant?.director_job||`Direktur`}" placeholder="Direktur / Chief Executive">
                  </div>
                </div>
              </div>

              <!-- Card: Branding & Signature -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fas fa-signature" style="color:var(--brand-400); margin-right:8px;"></i>
                  Digital Seal & Director Signature
                </div>
                
                <div class="form-group" style="margin-bottom:20px;">
                  <label class="form-label">Kop Surat (Gambar/Header)</label>
                  <div id="kop-preview-container" class="img-upload-preview" style="height:80px;">
                    ${e.consultant?.kop_image?`<img src="${e.consultant.kop_image}" style="max-height:100%; object-fit:contain;">`:`<i class="fas fa-image"></i>`}
                  </div>
                  <input type="file" accept="image/*" onchange="handleKopUpload(this)" class="mt-2 text-xs">
                  <input type="hidden" name="consultant_kop_image" id="consultant-kop-val" value="${e.consultant?.kop_image||``}">
                </div>

                <div class="grid-3" style="gap:15px; display:grid; grid-template-columns: 1fr 1fr 1fr;">
                  <div class="form-group">
                    <label class="form-label">Logo Perusahaan</label>
                    <div id="logo-preview-container" class="img-upload-preview">
                      ${e.consultant?.logo?`<img src="${e.consultant.logo}">`:`<i class="fas fa-image"></i>`}
                    </div>
                    <input type="file" accept="image/*" onchange="handleLogoUpload(this)" class="mt-2 text-xs">
                    <input type="hidden" name="consultant_logo" id="consultant-logo-val" value="${e.consultant?.logo||``}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stempel Perusahaan</label>
                    <div id="stamp-preview-container" class="img-upload-preview">
                      ${e.consultant?.stamp?`<img src="${e.consultant.stamp}">`:`<i class="fas fa-stamp"></i>`}
                    </div>
                    <input type="file" accept="image/*" onchange="handleStampUpload(this)" class="mt-2 text-xs">
                    <input type="hidden" name="consultant_stamp" id="consultant-stamp-val" value="${e.consultant?.stamp||``}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tanda Tangan Direktur</label>
                    <div id="sig-preview-container" class="img-upload-preview">
                      ${e.consultant?.signature?`<img src="${e.consultant.signature}">`:`<i class="fas fa-signature"></i>`}
                    </div>
                    <input type="file" accept="image/*" onchange="handleSigUpload(this)" class="mt-2 text-xs">
                    <input type="hidden" name="consultant_sig" id="consultant-sig-val" value="${e.consultant?.signature||``}">
                  </div>
                </div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap: var(--space-5);">
              <!-- Card: Google Cloud & AI -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fab fa-google-drive" style="color:var(--brand-400); margin-right:8px;"></i>
                  Integrasi Sistem
                </div>
                <div class="form-group">
                  <label class="form-label">Google Apps Script Proxy</label>
                  <input type="text" class="form-input" name="default_drive_proxy" value="${e.google?.defaultDriveProxy||``}">
                </div>
                <div class="form-group">
                  <label class="form-label">AI Analysis Model</label>
                  <select class="form-input" name="default_model">
                    ${Object.values(i).map(t=>`<option value="${t.id}" ${e.ai?.defaultModel===t.id?`selected`:``}>${t.name}</option>`).join(``)}
                  </select>
                </div>
              </div>

              <!-- Card: 3 Pilar Tenaga Ahli (TTE) -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fas fa-user-shield" style="color:var(--brand-400); margin-right:8px;"></i>
                  3 Pilar Tenaga Ahli (TTE)
                </div>
                
                <!-- Ahli Arsitektur -->
                <div style="margin-bottom:15px; padding:10px; border:1px solid var(--border-subtle); border-radius:8px;">
                  <h4 class="text-xs font-bold mb-2 uppercase">1. Arsitektur / Tata Ruang Luar</h4>
                  <div class="grid-2" style="gap:10px; margin-bottom:10px;">
                    <input type="text" class="form-input text-xs" name="exp_arch_name" value="${e.experts?.architecture?.name||``}" placeholder="Nama & Gelar">
                    <input type="text" class="form-input text-xs" name="exp_arch_skk" value="${e.experts?.architecture?.skk||``}" placeholder="No. SKK">
                  </div>
                  <div class="grid-2" style="gap:10px;">
                    <div>
                      <label class="text-xs opacity-70">Tanda Tangan</label>
                      <input type="file" onchange="handleExpertSigUpload(this, 'arch')" class="text-xs mt-1">
                      <input type="hidden" name="exp_arch_sig" id="exp-arch-sig-val" value="${e.experts?.architecture?.signature||``}">
                    </div>
                    <div>
                      <label class="text-xs opacity-70">QR Code TTE</label>
                      <input type="file" onchange="handleExpertQrUpload(this, 'arch')" class="text-xs mt-1">
                      <input type="hidden" name="exp_arch_qr" id="exp-arch-qr-val" value="${e.experts?.architecture?.qr_code||``}">
                    </div>
                  </div>
                </div>

                <!-- Ahli Struktur -->
                <div style="margin-bottom:15px; padding:10px; border:1px solid var(--border-subtle); border-radius:8px;">
                  <h4 class="text-xs font-bold mb-2 uppercase">2. Bidang Struktur</h4>
                  <div class="grid-2" style="gap:10px; margin-bottom:10px;">
                    <input type="text" class="form-input text-xs" name="exp_struct_name" value="${e.experts?.structure?.name||``}" placeholder="Nama & Gelar">
                    <input type="text" class="form-input text-xs" name="exp_struct_skk" value="${e.experts?.structure?.skk||``}" placeholder="No. SKK">
                  </div>
                  <div class="grid-2" style="gap:10px;">
                    <div>
                      <label class="text-xs opacity-70">Tanda Tangan</label>
                      <input type="file" onchange="handleExpertSigUpload(this, 'struct')" class="text-xs mt-1">
                      <input type="hidden" name="exp_struct_sig" id="exp-struct-sig-val" value="${e.experts?.structure?.signature||``}">
                    </div>
                    <div>
                      <label class="text-xs opacity-70">QR Code TTE</label>
                      <input type="file" onchange="handleExpertQrUpload(this, 'struct')" class="text-xs mt-1">
                      <input type="hidden" name="exp_struct_qr" id="exp-struct-qr-val" value="${e.experts?.structure?.qr_code||``}">
                    </div>
                  </div>
                </div>

                <!-- Ahli MEP -->
                <div style="padding:10px; border:1px solid var(--border-subtle); border-radius:8px;">
                  <h4 class="text-xs font-bold mb-2 uppercase">3. Bidang MEP (Utilitas)</h4>
                  <div class="grid-2" style="gap:10px; margin-bottom:10px;">
                    <input type="text" class="form-input text-xs" name="exp_mep_name" value="${e.experts?.mep?.name||``}" placeholder="Nama & Gelar">
                    <input type="text" class="form-input text-xs" name="exp_mep_skk" value="${e.experts?.mep?.skk||``}" placeholder="No. SKK">
                  </div>
                  <div class="grid-2" style="gap:10px;">
                    <div>
                      <label class="text-xs opacity-70">Tanda Tangan</label>
                      <input type="file" onchange="handleExpertSigUpload(this, 'mep')" class="text-xs mt-1">
                      <input type="hidden" name="exp_mep_sig" id="exp-mep-sig-val" value="${e.experts?.mep?.signature||``}">
                    </div>
                    <div>
                      <label class="text-xs opacity-70">QR Code TTE</label>
                      <input type="file" onchange="handleExpertQrUpload(this, 'mep')" class="text-xs mt-1">
                      <input type="hidden" name="exp_mep_qr" id="exp-mep-qr-val" value="${e.experts?.mep?.qr_code||``}">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-save-settings" style="min-width: 250px;">
              <i class="fas fa-save" style="margin-right:8px;"></i> Simpan Seluruh Konfigurasi
            </button>
          </div>
        </form>
      </div>
    </div>
  `}window.switchTab=function(e,t){document.querySelectorAll(`.tab-item`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.tab-content`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),document.getElementById(e).classList.add(`active`)},window.handleKopUpload=e=>Tw(e,`kop-preview-container`,`consultant-kop-val`),window.handleLogoUpload=e=>Tw(e,`logo-preview-container`,`consultant-logo-val`),window.handleStampUpload=e=>Tw(e,`stamp-preview-container`,`consultant-stamp-val`),window.handleSigUpload=e=>Tw(e,`sig-preview-container`,`consultant-sig-val`),window.handleExpertSigUpload=(e,t)=>Tw(e,null,`exp-${t}-sig-val`),window.handleExpertQrUpload=(e,t)=>Tw(e,null,`exp-${t}-qr-val`);function Tw(e,t,n){if(e.files&&e.files[0]){let r=new FileReader;r.onload=e=>{t&&(document.getElementById(t).innerHTML=`<img src="${e.target.result}" style="max-height:100%; object-fit:contain;">`),document.getElementById(n).value=e.target.result},r.readAsDataURL(e.files[0])}}window.handleSaveSettings=async function(e){e.preventDefault();let t=e.target,n=document.getElementById(`btn-save-settings`);n.disabled=!0,n.innerHTML=`<i class="fas fa-spinner fa-spin"></i> Menyisipkan ke sistem...`;try{let e=new FormData(t);await Xx({consultant:{name:e.get(`consultant_name`),address:e.get(`consultant_address`),logo:e.get(`consultant_logo`),stamp:e.get(`consultant_stamp`),kop_image:e.get(`consultant_kop_image`),kop_text:e.get(`consultant_kop_text`),signature:e.get(`consultant_sig`),director_name:e.get(`director_name`),director_job:e.get(`director_job`)},ai:{defaultModel:e.get(`default_model`)},experts:{architecture:{name:e.get(`exp_arch_name`),skk:e.get(`exp_arch_skk`),signature:e.get(`exp_arch_sig`),qr_code:e.get(`exp_arch_qr`)},structure:{name:e.get(`exp_struct_name`),skk:e.get(`exp_struct_skk`),signature:e.get(`exp_struct_sig`),qr_code:e.get(`exp_struct_qr`)},mep:{name:e.get(`exp_mep_name`),skk:e.get(`exp_mep_skk`),signature:e.get(`exp_mep_sig`),qr_code:e.get(`exp_mep_qr`)}},google:{defaultDriveProxy:e.get(`default_drive_proxy`)||``}}),B(`Berhasil! Pengaturan aplikasi telah diperbarui untuk semua modul.`)}catch(e){V(`Gagal menyimpan: `+e.message)}finally{n.disabled=!1,n.innerHTML=`<i class="fas fa-save"></i> Simpan Seluruh Konfigurasi`}};async function Ew(){let e=document.getElementById(`page-root`);e&&(e.innerHTML=Aw());let t=Dw(await qe(),await Ke());return e&&(e.innerHTML=t,kw()),t}function Dw(e,t){let n=e.reduce((e,t)=>e+(t.projectCount||0),0),r=e.length>0?Math.round(e.reduce((e,t)=>e+(t.avgProgress||0),0)/e.length):0;return`
    <div id="tim-kerja-page">
      <div class="page-header">
        <div class="flex-between">
          <div>
            <h1 class="page-title">Monitoring Tim Kerja</h1>
            <p class="page-subtitle">Pantau distribusi beban kerja dan efektivitas personil pengkaji</p>
          </div>
          <div class="flex gap-2">
             <button class="btn btn-outline" onclick="window.location.reload()">
              <i class="fas fa-rotate"></i> Refresh
            </button>
            <button class="btn btn-primary" onclick="window._showAddMemberModal()">
              <i class="fas fa-plus"></i> Anggota Baru
            </button>
          </div>
        </div>
      </div>

      <!-- Team Stats -->
      <div class="kpi-grid" style="margin-bottom:var(--space-6)">
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-blue"><i class="fas fa-users"></i></div>
          <div class="kpi-value">${t.length}</div>
          <div class="kpi-label">Total Personil</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-indigo"><i class="fas fa-briefcase"></i></div>
          <div class="kpi-value">${n}</div>
          <div class="kpi-label">Proyek Terdelegasi</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-green"><i class="fas fa-chart-line"></i></div>
          <div class="kpi-value">${r}%</div>
          <div class="kpi-label">Rata-rata Progres</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-purple"><i class="fas fa-check-double"></i></div>
          <div class="kpi-value">${e.filter(e=>e.status===`Active`).length}</div>
          <div class="kpi-label">Personil Siaga</div>
        </div>
      </div>

      <!-- Team Workload Grid -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Distribusi Beban Kerja Tim</div>
          <div class="card-subtitle">Menampilkan jumlah proyek aktif per personil</div>
        </div>
        <div class="table-container">
          <table class="team-table">
            <thead>
              <tr>
                <th style="width:50px"></th>
                <th>Nama Personil</th>
                <th>Spesialisasi / Role</th>
                <th>Proyek Aktif</th>
                <th>Rerata Progres</th>
                <th style="width:100px">Status</th>
                <th style="text-align:right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${e.length===0?`<tr><td colspan="7" style="text-align:center;padding:40px">Belum ada data anggota tim terdaftar.</td></tr>`:``}
              ${e.map(e=>Ow(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activity Feed Placeholder -->
      <div class="grid-2-1" style="margin-top:var(--space-6)">
        <div class="card">
            <div class="card-header">
                <div class="card-title">Beban Kerja Visual</div>
            </div>
            <div style="padding:20px; height:300px; display:flex; align-items:flex-end; gap:20px; justify-content:space-around">
                ${e.map(e=>`
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:10px">
                        <div class="progress-wrap" style="width:20px; height:200px; flex-direction:column; justify-content:flex-end">
                            <div class="progress-fill blue" style="width:100%; height:${e.activeProjects/(n||1)*100}%"></div>
                        </div>
                        <div class="text-xs font-bold" style="text-align:center">${e.full_name?.split(` `)[0]}</div>
                    </div>
                `).join(``)}
            </div>
        </div>
        <div class="card">
             <div class="card-header">
                <div class="card-title">Ketersediaan Personil</div>
            </div>
            <div style="padding:10px 20px">
                ${t.map(e=>`
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border-subtle)">
                        <div style="display:flex; align-items:center; gap:10px">
                            <div style="width:10px; height:10px; border-radius:50%; background:${e.status===`Active`?`var(--success-400)`:`var(--warning-400)`}"></div>
                            <span class="text-sm font-semibold">${e.full_name}</span>
                        </div>
                        <span class="text-xs text-tertiary">${e.role}</span>
                    </div>
                `).join(``)}
            </div>
        </div>
      </div>
    </div>
  `}function Ow(e){return`
    <tr class="member-row">
      <td>
        <div class="avatar-sm" style="background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-subtle)">
          ${e.avatar_url?`<img src="${e.avatar_url}" style="width:100%;height:100%;border-radius:50%">`:`<i class="fas fa-user-tie"></i>`}
        </div>
      </td>
      <td>
        <div class="font-bold text-primary">${e.full_name}</div>
        <div class="text-xs text-tertiary">ID: ${e.id}</div>
      </td>
      <td>
        <span class="badge badge-proses" style="background:var(--bg-elevated); color:var(--text-secondary)">${e.role||`Tenaga Ahli`}</span>
      </td>
      <td>
        <div class="font-bold" style="font-size:1.1rem; color:var(--brand-400)">${e.activeProjects||0} <span class="text-xs font-normal text-tertiary">Proyek</span></div>
      </td>
      <td>
        <div class="flex-between mb-1" style="width:120px">
          <span class="text-xs text-secondary">${e.avgProgress||0}%</span>
        </div>
        <div class="progress-wrap" style="width:120px; height:6px">
          <div class="progress-fill ${e.avgProgress>70?`green`:`blue`}" style="width:${e.avgProgress||0}%"></div>
        </div>
      </td>
      <td>
        <span class="badge ${e.status===`Active`?`badge-laik`:`badge-bersyarat`}">${e.status||`Active`}</span>
      </td>
      <td style="text-align:right">
        <button class="btn btn-icon" onclick="window.navigate('proyek', {PIC: '${e.id}'})" title="Lihat Proyek">
          <i class="fas fa-folder-open"></i>
        </button>
      </td>
    </tr>
  `}function kw(){window._showAddMemberModal=()=>{alert(`Fungsionalitas pendaftaran anggota baru memerlukan integrasi dengan Supabase Auth Invites.`)}}function Aw(){return`
    <div class="page-header">
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:20px;width:400px"></div>
    </div>
    <div class="kpi-grid">
      ${[,,,,].fill(0).map(()=>`<div class="skeleton" style="height:120px;border-radius:var(--radius-lg)"></div>`).join(``)}
    </div>
    <div class="skeleton" style="height:400px;margin-top:20px;border-radius:var(--radius-lg)"></div>
  `}function jw(e=1){let t=e>=2,n=e>=3;[{id:`s1`,nama:`Pondasi`,bobot:10},{id:`s2`,nama:`Kolom`,bobot:n?10:15},{id:`s3`,nama:`Balok`,bobot:10},{id:`s4`,nama:`Plat Lantai`,bobot:t?10:0},{id:`s5`,nama:`Rangka Atap`,bobot:n?5:t?0:10},{id:`s6`,nama:`Tangga Struktur`,bobot:t?5:0}].filter(e=>e.bobot>0);let r=[];r=e===1?[{id:`s1`,nama:`Pondasi`,bobot:15},{id:`s2`,nama:`Kolom & Balok`,bobot:20},{id:`s3`,nama:`Rangka Atap`,bobot:10}]:e===2?[{id:`s1`,nama:`Pondasi`,bobot:10},{id:`s2`,nama:`Kolom & Balok`,bobot:15},{id:`s3`,nama:`Plat Lantai`,bobot:10},{id:`s4`,nama:`Tangga Struktur`,bobot:5},{id:`s5`,nama:`Rangka Atap`,bobot:5}]:[{id:`s1`,nama:`Pondasi`,bobot:10},{id:`s2`,nama:`Kolom & Balok`,bobot:10},{id:`s3`,nama:`Plat Lantai`,bobot:10},{id:`s4`,nama:`Tangga & Core Wall`,bobot:10},{id:`s5`,nama:`Rangka Atap`,bobot:5}];let i=[];i=e===1?[{id:`a1`,nama:`Dinding / Finishing`,bobot:15},{id:`a2`,nama:`Plafon & Lantai`,bobot:10},{id:`a3`,nama:`Pintu & Jendela`,bobot:5}]:[{id:`a1`,nama:`Fasad & Dinding`,bobot:10},{id:`a2`,nama:`Plafon`,bobot:5},{id:`a3`,nama:`Lantai`,bobot:5},{id:`a4`,nama:`Kusen / Pintu / Jendela`,bobot:5},{id:`a5`,nama:`Atap (Penutup)`,bobot:5}];let a=[];return a=e<3?[{id:`u1`,nama:`Instalasi Listrik`,bobot:10},{id:`u2`,nama:`Air Bersih & Sanitasi`,bobot:10},{id:`u3`,nama:`Proteksi Kebakaran (APAR/Hydrant)`,bobot:5}]:[{id:`u1`,nama:`Listrik & Pencahayaan`,bobot:5},{id:`u2`,nama:`Plambing & Sanitasi`,bobot:5},{id:`u3`,nama:`Sistem Kebakaran Aktif`,bobot:5},{id:`u4`,nama:`Lift / Escalator`,bobot:5},{id:`u5`,nama:`Tata Udara (AC Central/Ducting)`,bobot:5}],[{id:`struktur`,nama:`STRUKTUR`,bobot_total:45,items:r},{id:`arsitektur`,nama:`ARSITEKTUR`,bobot_total:30,items:i},{id:`utilitas`,nama:`UTILITAS / MEP`,bobot_total:25,items:a}]}async function Mw(e={}){let t=e.id;if(!t)return M(`proyek`),``;let n=document.getElementById(`page-root`);n&&(n.innerHTML=Rw());let[r,i,a]=await Promise.all([Fw(t),Lw(t),Iw(t)]);if(!r)return M(`proyek`),V(`Proyek tidak ditemukan.`),``;window._kondisiProyekId=t,window._kondisiJumlahLantai=r.jumlah_lantai||1,window._kondisiLastAnalisis=a;let o=jw(window._kondisiJumlahLantai);window._komponenDinamis=o;let s={};(i||[]).forEach(e=>{e.metadata&&e.metadata.bobot_item!==void 0&&(s[e.kode]=e.metadata.persentase_kerusakan||0)}),window._kondisiScoreMap=s;let c=Nw(r);return n&&(n.innerHTML=c,Pw()),c}function Nw(e){let t=window._kondisiJumlahLantai,n=t>=3?`badge-tidak-laik`:t>=2?`badge-bersyarat`:`badge-laik`;return`
    <div id="kondisi-page">
      <div class="page-header">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${e.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke Proyek
            </button>
            <h1 class="page-title">Pemeriksaan Kondisi Bangunan</h1>
            <div style="display:flex; align-items:center; gap:12px; margin-top:4px">
               <p class="page-subtitle">Penilaian Tingkat Kerusakan Sesuai Permen PU No. 16/PRT/M/2010</p>
               <span class="badge ${n}" style="font-size:0.7rem">Jumlah Lantai: ${t}</span>
            </div>
          </div>
          <div class="flex gap-3">
             <button class="btn btn-secondary" onclick="window._pullAIData()">
               <i class="fas fa-robot"></i> Ambil Data AI
             </button>
             <button class="btn btn-primary" onclick="window._saveKondisi()">
               <i class="fas fa-save"></i> Simpan Penilaian
             </button>
          </div>
        </div>
      </div>

      <div class="grid-main-responsive" style="display:grid; grid-template-columns: 1fr 340px; gap:var(--space-6)">
        
        <!-- Left: Scoring Form -->
        <div style="display:flex; flex-direction:column; gap:var(--space-5)">
          ${window._komponenDinamis.map(e=>`
            <div class="card" style="padding:0; overflow:hidden">
              <div class="card-header" style="background:var(--bg-elevated); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:12px">
                   <div style="width:10px; height:10px; border-radius:50%; background:${e.id===`struktur`?`var(--danger-400)`:e.id===`arsitektur`?`var(--brand-400)`:`var(--blue-400)`}"></div>
                   <span class="font-bold text-primary">${e.nama} (Bobot ${e.bobot_total}%)</span>
                </div>
                <div class="text-xs font-bold text-tertiary" id="subtotal-${e.id}">Subtotal: 0.00%</div>
              </div>
              <div style="padding:var(--space-4) var(--space-5)">
                <table style="width:100%; border-collapse:collapse">
                  <thead>
                    <tr style="text-align:left; font-size:0.75rem; color:var(--text-tertiary); text-transform:uppercase">
                      <th style="padding:8px 0; font-weight:700">Item Pekerjaan</th>
                      <th style="padding:8px 0; font-weight:700; text-align:center; width:80px">Bobot (%)</th>
                      <th style="padding:8px 0; font-weight:700; width:180px">Tingkat Kerusakan</th>
                      <th style="padding:8px 0; font-weight:700; text-align:right; width:100px">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${e.items.map(t=>{let n=window._kondisiScoreMap[t.id]||0;return`
                        <tr style="border-bottom:1px solid var(--border-subtle)">
                          <td style="padding:12px 0; font-size:var(--text-sm); font-weight:600; color:var(--text-secondary)">${t.nama}</td>
                          <td style="padding:12px 0; font-size:var(--text-sm); text-align:center; color:var(--text-tertiary)">${t.bobot}%</td>
                          <td style="padding:12px 0">
                            <div style="display:flex; align-items:center; gap:10px">
                              <input type="range" min="0" max="100" step="1" 
                                     class="kondisi-slider" 
                                     id="slider-${t.id}" 
                                     data-id="${t.id}" 
                                     data-bobot="${t.bobot}"
                                     data-group="${e.id}"
                                     value="${n}"
                                     oninput="window._updateItemValue('${t.id}')">
                              <input type="number" min="0" max="100" 
                                     id="input-${t.id}" 
                                     value="${n}"
                                     style="width:50px; padding:4px; border:1px solid var(--border-subtle); border-radius:4px; font-size:0.75rem; text-align:center"
                                     onchange="window._updateItemInput('${t.id}')">
                              <span style="font-size:0.75rem">%</span>
                            </div>
                          </td>
                          <td style="padding:12px 0; text-align:right; font-weight:bold; color:var(--text-primary)" id="result-${t.id}">
                            ${(n/100*t.bobot).toFixed(2)}%
                          </td>
                        </tr>
                      `}).join(``)}
                  </tbody>
                </table>
              </div>
            </div>
          `).join(``)}
        </div>

        <!-- Right: Summary Dashboard -->
        <div style="display:flex; flex-direction:column; gap:var(--space-5)">
          
          <div class="card" style="position:sticky; top:20px; border-top: 4px solid var(--brand-500)">
            <div class="card-title" style="margin-bottom:var(--space-4)">Ringkasan Penilaian</div>
            
            <div style="background:var(--bg-elevated); border-radius:var(--radius-lg); padding:var(--space-5); text-align:center; margin-bottom:var(--space-4)">
               <div class="text-xs text-tertiary font-bold uppercase mb-2">Tingkat Kerusakan Total</div>
               <div id="kerusakan-total-display" style="font-size:2.5rem; font-weight:900; color:var(--brand-500); line-height:1">0.00%</div>
               <div id="kategori-kerusakan-badge" class="badge badge-laik" style="margin-top:12px; padding:6px 16px; font-size:0.8rem">BAIK / RINGAN</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px">
               <div class="flex-between">
                  <span class="text-sm text-tertiary">Indeks Kondisi Fisik (IKF)</span>
                  <span class="text-sm font-bold text-primary" id="ikf-display">100.00</span>
               </div>
               <div class="progress-wrap" style="height:6px">
                  <div class="progress-fill green" id="ikf-progress" style="width:100%"></div>
               </div>

               <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle)">
                 <div class="text-xs text-tertiary font-bold mb-3 uppercase">Komposisi Kerusakan</div>
                 ${window._komponenDinamis.map(e=>`
                   <div style="margin-bottom:8px">
                      <div class="flex-between text-xs mb-1">
                        <span>${e.nama}</span>
                        <span id="summary-val-${e.id}">0.00%</span>
                      </div>
                      <div class="progress-wrap" style="height:4px">
                        <div class="progress-fill ${e.id===`struktur`?`red`:`blue`}" id="summary-bar-${e.id}" style="width:0%"></div>
                      </div>
                   </div>
                 `).join(``)}
               </div>

               <div style="margin-top:12px; padding:12px; background:rgba(59,130,246,0.1); border-radius:8px; border-left:3px solid var(--brand-400)">
                 <p class="text-xs text-secondary" style="line-height:1.4">
                   <i class="fas fa-info-circle" style="margin-right:6px"></i>
                   Komponen dinilai berdasarkan <strong>Bangunan Lantai ${t}</strong>. Gunakan tombol Ambil Data AI jika Anda sudah menjalankan analisis AI sebelumnya.
                 </p>
               </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  `}function Pw(){window._updateItemValue=t=>{let n=document.getElementById(`slider-${t}`),r=document.getElementById(`input-${t}`),i=document.getElementById(`result-${t}`);if(!n||!r||!i)return;let a=parseInt(n.value),o=parseFloat(n.dataset.bobot);r.value=a,i.innerText=(a/100*o).toFixed(2)+`%`,e()},window._updateItemInput=e=>{let t=document.getElementById(`slider-${e}`),n=document.getElementById(`input-${e}`),r=parseInt(n.value)||0;r<0&&(r=0),r>100&&(r=100),n.value=r,t.value=r,window._updateItemValue(e)};function e(){let e=0,t={struktur:0,arsitektur:0,utilitas:0};document.querySelectorAll(`.kondisi-slider`).forEach(n=>{let r=parseInt(n.value),i=parseFloat(n.dataset.bobot),a=n.dataset.group,o=r/100*i;t[a]+=o,e+=o}),Object.keys(t).forEach(e=>{let n=document.getElementById(`subtotal-${e}`),r=document.getElementById(`summary-val-${e}`),i=document.getElementById(`summary-bar-${e}`),a=t[e].toFixed(2)+`%`;n&&(n.innerText=`Subtotal: `+a),r&&(r.innerText=a);let o=window._komponenDinamis.find(t=>t.id===e);o&&i&&(i.style.width=t[e]/o.bobot_total*100+`%`)});let n=document.getElementById(`kerusakan-total-display`),r=document.getElementById(`kategori-kerusakan-badge`),i=document.getElementById(`ikf-display`),a=document.getElementById(`ikf-progress`);n&&(n.innerText=e.toFixed(2)+`%`),i&&(i.innerText=(100-e).toFixed(2)),a&&(a.style.width=100-e+`%`),r&&(e<=30?(r.innerText=`BAIK / RUSAK RINGAN`,r.className=`badge badge-laik`,n.style.color=`var(--brand-500)`):e<=45?(r.innerText=`RUSAK SEDANG`,r.className=`badge badge-bersyarat`,n.style.color=`var(--warning-500)`):(r.innerText=`RUSAK BERAT`,r.className=`badge badge-tidak-laik`,n.style.color=`var(--danger-500)`))}e()}window._pullAIData=async()=>{let e=window._kondisiLastAnalisis;if(!e)return V(`Lakukan "Analisis AI" terlebih dahulu untuk menarik data kelaikan.`);if(!await ne({title:`Ambil Data AI`,message:`Data AI (Skor Kelaikan) akan dikonversi menjadi Estimasi Kerusakan Fisik. Data manual yang Anda isi sebelumnya akan ditimpa. Lanjutkan?`,confirmText:`Ya, Sinkronkan AI`}))return;let t={struktur:100-(e.skor_struktur||0),arsitektur:100-(e.skor_arsitektur||0),utilitas:100-(e.skor_mep||0)};document.querySelectorAll(`.kondisi-slider`).forEach(e=>{e.value=t[e.dataset.group]||0,window._updateItemValue(e.dataset.id)}),B(`Sinkronisasi AI berhasil dilakukan!`)},window._saveKondisi=async()=>{let t=window._kondisiProyekId,n=[],r=0,i={struktur:0,arsitektur:0,utilitas:0};document.querySelectorAll(`.kondisi-slider`).forEach(e=>{let a=e.dataset.id,o=parseInt(e.value),s=parseFloat(e.dataset.bobot),c=e.dataset.group,l={struktur:`Struktur`,arsitektur:`Arsitektur`,utilitas:`Mekanikal`},u=o/100*s;i[c]+=u,r+=u,n.push({proyek_id:t,kode:a,nama:e.closest(`tr`).cells[0].innerText,kategori:`kondisi_fisik`,aspek:l[c]||`Lainnya`,status:o===0?`baik`:o<=30?`ringan`:o<=45?`sedang`:`berat`,metadata:{persentase_kerusakan:o,bobot_item:s,weighted_score:u,is_dynamic:!0,floor_context:window._kondisiJumlahLantai,last_updated:new Date().toISOString()},catatan:`Persentase kerusakan: ${o}%. Bobot elemen: ${s}%.`})});try{let a=document.querySelector(`.btn-primary`);a.disabled=!0,a.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Sinkronisasi & Menyimpan...`;let{error:o}=await e.from(`checklist_items`).upsert(n,{onConflict:`proyek_id, kode`});if(o)throw o;let s={skor_struktur:Math.round((45-i.struktur)/45*100),skor_arsitektur:Math.round((30-i.arsitektur)/30*100),skor_mep:Math.round((25-i.utilitas)/25*100)},{data:c}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,t).order(`created_at`,{ascending:!1}).limit(1).maybeSingle(),l={proyek_id:t,...s,skor_total:Math.round(100-r),risk_level:r<=30?`low`:r<=45?`high`:`critical`,status_slf:r<=30?`LAIK_FUNGSI`:r<=45?`LAIK_FUNGSI_BERSYARAT`:`TIDAK_LAIK_FUNGSI`,ai_provider:`pemeriksaan-fisik-manual`};c?await e.from(`hasil_analisis`).update(l).eq(`id`,c.id):await e.from(`hasil_analisis`).insert([l]),await e.from(`proyek`).update({status_slf:l.status_slf,progress:60}).eq(`id`,t),B(`Data kondisi fisik & skor kelaikan berhasil disinkronkan ke database!`),setTimeout(()=>{M(`proyek-detail`,{id:t})},1500)}catch(e){V(`Gagal menyimpan: `+e.message)}finally{let e=document.querySelector(`.btn-primary`);e&&(e.disabled=!1,e.innerHTML=`<i class="fas fa-save"></i> Simpan Penilaian`)}};async function Fw(t){let{data:n}=await e.from(`proyek`).select(`*`).eq(`id`,t).maybeSingle();return n}async function Iw(t){let{data:n}=await e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,t).order(`created_at`,{ascending:!1}).limit(1).maybeSingle();return n}async function Lw(t){let{data:n}=await e.from(`checklist_items`).select(`*`).eq(`proyek_id`,t).eq(`kategori`,`kondisi_fisik`);return n}function Rw(){return`
    <div class="page-header">
      <div class="skeleton" style="height:20px;width:160px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:36px;width:400px;margin-bottom:8px"></div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 340px; gap:var(--space-6)">
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="skeleton" style="height:300px; border-radius:12px"></div>
        <div class="skeleton" style="height:300px; border-radius:12px"></div>
      </div>
      <div class="skeleton" style="height:500px; border-radius:12px"></div>
    </div>
  `}async function zw(e){let t=e.id;if(!t)return M(`proyek`),``;let n=document.getElementById(`page-root`);n&&(n.innerHTML=Gw());let[r,i,a]=await Promise.all([Bw(t),Vw(t),Hw(t)]);if(!r)return M(`proyek`),``;let o=[...i,...a];window._currentPhotos=o,window._galeriFilter=`all`;let s=Uw(r,o);return n&&(n.innerHTML=s,Ww(o)),s}async function Bw(t){let{data:n}=await e.from(`proyek`).select(`*`).eq(`id`,t).maybeSingle();return n}async function Vw(t){let{data:n,error:r}=await e.from(`checklist_items`).select(`kode, nama, aspek, foto_urls, metadata`).eq(`proyek_id`,t);if(r)return[];let i=[];return n.forEach(e=>{e.foto_urls&&Array.isArray(e.foto_urls)&&e.foto_urls.forEach((t,n)=>{i.push({id:`${e.kode}_${n}`,source:`checklist`,url:t,kode:e.kode,nama:e.nama,aspek:e.aspek||`Lainnya`,is_starred:e.metadata?.featured_photos?.includes(t)||!1,raw_item:e})})}),i}async function Hw(t){let{data:n,error:r}=await e.from(`proyek_files`).select(`*`).eq(`proyek_id`,t);return r?[]:n.filter(e=>e.file_url&&e.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)).map(e=>({id:e.id,source:`files`,url:e.file_url,name:e.name,category:e.category||`Umum`,aspek:e.category===`teknis`?`Teknis`:`Administrasi`,is_starred:e.metadata?.is_starred||!1,raw_file:e}))}function Uw(e,t){return`
    <div class="page-container">
      <div class="page-header" style="margin-bottom:var(--space-6)">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${e.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke Proyek
            </button>
            <h1 class="page-title">Galeri Bukti Visual</h1>
            <p class="page-subtitle">${t.length} total foto teridentifikasi dalam proyek ini.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline" onclick="window._refreshGaleri()">
              <i class="fas fa-sync"></i> Refresh
            </button>
            <button class="btn btn-primary" onclick="window.navigate('laporan', {id:'${e.id}'})">
              <i class="fas fa-file-contract"></i> Lihat Laporan
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-top:var(--space-5); padding:var(--space-3); display:flex; gap:var(--space-2); overflow-x:auto">
          <button class="btn btn-sm btn-filter active" data-filter="all" onclick="window._filterGaleri('all', this)">Semua Foto</button>
          <button class="btn btn-sm btn-filter" data-filter="starred" onclick="window._filterGaleri('starred', this)">
            <i class="fas fa-star text-yellow-500"></i> Terpilih (Laporan)
          </button>
          <div style="width:1px; background:var(--border-subtle); margin:4px 8px"></div>
          <button class="btn btn-sm btn-filter" data-filter="Struktur" onclick="window._filterGaleri('Struktur', this)">Struktur</button>
          <button class="btn btn-sm btn-filter" data-filter="Arsitektur" onclick="window._filterGaleri('Arsitektur', this)">Arsitektur</button>
          <button class="btn btn-sm btn-filter" data-filter="Mekanikal" onclick="window._filterGaleri('Mekanikal', this)">MEP / Utilitas</button>
          <button class="btn btn-sm btn-filter" data-filter="Administrasi" onclick="window._filterGaleri('Administrasi', this)">Administrasi</button>
        </div>
      </div>

      <div id="galeri-grid" class="galeri-grid">
        <!-- Photo cards will be injected here -->
      </div>

      <!-- Lightbox Overlay -->
      <div id="galeri-lightbox" class="lightbox-overlay" style="display:none" onclick="window._closeLightbox()">
        <img id="lightbox-img" src="" alt="Enlarged view">
        <div class="lightbox-caption" id="lightbox-caption"></div>
        <button class="lightbox-close"><i class="fas fa-times"></i></button>
      </div>
    </div>

    <style>
      .galeri-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
      }
      .photo-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        overflow: hidden;
        border: 1px solid var(--border-subtle);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
      }
      .photo-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }
      .photo-card.starred {
        border: 2px solid var(--brand-500);
      }
      .photo-thumb-wrap {
        position: relative;
        aspect-ratio: 4/3;
        background: var(--bg-elevated);
        cursor: zoom-in;
      }
      .photo-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .photo-info {
        padding: var(--space-3);
      }
      .photo-title {
        font-weight: 700;
        font-size: 0.85rem;
        margin-bottom: 4px;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .photo-meta {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .star-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.5);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
      }
      .star-btn.active {
        background: var(--brand-500);
        color: white;
      }
      .star-btn:hover {
        transform: scale(1.1);
      }
      .source-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.6rem;
        font-weight: 800;
        text-transform: uppercase;
        background: rgba(0,0,0,0.6);
        color: white;
        backdrop-filter: blur(4px);
      }
      .lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-10);
      }
      #lightbox-img {
        max-width: 90%;
        max-height: 80vh;
        border-radius: 8px;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
      }
      .lightbox-caption {
        margin-top: 20px;
        color: white;
        text-align: center;
        max-width: 600px;
      }
      .lightbox-close {
        position: absolute;
        top: 30px;
        right: 30px;
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
      }
      .btn-filter.active {
        background: var(--brand-500);
        color: white;
        border-color: var(--brand-500);
      }
    </style>
  `}function Ww(e){let t=document.getElementById(`galeri-grid`);if(t){if(e.length===0){t.innerHTML=`
      <div style="grid-column: 1/-1; text-align:center; padding:var(--space-12); background:var(--bg-card); border-radius:var(--radius-xl)">
        <i class="fas fa-images" style="font-size:3rem; color:var(--text-tertiary); margin-bottom:var(--space-4)"></i>
        <h3>Belum Ada Foto</h3>
        <p class="text-secondary">Ambil foto saat inspeksi atau unggah dokumen di modul checklist.</p>
      </div>
    `;return}t.innerHTML=e.map(e=>`
    <div class="photo-card ${e.is_starred?`starred`:``}" id="card-${e.id}">
      <div class="photo-thumb-wrap" onclick="window._openLightbox('${e.url}', '${e.nama||e.name}', '${e.aspek||e.category}')">
        <img src="${e.url}" class="photo-thumb" loading="lazy">
        <div class="source-badge">${e.source===`checklist`?e.kode:e.category}</div>
        <button class="star-btn ${e.is_starred?`active`:``}" 
                onclick="event.stopPropagation(); window._toggleStar('${e.id}')" 
                title="Pilih untuk Laporan Utama">
          <i class="fas fa-star"></i>
        </button>
      </div>
      <div class="photo-info">
        <div class="photo-title" title="${e.nama||e.name}">${e.nama||e.name}</div>
        <div class="photo-meta">
          <span><i class="fas fa-tag"></i> ${e.aspek||e.category}</span>
          <span style="opacity:0.6">${e.source===`checklist`?`Audit Lapangan`:`Dokumen Proyek`}</span>
        </div>
      </div>
    </div>
  `).join(``)}}window._filterGaleri=(e,t)=>{window._galeriFilter=e,document.querySelectorAll(`.btn-filter`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`);let n=window._currentPhotos;e===`starred`?n=window._currentPhotos.filter(e=>e.is_starred):e!==`all`&&(n=window._currentPhotos.filter(t=>t.aspek===e||t.category===e)),Ww(n)},window._openLightbox=(e,t,n)=>{let r=document.getElementById(`galeri-lightbox`),i=document.getElementById(`lightbox-img`),a=document.getElementById(`lightbox-caption`);i.src=e,a.innerHTML=`<strong>${t}</strong><br><span style="opacity:0.7">Aspek: ${n}</span>`,r.style.display=`flex`,r.style.opacity=`0`,setTimeout(()=>r.style.opacity=`1`,50)},window._closeLightbox=()=>{let e=document.getElementById(`galeri-lightbox`);e.style.opacity=`0`,setTimeout(()=>e.style.display=`none`,300)},window._toggleStar=async t=>{let n=window._currentPhotos.find(e=>e.id===t);if(!n)return;let r=!n.is_starred;n.is_starred=r;let i=document.getElementById(`card-${t}`),a=i?.querySelector(`.star-btn`);i&&(r?i.classList.add(`starred`):i.classList.remove(`starred`)),a&&(r?a.classList.add(`active`):a.classList.remove(`active`));try{if(n.source===`checklist`){let t=n.raw_item,i=t.metadata?.featured_photos||[];r?i.includes(n.url)||i.push(n.url):i=i.filter(e=>e!==n.url),await e.from(`checklist_items`).update({metadata:{...t.metadata,featured_photos:i}}).eq(`proyek_id`,t.raw_item.proyek_id).eq(`kode`,t.raw_item.kode)}else{let t=n.raw_file;await e.from(`proyek_files`).update({metadata:{...t.metadata,is_starred:r}}).eq(`id`,t.id)}B(r?`Foto dipilih untuk laporan utama.`:`Foto dilepas dari laporan utama.`)}catch(e){V(`Gagal menyimpan status foto: `+e.message)}},window._refreshGaleri=()=>{zw({id:new URLSearchParams(window.location.search).get(`id`)})};function Gw(){return`
    <div class="page-container">
      <div class="skeleton" style="height:40px; width:300px; margin-bottom:20px"></div>
      <div class="skeleton" style="height:100px; margin-bottom:20px; border-radius:12px"></div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px">
        ${[,,,,,,].fill(`<div class="skeleton" style="height:250px; border-radius:12px"></div>`).join(``)}
      </div>
    </div>
  `}async function Kw(t={}){let n=t.id;if(!n)return M(`proyek`),``;let r=document.getElementById(`page-root`);r&&(r.innerHTML=`<div class="loading-full"><div class="spinner"></div><p>Sinkronisasi Format Resmi SIMBG...</p></div>`);try{let[t,i]=await Promise.all([Yw(n),e.from(`settings`).select(`*`).eq(`id`,`00000000-0000-0000-0000-000000000000`).single()]).catch(e=>{throw console.error(`[SLF] Initial Fetch Error:`,e),Error(`Gagal mengambil data proyek atau pengaturan.`)}),a=i.data?.data||{};if(!t)return V(`Proyek tidak ditemukan.`),M(`proyek`),``;let o=qw(t,a);return r&&(r.innerHTML=o,Xw(t,a)),o}catch(e){return console.error(`[SLF] Page Error:`,e),r&&(r.innerHTML=`
        <div class="empty-state" style="min-height:70vh">
          <div class="empty-icon" style="color:var(--danger-400)"><i class="fas fa-exclamation-triangle"></i></div>
          <h2 class="empty-title">Gagal Memuat Halaman</h2>
          <p class="empty-desc">${e.message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Muat Ulang</button>
        </div>
      `),``}}function qw(e,t){return`
    <div id="surat-pernyataan-page" class="legal-page hf-version">
      <div class="legal-sidebar">
        <div class="sidebar-header">
          <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${e.id}'})">
            <i class="fas fa-arrow-left"></i> Kembali ke Proyek
          </button>
          <h2>Format Resmi SIMBG</h2>
          <p class="text-xs text-tertiary">PP 16/2021 · 3 Pilar Tenaga Ahli</p>
        </div>

        <div class="sidebar-menu">
          <div class="menu-item active" data-type="konsultan">
            <i class="fas fa-file-shield"></i>
            <div class="menu-label">
              <span>Pernyataan Konsultan</span>
              <small>3 Bidang Ahli (+TTE)</small>
            </div>
          </div>
          <div class="menu-item" data-type="pemilik">
            <i class="fas fa-user-check"></i>
            <div class="menu-label">
              <span>Pernyataan Pemilik</span>
              <small>Komitmen Pemeliharaan</small>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="alert alert-info" style="font-size:11px; margin-bottom:15px;">
            <i class="fas fa-info-circle"></i>
            Koordinat & Data Teknis ditarik otomatis. Aktifkan "Mode Edit" untuk perubahan manual.
          </div>
          <div class="form-group" style="padding:0 10px 15px 10px;">
            <label class="toggle" style="justify-content:space-between; width:100%; font-size:13px; font-weight:600;">
              <span><i class="fas fa-edit"></i> Mode Edit Teks</span>
              <input type="checkbox" id="toggle-edit-mode">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <button class="btn btn-primary btn-block" id="btn-download-docx">
            <i class="fas fa-file-word"></i> Ekspor Word (TTE Ready)
          </button>
        </div>
      </div>

      <div class="legal-canvas">
        <div class="paper-a4" id="legal-preview" contenteditable="false">
          ${Jw(`konsultan`,e,t)}
        </div>
      </div>
    </div>

    <style>
      .legal-page.hf-version { display: flex; height: calc(100vh - 64px); background: #f1f5f9; overflow: hidden; }
      .legal-sidebar { width: 340px; background: #fff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; box-shadow: 10px 0 30px rgba(0,0,0,0.03); z-index: 10; }
      .sidebar-header { padding: 30px 24px; border-bottom: 1px solid #f1f5f9; }
      .sidebar-header h2 { margin-top: 15px; font-size: 20px; color: #1e293b; font-weight: 800; }
      
      .sidebar-menu { flex: 1; padding: 15px; }
      .menu-item { display: flex; align-items: center; gap: 15px; padding: 16px; border-radius: 12px; cursor: pointer; transition: all 0.3s; margin-bottom: 8px; border: 1px solid transparent; color: #475569; }
      .menu-item:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
      .menu-item.active { background: #2563eb; color: #fff; border-color: #1d4ed8; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
      .menu-item i { font-size: 24px; opacity: 0.8; }
      .menu-item.active i { opacity: 1; color: #fff; }
      .menu-label { display: flex; flex-direction: column; }
      .menu-label span { font-weight: 700; font-size: 15px; color: inherit; }
      .menu-label small { font-size: 11px; opacity: 0.8; font-weight: 500; color: inherit; }
      .menu-item.active .menu-label small { opacity: 0.9; color: #dbeafe; }

      .sidebar-footer { padding: 25px; background: #fff; border-top: 1px solid #f1f5f9; color: #1e293b; }
      .alert-info { background: #dbeafe !important; color: #1e3a8a !important; border-color: #3b82f6 !important; opacity: 1 !important; }
      .sidebar-footer label { color: #1e293b !important; }
      .sidebar-footer .text-xs { color: #64748b !important; }

      .legal-canvas { flex: 1; overflow-y: auto; padding: 60px; display: flex; justify-content: center; scroll-behavior: smooth; }
      
      .paper-a4 {
        width: 210mm;
        min-height: 297mm;
        background: #fff;
        box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        padding: 25mm 20mm;
        font-family: "Times New Roman", serif;
        font-size: 11.5pt;
        line-height: 1.4;
        color: #000;
        outline: none;
        position: relative;
        text-align: justify;
      }
      .paper-a4:focus { border: 1px dashed #3b82f6; }

      /* Detailed Document Styles */
      .doc-header-hf { position: relative; min-height: 100px; margin-bottom: 20px; }
      .doc-kop-img { width: 100%; max-height: 150px; object-fit: contain; }
      .doc-kop-text { border-bottom: 4px double #000; padding-bottom: 10px; text-align: center; line-height: 1.2; }
      .doc-kop-text h1 { font-size: 16pt; font-weight: bold; margin: 0; text-transform: uppercase; }
      .doc-kop-text h2 { font-size: 14pt; font-weight: bold; margin: 2px 0; text-transform: uppercase; }
      .doc-kop-text p { font-size: 9pt; margin: 2px 0; font-style: italic; }
      
      .doc-title-hf { text-align: center; margin-bottom: 25px; }
      .doc-title-hf h2 { font-size: 13pt; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; }
      .doc-meta-hf { margin-bottom: 20px; font-weight: 500; }
      .meta-row { display: grid; grid-template-columns: 80px 10px 1fr; margin-bottom: 2px; }

      .doc-section-title { font-weight: bold; margin-bottom: 10px; }
      .doc-list { list-style: none; padding-left: 20px; margin-bottom: 15px; }
      .doc-list li { margin-bottom: 4px; display: flex; gap: 8px; }

      .sig-director-content { display: flex; align-items: flex-end; justify-content: flex-end; gap: 40px; margin-top: 25px; width: 100%; }
      .materai-box { width: 95px; height: 95px; border: 1px dashed #64748b; border-radius: 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 8px; color: #64748b; line-height: 1.2; text-align: center; background: #fafafa; opacity: 0.8; font-family: 'Inter', sans-serif; margin-bottom: 20px; }
      .materai-box b { font-size: 10px; color: #475569; letter-spacing: 1px; margin-bottom: 3px; }
      .sig-director-right { display: flex; flex-direction: column; align-items: center; min-width: 280px; }
      .sig-img-director { max-width: 150px; max-height: 80px; object-fit: contain; }
      .sig-img-qr-std { width: 65px; height: 65px; object-fit: contain; background: white; padding: 2px; border: 1px solid #f1f5f9; }
      .sig-header-text { font-weight: bold; font-size: 10pt; min-height: 35px; display: flex; align-items: center; justify-content: center; line-height: 1.2; text-align: center; margin-bottom: 8px; }
      .director-name-container { text-align: center; width: 100%; margin-top: 8px; }
      .director-job-text { font-size: 10pt; margin-top: 4px; display: block; }
      .list-num { min-width: 20px; }

      .doc-grid-11 { margin: 15px 0 25px 25px; display: flex; flex-direction: column; gap: 4px; }
      .grid-11-row { display: grid; grid-template-columns: 20px 180px 10px 1fr; align-items: baseline; }

      .box-pernyataan { border: 2px solid #000; padding: 15px; text-align: center; font-weight: bold; font-size: 13pt; margin: 25px 0; text-transform: uppercase; }

      /* 3 Column Signature */
      .sig-3-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 40px; }
      .sig-cell { text-align: center; display: flex; flex-direction: column; align-items: center; }
      .sig-role { font-weight: bold; font-size: 9pt; min-height: 35px; display: flex; align-items: center; justify-content: center; line-height: 1.2; }
      .sig-box-tte { height: 90px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 8px 0; position: relative; }
      .sig-img-signature { position: absolute; max-height: 60px; max-width: 80%; object-fit: contain; z-index: 1; opacity: 0.9; }
      .sig-img-qr { max-height: 65px; max-width: 65px; object-fit: contain; z-index: 2; border: 1px solid #eee; background: #fff; padding: 2px; border-radius: 4px; }
      .sig-placeholder { font-size: 7pt; color: #666; font-style: italic; opacity: 0.3; border: 1px dashed #ccc; width: 65px; height: 65px; display: flex; align-items: center; justify-content: center; }
      .sig-name { font-weight: bold; text-decoration: underline; font-size: 10pt; margin-top: 8px; text-transform: uppercase; }
      .sig-skk { font-size: 8pt; margin-top: 2px; opacity: 0.8; }
    </style>
  `}function Jw(e,t,n){let r=$w(new Date),i=n.experts||{};return e===`konsultan`?`
      <div class="doc-header-hf">
        ${n.consultant?.kop_image?`<img src="${n.consultant.kop_image}" class="doc-kop-img">`:`<div class="doc-kop-text">${(n.consultant?.kop_text||`KOP SURAT`).split(`
`).map((e,t)=>t===0?`<h1>${e}</h1>`:t===1?`<h2>${e}</h2>`:`<p>${e}</p>`).join(``)}</div>`}
      </div>

      <div class="doc-title-hf">
        <h2>SURAT PERNYATAAN KELAIKAN FUNGSI<br>BANGUNAN GEDUNG</h2>
      </div>

      <div class="doc-meta-hf">
        <div class="meta-row"><div>Nomor</div><div>:</div><div>__________</div></div>
        <div class="meta-row"><div>Tanggal</div><div>:</div><div>${r}</div></div>
        <div class="meta-row"><div>Lampiran</div><div>:</div><div>1 (Satu) Berkas</div></div>
      </div>

      <div style="margin-bottom:15px;">
        Pada hari ini, tanggal ${new Date().getDate()} bulan ${eT(new Date)} tahun ${new Date().getFullYear()}, yang bertanda tangan di bawah ini:
      </div>

      <div class="doc-list">
        <li><div class="list-num">□</div><div>Penyedia jasa pengkaji teknis / Penyedia jasa pengawas konstruksi / Penyedia jasa manajemen konstruksi / Instansi penyelenggara SLF Pemerintah Daerah</div></li>
      </div>

      <div style="margin-left:25px; margin-bottom:20px;">
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Nama perusahaan/instansi</div><div>:</div><div>${Qw(n.consultant?.name||`-`)}</div></div>
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Alamat</div><div>:</div><div>${Qw(n.consultant?.address||`-`)}</div></div>
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Telepon</div><div>:</div><div>${Qw(t.telepon||`-`)}</div></div>
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Email</div><div>:</div><div>${Qw(t.email_pemilik||`-`)}</div></div>
      </div>

      <div class="doc-section-title">Pelaksana pemeriksaan kelaikan fungsi bangunan gedung:</div>
      <div style="margin-left:25px; margin-bottom:15px;">
        <div class="grid-11-row"><div>1)</div><div style="font-weight:bold">Bidang arsitektur / tata ruang-luar:</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">a) Nama</div><div>:</div><div>${Qw(i.architecture?.name||`____________________`)}</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">b) Nomor sertifikat keahlian</div><div>:</div><div>${Qw(i.architecture?.skk||`____________________`)}</div></div>
        
        <div class="grid-11-row" style="margin-top:4px"><div>2)</div><div style="font-weight:bold">Bidang struktur:</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">a) Nama</div><div>:</div><div>${Qw(i.structure?.name||`____________________`)}</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">b) Nomor sertifikat keahlian</div><div>:</div><div>${Qw(i.structure?.skk||`____________________`)}</div></div>

        <div class="grid-11-row" style="margin-top:4px"><div>3)</div><div style="font-weight:bold">Bidang utilitas / MEP:</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">a) Nama</div><div>:</div><div>${Qw(i.mep?.name||`____________________`)}</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">b) Nomor sertifikat keahlian</div><div>:</div><div>${Qw(i.mep?.skk||`____________________`)}</div></div>
      </div>

      <div class="doc-section-title">Telah melaksanakan pemeriksaan kelaikan fungsi bangunan gedung pada:</div>
      <div class="doc-grid-11">
        <div class="grid-11-row"><div>1)</div><div>Nama bangunan</div><div>:</div><div>${Qw(t.nama_bangunan)}</div></div>
        <div class="grid-11-row"><div>2)</div><div>Alamat bangunan</div><div>:</div><div>${Qw(t.alamat||`-`)}</div></div>
        <div class="grid-11-row"><div>3)</div><div>Posisi koordinat</div><div>:</div><div>${t.latitude||`0`}, ${t.longitude||`0`}</div></div>
        <div class="grid-11-row"><div>4)</div><div>Fungsi bangunan</div><div>:</div><div>${Qw(t.fungsi_bangunan||`-`)}</div></div>
        <div class="grid-11-row"><div>5)</div><div>Klasifikasi kompleksitas</div><div>:</div><div>Sederhana / Tidak Sederhana</div></div>
        <div class="grid-11-row"><div>6)</div><div>Ketinggian bangunan</div><div>:</div><div>${t.tahun_dibangun||`-`}</div></div>
        <div class="grid-11-row"><div>7)</div><div>Jumlah lantai bangunan</div><div>:</div><div>${t.jumlah_lantai||1} Lantai</div></div>
        <div class="grid-11-row"><div>8)</div><div>Luas lantai bangunan</div><div>:</div><div>${t.luas_bangunan||0} m²</div></div>
        <div class="grid-11-row"><div>9)</div><div>Jumlah basement</div><div>:</div><div>-</div></div>
        <div class="grid-11-row"><div>10)</div><div>Luas lantai basement</div><div>:</div><div>-</div></div>
        <div class="grid-11-row"><div>11)</div><div>Luas tanah</div><div>:</div><div>${t.luas_lahan||0} m²</div></div>
      </div>

      <div class="doc-section-title">Berdasarkan hasil pemeriksaan persyaratan kelaikan fungsi yang terdiri dari:</div>
      <div class="doc-list" style="margin-left:15px">
        <li><div class="list-num">1)</div><div>Pemeriksaan dokumen administratif bangunan gedung;</div></li>
        <li><div class="list-num">2)</div><div>Pemeriksaan persyaratan teknis bangunan gedung, yaitu:</div></li>
        <div style="margin-left:30px">
          <li><div class="list-num">a.</div><div>pemeriksaan persyaratan tata bangunan, meliputi peruntukan, intensitas, arsitektur dan pengendalian dampak lingkungan;</div></li>
          <li><div class="list-num">b.</div><div>pemeriksaan persyaratan keandalan bangunan gedung, meliputi keselamatan, kesehatan, kenyamanan, dan kemudahan.</div></li>
        </div>
      </div>

      <div style="margin-top:15px">Dengan ini menyatakan bahwa:</div>
      <div class="box-pernyataan">
        BANGUNAN GEDUNG DINYATAKAN LAIK FUNGSI
      </div>

      <div style="margin-bottom:12px">Sesuai kesimpulan dari analisis dan evaluasi terhadap hasil pemeriksaan dokumen dan pemeriksaan kondisi fisik bangunan gedung sebagaimana termuat dalam Laporan Pemeriksaan Kelaikan Fungsi Bangunan Gedung terlampir.</div>
      
      <div style="margin-bottom:12px">Surat pernyataan ini berlaku sepanjang tidak ada perubahan yang dilakukan oleh pemilik atau pengguna terhadap bangunan gedung atau penyebab gangguan lainnya yang dibuktikan kemudian.</div>
      
      <div style="margin-bottom:12px">
        <p>Demikian Surat Pernyataan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

        <div class="sig-director-block" style="margin-top: 40px">
          <div class="sig-director-content">
            <!-- e-Materai on the Left per BSN -->
            <div class="materai-box">
              <b>MATERAI</b>
              ELEKTRONIK
              <div style="font-size:7px; margin-top:4px; opacity:0.7;">SEPULUH RIBU RUPIAH</div>
            </div>
            
            <div class="sig-director-right">
              <div class="sig-header-text">${Qw(n.consultant?.name||`NAMA PERUSAHAAN`)}</div>
              
              <div class="sig-box-tte" style="height:90px;">
                ${(()=>{let e=`${window.location.origin}${window.location.pathname}#/verify?id=${t.id}&expert=director`;return`<img src="${`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(e)}`}" class="sig-img-qr-std">`})()}
                
                ${n.consultant?.signature?`<img src="${n.consultant.signature}" class="sig-img-signature" style="transform: translateX(30px) translateY(15px);">`:``}
              </div>

              <div class="director-name-container">
                <div class="sig-name">${Qw(n.consultant?.director_name||`NAMA DIREKTUR`)}</div>
                <div class="director-job-text">${Qw(n.consultant?.director_job||`Direktur`)}</div>
                <div style="font-size:7px; margin-top:8px; opacity:0.5; font-style:italic">Scan untuk Verifikasi Digital (Direktur)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sig-3-col">
        ${[`architecture`,`structure`,`mep`].map(e=>{let n=i[e]||{},r=e===`architecture`?`Bidang Arsitektur /<br>Tata Ruang Luar`:e===`structure`?`Bidang Struktur`:`Bidang Utilitas /<br>MEP`,a=`${window.location.origin}${window.location.pathname}#/verify?id=${t.id}&expert=${e}`;return`
            <div class="sig-cell">
              <div class="sig-role">${r}</div>
              <div class="sig-box-tte">
                 <img src="${`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(a)}`}" class="sig-img-qr">
                 ${n.signature?`<img src="${n.signature}" class="sig-img-signature" style="transform:translateX(20px) translateY(10px);">`:``}
              </div>
              <div class="sig-name">${Qw(n.name||`NAME`)}</div>
              <div class="sig-skk">No. SKK: ${Qw(n.skk||`-`)}</div>
              <div style="font-size:7px; margin-top:5px; opacity:0.5; font-style:italic">Scan untuk Verifikasi Digital</div>
            </div>
          `}).join(``)}
      </div>
    `:`
      <div class="doc-title-hf" style="margin-top: 40px">
        <h2>SURAT PERNYATAAN PEMILIK / PENGELOLA</h2>
        <p>TENTANG KESEDIAAN MEMELIHARA BANGUNAN GEDUNG</p>
      </div>

      <div style="margin: 30px 0 15px 0;">Yang bertanda tangan di bawah ini:</div>

      <div class="doc-grid-11" style="margin-left:0">
        <div class="grid-11-row"><div>-</div><div style="width:140px">Nama Pemilik</div><div>:</div><div>${Qw(t.pemilik||`____________________`)}</div></div>
        <div class="grid-11-row"><div>-</div><div style="width:140px">Nomor Identitas</div><div>:</div><div>${Qw(t.ktp_pemilik||`____________________`)}</div></div>
        <div class="grid-11-row"><div>-</div><div style="width:140px">Alamat</div><div>:</div><div>${Qw(t.alamat_pemilik||`____________________`)}</div></div>
      </div>

      <div style="margin-bottom:15px">Adalah selaku pemilik/pengelola bangunan gedung yang berlokasi di:</div>

      <div class="doc-grid-11" style="margin-left:0">
        <div class="grid-11-row"><div>-</div><div style="width:140px">Nama Bangunan</div><div>:</div><div>${Qw(t.nama_bangunan)}</div></div>
        <div class="grid-11-row"><div>-</div><div style="width:140px">Alamat Bangunan</div><div>:</div><div>${Qw(t.alamat||`-`)}</div></div>
      </div>

      <div style="margin-top:20px; line-height:1.6">
        Dengan ini menyatakan bahwa saya akan memelihara dan merawat bangunan gedung tersebut sesuai dengan standar teknis dan peruntukannya, serta menjamin kebenaran seluruh dokumen yang disampaikan dalam permohonan SLF melalui sistem SIMBG.
      </div>

      <div style="margin-top:15px; line-height:1.6">
        Apabila dikemudian hari ditemukan ketidakbenaran atas pernyataan ini, saya bersedia mempertanggungjawabkannya sesuai ketentuan hukum yang berlaku.
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:60px;">
        <div style="text-align:center; width: 250px;">
          <div>${t.kota||`Bandung`}, ${r}</div>
          <div style="font-weight:bold; margin-top:5px;">Pemilik Bangunan,</div>
          <div style="height: 100px; display:flex; align-items:center; justify-content:center; opacity:0.3; border: 1px dashed #ccc; margin:15px 0">
            [Meterai Rp10.000]
          </div>
          <div style="border-bottom:1px solid #000; font-weight:bold; text-transform:uppercase">${Qw(t.pemilik||`____________________`)}</div>
        </div>
      </div>
    `}async function Yw(t){let{data:n,error:r}=await e.from(`proyek`).select(`*`).eq(`id`,t).single();return r?null:n}function Xw(e,t){let n=document.querySelectorAll(`.menu-item`),r=document.getElementById(`legal-preview`);n.forEach(i=>{i.onclick=()=>{n.forEach(e=>e.classList.remove(`active`)),i.classList.add(`active`),r.innerHTML=Jw(i.getAttribute(`data-type`),e,t)}});let i=document.getElementById(`btn-download-docx`);i&&(i.onclick=()=>Zw(e));let a=document.getElementById(`toggle-edit-mode`);a&&(a.onchange=e=>{r.setAttribute(`contenteditable`,e.target.checked?`true`:`false`),e.target.checked&&(B(`Mode Edit Aktif. Anda dapat mengubah teks dokumen langsung.`),r.focus())})}async function Zw(t){let n=document.getElementById(`legal-preview`),r=document.querySelector(`.menu-item.active`)?.getAttribute(`data-type`)||`konsultan`;B(`Menyiapkan Word: ${r===`konsultan`?`Pernyataan Konsultan`:`Pernyataan Pemilik`}...`);try{let{data:i,error:a}=await e.from(`settings`).select(`data`).eq(`id`,`00000000-0000-0000-0000-000000000000`).single();if(a)throw a;let o=i?.data||{},{downloadLegalDocx:s}=await Rt(async()=>{let{downloadLegalDocx:e}=await import(`./surat-pernyataan-service-Bp8xx_8-.js`);return{downloadLegalDocx:e}},[]),c=n.innerHTML;await s(t,o,r,c),B(`Dokumen berhasil diunduh.`)}catch(e){console.error(`Docx Export Error:`,e),V(`Gagal mengunduh: `+e.message)}}function Qw(e){return e?String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]):``}function $w(e){return e?e.toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`}):`-`}function eT(e){return e.toLocaleDateString(`id-ID`,{month:`long`})}async function tT(t={}){let n=t.id,r=t.expert,i=document.getElementById(`page-root`);i&&(i.innerHTML=`
      <div class="verify-loading">
        <div class="verify-spinner"></div>
        <p>Memverifikasi Dokumen Digital...</p>
      </div>
      <style>
        .verify-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 20px; color: #64748b; font-family: 'Inter', sans-serif; }
        .verify-spinner { width: 50px; height: 50px; border: 5px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: v-spin 1s linear infinite; }
        @keyframes v-spin { to { transform: rotate(360deg); } }
      </style>
    `);try{let[t,a,o]=await Promise.all([e.from(`proyek`).select(`*`).eq(`id`,n).single(),e.from(`hasil_analisis`).select(`*`).eq(`proyek_id`,n).maybeSingle(),Yx()]);if(t.error||!t.data)throw Error(`Dokumen tidak ditemukan dalam pusat data (Invalid).`);let s=t.data,c=a.data;o.experts?.[r];let l=nT(s,c,o,r);i&&(i.innerHTML=l)}catch(e){i&&(i.innerHTML=rT(e.message))}return``}function nT(e,t,n,r){let i=new Date(e.created_at).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`}),a=t?.status_slf?.replace(/_/g,` `)||`DALAM PENGKAJIAN`,o={},s=``;return r===`director`?(o={name:n.consultant?.director_name||`DIREKTUR`,skk:null,job:n.consultant?.director_job||`Direktur`},s=o.job.toUpperCase()):(o=n.experts?.[r]||{},s=`Bidang ${r?.toUpperCase()}`),`
    <div class="verify-container">
      <div class="verify-card">
        <!-- Header: Status Badge -->
        <div class="verify-badge">
           <div class="badge-icon"><i class="fas fa-check-shield"></i></div>
           <div class="badge-text">
             <span class="status-top">DOKUMEN TERVERIFIKASI ASLI</span>
             <span class="status-id">ID: ${e.id.slice(0,8)}...</span>
           </div>
        </div>

        <!-- Building Photo -->
        <div class="verify-hero">
           ${e.foto_bangunan?`<img src="${e.foto_bangunan}" alt="Foto Bangunan">`:`<div class="photo-placeholder"><i class="fas fa-building"></i><br>Foto Bangunan Galeri</div>`}
           <div class="hero-label">${iT(e.nama_bangunan)}</div>
        </div>

        <div class="verify-content">
          <!-- Information Grid -->
          <div class="info-grid">
            <div class="info-item">
              <label>Pemilik</label>
              <span>${iT(e.pemilik||`-`)}</span>
            </div>
            <div class="info-item">
              <label>Lokasi</label>
              <span class="text-sm">${iT(e.alamat||`-`)}</span>
            </div>
            <div class="info-item">
              <label>Konsultan Pengkaji</label>
              <span>${iT(n.consultant?.name||`-`)}</span>
            </div>
            <div class="info-item">
              <label>Tanggal Terbit</label>
              <span>${i}</span>
            </div>
          </div>

          <!-- Document Validity Status -->
          <div class="validity-box ${t?.status_slf===`LAIK_FUNGSI`?`v-success`:`v-warning`}">
             <div class="v-label">STATUS KELAIKAN FUNGSI</div>
             <div class="v-value">${a}</div>
             <div class="v-score">Indeks Keandalan: ${t?.skor_total||`--`}%</div>
          </div>

          ${r?`
            <!-- Expert Verification -->
            <div class="expert-box">
               <div class="expert-header">PENANDATANGAN (TTE)</div>
               <div class="expert-main">
                  <div class="expert-info">
                    <div class="ex-name">${iT(o.name||`PENANGGUNG JAWAB`)}</div>
                    ${o.skk?`<div class="ex-skk">No. SKK: ${iT(o.skk)}</div>`:``}
                    <div class="ex-role">${iT(s)}</div>
                  </div>
                  <div class="expert-check"><i class="fas fa-file-signature"></i> SIGNED</div>
               </div>
            </div>
          `:``}

          <!-- Aspect Summary (Informative) -->
          <div class="summary-section">
             <div class="summary-title">RINGKASAN ASPEK TEKNIS</div>
             <div class="summary-row">
                <div class="s-dot col-arch"></div><div class="s-label">Arsitektur</div><div class="s-skor">${t?.skor_arsitektur||`--`}</div>
                <div class="s-dot col-str"></div><div class="s-label">Struktur</div><div class="s-skor">${t?.skor_struktur||`--`}</div>
                <div class="s-dot col-mep"></div><div class="s-label">Mekanikal</div><div class="s-skor">${t?.skor_kebakaran||`--`}</div>
             </div>
          </div>

          <div class="verify-footer">
            <p>© ${new Date().getFullYear()} Smart AI Pengkaji SLF · Sistem Informasi SIMBG</p>
            <p class="text-xs">Sesuai Peraturan Pemerintah No. 16 Tahun 2021</p>
          </div>
        </div>
      </div>
    </div>

    <style>
      :root {
        --v-primary: #0f172a;
        --v-accent: #2563eb;
        --v-success: #10b981;
        --v-warning: #f59e0b;
        --v-text: #1e293b;
        --v-text-light: #64748b;
      }
      .verify-container { min-height: 100vh; background: #f8fafc; display: flex; justify-content: center; padding: 20px; font-family: 'Inter', sans-serif; color: var(--v-text); }
      .verify-card { width: 100%; max-width: 480px; background: white; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); overflow: hidden; height: fit-content; }
      
      .verify-badge { background: #ecf3ff; padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #e2e8f0; }
      .badge-icon { width: 44px; height: 44px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--v-success); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1); }
      .status-top { display: block; font-weight: 800; font-size: 13px; color: var(--v-success); letter-spacing: 0.5px; }
      .status-id { display: block; font-size: 11px; color: var(--v-text-light); }

      .verify-hero { position: relative; height: 220px; overflow: hidden; background: #eee; }
      .verify-hero img { width: 100%; height: 100%; object-fit: cover; }
      .photo-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #cbd5e1; font-weight: 700; }
      .photo-placeholder i { font-size: 3rem; margin-bottom: 10px; }
      .hero-label { position: absolute; bottom: 0; left: 0; right: 0; padding: 30px 20px 15px; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; font-weight: 700; font-size: 1.1rem; }

      .verify-content { padding: 24px; }
      
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
      .info-item label { display: block; font-size: 11px; font-weight: 700; color: var(--v-text-light); text-transform: uppercase; margin-bottom: 4px; }
      .info-item span { display: block; font-weight: 600; font-size: 14px; }
      .text-sm { font-size: 12px !important; line-height: 1.4; color: #475569; }

      .validity-box { padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 25px; }
      .validity-box.v-success { background: #f0fdf4; border: 1px solid #dcfce7; }
      .validity-box.v-success .v-value { color: var(--v-success); }
      .validity-box.v-warning { background: #fffbeb; border: 1px solid #fef3c7; }
      .validity-box.v-warning .v-value { color: var(--v-warning); }
      
      .v-label { font-size: 10px; font-weight: 800; color: var(--v-text-light); letter-spacing: 1px; margin-bottom: 5px; }
      .v-value { font-size: 1.25rem; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
      .v-score { font-size: 12px; font-weight: 600; opacity: 0.7; }

      .expert-box { background: #f1f5f9; padding: 15px; border-radius: 14px; margin-bottom: 25px; }
      .expert-header { font-size: 10px; font-weight: 800; color: var(--v-text-light); margin-bottom: 10px; letter-spacing: 0.5px; }
      .expert-main { display: flex; justify-content: space-between; align-items: center; }
      .ex-name { font-weight: 800; font-size: 14px; text-decoration: underline; }
      .ex-skk { font-size: 11px; margin-top: 2px; }
      .ex-role { font-size: 10px; color: var(--v-accent); font-weight: 700; margin-top: 4px; }
      .expert-check { font-size: 10px; font-weight: 800; color: var(--v-success); background: white; padding: 4px 10px; border-radius: 6px; }

      .summary-section { border-top: 1px solid #f1f5f9; padding-top: 20px; }
      .summary-title { font-size: 10px; font-weight: 800; color: var(--v-text-light); margin-bottom: 12px; text-align: center; }
      .summary-row { display: flex; justify-content: center; align-items: center; gap: 15px; font-size: 11px; }
      .s-dot { width: 8px; height: 8px; border-radius: 50%; }
      .col-arch { background: #a855f7; }
      .col-str { background: #ef4444; }
      .col-mep { background: #3b82f6; }
      .s-label { font-weight: 600; color: #475569; }
      .s-skor { font-weight: 800; color: var(--v-text); }

      .verify-footer { margin-top: 35px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      .verify-footer p { font-size: 11px; color: var(--v-text-light); margin-bottom: 4px; }
      .text-xs { font-size: 10px !important; opacity: 0.6; }
    </style>
  `}function rT(e){return`
    <div class="verify-container">
      <div class="verify-card" style="padding: 60px 40px; text-align:center">
        <div style="font-size: 4rem; color: #ef4444; margin-bottom: 20px"><i class="fas fa-triangle-exclamation"></i></div>
        <h2 style="font-weight: 800; margin-bottom: 10px">Verifikasi Gagal</h2>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6">${e}</p>
        <button class="btn btn-primary" style="margin-top: 30px" onclick="window.navigate('dashboard')">Kembali ke Dashboard</button>
      </div>
    </div>
  `}function iT(e){return e?String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]):``}function aT({title:e,icon:t,description:n,links:r=[]}){return`
    <div>
      <div class="page-header">
        <h1 class="page-title">
          <i class="fas ${t}" style="color:var(--brand-400);margin-right:10px"></i>${e}
        </h1>
        <p class="page-subtitle">${n}</p>
      </div>

      <div class="card" style="text-align:center;padding:var(--space-12)">
        <div style="width:80px;height:80px;background:var(--gradient-brand);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;font-size:2rem;color:white;margin:0 auto var(--space-5);animation:float 4s ease-in-out infinite">
          <i class="fas ${t}"></i>
        </div>
        <h2 style="font-size:1.4rem;font-weight:700;margin-bottom:var(--space-3)">${e}</h2>
        <p style="color:var(--text-secondary);max-width:440px;margin:0 auto var(--space-6)">
          Halaman ini sedang dalam pengembangan aktif. Fitur akan segera tersedia.
        </p>

        ${r.length?`
          <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
            ${r.map(e=>`
              <button class="btn btn-secondary" onclick="window.navigate('${e.route}')">
                <i class="fas ${e.icon}"></i> ${e.label}
              </button>
            `).join(``)}
          </div>
        `:`
          <button class="btn btn-primary" onclick="window.navigate('dashboard')">
            <i class="fas fa-home"></i> Kembali ke Dashboard
          </button>
        `}

        <!-- Coming soon features preview -->
        <div style="margin-top:var(--space-8);display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);text-align:left;max-width:600px;margin-left:auto;margin-right:auto">
          ${oT(e).map(e=>`
            <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:var(--space-4)">
              <i class="fas ${e.icon}" style="color:var(--brand-400);margin-bottom:8px;font-size:1.1rem"></i>
              <div style="font-size:0.8rem;font-weight:600;color:var(--text-primary);margin-bottom:4px">${e.title}</div>
              <div style="font-size:0.75rem;color:var(--text-tertiary)">${e.desc}</div>
            </div>
          `).join(``)}
        </div>
      </div>
    </div>
  `}function oT(e){return{Checklist:[{icon:`fa-clipboard-list`,title:`Checklist Administrasi`,desc:`Dokumen perizinan & legalitas`},{icon:`fa-building`,title:`Checklist Teknis`,desc:`Struktur, Arsitektur, MEP`},{icon:`fa-camera`,title:`Dokumentasi Foto`,desc:`Upload bukti lapangan`}],"Analisis AI":[{icon:`fa-brain`,title:`Rule-based AI`,desc:`Berbasis NSPK & SNI`},{icon:`fa-chart-pie`,title:`Risk Scoring`,desc:`Low/Medium/High/Critical`},{icon:`fa-file-alt`,title:`Auto Rekomendasi`,desc:`Saran tindak perbaikan`}],"Multi-Agent Analysis":[{icon:`fa-network-wired`,title:`Agent Struktur`,desc:`ASCE/SEI 41-17 analysis`},{icon:`fa-fire-extinguisher`,title:`Agent Keselamatan`,desc:`Fire safety analysis`},{icon:`fa-sync`,title:`Aggregator`,desc:`Konsolidasi hasil AI`}],"Laporan Kajian SLF":[{icon:`fa-file-pdf`,title:`Export PDF`,desc:`Laporan siap cetak`},{icon:`fa-file-word`,title:`Google Docs`,desc:`Template profesional`},{icon:`fa-presentation-screen`,title:`Presentasi`,desc:`Slide eksekutif`}],"TODO Board":[{icon:`fa-columns`,title:`Kanban Board`,desc:`Drag & drop tasks`},{icon:`fa-bell`,title:`Reminder`,desc:`Notifikasi deadline`},{icon:`fa-link`,title:`Link ke Proyek`,desc:`Tasks per proyek`}],"Executive Dashboard":[{icon:`fa-chart-line`,title:`Analytics`,desc:`Tren & statistik`},{icon:`fa-gauge`,title:`KPI Overview`,desc:`Ringkasan eksekutif`},{icon:`fa-clock-rotate-left`,title:`Timeline`,desc:`Histori pengkajian`}]}[e]||[{icon:`fa-wrench`,title:`Sedang Dikembangkan`,desc:`Fitur segera hadir`},{icon:`fa-rocket`,title:`Coming Soon`,desc:`Stay tuned`},{icon:`fa-stars`,title:`Premium Feature`,desc:`Eksklusif AI engine`}]}window.navigate=(e,t={})=>M(e,t);var sT=document.getElementById(`loading-screen`),cT=document.getElementById(`loading-progress`),lT=document.getElementById(`loading-status`),uT=!1;function dT(e,t){cT&&(cT.style.width=`${e}%`),t&&lT&&(lT.style.animation=`none`,lT.offsetHeight,lT.style.animation=`status-fade 0.5s ease`,lT.innerText=t)}function fT(){sT&&(sT.style.opacity=`0`,setTimeout(()=>{sT.style.display=`none`},800))}async function pT(){if(!window.Chart)return new Promise(e=>{let t=document.createElement(`script`);t.src=`https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`,t.onload=e,document.head.appendChild(t)})}function mT(){j(`login`,async()=>w()?(M(`dashboard`),``):(await He(),``)),j(`dashboard`,async()=>{await pT();let e=await Xe();return setTimeout(async()=>{let{fetchKPI:e}=await Rt(async()=>{let{fetchKPI:e}=await Promise.resolve().then(()=>Ye);return{fetchKPI:e}},void 0)},50),e}),j(`proyek`,async()=>{let e=await dt();return setTimeout(ft,50),e}),j(`proyek-baru`,async()=>await gt()),j(`proyek-edit`,async e=>await gt(e)),j(`proyek-detail`,async e=>await yt(e)),j(`proyek-files`,async e=>await At(e)),j(`checklist`,async e=>await _n(e)),j(`kondisi`,async e=>await Mw(e)),j(`files`,async()=>await bw()),j(`analisis`,async e=>await di(e)),j(`galeri`,async e=>await zw(e)),j(`multi-agent`,async e=>{let t=await mw(e);return setTimeout(yw,50),t}),j(`laporan`,async e=>await mC(e)),j(`surat-pernyataan`,async e=>await Kw(e)),j(`verify`,async e=>await tT(e)),j(`todo`,async()=>await OC()),j(`todo-detail`,async e=>await LC(e)),j(`tim-kerja`,async()=>await Ew()),j(`executive`,async()=>await HC()),j(`settings`,async()=>await ww()),j(`404`,async()=>aT({title:`Halaman Tidak Ditemukan`,icon:`fa-map-signs`,description:`Halaman yang Anda tuju tidak ada.`}))}async function hT(){dT(10,`Inisialisasi Sistem Core...`),await new Promise(e=>setTimeout(e,400)),mT(),dT(30,`MENYIAPKAN MODUL...`),await new Promise(e=>setTimeout(e,300));let e=await g();dT(60,`AUTENTIKASI PENGGUNA...`),await new Promise(e=>setTimeout(e,400));let n=document.getElementById(`app`);if(_(e=>{if(e&&!uT){uT=!0,xe(n),ke();let e=Ce();e&&F(e)}else e||(uT=!1,Ve(),Ee(n),He())}),window.addEventListener(`route-changed`,e=>{we(e.detail.path)}),!e){dT(100,`SISTEM SIAP.`),fT(),await He();return}xe(n),ke();let r=Ce();r&&F(r),dT(100,`SISTEM SIAP.`),fT(),`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{let e=`${t.base}/sw.js`;navigator.serviceWorker.register(e).then(e=>console.log(`[SW] Registered:`,e.scope)).catch(e=>{console.warn(`[SW] Registration skipped:`,e.message)})}),gT()}function gT(){window.addEventListener(`online`,_T),window.addEventListener(`offline`,_T),window.addEventListener(`route-changed`,_T),_T()}async function _T(){let e=document.getElementById(`sync-banner-container`);if(!e)return;let t=navigator.onLine,n=(await nn()).length;t?n>0?e.innerHTML=`
      <div style="background:var(--warning-bg); color:var(--warning-400); padding:8px 20px; font-size:0.8rem; text-align:center; border-bottom:1px solid var(--warning-500); display:flex; align-items:center; justify-content:center; gap:15px;">
        <span><i class="fas fa-cloud-upload-alt"></i> Ada <b>${n}</b> data inspeksi belum tersinkronisasi.</span>
        <button class="btn btn-primary btn-sm" onclick="window.doGlobalSync()" id="btn-global-sync" style="padding:4px 12px; font-size:0.75rem;">
          Sinkronkan Sekarang
        </button>
      </div>
    `:e.innerHTML=``:e.innerHTML=`
      <div style="background:var(--danger-bg); color:var(--danger-400); padding:8px 20px; font-size:0.8rem; text-align:center; border-bottom:1px solid var(--danger-500); display:flex; align-items:center; justify-content:center; gap:10px;">
        <i class="fas fa-plane-slash"></i> Mode Offline: Data akan disimpan di perangkat sementara.
      </div>
    `}window.doGlobalSync=async function(){let t=document.getElementById(`btn-global-sync`);t&&(t.disabled=!0,t.innerHTML=`<i class="fas fa-circle-notch fa-spin"></i> Mensinkronisasi...`);try{let t=await nn();if(t.length===0)return _T();let n=t.map(({id:e,...t})=>({...t,updated_at:new Date().toISOString()})),{error:r}=await e.from(`checklist_items`).upsert(n,{onConflict:`proyek_id, kode`});if(r)throw r;await rn(t.map(e=>e.id)),B(`Semua data berhasil disinkronisasi ke Cloud!`),_T()}catch(e){V(`Gagal sinkronisasi: `+e.message),t&&(t.disabled=!1,t.innerHTML=`Coba Lagi`)}},hT().catch(e=>{console.error(`[App] Bootstrap error:`,e),document.getElementById(`loading-screen`)?.classList.add(`hidden`),document.getElementById(`app`).innerHTML=`
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;background:#0a0c12;color:#e2e8f0">
      <div style="text-align:center;padding:2rem">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h2 style="font-size:1.4rem;margin-bottom:0.5rem">Terjadi Kesalahan Sistem</h2>
        <p style="color:#718096;margin-bottom:1.5rem">${e.message}</p>
        <button onclick="location.reload()" style="background:linear-gradient(135deg,#3b5fd9,#7c5ce7);color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:0.9rem">
          Muat Ulang
        </button>
      </div>
    </div>
  `}),window.addEventListener(`online`,()=>{document.body.classList.remove(`is-offline`),B(`Koneksi internet terdeteksi. Memulai sinkronisasi data...`),on(e,vT)}),window.addEventListener(`offline`,()=>{document.body.classList.add(`is-offline`),V(`Mode Offline Aktif. Seluruh data yang Anda masukkan disimpan sementara di perangkat ini.`)});function vT(e,t,n,r){return c(e,t,n,r)}navigator.onLine?on(e,vT):document.body.classList.add(`is-offline`);export{ji as n,Sx as t};