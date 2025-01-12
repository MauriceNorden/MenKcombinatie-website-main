  // Create new Castjs instance
  const cjs = new Castjs();

  // Wait for user interaction
  document.getElementById('cast').addEventListener('click', function () {
    // Check if casting is available
    if (cjs.available) {
      // Initiate new cast session with a simple video
      cjs.cast('https://radio.mndevs.host/radio/8000/radio.mp3');

      // A more complex example
      cjs.cast('https://radio.mndevs.host/radio/8000/radio.mp3', {
        poster: 'https://mkcombinatie.nl/favicon.svg',
        title: 'M&K Combinatie'
      })
    }
  });