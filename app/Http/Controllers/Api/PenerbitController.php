<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Penerbit;
use Illuminate\Http\Request;

class PenerbitController extends Controller
{
    public function index(Request $request)
    {
        $query = Penerbit::withCount('books');

        if ($request->search) {
            $query->where('nama_penerbit', 'like', "%{$request->search}%");
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $penerbit = $query->orderBy('nama_penerbit')->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $penerbit]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_penerbit' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        $penerbit = Penerbit::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Penerbit berhasil ditambahkan.',
            'data' => $penerbit,
        ], 201);
    }

    public function show(Penerbit $penerbit)
    {
        return response()->json([
            'success' => true,
            'data' => $penerbit->loadCount('books'),
        ]);
    }

    public function update(Request $request, Penerbit $penerbit)
    {
        $request->validate([
            'nama_penerbit' => 'sometimes|string|max:255',
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        $penerbit->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Penerbit berhasil diperbarui.',
            'data' => $penerbit,
        ]);
    }

    public function destroy(Penerbit $penerbit)
    {
        if ($penerbit->books()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Penerbit tidak bisa dihapus karena masih memiliki buku.',
            ], 422);
        }

        $penerbit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Penerbit berhasil dihapus.',
        ]);
    }
}
