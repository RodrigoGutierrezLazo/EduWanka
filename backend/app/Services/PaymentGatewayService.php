<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentGatewayService
{
    protected string $accessToken;
    protected string $publicKey;

    public function __construct()
    {
        $this->accessToken = config('services.mercadopago.access_token', '');
        $this->publicKey = config('services.mercadopago.public_key', '');
    }

    /**
     * Create a Mercado Pago checkout preference.
     */
    public function createPreference(array $item, array $payer, string $externalReference, array $backUrls): ?array
    {
        if (empty($this->accessToken)) {
            Log::warning('Mercado Pago Access Token is not set.');
            return null;
        }

        $response = Http::withToken($this->accessToken)
            ->post('https://api.mercadopago.com/checkout/preferences', [
                'items' => [
                    [
                        'id' => $item['id'],
                        'title' => $item['title'],
                        'quantity' => 1,
                        'unit_price' => (float) $item['price'],
                        'currency_id' => 'PEN',
                    ]
                ],
                'payer' => [
                    'name' => $payer['name'],
                    'email' => $payer['email'],
                ],
                'back_urls' => [
                    'success' => $backUrls['success'],
                    'failure' => $backUrls['failure'],
                    'pending' => $backUrls['pending'],
                ],
                'auto_return' => 'approved',
                'external_reference' => $externalReference,
                // Opcional: configurar si se previene pago en efectivo (solo tarjeta/banca)
                'payment_methods' => [
                    'excluded_payment_types' => [
                        ['id' => 'ticket'] // Excluye pago en efectivo físico (pago efectivo, agentes) si se prefiere solo online instantáneo
                    ]
                ]
            ]);

        if ($response->failed()) {
            Log::error('Error creating Mercado Pago preference: ' . $response->body());
            return null;
        }

        return $response->json();
    }

    /**
     * Get payment details from Mercado Pago to verify.
     */
    public function getPaymentDetails(string $paymentId): ?array
    {
        if (empty($this->accessToken)) {
            Log::warning('Mercado Pago Access Token is not set.');
            return null;
        }

        $response = Http::withToken($this->accessToken)
            ->get("https://api.mercadopago.com/v1/payments/{$paymentId}");

        if ($response->failed()) {
            Log::error("Error fetching Mercado Pago payment {$paymentId}: " . $response->body());
            return null;
        }

        return $response->json();
    }
}
