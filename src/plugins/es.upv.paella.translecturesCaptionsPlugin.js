import {
    PopUpButtonPlugin,
    createElementWithHtmlText,
    bindEvent,
    Events,
    Paella
} from 'paella-core';

import '../css/TranslecturesCaptionsPlugin.css';
import captionsIcon from '../icons/captions.svg';

export default class TranslecturesCaptionsPlugin extends PopUpButtonPlugin {
    
    async getDictionaries() {
        return {
            es: {
                "Enable, disable or edit captions": "Activar, desactivar o editar subtítulos"
            }
        }
    }
    
    async getContent() {
        const content = createElementWithHtmlText('<div></div>');

        return content;
    }

    get popUpType() {
        return 'no-modal';
    }

    get captions() {
        return this.player.captionsCanvas.captions;
    }

    async load() {
        this.icon = captionsIcon;

        if (this.captions.length === 0) {
            this.hide();
        }

        bindEvent(this.player, Events.CAPTIONS_CHANGED, () => {
            if (this.captions.length > 0) {
                this.show();
            }
        });
    }
}