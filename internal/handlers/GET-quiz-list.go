package handlers

import (
	"encoding/json"
	"github.com/google/uuid"
	"net/http"
)

// SignupHandler GET /quiz/list
func QuizListHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type Question struct {
			ID      string   `json:"id"`
			Q       string   `json:"q"`
			A       []string `json:"a"`
			Correct int      `json:"correct"`
			Score   int      `json:"score"`
		}
		type Quiz struct {
			ID        string     `json:"id"`
			Name      string     `json:"name"`
			Questions []Question `json:"questions"`
		}

		quizzes := []Quiz{
			{
				ID:   uuid.NewString(),
				Name: "География",
				Questions: []Question{
					{ID: uuid.NewString(), Q: "Столица Франции", A: []string{"Лондон", "Париж", "Берлин"}, Correct: 1, Score: 1000},
					{ID: uuid.NewString(), Q: "Река в России", A: []string{"Амазонка", "Волга", "Сена"}, Correct: 1, Score: 1000},
					{ID: uuid.NewString(), Q: "Самая большая пустыня", A: []string{"Сахара", "Гоби", "Калахари"}, Correct: 0, Score: 1000},
				},
			},
			{
				ID:   uuid.NewString(),
				Name: "История",
				Questions: []Question{
					{ID: uuid.NewString(), Q: "Год начала Второй мировой войны", A: []string{"1939", "1941", "1914"}, Correct: 0, Score: 1000},
					{ID: uuid.NewString(), Q: "Кто был первым президентом США", A: []string{"Авраам Линкольн", "Джордж Вашингтон", "Томас Джефферсон"}, Correct: 1, Score: 1000},
					{ID: uuid.NewString(), Q: "Когда была Октябрьская революция", A: []string{"1905", "1917", "1924"}, Correct: 1, Score: 1000},
				},
			},
			{
				ID:   uuid.NewString(),
				Name: "Наука",
				Questions: []Question{
					{ID: uuid.NewString(), Q: "Химический символ воды", A: []string{"CO2", "H2O", "O2"}, Correct: 1, Score: 1000},
					{ID: uuid.NewString(), Q: "Скорость света", A: []string{"300 000 км/с", "150 000 км/с", "1 000 000 км/с"}, Correct: 0, Score: 1000},
					{ID: uuid.NewString(), Q: "Кто сформулировал закон всемирного тяготения", A: []string{"Ньютон", "Эйнштейн", "Галилей"}, Correct: 0, Score: 1000},
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(quizzes); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}
