import { Captions, CaptionsPlugin } from 'paella-core';

const getTime = (timeText) => {
    const hoursRE = /([\d\.]+)h/;
    const minutesRE = /([\d\.]+)m/;
    const secondsRE = /([\d\.]+)s/;
    let time = 0;

    const hours = hoursRE.exec(timeText);
    if (hours) {
        time += Number(hours[1]) * 3600;
    }

    const minutes = minutesRE.exec(timeText);
    if (minutes) {
        time += Number(minutes[1]) * 60;
    }

    const seconds = secondsRE.exec(timeText);
    if (seconds) {
        time += Number(seconds[1]);
    }

    return time;
}

export default class TranslecturesLoaderPlugin extends CaptionsPlugin {
    async getCaptions() {
        const {videoId} = this.player;
        const result = [];
        
        const captionsListUrl = `/rest/plugins/admin-plugin-translectures/langs/${videoId}`;
        const captionsListResponse = await fetch(captionsListUrl);
        if (captionsListResponse.ok) {
            const captionsList = await captionsListResponse.json();
            for (const caption of captionsList) {
                const captionObject = new Captions(caption.label, caption.lang);
                const captionUrl = `/rest/plugins/admin-plugin-translectures/dfxp/${videoId}/${caption.lang}`;
                const captionResponse = await fetch(captionUrl);
                if (captionResponse.ok) {
                    const text = await captionResponse.text();
                    const parser = document.createElement('div');
                    parser.innerHTML = text;
                    const doc = parser.children[0];
                    Array.from(doc.getElementsByTagName('p')).forEach(p => {
                        captionObject.addCue({
                            label: `caption_${p.getAttribute(`xml:id`)}`,
                            start: getTime(p.getAttribute('begin')),
                            end: getTime(p.getAttribute('end')),
                            captions: p.innerText
                        });
                    });
                }
                result.push(captionObject);
            }
        }

        return result;
    }
}