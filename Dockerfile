FROM node:20-bookworm

# مكتبات مطلوبة لـ canvas و sqlite3 (الصور وبطاقة الرتب)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libjpeg62-turbo \
    libgif7 librsvg2-2 libpixman-1-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# NODE_ENV=goat مقصود: يمنع البوت من البحث عن config.dev.json (سبب توقف البوت على الاستضافة)
ENV NODE_ENV=goat
ENV PORT=8080

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

EXPOSE 8080

CMD [ "node", "index.js" ]
