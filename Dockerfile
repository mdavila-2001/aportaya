FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package.json de src
COPY src/package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar el código de src
COPY src/ ./

# Crear directorio de uploads
RUN mkdir -p /app/uploads

# Exponer el puerto
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["npm", "start"]
