
import { DataPlugin } from 'paella-core';

export default class MediaUserTrackingDataPlugin extends DataPlugin {
    async load() {
        console.log("Load plugin");
    }

    async write(context, { id }, data) {
        console.log(`id: ${ id }`, context, data);
        // https://media.upv.es/rest/plugins/eventsaver/userevent
        /*
        {
            "date": "2022-04-29T10:36:03.463Z",
            "videoId": "be0c7738-039d-9445-8237-8b85f37cd303",
            "playing": false,
            "time": null,
            "event": "paella:loadComplete",
            "params": {}
        }
        */
    }
}
