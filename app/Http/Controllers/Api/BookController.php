<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $query = Book::with(['penerbit', 'category', 'rak']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('judul', 'like', "%{$request->search}%")
                  ->orWhere('penulis', 'like', "%{$request->search}%")
                  ->orWhere('isbn', 'like', "%{$request->search}%");
            });
        }
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->penerbit_id) {
            $query->where('penerbit_id', $request->penerbit_id);
        }
        if ($request->rak_id) {
            $query->where('rak_id', $request->rak_id);
        }
        if ($request->has('available')) {
            $query->where('stok_tersedia', '>', 0);
        }

        $books = $query->orderBy('judul')->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $books]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'isbn' => 'nullable|string|max:20|unique:books',
            'penulis' => 'required|string|max:255',
            'penerbit_id' => 'nullable|exists:penerbit,id',
            'category_id' => 'nullable|exists:categories,id',
            'rak_id' => 'nullable|exists:rak_buku,id',
            'tahun_terbit' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'stok' => 'required|integer|min:0',
            'cover' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'deskripsi' => 'nullable|string',
            'bahasa' => 'nullable|string|max:50',
            'jumlah_halaman' => 'nullable|integer|min:1',
        ]);

        $data = $request->except('cover');
        $data['stok_tersedia'] = $request->stok;
        $data['kode_buku'] = $request->kode_buku ?: Book::generateKodeBuku();

        if ($request->hasFile('cover')) {
            $data['cover'] = $request->file('cover')->store('covers', 'public');
        }

        $book = Book::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Buku berhasil ditambahkan.',
            'data' => $book->load(['penerbit', 'category', 'rak']),
        ], 201);
    }

    public function show(Book $book)
    {
        return response()->json([
            'success' => true,
            'data' => $book->load(['penerbit', 'category', 'rak']),
        ]);
    }

    public function update(Request $request, Book $book)
    {
        $request->validate([
            'judul' => 'sometimes|string|max:255',
            'isbn' => 'nullable|string|max:20|unique:books,isbn,' . $book->id,
            'penulis' => 'sometimes|string|max:255',
            'penerbit_id' => 'nullable|exists:penerbit,id',
            'category_id' => 'nullable|exists:categories,id',
            'rak_id' => 'nullable|exists:rak_buku,id',
            'tahun_terbit' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'stok' => 'sometimes|integer|min:0',
            'cover' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'deskripsi' => 'nullable|string',
            'bahasa' => 'nullable|string|max:50',
            'jumlah_halaman' => 'nullable|integer|min:1',
        ]);

        $data = $request->except('cover');

        if ($request->has('stok')) {
            $diff = $request->stok - $book->stok;
            $data['stok_tersedia'] = max(0, $book->stok_tersedia + $diff);
        }

        if ($request->hasFile('cover')) {
            if ($book->cover && file_exists(public_path('storage/' . $book->cover))) {
                unlink(public_path('storage/' . $book->cover));
            }
            $data['cover'] = $request->file('cover')->store('covers', 'public');
        }

        $book->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Buku berhasil diperbarui.',
            'data' => $book->load(['penerbit', 'category', 'rak']),
        ]);
    }

    public function destroy(Book $book)
    {
        if ($book->peminjaman()->where('status', 'dipinjam')->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Buku tidak bisa dihapus karena masih dipinjam.',
            ], 422);
        }

        if ($book->cover && file_exists(public_path('storage/' . $book->cover))) {
            unlink(public_path('storage/' . $book->cover));
        }

        $book->delete();

        return response()->json([
            'success' => true,
            'message' => 'Buku berhasil dihapus.',
        ]);
    }
}
