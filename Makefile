postgres-run:
	docker-compose -f .devcontainer/docker-compose.yml up -d

postgres-stop:
	docker-compose -f .devcontainer/docker-compose.yml stop

postgres-down:
	docker-compose -f .devcontainer/docker-compose.yml down

postgres-log:
	docker-compose -f .devcontainer/docker-compose.yml logs -f

postgres-setup-db: postgres-create-db postgres-create-table

postgres-create-db:
	docker exec -it postgres psql -U postgres -c 'create database eldorado;'

postgres-create-table:
	docker exec -it postgres psql -U postgres -d eldorado -c \
	"CREATE TABLE products( \
		id SERIAL PRIMARY KEY, \
		name VARCHAR(200) NOT NULL, \
		price NUMERIC(10) NOT NULL, \
		quantity INT NULL, \
		description VARCHAR(1000) NULL, \
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP \
	);"

postgres-drop-table:
	docker exec -it postgres psql -U postgres -d eldorado -c \
	"DROP TABLE IF EXISTS products;"

postgres-ssh:
	docker exec -it postgres bash
