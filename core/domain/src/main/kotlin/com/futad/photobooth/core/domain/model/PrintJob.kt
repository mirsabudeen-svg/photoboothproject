package com.futad.photobooth.core.domain.model

data class PrintJob(
    val jobId: String,
    val captureId: String,
    val eventId: String,
    val printerType: String,
    val layoutTemplate: String,
    val printSize: String,
    val copyCount: Int = 1,
    val status: PrintStatus = PrintStatus.QUEUED,
    val queuedAt: Long,
    val retryCount: Int = 0,
    val errorMessage: String? = null,
)
