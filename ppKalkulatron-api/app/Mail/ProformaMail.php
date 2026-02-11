<?php

namespace App\Mail;

use App\Models\Proforma;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class ProformaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Proforma $proforma,
        public string $emailSubject,
        public string $body,
        public ?string $pdfPath = null,
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
            view: 'emails.proforma',
        );
    }

    public function attachments(): array
    {
        $atts = [];

        if ($this->pdfPath && file_exists($this->pdfPath)) {
            $atts[] = Attachment::fromPath($this->pdfPath)
                ->as('predracun-' . \Str::slug($this->proforma->proforma_number) . '.pdf')
                ->withMime('application/pdf');
        }

        return $atts;
    }
}
