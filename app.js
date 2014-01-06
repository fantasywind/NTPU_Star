
/**
 * Module dependencies.
 */

var express = require('express')
  , main = require('./routes/main')
  , vote = require('./routes/vote')
  , login = require('./routes/login')
  , player = require('./routes/player')
  , manage = require('./routes/manage')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3015);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('a0b2efb51e8b54d0bc29b7a1c216c5a9'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', main.index);
app.all('/login', login.check);
app.post('/new_account', login.comfirm_mail);
app.post('/update_pass', login.update_pass);
app.post('/add_player/:ball', manage.add);
app.post('/upload_pic/:playerId', manage.pictures);
app.post('/vote', vote.submit);
app.get('/player/:id', player.show);
app.get('/logout', login.logout);
app.get('/get_token', login.get_token);
app.get('/change_pass', login.change_pass);
app.get('/manage', manage.main);
app.get('/vote', main.vote);
app.get('/players', main.players);
app.get('/players/:ball', main.players);
app.get('/info', main.info);
app.get('/forum', main.forum);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
