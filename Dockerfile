# syntax=docker/dockerfile:1.7
# ─── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Cache mount — npm cache qatlamlar orasida saqlanadi, keyingi buildlarda
# paketlar internetdan qayta yuklanmaydi
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY . .

# Build vaqtida backend URL kerak
ARG NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

RUN npm run build

# devDependencies'ni endi kerak emas — tarmoqsiz, tez tozalash
# (alohida "npm ci --omit=dev" bosqichidan ancha tezroq)
RUN npm prune --omit=dev --legacy-peer-deps

# ─── Production stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Foydalanuvchini OLDIN yaratamiz — shunda COPY --chown to'g'ridan-to'g'ri
# to'g'ri egalik bilan ko'chiradi, alohida "chown -R" kerak bo'lmaydi
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/package*.json ./
COPY --chown=appuser:appgroup --from=builder /app/.next ./.next
COPY --chown=appuser:appgroup --from=builder /app/public ./public
COPY --chown=appuser:appgroup --from=builder /app/next.config.mjs ./

USER appuser

EXPOSE 5000

CMD ["npx", "next", "start", "-p", "5000"]
