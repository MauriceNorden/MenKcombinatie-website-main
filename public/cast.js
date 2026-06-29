// =====================================================
// CHROMECAST CUSTOM MEDIA RECEIVER
// M&K Combinatie Radio  (receiver app id: F93AB3B4)
// Runs ON the Chromecast device, served at /cast
// =====================================================

const STREAM_URL = 'https://radio.mndevs.host/radio/8000/radio.mp3';
const API_BASE = 'https://radio.prod.mndevs.host/api/nowplaying/1';
const FALLBACK_ART = location.origin + '/assets/backogrund.png';

// Latest now-playing info; seeded with sensible defaults so the very first
// LOAD already carries metadata before the AzuraCast feed has been fetched.
let currentMeta = {
    title: 'M&K Combinatie',
    artist: 'Live Radio',
    art: FALLBACK_ART,
};

// -----------------------------------------------------
// CAF receiver setup
// -----------------------------------------------------
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

// Metadata shown by the Cast UI / sender notification / lock screen.
function buildCastMetadata() {
    const meta = new cast.framework.messages.MusicTrackMediaMetadata();
    meta.title = currentMeta.title;
    meta.artist = currentMeta.artist;
    meta.albumName = 'M&K Combinatie Radio';
    meta.images = [new cast.framework.messages.Image(currentMeta.art)];
    return meta;
}

function makeMedia() {
    const media = new cast.framework.messages.MediaInformation();
    media.contentId = STREAM_URL;
    media.contentUrl = STREAM_URL;
    media.contentType = 'audio/mpeg';
    media.streamType = cast.framework.messages.StreamType.LIVE;
    media.metadata = buildCastMetadata();
    return media;
}

// Whatever the sender asks to load, force our radio stream + metadata.
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

// Push the freshest metadata onto the already-playing stream so the Cast UI
// and any sender notifications update without interrupting playback.
function refreshCastMetadata() {
    const mediaInfo = playerManager.getMediaInformation();
    if (!mediaInfo) return;
    mediaInfo.metadata = buildCastMetadata();
    playerManager.setMediaInformation(mediaInfo, /* broadcast */ true);
}

// -----------------------------------------------------
// Now-playing feed  (ported from public/script.js:107-167)
// Feeds the built-in <cast-media-player>, which renders the
// title / artist / album art from the media metadata.
// -----------------------------------------------------
async function getNowPlaying() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch now playing');
    return res.json();
}

function buildMetadata(data) {
    const song = data.now_playing.song;
    const live = data.live;
    const isLive = live?.is_live;

    return {
        isLive,
        title: isLive ? live.streamer_name : (song.title || 'M&K Combinatie'),
        artist: isLive ? 'Live op M&K Combinatie' : (song.artist || 'Live Radio'),
        art: isLive ? live.art : song.art,
    };
}

async function updateNowPlaying() {
    try {
        const data = await getNowPlaying();
        const { title, artist, art } = buildMetadata(data);

        currentMeta = { title, artist, art: art || FALLBACK_ART };
        refreshCastMetadata();
    } catch (err) {
        console.error('Now playing update failed:', err);
    }
}

updateNowPlaying();
setInterval(updateNowPlaying, 15000);
