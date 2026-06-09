package com.futad.photobooth.hardware.printer

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.graphics.Bitmap
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import java.io.ByteArrayOutputStream
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EscPosPrinter @Inject constructor(
    @ApplicationContext private val context: Context,
) : PrinterController {
    private var socket: BluetoothSocket? = null
    private var connectedDeviceAddress: String? = null

    fun setTargetDevice(address: String) {
        connectedDeviceAddress = address
    }

    override suspend fun connect(): Result<Unit> = runCatching {
        val adapter = BluetoothAdapter.getDefaultAdapter()
            ?: throw IllegalStateException("Bluetooth not available")
        val address = connectedDeviceAddress
            ?: throw IllegalStateException("No printer address configured")
        val device: BluetoothDevice = adapter.getRemoteDevice(address)
        val uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        socket = device.createRfcommSocketToServiceRecord(uuid).also { it.connect() }
    }

    override suspend fun printBitmap(bitmap: Bitmap, copies: Int): Result<PrintReceipt> = runCatching {
        val sock = socket ?: throw IllegalStateException("Printer not connected")
        val stream = sock.outputStream
        repeat(copies) {
            stream.write(INIT)
            stream.write(bitmapToEscPosRaster(bitmap))
            stream.write(LINE_FEED)
            stream.write(CUT)
        }
        stream.flush()
        PrintReceipt(success = true, message = "Printed $copies copy/copies")
    }.onFailure { Timber.e(it, "Print failed") }

    override suspend fun status(): PrinterStatus =
        PrinterStatus(connected = socket?.isConnected == true, paperOk = true)

    override suspend fun disconnect() {
        socket?.close()
        socket = null
    }

    private fun bitmapToEscPosRaster(bitmap: Bitmap): ByteArray {
        val width = bitmap.width
        val height = bitmap.height
        val bytesPerRow = (width + 7) / 8
        val out = ByteArrayOutputStream()
        out.write(byteArrayOf(0x1D, 0x76, 0x30, 0x00))
        out.write(bytesPerRow and 0xFF)
        out.write((bytesPerRow shr 8) and 0xFF)
        out.write(height and 0xFF)
        out.write((height shr 8) and 0xFF)
        for (y in 0 until height) {
            for (xByte in 0 until bytesPerRow) {
                var slice = 0
                for (bit in 0 until 8) {
                    val x = xByte * 8 + bit
                    if (x < width) {
                        val pixel = bitmap.getPixel(x, y)
                        val luminance = (0.299 * android.graphics.Color.red(pixel) +
                            0.587 * android.graphics.Color.green(pixel) +
                            0.114 * android.graphics.Color.blue(pixel))
                        if (luminance < 128) slice = slice or (1 shl (7 - bit))
                    }
                }
                out.write(slice)
            }
        }
        return out.toByteArray()
    }

    companion object {
        private val INIT = byteArrayOf(0x1B, 0x40)
        private val LINE_FEED = byteArrayOf(0x0A)
        private val CUT = byteArrayOf(0x1D, 0x56, 0x00)
    }
}

@Singleton
class DnpCompanionPrinterStub @Inject constructor(
    private val companionHostPrinter: CompanionHostPrinter,
) : PrinterController by companionHostPrinter
