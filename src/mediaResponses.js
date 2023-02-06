const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const getMedia = (filename, request, response) => {
  const file = path.resolve(__dirname, `../client/${filename}`);
  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }
    let { range } = request.headers;
    if (!range) {
      range = 'bytes=0-';
    }
    const positions = range.replace('bytes=', '').split('-');

    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    if (start > end) {
      start = end - 1;
    }

    const chunkSize = (end - start) + 1;
    const contentType = response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mime.lookup(filename),
    });

    const stream = fs.createReadStream(file, { start, end });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });
    return stream;
  });
};

module.exports.getMedia = getMedia;
