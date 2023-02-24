require('dotenv').config()
const { exec } = require('child_process')
const AWS = require('aws-sdk')
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

const retention = process.env.RETENTION
const schedule = process.env.SCHEDULE

const path = process.env.S3_PATH

let filename = null
let command = null
let date = null
let fullFilename = null
let keys = null
let keyName = []
let files = null

AWS.config.update({
  endpoint,
  accessKeyId,
  secretAccessKey,
  region
})

const s3 = new AWS.S3()

;(async () => {
  const generateCommand = async () => {
    date = new Date()
    filename = `backup-${mysqlDB}-${date.toISOString()}.sql`
    command = `mysqldump -P ${mysqlPort} -h ${mysqlHost} -u ${mysqlUser} -p${mysqlPassword} ${mysqlDB} > ${filename}`
    fullFilename = path + filename
  }

  const backup = async () => {
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
      const uploadParams = {
        Bucket: bucket,
        Key: fullFilename,
        Body: file
      }

      // Upload the file to S3
      const uploadFile = async () => {
        await s3.upload(uploadParams, function (err, data) {
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
      uploadFile()
    })
  }

  const listParam = {
    Bucket: bucket,
    Prefix: path
  }

  const getListFiles = () => {
    const files = new Promise(function (resolve, reject) {
      s3.listObjects(listParam, function (err, data) {
        if (err) {
          return reject(err)
        }
        resolve(data.Contents)
      })
    })
    return files
  }

  const addFilesToArray = async () => {
    console.log('4', keys)
    for (let index = 0; index < keys.length; index++) {
      const element = files[index].Key
      console.log('5', element)
      keyName.push(element)
    }
    console.log('aaa', keyName)
    for (let index = 0; index < retention; index++) {
      keyName.pop()
    }
    console.log('bbb', keyName)
  }

  const deleteObject = async (bucket, key) => {
    const params = { Bucket: bucket, Key: key }
    await s3.deleteObject(params).promise()
  }

  const deleteFile = async () => {
    for (let index = 0; index < keyName.length; index++) {
      const element = keyName[index]
      console.log('1', element)
      deleteObject(bucket, element)
    }
  }

  cron.schedule(`${schedule}`, async () => {
    try {
      await generateCommand()
      files = await getListFiles()
      keys = Object.keys(files)
      await backup()
      await addFilesToArray()
      await deleteFile()
      keyName = []
    } catch (err) {
      console.error(err)
    }
  })
})()
