const axios = require('axios')
const fs = require('fs')
const log4js = require('log4js')
let logger = log4js.getLogger()
logger.level = 'debug'

class Downloader {
  constructor(parallelCount) {
    this._parallelCount = parallelCount
    this._maxParallel = 10
    this._parallelCount = 0
    this._queue = []
    for (let i = 0; i < parallelCount; i++) {
      this._pushDownloadQueue(i)
    }
  }

  _pushDownloadQueue(count) {
    this._queue.push(new Promise((resolve, reject) => {
      let interval = setInterval(() => {
        if (this._parallelCount >= this._maxParallel) {
          return
        }
        clearInterval(interval)
        this._parallelCount++
        logger.info(this._parallelCount)

        axios.get('http://localhost:3000/down', {
          responseType: 'stream'
        })
          .then(response => {
            response.data.pipe(fs.createWriteStream(`dest/${count}`))
            response.data.on('end', () => this._parallelCount--)
            resolve()
          })
          .catch(error => {
            logger.error(error)
            reject()
          })
      }, 1000)
    }))
  }

  async downloadAll() {
    await Promise.all(this._queue)
  }
}

const downloader = new Downloader(50)
downloader.downloadAll()