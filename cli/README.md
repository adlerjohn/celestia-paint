# celestia-paint backend

## Setup

Ensure celestia-app is installed: https://docs.celestia.org/nodes/celestia-app

Create key used by celestia-paint

```bash
celestia-appd keys add --keyring-backend='test' celestia-paint
```

```bash
go mod tidy
```

## Install

```bash
make build
```

## Run

```bash
./celestia-paint
```

Example:

```bash
./celestia-paint --grpc.address='consensus-full-mocha-4.celestia-mocha.com:9090' -x='0' -y='0' -c='#000000'
```

If you receive the error message that the account was not found, you need to fund the shown account with some tokens.

Now you can use the tx hash to browse an explorer to see the contents of the blob.
