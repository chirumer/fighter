const express = require('express')
const path = require('path')

const settings = require('./site_settings.json')
const event_start = new Date(settings.event_start)
const event_end = new Date(settings.event_end)

require('dotenv').config()

const app = express();




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