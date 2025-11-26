# 🐳 Guía Rápida de Docker - AportaYa

## 📋 Requisitos Previos

- Docker Desktop instalado
- Docker Compose instalado (viene con Docker Desktop)

## 🚀 Comandos Básicos

### 1️⃣ Iniciar Todo (Primera Vez)

```bash
docker-compose up -d
```

Esto iniciará:
- ✅ PostgreSQL en el puerto 5432
- ✅ Aplicación Node.js en el puerto 3001
- ✅ Inicialización automática de la base de datos

### 2️⃣ Ver Logs

```bash
# Ver todos los logs
docker-compose logs -f

# Ver solo logs de la base de datos
docker-compose logs -f db

# Ver solo logs de la aplicación
docker-compose logs -f app
```

### 3️⃣ Detener Todo

```bash
docker-compose down
```

### 4️⃣ Reiniciar Todo (Mantener Datos)

```bash
docker-compose restart
```

### 5️⃣ Reiniciar Desde Cero (Eliminar Datos)

```bash
# ⚠️ CUIDADO: Esto elimina TODOS los datos de la base de datos
docker-compose down -v
docker-compose up -d
```

### 6️⃣ Reconstruir la Aplicación

```bash
# Si cambias el Dockerfile o dependencias
docker-compose up -d --build
```

## 📊 Verificar que Todo Funciona

### Verificar Contenedores Activos

```bash
docker-compose ps
```

Deberías ver:
```
NAME              STATUS         PORTS
aportaya-db       Up (healthy)   0.0.0.0:5432->5432/tcp
aportaya-app      Up             0.0.0.0:3001->3001/tcp
```

### Probar la Aplicación

Abre tu navegador en: `http://localhost:3001`

### Conectar a la Base de Datos

Puedes usar cualquier cliente PostgreSQL con estas credenciales:

```
Host: localhost
Port: 5432
Database: aporta_ya_db
User: postgres
Password: admin
```

## 🔧 Comandos Útiles

### Entrar al Contenedor de la Base de Datos

```bash
docker exec -it aportaya-db psql -U postgres -d aporta_ya_db
```

### Entrar al Contenedor de la Aplicación

```bash
docker exec -it aportaya-app sh
```

### Ver Espacio Usado por Docker

```bash
docker system df
```

### Limpiar Todo (Liberar Espacio)

```bash
# Eliminar contenedores, redes e imágenes no usadas
docker system prune -a

# Eliminar también volúmenes
docker system prune -a --volumes
```

## 📁 Estructura de Archivos Docker

```
aportaya/
├── docker-compose.yml    # Configuración de servicios
├── Dockerfile           # Imagen de la aplicación
├── .dockerignore        # Archivos a ignorar
├── .env                 # Variables de entorno
└── db/                  # Scripts de inicialización
    ├── init-db.sh
    ├── init.sql
    └── seed.sql
```

## 🐛 Solución de Problemas

### La base de datos no inicia

```bash
# Ver logs detallados
docker-compose logs db

# Reiniciar solo la base de datos
docker-compose restart db
```

### La aplicación no se conecta a la base de datos

```bash
# Verificar que la base de datos esté saludable
docker-compose ps

# Esperar a que la base de datos esté lista
docker-compose logs db | grep "ready to accept connections"
```

### Puerto ya en uso

Si el puerto 3001 o 5432 ya está en uso:

```bash
# Ver qué está usando el puerto
lsof -i :3001
lsof -i :5432

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### Cambios en el código no se reflejan

```bash
# Reconstruir la imagen
docker-compose up -d --build app
```

## 🎯 Flujo de Trabajo Recomendado

### Desarrollo Diario

```bash
# 1. Iniciar servicios
docker-compose up -d

# 2. Ver logs mientras trabajas
docker-compose logs -f app

# 3. Al terminar
docker-compose down
```

### Después de Cambios en Dependencias

```bash
# Reconstruir la aplicación
docker-compose up -d --build
```

### Resetear Base de Datos

```bash
# Eliminar datos y reiniciar
docker-compose down -v
docker-compose up -d
```

## ✅ Checklist de Verificación

- [ ] Docker Desktop está corriendo
- [ ] `docker-compose up -d` ejecutado sin errores
- [ ] `docker-compose ps` muestra ambos contenedores "Up"
- [ ] `http://localhost:3001` responde
- [ ] Base de datos accesible en puerto 5432
- [ ] Logs no muestran errores: `docker-compose logs`

## 📞 Ayuda Rápida

| Problema | Solución |
|----------|----------|
| "Cannot connect to Docker daemon" | Inicia Docker Desktop |
| "Port already in use" | Cambia el puerto en `docker-compose.yml` |
| "Database not initialized" | `docker-compose down -v && docker-compose up -d` |
| "Module not found" | `docker-compose up -d --build` |
| Cambios no se ven | `docker-compose restart app` |

---

**¿Necesitas más ayuda?** Revisa los logs con `docker-compose logs -f`
