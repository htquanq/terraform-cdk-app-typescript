SHELL := /bin/bash
define npm_install
	npm ci
endef

synth-rds:
	shopt -s expand_aliases;
	$(call npm_install)
# 	sed -i "s/environment_to_replace/demo/g" cdktf.json;
	STACK_NAME="rds" cdktf synth ;

deploy-rds:
# 	sed -i "s/environment_to_replace/demo/g" cdktf.json;
	STACK_NAME="rds" cdktf deploy;