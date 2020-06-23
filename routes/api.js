'use strict';

const mongoose  = require('mongoose');
const puppeteer = require('puppeteer');
const cheerio   = require('cheerio');

// Schemas to save product data 
var productSchema = new mongoose.Schema({
  _id: String, 
  country: String, 
  name: String,
  type: String,
  price: String, 
  created_on: Date,
  updated_on: Date
});

var product = mongoose.model("product", productSchema);

module.exports = function (app) {
  
  app.route('/')
  
  .post(function (req, res) {
    let searchStr = req.body.searchName; 
    // Check search string to ensure it is valid
    // Process string into query string to search on ikea website 
    let queryStr = searchStr.replace(/\s/g, "%20");
    res.redirect('/search/' + queryStr);
  });
  
  app.route('/search/:product')
  
  .post(function (req, res) {
    // Search can also be conducted from this page
    let searchStr = req.body.searchName; 
    // Check search string to ensure it is valid
    // Process string into query string to search on ikea website 
    let queryStr = searchStr.replace(/\s/g, "%20");
    res.redirect('/search/' + queryStr);
  });
  
  // https://ikea-price-crawler.glitch.me/findreviews?orig_search=bittergurka%20watering%20can&name=BITTERGURKA&type=Watering%20can,%202%20l
  app.route('/findreviews')
  
  .post(function (req, res) {
    // Search can also be conducted from this page
    let searchStr = req.body.searchName; 
    // Check search string to ensure it is valid
    // Process string into query string to search on ikea website 
    let queryStr = searchStr.replace(/\s/g, "%20");
    res.redirect('/search/' + queryStr);
  });
  
  app.route('/query/:product')
  
  .get(function (req, res) {
    // Retrieve Ikea SG search parameters from URL
    let url = "https://www.ikea.com/sg/en/search/products/?q=" + req.params.product;
    
    // Create browser variable to allow browser to be closed 
    let browserVar; 
    
    puppeteer
    .launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
    .then(function(browser) {
      return browserVar = browser;
    })
    .then(function(browser) {
      return browser.newPage();
    })
    .then(function(page) {
      return page.goto(url).then(function() {
        return page.content(); 
      });
    })
    .then(function(htmlData) {  
      // Scrape ikea SG search result and send html 
      const $ = cheerio.load(htmlData);
      let prodArr = []; 
      let imgArr = [];
      
      $('.range-image-claim-height img').each(function (index, val) {
        imgArr.push($(this).attr('src'));
      })
      
      $('.product-compact__name').each(function (index, val) {
        let prodObj = {};
        prodObj.name = $(this).text(); 
        prodObj.type = $(this).next().text();
        prodObj.link = $(this).parent().attr('href');
        prodObj.img = imgArr[index]; 
        prodArr.push(prodObj);
      });
      console.log(prodArr);
      res.send(prodArr);
      
    })
    .then(function() {
       browserVar.close();
    })
    .catch(function(err) {
      console.log(err); 
    });
  });
  
  
  app.route('/reviews')
  
  // For new search string submitted 
  .post(function (req, res) {
    // Search can also be conducted from this page
    let searchStr = req.body.searchName; 
    // Check search string to ensure it is valid
    // Process string into query string to search on ikea website 
    let queryStr = searchStr.replace(/\s/g, "%20");
    res.redirect('/search/' + queryStr);
  })
  
 .get(async function (req, res) {
    // Retrieve product name and type information from URL
    let orig_search = req.query.orig_search.replace(/\%20/g, " ");
    let name = req.query.name.replace(/\%20/g, " ");
    // Remove product dimensions from req.query.type to prepare for searching
    let type = req.query.type.replace(/\%20/g, " ").replace(/,\s\d+\w\d+\s+cm/, "").trim();
    
    let searchStr = name + ' ' + type; 
    
    // URLs to scrape for US, GB, AUS websites
    let url_us = "https://www.ikea.com/us/en/search/products/?q=" + searchStr; 
    let url_gb = "https://www.ikea.com/gb/en/search/products/?q=" + searchStr; 
    let url_aus = "https://www.ikea.com/au/en/search/products/?q=" + searchStr; 
    let urls = [url_us, url_gb, url_aus];
    let regions = ['US', 'GB', 'AUS'];

    //https://medium.com/hackernoon/async-await-essentials-for-production-loops-control-flows-limits-23eb40f171bd
    // Async version
    try {
      let prodArr = [];
      const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
      const page = await browser.newPage();
      
      for (let i = 0; i < urls.length; i++) {  
        
        await page.goto(urls[i], {waitUntil: 'networkidle0'});
        let prodObj = {};
        let content = await page.content();
        //console.log(content);
        let $ = cheerio.load(content);
        
        // Test applying selectors to entire html doc
        //console.log($('.product-compact__name').first().text());
        console.log($('product-compact__type').first().text());
       
        $('.product-compact__spacer').first().children(function (index, val) {

          prodObj.country = regions[i];
          prodObj.origLink = $(this).closest('a').attr('href');
          prodObj.name = $('span.product-compact__name').first().text();
          prodObj.type = $('.product-compact__type').first().text();
          prodObj.size = $(this).find('.product-compact__price__value').text();
          prodObj.rating = $(this).find('span.product-compact__ratings-value').text();
          prodObj.img = $('.range-image-claim-height img').first().attr('src');
          prodObj.ratingCount = $(this).find('.product-compact__ratings-count').text().replace(/[()]/g, "");
        });
        prodArr.push(prodObj);
      }
      res.send(prodArr);
      browser.close();
    }
    catch (err) {
      console.log(err);  
    } 
  })
}