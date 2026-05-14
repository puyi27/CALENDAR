CREATE TABLE IF NOT EXISTS categories (
  id_category SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  name_es VARCHAR(255),
  icon VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS departments (
  name VARCHAR(255) PRIMARY KEY,
  webhook_url TEXT,
  default_category_id INT REFERENCES categories(id_category)
);

CREATE TABLE IF NOT EXISTS users (
  id_user SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  alias VARCHAR(255),
  "phoneNumber" VARCHAR(255),
  work VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  department VARCHAR(255) REFERENCES departments(name),
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  description TEXT,
  status VARCHAR(100) DEFAULT 'Disponibile',
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'es',
  default_category_id INT REFERENCES categories(id_category),
  calendar_token VARCHAR(255) UNIQUE,
  can_work_weekends BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS presences (
  id_presence SERIAL PRIMARY KEY,
  id_user INT REFERENCES users(id_user) ON DELETE CASCADE,
  date DATE NOT NULL,
  id_category INT REFERENCES categories(id_category),
  UNIQUE(id_user, date)
);

CREATE TABLE IF NOT EXISTS holidays (
  date DATE PRIMARY KEY,
  name_holiday VARCHAR(255) NOT NULL
);

INSERT INTO departments (name) VALUES ('Amministrazione') ON CONFLICT DO NOTHING;

INSERT INTO users (
  full_name, 
  email, 
  alias, 
  role, 
  department, 
  password, 
  status,
  calendar_token
) VALUES (
  'Amministratore', 
  'admin@fae.com', 
  'Admin', 
  'superadmin', 
  'Amministrazione', 
  '$2a$12$/B3Wdo5RSfttQzpXXzSGru.9/aJSpdnxetr91eCH.Vdp2mGU14e5C', 
  'Disponibile',
  md5(random()::text)
) ON CONFLICT (email) DO NOTHING;