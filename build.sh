#!/bin/bash

container_image='change_this'

docker build --tag $container_image:latest .
docker push $container_image:latest