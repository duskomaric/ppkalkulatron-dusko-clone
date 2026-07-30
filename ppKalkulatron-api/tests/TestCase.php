<?php

namespace Tests;

use App\Models\CompanySetting;
use App\Models\UserSetting;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Settings are cached in a static keyed by owner id, and ids are handed out again after
        // each rollback — without this a test can read the previous test's settings.
        CompanySetting::flushCachedSettings();
        UserSetting::flushCachedSettings();
    }
}
