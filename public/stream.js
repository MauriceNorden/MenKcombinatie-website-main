const CAST_APP_ID = 'F93AB3B4';
const STREAM_URL = 'https://radio.mndevs.host/radio/8000/radio.mp3';
const CAST_NAMESPACE = 'urn:x-cast:mkcombinatie.nowplaying';

let castSession = null;

// Called by the Google Cast SDK when it has loaded
window['__onGCastApiAvailable'] = function (isAvailable) {
    const castBtn = document.getElementById('cast');

    if (!isAvailable) {
        if (castBtn) castBtn.style.display = 'none';
        return;
    }

    cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });

    cast.framework.CastContext.getInstance().addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        onSessionStateChange
    );
};

function onSessionStateChange(event) {
    const castBtn = document.getElementById('cast');
    const state = event.sessionState;

    if (state === cast.framework.SessionState.SESSION_STARTED ||
        state === cast.framework.SessionState.SESSION_RESUMED) {
        castSession = cast.framework.CastContext.getInstance().getCurrentSession();
        if (castBtn) castBtn.classList.add('casting');
        startCastStream();
    } else if (state === cast.framework.SessionState.SESSION_ENDED) {
        castSession = null;
        if (castBtn) castBtn.classList.remove('casting');
    }
}

// Eénmalig de stream laden bij het beginnen van een Cast-sessie
async function startCastStream() {
    if (!castSession) return;

    try {
        const data = await getNowPlaying();
        const { title, artist, art, album } = buildMetadata(data);

        const mediaInfo = new chrome.cast.media.MediaInfo(STREAM_URL, 'audio/mpeg');
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;

        const metadata = new chrome.cast.media.MusicTrackMediaMetadata();
        metadata.title = title || 'M&K Combinatie';
        metadata.artist = artist || 'Live Radio';
        metadata.albumName = album || '';
        if (art) metadata.images = [new chrome.cast.Image(art)];

        mediaInfo.metadata = metadata;

        await castSession.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo));
    } catch (err) {
        console.error('Cast load failed:', err);
    }
}

document.getElementById('cast').addEventListener('click', async () => {
    if (typeof cast === 'undefined') return;

    const castContext = cast.framework.CastContext.getInstance();

    if (castSession) {
        castSession.endSession(true);
        return;
    }

    try {
        await castContext.requestSession();
        // startCastStream wordt aangeroepen vanuit de SESSION_STARTED event
    } catch (err) {
        const code = err?.code ?? err;
        if (code !== chrome.cast.ErrorCode.CANCEL) {
            console.error('Cast session error:', code, err?.description ?? '');
        }
    }
});

// AzuraCast webhook → Socket.io → custom message naar receiver (stream herstart NIET)
socket.on('nowplaying-change', (data) => {
    const { title, artist, art, album } = buildMetadata(data);

    // UI op de website bijwerken
    const titleEl = document.getElementById('now-playing-title');
    const artistEl = document.getElementById('now-playing-artist');
    const artEl = document.getElementById('now-playing-art');
    if (titleEl) titleEl.textContent = title || 'M&K Combinatie';
    if (artistEl) artistEl.textContent = artist || 'Live Radio';
    if (artEl && art) artEl.src = art;

    // TV-scherm bijwerken via custom bericht (geen herstart van de stream)
    if (castSession) {
        castSession.sendMessage(CAST_NAMESPACE, {
            title: title || 'M&K Combinatie',
            artist: artist || 'Live Radio',
            art: art || '',
            album: album || ''
        });
    }
});
