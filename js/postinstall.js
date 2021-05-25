const fs = require('fs')
const crypto = require('crypto')
const fetch = require('node-fetch')
const { exec } = require("child_process")

const { version } = require('./package.json')

const archMap = {
  x64: 'amd64',
  arm64: 'arm64'
}

const osMap = {
  darwin: 'darwin',
  linux: 'linux'
}

const arch = archMap[process.arch]
const os = osMap[process.platform]

if (!arch || !os) {
  console.error(`Your OS or your architecture is not supported (${process.platform} ${process.arch}).\nSupported OS are: ${Object.keys(osMap).join(', ')}.\nSupported Arch are: ${Object.keys(archMap).join(', ')}`)
  process.exit(1)
}

const errorHandler = (err) => {
  console.error(err)
  process.exit(1)
}

const downloadFile = async (path, res) => {
  const stream = fs.createWriteStream(path)
  return new Promise((resolve, reject) => {
    res.body.pipe(stream)
    res.body.on("error", reject)
    stream.on("finish", resolve)
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

const main = async () => {
  const baseURL = 'https://github.com/ctrlaltdev/ccc/releases/download/'
  const archive = `ccc-${os}-${arch}.tar.gz`
  const url = baseURL + version + `/${archive}`
  const shaURL = url + '.sha256'
  
  try {
    const binRes = await fetch(url)
    await downloadFile(archive, binRes)

    const shasum = await fetch(shaURL).then(r => r.text()).then(r => r.split(' ')[0])

    const sumChecked = await checkSum(archive, shasum)
    if (!sumChecked) {
      throw new Error('We couldn\'t verify the integrity of the file.')
    }

    await untar(archive)
  } catch (e) {
    errorHandler(e)
  }
}

main()
