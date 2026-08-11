<?php

namespace App\Support\Procurement;

use RuntimeException;
use Throwable;

final class AttachmentStorageException extends RuntimeException
{
    public static function busy(): self
    {
        return new self('Attachment storage is busy. Please try again.');
    }

    public static function duplicate(Throwable $previous): self
    {
        return new self('This PDF has already been uploaded.', previous: $previous);
    }

    public static function writeFailed(): self
    {
        return new self('The PDF could not be stored. Please try again.');
    }

    public static function dispatchFailed(): self
    {
        return new self('The PDF extraction could not be queued. Please try again.');
    }
}
