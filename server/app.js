/*
Copyright (c) 2017, ZOHO CORPORATION
License: MIT
*/
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var morgan = require('morgan');
var serveIndex = require('serve-index');
var https = require('https');
var chalk = require('chalk');
const axios = require('axios');
process.env.PWD = process.env.PWD || process.cwd();

var expressApp = express();
var port = process.env.PORT || 50000;

console.log('test::'+process.env.myname);
expressApp.set('port', port);
expressApp.use(morgan('dev'));
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(errorHandler());


expressApp.use('/', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
// expressApp.use(cors({
//   origin: 'https://crm.zoho.com'
// }));
expressApp.get('/plugin-manifest.json', function (req, res) {
  res.sendfile('plugin-manifest.json');
});

expressApp.use('/app', express.static('app'));
expressApp.use('/app', serveIndex('app'));


expressApp.get('/', function (req, res) {
  res.redirect('/app');
});

var options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};
const clientId = "1000.ASUBTHHM42Y6IKGEM9QKX0Z3O9KP4O";
const clientSecret = "ac6b1ad4bef873dc09df47a9a03685a9ba470357d0";
const redirectUri = "https://crm.zoho.com/crm/org730932612";
const refreshToken = "1000.0d5832856292297a31191f6c9ee3d0e3.1ca05bcea6e676b7ddb0276cd762ae14";

// Route to retrieve OAuth access token

expressApp.get('/fetch-zoho-details', async (req, res) => {
  try {
    // const recordId = req.query.recordid;
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);
    params.append('redirect_uri', redirectUri);

    const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('accessToken'+accessToken);
    const zohoResponse = await axios.get(`https://www.zohoapis.com/crm/v2/Running_Campaigns`, {
     headers: {
         Authorization: `Zoho-oauthtoken ${accessToken}`
     }
  });
  res.json(zohoResponse.data);
  } catch (error) {
      res.status(500).send('Error fetching data from Zoho: ' + error.message);
  }
});

expressApp.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
https.createServer(options, expressApp).listen(port, function () {
  console.log(chalk.green('Zet running at ht' + 'tps://127.0.0.1:' + port));
  console.log(chalk.bold.cyan("Note: Please enable the host (https://127.0.0.1:"+port+") in a new tab and authorize the connection by clicking Advanced->Proceed to 127.0.0.1 (unsafe)."));
}).on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    console.log(chalk.bold.red(port + " port is already in use"));
  }
});
