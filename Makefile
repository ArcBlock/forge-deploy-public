TOP_DIR=.
ENV=~/.envs
README=$(TOP_DIR)/README.md

VERSION=$(strip $(shell cat version))

SCRIPTS=deploy vault

build:
	@echo "Building the software..."

init: install dep
	@echo "Initializing the repo..."
	@cd tools; yarn install

travis-init:
	@echo "Initialize software required for travis (normally centos software)"

install:
	@echo "Install software required for this repo..."
	@brew install pwgen || true
	@brew install ansible || true

dep:
	@echo "Install dependencies required for this repo..."
	@cd tools; npm install
	@pip install boto3

pre-build: install dep
	@echo "Running scripts before the build..."

post-build:
	@echo "Running scripts after the build is done..."

all: pre-build build post-build

test:
	@echo "Running test suites..."

lint:
	@echo "Linting the software..."
	# @cd src; ansible-lint abt_chain roles/*

doc:
	@echo "Building the documenation..."

precommit: dep lint doc build test

travis: precommit

travis-deploy: release
	@echo "Deploy the software by travis"

clean:
	@echo "Cleaning the build..."

gen-password:
	@pwgen -n1vs 32 | tee ./src/.vault_password

$(SCRIPTS):
	@node tools/$@.js

include .makefiles/release.mk

.PHONY: build init travis-init install dep pre-build post-build all test doc precommit travis clean bump-version create-pr
