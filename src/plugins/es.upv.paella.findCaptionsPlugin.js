import {
    PopUpButtonPlugin,
    createElementWithHtmlText,
    bindEvent,
    Events,
    Paella
} from 'paella-core';

import '../css/FindCaptionsPlugin.css';

import searchIcon from '../icons/binoculars.svg';

export default class FindCaptionsPlugin extends PopUpButtonPlugin {
    async getDictionaries() {
		return {
			es: {
				"Search": "Buscar",
                "Search in captions": "Buscar en subtítulos",
                "No results found": "No se han encontrado resultados"
			}
		}
	}

    async getContent() {
        const searchText = this.player.translate("Search");
        const content = createElementWithHtmlText(`<div class="captions-search-container"></div>`);

        const resultsContainer = createElementWithHtmlText('<div class="search-results"></div>', content);

        const input = createElementWithHtmlText('<input type="text"/>', content);
        input.addEventListener('click', (evt) => {
            evt.stopPropagation();
        });

        const browserLanguage = navigator.language.substring(0,2);
        const isCurrentLanguage = (lang) => {
            // If there are some captions enabled, compare with this language
            if (this.player.captionsCanvas.currentCaptions) {
                return lang === this.player.captionsCanvas.currentCaptions.language;
            }

            // Otherwise, compare with the browser language
            return lang === browserLanguage;
        }

        const showAllCaptions = () => {
            let captions = null;
            this.captions.some(lang => {
                if (isCurrentLanguage(lang.language)) {
                    captions = lang;
                }
            });
            if (!captions) {
                captions = this.captions[0];
            }

            captions && captions.cues.forEach(cue => {
                const cueElem = createElementWithHtmlText(`<p class="result-item">${cue.startString}: ${cue.captions[0]}</p>`, resultsContainer);
                cueElem._cue = cue;
                cueElem.addEventListener('click', async evt => {
                    const time = evt.target._cue.start;
                    await this.player.videoContainer.setCurrentTime(time);
                })
            })
        }

        showAllCaptions();

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
                    const resultElem = createElementWithHtmlText(`<p class="result-item">${res.cue.startString}: ${text[0]}</p>`, resultsContainer);
                    resultElem._cue = res.cue;
                    resultElem.addEventListener('click', async (evt) => {
                        const time = evt.target._cue.start;
                        await this.player.videoContainer.setCurrentTime(time);
                    })
                }
                if (Object.keys(results).length === 0 && input.value !== '') {
                    createElementWithHtmlText(`<p>${this.player.translate("No results found")}</p>`, resultsContainer);
                }
                else if (input.value === '') {
                    showAllCaptions();
                }
                searchTimer = null;
            }, 1000);
            
            evt.stopPropagation();
        });

        // Force reload content
        setTimeout(() => this.refreshContent = true, 10);
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
