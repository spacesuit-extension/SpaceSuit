const fs = require('fs')
const {ncp} = require('ncp')
const Bundler = require('parcel-bundler')
const Path = require('path')

// parcel build --no-minify --public-url / --out-dir integration-test/build integration-test/index.html && cp -R manifest.json icons/ dist/

async function bundle(file, options = {}) {
  options = Object.assign({
    minify: false,
    publicUrl: '/',
    outDir: 'dist',
    watch: false,
    // cache: false // Causes more trouble than it saves
  }, options)
  let bundler = new Bundler(Path.join(__dirname, file), options)
  bundler.on('buildError', () => {process.exit(1)})
  let bundled = await bundler.bundle()
  if (!bundled) throw new Error('Bundling failure')
  return bundled
}

async function build () {
  await bundle('inpage.js', {
    outDir: 'build'
  })
  let inPageScript = fs.readFileSync(Path.join(__dirname, 'build/inpage.js'), 'utf-8')
  fs.writeFileSync(Path.join(__dirname, 'build/inpage.json'), JSON.stringify(inPageScript))
  await bundle('content.js')
  await bundle('options.html')
  await bundle('integration-test/index.html', {
    outDir: 'integration-test/build'
  })
  fs.copyFileSync('manifest.json', 'dist/manifest.json')
  await new Promise((resolve, reject) => {
    ncp('icons', 'dist/icons', {clobber: true}, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

build()
