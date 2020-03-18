NAME = plumbline
REGISTRY = gcr.io/neo4j-k8s-marketplace-public
TAG=$(shell cat package.json | grep version | egrep -o '[0-9]+\.[0-9]+\.[0-9]+')
IMAGE=$(REGISTRY)/$(NAME):$(TAG)

build:: .build/plumbline

.build/plumbline: *.js Dockerfile
	mkdir -p "$@"
	docker build \
	    --tag "$(IMAGE)" \
	    -f Dockerfile \
	    .
	docker push "$(IMAGE)"
	@touch "$@"

GCP_PROJECT=testbed-187316
NEO4J_URI ?= CONFIGURE_ENV_VAR_NEO4J_URI
NEO4J_PASSWORD ?= admin
NEO4J_USER ?= neo4j

REGION ?= us-central1

cloudrun:
	gcloud beta run deploy $(NAME) --image $(IMAGE) \
		--region $(REGION) \
		--update-env-vars NEO4J_URI=$(NEO4J_URI),NEO4J_PASSWORD=$(NEO4J_PASSWORD),NEO4J_USER=$(NEO4J_USER)