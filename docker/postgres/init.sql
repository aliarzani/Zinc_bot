-- Create database if it doesn't exist
SELECT 'CREATE DATABASE zinkbot'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'zinkbot')\gexec

-- Create user if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'zinkuser') THEN
    CREATE USER zinkuser WITH PASSWORD 'zinkpassword';
  END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zinkbot TO zinkuser;
