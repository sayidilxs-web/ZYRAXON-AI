FROM oven/bun:latest
WORKDIR /app
COPY package.json .
RUN bun install
COPY src/ ./src/
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
