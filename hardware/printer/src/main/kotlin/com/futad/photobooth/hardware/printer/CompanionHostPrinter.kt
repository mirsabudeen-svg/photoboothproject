package com.futad.photobooth.hardware.printer

import android.graphics.Bitmap
import com.futad.photobooth.core.data.store.DeviceCredentialsStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CompanionHostPrinter @Inject constructor(
    private val httpClient: OkHttpClient,
    private val credentialsStore: DeviceCredentialsStore,
) : PrinterController {

    override suspend fun connect(): Result<Unit> = withContext(Dispatchers.IO) {
        val ip = credentialsStore.getCompanionHostIp()
            ?: return@withContext Result.failure(Exception("Companion host not configured"))
        val request = Request.Builder().url("http://$ip:8181/health").get().build()
        return@withContext try {
            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Companion host unreachable: ${response.code}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun printBitmap(bitmap: Bitmap, copies: Int): Result<PrintReceipt> =
        withContext(Dispatchers.IO) {
            val ip = credentialsStore.getCompanionHostIp()
                ?: return@withContext Result.failure(Exception("Companion host not configured"))

            val stream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 92, stream)
            val imageBytes = stream.toByteArray()

            return@withContext printWithRetry(ip, imageBytes, attempts = 2)
        }

    private suspend fun printWithRetry(ip: String, imageBytes: ByteArray, attempts: Int): Result<PrintReceipt> {
        repeat(attempts) { attempt ->
            val builder = Request.Builder()
                .url("http://$ip:8181/print")
                .post(imageBytes.toRequestBody("image/jpeg".toMediaType()))
            credentialsStore.getCompanionPrintToken()?.let { token ->
                builder.header("X-Print-Token", token)
            }
            try {
                val response = httpClient.newCall(builder.build()).execute()
                val body = response.body?.string() ?: "{}"
                val json = JSONObject(body)
                val code = json.optString("code", "")
                when {
                    response.isSuccessful -> {
                        val jobId = json.optString("jobId", "unknown")
                        return Result.success(PrintReceipt(success = true, message = "Queued job $jobId"))
                    }
                    code == "PRINTER_BUSY" && attempt < attempts - 1 -> delay(3000)
                    code == "PRINTER_OFFLINE" -> return Result.failure(Exception("Printer offline"))
                    else -> return Result.failure(Exception(json.optString("message", "Print server error: ${response.code}")))
                }
            } catch (e: Exception) {
                if (attempt == attempts - 1) return Result.failure(e)
            }
        }
        return Result.failure(Exception("Print failed after retries"))
    }

    override suspend fun status(): PrinterStatus = withContext(Dispatchers.IO) {
        val ip = credentialsStore.getCompanionHostIp()
            ?: return@withContext PrinterStatus(connected = false, paperOk = false, error = "Not configured")
        return@withContext try {
            val response = httpClient.newCall(
                Request.Builder().url("http://$ip:8181/health").get().build(),
            ).execute()
            val body = JSONObject(response.body?.string() ?: "{}")
            val ready = body.optString("status") == "ready"
            PrinterStatus(connected = ready, paperOk = ready, error = if (ready) null else "Printer not ready")
        } catch (e: Exception) {
            PrinterStatus(connected = false, paperOk = false, error = e.message)
        }
    }

    override suspend fun disconnect() = Unit
}
