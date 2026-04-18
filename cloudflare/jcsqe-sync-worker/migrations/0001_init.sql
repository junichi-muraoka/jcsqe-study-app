-- JCSQE 専用 D1（ut-qms の DB とは別インスタンスでバインドする）
CREATE TABLE study_snapshots (
  user_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX idx_study_snapshots_updated ON study_snapshots(updated_at_ms);
