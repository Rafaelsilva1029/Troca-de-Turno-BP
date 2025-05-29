-- Script to clear all maintenance records
DELETE FROM maintenance_records;

-- Reset the sequence if needed
ALTER SEQUENCE maintenance_records_id_seq RESTART WITH 1;
