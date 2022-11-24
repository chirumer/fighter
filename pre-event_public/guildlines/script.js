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

let user_email;
async function main() {
  const response = await fetch('/data/username');
  user_email = (await response.json()).email;
  $('#navbar-user_email').text(user_email);
}
main();