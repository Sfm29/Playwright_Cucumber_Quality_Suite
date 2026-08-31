# Official Playwright image: ships matching browser binaries + OS deps for
# chromium/firefox/webkit pre-installed, so `docker build` is reproducible on any host.
FROM mcr.microsoft.com/playwright:v1.49.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Default command runs the full BDD suite headless against automationexercise.com.
# Override at `docker run` time, e.g. (after `docker build -t playwright-cucumber-quality-suite .`):
#   docker run --rm playwright-cucumber-quality-suite npm run test:a11y
#   docker run --rm playwright-cucumber-quality-suite npm run test:visual
CMD ["npm", "test"]
