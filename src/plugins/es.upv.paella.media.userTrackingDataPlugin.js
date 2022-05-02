
import { DataPlugin } from 'paella-core';

export default class MediaUserTrackingDataPlugin extends DataPlugin {
    async load() {
        console.log("Load plugin");
    }

    async write(context, { id }, data) {
        const playing = !(await this.player.paused());
        const date = new Date();
        const userEventData = {
            date: date.toISOString(),
            videoId: id,
            playing,
            time: date.toLocaleTimeString(),
            event: data.event,
            params: {
                plugin: data.params?.plugin?.name || ""
            }
        }
        const result = await fetch('https://media.upv.es/rest/plugins/eventsaver/userevent', {
            method: 'POST',
            body: JSON.stringify(userEventData)
        });
        if (!result.ok) {
            console.warn("Error sending user data");
            console.warn(result);
        }
    }
}
