from scraper.heuristics import is_likely_recipe, score_post


class TestScorePost:
    def test_clear_recipe(self):
        title = "My homemade pasta recipe"
        body = (
            "## Ingredients\n"
            "- 2 cups flour\n"
            "- 3 eggs\n"
            "- 1 tsp salt\n"
            "- 1 tbsp olive oil\n\n"
            "## Instructions\n"
            "1. Mix flour and salt\n"
            "2. Add eggs and knead for 10 minutes\n"
            "3. Rest dough 30 minutes\n"
            "4. Roll and cut pasta\n"
            "5. Boil for 3 minutes\n"
        )
        s = score_post(title, body)
        assert s >= 4

    def test_meme_post(self):
        title = "When you burn water lol"
        body = "Does anyone else do this? I'm hopeless in the kitchen."
        s = score_post(title, body)
        assert s < 2

    def test_question_post(self):
        title = "What's your favorite weeknight dinner?"
        body = "Looking for ideas. I usually just make sandwiches."
        s = score_post(title, body)
        assert s < 2

    def test_partial_recipe_short(self):
        title = "Quick snack"
        body = "- cheese\n- crackers\nPut cheese on crackers."
        s = score_post(title, body)
        assert s < 2

    def test_quantity_lines_trigger(self):
        title = "dinner tonight"
        body = (
            "2 cups rice\n"
            "1 lb chicken\n"
            "3 tbsp soy sauce\n"
            "1 tsp ginger\n"
            "Cook it all together for 30 minutes.\n"
        )
        s = score_post(title, body)
        assert s >= 2


class TestIsLikelyRecipe:
    def test_recipe_returns_true(self):
        title = "Homemade bread recipe"
        body = (
            "Ingredients:\n- 3 cups flour\n- 1 tsp yeast\n- water\n\n"
            "1. Mix ingredients\n2. Knead\n3. Bake at 350°F for 30 minutes\n"
        )
        assert is_likely_recipe(title, body) is True

    def test_non_recipe_returns_false(self):
        assert is_likely_recipe("Just vibing", "Had a great day today.") is False
