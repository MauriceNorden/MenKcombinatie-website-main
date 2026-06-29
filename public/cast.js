// ===============================
// CHROMECAST CUSTOM RECEIVER
// M&K Combinatie Radio
// ===============================

const STREAM_URL = 'https://radio.mndevs.host/radio/8000/radio.mp3';
const API_BASE   = 'https://radio.prod.mndevs.host/api/nowplaying/1';

// ---- CAF setup ----
const context       = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

// Intercept every LOAD request and force our radio stream
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    (loadRequest) => {
        if (!loadRequest.media) {
            loadRequest.media = new cast.framework.messages.MediaInformation();
        }
        loadRequest.media.contentId   = STREAM_URL;
        loadRequest.media.contentUrl  = STREAM_URL;
        loadRequest.media.contentType = 'audio/mpeg';
        loadRequest.media.streamType  = cast.framework.messages.StreamType.LIVE;
        return loadRequest;
    }
);

// Auto-start stream when the receiver is ready (sender just launches, no LOAD)
context.addEventListener(cast.framework.system.EventType.READY, () => {
    if (playerManager.getPlayerState() === cast.framework.messages.PlayerState.IDLE) {
        const media = new cast.framework.messages.MediaInformation();
        media.contentId   = STREAM_URL;
        media.contentUrl  = STREAM_URL;
        media.contentType = 'audio/mpeg';
        media.streamType  = cast.framework.messages.StreamType.LIVE;

        const req = new cast.framework.messages.LoadRequestData();
        req.media = media;
        req.autoplay = true;

        playerManager.load(req);
    }
});

const options = new cast.framework.CastReceiverOptions();
options.disableIdleTimeout = true;
context.start(options);

// ---- UI elements ----
const titleEl   = document.getElementById('now-playing-title');
const artistEl  = document.getElementById('now-playing-artist');
const artEl     = document.getElementById('album-art');
const bgArt     = document.getElementById('bg-art');
const liveBadge = document.getElementById('live-badge');

// ---- AzuraCast now-playing (ported from script.js:107-167) ----
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
        title:  isLive ? `LIVE: ${live.streamer_name}` : (song.title  || 'M&K Combinatie'),
        artist: isLive ? live.streamer_name             : (song.artist || 'Live Radio'),
        art:    isLive ? live.art                       : song.art,
    };
}

async function updateNowPlaying() {
    try {
        const data = await getNowPlaying();
        const { isLive, title, artist, art } = buildMetadata(data);

        if (titleEl)  titleEl.textContent  = title;
        if (artistEl) artistEl.textContent = artist;

        if (art) {
            if (artEl)  artEl.src = art;
            if (bgArt)  bgArt.style.backgroundImage = `url('${art}')`;
        } else {
            // No art: fall back to MK logo and site background
            if (artEl)  artEl.src = '/assets/logo-white.svg';
            if (bgArt)  bgArt.style.backgroundImage = "url('/assets/achtergrond.jpg')";
        }

        if (liveBadge) liveBadge.style.display = isLive ? 'inline-block' : 'none';
    } catch (err) {
        console.error('Now playing update failed:', err);
    }
}

updateNowPlaying();
setInterval(updateNowPlaying, 15000);
