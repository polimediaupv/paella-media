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
                "log in and edit transcripts": "Identificarse y editar las transcripciones",
                "automatic": "Auto",
                "manual": "Manual",
                "partially": "En Revisión"
            },

            en: {
                "automatic": "Auto",
                "manual": "Manual",
                "partially": "Under Review"
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

    getLanguage() {
        const current = this.player.captionsCanvas.currentCaptions;
        const browserLang = navigator.language.substring(0,2);
        if (current) {
            return current.language;
        }
        else if (this.player.captionsCanvas.captions.find(cap => cap.language === browserLang)) {
            return browserLang
        }
        else if (this.player.captionsCanvas.captions.length) {
            return this.player.captionsCanvas.captions[0].language;
        }
        return null;
    }

    itemSelected(itemData) {
        if (itemData.index === -1) {
            this._captionsCanvas.disableCaptions();
        }
        else if (itemData.index === -2) {
            if (this.player.authData.permissions.isAnonymous) {
                const popUp = new PopUp(this.player, document.body, null, null, false);
                const title = this.player.translate('you have selected to edit the transcripts, but you are not logged in.');
                const editAnonymous = this.player.translate('edit transcripts anonymously');
                const loginAndEdit = this.player.translate('log in and edit transcripts');
                const popUpContent = createElementWithHtmlText(`
                    <div>
                        <h4>${title}</h4>
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
                this.doEdit();
            }
        }
        else {
            this._captionsCanvas.enableCaptions({ index: itemData.index });
        }
    }

    get editUrl() {
        const lang = this.getLanguage();
        return `/rest/plugins/admin-plugin-translectures/redirectToEditor/${this.player.videoId}/${lang}`;
    }

    doEdit() {
        window.open(this.editUrl, "__blank");
    }

    doLoginAndEdit() {
        this.player.authData.login(this.editUrl);
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