# Serverless image resizer

## Introduction

This is an app to resize images uploaded to S3 in a serverless way.
A simple web fronted using HTML and JavaScript provides a way for users to upload images that are resized and listed. 
We use a Lambda to generate S3 pre-signed URLs so the upload form can upload directly to S3 rather than going through the Lambda.
S3 bucket notifications are used to trigger a Python Lambda that runs image resizing.
Another Lambda is used to list all uploaded and resized images, and provide pre-signed URLs for the browser to display them.
We also demonstrate how Lambda failures can submit to SNS, which can then trigger an SES email.
Using the LocalStack internal `/_localstack/aws/ses` endpoint, we can run end-to-end integration tests to verify that emails have been sent correctly.

Here's a short summary of AWS service features we use:
* S3 bucket notifications to trigger a Lambda
* S3 pre-signed POST
* S3 website
* Lambda function URLs
* Lambda SNS on failure destination
* SNS to SES Subscriptions
* SES LocalStack testing endpoint

Here's the web application in action:

https://user-images.githubusercontent.com/3996682/229314248-86122e9e-0150-4292-b889-401e6fb8f398.mp4

Moreover, the repo includes a GitHub actions workflow to demonstrate how to run end-to-end tests of your AWS apps using LocalStack in CI.
The GitHub workflow runs a set of integration tests using pytest.

## Architecture overview

![Screenshot at 2023-04-02 01-32-56](https://user-images.githubusercontent.com/3996682/229322761-92f52eec-5bfb-412a-a3cb-8af4ee1fed24.png)

## Prerequisites

### Dev environment

Make sure you use the same version as the Python Lambdas to make Pillow work.
If you use pyenv, then first install and activate Python 3.13:

```bash
brew install pyenv localstack awscli-local
pyenv install 3.13.3
pyenv global 3.13.3
```

```console
% python --version
Python 3.13.x
```

Create a virtualenv and install all the development dependencies there:

```bash
make install
```


Start LocalStack

```bash
make start
```

Deploy locally on LocalStack

```bash
make deploy
```

Now open the Web app under [https://webapp.s3-website.localhost.localstack.cloud:4566/](https://webapp.s3-website.localhost.localstack.cloud:4566/)

### Terraform

To create the infrastructure using Terraform, run the following commands:

```shell
cd deployment/terraform
tflocal init
tflocal apply --auto-approve
```

We are using the `tflocal` wrapper to configure the local service endpoints, and send the API requests to LocalStack, instead of AWS.

### AWS CLI

You can execute the following commands to set up the infrastructure using `awslocal`. All the commands are also available in the `deployment/awslocal/deploy.sh` script.

#### Create the buckets

The names are completely configurable via SSM:

```bash
awslocal s3 mb s3://localstack-thumbnails-app-images
awslocal s3 mb s3://localstack-thumbnails-app-resized
```

#### Put the bucket names into the parameter store

```bash
awslocal ssm put-parameter --name /localstack-thumbnail-app/buckets/images --type "String" --value "localstack-thumbnails-app-images"
awslocal ssm put-parameter --name /localstack-thumbnail-app/buckets/resized --type "String" --value "localstack-thumbnails-app-resized"
```

#### Create the DLQ Topic for failed lambda invokes

```bash
awslocal sns create-topic --name failed-resize-topic
```

Subscribe an email address to it (to alert us immediately if an image resize fails!).

```bash
awslocal sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:000000000000:failed-resize-topic \
    --protocol email \
    --notification-endpoint my-email@example.com
```

#### Create the lambdas

##### S3 pre-signed POST URL generator

This Lambda is responsible for generating pre-signed POST URLs to upload files to an S3 bucket.

```bash
(cd lambdas/presign; rm -f lambda.zip; zip lambda.zip handler.py)
awslocal lambda create-function \
    --function-name presign \
    --runtime python3.13 \
    --timeout 10 \
    --zip-file fileb://lambdas/presign/lambda.zip \
    --handler handler.handler \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --environment Variables="{STAGE=local}"
```

Create the function URL:

```bash
awslocal lambda create-function-url-config \
    --function-name presign \
    --auth-type NONE
```

Copy the `FunctionUrl` from the response, you will need it later to make the app work.

#### Image lister lambda

The `list` Lambda is very similar:

```bash
(cd lambdas/list; rm -f lambda.zip; zip lambda.zip handler.py)
awslocal lambda create-function \
    --function-name list \
    --handler handler.handler \
    --zip-file fileb://lambdas/list/lambda.zip \
    --runtime python3.13 \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --environment Variables="{STAGE=local}"
```

Create the function URL:

```bash
awslocal lambda create-function-url-config \
    --function-name list \
    --auth-type NONE
```

#### Resizer Lambda

```bash
(
    cd lambdas/resize
    rm -rf package lambda.zip
    mkdir package
    pip install -r requirements.txt -t package --platform manylinux2014_x86_64 --only-binary=:all:
    zip lambda.zip handler.py
    cd package
    zip -r ../lambda.zip *;
)
awslocal lambda create-function \
    --function-name resize \
    --runtime python3.13 \
    --timeout 10 \
    --zip-file fileb://lambdas/resize/lambda.zip \
    --handler handler.handler \
    --dead-letter-config TargetArn=arn:aws:sns:us-east-1:000000000000:failed-resize-topic \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --environment Variables="{STAGE=local}"
```

#### Connect the S3 bucket to the resizer lambda

```bash
awslocal s3api put-bucket-notification-configuration \
    --bucket localstack-thumbnails-app-images \
    --notification-configuration "{\"LambdaFunctionConfigurations\": [{\"LambdaFunctionArn\": \"$(awslocal lambda get-function --function-name resize | jq -r .Configuration.FunctionArn)\", \"Events\": [\"s3:ObjectCreated:*\"]}]}"
```

#### Create the static s3 webapp

```bash
awslocal s3 mb s3://webapp
awslocal s3 sync --delete ./website s3://webapp
awslocal s3 website s3://webapp --index-document index.html
```

#### Using the application

Once deployed, visit http://webapp.s3-website.localhost.localstack.cloud:4566

Paste the Function URL of the presign Lambda you created earlier into the form field.
```bash
awslocal lambda list-function-url-configs --function-name presign
awslocal lambda list-function-url-configs --function-name list
```

After uploading a file, you can download the resized file from the `localstack-thumbnails-app-resized` bucket.

### Testing failures

If the `resize` Lambda fails, an SNS message is sent to a topic that an SES subscription listens to.
An email is then sent with the raw failure message.
In a real scenario you'd probably have another lambda sitting here, but it's just for demo purposes.
Since there's no real email server involved, you can use the [SES developer endpoint](https://docs.localstack.cloud/user-guide/aws/ses/) to list messages that were sent via SES:

```bash
curl -s http://localhost.localstack.cloud:4566/_aws/ses
```

An alternative is to use a service like MailHog or smtp4dev, and start LocalStack using `SMTP_HOST=host.docker.internal:1025` pointing to the mock SMTP server.

### Run integration tests

Once all resource are created on LocalStack, you can run the automated integration tests.

```bash
pytest tests/
```

### GitHub Action

The demo LocalStack in CI, `.github/workflows/integration-test.yml` contains a GitHub Action that starts up LocalStack,
deploys the infrastructure to it, and then runs the integration tests.

## Contributing

We appreciate your interest in contributing to our project and are always looking for new ways to improve the developer experience. We welcome feedback, bug reports, and even feature ideas from the community.
Please refer to the [contributing file](CONTRIBUTING.md) for more details on how to get started. 

## Cloud Pods

[Cloud Pods](https://docs.localstack.cloud/user-guide/tools/cloud-pods/) are a mechanism that allows you to take a snapshot of the state in your current LocalStack instance, persist it to a storage backend, and easily share it with your team members.

You can convert your current AWS infrastructure state to a Cloud Pod using the `localstack` CLI. 
Check out our [Getting Started guide](https://docs.localstack.cloud/user-guide/cloud-pods/getting-started/) and [LocalStack Cloud Pods CLI reference](https://docs.localstack.cloud/user-guide/cloud-pods/pods-cli/) to learn more about Cloud Pods and how to use them.

To inject a Cloud Pod you can use [Cloud Pods Launchpad](https://docs.localstack.cloud/user-guide/cloud-pods/launchpad/) wich quickly injects Cloud Pods into your running LocalStack container. 

Click here [![LocalStack Pods Launchpad](https://localstack.cloud/gh/launch-pod-badge.svg)](https://app.localstack.cloud/launchpad?url=https://github.com/localstack/sample-serverless-image-resizer-s3-lambda/releases/download/latest/release-pod.zip) to launch the Cloud Pods Launchpad and inject the Cloud Pod for this application by clicking the `Inject` button.


Alternatively, you can inject the pod by using the `localstack` CLI. 
First, you need to download the pod you want to inject from the [releases](https://github.com/localstack/sample-serverless-image-resizer-s3-lambda/releases).
Then run:

```sh
localstack state import /path/to/release-pod.zip
```
