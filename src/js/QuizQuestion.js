
import { createElementWithHtmlText } from "paella-core";

export default class QuizQuestion {
    constructor(player,questionnaire, { _id, answers, feedbacks, question, responses, type }) {
        this._player = player;
        this._typeId = type;
        this._questionnaire = questionnaire;
        this._questionId = _id;
        this._answers = answers;
        this._feedbacks = feedbacks;
        this._question = question;
        this._responses = responses;
        this._element = null;
    }

    get player() {
        return this._player;
    }

    get typeId() {
        return this._typeId;
    }

    get isValidContent() {
        return false;
    }

    get questionId() {
        return this._questionId;
    }

    get questionnaire() {
        return this._questionnaire;
    }

    get questionText() {
        return this._question;
    }

    get answers() {
        return this._answers;
    }

    get feedbacks() {
        return this._feedbacks;
    }

    get responses() {
        return this._responses;
    }

    onContentChanged(fn) {
        this._onContentChanged = fn;
    }

    async checkResult() {

    }

    get result() {
        // Return the result object
        return {
            questionId: "",
            questionnaire: "",
            response: null
        }
    }

    get element() {
        return this._element;
    }

    get requireFeedback() {
        return true;
    }

    async sendResult() {
        console.warn("Quiz question: send result not implemented");
    }
}

export class ChoiceQuestion extends QuizQuestion {
    constructor(player,questionnaire, questionData) {
        super(player,questionnaire, questionData);
        this._valid = false;
        this._element = createElementWithHtmlText(`
            <div>
                ${this.questionText}
                ${this.responses.map((response,i) => {
                    const id = this.getChoiceId(i);
                    return `
                        <input type="radio" id="${id}" name="quizAnswers" />
                        <label for="${id}">${response}</label>
                        <span class="quiz-question-response" id="${id}_response"></span>
                    `
                }).join('\n')}
            </div>
        `);
        Array.from(this._element.getElementsByTagName('input')).forEach(input => {
            input.addEventListener('click', evt => {
                this._valid = true;
                evt.target._question?._onContentChanged(this._question);
                evt.stopPropagation();
            });
            input._question = this;
        });
    }

    getChoiceId(index) {
        return `choice_${index}`;
    }

    get isValidContent() {
        return this._valid;
    }

    async checkResult() {
        const results = this.answers && this.answers.map((answer,i) => {
            const element = document.getElementById(this.getChoiceId(i));
            element.setAttribute('disabled','disabled');
            return {
                element,
                hintElement: document.getElementById(`${this.getChoiceId(i)}_response`),
                answer,
                selection: element.checked,
                response: this.feedbacks[i],
                correct: element.checked === answer
            }
        });

        return results
            .map(r => {
                if (r.correct) {
                    r.hintElement.classList.add("correct-answer");
                }
                else {
                    r.hintElement.classList.add("wrong-answer");
                }
                r.hintElement.innerHTML = r.response;
                return r.correct;
            })
            .every(r => r === true);
    }
}

export class MultiChoiceQuestion extends ChoiceQuestion {
    constructor(player,questionnaire, questionData) {
        super(player,questionnaire, questionData);
        this._valid = true;

        this._element = createElementWithHtmlText(`
            <div>
                ${this.questionText}
                ${this.responses.map((response,i) => {
                    const id = `check_${i}`;
                    return `
                        <input type="checkbox" id="${id}" name="quizAnswer${id}" />
                        <label for="${id}">${response}</label>
                        <span class="quiz-question-response" id="${id}_response"></span>
                    `
                }).join('\n')}
            </div>
        `);
    }

    getChoiceId(index) {
        return `check_${index}`;
    }
}

export class OpenQuestion extends QuizQuestion {
    constructor(player,questionnaire, questionData) {
        super(player,questionnaire, questionData);
        this._valid = false;
        this._element = createElementWithHtmlText(`
            <div>
                ${this.questionText}
                <textarea id="quizpluginanswerTextResult"></textarea>
            </div>
        `)
        
        this._element.addEventListener("keyup", evt => {
            evt.stopPropagation();
            this._valid = evt.target.value !== "";
            this._onContentChanged && this._onContentChanged(this);
        });
    }

    get isValidContent() {
        return this._valid;
    }

    async checkResult() {
        return true;
    }

    get requireFeedback() {
        return false;
    }
}

export class LikertQuestion extends QuizQuestion {
    constructor(player,questionnaire, questionData) {
        super(player,questionnaire, questionData);
        this._valid = false;
        this._element = createElementWithHtmlText(`
            <div>
                ${this.questionText}${
                [0,1,2,3,4,5].map(index => `
                <div>
                    <input type="radio" name="likerAnswer" id="liker-answer-${index}"><label for="liker-answer-${index}">${this.player.translate('liker_answer_' + index)}</input>
                </div>`).join("\n")
            }</div>
        `);

        this._element.addEventListener('click', evt => {
            this._valid = true;
            this._onContentChanged && this._onContentChanged(this);
        });
    }

    get isValidContent() {
        return this._valid;
    }

    async checkResult() {
        return true;
    }

    get requireFeedback() {
        return false;
    }
}

export class MessageQuestion extends QuizQuestion {
    constructor(player,questionnaire, questionData) {
        super(player,questionnaire, questionData);
        this._element = createElementWithHtmlText(`
            <div>
                ${this.questionText}
            </div>
        `);
    }

    get isValidContent() {
        return true;
    }

    get requireFeedback() {
        return false;
    }
}

export const createQuizQuestion = (player, questionnaire, questionData) => {
    switch (questionData.type) {
    case 'choice-question':
        return new ChoiceQuestion(player, questionnaire, questionData);
    case 'multiple-choice-question':
        return new MultiChoiceQuestion(player, questionnaire, questionData);
    case 'open-question':
        return new OpenQuestion(player, questionnaire, questionData);
    case 'likert-question':
        return new LikertQuestion(player, questionnaire, questionData);
    case 'message':
        return new MessageQuestion(player, questionnaire, questionData);
    }
}
