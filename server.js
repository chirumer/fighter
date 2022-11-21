const express = require("express")
const path = require('path')

const app = express();


app.get("/", (req, res) => {
  res.redirect('/home')
});

app.use(express.static('public'))


app.listen(3000, () => {
  console.log('Listening on port ' + 3000);
});