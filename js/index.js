const fs = require('fs')
const path = require('path')
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

const findGitRoot = (dir = __dirname) => {
  const p = path.resolve(dir).split(path.sep)
  if (fs.existsSync(path.resolve(p.join(path.sep), '.git'))) {
    return dir
  }
  const next = p.slice(0, -1)
  if (next.length === 1 && next[0] === '') return null
  return findGitRoot(path.resolve(next.join(path.sep)))
}

const createFolderIfNotExists = (dir, mode = 0744) => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, mode)
    return true
  }
  return false
}

const createFileIfNotExists = (filepath, mode = 0744) => {
  if (!fs.existsSync(filepath)){
    fs.writeFileSync(filepath, '', { mode })
    return true
  }
  return false
}

const updateFile = (filepath, content) => {
  const data = fs.readFileSync(filepath).toString()
  if (data.indexOf(content) === -1) {
    fs.writeFileSync(filepath, data + '\n' + content)
    return true
  }
  return false
}

module.exports = {
  errorHandler,
  downloadFile,
  checkSum,
  untar,
  findGitRoot,
  createFolderIfNotExists,
  createFileIfNotExists,
  updateFile
}
