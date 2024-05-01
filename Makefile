.PHONY: build
build: ## Build the production docker image.
	docker compose -f docker-compose.yml build

.PHONY: start
start: ## Start the production docker container.
	docker compose -f docker-compose.yml up -d

.PHONY: stop
stop: ## Stop the production docker container.
	docker compose -f docker-compose.yml down