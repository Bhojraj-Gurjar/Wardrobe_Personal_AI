const fs = require('fs');
const path = require('path');
const http = require('http');

const docsUrl = process.env.API_DOCS_URL || 'http://localhost:3000/docs-json';
const outputPath = path.join(__dirname, '..', 'docs', 'openapi.json');

function fetchOpenApi(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (response.statusCode >= 400) {
            reject(new Error(`HTTP ${response.statusCode} from ${url}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

fetchOpenApi(docsUrl)
  .then((document) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
    console.log(`OpenAPI spec exported to ${outputPath}`);
  })
  .catch((error) => {
    console.error('Could not export OpenAPI spec.');
    console.error('Start the API first: npm start');
    console.error(error.message);
    process.exit(1);
  });
