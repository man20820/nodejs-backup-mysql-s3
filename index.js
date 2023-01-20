require('dotenv').config()
const { exec } = require('child_process')
const AWS = require('aws-sdk')
const date = new Date()
const fs = require('fs')
const fsp = require('fs').promises
const cron = require('node-cron')

const endpoint = process.env.S3_ENDPOINT
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
const region = process.env.S3_REGION
const bucket = process.env.S3_BUCKET

const mysqlHost = process.env.MYSQL_HOST
const mysqlPort = process.env.MYSQL_PORT
const mysqlDB = process.env.MYSQL_DB
const mysqlUser = process.env.MYSQL_USER
const mysqlPassword = process.env.MYSQL_PASSWORD

const filename = `backup-${mysqlDB}-${date.toISOString().slice(0, 10)}.sql`
const path = process.env.S3_PATH
const fullFilename = path + filename

cron.schedule('*/20 * * * * *', async () => {
    try {
      await backup()
    } catch (err) {
      console.error(err)
    }
  })

// console.log(fullFilename)

AWS.config.update({
  endpoint,
  accessKeyId,
  secretAccessKey,
  region
})

const s3 = new AWS.S3()

const command = `mysqldump -P ${mysqlPort} -h ${mysqlHost} -u ${mysqlUser} -p${mysqlPassword} ${mysqlDB} > ${filename}`

const backup = () => {

exec(command, (err, stdout, stderr) => {
  if (err) {
    console.error(`exec error: ${err}`)
    return
  }

  console.log(`stdout: ${stdout}`)
  console.log(`stderr: ${stderr}`)

  // Create a read stream for the file
  const file = fs.createReadStream(filename)

  // Define the S3 upload parameters
  const params = {
    Bucket: bucket,
    Key: fullFilename,
    Body: file
  }

  // Upload the file to S3
  const upload = async () => {
    await s3.upload(params, function (err, data) {
      if (err) {
        console.log('Error uploading file: ', err)
      } else {
        console.log('File successfully uploaded to S3: ', data.Location)
      }
    })

    fsp.unlink(filename)
      .then(() => {
        console.log(filename, 'dihapus')
      })
      .catch((err) => {
        console.error(err)
      })
  }
  upload()
})
}