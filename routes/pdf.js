const express = require('express');
const boom = require('@hapi/boom');
const path = require('path');
const fs = require('fs');

// Services
const PdfService = require('../services/PdfService');
const OCRService = require('../services/OCRService');

function pdfApi(app) {
  const router = express.Router();
  app.use('/api/pdf', router);

  router.post('/preview', async function (req, res, next) {
    const pdfService = new PdfService();
    const { file } = req.body;

    if (pdfService.idIsValid(file)) {
      try {
        const data = await pdfService.getPreview({ id: file });
        res.status(200).json({ base64: data.base64, size: data.size });
      } catch (err) {
        console.log(err);
      }
    } else {
      next(boom.badRequest('The file doesnt exists'));
    }
  });

  router.post('/previewData', async function (req, res, next) {
    const { file, areas } = req.body;

    const ocr = new OCRService();
    const filePath = `${path.dirname(
      require.main.filename
    )}/tempImages/${file}.jpg`;

    try {
      const data = await ocr.areasRecognitionV2(filePath, areas);
      res.status(200).json(data);
    } catch (e) {
      next(boom.internal('Error', e));
    }
  });

  router.post('/recognizeAll', async function (req, res) {
    const { file: id, areas } = req.body;
    const { io: socket } = res;
    const pdfService = new PdfService();

    pdfService.getAllPagesData({ id, areas, socket });

    res.status(200).json({ message: 'In process' });
  });

  router.get('/downloadCsv/:id', async function (req, res, next) {
    const { id } = req.params;
    const filePath = `${path.dirname(require.main.filename)}/csv/${id}.csv`;

    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      next(boom.notFound('File not found'));
    }
  });
}

module.exports = pdfApi;
