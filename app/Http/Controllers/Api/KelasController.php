<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use Illuminate\Http\Request;

class KelasController extends Controller
{
    public function index(Request $request)
    {
        $query = Kelas::withCount('siswa');

        if ($request->search) {
            $query->where('nama_kelas', 'like', "%{$request->search}%");
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $kelas = $query->orderBy('tingkat')->orderBy('nama_kelas')
            ->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $kelas]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kelas' => 'required|string|max:255',
            'tingkat' => 'nullable|string|max:10',
            'jurusan' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $kelas = Kelas::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil ditambahkan.',
            'data' => $kelas,
        ], 201);
    }

    public function show(Kelas $kela)
    {
        return response()->json([
            'success' => true,
            'data' => $kela->loadCount('siswa')->load(['siswa' => function($q) {
                $q->select('id', 'name', 'nis', 'email', 'kelas_id');
            }]),
        ]);
    }

    public function update(Request $request, Kelas $kela)
    {
        $request->validate([
            'nama_kelas' => 'sometimes|string|max:255',
            'tingkat' => 'nullable|string|max:10',
            'jurusan' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $kela->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil diperbarui.',
            'data' => $kela,
        ]);
    }

    public function destroy(Kelas $kela)
    {
        if ($kela->siswa()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak bisa dihapus karena masih memiliki siswa.',
            ], 422);
        }

        $kela->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus.',
        ]);
    }
}
