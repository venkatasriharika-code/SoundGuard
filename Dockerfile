FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN python3 -m pip install --break-system-packages --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.5.1+cpu \
  && python3 -m pip install --break-system-packages --no-cache-dir -r python_service/requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

RUN npm install -g corepack@latest \
  && corepack pnpm install \
  && corepack pnpm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
