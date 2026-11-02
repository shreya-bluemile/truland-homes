<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\Quotation;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuotationActivityController extends Controller
{
    public function index(Quotation $quotation): AnonymousResourceCollection
    {
        return ActivityResource::collection($quotation->activities()->paginate(10));
    }
}
