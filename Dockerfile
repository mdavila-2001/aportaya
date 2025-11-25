# Etapa de construcción
FROM node:18-alpine AS builder

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Etapa de producción
FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar dependencias de la etapa de construcción
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copiar el código fuente
COPY . .

# Puerto de la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "src/app.js"]
