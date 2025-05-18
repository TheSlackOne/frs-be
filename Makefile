install:
	npm install
	cp .env.template .env

setup-db:
	@until docker exec postgres pg_isready -U postgres; do sleep 1; done
	docker exec -it postgres psql -U postgres -c 'create database eldorado;'
	npm run prisma:generate
	npm run prisma:migrate

tests-run:
	docker exec -it postgres psql -U postgres -d eldorado -c 'DELETE FROM products;'
	npm run test

postgres-run:
	docker run --name postgres \
		-e POSTGRES_USER=postgres \
		-e POSTGRES_PASSWORD=mysecretpass1 \
		--network host \
		-d postgres:17.4

postgres-ssh:
	docker exec -it postgres bash
