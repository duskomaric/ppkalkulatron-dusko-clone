<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OFSService
{
    protected string $baseUrl;

    protected Company $company;

    public function __construct(Company $company)
    {
        $this->company = $company;
        $this->baseUrl = rtrim(CompanySetting::get('ofs_base_url', 'https://pos.ofs.ba', $company->id), '/');
    }

    protected function getConf(string $key, mixed $default = null): mixed
    {
        return CompanySetting::get($key, $default, $this->company->id);
    }

    protected function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->getConf('ofs_api_key'),
            'X-Teron-SerialNumber' => $this->getConf('ofs_serial_number'),
            'X-PAC' => $this->getConf('ofs_pac'),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    protected function request(string $method, string $path, array $payload = [], ?string $requestId = null)
    {
        $endpoint = $this->baseUrl.$path;

        $headers = $this->headers();
        if ($requestId !== null) {
            $headers['RequestId'] = $requestId;
        }

        Log::info('OFS request', [
            'method' => $method,
            'url' => $endpoint,
            'request_id' => $requestId,
            'payload_json' => $method === 'GET' ? null : json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        ]);

        $http = Http::withHeaders($headers);
        $response = $method === 'GET'
            ? $http->get($endpoint)
            : $http->send($method, $endpoint, ['json' => $payload]);

        Log::info('OFS response', [
            'status' => $response->status(),
            'successful' => $response->successful(),
            'body' => $response->body(),
            'json' => $response->json(),
        ]);

        return $response;
    }

    public function getStatus()
    {
        return $this->request('GET', '/api/status');
    }

    /**
     * Test API availability (GET /api/attention)
     * Returns HTTP 200 OK if ESIR is available and configured correctly
     */
    public function testAttention()
    {
        return $this->request('GET', '/api/attention');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  string|null  $requestId  Jedinstveni ID zahteva (HTTP RequestId). U slučaju gubitka odgovora, može se proveriti status preko getInvoiceByRequestId().
     */
    public function createInvoice(array $payload, ?string $requestId = null)
    {
        return $this->request('POST', '/api/invoices', $payload, $requestId);
    }

    /**
     * Pregled sadržaja računa po broju zahteva (RequestId).
     * Koristi se kada je zahtev za fiskalizaciju poslat ali odgovor nije stigao (mrežni problemi).
     * Vraća kompletan sadržaj računa ako je fiskalizacija uspela, ili prazan odgovor ako nije.
     * Napomena: OFS čuva poslednjih 100 zahteva.
     */
    public function getInvoiceByRequestId(string $requestId)
    {
        return $this->request('GET', '/api/invoices/request/'.$requestId, [], $requestId);
    }

    public function getSettings()
    {
        return $this->request('GET', '/api/settings');
    }
}
