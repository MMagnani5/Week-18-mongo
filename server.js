// dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

//  scraping tools 
var request = require('request'); 
var cheerio = require('cheerio');

// use morgan and bodyparser with our app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

// make public a static dir
app.use(express.static('public'));

// Database configuration created with mongoose
mongoose.connect('mongodb://localhost/MongoWebArticles');
var db = mongoose.connection;

// show any mongoose errors
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

// log into the db through mongoose
db.once('open', function() {
  console.log('Mongoose connection successful.');
});

// And we bring in our Note and Article models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

// Routes

app.get('/', function(req, res) {
  res.send(index.html);
});

app.get('/scrape', function(req, res) {
  request('http://www.indeed.com/jobs?q=web+developer&l=Westchester%2C+NY', function (error, response, html) {

    var $ = cheerio.load(html);
    $('.jobtitle').each(function(i, element){

      var result = {};

      result.title = $(this).text();
      result.link = $(this).parent().attr('href');
      result.excerpt = $(this).parent().siblings('p.excerpt').text();

    var entry = new Article (result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });
    });
  });
  res.send('Scrape Complete');
});

app.get('/articles', function(req, res) {
  Article.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });
});

app.get('/articles/:id', function(req, res) {
  Article.findOne({'_id': req.params.id})
  .populate('note')
  .exec(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });
});

app.post('/articles/:id', function(req, res) {
  var newNote = new Note(req.body);

  newNote.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      Article.findOneAndUpdate({'_id': req.params.id},
      {'note': doc._id})
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.send(doc);
        }
      });
    }
  });
});

app.listen(3000, function() {
  console.log('App running on port 3000!');
});






