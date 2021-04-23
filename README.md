# lambda-alb-proxy

Very basic Docker image. Point it at another container that has the [Lambda RIE](rie) using the `LAMBDA_HOST` env var like the images on the `public.ecr.aws/lambda/` registry and it will act like an API Gateway/ALB proxy.

[rie]: https://github.com/aws/aws-lambda-runtime-interface-emulator
