-- Shared local development initialization script for Infinitunes & Lipi
-- Creates extensions and ensures database readiness on local_platforms

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log readiness
DO $$
BEGIN
  RAISE NOTICE 'Database local_platforms initialized with pgcrypto and uuid-ossp extensions.';
END $$;
