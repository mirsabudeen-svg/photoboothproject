package com.futad.photobooth.feature.printing

import com.futad.photobooth.core.domain.model.PrintJob
import com.futad.photobooth.core.domain.model.PrintStatus
import com.futad.photobooth.core.domain.repository.PrintRepository
import timber.log.Timber
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrintQueueManager @Inject constructor(
    private val printRepository: PrintRepository,
    private val printScheduler: PrintScheduler,
) {
    suspend fun enqueue(
        captureId: String,
        eventId: String,
        bitmapPath: String,
        printSize: String = "4x6",
    ) {
        val job = PrintJob(
            jobId = UUID.randomUUID().toString(),
            captureId = captureId,
            eventId = eventId,
            printerType = "ESCPOS",
            layoutTemplate = bitmapPath,
            printSize = printSize,
            status = PrintStatus.QUEUED,
            queuedAt = System.currentTimeMillis(),
        )
        printRepository.enqueuePrint(job)
        printScheduler.schedulePrintDrain()
        Timber.i("Enqueued print job ${job.jobId}")
    }
}
