import { Events, EventLogPlugin, PopUp, createElementWithHtmlText } from 'paella-core';

import '../css/QuizEventPlugin.css';

function getQuestionElement(question) {
    let elem = null;
    switch (question.type) {
    case 'choice-question':
        elem = createElementWithHtmlText(`<div></div>`);
        createElementWithHtmlText(`${question.question}`,elem);
        question.responses.forEach((response,i) => {
            const id = `choice_${i}`;
            createElementWithHtmlText(`
                <div>
                    <input type="radio" id="${id}" name="choiceQuestion"/>
                    <label for="${id}">${response}</label>
                </div>
            `, elem);
        })
    }
    const buttons = createElementWithHtmlText(`
        <div>
            <button class="ok-button">Validate</button>
            <button class="quiz-next-button" style="display: none;">Next</button>
        </div>`, elem);
    const nextButton = buttons.getElementsByClassName('quiz-next-button')[0];
    const okButton = buttons.getElementsByClassName('ok-button')[0];
    okButton.addEventListener('click', evt => {
        alert("Validate");
        okButton.style.display = "none";
        nextButton.style.display = "";
    });
    return elem;
}

function getQuestionContainer(question, doneCallback) {
    const questionContainer = createElementWithHtmlText(`
        <div class="question-container">
        </div>
    `);
    questionContainer.addEventListener('click', evt => {
        evt.stopPropagation();
    });

    const quizzes = question.quizzes.map(q => {
        const elem = getQuestionElement(q);

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
        });
        this._questionModal.setContent(questionContainer);
        this._questionModal.contentElement.classList.add('question-modal');
        this._questionModal.show();
    }

    hideQuestion() {
        if (this._questionModal) {
            this._questionModal.hide();
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
