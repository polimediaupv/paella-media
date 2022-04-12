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
                "Edit": "Editar",
                "you have selected to edit the transcripts, but you are not logged in.": "Has seleccionado editar las transcripciones, pero no estás identificado!",
                "edit transcripts anonymously": "Editar las transcripciones de forma anónima",
                "log in and edit transcripts": "Identificarse y editar las transcripciones"
            }
        }
    }

    async getMenu() {
        const result = [
            {
                id: -1,
                title: this.player.translate("Disabled"),
                index: -1
            },
            {
                id: -2,
                title: this.player.translate("Edit"),
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
            if (this.player.authData.permissions.isAnonymous) {
                // TODO: Edit
                const popUp = new PopUp(this.player, document.body, null, null, false);
                const title = this.player.translate('you have selected to edit the transcripts, but you are not logged in.');
                const editAnonymous = this.player.translate('edit transcripts anonymously');
                const loginAndEdit = this.player.translate('log in and edit transcripts');
                const popUpContent = createElementWithHtmlText(`
                    <div>
                        <h1>${title}</h1>
                    </div>`);
                const editAnonymousButton = createElementWithHtmlText(`<button>${editAnonymous}</button>`, popUpContent);
                editAnonymousButton.addEventListener('click', evt => {
                    this.doEdit();
                    popUp.hide();
                    evt.stopPropagation();
                });
                const loginAndEditButton = createElementWithHtmlText(`<button>${loginAndEdit}</button>`, popUpContent);
                loginAndEditButton.addEventListener('click', evt => {
                    this.doLoginAndEdit();
                    popUp.hide();
                    evt.stopPropagation();
                });
                popUp.setContent(popUpContent);
                popUp.contentElement.classList.add("translectures-login-popup");
                popUp.show();
            }
            else {
                this.doLoginAndEdit();
                
            }
        }
        else {
            this._captionsCanvas.enableCaptions({ index: itemData.index });
        }
    }

    doEdit() {
        alert("Edit");
    }

    doLoginAndEdit() {
        alert("Login and edit");
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