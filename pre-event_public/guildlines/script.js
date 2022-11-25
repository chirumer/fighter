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