-- Commit to Learn Database Initialization Script
-- This script runs automatically when PostgreSQL container starts for the first time
-- It executes only when the data directory is empty (first initialization)

-- Set timezone for the session
SET timezone = 'UTC';

-- Create useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search (useful for future search features)

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON DATABASE commit_to_learn TO commit_user;

-- Note: Scripts in /docker-entrypoint-initdb.d/ run after database creation
-- and are executed while connected to the commit_to_learn database

-- Set default privileges for future objects in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO commit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO commit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO commit_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO commit_user;
GRANT CREATE ON SCHEMA public TO commit_user;

-- Create schema if needed (optional, public is default)
-- CREATE SCHEMA IF NOT EXISTS commit_schema;
-- GRANT ALL ON SCHEMA commit_schema TO commit_user;

-- Optimize for development (session-level settings)
-- These apply only to the current session, for persistent settings use postgresql.conf
SET work_mem = '16MB';
SET maintenance_work_mem = '128MB';
SET effective_cache_size = '1GB';
SET random_page_cost = 1.1; -- Optimized for SSD storage
SET effective_io_concurrency = 200; -- For SSD

-- Enable query logging for debugging (can be disabled in production)
SET log_statement = 'all';
SET log_duration = on;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Commit to Learn Database Initialized!';
    RAISE NOTICE 'Database: commit_to_learn';
    RAISE NOTICE 'User: commit_user';
    RAISE NOTICE 'Timezone: UTC';
    RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm';
    RAISE NOTICE '========================================';
END $$;

