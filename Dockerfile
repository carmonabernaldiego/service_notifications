FROM node:18
WORKDIR /app
COPY package*.json ./
# Limpia caché npm y reinstala
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]