const http = require('http');

const SERVER_PORT = 8080;

let payload_storage = null;

let server = http.createServer(function(req, res) {

  if (req.method == 'GET') {
    console.log('Received an HTTP GET request...');
  }
  else if(req.method == 'POST') {
    console.log('Received an HTTP POST request...');

    // at some point move this parsing into a helper function
    let body = '';
    req.on('data', function(chunks) {
      body += chunks.toString();
    });

    req.on('end', function() {
      console.log(`Posted Data: ${body}`);
      console.log(`Parsed Json: ${JSON.parse(body)["location"]}`)
    });
  }

  /* This set of statements allows the client to talk to the test server.
  CORS will give you issues otherwise. */
  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
  res.writeHead(200, { 'Content-Type': 'text/plain' });

  res.end();

});

server.listen(SERVER_PORT, function() {
  console.log(`Server is now listening on port ${SERVER_PORT}`);
});
