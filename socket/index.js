function socket(io) {
  io.sockets.on('connection', function (socket) {
    socket.on('pdfProgress', (data) => {
      console.log(data);
    });

    return socket;
  });
}

module.exports = socket;
