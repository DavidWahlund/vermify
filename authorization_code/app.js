/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '1b6d958349434a8a86d4f759028e845e'; // Your client id
var client_secret = 'cca2956c00584a08bab2f6f2e26d792f'; // Your secret
var redirect_uri = 'http://FS215:8888/callback'; // Your redirect uri
var user_id = 'davidwahlund'

var access_token, refresh_token

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', function (req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-modify-playback-state playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
  var playList = {
    url: 'https://api.spotify.com/v1/users/${user_id}/playlists',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },

    json: true
  };

  request.post(playList, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      //console.log(response)
    }
  });

});

app.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };



    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        console.log(body.access_token);

         access_token = body.access_token;
        refresh_token = body.refresh_token;

        

        // use the access token to access the Spotify Web API
        /*  request.get(options, function(error, response, body) {
           console.log(body);
         });
  */
        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          })); 
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
          access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

//------------------------------------------------------------------Spotify create playlist
app.post('/playlist', function (req, res) {
  var options = {
    url: 'https://api.spotify.com/v1/me/playlists',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token,

    },
    body: {
      "name": "Horde Music Playlist ",
    },
    json: true
  }

  request.post(options, function (error, response, body) {
    if (!error && response.statusCode === 201) {

      console.log('***********************************************', response.statusMessage)
    } else {
      console.log(response.statusMessage)
      console.log(error)
    }
  });

});


//------------------------------------------------------------------ Spotify play
app.get('/play', function (req, res) {

  //console.log(req.query.playlist_uri);
  var playlist_uri = req.query.playlist_uri

  var playOptions = {
    url: 'https://api.spotify.com/v1/me/player/play',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token,
    },
    body: {
      "context_uri": "spotify:playlist:" + playlist_uri,
      "position_ms": 0
    },
    json: true
  };
 
  request.put(playOptions, function (error, response, body) {
    //console.log(' requesting -------------------------------------------------------------------');
   // console.log(response);

  })
});
//-------------------------------------------------------------------




//------------------------------------------------------------------ Spotify pause
app.get('/paus', function (req, res) {

  //console.log(req.query.playlist_uri);
  //var playlist_uri = req.query.playlist_uri

  var pausOptions = {
    url: 'https://api.spotify.com/v1/me/player/pause',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token,
    },
  };
 
  request.put(pausOptions, function (error, response, body) {
    //console.log(' requesting -------------------------------------------------------------------');
    //console.log(response);

  })
});
//-------------------------------------------------------------------

//------------------------------------------------------------------ Spotify repeat
app.get('/repeat', function (req, res) {

  //console.log(req.query.playlist_uri);
  //var playlist_uri = req.query.playlist_uri

  var repeatOptions = {
    url: 'https://api.spotify.com/v1/me/player/repeat?state=context',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token,
    },
  };
 
  request.put(repeatOptions, function (error, response, body) {
    //console.log(' requesting -------------------------------------------------------------------');
    //console.log(response);

  })
});
//-------------------------------------------------------------------

//------------------------------------------------------------------ Spotify repeat
app.get('/shuffle', function (req, res) {

  //console.log(req.query.playlist_uri);
  //var playlist_uri = req.query.playlist_uri

  var repeatOptions = {
    url: 'https://api.spotify.com/v1/me/player/shuffle?state=true',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token,
    },
  };
 
  request.put(repeatOptions, function (error, response, body) {
    //console.log(' requesting -------------------------------------------------------------------');
    console.log(response);

  })
});
//-------------------------------------------------------------------

//------------------------------------------------------------------ Spotify skip backwards
app.get('/seek', function (req, res) {

  //console.log(req.query.playlist_uri);
  //var playlist_uri = req.query.playlist_uri

  var putOptions = {
    url: 'https://api.spotify.com/v1/me/player/seek?position_ms=2500',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token,
    },
  };
 
  request.put(putOptions, function (error, response, body) {
    //console.log(' requesting -------------------------------------------------------------------');
    console.log(response);

  })
});
//-------------------------------------------------------------------

//------------------------------------------------------------------ Spotify skip backwards
app.get('/volume', function (req, res) {

  //console.log(req.query.playlist_uri);
  //var playlist_uri = req.query.playlist_uri

  var putOptions = {
    url: 'https://api.spotify.com/v1/me/player/volume?volume_percent=50',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token,
    },
  };
 
  request.put(putOptions, function (error, response, body) {
    //console.log(' requesting -------------------------------------------------------------------');
    console.log(response);

  })
});
//-------------------------------------------------------------------

console.log('Listening on 8888');
app.listen(8888);
