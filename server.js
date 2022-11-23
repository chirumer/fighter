const express = require('express');
const path = require('path');
const axios = require('axios');
const { encrypt, decrypt } = require('./encryption');

require('dotenv').config()

const app = express();


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


app.use ((req, res, next) => {

  const pre_event_pub = 'pre-event_public'
  const event_pub = 'public'
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


app.get('/data/event_start', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ event_start }));
});

app.get('/data/event_end', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ event_end }));
});


app.listen(process.env.PORT, () => {
  console.log('Listening on port ' + process.env.PORT);
});