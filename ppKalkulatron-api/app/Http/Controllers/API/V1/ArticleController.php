<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\IndexArticleRequest;
use App\Http\Requests\API\V1\StoreArticleRequest;
use App\Http\Requests\API\V1\UpdateArticleRequest;
use App\Http\Resources\API\V1\ArticleResource;
use App\Models\Article;
use App\Models\Company;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Articles', weight: 4)]
class ArticleController extends Controller
{
    #[Endpoint(operationId: 'getArticles', title: 'Get articles', description: 'Get all articles')]
    public function index(IndexArticleRequest $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->articles()->latest();

        $query
            ->when($request->validated('search'), fn ($q, $search) => $q->where('name', 'like', '%' . $search . '%'))
            ->when($request->validated('status'), function ($q, $status) {
                if ($status === 'active') {
                    $q->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $q->where('is_active', false);
                }
            })
            ->when($request->validated('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->validated('tax_rate'), function ($q, $taxRate) {
                if ($taxRate === 'none') {
                    $q->whereNull('tax_rate');
                } else {
                    $q->where('tax_rate', $taxRate);
                }
            });

        return ArticleResource::collection($query->paginate(20));
    }

    #[Endpoint(operationId: 'storeArticle', title: 'Store article', description: 'Create a new article')]
    public function store(StoreArticleRequest $request, Company $company): ArticleResource
    {
        $article = $company->articles()->create($request->validated());

        return new ArticleResource($article);
    }

    #[Endpoint(operationId: 'showArticle', title: 'Show article', description: 'Get article')]
    public function show(Company $company, Article $article): ArticleResource
    {
        // Route model binding ensures article belongs to company
        return new ArticleResource($article);
    }

    #[Endpoint(operationId: 'updateArticle', title: 'Update article', description: 'Update article')]
    public function update(UpdateArticleRequest $request, Company $company, Article $article): ArticleResource
    {
        // Route model binding ensures article belongs to company
        $article->update($request->validated());

        return new ArticleResource($article);
    }

    #[Endpoint(operationId: 'destroyArticle', title: 'Destroy article', description: 'Remove article')]
    public function destroy(Company $company, Article $article): JsonResponse
    {
        if ($article->company_id !== $company->id) {
            abort(404);
        }

        if ($article->invoiceItems()->exists()) {
            return response()->json([
                'message' => 'Artikl je korišćen u računu i ne može da se obriše'
            ], 422);
        }

        $article->delete();

        return response()->json([
            'message' => 'Article deleted successfully'
        ]);
    }
}
