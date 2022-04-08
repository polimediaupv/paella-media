
import { Paella, defaultLoadVideoManifestFunction } from 'paella-core';
import getBasicPluginContext from 'paella-basic-plugins';
import getSlidePluginContext from 'paella-slide-plugins';
import getZoomPluginContext from 'paella-zoom-plugin';
import getUserTrackingPluginContext from 'paella-user-tracking';

import packageData from "../package.json";


const initParams = {
    customPluginContext: [
        require.context("./plugins", true, /\.js/),
        getBasicPluginContext(),
        getSlidePluginContext(),
        getZoomPluginContext(),
        getUserTrackingPluginContext()
    ],

    async loadVideoManifest(videoManifestUrl, config, player) {
        const authUrl = `/rest/paella/auth/${player.videoId}`;
        const authResponse = await fetch(authUrl);
        if (authResponse.ok) {
            const authData = await authResponse.json();
            if (authData.permissions?.canRead === false) {
                throw new Error("You do not have permission to view this video");
            }
        }
        else {
            throw new Error("Error loading authentication data");
        }

        const manifest = await defaultLoadVideoManifestFunction(videoManifestUrl, config, player);
        if (!manifest.metadata?.preview) {
            const srcStream = manifest.streams.find(stream => stream.content === 'presenter') || manifest.streams[0];
            manifest.metadata.preview = srcStream.preview;
        }


        return manifest; 
    }
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

document.getElementById("player-container").addEventListener("contextmenu", e => e.preventDefault());

paella.loadManifest()
    .then(() => console.log("done"))
    .catch(e => console.error(e));

