(function(){
  'use strict';

  const DEFAULT_LIST_URL = '../../json/projects/projectList.json';

  function getIdFromQuery(){
    try{
      const qs = new URLSearchParams(window.location.search);
      return qs.get('id');
    }catch(e){
      return null;
    }
  }

  function formatCurrency(value){
    if(value == null || isNaN(Number(value))) return '—';
    try{ return new Intl.NumberFormat('es-ES',{ style: 'currency', currency: 'MXN' }).format(Number(value)); }
    catch(e){ return String(value); }
  }

  function setText(id, text){
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = (text == null || text === '') ? '' : String(text);
  }

  function setDescription(id, html){
    const el = document.getElementById(id);
    if(!el) return;
    if(!html) el.innerHTML = '<p>Sin descripción disponible.</p>';
    else el.innerHTML = String(html);
  }

  function setImage(id, src, alt){
    const img = document.getElementById(id);
    if(!img) return;
    if(src) img.src = src;
    if(alt) img.alt = alt;
  }

  async function loadDetail(){
    const id = getIdFromQuery();

    if(!id){
      console.info('detail-loader: no id en query string — mostrando fallback.');
      return;
    }

    try{
      const resp = await fetch(DEFAULT_LIST_URL, { cache: 'no-cache' });
      if(!resp.ok) throw new Error('Error fetching projects list: ' + resp.status);
      const payload = await resp.json();

      const projects = (payload && payload.data && payload.data.projects) || payload.projects || [];

      const project = projects.find(p => String((p.id || p.project_id || p._id)) === String(id));
      if(!project){
        console.warn('detail-loader: proyecto no encontrado para id=', id);
        setDescription('project-description', '<p>Proyecto no encontrado.</p>');
        return;
      }

      const title = project.title || project.name || project.project_title || '';
      const cover = project.cover_image_url || project.image || project.cover || '';
      const description = project.description || project.long_description || project.summary || '';
      const category = (project.category && (project.category.name || project.category)) || project.category_name || '';
      const creator = (project.creator && (project.creator.name || project.creator)) || project.author || project.created_by || '';
      const location = project.location || project.city || project.region || '';

      const goal = Number(project.goal_amount || project.goal || project.target_amount || 0) || 0;
      const raised = Number(project.raised_amount || project.raised || project.current_amount || 0) || 0;
      const percent = goal > 0 ? Math.round((raised / goal) * 100) : 0;

      const sponsors = project.sponsors_count || project.backers_count || project.supporters || project.patrons || '';
      const daysLeft = project.days_left || project.remaining_days || project.ends_in_days || '';

      // Inyectar en DOM (ids definidos en HTML)
      setText('project-title', title);
      setImage('project-cover', cover, title || 'Portada del proyecto');
      setText('project-meta', [category, creator ? `Creado por ${creator}` : '', location].filter(Boolean).join(' · '));
      setDescription('project-description', description);

      setText('project-percent', percent ? percent + '%' : '0%');
      const fillEl = document.getElementById('project-progress-fill');
      if(fillEl) fillEl.style.width = Math.min(100, Math.max(0, percent)) + '%';

      setText('project-raised', `${formatCurrency(raised)} recaudados de ${formatCurrency(goal)}`);
      setText('project-sponsors', sponsors || '—');
      setText('project-days', daysLeft || '—');

    }catch(err){
      console.error('detail-loader error', err);
      setDescription('project-description', '<p>Error al cargar los datos del proyecto.</p>');
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadDetail);
  } else {
    loadDetail();
  }

})();