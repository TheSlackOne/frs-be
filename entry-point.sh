#!/bin/sh
set -e

make start-db
make tests-run
