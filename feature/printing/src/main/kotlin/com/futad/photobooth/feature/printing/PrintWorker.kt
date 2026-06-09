package com.futad.photobooth.feature.printing

import android.content.Context
import android.graphics.BitmapFactory
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.futad.photobooth.core.domain.model.PrintStatus
import com.futad.photobooth.core.domain.repository.PrintRepository
import com.futad.photobooth.hardware.printer.EscPosPrinter
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import timber.log.Timber

@HiltWorker
class PrintWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val printRepository: PrintRepository,
    private val escPosPrinter: EscPosPrinter,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val jobs = printRepository.getQueuedPrintJobs()
        var hadFailure = false
        for (job in jobs) {
            val bitmapPath = job.layoutTemplate
            if (bitmapPath.isBlank()) {
                Timber.w("Print job ${job.jobId} missing bitmap path")
                continue
            }
            val printing = job.copy(status = PrintStatus.PRINTING)
            printRepository.updatePrintJob(printing)
            val bitmap = BitmapFactory.decodeFile(bitmapPath)
            if (bitmap == null) {
                printRepository.updatePrintJob(
                    printing.copy(
                        status = PrintStatus.FAILED,
                        retryCount = job.retryCount + 1,
                        errorMessage = "Bitmap not found",
                    ),
                )
                hadFailure = true
                continue
            }
            val connectResult = escPosPrinter.connect()
            if (connectResult.isFailure) {
                bitmap.recycle()
                printRepository.updatePrintJob(
                    printing.copy(
                        status = PrintStatus.FAILED,
                        retryCount = job.retryCount + 1,
                        errorMessage = connectResult.exceptionOrNull()?.message,
                    ),
                )
                hadFailure = true
                continue
            }
            val result = escPosPrinter.printBitmap(bitmap, job.copyCount)
            bitmap.recycle()
            escPosPrinter.disconnect()
            if (result.isSuccess) {
                printRepository.updatePrintJob(printing.copy(status = PrintStatus.PRINTED))
            } else {
                printRepository.updatePrintJob(
                    printing.copy(
                        status = PrintStatus.FAILED,
                        retryCount = job.retryCount + 1,
                        errorMessage = result.exceptionOrNull()?.message,
                    ),
                )
                hadFailure = true
            }
        }
        return if (hadFailure) Result.retry() else Result.success()
    }

    companion object {
        const val WORK_NAME = "print_queue_worker"
    }
}
