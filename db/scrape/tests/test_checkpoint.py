from scraper.checkpoint import load_checkpoint, save_checkpoint


class TestCheckpoint:
    def test_load_missing(self, tmp_path, monkeypatch):
        monkeypatch.setattr("scraper.checkpoint.CHECKPOINT_FILE", tmp_path / "cp.json")
        result = load_checkpoint("test_sub")
        assert result["last_fullname"] is None
        assert result["newest_seen"] is None

    def test_save_and_load(self, tmp_path, monkeypatch):
        monkeypatch.setattr("scraper.checkpoint.CHECKPOINT_FILE", tmp_path / "cp.json")
        save_checkpoint("test_sub", "t3_abc123", newest_seen="t3_xyz789")
        result = load_checkpoint("test_sub")
        assert result["last_fullname"] == "t3_abc123"
        assert result["newest_seen"] == "t3_xyz789"

    def test_preserves_other_subreddits(self, tmp_path, monkeypatch):
        monkeypatch.setattr("scraper.checkpoint.CHECKPOINT_FILE", tmp_path / "cp.json")
        save_checkpoint("sub_a", "t3_aaa")
        save_checkpoint("sub_b", "t3_bbb")
        assert load_checkpoint("sub_a")["last_fullname"] == "t3_aaa"
        assert load_checkpoint("sub_b")["last_fullname"] == "t3_bbb"

    def test_overwrites_same_subreddit(self, tmp_path, monkeypatch):
        monkeypatch.setattr("scraper.checkpoint.CHECKPOINT_FILE", tmp_path / "cp.json")
        save_checkpoint("sub", "t3_old")
        save_checkpoint("sub", "t3_new")
        assert load_checkpoint("sub")["last_fullname"] == "t3_new"

    def test_preserves_newest_seen_on_update(self, tmp_path, monkeypatch):
        monkeypatch.setattr("scraper.checkpoint.CHECKPOINT_FILE", tmp_path / "cp.json")
        save_checkpoint("sub", "t3_first", newest_seen="t3_top")
        save_checkpoint("sub", "t3_second")
        result = load_checkpoint("sub")
        assert result["last_fullname"] == "t3_second"
        assert result["newest_seen"] == "t3_top"
