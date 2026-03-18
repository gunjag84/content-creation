-- posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pillar TEXT NOT NULL,
  theme TEXT NOT NULL,
  mechanic TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'carousel' CHECK(content_type IN ('single', 'carousel')),
  caption TEXT,
  slide_count INTEGER DEFAULT 1,
  impulse TEXT,
  background_path TEXT,
  template_id INTEGER,
  ad_hoc INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'exported')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- slides table
CREATE TABLE IF NOT EXISTS slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  slide_number INTEGER NOT NULL,
  slide_type TEXT NOT NULL CHECK(slide_type IN ('cover', 'content', 'cta')),
  hook_text TEXT,
  body_text TEXT,
  cta_text TEXT,
  overlay_opacity REAL DEFAULT 0.5,
  custom_background_path TEXT,
  background_position_x REAL DEFAULT 50,
  background_position_y REAL DEFAULT 50,
  background_scale REAL DEFAULT 1.0,
  zone_overrides TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- performance table
CREATE TABLE IF NOT EXISTS post_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL UNIQUE,
  reach INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  ad_spend REAL,
  cost_per_result REAL,
  link_clicks INTEGER,
  notes TEXT,
  performance_score REAL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  ig_media_id TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- meta (Instagram) token storage
CREATE TABLE IF NOT EXISTS meta_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_token TEXT NOT NULL,
  ig_user_id TEXT NOT NULL,
  ig_username TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- story stats (data stored, no UI yet)
CREATE TABLE IF NOT EXISTS story_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ig_media_id TEXT NOT NULL UNIQUE,
  impressions INTEGER,
  reach INTEGER,
  replies INTEGER,
  taps_forward INTEGER,
  taps_back INTEGER,
  exits INTEGER,
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- standalone IG posts (not created in Content Studio, imported from Instagram)
CREATE TABLE IF NOT EXISTS ig_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ig_media_id TEXT NOT NULL UNIQUE,
  caption TEXT,
  media_type TEXT,
  permalink TEXT,
  timestamp TEXT,
  reach INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  ad_spend REAL,
  cost_per_result REAL,
  link_clicks INTEGER,
  performance_score REAL DEFAULT 0,
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- balance matrix cache
CREATE TABLE IF NOT EXISTS balance_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variable_type TEXT NOT NULL,
  variable_value TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER,
  avg_performance REAL,
  UNIQUE(variable_type, variable_value)
);
