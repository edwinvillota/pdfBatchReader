const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const OCRService = require('../services/OCRService');
const pdf2image = require('pdf2image');
const jimp = require('jimp');

class PdfService {
  idIsValid(id) {
    try {
      if (
        fs.existsSync(`${path.dirname(require.main.filename)}/files/${id}.pdf`)
      ) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async getPreview({ id, page = 1 }) {
    return new Promise((resolve, reject) => {
      const filepath = `${path.dirname(require.main.filename)}/files/${id}.pdf`;

      pdf2image
        .convertPDF(filepath, {
          density: 100,
          quality: 100,
          outputType: '.jpg',
          outputFormat: `${path.dirname(
            require.main.filename
          )}/tempImages/${id}`,
          singleProcess: true,
          pages: `${page}`,
        })
        .then((file) => {
          jimp.read(file[0].path).then((img) => {
            img.getBase64(jimp.MIME_JPEG, (err, base64) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({ base64, size: img._exif.imageSize });
            });
          });
        })
        .catch((err) => reject(err));
    });
  }

  async getPdfData(id) {
    return new Promise((resolve, reject) => {
      try {
        const buffer = fs.readFileSync(
          `${path.dirname(require.main.filename)}/files/${id}.pdf`
        );

        pdf(buffer).then((data) => {
          resolve(data);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAllPagesData({ id, areas, socket }) {
    try {
      const { numpages } = await this.getPdfData(id);

      const filepath = `${path.dirname(require.main.filename)}/files/${id}.pdf`;
      const ocr = new OCRService();
      const csvPath = `${path.dirname(require.main.filename)}/csv/${id}.csv`;

      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }

      const csv = fs.createWriteStream(csvPath, {
        flags: 'a',
      });

      for (let i = 1; i <= numpages; i++) {
        await pdf2image
          .convertPDF(filepath, {
            density: 100,
            quality: 100,
            outputType: 'jpg',
            outputFormat: `${path.dirname(
              require.main.filename
            )}/tempImages/${id}`,
            singleProcess: true,
            pages: `${i}`,
          })
          .then(async (file) => {
            await ocr
              .areasRecognitionV2(file[0].path, areas)
              .then((data) => {
                const dataString = data.map((d) => d.text);
                if (i === 1) {
                  csv.write(`${data.map((d) => d.name).join(';')}\n`);
                }
                csv.write(`${dataString.join(';')}\n`);
                socket.emit('pdfProgress', {
                  file: id,
                  page: i,
                  total: numpages,
                  data,
                });
              })
              .catch((error) =>
                socket.emit('pdfProgress', {
                  file: id,
                  page: i,
                  total: numpages,
                  error: error.message,
                  data: [],
                })
              );
          });
      }

      csv.end();

      // return results;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

module.exports = PdfService;
