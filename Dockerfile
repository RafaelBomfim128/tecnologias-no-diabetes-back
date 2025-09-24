# Usa uma imagem base do Node.js
FROM node:18

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o package.json e package-lock.json
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia os arquivos do projeto para o container
COPY . .

# Expõe a porta 3000 (ou a porta configurada no .env)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
