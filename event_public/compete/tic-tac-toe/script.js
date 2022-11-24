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
  
  if($("#submission_file")[0].files.length == 0 ){
    alert("no file selected");
    return;
  }

  const form_data = new FormData($('#upload-form')[0]);
  form_data.append('upload-time', (new Date()).toLocaleTimeString());


  $('#upload-status').text('uploading..');
  $('#uploaded-file-time').text('');
  $('#uploaded-file-language').text('');
  $('#uploaded-file-name').text('');

  const response = await fetch('/submit_code', {
    method: 'POST',
    body: form_data,
  });

  const data = await response.json();

  $('#uploaded-file-time').text(form_data.get('upload-time'));
  $('#uploaded-file-language').text(form_data.get('language'));
  $('#uploaded-file-name').prop("href", data.public_url);
  $('#uploaded-file-name').text(form_data.get('code_submission').name);
  $('#upload-status').text('Done');
});

let user_email;
async function main() {
  const response = await fetch('/data/username');
  user_email = (await response.json()).email;
  $('#navbar-user_email').text(user_email);
}
main();