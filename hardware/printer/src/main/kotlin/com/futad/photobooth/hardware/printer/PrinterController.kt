package com.futad.photobooth.hardware.printer

import android.graphics.Bitmap

data class PrintReceipt(
    val success: Boolean,
    val message: String,
)

data class PrinterStatus(
    val connected: Boolean,
    val paperOk: Boolean,
    val error: String? = null,
)

interface PrinterController {
    suspend fun connect(): Result<Unit>
    suspend fun printBitmap(bitmap: Bitmap, copies: Int = 1): Result<PrintReceipt>
    suspend fun status(): PrinterStatus
    suspend fun disconnect()
}

enum class PrinterType {
    ESCPOS,
    DNP_COMPANION,
}
