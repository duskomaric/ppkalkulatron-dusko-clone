<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreArticleRequest;
use App\Http\Requests\API\V1\UpdateArticleRequest;
use App\Http\Resources\API\V1\ArticleResource;
use App\Models\Article;
use App\Models\Company;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Articles', weight: 4)]
class ArticleController extends Controller
{
    #[Endpoint(operationId: 'getArticles', title: 'Get articles', description: 'Get all articles')]
    public function index(Request $request, Company $company): AnonymousResourceCollection
    {
        $query = $company->articles()->latest();

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $status = $request->query('status');
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $type = $request->query('type');
        if ($type) {
            $query->where('type', $type);
        }

        $taxRate = $request->query('tax_rate');
        if ($taxRate === 'none') {
            $query->whereNull('tax_rate');
        } elseif ($taxRate) {
            $query->where('tax_rate', $taxRate);
        }

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
        // Route model binding ensures article belongs to company
        $article->delete();
        return response()->json(['message' => 'Article deleted successfully']);
    }
}
