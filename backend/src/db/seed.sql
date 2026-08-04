-- optional: one default business (run after schema.sql)

INSERT INTO businesses (id, name)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Shifa Medical Clinic, Lahore'
)
ON CONFLICT (id) DO NOTHING;
