-- Signup cleanup migration
--
-- Ensures businesses.phone is stored as text (E.164 format from signup form).
-- The signup form now concatenates a country dial code with the local number,
-- e.g. +61412345678 for an Australian mobile.
--
-- ABN validation rules (enforced client-side):
--   1. Exactly 11 digits
--   2. Official checksum: subtract 1 from d[0], multiply each digit by weights
--      [10,1,3,5,7,9,11,13,15,17,19], sum must be divisible by 89
--   3. Stored as digits only (spaces stripped), e.g. "51824753556"
--
-- Phone validation rules (enforced client-side):
--   E.164 format: +{dialCode}{localDigits} with leading zero stripped.
--   Supported country codes at signup: AU (+61), NZ (+64), GB (+44), US (+1), CA (+1).

ALTER TABLE public.businesses ALTER COLUMN phone TYPE text;
