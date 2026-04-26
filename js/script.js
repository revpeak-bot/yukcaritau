/**
 * Yuk Cari Tau — script.js
 *
 * Semua data diambil dari Worker (/api/...)
 * Tidak ada Supabase URL atau Key di sini.
 */

// ─────────────────────────────────────────
// 🌙 Dark Mode
// ─────────────────────────────────────────
const themeToggle = document.querySelector('.theme-toggle');
const savedTheme  = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
});

// ─────────────────────────────────────────
// 📱 Mobile Menu
// ─────────────────────────────────────────
const menuToggle = document.querySelector('.menu-toggle');
const mainNav    = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const isActive = mainNav.classList.toggle('active');
  const spans    = menuToggle.querySelectorAll('span');
  if (isActive) {
    spans[0].style.cssText = 'transform:translateY(6px) rotate(45deg)';
    spans[1].style.cssText = 'opacity:0;transform:scaleX(0)';
    spans[2].style.cssText = 'transform:translateY(-6px) rotate(-45deg)';
  } else {
    spans.forEach(s => s.style.cssText = '');
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.site-header')) {
    mainNav?.classList.remove('active');
    menuToggle?.querySelectorAll('span').forEach(s => s.style.cssText = '');
  }
});

// ─────────────────────────────────────────
// 📊 Progress Bar
// ─────────────────────────────────────────
const progressBar = document.getElementById('progressBar');
window.addEventListener('scroll', () => {
  if (!progressBar) return;
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  progressBar.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%';
}, { passive: true });

// ─────────────────────────────────────────
// 🔒 Helpers
// ─────────────────────────────────────────
const formatID = (d) => new Date(d).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric'
});

const calcReadTime = (html) => {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} menit baca`;
};

function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// ─────────────────────────────────────────
// 🏠 HALAMAN BERANDA
// Dipanggil dari index.html
// ─────────────────────────────────────────
async function loadHome() {
  try {
    // Fetch ke Worker — bukan langsung ke Supabase
    const res  = await fetch('/api/articles?limit=12');
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById('featured').innerHTML =
        `<p style="color:var(--text-secondary);font-family:var(--font-ui);padding:2rem 0">Belum ada artikel.</p>`;
      document.getElementById('articleGrid').innerHTML = '';
      return;
    }

    // Featured — artikel pertama
    const f = data[0];
    document.getElementById('featured').innerHTML = `
      <article class="featured-card">
        <div class="img-wrapper">
          <img src="${f.cover_image_url || '/assets/img/placeholder.jpg'}" alt="${f.title}" loading="lazy">
        </div>
        <div class="card-content">
          <span class="featured-badge">✦ Pilihan Editor</span>
          <span class="tag">${f.category}</span>
          <h2><a href="/${f.slug}">${f.title}</a></h2>
          <p class="meta">${formatID(f.published_at)}</p>
        </div>
      </article>`;

    // Grid artikel lainnya
    document.getElementById('articleGrid').innerHTML = data.slice(1).map(a => `
      <article class="card">
        <div class="img-wrapper">
          <img src="${a.cover_image_url || '/assets/img/placeholder.jpg'}" alt="${a.title}" loading="lazy">
        </div>
        <div class="card-content">
          <span class="tag">${a.category}</span>
          <h3><a href="/${a.slug}">${a.title}</a></h3>
          <p class="meta">${formatID(a.published_at)}</p>
        </div>
      </article>`).join('');

  } catch (err) {
    console.error('Gagal memuat artikel:', err);
    document.getElementById('featured').innerHTML =
      `<p style="color:var(--text-secondary);font-family:var(--font-ui)">Gagal memuat artikel.</p>`;
  }
}

// ─────────────────────────────────────────
// 📖 HALAMAN ARTIKEL
// Dipanggil dari article.html
// ─────────────────────────────────────────
async function loadArticle() {
  // Ambil slug dari URL
  // contoh: yukcaritau.my.id/cara-belajar-coding → slug = "cara-belajar-coding"
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '');

  if (!slug || slug.includes('.')) return;

  try {
    // Fetch ke Worker → Worker fetch ke Supabase
    const res  = await fetch(`/api/articles/${encodeURIComponent(slug)}`);
    const data = await res.json();

    if (res.status === 404 || data.error) {
      document.getElementById('articleContainer').innerHTML = `
        <div style="text-align:center;padding:5rem 1rem">
          <p style="font-size:3rem;margin-bottom:1rem">📭</p>
          <h2 style="font-family:var(--font-ui);font-weight:800;margin-bottom:.5rem">Artikel Tidak Ditemukan</h2>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem">
            Artikel "<strong>${slug}</strong>" tidak tersedia.
          </p>
          <a href="/" style="font-family:var(--font-ui);font-weight:700;color:var(--accent);text-decoration:underline">
            ← Kembali ke Beranda
          </a>
        </div>`;
      return;
    }

    // Update title & meta SEO
    document.title = `${data.title} | Yuk Cari Tau`;
    setMeta('og:title',       data.title);
    setMeta('og:description', data.excerpt || data.title);
    setMeta('og:image',       data.cover_image_url || '');
    setMeta('og:url',         window.location.href);

    // Canonical
    const canonical   = document.createElement('link');
    canonical.rel     = 'canonical';
    canonical.href    = window.location.href;
    document.head.appendChild(canonical);

    // Isi konten artikel
    document.getElementById('articleTitle').textContent  = data.title;
    document.getElementById('breadcrumbCat').textContent = data.category;
    document.getElementById('articleDate').textContent   = formatID(data.published_at);
    document.getElementById('readTime').textContent      = calcReadTime(data.content);

    const coverImg = document.getElementById('coverImg');
    if (data.cover_image_url) {
      coverImg.src = data.cover_image_url;
      coverImg.alt = data.title;
    } else {
      coverImg.style.display = 'none';
    }

    document.getElementById('articleBody').innerHTML = data.content;

    // Artikel terkait
    loadRelated(data.category, slug);

  } catch (err) {
    console.error('Gagal memuat artikel:', err);
  }
}

// ─────────────────────────────────────────
// 🔗 Artikel Terkait
// ─────────────────────────────────────────
async function loadRelated(category, exclude) {
  try {
    const res     = await fetch(`/api/related?category=${encodeURIComponent(category)}&exclude=${encodeURIComponent(exclude)}&limit=4`);
    const related = await res.json();

    document.getElementById('relatedList').innerHTML = related?.length
      ? related.map(r => `<li><a href="/${r.slug}">${r.title}</a></li>`).join('')
      : `<li style="color:var(--text-secondary);font-family:var(--font-ui);font-size:.9rem">Tidak ada artikel terkait.</li>`;
  } catch {
    document.getElementById('relatedList').innerHTML =
      `<li style="color:var(--text-secondary);font-family:var(--font-ui);font-size:.9rem">Gagal memuat artikel terkait.</li>`;
  }
}

// ─────────────────────────────────────────
// 🚀 Auto-init berdasarkan halaman
// ─────────────────────────────────────────
if (document.getElementById('articleGrid')) loadHome();
if (document.getElementById('articleBody')) loadArticle();

// ─────────────────────────────────────────
// 🔗 Share
// ─────────────────────────────────────────
function share(platform) {
  const url   = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.getElementById('articleTitle')?.textContent || document.title);
  const map   = {
    wa: `https://wa.me/?text=${title}%20${url}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    tw: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
  };
  if (map[platform]) window.open(map[platform], '_blank', 'noopener');
}

// ❌ Tutup iklan mobile
document.querySelector('.close-ad')?.addEventListener('click', e => {
  e.target.closest('.ad-mobile-bottom').style.display = 'none';
});
