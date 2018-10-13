const express = require('express');
const multer = require("multer");
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const credentials = require('./config/credentials');
const path = require('path');
const formidable = require('express-formidable');
const cloudinary = require('cloudinary');

require('dotenv').config();

aws.config.update({
  secretAccessKey: credentials.secretAccessKey,
  accessKeyId: credentials.accessKeyId,
  region: credentials.region
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
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

app.post('/uploadimage', formidable(), (req, res) => {
  cloudinary.uploader.upload(req.files.selectedFile.path, (result) =>
    {
      console.log(result);
      if(result.error) {
        res.status(400).send({
          error: result.error.message
        })
      }
      res.status(200).send({
        public_id: result.public_id,
        url: result.url
      })
    },
    {
      public_id: `${Date.now()}`,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png']
    })
});

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