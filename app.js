const express = require('express');
const multer = require("multer");
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const credentials = require('./config/credentials');
const path = require('path');

aws.config.update({
  secretAccessKey: credentials.secretAccessKey,
  accessKeyId: credentials.accessKeyId,
  region: credentials.region
});

// Init app
const app = express();
const s3 = new aws.S3();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
  next();
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'stanos-images',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: 'inline',
    key: (req, file, cb) => {
      cb(null, `${ Date.now() }-${ file.originalname }`);
    }
  }),
  limits: {fileSize: 1000000},
  fileFilter: (req, file, cb) => {
    // reject a file
    if (file.mimetype === "image/jpeg" || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb('Please upload images Only!');
    }
  }
}).single('selectedFile');

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send({msg: err});
    } else {
      if (req.file === undefined) {
        res.status(400).send({msg: 'Please specify image'});
      } else {
        res.json({
          msg: 'File Uploaded!',
          file: `${req.file.location}`
        });
      }
    }
  });
});

app.get('/test', (req, res) => res.json({ msg: 'It Works' }));

// Server static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}


const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));