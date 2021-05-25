const fs = require('fs')
const crypto = require('crypto')
const { exec } = require('child_process')

const errorHandler = (err) => {
  console.error(err)
  process.exit(1)
}

const downloadFile = async (path, res) => {
  const stream = fs.createWriteStream(path)
  return new Promise((resolve, reject) => {
    res.body.pipe(stream)
    res.body.on('error', reject)
    stream.on('finish', resolve)
  })
}

const checkSum = async (path, sum, algo = 'sha256') => {
  const hash = crypto.createHash(algo)
  const stream = fs.ReadStream(path)
  return new Promise((resolve, reject) => {
    stream.on('error', reject)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => {
      const hashsum = hash.digest('hex')
      resolve(hashsum === sum)
    })
  })
}

const untar = async (path) => {
  return new Promise((resolve, reject) => {
    exec(`tar xzf ${path}`, (error, stdout, stderr) => {
      if (error) reject(error)
      if (stderr) reject(stderr)
      resolve(stdout)
    })
  })
}

module.exports = {
  errorHandler,
  downloadFile,
  checkSum,
  untar
}
