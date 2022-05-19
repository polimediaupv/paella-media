
import { createElementWithHtmlText } from "paella-core";

export default class QuizQuestion {
    constructor(questionnaire, { _id, answers, feedbacks, question, responses, type }) {
        this._typeId = type;
        this._questionnaire = questionnaire;
        this._questionId = _id;
        this._answers = answers;
        this._feedbacks = feedbacks;
        this._question = question;
        this._responses = responses;
        this._element = null;
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
}

export class ChoiceQuestion extends QuizQuestion {
    constructor(questionnaire, questionData) {
        super(questionnaire, questionData);
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
    constructor(questionnaire, questionData) {
        super(questionnaire, questionData);
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
    constructor(questionnaire, questionData) {
        super(questionnaire, questionData);
    }

    get isValidContent() {
        // return true when the text input field is not empty
        return false;
    }
}

export class LikertQuestion extends QuizQuestion {
    constructor(questionnaire, questionData) {
        super(questionnaire, questionData);
    }

    get isValidContent() {
        // return true when an option is checked
    }
}

export class MessageQuestion extends QuizQuestion {
    constructor(questionnaire, questionData) {
        super(questionnaire, questionData);
    }

    get isValidContent() {
        return true;
    }
}

export const createQuizQuestion = (questionnaire, questionData) => {
    switch (questionData.type) {
    case 'choice-question':
        return new ChoiceQuestion(questionnaire, questionData);
    case 'multiple-choice-question':
        return new MultiChoiceQuestion(questionnaire, questionData);
    case 'open-question':
        return new OpenQuestion(questionnaire, questionData);
    case 'likert-question':
        return new LikertQuestion(questionnaire, questionData);
    case 'message':
        return new MessageQuestion(questionnaire, questionData);
    }
}
