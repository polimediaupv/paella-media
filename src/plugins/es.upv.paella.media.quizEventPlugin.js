import { createQuizQuestion } from '../js/QuizQuestion';

import { Events, EventLogPlugin, PopUp, createElementWithHtmlText } from 'paella-core';



import '../css/QuizEventPlugin.css';

function getQuestionElement(quizId,question,player,nextCallback) {
    const elem = createElementWithHtmlText(`<div class="quiz-question"></div>`);
    const quizQuestion = createQuizQuestion(player, quizId, question);
    elem.appendChild(quizQuestion.element);

    const buttons = createElementWithHtmlText(`
        <div class="buttons-container">
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
    });

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
    return elem;
}

function getQuestionContainer(quizId, question, doneCallback, player) {
    const questionContainer = createElementWithHtmlText(`
        <div class="question-container">
        </div>
    `);
    questionContainer.addEventListener('click', evt => {
        evt.stopPropagation();
    });

    const quizzes = question.quizzes.map(q => {
        const elem = getQuestionElement(quizId, q, player, () => questionContainer._data.nextQuestion());

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
        this._discoveredTime = 0;
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
        const questionContainer = getQuestionContainer(this._quiz._id, question, () => {
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
        if (this.quizEnabled === false) {
            return;
        }

        if (event === Events.PLAYER_LOADED) {
            this._quiz = await this.player.data.read('quiz', { id: this.player.videoId });
            
            if (this.player.authData.permissions.isAnonymous && this._quiz.dontAllowAnonymousAnswers) {
                this.quizEnabled = false;
            }
            else {
                this.quizEnabled = true;
            }

            this.dontAllowSeek = this._quiz.dontAllowSeek;
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
            // dontAllowSeek control
            // Prevent recursion loop (see explanation in the next else..if)
            if (this._skipEvent) {
                this._skipEvent = false
            }
            else if (this.dontAllowSeek && params.newTime>this._discoveredTime) {
                // The following call to setCurrentTime API will generate a seek event, we need to ignore it to avoid a recursion loop
                this._skipEvent = true;
                await this.player.videoContainer.setCurrentTime(params.prevTime);
            }
            
            // dont allow play if a quiestion is active
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
        this._discoveredTime = time>this._discoveredTime ? time : this._discoveredTime;
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
