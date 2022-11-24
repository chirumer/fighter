const express = require('express');
const cookie_parser = require('cookie-parser');
const path = require('path');
const axios = require('axios');
const { encrypt, decrypt, valid_access_code } = require('./encryption');

// load env
require('dotenv').config()

// express app
const app = express();

// parse json data
app.use(express.json());


// resources: not part of event; available at all times
app.use(express.static('public'))


// user authentication stuff
app.use(cookie_parser());

app.post('/authenticate', (req, res) => {
  const data = req.body;

  res.setHeader('Content-Type', 'application/json');

  if (!participants_set.has(data.email)) {
    res.end(JSON.stringify({ success: false, error_msg: '(email is not registered)' }));
    return
  }
  
  if (!valid_access_code(data.email, data.access_code)) {
    res.end(JSON.stringify({ success: false, error_msg: '(wrong access code)' }));
    return
  }

  // set cookie
  res.cookie('credentials', JSON.stringify(data), { maxAge: 3 * 24 * 3600000, httpOnly: true });

  res.end(JSON.stringify({ success: true }));
});
app.post('/logout', (req, res) => {
  res.clearCookie('credentials');
  res.sendStatus(200);
})
app.use((req, res, next) => {

  // authentication required only if event is active
  const time_now = Date.now();
  if (time_now < event_start || time_now > event_end) {
    next();
    return;
  }

  // verify credentials if present
  const credentials_str = req.cookies['credentials'];
  if (credentials_str) {
    const credentials = JSON.parse(credentials_str);
    if (valid_access_code(credentials.email, credentials.access_code)) {
      next();
      return;
    }
  }

  // no identity; send to login page
  res.redirect('/login')
});


// site settings related
let event_start;
let event_end;
let participants;
let participants_set

function update_settings(settings) {

  function get_participants(encrypted_participants) {
    console.log('debug: ', x);
    return encrypted_participants.map(x => decrypt(x));
  }

  event_start = new Date(settings.event_start);
  event_end = new Date(settings.event_end);
  participants = get_participants(settings.participants);
  participants_set = new Set(participants);
}

update_settings(require('./site_settings.json'));

// app.get('/refresh-site-settings', async (req, res) => {
//   // add auth to this route

//   const request = await axios.get(process.env.SITE_SETTINGS_URL);
//   update_settings(request.data)
//   res.sendStatus(200);
// });


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