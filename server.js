const express = require('express')
const path = require('path')

const settings = require('./site_settings.json')
const event_start = new Date(settings.event_start)
const event_end = new Date(settings.event_end)

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



app.listen(settings.PORT, () => {
  console.log('Listening on port ' + settings.PORT);
});