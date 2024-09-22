FROM node:18.20.4

# Либы для работы canvas
RUN apt-get update && apt-get install -y \
    libjpeg62-turbo-dev \
    libcairo2-dev \
    libpango-1.0-0 \
    libgif-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]
