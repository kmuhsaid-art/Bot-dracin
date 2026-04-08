#!/bin/bash

# 1. Tambah semua perubahan
git add .

# 2. Letakkan mesej commit (anda boleh tukar mesej ini)
read -p "Masukkan mesej commit (kosongkan untuk 'Update kod'): " msg
if [ -z "$msg" ]; then
  msg="Update kod"
fi

git commit -m "$msg"

# 3. Push ke GitHub
# Ganti 'main' dengan 'master' jika branch anda bernama master
git push origin main

echo "-------------------------------"
echo "✅ Berjaya push ke GitHub!"
echo "-------------------------------"
