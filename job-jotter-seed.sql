-- job-jotter-seed.sql

-- Clear existing data
TRUNCATE TABLE reminders RESTART IDENTITY CASCADE;
TRUNCATE TABLE interviews RESTART IDENTITY CASCADE;
TRUNCATE TABLE applications RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Insert Users
INSERT INTO users (username, password, email, first_name, last_name, is_admin)
VALUES 
('john_doe', '$2b$12$s.bWKH3bNrHfiFgEzI3QeeQ3ep9RTqw2F9WYbh40Ubcr5rhL6xOPS', 'john.doe@example.com', 'John', 'Doe', true), -- Replace with hashed passwords
('jane_smith', '$2b$12$CTl6rfVxj2CwESjhmrlF5O5C34rw5wax0gFL86VxxjUcO6JeN/yOq', 'jane.smith@example.com', 'Jane', 'Smith', false);

-- Insert Applications
INSERT INTO applications (user_id, company, job_title, status, date_applied, notes)
VALUES 
(1, 'TechCorp', 'Software Engineer', 'applied', '2024-11-01', 'Referred by a friend.'),
(1, 'DataSolutions', 'Data Analyst', 'pending', '2024-11-15', 'Submitted online application.'),
(2, 'InnovateInc', 'Frontend Developer', 'interviewed', '2024-10-20', 'Phone interview completed.');

-- Insert Interviews
INSERT INTO interviews (application_id, date, time, location, notes)
VALUES 
(3, '2024-12-05', '10:00:00', '123 Main St, New York, NY', 'On-site technical interview.'),
(2, '2024-12-10', '14:00:00', 'Virtual', 'Panel interview via Zoom.');

-- Insert Reminders
INSERT INTO reminders (user_id, reminder_type, date, description)
VALUES 
(1, 'Follow-up', '2024-12-07', 'Send a follow-up email to TechCorp.'),
(1, 'Interview', '2024-12-10', 'Prepare for DataSolutions panel interview.'),
(2, 'Deadline', '2024-11-30', 'Submit coding challenge for InnovateInc.');
