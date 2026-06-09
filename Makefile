# ---------------------------------------------------------------------------
# EduWanka — atajos para Docker Compose (alternativa multiplataforma a
# docker-eduwanka.bat). Requiere Docker y "make" (en Windows: Git Bash, WSL
# o "choco install make").
#
# Ver: Documentacion/PLAN_DOCKERIZACION_Y_PRUEBAS_E2E_CYPRESS.md (Fase D4).
# ---------------------------------------------------------------------------

.PHONY: up up-prod down build logs ps test test-e2e shell mysql key clean

# Crea ".env" desde la plantilla si todavía no existe (igual que el .bat).
.env:
	cp .env.docker.example .env
	@echo "Creado .env a partir de .env.docker.example. Ajustalo si lo necesitas."

up: .env ## Levanta el stack en modo desarrollo (Vite hot-reload + phpMyAdmin)
	docker compose up --build

up-prod: .env ## Levanta el stack en modo produccion-like (SPA servida por Nginx)
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

down: ## Detiene y elimina los contenedores
	docker compose down

build: .env ## (Re)construye las imagenes sin levantar los contenedores
	docker compose build

logs: ## Sigue los logs de todos los servicios
	docker compose logs -f

ps: ## Lista el estado de los contenedores del stack
	docker compose ps

key: ## Genera una nueva APP_KEY dentro del contenedor backend
	docker compose exec backend php artisan key:generate --show

test: ## Corre la suite de PHPUnit dentro del contenedor backend
	docker compose exec backend php artisan test

test-e2e: ## Corre la suite de Cypress (headless) contra el stack levantado
	docker compose exec frontend npx cypress run

shell: ## Abre una shell dentro del contenedor backend
	docker compose exec backend bash

mysql: ## Abre un cliente MySQL dentro del contenedor db
	docker compose exec db mysql -u root -p$${DB_ROOT_PASSWORD:-rootpassword} $${DB_DATABASE:-eduwanka}

clean: ## Detiene el stack y elimina volumenes (¡borra la base de datos!)
	docker compose down -v
