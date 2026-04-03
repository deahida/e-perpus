<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Sistem Perpustakaan Sekolah - Kelola buku, peminjaman, dan data perpustakaan dengan mudah">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Perpustakaan Sekolah</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/js/main.jsx'])

</head>
<body>
    <div id="root"></div>
</body>
</html>
