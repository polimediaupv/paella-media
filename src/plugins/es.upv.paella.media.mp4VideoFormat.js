import { VideoPlugin, Video, utils, VideoQualityItem } from 'paella-core';

let video = null;

export function supportsVideoType(type) {
    if (!type) return false;
    if (!video) {
        video = document.createElement("video");
    }

    const canPlay = video.canPlayType(type);
    return canPlay === "maybe" || canPlay === "probably";
}

export class Mp4MediaVideo extends Video {
    constructor(player, parent, isMainAudio) {
        super('video', player, parent);
        this.element.setAttribute("playsinline","true");

        this.isMainAudio = isMainAudio;

        // Autoplay is required to play videos in some browsers
        this.element.setAttribute("autoplay","true");
        this.element.autoplay = true;

        // The video is muted by default, to allow autoplay to work
        if (!isMainAudio) {
            this.element.muted = true;
        }

        this._videoEnabled = true;
    }

    async play() { 
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return await this.video.play();
        }
        else {
            this._disabledProperties.paused = false;
        }
    }
    
    async pause() {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return this.video.pause();
        }
        else {
            this._disabledProperties.paused = true;
        }
    }

    async duration() {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return this.video.duration;
        }
        else {
            return this._disabledProperties.duration;
        }
    }

    get currentTimeSync() {
        if (this._videoEnabled) {
            return this.ready ? this.video.currentTime : -1;
        }
        else {
            return this._disabledProperties.currentTime;
        }
    }
    
    async currentTime() {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return this.currentTimeSync;
        }
        else {
            return this._disabledProperties.currentTime;
        }
    }

    async setCurrentTime(t) {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return this.video.currentTime = t;
        }
        else {
            this._disabledProperties.currentTime = t;
            return t;
        }
    }

    async volume() {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return this.video.volume;
        }
        else {
            return this._disabledProperties.volume;
        }
    }

    async setVolume(v) {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            if (v === 0) {
                this.video.setAttribute("muted", true);
            }
            else {
                this.video.removeAttribute("muted");
            }
            return this.video.volume = v;
        }
        else {
            this._disabledProperties.volume = v;
            return v;
        }
    }

    async paused() {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return this.video.paused;
        }
        else {
            return this._disabledProperties.paused;
        }
    }

    async playbackRate() {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return await this.video.playbackRate;
        }
        else {
            return this._disabledProperties.playbackRate;
        }
    }

    async setPlaybackRate(pr) {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return this.video.playbackRate = pr;
        }
        else {
            this._disabledProperties.playbackRate = pr;
            return pr;
        }
    }

    async getQualities() {
        if (!this._qualities) {
            this._qualities = [];
            this._sources.forEach((src,i) => {
                this._qualities.push(new VideoQualityItem({
                    index: i,
                    label: `${src.res.w}x${src.res.h}`,
                    shortLabel: `${src.res.h}p`,
                    width: src.res.w,
                    height: src.res.h
                }));
            });
        }

        return this._qualities;
    }

    async setQuality(q) {
        const asyncTimeout = async (time) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, time);
            })
        }

        if (!this._videoEnabled) {
            return;
        }

        if (!(q instanceof VideoQualityItem)) {
            throw new Error("Invalid parameter setting video quality");
        }

        this._currentQuality = q;

        const currentTime = this.video.currentTime;
        const paused = this.video.paused;
        await this.player.pause();

        this.clearStreamData();
        await this.loadStreamData(this._streamData);

        this.video.currentTime = currentTime;
        if (!paused) {
            await this.player.play();
        }
    }

    get currentQuality() {
        return this._currentQuality;
    }

    async getDimensions() {
        if (this._videoEnabled) {
            await this.waitForLoaded();
            return { w: this.video.videoWidth, h: this.video.videoHeight };
        }
        else {
            return { w: this._disabledProperties.videoWidth, h: this._disabledProperties.videoHeight };
        }
    }

    saveDisabledProperties(video) {
        this._disabledProperties = {
            duration: video.duration,
            volume: video.volume,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            playbackRate: video.playbackRate,
            paused: video.paused,
            currentTime: video.currentTime
        }
    }

    // This function is called when the player loads, and it should
    // make everything ready for video playback to begin.
    async loadStreamData(streamData = null) {
        this._streamData = this._streamData || streamData;
        this.player.log.debug("es.upv.paella.mp4VideoFormat: loadStreamData");

        this._sources = null;
    
        this._sources = streamData.sources.mp4;
        this._sources.sort((a,b) => {
            return Number(a.res.w) - Number(b.res.w);
        });

        // Initialize qualities and set the default quality stream, only the
        // first time the video is loaded
        if (!this._qualities) {
            const qualities = await this.getQualities();
            this._currentQuality = qualities[qualities.length - 1];
        }
        this._currentSource = this._sources[this._currentQuality.index];

        if (!this.isMainAudioPlayer) {
            this.video.muted = true;
        }
        
        this.video.src = utils.resolveResourcePath(this.player, this._currentSource.src);
        this._endedCallback = this._endedCallback || (() => {
            if (typeof(this._videoEndedCallback) == "function") {
                this._videoEndedCallback();
            }
        });
        this.video.addEventListener("ended", this._endedCallback);

        await this.waitForLoaded();

        this.player.log.debug(`es.upv.paella.mp4VideoFormat (${ this.streamData.content }): video loaded and ready.`);
        this.saveDisabledProperties(this.video);
    }

    async clearStreamData() {
        this.video.src = "";
        this.video.removeEventListener("ended", this._endedCallback);
        this._ready = false;
    }

    async enable() {
        this.player.log.debug("video.enable()");

        if (this._timeUpdateTimer) {
            clearTimeout(this._timeUpdateTimer);
            this._timeUpdateTimer = null;
        }

        this._videoEnabled = true;

        await this.loadStreamData(this._streamData);

        // Restore video settings
        this.video.currentTime = this._disabledProperties.currentTime;
        if (this._disabledProperties.paused) {
            this.video.pause();
        }
        else {
            this.video.play();
        }

        return this._videoEnabled;
    }

    async disable() {
        if (this.isMainAudio) {
            this.player.log.debug("video.disable() - the video is not disabled because it is the main audio source.");
        }
        else {
            this.player.log.debug("video.disable()");

            this.saveDisabledProperties(this.video);

            const startTimeupdate = () => {
                this._timeUpdateTimer = setTimeout(() => {
                    if (!this._disabledProperties.paused) {
                        this._disabledProperties.currentTime += 0.25;
                    }
                    startTimeupdate();
                }, 250);
            }
            startTimeupdate();
    
            this._videoEnabled = false;
            await this.clearStreamData();
        }

        return this._videoEnabled;
    }

    waitForLoaded() {
        return new Promise((resolve,reject) => {
            if (this.ready) {
                resolve();
            }
            else {
                const startWaitTimer = () => {
                    this._waitTimer && clearTimeout(this._waitTimer);
                    this._waitTimer = null;
                    if (this.video.error) {
                        reject(new Error(`Error loading video: ${this.video.src}. Code: ${this.video.error.code}: ${this.video.error.message}`));
                    }
                    else if (this.video.readyState >= 2) {
                        this.video.pause(); // Pause the video because it is loaded in autoplay mode
                        this._ready = true;
                        resolve();
                    }
                    else {
                        this._waitTimer = setTimeout(() => startWaitTimer(), 100);
                    }
                }

                startWaitTimer();
            }
        })
    }
}

export default class Mp4MediaVideoPlugin extends VideoPlugin {
    get streamType() {
        return "mp4";
    }

    isCompatible(streamData) {
        const { mp4 } = streamData.sources;
        return mp4 && supportsVideoType(mp4[0]?.mimetype);
    }

    async getVideoInstance(playerContainer, isMainAudio) {
        return new Mp4MediaVideo(this.player, playerContainer, isMainAudio);
    }
}