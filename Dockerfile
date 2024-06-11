FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Copy all the file from app
COPY . .

# Expose the port the app runs in
EXPOSE 3000

# Définissez la commande pour démarrer votre application
CMD [ "node", "index.js" ]