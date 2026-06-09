package com.futad.photobooth.feature.sharing

import android.content.Context
import android.net.wifi.WifiManager
import com.futad.photobooth.core.data.LocalMediaTokenizer
import dagger.hilt.android.qualifiers.ApplicationContext
import java.net.Inet4Address
import java.net.NetworkInterface
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class QRCodeGenerator @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    fun generate(content: String, size: Int = 512): android.graphics.Bitmap {
        val matrix = com.google.zxing.qrcode.QRCodeWriter().encode(
            content,
            com.google.zxing.BarcodeFormat.QR_CODE,
            size,
            size,
        )
        val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.RGB_565)
        for (x in 0 until size) {
            for (y in 0 until size) {
                bitmap.setPixel(x, y, if (matrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
            }
        }
        return bitmap
    }

    fun localUrl(port: Int, captureId: String): String {
        val host = resolveLanHost()
        val signingKey = LocalMediaTokenizer.getOrCreateSigningKey(context)
        return LocalMediaTokenizer.buildUrl(host, port, captureId, signingKey)
    }

    private fun resolveLanHost(): String {
        try {
            NetworkInterface.getNetworkInterfaces()?.toList()?.forEach { nif ->
                nif.inetAddresses.toList().forEach { addr ->
                    if (!addr.isLoopbackAddress && addr is Inet4Address) {
                        return addr.hostAddress ?: "127.0.0.1"
                    }
                }
            }
        } catch (_: Exception) {
            // fall through
        }
        @Suppress("DEPRECATION")
        val wm = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
        @Suppress("DEPRECATION")
        val ip = wm?.connectionInfo?.ipAddress ?: return "127.0.0.1"
        return String.format(
            "%d.%d.%d.%d",
            ip and 0xff,
            ip shr 8 and 0xff,
            ip shr 16 and 0xff,
            ip shr 24 and 0xff,
        )
    }
}
