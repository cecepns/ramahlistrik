# Database Migrations - Ramah Listrik

Setiap perubahan skema database MySQL (tambah kolom/tabel baru) akan selalu dicatat dalam folder ini.

## Daftar Migration Script:

1. `sql/migrations/001_add_gps_and_deposit_proof.sql`
   - Menambahkan kolom `latitude` & `longitude` pada tabel `technician_profiles`.
   - Menambahkan kolom `status` (`pending`, `approved`, `rejected`) & `proof_image` pada tabel `deposits`.

## Cara Menjalankan Migration di Database Eksisting:

```bash
mysql -u root -p ramah_listrik < sql/migrations/001_add_gps_and_deposit_proof.sql
```
