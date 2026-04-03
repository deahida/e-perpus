<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RakBuku;
use Illuminate\Http\Request;

class RakBukuController extends Controller
{
    public function index(Request $request)
    {
        $query = RakBuku::with('category')->withCount('books');

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('nama_rak', 'like', "%{$request->search}%")
                  ->orWhere('kode_rak', 'like', "%{$request->search}%");
            });
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $rak = $query->orderBy('kode_rak')->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $rak]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_rak' => 'required|string|max:50|unique:rak_buku',
            'nama_rak' => 'required|string|max:255',
            'lokasi' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        $rak = RakBuku::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Rak buku berhasil ditambahkan.',
            'data' => $rak->load('category'),
        ], 201);
    }

    public function show(RakBuku $rakBuku)
    {
        return response()->json([
            'success' => true,
            'data' => $rakBuku->load('category')->loadCount('books'),
        ]);
    }

    public function update(Request $request, RakBuku $rakBuku)
    {
        $request->validate([
            'kode_rak' => 'sometimes|string|max:50|unique:rak_buku,kode_rak,' . $rakBuku->id,
            'nama_rak' => 'sometimes|string|max:255',
            'lokasi' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        $rakBuku->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Rak buku berhasil diperbarui.',
            'data' => $rakBuku->load('category'),
        ]);
    }

    public function destroy(RakBuku $rakBuku)
    {
        if ($rakBuku->books()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Rak tidak bisa dihapus karena masih memiliki buku.',
            ], 422);
        }

        $rakBuku->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rak buku berhasil dihapus.',
        ]);
    }
}
