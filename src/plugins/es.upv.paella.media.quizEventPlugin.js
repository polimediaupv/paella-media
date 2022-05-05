import { Events, EventLogPlugin } from 'paella-core';

export default class QuizEventPlugin extends EventLogPlugin {
    async load() {
        this._quiz = null;
        this._playAllowed = true;
    }

    get events() {
        return [
            Events.PLAYER_LOADED,
            Events.TIMEUPDATE,
            Events.PLAY
        ];
    }

    async onEvent(event, params) {
        if (event === Events.PLAYER_LOADED) {
            this._quiz = await this.player.data.read('quiz', { id: this.player.videoId });
        }
        else if (event === Events.TIMEUPDATE) {
            await this.timeUpdate(await this.player.videoContainer.currentTime());
        }
        else if (event === Events.PLAY) {
            if (!this._playAllowed) {
                await this.player.pause();
            }
        }
    }

    async timeUpdate(time) {
        const roundedTime = Math.round(time);
        const question = this._quiz?.quizTimes?.find(q => q.time === roundedTime);
        if (question) {
            console.log(question);
            await this.player.pause();
            this._playAllowed = false;
        }
    }
}