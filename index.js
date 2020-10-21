const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Configuration
const { config } = require('./config');

// Routes
const uploadApi = require('./routes/upload');
const pdfApi = require('./routes/pdf');

// Websockets
require('./socket/index')(io);

// Middlewares
const notFoundHandler = require('./utils/middlewares/notFoundHandler');
const {
  logErrors,
  wrapError,
  errorHandler,
} = require('./utils/middlewares/errorHandlers');

// Cors
const corsOptions = {
  origin: 'http://localhost:8080',
};

// Use
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use((req, res, next) => {
  (res.io = io), next();
});

// Active Routes
uploadApi(app);
pdfApi(app);

// NotFound
app.use(notFoundHandler);

// Error Handlers
app.use(logErrors);
app.use(wrapError);
app.use(errorHandler);

// app.listen(config.port, () => {
//   console.log(`Listening http://localhost:${config.port}`);
// });

http.listen(config.port, () => {
  console.log(`Listening http://localhost:${config.port}`);
});
