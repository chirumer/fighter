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

function countdown_display(seconds) {

  if (seconds < 0) {
    clearInterval(countdown_timer);
    return 'Please refresh this page. If you are still seeing this, contact admin.';
  }

  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  
  var dDisplay = d > 0 ? d + (d == 1 ? " day" : " days") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  
  return [dDisplay, hDisplay, mDisplay, sDisplay].filter(x => x).join(', ');
}

function update_countdown() {
  seconds_left = (new Date(event_start) - Date.now())/1000;
  $('#countdown').text(countdown_display(seconds_left));
}

async function main() {
  const response = await fetch('../data/event_start');
  event_start = (await response.json())['event_start']

  update_countdown();
  countdown_timer = setInterval(update_countdown, 1000);
}

let event_start;
main()