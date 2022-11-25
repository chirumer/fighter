$('#login-form').submit(async (event) => {
  event.preventDefault();

  const email = $('#email').val().toLowerCase();
  const access_code = $('#access_code').val().toLowerCase();

  const send_data = { email, access_code };
  const response = await fetch('/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(send_data),
  });

  const data = await response.json();
  if (data.success) {
    window.location.replace('/');
  }
  else {
    $('#error-info').text(data.error_msg);
  }
});