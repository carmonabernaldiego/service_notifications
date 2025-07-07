# Base
FROM node:18

# Crea el directorio
WORKDIR /app

# Copia package.json y lock
COPY package*.json ./

# Instala dependencias
RUN npm install --legacy-peer-deps

# Copia el resto del código
COPY . .

# Construye el proyecto
RUN npm run build

# Expone el puerto (de tu .env PORT)
EXPOSE 3000

# Inicia la app
CMD ["node", "dist/main.js"]
