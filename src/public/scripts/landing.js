async function getLandingData() {
    try {
        const response = await fetch('api/welcome');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        renderCategories(data.extraData.categories);
        //renderProjects(data.data.projects);
    } catch (error) {
        console.error('No se pudo obtener la data:', error);
        showLoadError(error);
    }
};

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

function renderProjects(projects) {
    const list = document.querySelector('.project-list');
    if (!list) return;
    list.innerHTML = '';

    if (!projects.length) {
        list.innerHTML = '<li class="project-item">No hay proyectos disponibles.</li>';
        return;
    }

    for (const proj of projects) {
        const item = document.createElement('li');
        item.className = 'project-card';
        
        const percentage = Math.min(100, Math.round((proj.raised_amount / proj.goal_amount) * 100));
        
        item.innerHTML = `
            <div class="project-image-container">
                <img src="${proj.cover_image_url || 'https://via.placeholder.com/400x200'}" alt="${proj.title}" />
                <button class="project-fav" aria-label="Agregar a favoritos">
                    <span class="material-symbols-outlined">favorite_border</span>
                </button>
            </div>
            <div class="project-details">
                <h3 class="project-title">${proj.title}</h3>
                <p class="project-description">${proj.description}</p>
            </div>
            <div class="project-statistics">
                <div class="progress-info">
                    <span class="goal-percentage">${percentage}%</span>
                    <span class="raised-amount">$${proj.raised_amount.toLocaleString()}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
                <span class="project-goal">Meta: $${proj.goal_amount.toLocaleString()}</span>
            </div>
        `;
        list.appendChild(item);
    };
}


function showLoadError(err) {
  const categoryList = document.querySelector('.category-list');
  if (!categoryList) return;
  categoryList.innerHTML = `<li class="category-item">Error cargando categorías.</li>`;

  const projectList = document.querySelector('.project-list');
    if (!projectList) return;
    projectList.innerHTML = `<li class="project-item">Error cargando proyectos.</li>`;
}

if (document.readyState === 'loading') {
  await new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', resolve, { once: true });
  });
}
await getLandingData();