const tesseract = require('node-tesseract-ocr');
const jimp = require('jimp');

class OCRService {
  constructor() {
    this.config = {
      lang: 'spa',
      oem: 1,
      psm: 6,
    };
  }

  async areasRecognitionV2(path, areas) {
    return new Promise((resolve, reject) => {
      const areasResults = areas.map(
        (a, i) =>
          new Promise((resolve, reject) => {
            jimp.read(path).then((img) => {
              img
                .crop(a.x, a.y, a.width, a.height)
                .writeAsync(`./tempAreas/area${i}.png`)
                .then(() => {
                  tesseract
                    .recognize(`./tempAreas/area${i}.png`, this.config)
                    .then((text) =>
                      resolve({
                        name: a.name,
                        text: text.replace('\n', '').replace('\f', ''),
                      })
                    )
                    .catch((err) => reject(err));
                })
                .catch((err) => reject(err));
            });
          })
      );

      Promise.all(areasResults).then(
        (values) => {
          resolve(values);
        },
        (errors) => {
          reject(errors);
        }
      );
    });
  }
}

module.exports = OCRService;
