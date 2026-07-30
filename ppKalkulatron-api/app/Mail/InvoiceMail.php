<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Services\FiscalReceiptStore;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

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
        $invoiceNumber = $this->invoice->invoice_number;

        if ($this->pdfPath && file_exists($this->pdfPath)) {
            $atts[] = Attachment::fromPath($this->pdfPath)
                ->as('racun_' . $invoiceNumber . '.pdf')
                ->withMime('application/pdf');
        }

        $receipts = app(FiscalReceiptStore::class);

        foreach ($this->attachFiscalRecordIds as $recordId) {
            $record = $this->invoice->fiscalRecords->firstWhere('id', $recordId);

            if (! $record) {
                continue;
            }

            $binary = $receipts->binary($record);

            if ($binary === null) {
                Log::warning('Fiscal receipt not attached to email, content missing', [
                    'invoice_id' => $this->invoice->id,
                    'fiscal_record_id' => $record->id,
                    'path' => $record->fiscal_receipt_image_path,
                    'disk' => $receipts->diskName(),
                ]);

                continue;
            }

            $suffix = match ($record->type->value) {
                'copy' => '-kopija',
                'refund' => '-refundacija',
                default => '',
            };

            // OFS returns PNG, PDF or HTML depending on ofs_receipt_image_format — name the
            // attachment after what was actually stored, not always .png.
            $atts[] = Attachment::fromData(fn () => $binary, 'fiskalni-racun_' . $invoiceNumber . $suffix . '.' . $receipts->extension($record))
                ->withMime($receipts->mime($record));
        }

        return $atts;
    }
}
