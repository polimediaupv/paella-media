
import { Paella } from 'paella-core';
import getBasicPluginContext from 'paella-basic-plugins';
import getSlidePluginContext from 'paella-slide-plugins';
import getZoomPluginContext from 'paella-zoom-plugin';
import getUserTrackingPluginContext from 'paella-user-tracking';

import packageData from "../package.json";

const initParams = {
    customPluginContext: [
//        require.context("./plugins", true, /\.js/),
        getBasicPluginContext(),
        getSlidePluginContext(),
        getZoomPluginContext(),
        getUserTrackingPluginContext()
    ]
};

class PaellaPlayerMedia extends Paella {
    get version() {
        const player = packageData.version;
        const coreLibrary = super.version;
        const pluginModules = this.pluginModules.map(m => `${ m.moduleName }: ${ m.moduleVersion }`);
        return {
            player,
            coreLibrary,
            pluginModules
        };
    }
}

let paella = new PaellaPlayerMedia('player-container', initParams);

paella.loadManifest()
    .then(() => console.log("done"))
    .catch(e => console.error(e));

