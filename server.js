const express = require('express');
const cookie_parser = require('cookie-parser');
const formidableMiddleware = require('express-formidable');
const path = require('path');
const axios = require('axios');
const { encrypt, decrypt, valid_access_code } = require('./encryption');
const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
const { readFileSync } = require('fs');
const mongoose = require('mongoose');

// load env
require('dotenv').config()

// express app
const app = express();

// parse form data
app.use(formidableMiddleware());

// resources: not part of event; available at all times
app.use(express.static('public'))


let containerClient;

async function main() {
  const AZURE_STORAGE_CONNECTION_STRING = 
  process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw Error('Azure Storage Connection string not found');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  containerClient = await blobServiceClient.getContainerClient('code');

  const MONGODB_CONNECTION_STRING = 
  process.env.MONGODB_CONNECTION_STRING;

  if (!MONGODB_CONNECTION_STRING) {
    throw Error('MONGODB Connection string not found');
  }

  await mongoose.connect(MONGODB_CONNECTION_STRING);
}
main();

const submission_schema = new mongoose.Schema({
  _id: String,
  tic_tac_toe: { type: Array, default: [] },
  mega_tic_tac_toe: { type: Array, default: [] },
  competing_factories: { type: Array, default: [] }
});

const Submission = mongoose.model('Submission', submission_schema);


// user authentication stuff
app.use(cookie_parser());

app.post('/authenticate', (req, res) => {
  const data = req.fields;

  console.log('entered');

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

async function update_database(participants) {
  for (participant of participants) {
    await Submission.findByIdAndUpdate(participant, { _id: participant }, { upsert: true }).exec();
  }
}

function update_settings(settings) {

  function get_participants(encrypted_participants) {
    return encrypted_participants.map(x => decrypt(x));
  }

  event_start = new Date(settings.event_start);
  event_end = new Date(settings.event_end);
  participants = get_participants(settings.participants);
  participants_set = new Set(participants);
  update_database(participants);
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


// code submission
app.post('/submit_code', async (req, res) => {

  const blobName = uuidv1() + '.txt';
  blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const submission_data = readFileSync(req.files.code_submission.path);
  blockBlobClient.upload(submission_data, submission_data.length);

  const public_url = blockBlobClient.url;

  const email = JSON.parse(req.cookies['credentials']).email;
  const data = await Submission.findOne({ _id: email }).exec();

  const upload_time = req.fields['upload_time'];
  const file_name = req.fields['file_name'];
  const language = req.fields['language'];
  const db_data = { upload_time, file_name, language, public_url };

  const game_name = req.fields['game_name'];
  data[game_name].push(db_data);
  await data.save();

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ public_url }));
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
app.get('/data/username', (req, res) => {
  let email = 'Error';
  // verify credentials if present
  const credentials_str = req.cookies['credentials'];
  if (credentials_str) {
    const credentials = JSON.parse(credentials_str);
    if (valid_access_code(credentials.email, credentials.access_code)) {
      email = credentials.email;
    }
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ email }));
});
app.get('/data/uploaded-file/:game_name', async (req, res) => {

  const game_name = req.params.game_name;

  const email = JSON.parse(req.cookies['credentials']).email;
  const data = await Submission.findOne({ _id: email }).exec();

  console.log('data', data);
  console.log(game_name);
  
  if (!data[game_name].length) {
    upload_time = '';
    file_name = 'Not Uploaded Yet';
    language = '';
    public_url = '#';
  }
  else {
    const [file_info] = data[game_name].slice(-1);
    upload_time = file_info.upload_time;
    file_name = file_info.file_name;
    language = file_info.language;
    public_url = file_info.public_url;
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ upload_time, file_name, language, public_url }));
});


// start server
app.listen(process.env.PORT, () => {
  console.log('Listening on port ' + process.env.PORT);
});