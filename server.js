const express = require('express')
const path = require('path')

const settings = require('./site_settings.json')
const event_start = new Date(settings.event_start)
const event_end = new Date(settings.event_end)

const app = express();





app.get("/", (req, res) => {
  res.redirect('/home')
});

if (Date.now() < event_start){
  app.use(express.static('pre-event_public'));
}
else if (Date.now() > event_end) {
  app.use(express.static('post-event_public'));
}
else {
  app.use(express.static('public'));
}


app.listen(settings.PORT, () => {
  console.log('Listening on port ' + settings.PORT);
});