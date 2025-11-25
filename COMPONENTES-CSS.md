# 📚 Guía de Componentes CSS - AportaYa

Esta guía te muestra cómo usar los componentes CSS creados en tus páginas HTML de manera tradicional.

---

## 📦 Componentes Disponibles

1. **buttons.css** - Botones del sistema
2. **forms.css** - Formularios e inputs
3. **chips.css** - Chips y badges
4. **progress.css** - Barras de progreso
5. **animations.css** - Animaciones (estrellas, loaders, etc.)
6. **cards.css** - Tarjetas de contenido
7. **table.css** - Tablas de datos
8. **table-layout.css** - Layout de tablas con altura fija y paginación (Nuevo ✨)

---

## 🔗 Cómo Vincularlos en HTML

### Estructura Básica
```html
<head>
    <!-- 1. Siempre primero: Variables globales y reset -->
    <link rel="stylesheet" href="../../styles/styles.css">
    <link rel="stylesheet" href="../../styles/fonts.css">
    
    <!-- 2. Componentes (según necesites) -->
    <link rel="stylesheet" href="../../styles/components/buttons.css">
    <link rel="stylesheet" href="../../styles/components/forms.css">
    
    <!-- 3. Layout específico -->
    <link rel="stylesheet" href="../../styles/components/header.css">
    <link rel="stylesheet" href="../../styles/components/footer.css">
    
    <!-- 4. Estilos de página (último) -->
    <link rel="stylesheet" href="../../styles/pages/auth/login.css">
</head>
```

---

## 📄 Por Página - ¿Qué Componentes Usar?

### **index.html** (Landing Page)
```html
<link rel="stylesheet" href="styles/styles.css">
<link rel="stylesheet" href="styles/fonts.css">
<link rel="stylesheet" href="styles/components/buttons.css">
<link rel="stylesheet" href="styles/components/cards.css">
<link rel="stylesheet" href="styles/components/progress.css">
<link rel="stylesheet" href="styles/components/header.css">
<link rel="stylesheet" href="styles/components/hero.css">
<link rel="stylesheet" href="styles/components/footer.css">
<link rel="stylesheet" href="styles/landing/projects.css">
<link rel="stylesheet" href="styles/landing/faq.css">
```

### **pages/auth/login.html**
```html
<link rel="stylesheet" href="../../styles/styles.css">
<link rel="stylesheet" href="../../styles/fonts.css">
<link rel="stylesheet" href="../../styles/components/buttons.css">
<link rel="stylesheet" href="../../styles/components/forms.css">
<link rel="stylesheet" href="../../styles/components/animations.css">
<link rel="stylesheet" href="../../styles/pages/auth/login.css">
```

### **pages/auth/signup.html**
```html
<link rel="stylesheet" href="../../styles/styles.css">
<link rel="stylesheet" href="../../styles/fonts.css">
<link rel="stylesheet" href="../../styles/components/buttons.css">
<link rel="stylesheet" href="../../styles/components/forms.css">
<link rel="stylesheet" href="../../styles/components/animations.css">
<link rel="stylesheet" href="../../styles/pages/auth/signup.css">
```

### **pages/projects/projects.html**
```html
<link rel="stylesheet" href="../../styles/styles.css">
<link rel="stylesheet" href="../../styles/fonts.css">
<link rel="stylesheet" href="../../styles/components/header.css">
<link rel="stylesheet" href="../../styles/components/buttons.css">
<link rel="stylesheet" href="../../styles/components/cards.css">
<link rel="stylesheet" href="../../styles/components/chips.css">
<link rel="stylesheet" href="../../styles/components/forms.css">
<link rel="stylesheet" href="../../styles/components/progress.css">
<link rel="stylesheet" href="../../styles/pages/projects.css">
```

### **pages/projects/details.html**
```html
<link rel="stylesheet" href="../../styles/styles.css">
<link rel="stylesheet" href="../../styles/fonts.css">
<link rel="stylesheet" href="../../styles/components/header.css">
<link rel="stylesheet" href="../../styles/components/footer.css">
<link rel="stylesheet" href="../../styles/components/buttons.css">
<link rel="stylesheet" href="../../styles/components/progress.css">
<link rel="stylesheet" href="../../styles/pages/project-detail.css">
```

---

## 🎨 Ejemplos de Uso

### 1️⃣ **BUTTONS** (buttons.css)

```html
<!-- Botón primario -->
<button class="btn btn-primary">Explorar proyectos</button>

<!-- Botón secundario -->
<button class="btn btn-secondary">Regístrate</button>

<!-- Botón outline -->
<button class="btn btn-outline">Más información</button>

<!-- Botón fantasma -->
<button class="btn btn-ghost">Cancelar</button>

<!-- Botón con icono -->
<button class="btn btn-primary btn-with-icon">
    <span class="material-symbols-outlined">favorite</span>
    Me gusta
</button>

<!-- Botón favorito (circular) -->
<button class="btn-favorite">
    <span class="material-symbols-outlined">favorite</span>
</button>

<!-- Tamaños -->
<button class="btn btn-primary btn-sm">Pequeño</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Grande</button>
<button class="btn btn-primary btn-xl">Extra Grande</button>

<!-- Botón ancho completo -->
<button class="btn btn-primary btn-block">Iniciar Sesión</button>
```

---

### 2️⃣ **FORMS** (forms.css)

```html
<!-- Campo de texto básico -->
<div class="form-field">
    <label class="form-label-text">Email</label>
    <input type="email" class="form-input" placeholder="tu@email.com">
</div>

<!-- Campo con error -->
<div class="form-field">
    <input type="email" class="form-input error" placeholder="Email inválido">
    <span class="form-error-text">
        <span class="material-symbols-outlined">error</span>
        Email no válido
    </span>
</div>

<!-- Campo con éxito -->
<div class="form-field">
    <input type="text" class="form-input success">
    <span class="form-success-text">✓ Campo válido</span>
</div>

<!-- Campos en fila -->
<div class="form-row">
    <input type="text" class="form-input" placeholder="Nombre">
    <input type="text" class="form-input" placeholder="Apellido">
</div>

<!-- Select -->
<select class="form-select">
    <option value="">Selecciona categoría</option>
    <option value="1">Educación</option>
    <option value="2">Salud</option>
</select>

<!-- Campo de búsqueda -->
<div class="search-wrapper">
    <span class="material-symbols-outlined search-icon">search</span>
    <input type="search" class="search-input" placeholder="Buscar proyectos">
</div>

<!-- Password con toggle -->
<div class="password-field">
    <input type="password" class="password-input form-input" id="password">
    <button type="button" class="password-toggle" data-toggle="password">
        <span class="material-symbols-outlined">visibility</span>
    </button>
</div>

<!-- Textarea -->
<textarea class="form-textarea" placeholder="Descripción..."></textarea>

<!-- Checkbox -->
<label class="form-checkbox">
    <input type="checkbox">
    <span>Acepto los términos</span>
</label>
```

---

### 3️⃣ **CHIPS/BADGES** (chips.css)

```html
<!-- Chip básico -->
<button class="chip chip-default">Tecnología</button>

<!-- Chip activo -->
<button class="chip active">Educación</button>

<!-- Chip con aria (para filtros) -->
<button class="chip" aria-pressed="false">Arte</button>
<button class="chip" aria-pressed="true">Salud</button>

<!-- Contenedor de chips -->
<div class="category-chips">
    <button class="chip chip-default">Educación</button>
    <button class="chip chip-default">Salud</button>
    <button class="chip active">Tecnología</button>
</div>

<!-- Badges de estado -->
<span class="badge badge-success">Activo</span>
<span class="badge badge-warning">Pendiente</span>
<span class="badge badge-error">Cancelado</span>
<span class="badge badge-info">En revisión</span>

<!-- Status badges para proyectos -->
<span class="status-badge status-active">ACTIVO</span>
<span class="status-badge status-pending">PENDIENTE</span>
<span class="status-badge status-completed">COMPLETADO</span>
<span class="status-badge status-cancelled">CANCELADO</span>

<!-- Chip removible -->
<span class="chip chip-removable">
    JavaScript
    <button class="chip-remove-btn">×</button>
</span>

<!-- Tamaños -->
<button class="chip chip-sm">Pequeño</button>
<button class="chip">Normal</button>
<button class="chip chip-lg">Grande</button>
```

---

### 4️⃣ **PROGRESS** (progress.css)

```html
<!-- Barra de progreso básica -->
<div class="progress-bar">
    <div class="progress-fill" style="width: 65%;"></div>
</div>

<!-- Con información -->
<div class="progress-info">
    <span class="progress-label">Financiado</span>
    <span class="progress-value">65%</span>
</div>
<div class="progress-bar">
    <div class="progress-fill" style="width: 65%;"></div>
</div>

<!-- Para proyectos (el que usas ahora) -->
<div class="progress-info">
    <span class="goal-percentage">65%</span>
    <span class="raised-amount">$6,500</span>
</div>
<div class="progress-bar">
    <div class="progress-fill" style="width: 65%;"></div>
</div>
<p class="project-goal">Meta: $10,000</p>

<!-- Tamaños -->
<div class="progress-bar progress-bar-sm">
    <div class="progress-fill" style="width: 50%;"></div>
</div>

<div class="progress-bar progress-bar-lg">
    <div class="progress-fill" style="width: 75%;"></div>
</div>

<!-- Colores -->
<div class="progress-bar progress-success">
    <div class="progress-fill" style="width: 100%;"></div>
</div>

<div class="progress-bar progress-warning">
    <div class="progress-fill" style="width: 50%;"></div>
</div>

<!-- Con gradiente -->
<div class="progress-bar progress-gradient">
    <div class="progress-fill" style="width: 60%;"></div>
</div>

<!-- Animada (stripes) -->
<div class="progress-bar progress-animated">
    <div class="progress-fill" style="width: 45%;"></div>
</div>
```

---

### 5️⃣ **CARDS** (cards.css)

```html
<!-- Card básica -->
<div class="card">
    <div class="card-header">
        <h3>Título</h3>
    </div>
    <div class="card-body">
        <p>Contenido de la tarjeta</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Acción</button>
    </div>
</div>

<!-- Project Card (la que ya usas) -->
<article class="project-card">
    <div class="project-image-wrapper">
        <img src="imagen.jpg" alt="Proyecto" class="project-image">
        <button class="btn-favorite">
            <span class="material-symbols-outlined">favorite</span>
        </button>
    </div>
    <div class="project-content">
        <h3 class="project-card-title">Título del Proyecto</h3>
        <p class="project-description">Descripción breve del proyecto...</p>
    </div>
    <div class="project-statistics">
        <div class="progress-info">
            <span class="goal-percentage">65%</span>
            <span class="raised-amount">$6,500</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 65%;"></div>
        </div>
    </div>
</article>

<!-- Card con efecto glass -->
<div class="card card-glass">
    <div class="card-body">
        <p>Card con efecto de vidrio</p>
    </div>
</div>

<!-- Card con badge -->
<div class="card">
    <span class="card-badge">Nuevo</span>
    <div class="card-body">
        <p>Contenido</p>
    </div>
</div>

<!-- Card interactiva (clickeable) -->
<div class="card card-interactive" onclick="location.href='details.html'">
    <div class="card-body">
        <p>Click me!</p>
    </div>
</div>
```

---

### 6️⃣ **ANIMATIONS** (animations.css)

```html
<!-- Estrellas (para páginas auth) -->
<div class="stars">
    <div class="star"></div>
    <div class="star"></div>
    <!-- Generar 50 estrellas con JS -->
</div>

<!-- Spinner de carga -->
<div class="spinner"></div>
<div class="spinner spinner-sm"></div>
<div class="spinner spinner-lg"></div>

<!-- Dots loader -->
<div class="dots-loader">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
</div>

<!-- Animaciones de entrada -->
<div class="fade-in">Aparezco con fade</div>
<div class="slide-down">Aparezco desde arriba</div>
<div class="slide-up">Aparezco desde abajo</div>
<div class="slide-left">Aparezco desde izquierda</div>
<div class="slide-right">Aparezco desde derecha</div>

<!-- Efectos continuos -->
<div class="pulse">Pulsando</div>
<div class="shake">Me sacudo</div>
```

---

## 💡 Tips de Uso

### ✅ **DO (Hacer)**
1. Incluir `styles.css` y `fonts.css` SIEMPRE primero
2. Incluir componentes ANTES de los estilos de página
3. Usar clases semánticas (`.btn-primary` mejor que `.button-green`)
4. Combinar clases (`.btn .btn-primary .btn-lg`)
5. Reutilizar componentes en lugar de crear nuevos estilos

### ❌ **DON'T (No Hacer)**
1. NO duplicar estilos de componentes en otros archivos
2. NO modificar archivos de componentes directamente (crear variantes)
3. NO incluir componentes que no uses en una página
4. NO usar `!important` para sobrescribir componentes

---

## 🔧 Personalización

Si necesitas una variante específica, créala en tu archivo de página:

```css
/* En tu archivo pages/mi-pagina.css */

/* Personalizar botón específico */
.btn-special {
    background: linear-gradient(90deg, var(--primary), var(--color-secondary));
    border-radius: var(--border-radius-full);
}

/* Extender componente existente */
.project-card-featured {
    border: 2px solid var(--primary);
    box-shadow: 0 0 20px rgba(17, 212, 114, 0.3);
}
```

---

## 📚 Referencias Rápidas

| Componente | Usa cuando necesites... |
|-----------|------------------------|
| **buttons.css** | Botones, acciones, favoritos |
| **forms.css** | Formularios, inputs, búsqueda, password |
| **chips.css** | Filtros, categorías, tags, estados |
| **progress.css** | Barras de progreso, financiamiento |
| **cards.css** | Tarjetas de proyectos, contenedores |
| **animations.css** | Estrellas, loaders, transiciones |
| **table.css** | Tablas de datos, listados |
| **table-layout.css** | Tablas con altura fija y paginación al fondo |

---

## 🆕 Componente Table Layout

El componente **table-layout.css** es una solución reutilizable para manejar tablas con altura controlada y paginación fija en el fondo.

### Características
✅ La tabla se ajusta automáticamente al espacio disponible  
✅ La paginación siempre permanece visible en la parte inferior  
✅ Scroll independiente en el contenido de la tabla  
✅ Totalmente responsive  

### Uso Básico

```html
<head>
    <link rel="stylesheet" href="../../styles/components/table.css">
    <link rel="stylesheet" href="../../styles/components/table-layout.css">
</head>

<body>
    <div class="table-layout">
        <!-- Búsqueda (opcional) -->
        <div class="table-layout-search">
            <div class="table-search">
                <span class="material-symbols-outlined table-search-icon">search</span>
                <input type="search" placeholder="Buscar...">
            </div>
        </div>
        
        <!-- Contenido de la tabla -->
        <div class="table-layout-content">
            <div class="table-container">
                <table class="table">
                    <!-- Contenido de la tabla -->
                </table>
            </div>
        </div>
        
        <!-- Paginación (opcional) -->
        <div class="table-layout-footer">
            <nav class="table-pagination">
                <!-- Controles de paginación -->
            </nav>
        </div>
    </div>
</body>
```

### Variantes de Altura

```html
<!-- Sin altura máxima (crece hasta llenar el espacio) -->
<div class="table-layout">...</div>

<!-- Altura máxima 300px -->
<div class="table-layout table-layout-fixed-sm">...</div>

<!-- Altura máxima 400px -->
<div class="table-layout table-layout-fixed-md">...</div>

<!-- Altura máxima 500px -->
<div class="table-layout table-layout-fixed-lg">...</div>

<!-- Altura máxima 600px -->
<div class="table-layout table-layout-fixed-xl">...</div>

<!-- Variante compacta -->
<div class="table-layout table-layout-compact">...</div>
```

### Ejemplos Implementados
- ✅ `pages/admin/users/admins.html`
- ✅ `pages/admin/users/users.html`

Para más detalles, consulta **COMPONENTE-TABLE-LAYOUT.md**

---

¿Necesitas más ejemplos? Revisa los HTML existentes que ya usan estos componentes! 🚀
