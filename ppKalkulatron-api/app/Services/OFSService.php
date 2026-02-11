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

    public function getStatus()
    {
        $endpoint = $this->baseUrl.'/api/status';

        Log::info('OFS getStatus - Request', [
            'url' => $endpoint,
            'headers' => $this->headers(),
        ]);

        $response = Http::withHeaders($this->headers())->get($endpoint);

        Log::info('OFS getStatus - Response', [
            'status' => $response->status(),
            'successful' => $response->successful(),
            'json' => $response->json(),
        ]);

        return $response;
    }

    /**
     * Test API availability (GET /api/attention)
     * Returns HTTP 200 OK if ESIR is available and configured correctly
     */
    public function testAttention()
    {
        $endpoint = $this->baseUrl.'/api/attention';

        Log::info('OFS testAttention - Request', [
            'url' => $endpoint,
            'headers' => $this->headers(),
        ]);

        $response = Http::withHeaders($this->headers())
            ->get($endpoint);

        Log::info('OFS testAttention - Response', [
            'status' => $response->status(),
            'successful' => $response->successful(),
            'body' => $response->body(),
            'json' => $response->json(),
        ]);

        return $response;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  string|null  $requestId  Jedinstveni ID zahteva (HTTP RequestId). U slučaju gubitka odgovora, može se proveriti status preko getInvoiceByRequestId().
     */
    public function createInvoice(array $payload, ?string $requestId = null)
    {
        $endpoint = $this->baseUrl.'/api/invoices';

        $headers = $this->headers();
        if ($requestId !== null) {
            $headers['RequestId'] = $requestId;
        }

        Log::info('OFS createInvoice - Request', [
            'url' => $endpoint,
            'request_id' => $requestId,
            'headers' => $headers,
            'payload' => $payload,
            'payload_json' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        ]);

        $response = Http::withHeaders($headers)
            ->post($endpoint, $payload);

        Log::info('OFS createInvoice - Response', [
            'status' => $response->status(),
            'successful' => $response->successful(),
            'body' => $response->body(),
            'json' => $response->json(),
        ]);

        return $response;
    }

    /**
     * Pregled sadržaja računa po broju zahteva (RequestId).
     * Koristi se kada je zahtev za fiskalizaciju poslat ali odgovor nije stigao (mrežni problemi).
     * Vraća kompletan sadržaj računa ako je fiskalizacija uspela, ili prazan odgovor ako nije.
     * Napomena: OFS čuva poslednjih 100 zahteva.
     */
    public function getInvoiceByRequestId(string $requestId)
    {
        $endpoint = $this->baseUrl.'/api/invoices/request/'.$requestId;

        Log::info('OFS getInvoiceByRequestId - Request', [
            'url' => $endpoint,
            'request_id' => $requestId,
        ]);

        $response = Http::withHeaders($this->headers())
            ->get($endpoint);

        Log::info('OFS getInvoiceByRequestId - Response', [
            'status' => $response->status(),
            'successful' => $response->successful(),
            'body' => $response->body(),
            'json' => $response->json(),
        ]);

        return $response;
    }

    public function printInvoice(array $payload)
    {
        // API endpoint: https://pos.ofs.ba/api/print
        $endpoint = $this->baseUrl.'/api/print';

        Log::info('OFS printInvoice - Request', [
            'url' => $endpoint,
            'headers' => $this->headers(),
            'payload' => $payload,
            'payload_json' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        ]);

        $response = Http::withHeaders($this->headers())
            ->post($endpoint, $payload);

        Log::info('OFS printInvoice - Response', [
            'status' => $response->status(),
            'successful' => $response->successful(),
            'body' => $response->body(),
            'json' => $response->json(),
        ]);

        return $response;
    }

    public function getSettings()
    {
        // API endpoint: https://pos.ofs.ba/api/settings
        $endpoint = $this->baseUrl.'/api/settings';

        Log::info('OFS getSettings - Request', [
            'url' => $endpoint,
            'headers' => $this->headers(),
        ]);

        $response = Http::withHeaders($this->headers())
            ->get($endpoint);

        Log::info('OFS getSettings - Response', [
            'status' => $response->status(),
            'successful' => $response->successful(),
            'body' => $response->body(),
            'json' => $response->json(),
        ]);

        return $response;
    }
}
