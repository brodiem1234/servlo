-- Add GST registration flag to businesses
alter table businesses add column if not exists gst_registered boolean not null default true;
