$('#logout-btn').click(async () => {
  const response = await fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Length': '0',
    }
  });
  if (response.ok) {
    window.location.replace('/');
  }
});

$('#upload-form').submit(async function(e){
  e.preventDefault();
  // const language = $('#language_select').val();
  // const submission_file = $('#submission_file')[0].files[0];

  // const send_data = new FormData();
  // send_data.append('language', language);
  // send_data.append('submission_file', submission_file);

  const response = await fetch('/submit_code', {
    method: 'POST',
    body: new FormData($('#upload-form')[0]),
  });

  const data = await response.json();
  console.log(data);
  alert('i');
});

let user_email;
async function main() {
  const response = await fetch('/data/username');
  user_email = (await response.json()).email;
  $('#navbar-user_email').text(user_email);
}
main();