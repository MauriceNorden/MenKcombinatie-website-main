const NAMESPACE = 'urn:x-cast:mkcombinatie.nowplaying';

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

let activeBg = 'a';

// Wissel crossfade achtergrond
function updateBackground(art) {
    if (!art) return;
    const next = activeBg === 'a' ? 'b' : 'a';
    const nextEl = document.getElementById(`bg-${next}`);
    nextEl.style.backgroundImage = `url(${art})`;
    nextEl.classList.add('active');
    document.getElementById(`bg-${activeBg}`).classList.remove('active');
    activeBg = next;
}

// Update alle zichtbare elementen op het TV-scherm
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

// Sender stuurt custom bericht bij trackwisseling (stream herstart NIET)
context.addCustomMessageListener(NAMESPACE, (event) => {
    const { title, artist, art } = event.data;
    updateDisplay(title, artist, art);
});

// Bij initieel laden: haal metadata uit het LOAD-verzoek
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    (request) => {
        const meta = request.media?.metadata;
        if (meta) {
            updateDisplay(
                meta.title,
                meta.artist,
                meta.images?.[0]?.url
            );
        }
        return request;
    }
);

context.start();
