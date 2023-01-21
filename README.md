# SIMPLE NODEJS SCRIPT FOR BACKUP MYSQL TO S3 OBJECT STORAGE

## Usage
Clone this repository
```bash
git clone git@github.com:man20820/nodejs-backup-mysql-s3.git
```

Set .env file and install
```bash
npm install
```

Run with node or pm2
```bash
node index.js
```

## Docker

Build docker image
```bash
docker build -t ghcr.io/man20820/nodejs-backup-mysql-s3:test .
```

Run docker container
```bash
docker run -d \
    --name nodejs-backup-mysql-s3 \
    -e S3_ENDPOINT="" \
    -e S3_ACCESS_KEY_ID="" \
    -e S3_SECRET_ACCESS_KEY="" \
    -e S3_REGION="" \
    -e S3_BUCKET="" \
    -e S3_PATH="" \
    -e MYSQL_HOST="" \
    -e MYSQL_PORT="" \
    -e MYSQL_DB="" \
    -e MYSQL_USER="" \
    -e MYSQL_PASSWORD="" \
    -e SCHEDULE="" \
    --restart always \
    ghcr.io/man20820/nodejs-backup-mysql-s3:test
```