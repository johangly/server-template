# Usamos una versión ligera y moderna de Node
FROM node:22-alpine

# Instalamos curl para que el Healthcheck de Coolify funcione
RUN apk add --no-cache curl

# Creamos la carpeta de trabajo
WORKDIR /app

# 1. Copiamos solo los archivos de dependencias primero (para aprovechar la caché)
COPY package*.json ./

# 2. Instalamos las dependencias
RUN npm install

# 3. Copiamos el resto del código
COPY . .

# 4. Construimos la aplicación (Si usas TypeScript)
# Si tu proyecto es JS puro y no tiene script "build", comenta la siguiente línea con un #
RUN npm run build

# 5. Comando para iniciar el Worker
CMD ["npm", "run", "start:worker"]