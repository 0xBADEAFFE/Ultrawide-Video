'use strict';

function addClass(video, styleClass) {
    var totalVideosOnPage = video.length;
    var videoClassList = [];

    for (var i = 0; i < totalVideosOnPage; i++) {
        videoClassList = video[i].classList;
        videoClassList.add(styleClass);
    }
}

function remClass(video, styleClass) {
    var totalVideosOnPage = video.length;
    var videoClassList = [];

    for (var i = 0; i < totalVideosOnPage; i++) {
        videoClassList = video[i].classList;
        if (videoClassList.contains(styleClass)) {
            videoClassList.remove(styleClass);
        }
    }
}

function getFullScreenStatus() {
    return document.webkitCurrentFullScreenElement;
}

UltraWide.prototype.updateAspectRatio = function() {
    // Calculate scale factor:
    const aspect = screen.width / screen.height;
    if (aspect >= 1.88) { // If wider than 16:9 widescreen:
        const scale = aspect / 1.77;
        this.scale = Math.round(scale * 100) / 100;
    } else this.scale = 1; // Default

    // Update Styles:
    if (window.location.host === 'www.reddit.com') {
        // Fix for reddit
        this.styles.innerHTML = '.extraClassAspect { -webkit-transform:scaleX(' + this.scale + ')!important; left:0!important; top:0!important; }\
        .extraClassCrop { -webkit-transform:scale(' + this.scale + ')!important; left:0!important; top:0!important; }';
    } else {
        this.styles.innerHTML = '.extraClassAspect { -webkit-transform:scaleX(' + this.scale + ')!important; }\
        .extraClassCrop { -webkit-transform:scale(' + this.scale + ')!important; }';
    }

    const fullscreen = getFullScreenStatus();

    const video = document.getElementsByTagName('video');
    if (!video) return;
    if (!video[0]) return;
    if (!video[0].videoWidth) return;

    // Check if video is already Ultrawide
    const videoAspect = video[0].videoWidth / video[0].videoHeight;

    // Check if video ended
    let videoEnded = video[0].ended;

    // Update Classes:
    if (video.length !== 0) {
        switch (this.mode) {
            case 0: // Disabled
                remClass(video, 'extraClassAspect');
                remClass(video, 'extraClassCrop');
                break;
            case 1: // Aspect
                if (fullscreen && this.scale > 1) {
                    addClass(video, 'extraClassAspect');
                    remClass(video, 'extraClassCrop');
                } else {
                    remClass(video, 'extraClassAspect');
                    remClass(video, 'extraClassCrop');
                }
                break;
            case 2: // Crop
                if (fullscreen && this.scale > 1 && videoAspect < 2.37) {
                    addClass(video, 'extraClassCrop');
                    remClass(video, 'extraClassAspect');
                } else {
                    remClass(video, 'extraClassAspect');
                    remClass(video, 'extraClassCrop');
                }
                break;
            case 3: // Force Crop
                if (fullscreen) {
                    addClass(video, 'extraClassCrop');
                    remClass(video, 'extraClassAspect');
                } else {
                    remClass(video, 'extraClassAspect');
                    remClass(video, 'extraClassCrop');
                }
                break;
            case 4: // Force Aspect
                if (fullscreen) {
                    addClass(video, 'extraClassAspect');
                    remClass(video, 'extraClassCrop');
                } else {
                    remClass(video, 'extraClassAspect');
                    remClass(video, 'extraClassCrop');
                }
                break;
        }
    }

    // Update every 5s in fullscreen mode:
    if (fullscreen && this.mode > 0 && video.length > 0) {
        if (this.aspectRatioTimer != null) {
            clearTimeout(this.aspectRatioTimer);
        }
        this.aspectRatioTimer = setTimeout(function() {
            this.updateAspectRatio();
            this.aspectRatioTimer = null;
        }.bind(this), 5000);
    }
}

UltraWide.prototype.updateSBSMode = function() {
    if (window.location.host === 'www.youtube.com') {
        const video = document.getElementsByTagName('video');
        if (!video) return;

        const canvasMask = video[0].nextElementSibling;
        if (canvasMask) {
            canvasMask.hidden = this.sbsToggle;
        }
        // Update every 5s because sometimes the canvas element takes a moment to appear:
        if (this.sbsToggle && video.length > 0) {
            if (this.sbsTimer != null) {
                clearTimeout(this.sbsTimer);
            }
            this.sbsTimer = setTimeout(function() {
                this.updateSBSMode();
                this.sbsTimer = null;
            }.bind(this), 5000);
        }
    }
}

function UltraWide() {
    this.mode = 0;
    this.sbsToggle = false;
    document.addEventListener('fullscreenchange', function() {
        this.updateAspectRatio();
    }.bind(this));

    document.addEventListener('keydown', function(hotKeyPressed) {
        if (hotKeyPressed.ctrlKey && hotKeyPressed.altKey && hotKeyPressed.key == 'c') {
            if (++this.mode > 2) this.mode = 0;
            chrome.storage.local.set({
                'extensionMode': this.mode
            }, function() {});
        }
    }.bind(this));

    this.styles = document.createElement('style');
    document.body.appendChild(this.styles);
}

function onLoad() {
    if (!document.body) return;
    const ultrawide = new UltraWide();
    chrome.storage.local.get('extensionMode', function(status) {
        ultrawide.mode = status.extensionMode;
        if (status.extensionMode != 0) ultrawide.updateAspectRatio();
    });
    chrome.storage.local.get('extensionSBSToggle', function(status) {
        ultrawide.sbsToggle = status.extensionSBSToggle;
        if (status.extensionSBSToggle != false) ultrawide.updateSBSMode();
    });
    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.extensionMode) {
            ultrawide.mode = changes.extensionMode.newValue;
            ultrawide.updateAspectRatio();
        } else if (changes.extensionSBSToggle) {
            ultrawide.sbsToggle = changes.extensionSBSToggle.newValue;
            ultrawide.updateSBSMode();
        }
    });
}

if (document.readyState == 'complete') onLoad();
else window.addEventListener('load', onLoad);