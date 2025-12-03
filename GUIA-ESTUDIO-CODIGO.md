# 📚 Guía Completa de Estudio - AportaYa

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Base de Datos](#base-de-datos)
3. [Backend](#backend)
4. [Frontend](#frontend)
5. [Flujos Principales](#flujos-principales)
6. [Conceptos Clave](#conceptos-clave)
7. [Checklist de Estudio](#checklist-de-estudio)

---

## 🏗️ Arquitectura General

### Stack Tecnológico
```
┌─────────────────────────────────────────┐
│           NAVEGADOR (Cliente)           │
│  HTML5 + CSS3 + Vanilla JavaScript     │
└──────────────────┬──────────────────────┘
                   │ HTTP/HTTPS
                   │ REST API
┌──────────────────▼──────────────────────┐
│         BACKEND (Servidor)              │
│  Node.js + Express 5.1.0               │
│  Puerto: 3000                           │
└──────────────────┬──────────────────────┘
                   │ PostgreSQL Driver
                   │ Queries SQL
┌──────────────────▼──────────────────────┐
│       BASE DE DATOS                     │
│  PostgreSQL 15 Alpine                   │
│  Puerto: 5432 (interno)                 │
│  Puerto: 5433 (host)                    │
└─────────────────────────────────────────┘
```

### Patrón Arquitectónico
**MVC (Model-View-Controller) + Repository Pattern**

```
Cliente HTTP Request
    ↓
Routes (enrutamiento)
    ↓
Middleware (autenticación/autorización)
    ↓
Controllers (lógica de negocio)
    ↓
Repositories (acceso a datos)
    ↓
Base de Datos PostgreSQL
    ↓
Response JSON al Cliente
```

---

## 🗄️ Base de Datos

### Estructura de Schemas (8 esquemas)

#### 1. **users** - Gestión de Usuarios
```sql
-- Tablas principales:
users.user
  - id (PK)
  - email (UNIQUE)
  - password_hash (bcrypt)
  - first_name, middle_name, last_name, mother_last_name
  - birthdate, gender
  - email_verified (boolean)
  - profile_image_id (FK → files.image)
  - created_at, updated_at

users.user_status
  - user_id (FK)
  - status (active/inactive/suspended/deleted)
  - reason
```

**Conceptos clave:**
- **Verificación de email:** Token único generado en registro
- **Hash de contraseña:** bcrypt con salt rounds
- **Soft delete:** Cambio de status en lugar de eliminar

#### 2. **projects** - Gestión de Proyectos
```sql
projects.project
  - id (PK)
  - title
  - slug (UNIQUE, para URLs amigables)
  - summary (resumen corto)
  - description (descripción completa)
  - category_id (FK → projects.category)
  - creator_id (FK → users.user)
  - goal_amount (meta de recaudación)
  - raised_amount (monto recaudado - actualizado por trigger)
  - start_date
  - end_date
  - status (draft/pending/active/completed/cancelled/rejected)
  - cover_image_id (FK → files.image)
  - proof_document_id (FK → files.document)

projects.category
  - id (PK)
  - name (educación, salud, medio ambiente, etc.)
  - description

projects.project_image
  - project_id (FK)
  - image_id (FK)
  - display_order

projects.category_requirements
  - category_id (FK)
  - requirement_name
  - requirement_value
```

**Conceptos clave:**
- **Slug:** Generado automáticamente de title para URLs SEO-friendly
- **Estado del proyecto:** Flujo de aprobación (draft → pending → active)
- **Raised amount:** Actualizado automáticamente por trigger cuando hay donación

#### 3. **payments** - Gestión de Donaciones
```sql
payments.donation
  - id (PK)
  - project_id (FK)
  - donor_id (FK → users.user) [puede ser NULL para anónimos]
  - amount
  - currency (BOB por defecto)
  - payment_method (qr, card, bank_transfer)
  - status (pending/completed/failed/refunded)
  - donation_date
  - transaction_id (referencia externa)

payments.donation_status_history
  - donation_id (FK)
  - old_status
  - new_status
  - changed_at
```

**Conceptos clave:**
- **Donaciones anónimas:** donor_id puede ser NULL
- **Estados:** pending → completed (actualiza raised_amount del proyecto)
- **Transaction ID:** Para tracking con pasarelas de pago

#### 4. **gateway_payments** - Pasarela de Pagos QR
```sql
gateway_payments.payment
  - id (UUID PK)
  - donation_id (FK → payments.donation)
  - amount
  - currency
  - status (pending/confirmed/failed/expired)
  - qr_code_url (URL del QR generado)
  - payment_url (URL de pago)
  - success_url (redirect después de pago exitoso)
  - cancel_url (redirect si cancela)
  - expires_at
  - confirmed_at
```

**Conceptos clave:**
- **UUID:** Para identificadores únicos y seguros
- **QR Code:** Generado para pagos móviles
- **Expiración:** Pagos con tiempo límite

#### 5. **social** - Interacción Social
```sql
social.favorite
  - user_id (FK)
  - project_id (FK)
  - created_at
  - PRIMARY KEY (user_id, project_id) -- Evita duplicados

social.comment
  - id (PK)
  - project_id (FK)
  - author_id (FK → users.user)
  - content
  - created_at

social.project_update
  - id (PK)
  - project_id (FK)
  - author_id (FK)
  - title
  - content
  - created_at
```

**Conceptos clave:**
- **Composite Primary Key:** En favorites para evitar duplicados
- **Cascade delete:** Comentarios se eliminan si proyecto se elimina

#### 6. **messaging** - Sistema de Mensajería
```sql
messaging.conversation
  - id (PK)
  - created_at

messaging.conversation_participant
  - conversation_id (FK)
  - user_id (FK)
  - joined_at

messaging.message
  - id (PK)
  - conversation_id (FK)
  - sender_id (FK → users.user)
  - content
  - sent_at
  - read (boolean)
```

#### 7. **audit** - Auditoría y Logs
```sql
audit.login_attempt
  - user_id (FK)
  - success (boolean)
  - ip_address
  - attempted_at

audit.webhook_event
  - source (origen del evento)
  - event_type
  - payload (JSONB)
  - received_at
```

**Conceptos clave:**
- **JSONB:** Almacena datos flexibles de webhooks
- **Auditoría:** Track de intentos de login

#### 8. **roles** - Control de Acceso (RBAC)
```sql
roles.role
  - id (PK)
  - name (admin, user, moderator)
  - description

roles.permission
  - id (PK)
  - name (create_project, approve_project, etc.)
  - description

roles.role_permission
  - role_id (FK)
  - permission_id (FK)

roles.user_role
  - user_id (FK)
  - role_id (FK)
```

**Conceptos clave:**
- **RBAC:** Role-Based Access Control
- **Permisos granulares:** Control fino de acceso

### Funciones SQL Importantes

#### `projects.create_project()`
```sql
-- Parámetros:
p_title, p_summary, p_description, p_category_id, 
p_creator_id, p_goal_amount, p_end_date, 
p_cover_image_id, p_proof_document_id

-- Retorna: project_id
-- Crea proyecto con status 'pending' y genera slug único
```

#### `projects.update_project()`
```sql
-- Actualiza: title, summary, description, end_date
-- Solo el creador puede editar
-- Valida que end_date sea futuro
```

#### `social.toggle_favorite()`
```sql
-- Si existe el favorito → lo elimina
-- Si no existe → lo crea
-- Retorna: boolean (true si ahora es favorito)
```

### Triggers Importantes

#### `update_raised_amount_trigger`
```sql
-- Tabla: payments.donation
-- Evento: AFTER INSERT/UPDATE
-- Acción: Actualiza project.raised_amount cuando donation status = 'completed'
```

#### `updated_at_trigger`
```sql
-- Tablas: user, project, etc.
-- Evento: BEFORE UPDATE
-- Acción: Actualiza campo updated_at = NOW()
```

### Views Importantes

#### `dashboard_projects`
```sql
-- Combina: projects.project + category + creator + images
-- Incluye: goal_amount, raised_amount, days_left
-- Ordenado por: created_at DESC
```

#### `top_project_categories`
```sql
-- Agrupa proyectos por categoría
-- Cuenta cantidad de proyectos activos
-- Útil para estadísticas
```

---

## 🔧 Backend

### Estructura de Carpetas
```
src/
├── app.js                 # Punto de entrada, configuración Express
├── config/
│   └── dbConnection.js    # Pool de conexiones PostgreSQL
├── routes/                # Definición de endpoints
├── middleware/            # Autenticación y autorización
├── controllers/           # Lógica de negocio
├── repositories/          # Acceso a datos
├── services/              # Servicios auxiliares
└── utils/                 # Utilidades (JWT, bcrypt)
```

### Flujo de Request

#### 1. **Routes** - Enrutamiento
```javascript
// src/routes/projectRoutes.js
const router = express.Router();

router.get('/projects', projectController.getProjects);
router.get('/projects/:slug', projectController.getProjectBySlug);
router.post('/projects', authMiddleware, projectController.createProject);

// Parámetros de ruta: :slug, :id
// Query params: ?category=1&page=2
// Body: req.body (JSON)
```

**Tipos de rutas:**
- **Públicas:** `/api/projects` (sin autenticación)
- **Autenticadas:** `/api/user/*` (requiere JWT)
- **Admin:** `/api/admin/*` (requiere role admin)

#### 2. **Middleware** - Autenticación

##### `authMiddleware.js`
```javascript
const authMiddleware = async (req, res, next) => {
    // 1. Obtener token del header Authorization
    const token = req.headers.authorization?.split(' ')[1];
    
    // 2. Verificar token con JWT
    const decoded = verifyToken(token);
    
    // 3. Cargar usuario desde DB
    const user = await userRepository.findById(decoded.id);
    
    // 4. Adjuntar al request
    req.user = user;
    
    // 5. Continuar
    next();
};
```

**Conceptos clave:**
- **Bearer Token:** `Authorization: Bearer <token>`
- **JWT Payload:** `{ id, email, role }`
- **req.user:** Usuario disponible en controllers

##### `adminMiddleware.js`
```javascript
const adminMiddleware = async (req, res, next) => {
    // Verifica que req.user.role === 'admin'
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado' 
        });
    }
    next();
};
```

#### 3. **Controllers** - Lógica de Negocio

##### `projectController.js`
```javascript
const getProjects = async (req, res) => {
    try {
        // 1. Obtener parámetros
        const { category, search } = req.query;
        
        // 2. Llamar repository
        const projects = await projectRepository.getProjects({ category, search });
        
        // 3. Responder JSON
        res.json({
            success: true,
            data: { projects }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
```

**Patrón de respuesta:**
```javascript
// Success
{ success: true, data: {...}, message: 'Éxito' }

// Error
{ success: false, message: 'Error descriptivo' }
```

##### `authController.js` - Registro y Login
```javascript
const register = async (req, res) => {
    // 1. Hash de password con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 2. Crear usuario
    const userId = await authService.createUser(userData);
    
    // 3. Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // 4. Enviar email de verificación
    await mailService.sendVerificationEmail(email, verificationToken);
    
    // 5. Responder
    res.status(201).json({ success: true });
};

const login = async (req, res) => {
    // 1. Buscar usuario por email
    const user = await userRepository.findByEmail(email);
    
    // 2. Verificar password con bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    // 3. Generar JWT
    const token = generateToken({ id: user.id, email: user.email });
    
    // 4. Responder con token
    res.json({ success: true, data: { token, user } });
};
```

**Conceptos clave:**
- **bcrypt:** Hashing seguro de contraseñas (10 salt rounds)
- **JWT:** Token firmado con secret, expira en 24h
- **Email verification:** Token único, expira en 24h

#### 4. **Repositories** - Acceso a Datos

##### `projectRepository.js`
```javascript
const { pool } = require('../config/dbConnection');

const getProjects = async ({ category, search }) => {
    const query = `
        SELECT 
            p.*,
            c.name as category_name,
            img.file_path as cover_image_url,
            u.first_name || ' ' || u.last_name as creator_name
        FROM projects.project p
        LEFT JOIN projects.category c ON p.category_id = c.id
        LEFT JOIN files.image img ON p.cover_image_id = img.id
        LEFT JOIN users.user u ON p.creator_id = u.id
        WHERE p.status = 'active'
        ${category ? 'AND p.category_id = $1' : ''}
        ORDER BY p.created_at DESC
    `;
    
    const params = category ? [category] : [];
    const result = await pool.query(query, params);
    return result.rows;
};

const createProject = async (projectData) => {
    const query = `
        SELECT projects.create_project(
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) as project_id
    `;
    
    const result = await pool.query(query, [
        projectData.title,
        projectData.summary,
        // ... más parámetros
    ]);
    
    return result.rows[0].project_id;
};
```

**Conceptos clave:**
- **Prepared Statements:** `$1, $2` previene SQL injection
- **JOINs:** Combinar datos de múltiples tablas
- **Funciones SQL:** Llamar a `projects.create_project()`

#### 5. **Services** - Servicios Auxiliares

##### `mailService.js` - Envío de Emails
```javascript
const nodemailer = require('nodemailer');

// Configuración Ethereal (desarrollo)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
});

const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${BASE_URL}/api/verify-email/${token}`;
    
    await transporter.sendMail({
        from: '"AportaYa" <no-reply@aportaya.com>',
        to: email,
        subject: 'Verifica tu cuenta',
        html: `<a href="${verificationLink}">Verificar Email</a>`
    });
};
```

##### `authService.js` - Lógica de Autenticación
```javascript
const createUser = async (userData) => {
    // 1. Validar que email no exista
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) throw new Error('Email ya registrado');
    
    // 2. Insertar en DB
    const userId = await userRepository.create(userData);
    
    // 3. Crear token de verificación
    await userRepository.createVerificationToken(userId, token);
    
    return userId;
};
```

#### 6. **Utils** - Utilidades

##### `jwt.js` - JSON Web Tokens
```javascript
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const generateToken = (payload) => {
    return jwt.sign(payload, SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
    return jwt.verify(token, SECRET);
};
```

##### `auth.js` - Bcrypt
```javascript
const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10); // 10 salt rounds
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
```

---

## 🎨 Frontend

### Estructura de Carpetas
```
src/public/
├── index.html              # Landing page
├── pages/
│   ├── auth/              # Login, Signup
│   ├── projects/          # Proyectos públicos
│   ├── user/              # Dashboard usuario
│   └── admin/             # Panel admin
├── scripts/
│   ├── user-header.js     # Header autenticado
│   ├── pages/             # Lógica por página
│   └── utils/             # ImageUploader, etc.
└── styles/
    ├── styles.css         # Variables globales
    ├── components/        # Botones, cards, forms
    └── pages/             # Estilos específicos
```

### Sistema de Diseño

#### Variables CSS Globales
```css
:root {
    /* Colores */
    --primary: #11d472;
    --secondary: #0ea35f;
    --background: #0d0f0e;
    --card-bg: #1a2621;
    --text-light: #9db9ab;
    
    /* Espaciado */
    --spXS: 4px;
    --spS: 8px;
    --spM: 16px;
    --spL: 24px;
    --spXL: 32px;
    
    /* Breakpoints */
    --mobile: 768px;
    --tablet: 768px;
    --desktop: 992px;
}
```

#### Mobile-First Approach
```css
/* Base: Mobile (<768px) */
.container {
    width: 100%;
    padding: var(--spM);
}

/* Tablet (768px - 991px) */
@media (min-width: 768px) and (max-width: 991px) {
    .container {
        max-width: 720px;
    }
}

/* Desktop (≥992px) */
@media (min-width: 992px) {
    .container {
        max-width: 1200px;
    }
}
```

### Componentes Reutilizables

#### 1. **Botones** (`components/buttons.css`)
```css
.btn {
    padding: var(--spS) var(--spM);
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
}

.btn-primary {
    background: var(--primary);
    color: var(--background);
}

.btn-secondary {
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
}
```

#### 2. **Project Card** (`components/project-card.css`)
```css
.project-card {
    background: var(--card-bg);
    border-radius: 12px;
    overflow: hidden;
}

.project-card__image {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
}

.project-card__progress {
    height: 8px;
    background: rgba(17, 212, 114, 0.2);
    border-radius: 4px;
}
```

#### 3. **Forms** (`components/forms.css`)
```css
.form-group {
    margin-bottom: var(--spM);
}

.form-input {
    width: 100%;
    padding: var(--spS) var(--spM);
    background: var(--card-bg);
    border: 1px solid rgba(157, 185, 171, 0.2);
    color: var(--text-light);
    border-radius: 8px;
}

.form-input:focus {
    border-color: var(--primary);
    outline: none;
}
```

### JavaScript Patterns

#### 1. **Fetch API - GET Request**
```javascript
const loadProjects = async () => {
    try {
        const response = await fetch('/api/projects?category=1');
        
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        const result = await response.json();
        
        if (result.success) {
            renderProjects(result.data.projects);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
};
```

#### 2. **Fetch API - POST Request con Autenticación**
```javascript
const createProject = async (formData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    return result;
};
```

#### 3. **Renderizado Dinámico**
```javascript
function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    
    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <img src="${project.cover_image_url}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p>${project.summary}</p>
            <div class="progress-bar">
                <div class="progress-fill" 
                     style="width: ${(project.raised_amount / project.goal_amount) * 100}%">
                </div>
            </div>
            <p>Bs. ${project.raised_amount} de Bs. ${project.goal_amount}</p>
        </div>
    `).join('');
}
```

#### 4. **Gestión de Autenticación**
```javascript
// Guardar token después de login
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// Verificar autenticación en páginas protegidas
const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/auth/login.html';
        return false;
    }
    return true;
};

// Cargar datos del usuario
const loadUserHeader = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    const user = result.data;
    
    document.querySelector('.user-name').textContent = user.first_name;
    document.querySelector('.user-avatar').src = 
        user.profile_image_url || '/uploads/avatar/blank/no_photo.png';
};
```

#### 5. **Image Uploader** (`utils/ImageUploader.js`)
```javascript
class ImageUploader {
    constructor(inputId, previewSelector, options = {}) {
        this.input = document.getElementById(inputId);
        this.preview = document.querySelector(previewSelector);
        this.file = null;
        
        this.input.addEventListener('change', (e) => {
            this.file = e.target.files[0];
            this.showPreview();
        });
    }
    
    async upload() {
        const formData = new FormData();
        formData.append('image', this.file);
        formData.append('imageType', 'avatar');
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/image/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const result = await response.json();
        return result.data.imageId;
    }
}
```

---

## 🔄 Flujos Principales

### 1. Registro de Usuario

```
FRONTEND                          BACKEND                         DATABASE
   │                                 │                               │
   │  POST /api/register            │                               │
   │  { email, password, ... } ────>│                               │
   │                                 │                               │
   │                                 │  bcrypt.hash(password)        │
   │                                 │                               │
   │                                 │  INSERT INTO users.user ─────>│
   │                                 │                               │
   │                                 │  Generate verification token  │
   │                                 │                               │
   │                                 │  Send email (Nodemailer)      │
   │                                 │                               │
   │<──── { success: true } ─────────│                               │
   │                                 │                               │
   │  Redirect to login              │                               │
```

**Código clave:**
1. `src/public/scripts/pages/auth/signup.js` - Formulario
2. `src/controllers/authController.js` → `register()`
3. `src/services/authService.js` → `createUser()`
4. `src/services/mailService.js` → `sendVerificationEmail()`

### 2. Login y Autenticación

```
FRONTEND                          BACKEND                         DATABASE
   │                                 │                               │
   │  POST /api/login               │                               │
   │  { email, password } ─────────>│                               │
   │                                 │                               │
   │                                 │  SELECT * FROM users.user ──>│
   │                                 │  WHERE email = $1             │
   │                                 │<─────────────────────────────│
   │                                 │                               │
   │                                 │  bcrypt.compare(password)     │
   │                                 │                               │
   │                                 │  jwt.sign({ id, email })      │
   │                                 │                               │
   │<──── { token, user } ───────────│                               │
   │                                 │                               │
   │  localStorage.setItem('token')  │                               │
   │  localStorage.setItem('user')   │                               │
   │                                 │                               │
   │  Redirect to dashboard          │                               │
```

**Código clave:**
1. `src/public/pages/auth/login.html` + script inline
2. `src/controllers/authController.js` → `login()`
3. `src/utils/jwt.js` → `generateToken()`

### 3. Crear Proyecto

```
FRONTEND                                BACKEND                              DATABASE
   │                                       │                                    │
   │  Upload cover image                   │                                    │
   │  POST /api/image/upload ─────────────>│                                    │
   │<──── { imageId: 123 } ────────────────│                                    │
   │                                       │                                    │
   │  Upload proof document                │                                    │
   │  POST /api/document/upload ──────────>│                                    │
   │<──── { documentId: 456 } ─────────────│                                    │
   │                                       │                                    │
   │  POST /api/projects                   │                                    │
   │  Authorization: Bearer <token>        │                                    │
   │  { title, summary, ... } ────────────>│                                    │
   │                                       │                                    │
   │                                       │  authMiddleware verifies token     │
   │                                       │  req.user = { id, email }          │
   │                                       │                                    │
   │                                       │  SELECT projects.create_project()─>│
   │                                       │  ($1, $2, ... $9)                  │
   │                                       │<───────────────────────────────────│
   │                                       │  project_id                        │
   │                                       │                                    │
   │<──── { success: true, projectId } ────│                                    │
   │                                       │                                    │
   │  Redirect to "Mis Proyectos"          │                                    │
```

**Código clave:**
1. `src/public/pages/user/projects/createProject.html`
2. `src/public/scripts/pages/user/create-project-handler.js`
3. `src/controllers/projectController.js` → `createProject()`
4. `src/repositories/projectRepository.js` → `createProject()`
5. `db/schemas/functions/projects/projects_management.sql` → `create_project()`

### 4. Donar a Proyecto

```
FRONTEND                                BACKEND                              DATABASE
   │                                       │                                    │
   │  POST /api/gateway/payments           │                                    │
   │  { projectId, amount } ──────────────>│                                    │
   │                                       │                                    │
   │                                       │  1. Create donation (pending) ────>│
   │                                       │  2. Create gateway_payment ───────>│
   │                                       │  3. Generate QR code               │
   │                                       │                                    │
   │<──── { qrCodeUrl, paymentUrl } ───────│                                    │
   │                                       │                                    │
   │  Redirect to /pages/payment/pay.html  │                                    │
   │  Display QR code                      │                                    │
   │                                       │                                    │
   │  User scans QR and pays               │                                    │
   │                                       │                                    │
   │  POST /api/gateway/payments/:id/confirm                                   │
   │  ─────────────────────────────────────>│                                    │
   │                                       │                                    │
   │                                       │  UPDATE gateway_payment ──────────>│
   │                                       │  SET status = 'confirmed'          │
   │                                       │                                    │
   │                                       │  UPDATE donation ─────────────────>│
   │                                       │  SET status = 'completed'          │
   │                                       │                                    │
   │                                       │  TRIGGER updates raised_amount ───>│
   │                                       │                                    │
   │<──── { success: true } ────────────────│                                    │
   │                                       │                                    │
   │  Redirect to /pages/payment/success.html                                  │
```

**Código clave:**
1. `src/public/pages/payment/pay.html`
2. `src/public/pages/payment/success.html`
3. `src/controllers/paymentGatewayController.js`
4. `src/repositories/gatewayPaymentRepository.js`
5. `db/schemas/triggers/02_donation_raised_amount_trigger.sql`

### 5. Marcar Favorito

```
FRONTEND                                BACKEND                              DATABASE
   │                                       │                                    │
   │  Click botón favorito (corazón)       │                                    │
   │  POST /api/favorites/toggle/:projectId │                                   │
   │  Authorization: Bearer <token> ──────>│                                    │
   │                                       │                                    │
   │                                       │  authMiddleware → req.user         │
   │                                       │                                    │
   │                                       │  SELECT social.toggle_favorite() ─>│
   │                                       │  (user_id, project_id)             │
   │                                       │                                    │
   │                                       │  IF EXISTS → DELETE               │
   │                                       │  ELSE → INSERT                     │
   │                                       │                                    │
   │                                       │<───────────────────────────────────│
   │                                       │  RETURN is_favorited (boolean)     │
   │                                       │                                    │
   │<──── { is_favorited: true/false } ────│                                    │
   │                                       │                                    │
   │  Toggle icon (favorite ↔ favorite_border)                                │
```

**Código clave:**
1. `src/public/scripts/pages/projects-loader.js` - Evento click
2. `src/controllers/favoriteController.js` → `toggleFavorite()`
3. `src/repositories/favoriteRepository.js` → `toggleFavorite()`
4. `db/schemas/functions/social/favorites_management.sql`

---

## 🎓 Conceptos Clave

### 1. **Autenticación vs Autorización**

#### Autenticación (¿Quién eres?)
- Login con email/password
- JWT token generado después de login exitoso
- Token almacenado en `localStorage`
- Token enviado en header: `Authorization: Bearer <token>`

#### Autorización (¿Qué puedes hacer?)
- RBAC: Role-Based Access Control
- Roles: `user`, `admin`, `moderator`
- Permisos por role
- Middleware verifica role antes de ejecutar acción

**Ejemplo:**
```javascript
// Autenticación: ¿Estás logueado?
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No autenticado' });
    req.user = verifyToken(token);
    next();
};

// Autorización: ¿Eres admin?
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No autorizado' });
    }
    next();
};
```

### 2. **SQL Injection Prevention**

**❌ VULNERABLE:**
```javascript
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Si email = "' OR '1'='1" → SQL injection
```

**✅ SEGURO:**
```javascript
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
// Prepared statement previene injection
```

### 3. **CORS (Cross-Origin Resource Sharing)**

```javascript
// app.js
const cors = require('cors');
app.use(cors()); // Permite requests desde cualquier origen

// En producción, limitar orígenes:
app.use(cors({
    origin: 'https://aportaya.com',
    credentials: true
}));
```

### 4. **Bcrypt - Hashing de Contraseñas**

**¿Por qué NO guardar passwords en texto plano?**
- Si la DB es comprometida, todas las passwords son visibles
- Bcrypt genera hash one-way (no reversible)

```javascript
// Registro
const hashedPassword = await bcrypt.hash('miPassword123', 10);
// Guarda: $2b$10$K3x... (60 caracteres)

// Login
const isValid = await bcrypt.compare('miPassword123', hashedPassword);
// true si coincide, false si no
```

**Salt rounds = 10:** Más alto = más seguro pero más lento

### 5. **JWT (JSON Web Token)**

**Estructura:**
```
header.payload.signature

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  ← Header (algoritmo)
eyJpZCI6MTIzLCJlbWFpbCI6InVzZXJAZW1haWwuY29tIn0.  ← Payload (datos)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature (verificación)
```

**Ventajas:**
- Stateless: No requiere sesión en servidor
- Puede incluir datos del usuario
- Firmado con secret → no puede ser modificado

**Desventajas:**
- No se puede invalidar (hasta que expire)
- Tamaño mayor que session ID

### 6. **RESTful API Design**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects` | Listar todos |
| GET | `/api/projects/:id` | Obtener uno |
| POST | `/api/projects` | Crear nuevo |
| PUT | `/api/projects/:id` | Actualizar completo |
| PATCH | `/api/projects/:id` | Actualizar parcial |
| DELETE | `/api/projects/:id` | Eliminar |

**Códigos de estado HTTP:**
- 200 OK: Éxito
- 201 Created: Recurso creado
- 400 Bad Request: Datos inválidos
- 401 Unauthorized: No autenticado
- 403 Forbidden: No autorizado
- 404 Not Found: No existe
- 500 Internal Server Error: Error del servidor

### 7. **Transacciones en PostgreSQL**

```javascript
const client = await pool.connect();
try {
    await client.query('BEGIN');
    
    // Operación 1: Crear donación
    await client.query('INSERT INTO payments.donation ...');
    
    // Operación 2: Actualizar proyecto
    await client.query('UPDATE projects.project SET raised_amount ...');
    
    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
}
```

**ACID:**
- **Atomicity:** Todo o nada
- **Consistency:** DB válida antes y después
- **Isolation:** Transacciones no interfieren
- **Durability:** Cambios permanentes después de commit

### 8. **Triggers vs Application Logic**

**Trigger (automático en DB):**
```sql
CREATE TRIGGER update_raised_amount
AFTER INSERT ON payments.donation
FOR EACH ROW
EXECUTE FUNCTION update_project_raised_amount();
```
✅ Siempre se ejecuta, incluso si actualizas desde otra app
✅ Performance optimizado
❌ Menos visible en código application

**Application Logic (manual en código):**
```javascript
await donationRepository.create(donation);
await projectRepository.updateRaisedAmount(projectId, amount);
```
✅ Explícito en código
❌ Puede olvidarse de ejecutar
❌ Más queries a DB

### 9. **Soft Delete vs Hard Delete**

**Hard Delete (eliminar físicamente):**
```sql
DELETE FROM users.user WHERE id = 123;
```
❌ Datos perdidos permanentemente
❌ No hay auditoría

**Soft Delete (marcar como eliminado):**
```sql
UPDATE users.user 
SET deleted_at = NOW(), status = 'deleted' 
WHERE id = 123;

-- Al consultar:
SELECT * FROM users.user WHERE deleted_at IS NULL;
```
✅ Datos recuperables
✅ Auditoría completa
✅ Cumple regulaciones (GDPR)

### 10. **Slugs para URLs SEO-Friendly**

**Sin slug:**
```
https://aportaya.com/projects?id=123
```

**Con slug:**
```
https://aportaya.com/projects/proyecto-educacion-ninos-2024
```

**Generación:**
```javascript
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// "Educación para Niños 2024" → "educacion-para-ninos-2024"
```

---

## ✅ Checklist de Estudio

### Nivel 1: Fundamentos (Debes dominar)

#### Base de Datos
- [ ] ¿Cuántos schemas tiene la DB y cuál es el propósito de cada uno?
- [ ] ¿Qué diferencia hay entre `users.user` y `users.user_status`?
- [ ] ¿Cómo se relacionan `projects.project` y `payments.donation`?
- [ ] ¿Qué hace el trigger `update_raised_amount_trigger`?
- [ ] ¿Por qué `social.favorite` tiene composite primary key?
- [ ] ¿Qué almacena `audit.webhook_event` y para qué sirve?

#### Backend
- [ ] ¿Cuál es el flujo completo de un request desde ruta hasta respuesta?
- [ ] ¿Qué hace el `authMiddleware` y dónde se usa?
- [ ] ¿Cómo se hashea una contraseña y cómo se verifica?
- [ ] ¿Qué información contiene un JWT token?
- [ ] ¿Cuál es la diferencia entre Controller y Repository?
- [ ] ¿Cómo se previene SQL injection en queries?

#### Frontend
- [ ] ¿Cómo se guarda y recupera el token JWT?
- [ ] ¿Qué hace `user-header.js` y dónde se incluye?
- [ ] ¿Cómo funciona `ImageUploader` para subir archivos?
- [ ] ¿Cuál es el patrón de respuesta JSON del backend?
- [ ] ¿Qué breakpoints usa el proyecto para responsive?

### Nivel 2: Flujos de Negocio (Explica paso a paso)

- [ ] **Registro completo:** Desde formulario hasta email de verificación
- [ ] **Login y JWT:** ¿Cómo se genera el token y cómo se usa?
- [ ] **Crear proyecto:** Desde subir imágenes hasta guardar en DB
- [ ] **Donación con QR:** Flujo completo con gateway de pago
- [ ] **Marcar favorito:** Toggle y actualización de UI
- [ ] **Comentar proyecto:** Validación, inserción y renderizado

### Nivel 3: Arquitectura (Justifica decisiones)

- [ ] ¿Por qué separar en schemas (users, projects, payments, etc.)?
- [ ] ¿Por qué usar Repository Pattern en lugar de queries directas?
- [ ] ¿Ventajas de usar triggers vs lógica en application?
- [ ] ¿Por qué JWT en lugar de sessions?
- [ ] ¿Por qué Vanilla JS en lugar de React/Vue?
- [ ] ¿Por qué PostgreSQL en lugar de MySQL/MongoDB?

### Nivel 4: Seguridad (Identifica vulnerabilidades)

- [ ] ¿Cómo está protegido el endpoint `/api/user/projects/:id/edit`?
- [ ] ¿Qué pasa si alguien modifica el JWT token?
- [ ] ¿Es seguro guardar el token en `localStorage`?
- [ ] ¿Cómo se previene que un usuario edite proyectos de otros?
- [ ] ¿Qué pasa si hay un SQL injection en search?
- [ ] ¿Cómo se valida que una imagen subida sea válida?

### Nivel 5: Optimización (Mejora el código)

- [ ] ¿Cómo optimizar queries con muchos JOINs?
- [ ] ¿Qué índices agregarías a las tablas?
- [ ] ¿Cómo implementar paginación en listado de proyectos?
- [ ] ¿Cómo cachear proyectos para reducir queries?
- [ ] ¿Cómo lazy-load imágenes de proyectos?
- [ ] ¿Cómo comprimir imágenes al subirlas?

---

## 📖 Preguntas de Repaso por Módulo

### Base de Datos

1. **¿Qué retorna la función `projects.create_project()`?**
   <details>
   <summary>Respuesta</summary>
   Retorna el `project_id` del proyecto creado. La función inserta un nuevo registro en `projects.project` con status 'pending', genera un slug único, y retorna el ID.
   </details>

2. **¿Cuándo se ejecuta el trigger `update_raised_amount_trigger`?**
   <details>
   <summary>Respuesta</summary>
   Se ejecuta AFTER INSERT o UPDATE en `payments.donation` cuando el status es 'completed'. Suma el monto de la donación al `raised_amount` del proyecto.
   </details>

3. **¿Por qué `donor_id` puede ser NULL en `payments.donation`?**
   <details>
   <summary>Respuesta</summary>
   Para permitir donaciones anónimas. Si `donor_id` es NULL, significa que la donación se hizo sin autenticación.
   </details>

### Backend

4. **¿Qué diferencia hay entre `authMiddleware` y `adminMiddleware`?**
   <details>
   <summary>Respuesta</summary>
   `authMiddleware` verifica que el usuario esté autenticado (tiene token válido). `adminMiddleware` verifica que además sea admin (role = 'admin'). `adminMiddleware` debe usarse DESPUÉS de `authMiddleware`.
   </details>

5. **¿Por qué es importante usar `await client.release()` en transacciones?**
   <details>
   <summary>Respuesta</summary>
   Para liberar la conexión del pool y que otros requests puedan usarla. Si no se libera, el pool se agota y la app deja de responder.
   </details>

6. **¿Qué hace `bcrypt.hash(password, 10)`? ¿Qué es el 10?**
   <details>
   <summary>Respuesta</summary>
   Genera un hash de la contraseña. El 10 son los "salt rounds" - número de iteraciones del algoritmo. Más rounds = más seguro pero más lento. 10 es el balance recomendado.
   </details>

### Frontend

7. **¿Por qué se usa `||` en `user.profile_image_url || '/uploads/avatar/blank/no_photo.png'`?**
   <details>
   <summary>Respuesta</summary>
   Es un fallback. Si `user.profile_image_url` es null/undefined, usa la imagen por defecto. Es el operador OR lógico: retorna el primer valor "truthy".
   </details>

8. **¿Qué pasa si un usuario intenta acceder a `/pages/user/dashboard.html` sin token?**
   <details>
   <summary>Respuesta</summary>
   El JavaScript de la página ejecuta `checkAuth()` que verifica si existe token en localStorage. Si no existe, redirige a `/pages/auth/login.html`.
   </details>

9. **¿Por qué usar `FormData` para subir imágenes en lugar de JSON?**
   <details>
   <summary>Respuesta</summary>
   JSON no puede transportar archivos binarios. `FormData` permite enviar archivos multipart/form-data. Además, es compatible con `multer` en el backend.
   </details>

### Seguridad

10. **¿Un usuario puede editar el proyecto de otro usuario? ¿Cómo se previene?**
    <details>
    <summary>Respuesta</summary>
    No. En `projectController.updateProject()` se verifica que `req.user.id === project.creator_id`. Si no coincide, retorna error 403 Forbidden.
    </details>

11. **¿Es seguro guardar el JWT en localStorage?**
    <details>
    <summary>Respuesta</summary>
    Tiene riesgos de XSS (Cross-Site Scripting). Alternativas más seguras: cookies httpOnly. Sin embargo, para apps SPA simples, localStorage es aceptable si se sanitizan inputs correctamente.
    </details>

12. **¿Qué pasa si alguien modifica manualmente el JWT token?**
    <details>
    <summary>Respuesta</summary>
    `jwt.verify()` falla porque la signature no coincide con el payload modificado. El token fue firmado con `JWT_SECRET` que solo el servidor conoce. Sin el secret, no se puede generar signature válida.
    </details>

---

## 🎯 Ejercicios Prácticos

### Ejercicio 1: Rastrear un Request
Traza el flujo completo de este request:
```
GET /api/projects?category=1
Authorization: Bearer eyJhbGciOiJIUz...
```

**Responde:**
1. ¿Qué archivo de routes maneja este endpoint?
2. ¿Pasa por algún middleware? ¿Cuál?
3. ¿Qué controller y función se ejecuta?
4. ¿Qué repository se llama?
5. ¿Qué query SQL se ejecuta?
6. ¿Qué estructura JSON se retorna?

### Ejercicio 2: Agregar Validación
El campo `title` de proyecto no tiene validación de longitud. Agrega validación para:
- Mínimo 10 caracteres
- Máximo 200 caracteres

**¿Dónde agregarías esta validación?**
1. Frontend (JavaScript)
2. Backend (Controller)
3. Base de datos (CHECK constraint)

### Ejercicio 3: Debugging
Un usuario reporta: "No puedo donar a un proyecto". 

**¿Cómo debuggearías?**
1. ¿Qué logs revisarías?
2. ¿Qué queries ejecutarías en la DB?
3. ¿Qué endpoint está fallando?
4. ¿Posibles causas?

### Ejercicio 4: Nueva Feature
Implementa "Proyectos destacados" (featured).

**Diseña:**
1. Cambios en DB (nueva columna, índice)
2. Función SQL para marcar/desmarcar featured
3. Endpoint REST para admin
4. Query para obtener solo proyectos featured
5. Componente frontend para mostrarlos

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Node.js](https://nodejs.org/docs/)
- [JWT](https://jwt.io/introduction)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

### Tutoriales Recomendados
- REST API Best Practices
- SQL Joins Explained
- JWT Authentication Guide
- CSS Flexbox/Grid
- Async/Await in JavaScript

### Herramientas Útiles
- **Postman:** Testing de API
- **pgAdmin:** GUI para PostgreSQL
- **VS Code Extensions:** 
  - PostgreSQL (cweijan.vscode-postgresql-client2)
  - REST Client (humao.rest-client)
  - ESLint (dbaeumer.vscode-eslint)

---

## 🎓 Tips para Estudiar

### 1. Lee el código con propósito
No leas pasivamente. Pregúntate:
- ¿Por qué está estructurado así?
- ¿Qué pasa si cambio esto?
- ¿Cómo se conecta con otras partes?

### 2. Dibuja diagramas
- Diagrama ER de la base de datos
- Flujo de requests (sequence diagrams)
- Arquitectura de componentes

### 3. Modifica y experimenta
- Cambia un endpoint y observa el efecto
- Agrega console.logs para ver el flujo
- Rompe algo a propósito y arréglalo

### 4. Explica en voz alta
- Si puedes explicar un concepto a alguien más, lo dominas
- Grábate explicando un flujo
- Enseña a un compañero

### 5. Crea tus propias preguntas
- Escribe 5 preguntas sobre cada módulo
- Intercambia preguntas con compañeros
- Resuelve las de otros

---

## 🏆 Checklist Final Pre-Examen

### Teoría
- [ ] Puedo explicar qué es REST API
- [ ] Entiendo la diferencia entre autenticación y autorización
- [ ] Sé cómo funciona bcrypt y JWT
- [ ] Conozco los códigos HTTP principales (200, 400, 401, 403, 500)
- [ ] Entiendo qué es SQL injection y cómo prevenirla

### Base de Datos
- [ ] Puedo dibujar el diagrama ER de memoria
- [ ] Sé qué hace cada schema
- [ ] Entiendo triggers y cuándo se ejecutan
- [ ] Conozco las funciones SQL principales

### Backend
- [ ] Puedo trazar un request desde route hasta response
- [ ] Entiendo el patrón Repository
- [ ] Sé cómo funcionan los middlewares
- [ ] Puedo explicar el flujo de autenticación

### Frontend
- [ ] Sé cómo funciona fetch API
- [ ] Entiendo el flujo de autenticación con JWT
- [ ] Conozco los componentes reutilizables
- [ ] Puedo explicar el sistema de diseño

### Flujos Completos
- [ ] Registro → Verificación → Login
- [ ] Crear proyecto → Aprobación → Publicación
- [ ] Donación → Pago QR → Confirmación
- [ ] Marcar favorito
- [ ] Comentar en proyecto

---

**¡Éxito en tu estudio! 🚀**

Esta guía cubre todo el proyecto AportaYa. Tómate el tiempo de entender cada concepto antes de avanzar. La comprensión profunda es más valiosa que memorizar código.
