# Maps point-evidence schema

This directory holds sanitized, normalized point receipts for the True Color Day 0 Maps validation and valid or attempted baseline scans. It does not hold vendor credentials, account URLs, private screenshots, billing records, customer data, or raw provider exports; those stay in the authorized private Vault evidence location.

## Naming

Use `SG-MAPS-v1-D0-YYYY-MM-DD.csv` for the first-method validation and `SG-MAPS-v1-YYYY-MM-DD.csv` for its baseline attempt; increment `v1` when a material method change starts a new series. A retry adds `-retry-{n}`. Never overwrite a prior receipt; a correction is a new file and a new weekly-log note.

## Required CSV columns

```text
scan_id,record_type,method_version,collected_at,query,point_id,latitude,longitude,rank,status,first_pack_1,first_pack_2,first_pack_3,validity,note
```

Rules:

- one row per point/query observation;
- `record_type` is `day0_validation` or `baseline`;
- a Day 0 validation has exactly 25 unique point IDs for one accepted exact query and never counts as baseline;
- a baseline attempt has exactly 25 unique point IDs for each of the three accepted exact queries;
- `rank` is a positive integer when found and blank when a successful search observes the listing outside the accepted result depth;
- `status` is `ranked`, `not_in_pack`, or `collection_error`;
- `validity` is `valid` only when the search completed with the frozen method;
- an error is never converted to rank zero or `not_in_pack`;
- competitor fields contain only observed public listing names from the first pack positions;
- coordinates and query strings match the accepted method card exactly;
- the weekly log records the Git path, row count, scan validity, and SHA-256 of the private raw export.

A passing Day 0 validation has 25 rows, no `collection_error`, and no invalid row. A valid weekly baseline scan has 75 rows, no `collection_error`, and no invalid row. Invalid attempts remain evidence and must not be deleted or silently repaired.
