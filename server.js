// This project aggregates review scores from ikea websites (in english: US, UK, Aus) given the lack of reviews on the Singapore website.

/*
Steps:
1. Using puppeteer, retrieve product information from search on ikea website
2. Display list of products 
3. When product is selected, send product name 
4. On each ikea website, retrieve products and reviews
5. Display products name, reviews 
*/

const express    = require("express");
const cors       = require("cors");
const bodyParser = require("body-parser");
const helmet     = require("helmet");
const axios      = require("axios");
const cheerio    = require("cheerio");
const puppeteer  = require("puppeteer");
const apiRoutes  = require('./routes/api.js');

const app        = express();

// make all the files in 'public' available
app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic helmet js protection against XSS attacks
app.use(helmet.xssFilter()); 

// Page displaying search results
app.route('/search/:product')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/search.html');
});

// Page displaying reviews
app.route('/findreviews')
  .get(function (req, res) {  
    res.sendFile(process.cwd() + '/views/reviews.html');
});

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Routing for API
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// listen for requests
app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + process.env.PORT);
});