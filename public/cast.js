// =====================================================
// CHROMECAST CUSTOM MEDIA RECEIVER
// M&K Combinatie Radio  (receiver app id: F93AB3B4)
// Runs ON the Chromecast device, served at /cast
// =====================================================

const STREAM_URL   = 'https://radio.mndevs.host/radio/8000/radio.mp3';
const API_BASE     = 'https://radio.prod.mndevs.host/api/nowplaying/1';
const FALLBACK_ART = '/assets/logo-white.svg';
const FALLBACK_BG  = '/assets/achtergrond.jpg';

// -----------------------------------------------------
// CAF receiver setup
// -----------------------------------------------------
const context       = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

function makeMedia() {
    const media = new cast.framework.messages.MediaInformation();
    media.contentId   = STREAM_URL;
    media.contentUrl  = STREAM_URL;
    media.contentType = 'audio/mpeg';
    media.streamType  = cast.framework.messages.StreamType.LIVE;
    return media;
}

// Whatever the sender asks to load, force our radio stream.
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    (loadRequest) => {
        loadRequest.media = makeMedia();
        loadRequest.autoplay = true;
        return loadRequest;
    }
);

// Sender only launches the app (no LOAD) -> start the stream ourselves.
context.addEventListener(cast.framework.system.EventType.READY, () => {
    if (playerManager.getPlayerState() === cast.framework.messages.PlayerState.IDLE) {
        const req = new cast.framework.messages.LoadRequestData();
        req.media = makeMedia();
        req.autoplay = true;
        playerManager.load(req);
    }
});

const options = new cast.framework.CastReceiverOptions();
options.disableIdleTimeout = true; // keep the radio screen up indefinitely
context.start(options);

// -----------------------------------------------------
// Now-playing UI  (ported from public/script.js:107-167)
// -----------------------------------------------------
const titleEl  = document.getElementById('title');
const artistEl = document.getElementById('artist');
const artEl    = document.getElementById('album-art');
const bgEl     = document.getElementById('bg-art');
const liveEl   = document.getElementById('live-badge');

async function getNowPlaying() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch now playing');
    return res.json();
}

function buildMetadata(data) {
    const song   = data.now_playing.song;
    const live   = data.live;
    const isLive = live?.is_live;

    return {
        isLive,
        title:  isLive ? live.streamer_name       : (song.title  || 'M&K Combinatie'),
        artist: isLive ? 'Live op M&K Combinatie'  : (song.artist || 'Live Radio'),
        art:    isLive ? live.art                  : song.art,
    };
}

async function updateNowPlaying() {
    try {
        const data = await getNowPlaying();
        const { isLive, title, artist, art } = buildMetadata(data);

        titleEl.textContent  = title;
        artistEl.textContent = artist;

        artEl.src = art || FALLBACK_ART;
        bgEl.style.backgroundImage = `url('${art || FALLBACK_BG}')`;

        liveEl.style.display = isLive ? 'inline-block' : 'none';
    } catch (err) {
        console.error('Now playing update failed:', err);
    }
}

updateNowPlaying();
setInterval(updateNowPlaying, 15000);
