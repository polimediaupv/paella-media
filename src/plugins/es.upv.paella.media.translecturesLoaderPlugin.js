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

        /*
        loadCaptions(onSuccess) {
			var self = this;	
			var video_id = paella.player.videoIdentifier;
			var langs_url = ('/rest/plugins/admin-plugin-translectures/langs/${videoId}').replace(/\$\{videoId\}/ig, video_id);
			
			base.ajax.get({url: langs_url},
				function(data, contentType, returnCode, dataRaw) {	
							
					if (data.length > 0) {
						data.forEach(function(l){
							var l_get_url = ("/rest/plugins/admin-plugin-translectures/dfxp/${videoId}/${tl.lang.code}")
								.replace(/\$\{videoId\}/ig, video_id)
								.replace(/\$\{tl.lang.code\}/ig, l.lang);
														
							var l_edit_url;							
	
							l_edit_url = ("/rest/plugins/admin-plugin-translectures/redirectToEditor/${videoId}/${tl.lang.code}")
								.replace(/\$\{videoId\}/ig, video_id)
								.replace(/\$\{tl.lang.code\}/ig, l.lang);
							
							var l_txt = l.label;
							switch(l.transcription){
								case 'automatic':
									l_txt += " (" + paella.dictionary.translate("Auto") + ")";
									break;
								case 'manual':
									l_txt += " (" + paella.dictionary.translate("Manual") + ")";
									break;
								case 'partially':
									l_txt += " (" + paella.dictionary.translate("Under review") + ")";
									break;
							}
														
							var c = new paella.captions.media.translectures.Caption(l.lang , "dfxp", l_get_url, {code: l.lang, txt: l_txt}, l_edit_url, self.userData);
							paella.captions.addCaptions(c);
						});
						onSuccess(false);
					}
					else {
						base.log.debug("Error getting available captions from translectures: " + langs_url);
						onSuccess(false);
					}
				},						
				function(data, contentType, returnCode) {
					base.log.debug("Error getting available captions from translectures: " + langs_url);
					onSuccess(false);
				}
			);
		}
	}
        */
        
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