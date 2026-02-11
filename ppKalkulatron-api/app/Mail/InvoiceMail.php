<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string $emailSubject,
        public string $body,
        public ?string $verificationUrl = null,
        public ?string $pdfPath = null,
        /** @var int[] Fiscal record IDs whose images to attach */
        public array $attachFiscalRecordIds = [],
        public ?string $fromAddress = null,
        public ?string $fromName = null,
    ) {
    }

    public function envelope(): Envelope
    {
        $envelope = new Envelope(subject: $this->emailSubject);

        if ($this->fromAddress) {
            $envelope->from($this->fromAddress, $this->fromName ?? '');
        }

        return $envelope;
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
        );
    }

    public function attachments(): array
    {
        $atts = [];

        if ($this->pdfPath && file_exists($this->pdfPath)) {
            $atts[] = Attachment::fromPath($this->pdfPath)
                ->as('faktura-' . \Str::slug($this->invoice->invoice_number) . '.pdf')
                ->withMime('application/pdf');
        }

        foreach ($this->attachFiscalRecordIds as $recordId) {
            $record = $this->invoice->fiscalRecords->firstWhere('id', $recordId);
            if ($record?->fiscal_receipt_image_path) {
                $fullPath = Storage::disk('fiscal_receipts')->path($record->fiscal_receipt_image_path);
                if (file_exists($fullPath)) {
                    $suffix = $record->type->value === 'original' ? '' : '-' . $record->type->value;
                    $atts[] = Attachment::fromPath($fullPath)
                        ->as('fiskalni-racun-' . $this->invoice->invoice_number . $suffix . '.png')
                        ->withMime('image/png');
                }
            }
        }

        return $atts;
    }
}
