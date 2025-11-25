# Componente Table Layout

## Descripción

El componente `table-layout` es una solución reutilizable que maneja la altura de las tablas y mantiene la paginación siempre visible en el fondo de la pantalla. Este componente está diseñado para funcionar perfectamente en pantallas de administración y cualquier otra vista que requiera tablas con altura controlada.

## Características

✅ **Altura automática**: La tabla se ajusta al espacio disponible en el viewport  
✅ **Paginación fija**: La paginación siempre permanece visible en la parte inferior  
✅ **Scroll independiente**: La tabla tiene scroll vertical propio sin afectar la paginación  
✅ **Responsive**: Se adapta a diferentes tamaños de pantalla  
✅ **Reutilizable**: Se puede usar en cualquier pantalla que necesite tablas  
✅ **Variantes**: Incluye variantes para diferentes alturas máximas  

## Estructura HTML Requerida

```html
<div class="table-layout">
    <!-- Sección de búsqueda (opcional) -->
    <div class="table-layout-search">
        <div class="table-search">
            <span class="material-symbols-outlined table-search-icon">search</span>
            <input type="search" placeholder="Buscar...">
        </div>
    </div>
    
    <!-- Contenido de la tabla (obligatorio) -->
    <div class="table-layout-content">
        <div class="table-container">
            <table class="table">
                <!-- Contenido de la tabla -->
            </table>
        </div>
    </div>
    
    <!-- Footer con paginación (opcional) -->
    <div class="table-layout-footer">
        <nav class="table-pagination" aria-label="Paginación de tabla">
            <!-- Controles de paginación -->
        </nav>
    </div>
</div>
```

## Uso Básico

### 1. Importar el CSS

Agrega el archivo CSS en el `<head>` de tu HTML:

```html
<link rel="stylesheet" href="../../../styles/components/table-layout.css">
```

### 2. Estructura del Main Container

El contenedor principal debe tener flexbox configurado:

```html
<main>
    <div class="title">
        <h1>Título de la Página</h1>
        <!-- Botones de acción -->
    </div>
    
    <!-- Aquí va el table-layout -->
    <div class="table-layout">
        <!-- ... -->
    </div>
</main>
```

### 3. CSS del Main Container

Para que funcione correctamente en layouts de admin:

```css
.admin-main > main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: var(--spL);
}

.admin-main > main > .table-layout {
    flex: 1;
    min-height: 0;
}
```

## Variantes

### Altura Máxima Fija

Puedes limitar la altura máxima de la tabla usando las clases de variante:

```html
<!-- Pequeña: 300px -->
<div class="table-layout table-layout-fixed-sm">
    <!-- ... -->
</div>

<!-- Mediana: 400px -->
<div class="table-layout table-layout-fixed-md">
    <!-- ... -->
</div>

<!-- Grande: 500px -->
<div class="table-layout table-layout-fixed-lg">
    <!-- ... -->
</div>

<!-- Extra Grande: 600px -->
<div class="table-layout table-layout-fixed-xl">
    <!-- ... -->
</div>
```

### Variante Compacta

Para tablas más compactas con menos altura mínima:

```html
<div class="table-layout table-layout-compact">
    <!-- ... -->
</div>
```

## Ejemplos de Uso

### Ejemplo Completo - Página de Administradores

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Estilos necesarios -->
    <link rel="stylesheet" href="../../../styles/styles.css">
    <link rel="stylesheet" href="../../../styles/components/table.css">
    <link rel="stylesheet" href="../../../styles/components/table-layout.css">
    <link rel="stylesheet" href="../../../styles/pages/admin/layout.css">
    
    <title>Administradores</title>
</head>
<body>
    <main class="admin-content">
        <aside class="sidebar admin-sidebar">
            <!-- Sidebar content -->
        </aside>
        
        <section class="admin-main">
            <header class="header-logged">
                <!-- Header content -->
            </header>
            
            <main>
                <div class="title">
                    <h1>Lista de Administradores</h1>
                    <button class="btn btn-primary">
                        <span>Agregar</span>
                    </button>
                </div>
                
                <div class="table-layout">
                    <div class="table-layout-search">
                        <div class="table-search">
                            <span class="material-symbols-outlined table-search-icon">search</span>
                            <input type="search" placeholder="Buscar...">
                        </div>
                    </div>
                    
                    <div class="table-layout-content">
                        <div class="table-container">
                            <table class="table">
                                <thead class="table-header">
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Correo</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>John Doe</td>
                                        <td>john@example.com</td>
                                        <td>
                                            <span class="status-badge status-active">Activo</span>
                                        </td>
                                        <td>
                                            <div class="table-actions">
                                                <a href="#" class="table-link">Editar</a>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- Más filas... -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-layout-footer">
                        <nav class="table-pagination" aria-label="Paginación">
                            <span class="table-pagination-info">
                                Mostrando <span>1-10</span> de <span>100</span>
                            </span>
                            <div class="table-pagination-controls">
                                <button class="table-pagination-btn" disabled>Anterior</button>
                                <button class="table-pagination-btn active">1</button>
                                <button class="table-pagination-btn">2</button>
                                <button class="table-pagination-btn">Siguiente</button>
                            </div>
                        </nav>
                    </div>
                </div>
            </main>
        </section>
    </main>
</body>
</html>
```

## Compatibilidad

### Navegadores Soportados
- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 991px
- Desktop: ≥ 992px

## Solución de Problemas

### La tabla no ocupa toda la altura disponible

Asegúrate de que:
1. El contenedor padre tenga `display: flex` y `flex-direction: column`
2. El `table-layout` tenga `flex: 1`
3. Haya un `min-height: 0` en el contenedor de la tabla

```css
.admin-main > main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.admin-main > main > .table-layout {
    flex: 1;
    min-height: 0; /* Importante! */
}
```

### La paginación no se queda al fondo

Verifica que:
1. La estructura HTML esté completa con las tres secciones: search, content, footer
2. El `table-layout` tenga `height: 100%` o `flex: 1`
3. No haya márgenes externos que afecten el layout

### El scroll no funciona correctamente

Comprueba que:
1. `table-layout-content` tenga `overflow: hidden`
2. `table-container` tenga `overflow-y: auto`
3. No haya conflictos con otros estilos de overflow en padres

## Archivos Relacionados

- **CSS Component**: `src/public/styles/components/table-layout.css`
- **CSS Table**: `src/public/styles/components/table.css`
- **CSS Admin Layout**: `src/public/styles/pages/admin/layout.css`

## Ejemplos en el Proyecto

- ✅ `src/public/pages/admin/users/admins.html` - Implementación completa
- ✅ `src/public/pages/admin/users/users.html` - Implementación completa

## Notas Adicionales

- Este componente funciona mejor en layouts tipo dashboard con sidebar
- No requiere JavaScript para funcionar
- Es compatible con todos los estilos de tabla existentes
- Puede combinarse con otras clases de tabla como `table-striped`, `table-bordered`, etc.

## Autor

Danny Marcelo Dávila Barrancos

## Última Actualización

25 de noviembre de 2025
