import { DataPlugin } from 'paella-core';

export default class QuizDataPlugin extends DataPlugin {
    async load() {

    }

    async read(context, { id }) {
        try {
            const defaultQuizUrl = `/rest/plugins/user-administrator/video/${ id }/defaultQuiz`;
            const defaultQuizResponse = await fetch(defaultQuizUrl);
            if (defaultQuizResponse.ok) {
                const defaultQuiz = await defaultQuizResponse.json();
                const quizUrl = `/rest/plugins/user-administrator/quiz/${defaultQuiz.default}`;
                const quizResponse = await fetch(quizUrl);
                const quizData = (quizResponse.ok && (await quizResponse.json())) || null;
                return quizData;
            }
        }
        catch (err) {
        }
        return null;
    }
}
