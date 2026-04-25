// 🔑 KREDENSIAL SUPABASE
const SUPABASE_URL = 'https://xfzqfowijriurfnheakg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmenFmb3dpanJpdXJmbmhlYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTIzMzMsImV4cCI6MjA5MDM2ODMzM30.W5r5w3duNpVMo6NgPfHLhrb7jl32ksMGTQDBfT1MbVY';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────
// 🔧 Helper: ambil slug dari URL path
// Mendukung format:
//   yukcaritau.my.id/judul-artikel        → slug = "judul-artikel"
//   yukcaritau.my.id/teknologi/judul      → slug = "judul"
// ─────────────────────────────────────────
function getSlugFromPath() {
  const parts = window.location.pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/');
  return parts[parts.length - 1] || '';
}

// ─────────────────────────────────────────
// 🌙 Dark Mode
// ─────────────────────────────────────────
const themeToggle = document.querySelector('.theme-toggle');
const saved = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
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
const mainNav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const isActive = mainNav.classList.toggle('active');
  const spans = menuToggle.querySelectorAll('span');
  if (isActive) {
    spans[0].style.cssText = 'transform: translateY(6px) rotate(45deg)';
    spans[1].style.cssText = 'opacity: 0; transform: scaleX(0)';
    spans[2].style.cssText = 'transform: translateY(-6px) rotate(-45deg)';
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
  progressBar.style.width = `${(window.scrollY / h) * 100}%`;
}, { passive: true });

// ─────────────────────────────────────────
// 🔒 Helpers
// ─────────────────────────────────────────
const formatID = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric'
});
const calcReadTime = (html) => {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} menit baca`;
};
function updateMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

// ─────────────────────────────────────────
// 🏠 HALAMAN BERANDA
// ─────────────────────────────────────────
if (document.getElementById('articleGrid')) {
  async function loadArticles() {
    const { data, error } = await db
      .from('articles')
      .select('title, slug, category, cover_image_url, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(12);

    if (error) {
      document.getElementById('featured').innerHTML =
        `<p style="color:var(--text-secondary);font-family:var(--font-ui);padding:2rem 0">Gagal memuat artikel.</p>`;
      document.getElementById('articleGrid').innerHTML = '';
      return;
    }

    if (data.length > 0) {
      const f = data[0];
      document.getElementById('featured').innerHTML = `
        <article class="featured-card">
          <div class="img-wrapper">
            <img src="${f.cover_image_url || '/placeholder.jpg'}" alt="${f.title}" loading="lazy">
          </div>
          <div class="card-content">
            <span class="featured-badge">✦ Pilihan Editor</span>
            <span class="tag">${f.category}</span>
            <h2><a href="/${f.slug}">${f.title}</a></h2>
            <p class="meta">${formatID(f.published_at)}</p>
          </div>
        </article>`;
    } else {
      document.getElementById('featured').innerHTML = '';
    }

    const grid = document.getElementById('articleGrid');
    grid.innerHTML = data.slice(1).map(a => `
      <article class="card">
        <div class="img-wrapper">
          <img src="${a.cover_image_url || '/placeholder.jpg'}" alt="${a.title}" loading="lazy">
        </div>
        <div class="card-content">
          <span class="tag">${a.category}</span>
          <h3><a href="/${a.slug}">${a.title}</a></h3>
          <p class="meta">${formatID(a.published_at)}</p>
        </div>
      </article>`).join('');
  }
  loadArticles();
}

// ─────────────────────────────────────────
// 📖 HALAMAN ARTIKEL
// URL: yukcaritau.my.id/judul-artikel
// ─────────────────────────────────────────
if (document.getElementById('articleBody')) {
  const slug = getSlugFromPath();

  async function loadArticle() {
    if (!slug || slug === 'index' || slug.includes('.')) return;

    const { data, error } = await db
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      document.getElementById('articleContainer').innerHTML = `
        <div style="text-align:center; padding:5rem 1rem;">
          <p style="font-size:3rem; margin-bottom:1rem">📭</p>
          <h2 style="font-family:var(--font-ui); font-weight:800; margin-bottom:0.5rem">Artikel Tidak Ditemukan</h2>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem">
            Artikel "<strong>${slug}</strong>" tidak tersedia atau sudah dihapus.
          </p>
          <a href="/" style="font-family:var(--font-ui); font-weight:700; color:var(--accent); text-decoration:underline;">
            ← Kembali ke Beranda
          </a>
        </div>`;
      return;
    }

    document.title = `${data.title} | Yuk Cari Tau`;
    updateMeta('og:title', data.title);
    updateMeta('og:description', data.excerpt || '');
    updateMeta('og:image', data.cover_image_url || '');
    updateMeta('og:url', window.location.href);

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href;
    document.head.appendChild(canonical);

    document.getElementById('articleTitle').textContent = data.title;
    document.getElementById('breadcrumbCat').textContent = data.category;
    document.getElementById('articleDate').textContent = formatID(data.published_at);
    document.getElementById('readTime').textContent = calcReadTime(data.content);

    const coverImg = document.getElementById('coverImg');
    if (data.cover_image_url) {
      coverImg.src = data.cover_image_url;
      coverImg.alt = data.title;
    } else {
      coverImg.style.display = 'none';
    }

    document.getElementById('articleBody').innerHTML = data.content;

    // Artikel terkait (kategori sama)
    const { data: related } = await db
      .from('articles')
      .select('title, slug')
      .eq('is_published', true)
      .eq('category', data.category)
      .neq('slug', slug)
      .limit(4);

    document.getElementById('relatedList').innerHTML =
      related?.length
        ? related.map(r => `<li><a href="/${r.slug}">${r.title}</a></li>`).join('')
        : '<li style="color:var(--text-secondary);font-family:var(--font-ui);font-size:0.9rem">Tidak ada artikel terkait.</li>';
  }
  loadArticle();
}

// ─────────────────────────────────────────
// 🔗 Share
// ─────────────────────────────────────────
function share(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.getElementById('articleTitle')?.textContent || document.title);
  const map = {
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
