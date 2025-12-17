FROM node:22-alpine AS base

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps

RUN apk add --no-cache python3 make g++ sqlite-dev
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY tsconfig.json tsconfig.compile.json tsup.config.ts ./
COPY src ./src
RUN pnpm run build

FROM build AS prod-deps

RUN pnpm prune --prod

FROM base AS runner

ENV NODE_ENV=production
RUN apk add --no-cache sqlite-libs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json pnpm-lock.yaml ./

EXPOSE 8080
CMD ["node", "dist/index.js"]
