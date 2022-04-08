import {
    PopUpButtonPlugin,
    createElementWithHtmlText,
    bindEvent,
    Events,
    Paella
} from 'paella-core';

import searchIcon from '../icons/binoculars.svg';

export default class FindCaptionsPlugin extends PopUpButtonPlugin {
    async getDictionaries() {
		return {
			es: {
				"Search": "Buscar",
                "Search in captions": "Buscar en subtítulos"
			}
		}
	}

    async getContent() {
        const searchText = this.player.translate("Search");
        const content = createElementWithHtmlText(`<div></div>`);

        const resultsContainer = createElementWithHtmlText('<div class="search-results"></div>', content);

        const input = createElementWithHtmlText('<input type="text"/>', content);
        input.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        let searchTimer = null;
        input.addEventListener('keyup', (evt) => {
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
            resultsContainer.innerHTML = "";
            const currentLanguage = this.player.getLanguage();
            searchTimer = setTimeout(() => {
                const results = {};
                this.captions.forEach(lang => {
                    lang.cues.forEach(cue => {
                        if (cue.captions.find(cap => (new RegExp(input.value,"i")).test(cap))) {
                            results[cue.startString] = results[cue.startString] || { cue, text: {} }
                            results[cue.startString].text[lang.language] = cue.captions;
                        }
                    })
                });
                for (const timeString in results) {
                    const res = results[timeString];
                    const text = res.text[currentLanguage] || res.text[Object.keys(res.text)[0]];
                    const resultElem = createElementWithHtmlText(`<div>${res.cue.startString}: ${text[0]}</div>`, resultsContainer);
                    resultElem._cue = res.cue;
                    resultElem.addEventListener('click', async (evt) => {
                        const time = evt.target._cue.start;
                        await this.player.videoContainer.setCurrentTime(time);
                    })
                }
                searchTimer = null;
            }, 1000);
            
            evt.stopPropagation();
        });

        const button = createElementWithHtmlText(`<button>${searchText}</button>`, content);
        button.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        return content;
    }

    get popUpType() {
        return "no-modal";
    }

    get captions() {
        return this.player.captionsCanvas.captions;
    }

    async load() {
        this.icon = searchIcon;
        this._captionsCanvas = this.player.captionsCanvas;

        if (this.captions.length === 0) {
            this.hide();
        }

        bindEvent(this.player, Events.CAPTIONS_CHANGED, () => {
            if (this.captions.length > 0) {
                this.show();
            }
        })
    }
}
