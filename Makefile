.PHONY: install
install: ## Install dependencies with Bun.
	bun install --frozen-lockfile

.PHONY: db-up
db-up: ## Start local infrastructure (PostgreSQL & Redis).
	docker compose up -d

.PHONY: db-down
db-down: ## Stop local infrastructure.
	docker compose down

.PHONY: db-migrate
db-migrate: ## Run database migrations.
	bun run db:migrate

.PHONY: db-seed
db-seed: ## Seed deterministic local development data.
	bun run db:seed

.PHONY: dev
dev: ## Start the Next.js development server on host.
	bun run dev

.PHONY: build
build: ## Build the application for production with Bun.
	bun run build

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
