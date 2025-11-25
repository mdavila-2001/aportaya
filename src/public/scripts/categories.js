const DATA_URL = '../json/dashboard/dashboard.json';

async function loadCategories() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const categories = json?.data?.categories || [];
    renderCategories(categories);
  } catch (err) {
    console.error('No se pudieron cargar las categorías:', err);
    showLoadError(err);
  }
}

function renderCategories(categories) {
  const list = document.querySelector('.category-list');
  if (!list) return;
  list.innerHTML = '';

  if (!categories.length) {
    list.innerHTML = '<li class="category-item">No hay categorías disponibles.</li>';
    return;
  }

  for (const cat of categories) {
    const li = document.createElement('li');
    li.className = 'category-item';

    const title = document.createElement('h3');
    title.textContent = cat.name;

    li.appendChild(title);

    list.appendChild(li);
  };
}

function showLoadError(err) {
  const list = document.querySelector('.category-list');
  if (!list) return;
  list.innerHTML = `<li class="category-item">Error cargando categorías.</li>`;
}

if (document.readyState === 'loading') {
  await new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', resolve, { once: true });
  });
}
await loadCategories();
