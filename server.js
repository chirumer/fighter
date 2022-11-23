const express = require('express');
const cookie_parser = require('cookie-parser');
const path = require('path');
const axios = require('axios');
const { encrypt, decrypt, valid_access_code } = require('./encryption');

// load env
require('dotenv').config()

// express app
const app = express();


// resources: not part of event; available at all times
app.use(express.static('public'))


// user authentication
app.use(cookie_parser());
app.use((req, res, next) => {

  const credentials_str = req.cookies['credentials'];

  if (credentials_str) {
    // verify credentials
    const credentials = JSON.parse(credentials_str);
    if (valid_access_code(credentials.email, credentials.access_code)) {
      next();
    }
  }

  // send to login page
  res.redirect('/login')
});


// site settings related
let event_start;
let event_end;
let participants;

function update_settings(settings) {

  function get_participants(encrypted_participants) {
    return encrypted_participants.map(x => decrypt(x));
  }

  event_start = new Date(settings.event_start);
  event_end = new Date(settings.event_end);
  participants = get_participants(settings.participants);
}

update_settings(require('./site_settings.json'));

app.get('/refresh-site-settings', async (req, res) => {
  // add auth to this route

  const request = await axios.get(process.env.SITE_SETTINGS_URL);
  update_settings(request.data)
  res.sendStatus(200);
});


// event pages
app.use((req, res, next) => {

  const pre_event_pub = 'pre-event_public'
  const event_pub = 'event_public'
  const post_event_pub = 'post-event_public'

  const time_now = Date.now();

  let public_dir;

  if (time_now < event_start) {
    public_dir = pre_event_pub;
    if (req.url == '/') {
      res.redirect('/home')
    }
  }
  else if (time_now > event_end) {
    public_dir = post_event_pub;
    if (req.url == '/') {
      res.redirect('/leaderboard')
    }
  }
  else {
    public_dir = event_pub;
    if (req.url == '/') {
      res.redirect('/home')
    }
  }

  const middleware = express.static(path.join (__dirname, public_dir));
  middleware(req, res, next);
});


// some data routes
app.get('/data/event_start', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ event_start }));
});
app.get('/data/event_end', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ event_end }));
});


// start server
app.listen(process.env.PORT, () => {
  console.log('Listening on port ' + process.env.PORT);
});