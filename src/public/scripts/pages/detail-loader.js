(function () {
  'use strict';

  const API_BASE_URL = '/api';

  function getSlugFromQuery() {
    try {
      const qs = new URLSearchParams(window.location.search);
      return qs.get('slug');
    } catch (e) {
      return null;
    }
  }

  function formatCurrency(value) {
    if (value == null || isNaN(Number(value))) return '—';
    try {
      return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(value));
    }
    catch (e) { return String(value); }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = (text == null || text === '') ? '' : String(text);
  }

  function setDescription(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!html) el.innerHTML = '<p>Sin descripción disponible.</p>';
    else el.innerHTML = String(html);
  }

  function setImage(id, src, alt) {
    const img = document.getElementById(id);
    if (!img) return;
    if (src) img.src = src;
    if (alt) img.alt = alt;
  }

  function calculateDaysLeft(endDate) {
    if (!endDate) return null;
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diff = end - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch (e) {
      return null;
    }
  }

  async function loadDetail() {
    const slug = getSlugFromQuery();

    if (!slug) {
      setDescription('project-description', '<p>No se especificó un proyecto.</p>');
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/projects/${slug}`, {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!resp.ok) {
        if (resp.status === 404) {
          setDescription('project-description', '<p>Proyecto no encontrado.</p>');
          return;
        }
        throw new Error('Error fetching project: ' + resp.status);
      }

      const payload = await resp.json();
      const project = payload.data?.project;

      if (!project) {
        setDescription('project-description', '<p>Proyecto no encontrado.</p>');
        return;
      }

      
      const title = project.title || '';
      const cover = project.cover_image_url || '';
      const description = project.description || '';
      const category = project.category_name || '';
      const creator = project.creator_name || '';
      const location = project.location || '';

      const goal = Number(project.goal_amount || 0);
      const raised = Number(project.raised_amount || 0);
      const percent = goal > 0 ? Math.round((raised / goal) * 100) : 0;

      
      const daysLeft = calculateDaysLeft(project.end_date);

      
      const sponsors = project.sponsors_count || 0;

      
      setText('project-title', title);
      setImage('project-cover', cover, title || 'Portada del proyecto');

      const metaParts = [];
      if (category) metaParts.push(category);
      if (creator) metaParts.push(`Creado por ${creator}`);
      if (location) metaParts.push(location);
      setText('project-meta', metaParts.join(' · '));

      setDescription('project-description', description ? `<p>${description}</p>` : '<p>Sin descripción disponible.</p>');

      setText('project-percent', percent ? percent + '%' : '0%');
      const fillEl = document.getElementById('project-progress-fill');
      if (fillEl) fillEl.style.width = Math.min(100, Math.max(0, percent)) + '%';

      setText('project-raised', `${formatCurrency(raised)} recaudados de ${formatCurrency(goal)}`);
      setText('project-sponsors', sponsors || '0');
      setText('project-days', daysLeft !== null ? daysLeft : '—');

      
      document.title = `${title} - AportaYa`;

    } catch (err) {
      console.error('detail-loader error', err);
      setDescription('project-description', '<p>Error al cargar los datos del proyecto.</p>');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDetail);
  } else {
    loadDetail();
  }

})();