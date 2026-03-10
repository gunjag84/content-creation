-- posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  pillar TEXT NOT NULL,
  theme TEXT NOT NULL,
  subtopic TEXT,
  key_message TEXT,
  mechanic TEXT NOT NULL,
  template_id INTEGER,
  content_type TEXT NOT NULL CHECK(content_type IN ('single', 'carousel')),
  caption TEXT,
  slide_count INTEGER,
  ad_hoc INTEGER NOT NULL DEFAULT 0,
  settings_version_id INTEGER,
  impulse TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'exported')),
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- slides table (carousel slides)
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
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- stories table
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  post_id INTEGER NOT NULL,
  story_type TEXT NOT NULL CHECK(story_type IN ('teaser', 'reference', 'deepening', 'behind_the_scenes')),
  tool_type TEXT,
  tool_content TEXT,
  timing TEXT CHECK(timing IN ('before', 'after')),
  source_slide_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'exported')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (source_slide_id) REFERENCES slides(id) ON DELETE SET NULL
);

-- performance table (feed post metrics)
CREATE TABLE IF NOT EXISTS post_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL UNIQUE,
  reach_manual INTEGER,
  reach_api INTEGER,
  impressions_manual INTEGER,
  impressions_api INTEGER,
  likes_manual INTEGER,
  likes_api INTEGER,
  comments_manual INTEGER,
  comments_api INTEGER,
  shares_manual INTEGER,
  shares_api INTEGER,
  saves_manual INTEGER,
  saves_api INTEGER,
  revenue REAL,
  notes TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- story performance table
CREATE TABLE IF NOT EXISTS story_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL UNIQUE,
  impressions INTEGER,
  reach INTEGER,
  replies INTEGER,
  taps_forward INTEGER,
  taps_back INTEGER,
  exits INTEGER,
  sticker_taps INTEGER,
  recorded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- balance matrix cache
CREATE TABLE IF NOT EXISTS balance_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  variable_type TEXT NOT NULL,
  variable_value TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER,
  avg_performance REAL,
  UNIQUE(brand_id, variable_type, variable_value)
);

-- settings version tracking
CREATE TABLE IF NOT EXISTS settings_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  filename TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- templates table
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  background_type TEXT NOT NULL CHECK(background_type IN ('image', 'solid_color', 'gradient')),
  background_value TEXT NOT NULL,
  overlay_color TEXT,
  overlay_opacity REAL DEFAULT 0.5,
  overlay_gradient TEXT,
  overlay_enabled INTEGER NOT NULL DEFAULT 1,
  format TEXT NOT NULL CHECK(format IN ('feed', 'story')),
  zones_config TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
