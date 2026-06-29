const NAMESPACE = 'urn:x-cast:mkcombinatie.nowplaying';

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

// Log player errors so chrome://inspect shows what's wrong
playerManager.addEventListener(cast.framework.events.EventType.ERROR, (event) => {
    console.error('[MK] Speler fout:', event.detailedErrorCode, event.error);
});

// Intercept LOAD to log stream info and catch errors before they crash the receiver
playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, (loadRequestData) => {
    console.log('[MK] Stream laden:', loadRequestData?.media?.contentId, loadRequestData?.media?.streamType);
    return loadRequestData;
});

let activeBg = 'a';

function updateBackground(art) {
    if (!art) return;
    const next = activeBg === 'a' ? 'b' : 'a';
    const nextEl = document.getElementById(`bg-${next}`);
    nextEl.style.backgroundImage = `url(${art})`;
    nextEl.classList.add('active');
    document.getElementById(`bg-${activeBg}`).classList.remove('active');
    activeBg = next;
}

function updateDisplay(title, artist, art) {
    if (title) document.getElementById('cast-title').textContent = title;
    if (artist) document.getElementById('cast-artist').textContent = artist;

    if (art) {
        const artEl = document.getElementById('cast-art');
        artEl.classList.add('fading');
        setTimeout(() => {
            artEl.src = art;
            artEl.onload = () => artEl.classList.remove('fading');
        }, 400);
        updateBackground(art);
    }
}

context.addCustomMessageListener(NAMESPACE, (event) => {
    const { title, artist, art } = event.data;
    updateDisplay(title, artist, art);
});

context.setLoggerLevel(cast.framework.LoggerLevel.DEBUG);

const options = new cast.framework.CastReceiverOptions();
options.disableIdleTimeout = true;
context.start(options);
