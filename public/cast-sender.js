// =====================================================
// CHROMECAST SENDER (web browser side)
// Initialises the Cast API and wires the #cast button so
// it opens the device picker and launches our custom
// receiver app (id: F93AB3B4) on the selected Chromecast.
// =====================================================

const CAST_APP_ID = 'F93AB3B4';
let castApiReady = false;

function initCastApi() {
    if (castApiReady) return;
    castApiReady = true;

    cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });

    const castBtn = document.getElementById('cast');
    if (!castBtn) return;

    castBtn.addEventListener('click', () => {
        // Opens the Chromecast device-picker dialog and starts a new session.
        cast.framework.CastContext.getInstance()
            .requestSession()
            .catch((err) => {
                // "cancel" simply means the user closed the picker.
                if (err !== 'cancel') console.error('Cast session error:', err);
            });
    });
}

// The Cast framework calls this once cast_sender.js has finished loading.
window['__onGCastApiAvailable'] = function (isAvailable) {
    if (isAvailable) initCastApi();
};

// In case the framework was already ready before this script ran.
if (window.cast && window.cast.framework) {
    initCastApi();
}
