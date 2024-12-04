\echo 'Delete and recreate job_jotter db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE IF EXISTS job_jotter;
CREATE DATABASE job_jotter;
\connect job_jotter

\i job-jotter-schema.sql
\i job-jotter-seed.sql

\echo 'Delete and recreate job_jotter_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE IF EXISTS job_jotter_test;
CREATE DATABASE job_jotter_test;
\connect job_jotter_test

\i job-jotter-schema.sql
