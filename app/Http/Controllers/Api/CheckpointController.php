<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use Illuminate\Http\Request;

class CheckpointController extends Controller
{
    public function index(Request $request)
    {
        $query = Checkpoint::with(['user:id,name,role', 'book:id,judul', 'peminjaman:id,kode_peminjaman', 'verifier:id,name']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->whereHas('user', fn($u) => $u->where('name', 'like', "%{$request->search}%"))
                  ->orWhereHas('book', fn($b) => $b->where('judul', 'like', "%{$request->search}%"))
                  ->orWhereHas('peminjaman', fn($p) => $p->where('kode_peminjaman', 'like', "%{$request->search}%"));
            });
        }
        if ($request->tipe) {
            $query->where('tipe', $request->tipe);
        }
        if ($request->from_date) {
            $query->whereDate('waktu', '>=', $request->from_date);
        }
        if ($request->to_date) {
            $query->whereDate('waktu', '<=', $request->to_date);
        }
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $checkpoints = $query->orderByDesc('waktu')->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $checkpoints]);
    }

    public function show(Checkpoint $checkpoint)
    {
        return response()->json([
            'success' => true,
            'data' => $checkpoint->load(['user', 'book', 'peminjaman', 'verifier']),
        ]);
    }
}
