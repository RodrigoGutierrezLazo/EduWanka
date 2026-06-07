<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseStatusAudit extends Model
{
    protected $fillable = [
        'purchase_id',
        'from_status',
        'to_status',
        'reason',
        'changed_by_user_id',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
