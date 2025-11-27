# Guía de Uso: Sistema de Subdirectorios para Imágenes

## Descripción General

El sistema de carga de imágenes ahora organiza automáticamente las imágenes en subdirectorios según su tipo.

## Estructura de Directorios

```
/uploads/
├── avatar/          # Imágenes de perfil de usuarios
├── projects/        # Imágenes de proyectos
└── (raíz)          # Imágenes generales/sin clasificar
```

## Cómo Usar

### 1. Subir Imagen de Avatar/Perfil

**Formulario HTML:**
```html
<form id="uploadAvatarForm" enctype="multipart/form-data">
    <input type="file" name="file" accept="image/*" required>
    <input type="hidden" name="imageType" value="avatar">
    <button type="submit">Subir Avatar</button>
</form>
```

**JavaScript (usando FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('imageType', 'avatar');  // ← IMPORTANTE: Especifica el tipo
formData.append('altText', 'Foto de perfil');

const response = await fetch('/api/image', {
    method: 'POST',
    body: formData
});
```

**Resultado:** La imagen se guardará en `/uploads/avatar/1234567890.jpg`

---

### 2. Subir Imagen de Proyecto

**JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('imageType', 'project');  // ← Cambia a 'project'
formData.append('altText', 'Imagen del proyecto');

const response = await fetch('/api/image', {
    method: 'POST',
    body: formData
});
```

**Resultado:** La imagen se guardará en `/uploads/projects/9876543210.jpg`

---

### 3. Subir Imagen General (sin subdirectorio)

**JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
// NO especifiques imageType, o usa 'general'
formData.append('altText', 'Imagen general');

const response = await fetch('/api/image', {
    method: 'POST',
    body: formData
});
```

**Resultado:** La imagen se guardará en `/uploads/1111222333.jpg`

---

## Tipos de Imagen Válidos

| `imageType` | Subdirectorio | Uso recomendado |
|-------------|---------------|-----------------|
| `avatar` | `/avatar/` | Fotos de perfil de usuarios |
| `profile` | `/avatar/` | Alias de avatar |
| `project` | `/projects/` | Imágenes de proyectos de crowdfunding |
| `general` | `/` (raíz) | Imágenes sin categoría específica |
| _(vacío)_ | `/` (raíz) | Por defecto si no se especifica |

---

## Respuesta del Servidor

**Éxito (201):**
```json
{
    "success": true,
    "imageId": "uuid-de-la-imagen",
    "message": "Imagen subida exitosamente",
    "data": {
        "id": "uuid-de-la-imagen",
        "fileName": "1234567890.jpg",
        "url": "/api/image/uuid-de-la-imagen"
    }
}
```

**Error (400):**
```json
{
    "error": "No se proporcionó ningún archivo"
}
```

---

## Ejemplo Completo: Formulario de Registro de Usuario

```html
<form id="registerForm">
    <input type="text" name="firstName" placeholder="Nombre" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="password" name="password" placeholder="Contraseña" required>
    
    <!-- Campo de imagen de perfil -->
    <input type="file" id="profileImage" accept="image/*">
    
    <button type="submit">Registrarse</button>
</form>

<script>
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Subir imagen de perfil primero
    let profileImageId = null;
    const fileInput = document.getElementById('profileImage');
    
    if (fileInput.files[0]) {
        const imageFormData = new FormData();
        imageFormData.append('file', fileInput.files[0]);
        imageFormData.append('imageType', 'avatar');  // ← Se guarda en /avatar/
        
        const imageResponse = await fetch('/api/image', {
            method: 'POST',
            body: imageFormData
        });
        
        const imageData = await imageResponse.json();
        profileImageId = imageData.imageId;
    }
    
    // 2. Registrar usuario con la imagen
    const userData = {
        firstName: e.target.firstName.value,
        email: e.target.email.value,
        password: e.target.password.value,
        profileImageId: profileImageId  // ← UUID de la imagen
    };
    
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    if (response.ok) {
        alert('Usuario registrado exitosamente');
    }
});
</script>
```

---

## Agregar Nuevos Subdirectorios

Para agregar un nuevo tipo de imagen (por ejemplo, `banners`):

1. **Editar:** `src/routes/imageRouter.js`
```javascript
// Línea ~21
ensureDirectoryExists(path.join(uploadDirectory, 'banners'));

// Línea ~30-35
if (imageType === 'avatar' || imageType === 'profile') {
    subDir = 'avatar';
} else if (imageType === 'project') {
    subDir = 'projects';
} else if (imageType === 'banner') {  // ← AGREGAR AQUÍ
    subDir = 'banners';
}
```

2. **Reiniciar** el servidor

3. **Usar:**
```javascript
formData.append('imageType', 'banner');
// → Se guardará en /uploads/banners/
```

---

## Notas Importantes

- ✅ Los subdirectorios se crean automáticamente si no existen
- ✅ Las rutas en la base de datos se guardan como `/uploads/avatar/...` (relativas)
- ✅ El servidor puede leer archivos de cualquier subdirectorio automáticamente
- ⚠️ El parámetro `imageType` debe enviarse en el body o query del request
- ⚠️ Los tipos de archivo permitidos: JPEG, PNG, GIF, WEBP
- ⚠️ Tamaño máximo: 5 MB por imagen
