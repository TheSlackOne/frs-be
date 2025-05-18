install:
	npm install

setup-db: postgres-start
	@until docker exec postgres pg_isready -U postgres; do sleep 1; done
	docker exec -it postgres psql -U postgres -c 'create database eldorado;'
	npm run prisma:generate
	npm run prisma:migrate

tests-run:
	docker exec -it postgres psql -U postgres -d eldorado -c 'DELETE FROM products;'
	npm run test

system-run:
	docker-compose up -d

system-stop:
	docker-compose stop

system-down:
	docker-compose down

postgres-start:
	docker-compose up -d postgres

postgres-log:
	docker-compose logs -f postgres

postgres-drop-table:
	docker exec -it postgres psql -U postgres -d eldorado -c \
	"DROP TABLE IF EXISTS products;"

postgres-ssh:
	docker exec -it postgres bash

eldorado-be-build:
	docker build -t eldorado-frs-be .

eldorado-be-run:
	docker rm -f eldorado-frs-be && \
	docker run --name eldorado-frs-be --network=host eldorado-frs-be
