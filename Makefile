.PHONY: build
build: ## Build the production docker image.
	docker compose build

.PHONY: start
start: ## Start the production docker container.
	docker compose up -d

.PHONY: stop
stop: ## Stop the production docker container.
	docker compose down

.PHONY: install
install: ## Install dependencies with Bun.
	bun install --frozen-lockfile

.PHONY: dev
dev: ## Start the development server.
	bun run dev

.PHONY: lint
lint: ## Run linting and format checks.
	bun run lint
	bun run fmt:check

.PHONY: typecheck
typecheck: ## Run type checking.
	bun run type-check

.PHONY: test
test: ## Run tests.
	bun test --pass-with-no-tests

.PHONY: build-app
build-app: ## Build the application for production.
	bun run build
