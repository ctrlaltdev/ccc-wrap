const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const { version } = require('./package.json')
const { errorHandler, checkSum, untar, downloadFile, findGitRoot, createFolderIfNotExists, createFileIfNotExists, updateFile } = require('./')

console.info(path.resolve(path.join(__dirname, '..', 'package.json')))

if (fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
  console.warn('Skipping ccc installation as this is not a root dependency')
  process.exit(0)
}

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

const main = async () => {
  const baseURL = 'https://github.com/ctrlaltdev/ccc/releases/download/'
  const archive = `ccc-${os}-${arch}.tar.gz`
  const url = baseURL + version + `/${archive}`
  const shaURL = url + '.sha256'
  
  try {
    if (!fs.existsSync(path.join(__dirname, 'ccc'))) {
      const binRes = await fetch(url)
      await downloadFile(path.join(__dirname, archive), binRes)

      const shasum = await fetch(shaURL).then(r => r.text()).then(r => r.split(' ')[0])

      const sumChecked = await checkSum(path.join(__dirname, archive), shasum)
      if (!sumChecked) {
        fs.unlinkSync(path.join(__dirname, archive))
        console.warn('We couldn\'t verify the integrity of the file. Stopping ccc binary installation for security reasons.')
        process.exit(0)
      }

      await untar(path.join(__dirname, archive))
      fs.unlinkSync(path.join(__dirname, archive))
    }

    const dir = findGitRoot()
    if (!dir) {
      console.warn('No git repository found in parent folders. Skipping hook installation.')
      process.exit(0)
    }

    const hooksdir = path.join(dir, '.git', 'hooks')
    const hookfile = path.join(hooksdir, 'commit-msg')

    createFolderIfNotExists(hooksdir)
    createFileIfNotExists(hookfile, 0755)
    
    const cmd = `./${path.relative(dir, path.resolve(path.join(__dirname, 'ccc')))} $@\n`

    updateFile(hookfile, cmd)
  } catch (e) {
    errorHandler(e)
  }
}

main()
