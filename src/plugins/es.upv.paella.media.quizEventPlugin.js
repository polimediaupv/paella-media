import { createQuizQuestion } from '../js/QuizQuestion';

import { Events, EventLogPlugin, PopUp, createElementWithHtmlText } from 'paella-core';



import '../css/QuizEventPlugin.css';

/**
 * PUT /rest/plugins/user-administrator/quiz/${id}/addResponse?preview=true
 * 
 *  choice-question  
 *          questionId (question Id)
 *          questionnaire (quiz id)
 *          response (response index, 0..n) 
 * 
 *  multi-choice-question  
 *          questionId (question Id)
 *          questionnaire (quiz id)
 *          response array (response index, 0..n) 
 *              Examples: first and secon options => [0, 1]
 *                        first and third options => [0, 2]
 *                        second option => [1]
 *   
 *  open-question  
 *          questionId (question Id)
 *          questionnaire (quiz id)
 *          response response string
 * 
 *  likert-question  
 *          questionId (question Id)
 *          questionnaire (quiz id)
 *          response (response index, 0..n)  
 * 
 *  message
 *          questionId (question Id)
 *          questionnaire (quiz id)
 *          response (null)
 */

function getQuestionElement(question,player,nextCallback) {
    const elem = createElementWithHtmlText(`<div></div>`);
    //createElementWithHtmlText(`${question.question}`,elem);

    const quizQuestion = createQuizQuestion(player, "qid", question);
    
    elem.appendChild(quizQuestion.element);

    const buttons = createElementWithHtmlText(`
    <div>
        <div class="confirmation-container"></div>
        <button class="ok-button">${player.translate("Validate")}</button>
        <button class="quiz-next-button" style="display: none">${player.translate("Next")}</button>
    </div>`);
    const nextButton = buttons.getElementsByClassName('quiz-next-button')[0];
    const okButton = buttons.getElementsByClassName('ok-button')[0];
    const confirmationContainer = buttons.getElementsByClassName('confirmation-container')[0];

    if (!quizQuestion.isValidContent) {
        okButton.setAttribute("disabled","disabled");
    }
    quizQuestion.onContentChanged(() => {
        if (!quizQuestion.isValidContent) {
            okButton.setAttribute("disabled","disabled");
        }
        else {
            okButton.removeAttribute("disabled");
        }
        console.log("Content changed");
    })
    
    // switch (question.type) {
    // case 'choice-question':
    //     question.responses.forEach((response,i) => {
    //         const id = `choice_${i}`;
    //         createElementWithHtmlText(`
    //             <div>
    //                 <input type="radio" id="${id}" name="quizAnswers"/>
    //                 <label for="${id}">${response}</label>
    //                 <span class="quiz-question-response" id="${id}_response"></span>
    //             </div>
    //         `, elem).addEventListener('click', evt => okButton.removeAttribute("disabled"));
    //     });
    //     break;
    // case 'multiple-choice-question':
    //     question.responses.forEach((response,i) => {
    //         const id = `check_${i}`;
    //         createElementWithHtmlText(`
    //             <div>
    //                 <input type="checkbox" id="${id}" name="quizAnswer${id}"/>
    //                 <label for="${id}">${response}</label>
    //                 <span class="quiz-question-response" id="${id}_response"></span>
    //             </div>
    //         `, elem);
    //         okButton.removeAttribute("disabled");
    //     });
    //     break;
    // case 'open-question':
    //     createElementWithHtmlText(`
    //         <div>
    //             <textarea id="quizPluginAnswerTextResult"></textarea>
    //         </div>
    //     `, elem).addEventListener("keyup", evt => {
    //         evt.stopPropagation();
    //         if (evt.target.value !== "") {
    //             okButton.removeAttribute("disabled");
    //         }
    //         else {
    //             okButton.setAttribute("disabled","disabled");
    //         }
    //     });

    //     break;
    // case 'likert-question':
    //     createElementWithHtmlText(`
    //         <div class="likert-question-group">
    //             ${[0,1,2,3,4,5].map(index => `
    //                 <div class="liker-question">
    //                     <input type="radio" name="likerAnswer" id="liker-answer-${index}"><label for="liker-answer-${index}">${player.translate('liker_answer_' + index)}</input>
    //                 </div>
    //             `).join("\n")}
    //         </div>
    //     `, elem).addEventListener('click', evt => okButton.removeAttribute("disabled"));
    //     break;
    // case 'message':
    //     okButton.removeAttribute("disabled");
    //     break;
    // }
    elem.appendChild(buttons);

    okButton.addEventListener('click', async evt => {
        

        if (quizQuestion.requireFeedback) {
            const result = await quizQuestion.checkResult();

            confirmationContainer.innerHTML = result ? player.translate("Correct!") : player.translate("Incorrect");
            confirmationContainer.classList.add(result ? "correct-answer" : "wrong-answer");
    
            okButton.style.display = "none";
            nextButton.style.display = "";
            
            await quizQuestion.sendResult();
        }
        else {
            await quizQuestion.sendResult();

            nextCallback();
        }
    });

    // okButton.addEventListener('click', evt => {
    //     const results = question.answers && question.answers.map((answer,i) => {
    //         switch (question.type) {
    //         case 'choice-question': {
    //             const element = document.getElementById(`choice_${i}`);
    //             const checked = element.checked;
    //             element.setAttribute('disabled','disabled');
    //             return {
    //                 element,
    //                 hintElement: document.getElementById(`choice_${i}_response`),
    //                 answer: answer,
    //                 selection: checked,
    //                 response: question.feedbacks[i],
    //                 correct: answer === checked
    //             }
    //         }
    //         case 'multiple-choice-question': {
    //             const element = document.getElementById(`check_${i}`);
    //             const checked = element.checked;
    //             element.setAttribute('disabled','disabled');
    //             return {
    //                 element,
    //                 hintElement: document.getElementById(`check_${i}_response`),
    //                 answer: answer,
    //                 selection: checked,
    //                 response: question.feedbacks[i],
    //                 correct: answer === checked
    //             }
    //         }
    //         }
    //     }) || null;

    //     if (results) {
    //         // choice or multi choice
    //         let totalFailed = 0;
    //         const finalResult = results
    //             .map(r => {
    //                 if (r.correct) {
    //                     r.hintElement.classList.add("correct-answer");
    //                 }
    //                 else {
    //                     r.hintElement.classList.add("wrong-answer");
    //                 }
    //                 r.hintElement.innerHTML = r.response;
    //                 return r.correct;
    //             })
    //             .every(r => {
    //                 if (r === true) {
    //                     return true;
    //                 }
    //                 else {
    //                     ++totalFailed;
    //                     return false;
    //                 }
    //             });

    //         confirmationContainer.innerHTML = finalResult ? player.translate("Correct!") : player.translate("Incorrect");
    //         confirmationContainer.classList.add(finalResult ? "correct-answer" : "wrong-answer");

    //         // TODO: send response
    //     }
    //     else {

    //         // Other types
    //         switch (question.type) {
    //             case 'open-question': {
    //                 const textElem = document.getElementById('quizPluginAnswerTextResult');
    //                 console.log(textElem.value);
    //                 // TODO: What may I do with the answer?
    //             }
    //             case 'likert-question': {
    //                 // TODO: implement this
    //             }
    //             case 'message': {
    //                 // TODO: send response
    //             }
    //         }
    //     }


        
    //     okButton.style.display = "none";
    //     nextButton.style.display = "";

    //     // Si no se requiere informar de nada al usuario, pasamos a la siguiente pregunta.
    //     if (/(liker|message|open)/.test(question.type)) {
    //         nextCallback();
    //     }
    // });
    return elem;
}

function getQuestionContainer(question, doneCallback, player) {
    const questionContainer = createElementWithHtmlText(`
        <div class="question-container">
        </div>
    `);
    questionContainer.addEventListener('click', evt => {
        evt.stopPropagation();
    });

    const quizzes = question.quizzes.map(q => {
        const elem = getQuestionElement(q, player, () => questionContainer._data.nextQuestion());

        const nextButton = elem.getElementsByClassName('quiz-next-button')[0];
        nextButton.addEventListener('click', evt => {
            evt.stopPropagation();
            questionContainer._data.nextQuestion();
        });
        return elem;
    });

    questionContainer._data = {
        quizzes,
        current: 0,
        nextQuestion() {
            const elem = this.quizzes[this.current++];
            if (elem) {
                questionContainer.innerHTML = "";
                questionContainer.appendChild(elem);
            }
            else {
                doneCallback();
            }
        }
    }

    questionContainer._data.nextQuestion();
    return questionContainer
}

export default class QuizEventPlugin extends EventLogPlugin {
    async load() {
        this._quiz = null;
        this._playAllowed = true;
        this.player.addDictionary("en", {
            liker_answer_0: "Strongly agree",
            liker_answer_1: "Agree",
            liker_answer_2: "Undecided",
            liker_answer_3: "Disagree",
            liker_answer_4: "Strongly disagree",
            liker_answer_5: "Not applicable",
            Validate: "Validate",
            Next: "Next",
            "Response sent": "Response sent",
            "Correct!": "Correct!",
            "Incorrect": "You have failed this question"
        });
        this.player.addDictionary("es", {
            liker_answer_0: "Muy de acuerdo",
            liker_answer_1: "De acuerdo",
            liker_answer_2: "Indeciso",
            liker_answer_3: "En desacuerdo",
            liker_answer_4: "Muy en desacuerdo",
            liker_answer_5: "No aplicable",
            Validate: "Validar",
            Next: "Siguiente",
            "Response sent": "Respuesta enviada",
            "Correct!": "Correcto!",
            "Incorrect": "Has fallado esta pregunta"
        });
    }

    get events() {
        return [
            Events.PLAYER_LOADED,
            Events.TIMEUPDATE,
            Events.PLAY,
            Events.SEEK
        ];
    }

    showQuestion(question) {
        if (this._questionModal) {
            this.hideQuestion();
        }

        this._questionModal = new PopUp(this.player, document.body, null, null, true);
        const questionContainer = getQuestionContainer(question, () => {
            this.hideQuestion();
        }, this.player);
        this._questionModal.setContent(questionContainer);
        this._questionModal.contentElement.classList.add('question-modal');
        this._questionModal.show();
    }

    hideQuestion() {
        if (this._questionModal) {
            this._questionModal.destroy();
            this._questionModal = null;
            this._playAllowed = true;
            this._skipTime = Math.round(this._currentTime);
            this.player.play();

        }
    }

    async onEvent(event, params) {
        if (event === Events.PLAYER_LOADED) {
            this._quiz = await this.player.data.read('quiz', { id: this.player.videoId });
        }
        else if (event === Events.TIMEUPDATE) {
            await this.timeUpdate(await this.player.videoContainer.currentTime());
        }
        else if (event === Events.PLAY) {
            if (!this._playAllowed) {
                await this.player.pause();
            }
        }
        else if (event === Events.SEEK) {
            if (!this._playAllowed && !this._seeking) {
                this._seeking = true;
                await this.player.videoContainer.setCurrentTime(this._currentTime);
            }
            else {
                this._seeking = false;
            }
        }
    }

    async timeUpdate(time) {
        const roundedTime = Math.round(time);
        const question = this._quiz?.quizTimes?.find(q => q.time === roundedTime && q.time !== this._skipTime);
        if (question) {
            await this.player.pause();
            this._playAllowed = false;
            this._currentTime = await this.player.videoContainer.currentTime();
            this.showQuestion(question);
        }
        if (this._skipTime > 0 && this._skipTime !== roundedTime) {
            this._skipTime = null;
        }
    }
}
