from scraper.ingredient_matcher import normalize_name


class TestNormalizeName:
    def test_lowercase_trim(self):
        assert normalize_name("  Butter  ") == "butter"

    def test_strip_descriptors(self):
        assert normalize_name("fresh chopped onion") == "onion"

    def test_singularize_s(self):
        assert normalize_name("carrots") == "carrot"

    def test_singularize_ies(self):
        assert normalize_name("berries") == "berry"

    def test_irregular_plural(self):
        assert normalize_name("tomatoes") == "tomato"
        assert normalize_name("potatoes") == "potato"
        assert normalize_name("leaves") == "leaf"

    def test_strip_parenthetical(self):
        assert normalize_name("chicken (boneless)") == "chicken"

    def test_preserves_compound(self):
        assert normalize_name("soy sauce") == "soy sauce"

    def test_all_descriptors_removed_keeps_original(self):
        assert normalize_name("fresh") == "fresh"

    def test_olives_not_mangled(self):
        assert normalize_name("olives") == "olive"

    def test_grapes_not_mangled(self):
        assert normalize_name("grapes") == "grape"

    def test_noodles_not_mangled(self):
        assert normalize_name("noodles") == "noodle"

    def test_apples_not_mangled(self):
        assert normalize_name("apples") == "apple"

    def test_pancakes_not_mangled(self):
        assert normalize_name("pancakes") == "pancake"

    def test_hummus_preserved(self):
        assert normalize_name("hummus") == "hummus"

    def test_couscous_preserved(self):
        assert normalize_name("couscous") == "couscous"

    def test_sibilant_es_stripped(self):
        assert normalize_name("peaches") == "peach"
        assert normalize_name("radishes") == "radish"
