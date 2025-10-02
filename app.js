const express = require('express')
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

const ZingMp3Router = require('./routers/api/ZingRouter')
app.use('/api', cors(), ZingMp3Router)

app.get('*', (req, res) => {
  res.send('Nhập Sai Đường Dẫn! Vui Lòng Nhập Lại >.<')
})

module.exports = app


