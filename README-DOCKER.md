# Docker Setup para AportaYa

## 🚀 Inicialización Automática de Base de Datos

El proyecto ahora configura automáticamente la base de datos PostgreSQL cuando se inicia Docker.

### 📁 Estructura de Archivos

```
db/
├── init.sql                 # Script principal de inicialización
├── seed.sql                 # Datos de ejemplo
├── init-db.sh              # Script de automatización
├── schemas/
│   ├── tables/             # Scripts de creación de tablas
│   ├── functions/          # Funciones y procedimientos
│   ├── triggers/           # Triggers e índices
│   └── views/              # Vistas de la base de datos
└── tables/
    └── 90_indexes.sql      # Índices adicionales
```

### 🐳 Configuración Docker

#### docker-compose.yml
```yaml
db:
  image: postgres:latest
  environment:
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres
    - POSTGRES_DB=aportaya
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./db:/docker-entrypoint-initdb.d  # 🎯 Monta scripts SQL
```

### 🔄 Proceso de Inicialización

1. **Montaje Automático**: La carpeta `db/` se monta en `/docker-entrypoint-initdb.d/`
2. **Ejecución Ordenada**: PostgreSQL ejecuta los scripts en orden alfabético:
   - `init-db.sh` → Verificación y ejecución
   - `init.sql` → Creación de esquemas, tablas, funciones, triggers, vistas
   - `seed.sql` → Datos de ejemplo

### 🎯 Características del Script

#### ✅ Detección Inteligente
- Detecta si la base de datos ya existe
- Verifica si las tablas están creadas
- Omite inicialización si no es necesario

#### 📊 Verificación Completa
- Espera a que PostgreSQL esté listo
- Cuenta tablas creadas
- Reporta estado detallado

#### 🌱 Carga de Datos
- Ejecuta `seed.sql` automáticamente si existe
- Reporta carga de datos de ejemplo

### 🚀 Comandos

#### Iniciar Todo (Primera Vez)
```bash
docker-compose up -d
```

#### Reiniciar Base de Datos
```bash
# Eliminar volumen y reconstruir
docker-compose down -v
docker-compose up -d
```

#### Ver Logs de Inicialización
```bash
docker-compose logs db
```

### 📋 Salida Esperada

```
🚀 Inicializando base de datos PostgreSQL...
✅ PostgreSQL está listo
📝 Creando base de datos 'aportaya'...
🔧 Ejecutando scripts de inicialización...
📂 Ejecutando init.sql...
✅ Base de datos inicializada con 32 tablas
🌱 Ejecutando datos de ejemplo...
✅ Datos de ejemplo cargados
🎉 Base de datos 'aportaya' inicializada exitosamente!
📊 Esquemas creados: users, projects, payments, social, messaging, audit, roles, files
🔧 Funciones, triggers y vistas configurados
🌱 Datos de ejemplo cargados
```

### 🔧 Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `POSTGRES_DB` | `aportaya` | Nombre de la base de datos |
| `POSTGRES_USER` | `postgres` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | `postgres` | Contraseña del usuario |

### 🛠️ Troubleshooting

#### Problema: Base de datos no se inicializa
```bash
# Verificar logs
docker-compose logs db

# Reiniciar completamente
docker-compose down -v
docker-compose up -d
```

#### Problema: Permisos del script
```bash
# Asegurar que el script es ejecutable
chmod +x db/init-db.sh
```

#### Problema: Scripts no se ejecutan
- Verificar que los archivos `.sql` estén en la carpeta `db/`
- Asegurar que `init.sql` tenga las rutas correctas a los archivos

### 🎯 Ventajas

✅ **Automático**: Sin intervención manual  
✅ **Inteligente**: Detecta estado previo  
✅ **Ordenado**: Ejecuta en secuencia correcta  
✅ **Verificado**: Confirma creación de objetos  
✅ **Flexible**: Soporta datos de ejemplo  
✅ **Robusto**: Maneja errores y reintentos  

### 📊 Esquemas Creados

- `users` - Usuarios y autenticación
- `projects` - Proyectos y campañas  
- `payments` - Donaciones y transacciones
- `social` - Comentarios, favoritos, reportes
- `messaging` - Sistema de mensajería
- `audit` - Logs de auditoría
- `roles` - Sistema de permisos RBAC
- `files` - Gestión de archivos

### 🔗 Conexión a la Base de Datos

```
Host: localhost
Port: 5432
Database: aportaya
User: postgres
Password: postgres
```
