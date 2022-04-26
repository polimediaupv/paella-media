import { Events, EventLogPlugin, createElementWithHtmlText } from 'paella-core';

import '../css/VideoTitlePlugin.css';

export default class VideoTitlePlugin extends EventLogPlugin {
    get events() {
        return [
            Events.MANIFEST_LOADED,
            Events.SHOW_UI,
            Events.HIDE_UI,
            Events.PLAYER_LOADED
        ];
    }

    async onEvent(event, params) {
        switch (event) {
        case Events.MANIFEST_LOADED:
            if (this.player.videoManifest.metadata.title !== '') {
                document.title = this.player.videoManifest.metadata.title;
            }
            break;
        case Events.SHOW_UI:
        case Events.PLAYER_LOADED:
            this.showTitle();
            break;
        case Events.HIDE_UI:
            this.hideTitle();
            break;
        }
    }

    showTitle() {
        if (!this._titleContainer) {
            const videoTitle = this.player.videoManifest.metadata.title;
            this._titleContainer = createElementWithHtmlText(`<div class="video-title"><h1>${videoTitle}</h1></div>`);
            const rect = this.player.videoContainer.getVideoRect();
            const y = this.player.videoManifest.streams.length===1 ? 0 : 40;
            this.player.videoContainer.appendChild(this._titleContainer, { x: 0, y, width: rect.width, height: 40 });
        }
    }

    hideTitle() {
        if (this._titleContainer) {
            this.player.videoContainer.removeChild(this._titleContainer);
            this._titleContainer = null;
        }
    }
}
