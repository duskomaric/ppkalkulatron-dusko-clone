<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\UpdateUserSettingsRequest;
use App\Http\Resources\API\V1\UserSettingResource;
use App\Models\UserSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserSettingController extends Controller
{
    public function show(Request $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user()->id;

        return UserSettingResource::make([
            'user_id' => $userId,
            'settings' => UserSetting::resolved($userId),
        ])->response();
    }

    public function update(UpdateUserSettingsRequest $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user()->id;
        $settings = $request->validated('settings');

        try {
            foreach ($settings as $key => $value) {
                UserSetting::set((string) $key, $value, $userId);
            }
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['settings' => [$e->getMessage()]]);
        }

        return UserSettingResource::make([
            'user_id' => $userId,
            'settings' => UserSetting::resolved($userId),
        ])->response();
    }
}
