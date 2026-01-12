-- Location tables for consistent dropdowns across the app
-- Countries, States/Provinces, and Cities

-- Countries table
CREATE TABLE IF NOT EXISTS public.countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(2) UNIQUE NOT NULL, -- ISO 3166-1 alpha-2 (e.g., 'AU', 'US')
  name VARCHAR(100) NOT NULL,
  iso3 VARCHAR(3), -- ISO 3166-1 alpha-3 (e.g., 'AUS', 'USA')
  numeric_code VARCHAR(3),
  phone_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- States/Provinces table
CREATE TABLE IF NOT EXISTS public.states (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  code VARCHAR(10), -- State code (e.g., 'NSW', 'CA', 'ON')
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_id, code),
  UNIQUE(country_id, name)
);

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id SERIAL PRIMARY KEY,
  state_id INTEGER REFERENCES public.states(id) ON DELETE CASCADE,
  country_id INTEGER NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, country_id, name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_states_country_id ON public.states(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON public.cities(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);

-- RLS Policies - Allow public read access
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read on countries" ON public.countries
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on states" ON public.states
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on cities" ON public.cities
  FOR SELECT USING (true);

-- Insert common countries (you can expand this)
INSERT INTO public.countries (code, name, iso3, phone_code) VALUES
  ('AU', 'Australia', 'AUS', '+61'),
  ('US', 'United States', 'USA', '+1'),
  ('GB', 'United Kingdom', 'GBR', '+44'),
  ('CA', 'Canada', 'CAN', '+1'),
  ('NZ', 'New Zealand', 'NZL', '+64'),
  ('IE', 'Ireland', 'IRL', '+353'),
  ('DE', 'Germany', 'DEU', '+49'),
  ('FR', 'France', 'FRA', '+33'),
  ('IT', 'Italy', 'ITA', '+39'),
  ('ES', 'Spain', 'ESP', '+34'),
  ('NL', 'Netherlands', 'NLD', '+31'),
  ('BE', 'Belgium', 'BEL', '+32'),
  ('CH', 'Switzerland', 'CHE', '+41'),
  ('AT', 'Austria', 'AUT', '+43'),
  ('SE', 'Sweden', 'SWE', '+46'),
  ('NO', 'Norway', 'NOR', '+47'),
  ('DK', 'Denmark', 'DNK', '+45'),
  ('FI', 'Finland', 'FIN', '+358'),
  ('PL', 'Poland', 'POL', '+48'),
  ('PT', 'Portugal', 'PRT', '+351')
ON CONFLICT (code) DO NOTHING;

-- Insert Australian states
INSERT INTO public.states (country_id, code, name)
SELECT c.id, v.code, v.name FROM (VALUES
  ('AU', 'NSW', 'New South Wales'),
  ('AU', 'VIC', 'Victoria'),
  ('AU', 'QLD', 'Queensland'),
  ('AU', 'WA', 'Western Australia'),
  ('AU', 'SA', 'South Australia'),
  ('AU', 'TAS', 'Tasmania'),
  ('AU', 'ACT', 'Australian Capital Territory'),
  ('AU', 'NT', 'Northern Territory')
) AS v(country_code, code, name)
JOIN public.countries c ON c.code = v.country_code
ON CONFLICT (country_id, code) DO NOTHING;

-- Insert US states
INSERT INTO public.states (country_id, code, name)
SELECT c.id, v.code, v.name FROM (VALUES
  ('US', 'AL', 'Alabama'),
  ('US', 'AK', 'Alaska'),
  ('US', 'AZ', 'Arizona'),
  ('US', 'AR', 'Arkansas'),
  ('US', 'CA', 'California'),
  ('US', 'CO', 'Colorado'),
  ('US', 'CT', 'Connecticut'),
  ('US', 'DE', 'Delaware'),
  ('US', 'FL', 'Florida'),
  ('US', 'GA', 'Georgia'),
  ('US', 'HI', 'Hawaii'),
  ('US', 'ID', 'Idaho'),
  ('US', 'IL', 'Illinois'),
  ('US', 'IN', 'Indiana'),
  ('US', 'IA', 'Iowa'),
  ('US', 'KS', 'Kansas'),
  ('US', 'KY', 'Kentucky'),
  ('US', 'LA', 'Louisiana'),
  ('US', 'ME', 'Maine'),
  ('US', 'MD', 'Maryland'),
  ('US', 'MA', 'Massachusetts'),
  ('US', 'MI', 'Michigan'),
  ('US', 'MN', 'Minnesota'),
  ('US', 'MS', 'Mississippi'),
  ('US', 'MO', 'Missouri'),
  ('US', 'MT', 'Montana'),
  ('US', 'NE', 'Nebraska'),
  ('US', 'NV', 'Nevada'),
  ('US', 'NH', 'New Hampshire'),
  ('US', 'NJ', 'New Jersey'),
  ('US', 'NM', 'New Mexico'),
  ('US', 'NY', 'New York'),
  ('US', 'NC', 'North Carolina'),
  ('US', 'ND', 'North Dakota'),
  ('US', 'OH', 'Ohio'),
  ('US', 'OK', 'Oklahoma'),
  ('US', 'OR', 'Oregon'),
  ('US', 'PA', 'Pennsylvania'),
  ('US', 'RI', 'Rhode Island'),
  ('US', 'SC', 'South Carolina'),
  ('US', 'SD', 'South Dakota'),
  ('US', 'TN', 'Tennessee'),
  ('US', 'TX', 'Texas'),
  ('US', 'UT', 'Utah'),
  ('US', 'VT', 'Vermont'),
  ('US', 'VA', 'Virginia'),
  ('US', 'WA', 'Washington'),
  ('US', 'WV', 'West Virginia'),
  ('US', 'WI', 'Wisconsin'),
  ('US', 'WY', 'Wyoming'),
  ('US', 'DC', 'District of Columbia')
) AS v(country_code, code, name)
JOIN public.countries c ON c.code = v.country_code
ON CONFLICT (country_id, code) DO NOTHING;

-- Insert Canadian provinces
INSERT INTO public.states (country_id, code, name)
SELECT c.id, v.code, v.name FROM (VALUES
  ('CA', 'AB', 'Alberta'),
  ('CA', 'BC', 'British Columbia'),
  ('CA', 'MB', 'Manitoba'),
  ('CA', 'NB', 'New Brunswick'),
  ('CA', 'NL', 'Newfoundland and Labrador'),
  ('CA', 'NS', 'Nova Scotia'),
  ('CA', 'ON', 'Ontario'),
  ('CA', 'PE', 'Prince Edward Island'),
  ('CA', 'QC', 'Quebec'),
  ('CA', 'SK', 'Saskatchewan'),
  ('CA', 'NT', 'Northwest Territories'),
  ('CA', 'NU', 'Nunavut'),
  ('CA', 'YT', 'Yukon')
) AS v(country_code, code, name)
JOIN public.countries c ON c.code = v.country_code
ON CONFLICT (country_id, code) DO NOTHING;

-- Insert some major cities (you can expand this with a more comprehensive list)
-- Australian cities
INSERT INTO public.cities (state_id, country_id, name)
SELECT s.id, s.country_id, city_name FROM (VALUES
  ('NSW', 'Sydney'),
  ('NSW', 'Newcastle'),
  ('NSW', 'Wollongong'),
  ('VIC', 'Melbourne'),
  ('VIC', 'Geelong'),
  ('QLD', 'Brisbane'),
  ('QLD', 'Gold Coast'),
  ('QLD', 'Cairns'),
  ('WA', 'Perth'),
  ('WA', 'Fremantle'),
  ('SA', 'Adelaide'),
  ('TAS', 'Hobart'),
  ('TAS', 'Launceston'),
  ('ACT', 'Canberra'),
  ('NT', 'Darwin')
) AS v(state_code, city_name)
JOIN public.states s ON s.code = v.state_code
JOIN public.countries c ON c.id = s.country_id AND c.code = 'AU'
ON CONFLICT (state_id, country_id, name) DO NOTHING;

-- US major cities
INSERT INTO public.cities (state_id, country_id, name)
SELECT s.id, s.country_id, city_name FROM (VALUES
  ('NY', 'New York'),
  ('NY', 'Buffalo'),
  ('CA', 'Los Angeles'),
  ('CA', 'San Francisco'),
  ('CA', 'San Diego'),
  ('IL', 'Chicago'),
  ('TX', 'Houston'),
  ('TX', 'Dallas'),
  ('TX', 'Austin'),
  ('FL', 'Miami'),
  ('FL', 'Tampa'),
  ('PA', 'Philadelphia'),
  ('AZ', 'Phoenix'),
  ('WA', 'Seattle'),
  ('MA', 'Boston'),
  ('GA', 'Atlanta'),
  ('MI', 'Detroit'),
  ('CO', 'Denver'),
  ('TN', 'Nashville'),
  ('OR', 'Portland')
) AS v(state_code, city_name)
JOIN public.states s ON s.code = v.state_code
JOIN public.countries c ON c.id = s.country_id AND c.code = 'US'
ON CONFLICT (state_id, country_id, name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON public.states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
