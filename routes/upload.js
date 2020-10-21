const express = require('express');
const boom = require('@hapi/boom');
const crypto = require('crypto');
const path = require('path');

// Services

function uploadApi(app) {
  const router = express.Router();
  app.use('/api/upload', router);

  router.get('/', async function (req, res) {
    res.status(200).json({ message: 'API is working...' });
  });

  router.post('/', async function (req, res, next) {
    if (!req.files) {
      return next(boom.badRequest('Missing file'));
    }

    const pdf = req.files.file;
    const hash = crypto.randomBytes(20).toString('hex');

    pdf.mv(
      `${path.dirname(require.main.filename)}/files/${hash}.pdf`,
      (err) => {
        if (err) {
          next(err);
        }

        res.status(200).json({ message: 'Sucessfully', hash: hash });
      }
    );
  });
}

module.exports = uploadApi;
