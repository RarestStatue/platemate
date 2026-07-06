from scraper.storage import _generate_password_hash, _sanitize_username


class TestSanitizeUsername:
    def test_clean_name(self):
        assert _sanitize_username("chef_bob") == "chef_bob"

    def test_special_chars(self):
        result = _sanitize_username("user@name!#")
        assert all(c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-"
                    for c in result)

    def test_truncation(self):
        long = "a" * 100
        assert len(_sanitize_username(long)) <= 50


class TestPasswordHash:
    def test_length(self):
        h = _generate_password_hash()
        assert len(h) >= 20

    def test_bcrypt_prefix(self):
        h = _generate_password_hash()
        assert h.startswith("$2b$12$")
