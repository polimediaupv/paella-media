import { DataPlugin, utils } from 'paella-core';

export default class QuizDataPlugin extends DataPlugin {
    async load() {

    }

    async read(context, { id }) {
        try {
            let quiz = utils.getUrlParameter('quiz');
            if (!quiz) {
                const defaultQuizUrl = `/rest/plugins/user-administrator/video/${ id }/defaultQuiz`;
                const defaultQuizResponse = await fetch(defaultQuizUrl);
                if (defaultQuizResponse.ok) {
                    const defaultQuiz = await defaultQuizResponse.json();
                    quiz = defaultQuiz.default;
                }
            }

            const quizUrl = `/rest/plugins/user-administrator/quiz/${quiz}?preview=true`;
            const quizResponse = await fetch(quizUrl);
            const quizData = (quizResponse.ok && (await quizResponse.json())) || null;
            return quizData;
        }
        catch (err) {
        }
        return null;
    }
}
