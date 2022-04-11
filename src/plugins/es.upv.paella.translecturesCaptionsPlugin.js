import {
    MenuButtonPlugin,
    createElementWithHtmlText,
    bindEvent,
    Events,
    Paella,
    PopUp
} from 'paella-core';

import captionsIcon from '../icons/captions.svg';

import '../css/TranslecturesCaptionsPlugin.css';

export default class TranslecturesCaptionsPlugin extends MenuButtonPlugin {
    
    async getDictionaries() {
        return {
            es: {
                "Enable, disable or edit captions": "Activar, desactivar o editar subtítulos",
                "Disabled": "Desactivados",
                "Edit": "Editar"
            }
        }
    }

    async getMenu() {
        const result = [
            {
                id: -1,
                title: "Disabled",
                index: -1
            },
            {
                id: -2,
                title: "Edit",
                index: -2
            }
        ];

        this._captionsCanvas.captions.forEach((c,i) => {
            result.push({
                id: c.language,
                title: c.label,
                index: i
            });
        });

        return result;
    }

    itemSelected(itemData) {
        if (itemData.index === -1) {
            this._captionsCanvas.disableCaptions();
        }
        else if (itemData.index === -2) {
            // TODO: Edit
            const popUp = new PopUp(this.player, document.body, null, null, false);
            const popUpContent = createElementWithHtmlText(`<div>Hello</div>`);
            popUp.setContent(popUpContent);
            popUp.contentElement.classList.add("translectures-login-popup");
            popUp.show();
        }
        else {
            this._captionsCanvas.enableCaptions({ index: itemData.index });
        }
    }

    async load() {
        this.icon = captionsIcon;
        this._captionsCanvas = this.player.captionsCanvas;

        if (this._captionsCanvas.captions.length === 0) {
            this.hide();
        }

        bindEvent(this.player, Events.CAPTIONS_CHANGED, () => {
            if (this._captionsCanvas.captions.length > 0) {
                this.show();
            }
        });
    }
}