  FROM node:18-slim AS builder

  RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates openssl libc6 libstdc++6 libgomp1 \
   && rm -rf /var/lib/apt/lists/*
  
  WORKDIR /app
  

  COPY package.json package-lock.json ./
  

  RUN npm ci
  

  COPY tsconfig.json ./
  COPY prisma ./prisma
  COPY src ./src
  COPY package.json package-lock.json ./
  

  RUN npx prisma generate
  

  RUN npm run build
  

  RUN npm ci --omit=dev
  
  

  FROM node:18-slim AS runtime
  ENV NODE_ENV=dev
  WORKDIR /app
  

  RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates openssl libc6 libstdc++6 libgomp1 \
   && rm -rf /var/lib/apt/lists/*

  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/prisma ./prisma
  

  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

  
  EXPOSE 3000
  

  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
  
  CMD ["node", "dist/index.js"]
  